import { Code2, Brain, Shield, Zap, Users, Globe, Target, Award } from "lucide-react";

export function About() {
  return (
    <div className="section-padding">
      <div className="container-max">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
            <Target size={14} className="text-violet-400" />
            <span className="text-sm text-violet-200">Our Mission</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
            About <span className="gradient-text">ShopAi</span>
          </h1>
          <p className="mt-6 text-gray-400 max-w-3xl mx-auto text-lg leading-relaxed">
            ShopAi is on a mission to transform online shopping through artificial intelligence.
            We combine full-stack engineering, software best practices, and AI technology to create
            a shopping experience that is smarter, faster, and more personal than ever before.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { icon: Users, value: "50K+", label: "Customers" },
            { icon: Globe, value: "120+", label: "Countries" },
            { icon: Award, value: "10K+", label: "Products" },
            { icon: Zap, value: "99.9%", label: "Uptime" },
          ].map((stat) => (
            <div key={stat.label} className="glass-dark p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-violet-600/20 mx-auto mb-4">
                <stat.icon size={24} className="text-white" />
              </div>
              <div className="font-display text-3xl font-bold gradient-text">{stat.value}</div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tech sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {[
            {
              icon: Code2,
              title: "Full-Stack Development",
              desc: "Our platform is built with React, TypeScript, Vite, and Tailwind CSS on the frontend, backed by Supabase for a real-time, scalable database and authentication system. This modern stack ensures fast page loads, type safety, and a responsive experience across all devices.",
              points: ["React + TypeScript + Vite", "Supabase PostgreSQL database", "REST API with RLS security", "Responsive Tailwind CSS design"],
            },
            {
              icon: Shield,
              title: "Software Engineering",
              desc: "We follow clean architecture principles with reusable components, comprehensive error handling, loading states, and environment-based configuration. Every component is built to be maintainable, testable, and scalable.",
              points: ["Reusable component architecture", "Secure auth with password hashing", "Protected routes & input validation", "Comprehensive error handling"],
            },
            {
              icon: Brain,
              title: "AI Engineering",
              desc: "Our AI recommendation system analyzes user preferences to suggest relevant products. The shopping chatbot and product comparison tools use server-side AI integration, keeping API keys secure and never exposed in frontend code.",
              points: ["AI product recommendations", "Intelligent product search", "AI shopping chatbot", "Secure server-side API integration"],
            },
          ].map((item) => (
            <div key={item.title} className="glass-dark p-8">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-violet-600/20 mb-6">
                <item.icon size={28} className="text-white" />
              </div>
              <h3 className="font-display text-xl font-semibold text-white mb-3">{item.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed mb-4">{item.desc}</p>
              <ul className="space-y-2">
                {item.points.map((point) => (
                  <li key={point} className="flex items-center gap-2 text-sm text-gray-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="glass-dark p-12 text-center">
          <h2 className="font-display text-3xl font-bold text-white">
            Experience the Future of Shopping
          </h2>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Join thousands of customers who shop smarter with ShopAi's AI-powered platform.
          </p>
          <a href="/" className="btn-primary mt-8 inline-flex">
            Start Shopping
          </a>
        </div>
      </div>
    </div>
  );
}
