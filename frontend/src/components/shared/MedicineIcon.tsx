/**
 * MedicineIcon — smart icon that picks a realistic capsule / tablet /
 * syrup / injection shape based on the medicine name.
 */

interface MedicineIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

// ── Keyword → type + colors ───────────────────────────────────────────────────
const RULES: {
  keywords: string[];
  type: 'capsule' | 'tablet' | 'syrup' | 'injection' | 'drops' | 'cream';
  cap: string;   // capsule half 1
  body: string;  // capsule half 2 / tablet fill
  bg: string;    // card background
  border: string;
}[] = [
  // ── Capsules ──────────────────────────────────────────────────────────────
  {
    keywords: ['amoxicillin', 'antibiotic', 'augmentin', 'ampicillin'],
    type: 'capsule', cap: '#EF4444', body: '#FFF', bg: '#FEF2F2', border: '#FECACA',
  },
  {
    keywords: ['omeprazole', 'pantoprazole', 'lansoprazole', 'nexium', 'rabeprazole'],
    type: 'capsule', cap: '#8B5CF6', body: '#DDD6FE', bg: '#F5F3FF', border: '#DDD6FE',
  },
  {
    keywords: ['doxycycline', 'tetracycline', 'levofloxacin', 'ciprofloxacin'],
    type: 'capsule', cap: '#F59E0B', body: '#FFFBEB', bg: '#FFFBEB', border: '#FDE68A',
  },
  {
    keywords: ['gabapentin', 'pregabalin', 'lyrica'],
    type: 'capsule', cap: '#06B6D4', body: '#ECFEFF', bg: '#ECFEFF', border: '#A5F3FC',
  },
  // ── Tablets ───────────────────────────────────────────────────────────────
  {
    keywords: ['paracetamol', 'acetaminophen', 'panadol', 'tylenol', 'calpol'],
    type: 'tablet', cap: '#3B82F6', body: '#EFF6FF', bg: '#EFF6FF', border: '#BFDBFE',
  },
  {
    keywords: ['ibuprofen', 'brufen', 'advil', 'nurofen'],
    type: 'tablet', cap: '#F97316', body: '#FFF7ED', bg: '#FFF7ED', border: '#FED7AA',
  },
  {
    keywords: ['aspirin', 'acetylsalicylic'],
    type: 'tablet', cap: '#E5E7EB', body: '#F9FAFB', bg: '#F9FAFB', border: '#E5E7EB',
  },
  {
    keywords: ['metformin', 'glucophage', 'diabex', 'glucovance'],
    type: 'tablet', cap: '#10B981', body: '#ECFDF5', bg: '#ECFDF5', border: '#A7F3D0',
  },
  {
    keywords: ['cetirizine', 'loratadine', 'antihistamine', 'zyrtec', 'claritin'],
    type: 'tablet', cap: '#EC4899', body: '#FDF2F8', bg: '#FDF2F8', border: '#FBCFE8',
  },
  {
    keywords: ['atorvastatin', 'simvastatin', 'lipitor', 'rosuvastatin'],
    type: 'tablet', cap: '#6366F1', body: '#EEF2FF', bg: '#EEF2FF', border: '#C7D2FE',
  },
  {
    keywords: ['amlodipine', 'lisinopril', 'metoprolol', 'bisoprolol', 'blood pressure'],
    type: 'tablet', cap: '#14B8A6', body: '#F0FDFA', bg: '#F0FDFA', border: '#99F6E4',
  },
  // ── Syrups / Liquids ──────────────────────────────────────────────────────
  {
    keywords: ['syrup', 'suspension', 'solution', 'liquid', 'elixir', 'linctus'],
    type: 'syrup', cap: '#D97706', body: '#FEF3C7', bg: '#FFFBEB', border: '#FDE68A',
  },
  // ── Injections ────────────────────────────────────────────────────────────
  {
    keywords: ['injection', 'insulin', 'injectable', 'vaccine', 'iv ', 'im '],
    type: 'injection', cap: '#0EA5E9', body: '#F0F9FF', bg: '#F0F9FF', border: '#BAE6FD',
  },
  // ── Eye / Ear / Nasal Drops ───────────────────────────────────────────────
  {
    keywords: ['drops', 'eye drop', 'nasal', 'ear drop', 'ophthalmic'],
    type: 'drops', cap: '#06B6D4', body: '#ECFEFF', bg: '#ECFEFF', border: '#A5F3FC',
  },
  // ── Cream / Gel / Ointment ────────────────────────────────────────────────
  {
    keywords: ['cream', 'ointment', 'gel', 'lotion', 'topical', 'emollient'],
    type: 'cream', cap: '#F43F5E', body: '#FFF1F2', bg: '#FFF1F2', border: '#FECDD3',
  },
];

