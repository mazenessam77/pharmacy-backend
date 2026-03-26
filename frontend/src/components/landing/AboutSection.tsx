'use client';

import { motion } from 'framer-motion';
import { Code2, Database, Globe, Server, Smartphone, Cpu } from 'lucide-react';

const team = [
  { initials: 'ME', name: 'Mazen Essam',        role: 'Full-Stack Developer', focus: 'Backend Architecture & DevOps',  color: 'bg-sky-600' },
  { initials: 'AM', name: 'Adham Mohamed',      role: 'Team Member',          focus: 'Development & Collaboration',   color: 'bg-teal-600' },
  { initials: 'AM', name: 'Abdelrahman Mohamed', role: 'Team Member',         focus: 'Development & Collaboration',   color: 'bg-emerald-600' },
];

const techStack = [
  { icon: Globe,      label: 'Next.js 14',  desc: 'Frontend' },
  { icon: Server,     label: 'Express.js',  desc: 'Backend' },
  { icon: Database,   label: 'MongoDB',     desc: 'Database' },
  { icon: Cpu,        label: 'Socket.IO',   desc: 'Real-time' },
  { icon: Code2,      label: 'TypeScript',  desc: 'Language' },
  { icon: Smartphone, label: 'Docker',      desc: 'Containers' },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-28 bg-white dark:bg-black transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-600 dark:text-sky-400 mb-3">About Us</p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-4">
            Built With Purpose,
            <br />
            <span className="text-slate-400 dark:text-zinc-500">Delivered With Care</span>
          </h2>
          <p className="text-[14px] text-slate-500 dark:text-zinc-400 leading-relaxed">
            PharmaLink is a graduation project that bridges the gap between patients
            and pharmacies using modern web technologies.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left */}
          <div>
            <div className="bg-slate-50 dark:bg-zinc-900/60 rounded-2xl p-8 mb-8 border border-slate-100 dark:border-zinc-800/60">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-4">Our Mission</h3>
              <p className="text-[14px] text-slate-600 dark:text-zinc-400 leading-relaxed mb-6">
                To revolutionize how patients access pharmaceutical services by creating
                a real-time, location-aware platform that connects patients with nearby
                pharmacies, enabling transparent pricing, instant communication, and
                reliable delivery.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[{ value: '3', label: 'User Roles' }, { value: '37+', label: 'API Endpoints' }, { value: '24/7', label: 'Real-time' }].map((stat) => (
                  <div key={stat.label} className="bg-white dark:bg-zinc-800/60 rounded-xl p-4 text-center border border-slate-100 dark:border-zinc-800">
                    <p className="text-[22px] font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-5">The Team</h3>
              <div className="space-y-3">
                {team.map((member) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 bg-white dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/60 rounded-2xl p-4 hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-sm hover:shadow-sky-50 dark:hover:shadow-sky-900/10 transition-all duration-300"
                  >
                    <div className={`w-12 h-12 ${member.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[13px] font-bold text-white tracking-wider">{member.initials}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-100">{member.name}</p>
                      <p className="text-[11px] text-sky-600 dark:text-sky-400 font-medium uppercase tracking-widest">{member.role}</p>
                      <p className="text-[11px] text-slate-400 dark:text-zinc-500 mt-0.5">{member.focus}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-5">Technology Stack</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/60 rounded-2xl p-5 hover:border-sky-200 dark:hover:border-sky-800 hover:bg-sky-50/30 dark:hover:bg-sky-900/10 transition-all duration-300 group"
                >
                  <tech.icon className="w-5 h-5 text-slate-400 dark:text-zinc-500 group-hover:text-sky-500 dark:group-hover:text-sky-400 mb-3 transition-colors duration-300" />
                  <p className="text-[13px] font-semibold text-slate-800 dark:text-zinc-100">{tech.label}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mt-0.5">{tech.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-slate-50 dark:bg-zinc-900/60 border border-slate-100 dark:border-zinc-800/60 rounded-2xl p-7">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 mb-5">Architecture</h3>
              <div className="space-y-3.5">
                {[
                  { label: 'Frontend', detail: 'Next.js 14 + Zustand + TailwindCSS' },
                  { label: 'Backend',  detail: 'Express.js + TypeScript + Socket.IO' },
                  { label: 'Database', detail: 'MongoDB 7.0 with Geospatial Indexes' },
                  { label: 'Auth',     detail: 'JWT Access + Refresh Token Rotation' },
                  { label: 'OCR',      detail: 'Tesseract.js + Sharp Image Processing' },
                  { label: 'Infra',    detail: 'AWS EC2 + Docker + Nginx + Terraform' },
                  { label: 'CI/CD',    detail: 'GitHub Actions → SSH Auto-deploy' },
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500 w-16 flex-shrink-0">{item.label}</span>
                    <span className="text-[12px] text-slate-600 dark:text-zinc-400">{item.detail}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
