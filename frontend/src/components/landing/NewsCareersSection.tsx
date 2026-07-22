'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Newspaper, Briefcase, Store, Thermometer, Camera, MapPin } from 'lucide-react';

const news = [
  {
    tag: 'Health Tips',
    title: 'How to store your medicines safely at home',
    excerpt: 'Heat, light and humidity can reduce a medicine’s potency. A few simple habits keep them effective.',
    date: 'Jun 2026',
    icon: Thermometer,
    headerClass: 'bg-gradient-to-br from-blue-50 to-sky-100',
    iconClass: 'text-blue-600',
  },
  {
    tag: 'Product',
    title: 'Prescription scanning is now faster than ever',
    excerpt: 'Our improved reader extracts medicine names from a photo in seconds — fewer typos, quicker orders.',
    date: 'Jun 2026',
    icon: Camera,
    headerClass: 'bg-gradient-to-br from-teal-50 to-emerald-100',
    iconClass: 'text-teal-600',
  },
  {
    tag: 'Community',
    title: 'PharmaLink now live across all 27 governorates',
    excerpt: 'Patients everywhere can now connect with nearby pharmacies and get medicines delivered to their door.',
    date: 'Jun 2026',
    icon: MapPin,
    headerClass: 'bg-gradient-to-br from-violet-50 to-indigo-100',
    iconClass: 'text-violet-600',
  },
];

export default function NewsCareersSection() {
  return (
    <section id="news" className="py-20 lg:py-24 bg-[#f7f9fc]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* News */}
        <div className="flex items-center gap-2 mb-3">
          <Newspaper className="w-4 h-4 text-blue-600" />
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600">Latest News</p>
        </div>
        <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-neutral-900 leading-[1.12] tracking-tight mb-12">
          What&apos;s New at PharmaLink
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16 lg:mb-20">
          {news.map((item, i) => (
            <motion.article
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ translateY: -4 }}
              className="group bg-white border border-neutral-200/80 rounded-[16px] overflow-hidden shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.14)] hover:border-neutral-300 transition-all duration-300 cursor-pointer"
            >
              <div className={`relative h-40 flex items-center justify-center ${item.headerClass}`}>
                <div className="w-14 h-14 rounded-[14px] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.08)] flex items-center justify-center">
                  <item.icon className={`w-6 h-6 ${item.iconClass}`} />
                </div>
                <span className="absolute top-4 start-4 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 bg-white/80 backdrop-blur-sm rounded-full px-2.5 py-1">
                  {item.tag}
                </span>
              </div>
              <div className="p-6">
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-400 mb-2">{item.date}</p>
                <h3 className="text-[16px] font-semibold text-neutral-900 leading-snug mb-2 group-hover:text-blue-600 transition-colors">{item.title}</h3>
                <p className="text-[13px] text-neutral-500 leading-relaxed mb-4">{item.excerpt}</p>
                <span className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-blue-600">
                  Read more <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
                </span>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Careers / Partner banners — primary (pharmacy) + secondary (careers) */}
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="relative overflow-hidden rounded-[24px] bg-gradient-to-br from-blue-600 to-blue-800 p-8 lg:p-9 text-white shadow-[0_28px_56px_-24px_rgba(30,64,175,0.45)]"
          >
            <div className="absolute inset-0 opacity-25" style={{ backgroundImage: 'radial-gradient(circle at 85% 15%, rgba(255,255,255,0.45) 0%, transparent 45%)' }} />
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-[12px] bg-white/15 flex items-center justify-center mb-5">
                <Store className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-[22px] font-bold leading-tight tracking-tight mb-2">Partner Your Pharmacy</h3>
              <p className="text-[14px] text-white/80 leading-relaxed max-w-sm mb-6">
                Reach more patients, manage orders in real-time, and grow your pharmacy with PharmaLink.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white text-blue-700 rounded-full px-6 py-3 text-[13.5px] font-semibold hover:bg-blue-50 transition-colors"
              >
                Register Your Pharmacy <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative overflow-hidden rounded-[24px] bg-white border border-neutral-200/80 p-8 lg:p-9 shadow-[0_1px_2px_rgba(15,23,42,0.04)]"
          >
            <div className="relative z-10">
              <div className="w-11 h-11 rounded-[12px] bg-blue-50 text-blue-600 flex items-center justify-center mb-5">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-[22px] font-bold text-neutral-900 leading-tight tracking-tight mb-2">Join Our Team</h3>
              <p className="text-[14px] text-neutral-600 leading-relaxed max-w-sm mb-6">
                We&apos;re building the future of pharmacy access. Help us connect patients with care that&apos;s fast and reliable.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-white border border-neutral-200 text-neutral-800 rounded-full px-6 py-3 text-[13.5px] font-semibold hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
              >
                See Open Roles <ArrowRight className="w-4 h-4 rtl:rotate-180" />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
