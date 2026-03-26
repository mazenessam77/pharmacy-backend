'use client';

/**
 * MedicineIcon — realistic medicine shape based on the medicine name.
 * Uses CSS div shapes (no SVG clip paths) to avoid React hydration issues.
 */

interface MedicineIconProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

type MedicineType = 'capsule' | 'tablet' | 'syrup' | 'injection' | 'drops' | 'cream';

interface Rule {
  keywords: string[];
  type: MedicineType;
  cap: string;
  body: string;
  bg: string;
  border: string;
}

const RULES: Rule[] = [
  // ── Capsules ──────────────────────────────────────────────────────
  { keywords: ['amoxicillin','augmentin','ampicillin','antibiotic'],
    type:'capsule', cap:'#EF4444', body:'#FFF5F5', bg:'#FEF2F2', border:'#FECACA' },
  { keywords: ['omeprazole','pantoprazole','lansoprazole','nexium','rabeprazole'],
    type:'capsule', cap:'#8B5CF6', body:'#F5F3FF', bg:'#F5F3FF', border:'#DDD6FE' },
  { keywords: ['doxycycline','tetracycline','levofloxacin','ciprofloxacin'],
    type:'capsule', cap:'#F59E0B', body:'#FFFBEB', bg:'#FFFBEB', border:'#FDE68A' },
  { keywords: ['gabapentin','pregabalin','lyrica'],
    type:'capsule', cap:'#06B6D4', body:'#ECFEFF', bg:'#ECFEFF', border:'#A5F3FC' },
  { keywords: ['capsule'],
    type:'capsule', cap:'#6366F1', body:'#EEF2FF', bg:'#EEF2FF', border:'#C7D2FE' },

  // ── Tablets ───────────────────────────────────────────────────────
  { keywords: ['paracetamol','acetaminophen','panadol','tylenol','calpol'],
    type:'tablet', cap:'#3B82F6', body:'#EFF6FF', bg:'#EFF6FF', border:'#BFDBFE' },
  { keywords: ['ibuprofen','brufen','advil','nurofen'],
    type:'tablet', cap:'#F97316', body:'#FFF7ED', bg:'#FFF7ED', border:'#FED7AA' },
  { keywords: ['aspirin','acetylsalicylic'],
    type:'tablet', cap:'#9CA3AF', body:'#F9FAFB', bg:'#F9FAFB', border:'#E5E7EB' },
  { keywords: ['metformin','glucophage','diabex'],
    type:'tablet', cap:'#10B981', body:'#ECFDF5', bg:'#ECFDF5', border:'#A7F3D0' },
  { keywords: ['cetirizine','loratadine','zyrtec','claritin'],
    type:'tablet', cap:'#EC4899', body:'#FDF2F8', bg:'#FDF2F8', border:'#FBCFE8' },
  { keywords: ['atorvastatin','simvastatin','lipitor','rosuvastatin'],
    type:'tablet', cap:'#6366F1', body:'#EEF2FF', bg:'#EEF2FF', border:'#C7D2FE' },
  { keywords: ['amlodipine','lisinopril','metoprolol','bisoprolol'],
    type:'tablet', cap:'#14B8A6', body:'#F0FDFA', bg:'#F0FDFA', border:'#99F6E4' },

  // ── Syrups ────────────────────────────────────────────────────────
  { keywords: ['syrup','suspension','solution','liquid','elixir'],
    type:'syrup', cap:'#D97706', body:'#FEF3C7', bg:'#FFFBEB', border:'#FDE68A' },

  // ── Injections ────────────────────────────────────────────────────
  { keywords: ['injection','insulin','injectable','vaccine'],
    type:'injection', cap:'#0EA5E9', body:'#F0F9FF', bg:'#F0F9FF', border:'#BAE6FD' },

  // ── Drops ─────────────────────────────────────────────────────────
  { keywords: ['drop','eye drop','nasal','ear drop','ophthalmic'],
    type:'drops', cap:'#06B6D4', body:'#ECFEFF', bg:'#ECFEFF', border:'#A5F3FC' },

  // ── Cream / Gel ───────────────────────────────────────────────────
  { keywords: ['cream','ointment','gel','lotion','topical'],
    type:'cream', cap:'#F43F5E', body:'#FFF1F2', bg:'#FFF1F2', border:'#FECDD3' },
];

const DEFAULT: Rule = {
  keywords: [], type: 'tablet',
  cap:'#6366F1', body:'#EEF2FF', bg:'#EEF2FF', border:'#C7D2FE',
};

function matchRule(name: string): Rule {
  const lower = name.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => lower.includes(k))) return rule;
  }
  return DEFAULT;
}

// ── Shape components (CSS only, no SVG clip paths) ────────────────────────────

function CapsuleShape({ cap, body, width, height }: { cap:string; body:string; width:number; height:number }) {
  const r = height / 2;
  return (
    <div style={{ width, height, borderRadius: r, overflow:'hidden', display:'flex', boxShadow:`inset 0 1px 2px rgba(0,0,0,0.12)` }}>
      <div style={{ flex:1, background: cap }} />
      <div style={{ flex:1, background: body }} />
    </div>
  );
}

function TabletShape({ cap, body, size }: { cap:string; body:string; size:number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: body, border: `2px solid ${cap}`,
      display:'flex', alignItems:'center', justifyContent:'center',
      boxShadow:`inset 0 1px 3px rgba(0,0,0,0.08)`,
      position:'relative', overflow:'hidden',
    }}>
      {/* shine */}
      <div style={{
        position:'absolute', top:'20%', left:'18%',
        width:'30%', height:'14%', borderRadius:'50%',
        background:'rgba(255,255,255,0.55)', transform:'rotate(-35deg)',
      }} />
      {/* score line */}
      <div style={{ width:'55%', height: 1.5, background: cap, opacity: 0.5, borderRadius:1 }} />
    </div>
  );
}

