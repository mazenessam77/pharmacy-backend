'use client';

import { motion } from 'framer-motion';
import { Code2, Database, Globe, Server, Smartphone, Cpu } from 'lucide-react';

const team = [
  { initials: 'ME', name: 'Mazen Essam',        role: 'Full-Stack Developer', focus: 'Backend Architecture & DevOps',  color: 'bg-black' },
  { initials: 'AM', name: 'Adham Mohamed',      role: 'Team Member',          focus: 'Development & Collaboration',   color: 'bg-black' },
  { initials: 'AM', name: 'Abdelrahman Mohamed', role: 'Team Member',         focus: 'Development & Collaboration',   color: 'bg-black' },
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
    <section id="about" className="py-28 bg-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="max-w-2xl mb-14">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-neutral-900 mb-3">About Us</p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-extrabold text-neutral-900 tracking-tight leading-tight mb-4">
            Built With Purpose,
            <br />
            <span className="text-neutral-400">Delivered With Care</span>
          </h2>
          <p className="text-[14px] text-neutral-500 leading-relaxed">
            PharmaLink is a graduation project that bridges the gap between patients
            and pharmacies using modern web technologies.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Left */}
          <div>
            <div className="bg-neutral-50 rounded-none p-8 mb-8 border border-neutral-100">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-neutral-400 mb-4">Our Mission</h3>
              <p className="text-[14px] text-neutral-600 leading-relaxed mb-6">
                To revolutionize how patients access pharmaceutical services by creating
                a real-time, location-aware platform that connects patients with nearby
                pharmacies, enabling transparent pricing, instant communication, and
                reliable delivery.
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[{ value: '3', label: 'User Roles' }, { value: '37+', label: 'API Endpoints' }, { value: '24/7', label: 'Real-time' }].map((stat) => (
                  <div key={stat.label} className="bg-white rounded-none p-4 text-center border border-neutral-100">
                    <p className="text-[22px] font-extrabold text-neutral-900">{stat.value}</p>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-neutral-400 mb-5">The Team</h3>
              <div className="space-y-3">
                {team.map((member) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, x: -16 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-4 bg-white border border-neutral-100 rounded-none p-4 hover:border-neutral-200 hover: transition-all duration-300"
                  >
                    <div className={`w-12 h-12 ${member.color} rounded-none flex items-center justify-center flex-shrink-0`}>
                      <span className="text-[13px] font-bold text-white tracking-wider">{member.initials}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-neutral-800">{member.name}</p>
                      <p className="text-[11px] text-neutral-900 font-medium uppercase tracking-widest">{member.role}</p>
                      <p className="text-[11px] text-neutral-400 mt-0.5">{member.focus}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right */}
          <div>
            <h3 className="text-[12px] font-bold uppercase tracking-widest text-neutral-400 mb-5">Technology Stack</h3>
            <div className="grid grid-cols-2 gap-3 mb-6">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.label}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 }}
                  className="bg-neutral-50 border border-neutral-100 rounded-none p-5 hover:border-neutral-200 hover:bg-neutral-100/30 transition-all duration-300 group"
                >
                  <tech.icon className="w-5 h-5 text-neutral-400 group-hover:text-neutral-900 mb-3 transition-colors duration-300" />
                  <p className="text-[13px] font-semibold text-neutral-800">{tech.label}</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-400 mt-0.5">{tech.desc}</p>
                </motion.div>
              ))}
            </div>

            <div className="bg-neutral-50 border border-neutral-100 rounded-none p-7">
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-neutral-400 mb-5">Architecture</h3>
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
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 w-16 flex-shrink-0">{item.label}</span>
                    <span className="text-[12px] text-neutral-600">{item.detail}</span>
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
