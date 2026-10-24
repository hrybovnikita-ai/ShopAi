import { Link } from "react-router-dom";
import {
  Sparkles,
  ShoppingBag,
  Zap,
  Cpu,
  Smartphone,
  Laptop,
  Gamepad2,
  Shirt,
  Watch,
  House,
  ArrowRight,
  Bot,
  Code2,
  Brain,
  Shield,
  TrendingUp,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { AIAssistant } from "@/components/AIAssistant";
import { useProducts } from "@/hooks/useProducts";
import { CATEGORIES } from "@/data/catalog";

const CATEGORY_ICONS: Record<string, typeof Cpu> = {
  Cpu,
  Smartphone,
  Laptop,
  Gamepad2,
  Shirt,
  Watch,
  House,
};

export function Home() {
  const { products, loading } = useProducts();
  const featured = products.slice(0, 8);

  return (
    <div>
      {/* Hero Section */}
      <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        {/* Floating elements */}
        <div className="absolute top-20 left-10 animate-float">
          <div className="glass p-3 rotate-12">
            <Cpu size={28} className="text-violet-400" />
          </div>
        </div>
        <div className="absolute top-32 right-16 animate-float-delayed">
          <div className="glass p-3 -rotate-6">
            <Smartphone size={28} className="text-blue-400" />
          </div>
        </div>
        <div className="absolute bottom-40 left-20 animate-float" style={{ animationDelay: "3s" }}>
          <div className="glass p-3 rotate-6">
            <Gamepad2 size={28} className="text-violet-300" />
          </div>
        </div>
        <div className="absolute bottom-32 right-12 animate-float-delayed" style={{ animationDelay: "4s" }}>
          <div className="glass p-3 -rotate-12">
            <Watch size={28} className="text-blue-300" />
          </div>
        </div>

        {/* Content */}
        <div className="container-max px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-2 mb-6 animate-fade-in-up">
            <Sparkles size={16} className="text-violet-400" />
            <span className="text-sm text-violet-200">AI-Powered E-Commerce Platform</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            Welcome to <span className="gradient-text">ShopAi</span>
            <br />
            The Future of AI-Powered Shopping
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            Discover the next generation of online shopping with ShopAi. Explore thousands of
            premium products, discover personalized recommendations powered by artificial
            intelligence, compare prices, and enjoy a fast, secure, and seamless shopping
            experience. Shop smarter, discover more, and experience the future of E-Commerce.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <a href="#featured" className="btn-primary text-base">
              <ShoppingBag size={20} />
              Shop Now
            </a>
            <a href="#ai-assistant" className="btn-secondary text-base">
              <Zap size={20} />
              Explore AI Features
            </a>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            {[
              { label: "Products", value: "10K+" },
              { label: "AI Recommendations", value: "1M+" },
              { label: "Happy Customers", value: "50K+" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="font-display text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Featured Products Section */}
      <section id="featured" className="section-padding">
        <div className="container-max">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
              <TrendingUp size={14} className="text-violet-400" />
              <span className="text-sm text-violet-200">Featured Products</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Discover Premium Products
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Hand-picked products with the best ratings and value, curated by our AI engine.
            </p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="glass-dark h-96 animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featured.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
      </div>
      </section>

      {/* Product Categories Section */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
              <Cpu size={14} className="text-violet-400" />
              <span className="text-sm text-violet-200">Categories</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Shop by Category
            </h2>
            <p className="mt-3 text-gray-400 max-w-2xl mx-auto">
              Explore our wide range of product categories, from electronics to smart home.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon] ?? Cpu;
              return (
                <div
                  key={cat.id}
                  className="group glass-dark p-6 cursor-pointer transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-600/10 hover:-translate-y-1"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-violet-600/20 mb-4 transition-transform group-hover:scale-110">
                    <Icon size={24} className="text-white" />
                  </div>
                  <h3 className="font-display font-semibold text-white">{cat.name}</h3>
                  <p className="mt-1 text-xs text-gray-400">{cat.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* AI Shopping Assistant Section */}
      <section id="ai-assistant" className="section-padding">
        <div className="container-max">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
                <Bot size={14} className="text-violet-400" />
                <span className="text-sm text-violet-200">AI Shopping Assistant</span>
              </div>
              <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
                Your Personal AI Shopping Companion
              </h2>
              <p className="mt-4 text-gray-400 leading-relaxed">
                Our AI-powered shopping assistant helps you find the perfect products, compare
                specifications, and receive personalized recommendations tailored to your
                preferences. Just ask a question and let AI do the work.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  { icon: Brain, title: "Smart Recommendations", desc: "Get personalized product suggestions based on your preferences." },
                  { icon: TrendingUp, title: "Price Comparisons", desc: "Compare prices and features across products instantly." },
                  { icon: Zap, title: "Instant Answers", desc: "Ask about any product and get detailed information in seconds." },
                ].map((item) => (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-600/20">
                      <item.icon size={20} className="text-violet-300" />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{item.title}</h4>
                      <p className="text-sm text-gray-400">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <AIAssistant />
            </div>
          </div>
        </div>
      </section>

      {/* About ShopAi Section */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
              <Code2 size={14} className="text-violet-400" />
              <span className="text-sm text-violet-200">About ShopAi</span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-white">
              Built with Modern Engineering
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Code2,
                title: "Full-Stack Development",
                desc: "React, TypeScript, Vite, and Tailwind CSS on the frontend. Node.js with Supabase for a scalable, real-time backend that handles thousands of products and users.",
              },
              {
                icon: Shield,
                title: "Software Engineering",
                desc: "Clean architecture, reusable components, REST API endpoints, secure authentication, type-safe database models, and comprehensive error handling throughout.",
              },
              {
                icon: Brain,
                title: "AI Engineering",
                desc: "Server-side AI integration for product recommendations, intelligent search, and a shopping chatbot. API keys stay secure on the server — never exposed to the browser.",
              },
            ].map((item) => (
              <div key={item.title} className="glass-dark p-8">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-violet-600/20 mb-6">
                  <item.icon size={28} className="text-white" />
                </div>
                <h3 className="font-display text-xl font-semibold text-white mb-3">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/about" className="btn-secondary">
              Learn More About ShopAi
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
