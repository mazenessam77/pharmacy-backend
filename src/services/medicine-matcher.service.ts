import { Medicine } from '../models/Medicine';

interface MatchResult {
  name: string;
  confidence: number;
  matchedMedicineId?: string;
}

export const matchMedicines = async (extractedNames: string[]): Promise<MatchResult[]> => {
  const results: MatchResult[] = [];

  for (const rawName of extractedNames) {
    const cleaned = rawName.trim();
    if (!cleaned || cleaned.length < 2) continue;

    // Try exact match (case-insensitive)
    let medicine = await Medicine.findOne({
      name: { $regex: new RegExp(`^${escapeRegex(cleaned)}$`, 'i') },
      isActive: true,
    });

    if (medicine) {
      results.push({ name: medicine.name, confidence: 1.0, matchedMedicineId: medicine._id.toString() });
      continue;
    }

    // Try partial match
    medicine = await Medicine.findOne({
      name: { $regex: new RegExp(escapeRegex(cleaned), 'i') },
      isActive: true,
    });

    if (medicine) {
      results.push({ name: medicine.name, confidence: 0.8, matchedMedicineId: medicine._id.toString() });
      continue;
    }

    // Try text search
    const textResults = await Medicine.find(
      { $text: { $search: cleaned }, isActive: true },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(1);

    if (textResults.length > 0) {
      const score = Math.min((textResults[0] as any)._doc.score / 5, 1);
      results.push({
        name: textResults[0].name,
        confidence: Math.round(score * 100) / 100,
        matchedMedicineId: textResults[0]._id.toString(),
      });
      continue;
    }

    // Try fuzzy match with Levenshtein distance
    const allMeds = await Medicine.find({ isActive: true }).select('name').lean();
    let bestMatch: { name: string; id: string; distance: number } | null = null;

    for (const med of allMeds) {
      const distance = levenshteinDistance(cleaned.toLowerCase(), med.name.toLowerCase());
      const maxLen = Math.max(cleaned.length, med.name.length);
      const similarity = 1 - distance / maxLen;

      if (similarity > 0.5 && (!bestMatch || distance < bestMatch.distance)) {
        bestMatch = { name: med.name, id: med._id.toString(), distance };
      }
    }

    if (bestMatch) {
      const maxLen = Math.max(cleaned.length, bestMatch.name.length);
      const confidence = Math.round((1 - bestMatch.distance / maxLen) * 100) / 100;
      results.push({ name: bestMatch.name, confidence, matchedMedicineId: bestMatch.id });
    } else {
      results.push({ name: cleaned, confidence: 0.2 });
    }
  }

  return results;
};

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
