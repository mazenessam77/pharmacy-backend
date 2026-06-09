'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Stethoscope } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-28 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-none overflow-hidden"
          style={{
            background:
              '#000000',
            boxShadow: 'none',
          }}
        >
          {/* Decorative elements */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-none pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)',
            }}
          />
          <div
            className="absolute -bottom-20 -left-10 w-64 h-64 rounded-none pointer-events-none"
            style={{
              background:
                'radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%)',
            }}
          />

          {/* Stethoscope watermark */}
          <div className="absolute top-6 right-10 opacity-[0.07] pointer-events-none">
            <Stethoscope className="w-40 h-40 text-white" />
          </div>

          <div className="relative z-10 px-10 py-16 lg:px-20 lg:py-20 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-400 mb-4">
              Ready to Start?
            </p>
            <h2 className="text-[clamp(28px,4vw,48px)] font-extrabold text-white leading-tight tracking-tight mb-4">
              Your Health,
              <br />
              Our Priority
            </h2>
            <p className="text-[15px] text-neutral-400/80 max-w-md mx-auto mb-10 leading-relaxed">
              Join PharmaLink today and experience the future of pharmacy services —
              whether you&apos;re a patient or a pharmacy owner.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-white text-neutral-900 px-8 py-3.5 rounded-none text-[14px] font-bold hover:bg-neutral-100 active:scale-[0.98] transition-all duration-200 shadow-black/10"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white px-8 py-3.5 rounded-none text-[14px] font-semibold hover:bg-white/15 transition-all duration-200"
              >
                Register Your Pharmacy
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