const DEFAULT = {
  type: 'tablet' as const,
  cap: '#6366F1', body: '#EEF2FF', bg: '#EEF2FF', border: '#C7D2FE',
};

function matchRule(name: string) {
  const lower = name.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule;
  }
  return DEFAULT;
}

// ── SVG shapes ────────────────────────────────────────────────────────────────

function CapsuleSVG({ cap, body, size }: { cap: string; body: string; size: number }) {
  const r = size / 2;
  return (
    <svg width={size * 1.9} height={size} viewBox={`0 0 ${size * 1.9} ${size}`} xmlns="http://www.w3.org/2000/svg">
      {/* left half */}
      <clipPath id={`cl-${cap}`}>
        <rect x="0" y="0" width={size * 0.95} height={size} />
      </clipPath>
      <ellipse cx={size * 0.95} cy={r} rx={size * 0.95} ry={r} fill={cap} clipPath={`url(#cl-${cap})`} />
      {/* right half */}
      <clipPath id={`cr-${body}`}>
        <rect x={size * 0.95} y="0" width={size * 0.95} height={size} />
      </clipPath>
      <ellipse cx={size * 0.95} cy={r} rx={size * 0.95} ry={r} fill={body} clipPath={`url(#cr-${body})`} />
      {/* outline */}
      <ellipse cx={size * 0.95} cy={r} rx={size * 0.94} ry={r - 0.8} fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
      {/* seam */}
      <line x1={size * 0.95} y1="1" x2={size * 0.95} y2={size - 1} stroke="rgba(0,0,0,0.08)" strokeWidth="1" />
    </svg>
  );
}

function TabletSVG({ cap, body, size }: { cap: string; body: string; size: number }) {
  const r = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      <circle cx={r} cy={r} r={r - 1} fill={body} stroke={cap} strokeWidth="2" />
      {/* score line */}
      <line x1={r * 0.4} y1={r} x2={r * 1.6} y2={r} stroke={cap} strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
      {/* shine */}
      <ellipse cx={r * 0.72} cy={r * 0.62} rx={r * 0.22} ry={r * 0.12} fill="white" opacity="0.4" transform={`rotate(-35 ${r * 0.72} ${r * 0.62})`} />
    </svg>
  );
}

function SyrupSVG({ cap, body, size }: { cap: string; body: string; size: number }) {
  const w = size * 0.65;
  const h = size;
  const x = (size - w) / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} xmlns="http://www.w3.org/2000/svg">
      {/* bottle neck */}
      <rect x={size * 0.38} y={size * 0.04} width={size * 0.24} height={size * 0.16} rx="2" fill={cap} />
      {/* cap */}
      <rect x={size * 0.34} y={size * 0.01} width={size * 0.32} height={size * 0.08} rx="2" fill={cap} />
      {/* body */}
      <rect x={x} y={size * 0.18} width={w} height={h * 0.76} rx={size * 0.1} fill={body} stroke={cap} strokeWidth="1.5" />
      {/* liquid fill */}
      <rect x={x + 2} y={size * 0.44} width={w - 4} height={h * 0.48} rx={size * 0.08} fill={cap} opacity="0.25" />
      {/* label */}
      <rect x={x + 4} y={size * 0.28} width={w - 8} height={size * 0.12} rx="2" fill="white" opacity="0.5" />
    </svg>
  );
}

