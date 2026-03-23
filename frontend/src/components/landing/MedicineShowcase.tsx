'use client';

import { motion } from 'framer-motion';

const medicines = [
  {
    name: 'Amoxicillin',
    dosage: '500mg Capsule',
    category: 'Antibiotic',
    color: 'bg-amber-50 border-amber-200',
    accent: 'bg-amber-500',
  },
  {
    name: 'Paracetamol',
    dosage: '500mg Tablet',
    category: 'Analgesic',
    color: 'bg-blue-50 border-blue-200',
    accent: 'bg-blue-500',
  },
  {
    name: 'Omeprazole',
    dosage: '20mg Capsule',
    category: 'Antacid',
    color: 'bg-purple-50 border-purple-200',
    accent: 'bg-purple-500',
  },
  {
    name: 'Metformin',
    dosage: '850mg Tablet',
    category: 'Antidiabetic',
    color: 'bg-emerald-50 border-emerald-200',
    accent: 'bg-emerald-500',
  },
  {
    name: 'Cetirizine',
    dosage: '10mg Tablet',
    category: 'Antihistamine',
    color: 'bg-rose-50 border-rose-200',
    accent: 'bg-rose-500',
  },
  {
    name: 'Ibuprofen',
    dosage: '400mg Tablet',
    category: 'Anti-inflammatory',
    color: 'bg-orange-50 border-orange-200',
    accent: 'bg-orange-500',
  },
];

export default function MedicineShowcase() {
  return (
    <section className="py-32 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 mb-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-ultra text-neutral-400 mb-4">Medicine Database</p>
            <h2 className="text-[clamp(28px,3.5vw,42px)] font-light uppercase tracking-wide leading-tight">
              Wide Range of
              <br />
              <span className="text-neutral-400">Medicines Available</span>
            </h2>
          </div>
          <p className="text-[12px] text-neutral-500 max-w-xs font-light leading-relaxed">
            Our platform supports hundreds of medicines across all major categories,
            with real-time availability from nearby pharmacies.
          </p>
        </div>
      </div>

      {/* Scrolling cards */}
      <div className="relative">
        <motion.div
          className="flex gap-5 px-6 lg:px-12"
          animate={{ x: [0, -600] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {[...medicines, ...medicines].map((med, i) => (
            <div
              key={`${med.name}-${i}`}
              className={`flex-shrink-0 w-64 border ${med.color} p-6 hover:shadow-lg transition-shadow duration-500`}
            >
              {/* Medicine visual */}
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-12 h-12 ${med.accent} rounded-full opacity-20`} />
                <div className={`w-8 h-8 ${med.accent} rounded-full opacity-10 -ml-6`} />
              </div>

              <p className="text-[9px] uppercase tracking-widest text-neutral-500 mb-2">{med.category}</p>
              <h3 className="text-[15px] font-light mb-1">{med.name}</h3>
              <p className="text-[12px] text-neutral-500">{med.dosage}</p>

              {/* Mock availability */}
              <div className="mt-5 pt-4 border-t border-neutral-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-neutral-400 uppercase tracking-widest">Available at</span>
                  <span className="text-[12px] font-light">{3 + (i % 5)} pharmacies</span>
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Fade edges */}
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white to-transparent pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white to-transparent pointer-events-none" />
      </div>
    </section>
  );
}
