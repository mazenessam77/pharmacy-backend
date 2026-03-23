'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-black text-white border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white flex items-center justify-center">
                <span className="text-[14px] font-bold text-black">P</span>
              </div>
              <span className="text-[13px] uppercase tracking-ultra font-light">PharmaLink</span>
            </div>
            <p className="text-[12px] text-neutral-500 leading-relaxed font-light max-w-sm">
              Connecting patients with nearby pharmacies through real-time technology.
              A graduation project built with modern web technologies.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4">Platform</h4>
            <div className="space-y-3">
              {[
                { label: 'Sign In', href: '/login' },
                { label: 'Register', href: '/register' },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="block text-[12px] text-neutral-400 hover:text-white transition-colors duration-300 font-light"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tech */}
          <div>
            <h4 className="text-[10px] uppercase tracking-widest text-neutral-500 mb-4">Built With</h4>
            <div className="space-y-3">
              {['Next.js', 'Express.js', 'MongoDB', 'Socket.IO', 'Docker', 'AWS'].map((tech) => (
                <p key={tech} className="text-[12px] text-neutral-400 font-light">{tech}</p>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-neutral-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[10px] uppercase tracking-widest text-neutral-600">
            &copy; 2026 PharmaLink — Graduation Project
          </p>
          <p className="text-[10px] uppercase tracking-widest text-neutral-700">
            Faculty of Computer Science
          </p>
        </div>
      </div>
    </footer>
  );
}
