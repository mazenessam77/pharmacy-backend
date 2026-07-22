'use client';

import { motion } from 'framer-motion';
import { MapPin, Zap, MessageSquare, Camera, Star, Truck, Shield, Bell } from 'lucide-react';

const features = [
  { icon: MapPin,        title: 'Geolocation Search',    description: 'Find pharmacies near you using GPS-powered search with configurable radius.' },
  { icon: Zap,           title: 'Real-time Updates',     description: 'Live order tracking with instant status updates as your order progresses.' },
  { icon: MessageSquare, title: 'In-app Chat',           description: 'Direct messaging between patients and pharmacies with typing indicators.' },
  { icon: Camera,        title: 'Prescription Scanning', description: 'Snap a photo of your prescription and we read the medicine names for you.' },
  { icon: Star,          title: 'Reviews & Ratings',     description: 'Rate pharmacies and read reviews to make informed decisions.' },
  { icon: Truck,         title: 'Delivery Tracking',     description: 'Track your order from preparation to doorstep delivery in real-time.' },
  { icon: Shield,        title: 'Secure Platform',       description: 'Your account and data stay protected with secure sign-in and encryption.' },
  { icon: Bell,          title: 'Smart Notifications',   description: 'Push notifications for order updates, new offers, and messages.' },
];

const containerVariants = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } };
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

export default function FeaturesSection() {
  return (
    <section id="features" className="py-20 lg:py-24 bg-[#f7f9fc]">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-blue-600 mb-3">
            Platform Features
          </p>
          <h2 className="text-[clamp(28px,3.5vw,40px)] font-bold text-neutral-900 leading-[1.12] tracking-tight mb-4">
            Everything You Need,
            <br />
            <span className="bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent">Nothing You Don&apos;t</span>
          </h2>
          <p className="text-[15px] text-neutral-600 leading-relaxed">
            A complete pharmacy experience designed around you — find medicines,
            compare offers, and get them delivered.
          </p>
        </div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              whileHover={{ translateY: -4 }}
              className="bg-white border border-neutral-200/80 rounded-[16px] p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_16px_32px_-16px_rgba(15,23,42,0.14)] hover:border-neutral-300 transition-all duration-300 cursor-default"
            >
              <div className="w-11 h-11 rounded-[12px] flex items-center justify-center mb-5 bg-blue-50 text-blue-600">
                <feature.icon className="w-5 h-5" />
              </div>
              <h3 className="text-[15px] font-semibold text-neutral-900 mb-2">{feature.title}</h3>
              <p className="text-[13px] text-neutral-500 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
