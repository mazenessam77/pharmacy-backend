'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-20 lg:py-24 bg-[#f7f9fc]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative rounded-[24px] overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-[#12275a] shadow-[0_32px_64px_-28px_rgba(30,64,175,0.5)]"
        >
          {/* Soft radial glows */}
          <div
            className="absolute top-0 right-0 w-96 h-96 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%)' }}
          />
          <div
            className="absolute -bottom-20 -left-10 w-64 h-64 pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)' }}
          />

          <div className="relative z-10 px-8 py-16 lg:px-20 lg:py-20 text-center">
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-200 mb-4">
              Ready to Start?
            </p>
            <h2 className="text-[clamp(28px,3.5vw,44px)] font-bold text-white leading-[1.12] tracking-tight mb-4">
              Your Health,
              <br />
              Our Priority
            </h2>
            <p className="text-[15px] text-blue-100/90 max-w-md mx-auto mb-10 leading-relaxed">
              Join PharmaLink today and experience the future of pharmacy services —
              whether you&apos;re a patient or a pharmacy owner.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-2 bg-white text-blue-700 px-7 py-3.5 rounded-full text-[14px] font-semibold hover:bg-blue-50 active:scale-[0.98] transition-all duration-200"
              >
                Create Free Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/25 text-white px-7 py-3.5 rounded-full text-[14px] font-semibold hover:bg-white/20 transition-all duration-200"
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
