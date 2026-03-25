'use client';

import { motion } from 'framer-motion';
import { Stethoscope, HeartPulse } from './MedicineIllustrations';
import { Code2, Database, Globe, Server, Smartphone, Cpu } from 'lucide-react';

const team = [
  {
    initials: 'ME',
    name: 'Mazen Essam',
    role: 'Full-Stack Developer',
    focus: 'Backend Architecture & DevOps',
  },
  {
    initials: 'AM',
    name: 'Adham Mohamed',
    role: 'Team Member',
    focus: 'Development & Collaboration',
  },
  {
    initials: 'AM',
    name: 'Abdelrahman Mohamed',
    role: 'Team Member',
    focus: 'Development & Collaboration',
  },
];

const techStack = [
  { icon: Globe, label: 'Next.js 14', desc: 'Frontend' },
  { icon: Server, label: 'Express.js', desc: 'Backend' },
  { icon: Database, label: 'MongoDB', desc: 'Database' },
  { icon: Cpu, label: 'Socket.IO', desc: 'Real-time' },
  { icon: Code2, label: 'TypeScript', desc: 'Language' },
  { icon: Smartphone, label: 'Docker', desc: 'Containers' },
];

export default function AboutSection() {
  return (
    <section id="about" className="py-32 bg-black text-white relative overflow-hidden">
      {/* Background illustrations */}
      <div className="absolute top-12 right-12 opacity-[0.03]">
        <Stethoscope className="w-48 h-56" />
      </div>
      <div className="absolute bottom-12 left-12 opacity-[0.03]">
        <HeartPulse className="w-56 h-40" />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <p className="text-[11px] uppercase tracking-ultra text-neutral-500 mb-4">About Us</p>
          <h2 className="text-[clamp(28px,3.5vw,42px)] font-light uppercase tracking-wide leading-tight mb-6">
            Built With Purpose,
            <br />
            <span className="text-neutral-600">Delivered With Care</span>
          </h2>
          <p className="text-[14px] text-neutral-400 leading-relaxed font-light">
            PharmaLink is a graduation project that bridges the gap between patients and
            pharmacies using modern web technologies. We believe everyone deserves quick,
            transparent access to their medicine.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-20">
          {/* Left — Mission + Team */}
          <div>
            {/* Mission */}
            <div className="border border-neutral-800 p-10 mb-8">
              <h3 className="text-[12px] uppercase tracking-widest mb-4">Our Mission</h3>
              <p className="text-[14px] text-neutral-400 leading-relaxed font-light mb-6">
                To revolutionize how patients access pharmaceutical services by creating a
                real-time, location-aware platform that connects patients with nearby pharmacies,
                enabling transparent pricing, instant communication, and reliable delivery.
              </p>
              <div className="grid grid-cols-3 gap-px bg-neutral-800">
                {[
                  { value: '3', label: 'User Roles' },
                  { value: '37+', label: 'API Endpoints' },
                  { value: '24/7', label: 'Real-time' },
                ].map((stat) => (
                  <div key={stat.label} className="bg-black p-4 text-center">
                    <p className="text-[24px] font-light">{stat.value}</p>
                    <p className="text-[9px] uppercase tracking-widest text-neutral-600 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Team */}
            <div>
              <h3 className="text-[12px] uppercase tracking-widest mb-6">The Team</h3>
              <div className="space-y-4">
                {team.map((member) => (
                  <motion.div
                    key={member.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="flex items-center gap-5 border border-neutral-800 p-5 hover:border-neutral-600 transition-colors duration-500"
                  >
                    <div className="w-14 h-14 bg-white text-black flex items-center justify-center flex-shrink-0">
                      <span className="text-[14px] font-bold tracking-widest">{member.initials}</span>
                    </div>
                    <div>
                      <p className="text-[13px] font-light">{member.name}</p>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500">{member.role}</p>
                      <p className="text-[10px] text-neutral-600 mt-1">{member.focus}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Tech Stack */}
          <div>
            <h3 className="text-[12px] uppercase tracking-widest mb-6">Technology Stack</h3>
            <div className="grid grid-cols-2 gap-px bg-neutral-800 border border-neutral-800">
              {techStack.map((tech, i) => (
                <motion.div
                  key={tech.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-black p-8 group hover:bg-neutral-900 transition-colors duration-500"
                >
                  <tech.icon className="w-5 h-5 text-neutral-600 group-hover:text-white mb-4 transition-colors duration-500" />
                  <p className="text-[13px] font-light mb-1">{tech.label}</p>
                  <p className="text-[10px] uppercase tracking-widest text-neutral-600">{tech.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Architecture highlight */}
            <div className="mt-8 border border-neutral-800 p-8">
              <h3 className="text-[12px] uppercase tracking-widest mb-6">Architecture</h3>
              <div className="space-y-4">
                {[
                  { label: 'Frontend', detail: 'Next.js 14 + Zustand + TailwindCSS' },
                  { label: 'Backend', detail: 'Express.js + TypeScript + Socket.IO' },
                  { label: 'Database', detail: 'MongoDB 7.0 with Geospatial Indexes' },
                  { label: 'Auth', detail: 'JWT Access + Refresh Token Rotation' },
                  { label: 'OCR', detail: 'Tesseract.js + Sharp Image Processing' },
                  { label: 'Infra', detail: 'AWS EC2 + Docker + Nginx + Terraform' },
                  { label: 'CI/CD', detail: 'GitHub Actions → SSH Auto-deploy' },
                ].map((item) => (
                  <div key={item.label} className="flex items-baseline gap-4">
                    <span className="text-[10px] uppercase tracking-widest text-neutral-600 w-20 flex-shrink-0">
                      {item.label}
                    </span>
                    <span className="text-[12px] text-neutral-400 font-light">{item.detail}</span>
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