function SyrupShape({ cap, body, size }: { cap:string; body:string; size:number }) {
  return (
    <div style={{ position:'relative', width: size * 0.7, height: size, display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* cap */}
      <div style={{ width:'55%', height:'14%', background: cap, borderRadius:'3px 3px 0 0', marginBottom:0 }} />
      {/* neck */}
      <div style={{ width:'38%', height:'10%', background: cap, opacity:0.7 }} />
      {/* body */}
      <div style={{
        width:'100%', flex:1, background: body,
        border:`1.5px solid ${cap}`, borderRadius: size * 0.12,
        display:'flex', flexDirection:'column', overflow:'hidden',
      }}>
        {/* label */}
        <div style={{ margin:'20% 12% 0', height:'15%', background:'rgba(255,255,255,0.6)', borderRadius:2 }} />
        {/* liquid fill */}
        <div style={{ margin:'8% 8% 0', flex:1, background: cap, opacity:0.2, borderRadius:`0 0 ${size*0.1}px ${size*0.1}px` }} />
      </div>
    </div>
  );
}

function InjectionShape({ cap, body, size }: { cap:string; body:string; size:number }) {
  return (
    <div style={{ position:'relative', width: size, height: size, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {/* barrel */}
      <div style={{
        position:'absolute', top:'22%', left:'18%',
        width:'64%', height:'56%',
        background: body, border:`1.5px solid ${cap}`, borderRadius: 3,
      }}>
        {/* graduation marks */}
        <div style={{ position:'absolute', left:'18%', top:'22%', width:'30%', height:1, background: cap, opacity:0.5 }} />
        <div style={{ position:'absolute', left:'18%', top:'55%', width:'30%', height:1, background: cap, opacity:0.5 }} />
      </div>
      {/* plunger */}
      <div style={{
        position:'absolute', top:'8%', left:'43%',
        width:'14%', height:'22%',
        background: cap, opacity:0.75, borderRadius:'2px 2px 0 0',
      }} />
      {/* needle */}
      <div style={{
        position:'absolute', bottom:'10%', left:'50%',
        width: 1.5, height:'16%',
        background: cap, transform:'translateX(-50%)',
      }} />
    </div>
  );
}

function DropsShape({ cap, body, size }: { cap:string; body:string; size:number }) {
  return (
    <div style={{ position:'relative', width: size * 0.7, height: size, display:'flex', flexDirection:'column', alignItems:'center' }}>
      {/* cap */}
      <div style={{ width:'60%', height:'18%', background: cap, borderRadius:'3px 3px 0 0' }} />
      {/* bottle body */}
      <div style={{
        width:'100%', flex:1, background: body,
        border:`1.5px solid ${cap}`,
        borderRadius: `0 0 ${size*0.2}px ${size*0.2}px`,
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        {/* drop shape */}
        <div style={{
          width:'35%', height:'40%',
          background: cap, opacity:0.35,
          borderRadius:'50% 50% 50% 50% / 60% 60% 40% 40%',
          transform:'scaleY(-1)',
        }} />
      </div>
    </div>
  );
}

function CreamShape({ cap, body, size }: { cap:string; body:string; size:number }) {
  return (
    <div style={{ position:'relative', width: size, height: size * 0.55, display:'flex', alignItems:'center' }}>
      {/* crimped end */}
      <div style={{ width:'14%', height:'70%', background: cap, opacity:0.7, borderRadius:'3px 0 0 3px' }} />
      {/* tube body */}
      <div style={{
        flex:1, height:'100%', background: body,
        border:`1.5px solid ${cap}`, borderRadius:4,
        display:'flex', alignItems:'center', paddingLeft:'8%',
      }}>
        <div style={{ width:'45%', height:'25%', background:'rgba(255,255,255,0.55)', borderRadius:2 }} />
      </div>
      {/* nozzle */}
      <div style={{ width:'16%', height:'50%', background: body, border:`1.5px solid ${cap}`, borderRadius:'0 3px 3px 0' }} />
      {/* cap */}
      <div style={{ width:'10%', height:'70%', background: cap, borderRadius:'0 3px 3px 0' }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function MedicineIcon({ name, size = 'md' }: MedicineIconProps) {
  const rule = matchRule(name);
  const s = size === 'sm' ? 20 : size === 'lg' ? 34 : 26;
  const container = size === 'sm' ? 32 : size === 'lg' ? 52 : 42;

  const shape = () => {
    switch (rule.type) {
      case 'capsule':   return <CapsuleShape  cap={rule.cap} body={rule.body} width={s * 1.7} height={s * 0.7} />;
      case 'syrup':     return <SyrupShape    cap={rule.cap} body={rule.body} size={s} />;
      case 'injection': return <InjectionShape cap={rule.cap} body={rule.body} size={s} />;
      case 'drops':     return <DropsShape    cap={rule.cap} body={rule.body} size={s} />;
      case 'cream':     return <CreamShape    cap={rule.cap} body={rule.body} size={s} />;
      default:          return <TabletShape   cap={rule.cap} body={rule.body} size={s} />;
    }
  };

  return (
    <div
      className="rounded-2xl flex items-center justify-center shrink-0 select-none"
      style={{
        width: container, height: container,
        backgroundColor: rule.bg,
        border: `1.5px solid ${rule.border}`,
      }}
    >
      {shape()}
    </div>
  );
}

export function getMedicineColors(name: string) {
  const rule = matchRule(name);
  return { bg: rule.bg, border: rule.border, accent: rule.cap };
}
