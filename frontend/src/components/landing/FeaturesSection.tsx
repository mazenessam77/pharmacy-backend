'use client';

import { motion } from 'framer-motion';
import { MapPin, Zap, MessageSquare, Camera, Star, Truck, Shield, Bell } from 'lucide-react';

const features = [
  {
    icon: MapPin,
    title: 'Geolocation Search',
    description: 'Find pharmacies near you using GPS-powered search with configurable radius.',
  },
  {
    icon: Zap,
    title: 'Real-time Updates',
    description: 'Live order tracking with instant status updates via WebSocket connections.',
  },
  {
    icon: MessageSquare,
    title: 'In-app Chat',
    description: 'Direct messaging between patients and pharmacies with typing indicators.',
  },
  {
    icon: Camera,
    title: 'Prescription OCR',
    description: 'Upload prescriptions and let AI extract medicine names automatically.',
  },
  {
    icon: Star,
    title: 'Reviews & Ratings',
    description: 'Rate pharmacies and read reviews to make informed decisions.',
  },
  {
    icon: Truck,
    title: 'Delivery Tracking',
    description: 'Track your order from preparation to doorstep delivery in real-time.',
  },
  {
    icon: Shield,
    title: 'Secure Platform',
    description: 'JWT authentication, encrypted data, and role-based access control.',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Push notifications for order updates, new offers, and messages.',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FeaturesSection() {
  return (
    <section id="features" className="py-32 bg-white">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        {/* Header */}
        <div className="max-w-2xl mb-20">
          <p className="text-[11px] uppercase tracking-ultra text-neutral-400 mb-4">Features</p>
          <h2 className="text-[clamp(28px,3.5vw,42px)] font-light uppercase tracking-wide leading-tight mb-6">
            Everything You Need,
            <br />
            <span className="text-neutral-400">Nothing You Don&apos;t</span>
          </h2>
          <p className="text-[14px] text-neutral-500 leading-relaxed font-light">
            A complete pharmacy ecosystem built with modern technology for patients,
            pharmacies, and administrators.
          </p>
        </div>

        {/* Feature Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-neutral-200"
        >
          {features.map((feature) => (
            <motion.div
              key={feature.title}
              variants={itemVariants}
              className="bg-white p-8 group hover:bg-black transition-colors duration-500 cursor-default"
            >
              <feature.icon className="w-5 h-5 text-black group-hover:text-white mb-6 transition-colors duration-500" />
              <h3 className="text-[12px] uppercase tracking-widest text-black group-hover:text-white mb-3 transition-colors duration-500">
                {feature.title}
              </h3>
              <p className="text-[12px] text-neutral-500 group-hover:text-neutral-400 leading-relaxed font-light transition-colors duration-500">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
