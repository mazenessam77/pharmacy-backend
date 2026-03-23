'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CTASection() {
  return (
    <section className="py-32 bg-neutral-50 relative">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="bg-black text-white p-12 lg:p-20 text-center relative overflow-hidden"
        >
          {/* Grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-ultra text-neutral-500 mb-6">
              Ready to Start?
            </p>
            <h2 className="text-[clamp(28px,4vw,48px)] font-light uppercase tracking-wide leading-tight mb-4">
              Your Health,
              <br />
              Our Priority
            </h2>
            <p className="text-[14px] text-neutral-400 font-light max-w-md mx-auto mb-10 leading-relaxed">
              Join PharmaLink today and experience the future of pharmacy services.
              Whether you&apos;re a patient or a pharmacy, we&apos;ve got you covered.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-3 bg-white text-black px-10 py-4 text-[11px] uppercase tracking-ultra hover:bg-neutral-100 transition-all duration-300"
              >
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-3 border border-neutral-700 text-white px-10 py-4 text-[11px] uppercase tracking-ultra hover:border-neutral-500 transition-all duration-300"
              >
                Register Pharmacy
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
