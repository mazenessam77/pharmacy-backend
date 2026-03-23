'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, MapPin, Clock, Shield } from 'lucide-react';
import { FloatingMedicines } from './MedicineIllustrations';

export default function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen bg-black flex items-center overflow-hidden">
      <FloatingMedicines />

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-32 lg:py-0">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left — Copy */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <p className="text-[11px] uppercase tracking-ultra text-neutral-500 mb-6">
                Healthcare Reimagined
              </p>
              <h1 className="text-[clamp(36px,5vw,64px)] font-light text-white uppercase tracking-wide leading-[1.1] mb-8">
                Your Medicine,
                <br />
                <span className="text-neutral-500">Delivered</span>
              </h1>
              <p className="text-[14px] text-neutral-400 leading-relaxed max-w-md mb-10 font-light">
                Connect with nearby pharmacies in real-time. Upload prescriptions,
                compare offers, and get your medicines delivered — all from one platform.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 mb-16"
            >
              <Link
                href="/register"
                className="group inline-flex items-center justify-center gap-3 bg-white text-black px-8 py-4 text-[11px] uppercase tracking-ultra hover:bg-neutral-100 transition-all duration-300"
              >
                Get Started
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-3 border border-neutral-700 text-white px-8 py-4 text-[11px] uppercase tracking-ultra hover:border-neutral-500 transition-all duration-300"
              >
                Sign In
              </Link>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex gap-8"
            >
              {[
                { icon: MapPin, text: 'GPS Located' },
                { icon: Clock, text: 'Real-time' },
                { icon: Shield, text: 'Secure' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 text-neutral-600" />
                  <span className="text-[10px] uppercase tracking-widest text-neutral-600">{text}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right — Animated Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="hidden lg:block"
          >
            <div className="relative">
              {/* Mock app window */}
              <div className="bg-neutral-900 border border-neutral-800 p-1">
                <div className="flex items-center gap-1.5 px-3 py-2 border-b border-neutral-800">
                  <div className="w-2 h-2 rounded-full bg-neutral-700" />
                  <div className="w-2 h-2 rounded-full bg-neutral-700" />
                  <div className="w-2 h-2 rounded-full bg-neutral-700" />
                  <span className="ml-3 text-[9px] text-neutral-600 uppercase tracking-widest">pharmalink.app</span>
                </div>

                <div className="p-6 space-y-4">
                  {/* Mock order card */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.6 }}
                    className="bg-neutral-800/50 border border-neutral-700/50 p-4"
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-1">New Order</p>
                        <p className="text-[13px] text-white font-light">Amoxicillin 500mg</p>
                      </div>
                      <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[9px] uppercase tracking-widest">
                        Nearby
                      </span>
                    </div>
                    <div className="flex gap-4 text-[10px] text-neutral-500">
                      <span>2.3 km away</span>
                      <span>3 offers</span>
                    </div>
                  </motion.div>

                  {/* Mock pharmacy offer */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.3, duration: 0.6 }}
                    className="bg-neutral-800/50 border border-neutral-700/50 p-4"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white flex items-center justify-center">
                          <span className="text-[10px] font-bold text-black">AZ</span>
                        </div>
                        <div>
                          <p className="text-[12px] text-white font-light">Al-Azhar Pharmacy</p>
                          <p className="text-[10px] text-neutral-500">1.5 km - ★ 4.8</p>
                        </div>
                      </div>
                      <p className="text-[14px] text-white font-light">EGP 45</p>
                    </div>
                  </motion.div>

                  {/* Mock status */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.6, duration: 0.6 }}
                    className="flex items-center gap-3 p-3"
                  >
                    <div className="flex gap-1">
                      {['bg-white', 'bg-white', 'bg-white', 'bg-neutral-700', 'bg-neutral-700'].map((c, i) => (
                        <div key={i} className={`w-8 h-1 ${c}`} />
                      ))}
                    </div>
                    <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Preparing</span>
                  </motion.div>
                </div>
              </div>

              {/* Glow effect */}
              <div className="absolute -inset-4 bg-gradient-to-b from-white/5 to-transparent -z-10 blur-2xl" />
            </div>
          </motion.div>
        </div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-px h-12 bg-gradient-to-b from-transparent via-neutral-600 to-transparent"
        />
      </motion.div>
    </section>
  );
}
