import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

export interface AIAlternative {
  name: string;
  genericName?: string;
  reason: string;
  avoidedSideEffect: string;
  requiresPrescription: boolean;
}

export interface AIRecommendationResult {
  alternatives: AIAlternative[];
  summary: string;
  disclaimer: string;
  generatedAt: Date;
  model: string;
}

export interface RecommendationInput {
  medicineName: string;
  sideEffects: string[];
  severity: 'mild' | 'moderate' | 'severe';
  condition?: string;
  notes?: string;
  knownMedicines?: string[];
}

const SYSTEM_PROMPT = `You are a pharmaceutical assistant helping suggest alternative medicines for patients who are experiencing side effects.

Your job:
1. Analyze the medicine the patient is currently taking
2. Analyze the side effects they reported
3. Suggest 2-4 alternative medicines that treat the same condition but are LESS LIKELY to cause those specific side effects
4. For each alternative, explain in plain language why it's a better fit

Important rules:
- You are NOT a doctor. Every suggestion must be reviewed by a licensed pharmacist or physician before the patient acts on it.
- Prefer well-known, commonly available alternatives.
- If the patient gives you a list of known medicines available in the pharmacy, prefer alternatives from that list.
- Be specific about which side effect each alternative avoids.
- Mark alternatives that require a prescription.
- If you cannot make a safe recommendation, return an empty alternatives array and explain in the summary.

Output STRICT JSON matching this schema (no markdown, no commentary):
{
  "alternatives": [
    {
      "name": "string (brand or common name)",
      "genericName": "string (optional)",
      "reason": "string (1-2 sentences explaining why this is a good alternative)",
      "avoidedSideEffect": "string (the specific reported side effect this alternative is less likely to cause)",
      "requiresPrescription": boolean
    }
  ],
  "summary": "string (1-2 sentence overview for the patient)",
  "disclaimer": "string (a short safety disclaimer)"
}`;

// ── Gemini client ──────────────────────────────────────────────
let geminiModel: any = null;

function getGeminiModel() {
  if (!env.GEMINI_API_KEY) {
    return null;
  }
  if (!geminiModel) {
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    geminiModel = genAI.getGenerativeModel({ model: env.GEMINI_MODEL });
  }
  return geminiModel;
}

// ── Anthropic client (fallback) ────────────────────────────────
let anthropicClient: any = null;

async function getAnthropicClient() {
  if (!env.ANTHROPIC_API_KEY) {
    return null;
  }
  if (!anthropicClient) {
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    anthropicClient = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

function buildUserPrompt(input: RecommendationInput): string {
  const lines: string[] = [];
  lines.push(`Current medicine: ${input.medicineName}`);
  if (input.condition) lines.push(`Treating condition: ${input.condition}`);
  lines.push(`Reported side effects: ${input.sideEffects.join(', ')}`);
  lines.push(`Severity: ${input.severity}`);
  if (input.notes) lines.push(`Patient notes: ${input.notes}`);
  if (input.knownMedicines && input.knownMedicines.length > 0) {
    lines.push(`\nMedicines available in our pharmacy database (prefer these when possible):`);
    lines.push(input.knownMedicines.slice(0, 100).join(', '));
  }
  lines.push(`\nReturn a JSON object with alternative medicine suggestions per the schema in your instructions.`);
  return lines.join('\n');
}

function extractJson(text: string): any {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  const candidate = fenced ? fenced[1] : trimmed;
  return JSON.parse(candidate);
}

// ── Generate via Gemini (primary — free) ───────────────────────
async function generateWithGemini(userPrompt: string): Promise<{ text: string; model: string }> {
  const model = getGeminiModel();
  if (!model) throw new Error('GEMINI_API_KEY is not configured');

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: `${SYSTEM_PROMPT}\n\n${userPrompt}` }] }],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.3,
    },
  });

  const response = result.response;
  const text = response.text();
  if (!text) throw new Error('Gemini response had no text content');

  return { text, model: env.GEMINI_MODEL };
}

// ── Generate via Anthropic (fallback — paid) ───────────────────
async function generateWithAnthropic(userPrompt: string): Promise<{ text: string; model: string }> {
  const client = await getAnthropicClient();
  if (!client) throw new Error('ANTHROPIC_API_KEY is not configured');

  const message = await client.messages.create({
    model: env.ANTHROPIC_MODEL,
    max_tokens: 1500,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = message.content.find((b: any) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI response had no text content');
  }

  return { text: textBlock.text, model: env.ANTHROPIC_MODEL };
}

// ── Main function: tries Gemini first, then Anthropic ──────────
export const generateAlternativeRecommendation = async (
  input: RecommendationInput
): Promise<AIRecommendationResult> => {
  const userPrompt = buildUserPrompt(input);

  let aiResponse: { text: string; model: string };

  // Try Gemini first (free), fall back to Anthropic
  if (env.GEMINI_API_KEY) {
    try {
      aiResponse = await generateWithGemini(userPrompt);
    } catch (geminiErr) {
      console.warn('Gemini failed, trying Anthropic fallback:', (geminiErr as Error).message);
      aiResponse = await generateWithAnthropic(userPrompt);
    }
  } else if (env.ANTHROPIC_API_KEY) {
    aiResponse = await generateWithAnthropic(userPrompt);
  } else {
    throw new Error('No AI provider configured. Set GEMINI_API_KEY or ANTHROPIC_API_KEY.');
  }

  let parsed: {
    alternatives?: AIAlternative[];
    summary?: string;
    disclaimer?: string;
  };
  try {
    parsed = extractJson(aiResponse.text);
  } catch (err) {
    throw new Error(`Failed to parse AI response as JSON: ${(err as Error).message}`);
  }

  return {
    alternatives: Array.isArray(parsed.alternatives) ? parsed.alternatives : [],
    summary: parsed.summary || '',
    disclaimer:
      parsed.disclaimer ||
      'These suggestions are AI-generated and must be reviewed by a licensed pharmacist or physician before use.',
    generatedAt: new Date(),
    model: aiResponse.model,
  };
};