function InjectionSVG({ cap, body, size }: { cap: string; body: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {/* barrel */}
      <rect x="7" y="8" width="10" height="10" rx="2" fill={body} stroke={cap} strokeWidth="1.5" />
      {/* plunger */}
      <rect x="10.5" y="5" width="3" height="5" rx="1" fill={cap} opacity="0.7" />
      {/* needle */}
      <line x1="12" y1="18" x2="12" y2="21" stroke={cap} strokeWidth="1.5" strokeLinecap="round" />
      {/* graduation marks */}
      <line x1="7" y1="11" x2="9" y2="11" stroke={cap} strokeWidth="1" opacity="0.5" />
      <line x1="7" y1="14" x2="9" y2="14" stroke={cap} strokeWidth="1" opacity="0.5" />
    </svg>
  );
}

function DropsSVG({ cap, body, size }: { cap: string; body: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {/* bottle */}
      <rect x="8" y="6" width="8" height="13" rx="4" fill={body} stroke={cap} strokeWidth="1.5" />
      {/* cap */}
      <rect x="9.5" y="3" width="5" height="5" rx="1.5" fill={cap} />
      {/* drop */}
      <path d="M12 15 C12 15 10 13 10 11.5 C10 10.1 11 9 12 9 C13 9 14 10.1 14 11.5 C14 13 12 15 12 15Z" fill={cap} opacity="0.4" />
    </svg>
  );
}

function CreamSVG({ cap, body, size }: { cap: string; body: string; size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      {/* tube body */}
      <rect x="4" y="9" width="13" height="8" rx="4" fill={body} stroke={cap} strokeWidth="1.5" />
      {/* tube neck */}
      <rect x="16" y="11" width="4" height="4" rx="1" fill={body} stroke={cap} strokeWidth="1.5" />
      {/* cap */}
      <rect x="19.5" y="10" width="3" height="6" rx="1.5" fill={cap} />
      {/* crimped end */}
      <rect x="3" y="10" width="3" height="6" rx="1" fill={cap} opacity="0.6" />
      {/* label stripe */}
      <rect x="7" y="11" width="7" height="2" rx="1" fill="white" opacity="0.5" />
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MedicineIcon({ name, size = 'md' }: MedicineIconProps) {
  const rule = matchRule(name);
  const iconSize = size === 'sm' ? 18 : size === 'lg' ? 32 : 24;
  const containerSize = size === 'sm' ? 32 : size === 'lg' ? 52 : 42;

  const shape = () => {
    switch (rule.type) {
      case 'capsule':   return <CapsuleSVG    cap={rule.cap} body={rule.body} size={iconSize * 0.75} />;
      case 'syrup':     return <SyrupSVG      cap={rule.cap} body={rule.body} size={iconSize} />;
      case 'injection': return <InjectionSVG  cap={rule.cap} body={rule.body} size={iconSize} />;
      case 'drops':     return <DropsSVG      cap={rule.cap} body={rule.body} size={iconSize} />;
      case 'cream':     return <CreamSVG      cap={rule.cap} body={rule.body} size={iconSize} />;
      default:          return <TabletSVG     cap={rule.cap} body={rule.body} size={iconSize} />;
    }
  };

  return (
    <div
      className="rounded-2xl flex items-center justify-center shrink-0 select-none"
      style={{
        width: containerSize,
        height: containerSize,
        backgroundColor: rule.bg,
        border: `1.5px solid ${rule.border}`,
      }}
    >
      {shape()}
    </div>
  );
}

// Export the bg/border colors so parent can use them for card styling
export function getMedicineColors(name: string) {
  const rule = matchRule(name);
  return { bg: rule.bg, border: rule.border, accent: rule.cap };
}
