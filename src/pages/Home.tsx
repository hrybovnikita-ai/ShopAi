import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Sparkles,
  ShoppingBag,
  Zap,
  Cpu,
  Smartphone,
  Laptop,
  Monitor,
  Headphones,
  Watch,
  Shirt,
  Mouse,
  ArrowRight,
  Bot,
  Code2,
  Brain,
  Shield,
  TrendingUp,
  Flame,
  Clock,
  Star,
  Quote,
  Mail,
  ChevronDown,
  CheckCircle2,
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import { AIAssistant } from "@/components/AIAssistant";
import { useProducts } from "@/hooks/useProducts";
import { useCart } from "@/context/CartContext";
import { CATEGORIES, DISCOUNT_CODES } from "@/data/catalog";
import { useToast } from "@/components/Toast";

const CATEGORY_ICONS: Record<string, typeof Cpu> = {
  Smartphone,
  Laptop,
  Monitor,
  Cpu,
  Headphones,
  Watch,
  Shirt,
  Zap,
  Mouse,
};

function hasDiscount(p: { original_price?: number | null; price: number }) {
  return p.original_price != null && p.original_price > p.price;
}

function SectionHeader({ badge, badgeIcon: Icon, title, subtitle }: { badge: string; badgeIcon: typeof Cpu; title: string; subtitle: string }) {
  return (
    <div className="text-center mb-12">
      <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
        <Icon size={14} className="text-violet-400" />
        <span className="text-sm text-violet-200">{badge}</span>
      </div>
      <h2 className="font-display text-3xl md:text-4xl font-bold text-white">{title}</h2>
      <p className="mt-3 text-gray-400 max-w-2xl mx-auto">{subtitle}</p>
    </div>
  );
}

function ProductGrid({ products }: { products: typeof FALLBACK_PRODUCTS }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// Need to import for type reference in ProductGrid
import { FALLBACK_PRODUCTS } from "@/data/catalog";

const FAQ_ITEMS = [
  { q: "How does the AI shopping assistant work?", a: "Our AI assistant searches the live product catalog, compares specifications, and provides personalized recommendations based on your budget and preferences. When no AI API key is configured, it uses a rule-based engine clearly labeled as demo mode." },
  { q: "Is the checkout process real?", a: "No. The checkout is a safe demonstration. No real payment is processed and no card credentials are stored. A demo order is generated and saved so you can see the full purchase flow." },
  { q: "Can I compare products side by side?", a: "Yes. Use the compare button on any product card to add it to the comparison bar. You can compare up to four products at /compare with full specification tables." },
  { q: "Does my cart persist between visits?", a: "Yes. Your cart and wishlist are saved in your browser so they survive page refreshes and return visits." },
  { q: "What are the demo discount codes?", a: "Use SHOPAI10 for 10% off, WELCOME20 for 20% off, and FLASH50 for 50% off at checkout. These are demonstration codes only." },
];

const DEMO_REVIEWS = [
  { author: "Sarah Mitchell", rating: 5, text: "ShopAi completely changed how I shop online. The AI recommendations are spot on — I found the perfect headphones in seconds instead of scrolling for hours. (Demo review)", avatar: "S" },
  { author: "James Kim", rating: 5, text: "The product comparison tool is brilliant. I was able to compare three gaming laptops side by side and pick the best one for my budget. (Demo review)", avatar: "J" },
  { author: "Emily Rodriguez", rating: 4, text: "Love the sleek dark interface and how fast everything loads. The flash sales section got me an amazing deal on a new phone. (Demo review)", avatar: "E" },
  { author: "David Chen", rating: 5, text: "The checkout process was seamless and the demo payment system is clearly labeled. Great to see an e-commerce site that is transparent about what is real and what is a demo. (Demo review)", avatar: "D" },
];

export function Home() {
  const { products, loading } = useProducts();
  const { push } = useToast();
  const [faqOpen, setFaqOpen] = useState<number | null>(0);
  const [emailInput, setEmailInput] = useState("");

  const featured = products.slice(0, 8);
  const trending = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const flashSales = products.filter(hasDiscount).slice(0, 4);
  const newArrivals = products.slice(-4);
  const bestSellers = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);
  const recommended = products.filter((p) => p.category === "Headphones" || p.category === "Smartphones").slice(0, 4);

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;
    push("Thanks for subscribing! (Demo — no email was actually sent.)", "success");
    setEmailInput("");
  };

  return (
    <div>
      {/* Hero Section */}
      <header className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl animate-pulse-glow" />
          <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-violet-500/10 blur-3xl" />
        </div>

        <div className="absolute top-20 left-10 animate-float">
          <div className="glass p-3 rotate-12"><Cpu size={28} className="text-violet-400" /></div>
        </div>
        <div className="absolute top-32 right-16 animate-float-delayed">
          <div className="glass p-3 -rotate-6"><Smartphone size={28} className="text-blue-400" /></div>
        </div>
        <div className="absolute bottom-40 left-20 animate-float" style={{ animationDelay: "3s" }}>
          <div className="glass p-3 rotate-6"><Headphones size={28} className="text-violet-300" /></div>
        </div>
        <div className="absolute bottom-32 right-12 animate-float-delayed" style={{ animationDelay: "4s" }}>
          <div className="glass p-3 -rotate-12"><Watch size={28} className="text-blue-300" /></div>
        </div>

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

      {/* Featured Products */}
      <section id="featured" className="section-padding">
        <div className="container-max">
          <SectionHeader badge="Featured Products" badgeIcon={TrendingUp} title="Discover Premium Products" subtitle="Hand-picked products with the best ratings and value, curated by our AI engine." />
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => <div key={i} className="glass-dark h-96 animate-pulse" />)}
            </div>
          ) : (
            <ProductGrid products={featured} />
          )}
        </div>
      </section>

      {/* Trending Now */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max">
          <SectionHeader badge="Trending Now" badgeIcon={Flame} title="What Everyone is Buying" subtitle="The most popular products right now, ranked by customer ratings and sales velocity." />
          <ProductGrid products={trending} />
        </div>
      </section>

      {/* Flash Sales */}
      {flashSales.length > 0 && (
        <section className="section-padding">
          <div className="container-max">
            <SectionHeader badge="Flash Sales" badgeIcon={Clock} title="Limited-Time Deals" subtitle="Grab these discounted products before the timer runs out. Demo discounts — no real charges." />
            <div className="mb-8 flex justify-center">
              <div className="glass-dark px-6 py-3 flex items-center gap-3">
                <Clock size={20} className="text-violet-400" />
                <span className="text-sm text-gray-400">Sale ends in:</span>
                <span className="font-display text-lg font-bold text-white">24:00:00</span>
              </div>
            </div>
            <ProductGrid products={flashSales} />
          </div>
        </section>
      )}

      {/* Shop by Category */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max">
          <SectionHeader badge="Categories" badgeIcon={Cpu} title="Shop by Category" subtitle="Explore our wide range of product categories, from smartphones to fashion." />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICONS[cat.icon] ?? Cpu;
              return (
                <div key={cat.id} className="group glass-dark p-6 cursor-pointer transition-all duration-300 hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-600/10 hover:-translate-y-1">
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

      {/* New Arrivals */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeader badge="New Arrivals" badgeIcon={Sparkles} title="Just Landed" subtitle="The latest additions to our catalog, fresh from our suppliers." />
          <ProductGrid products={newArrivals} />
        </div>
      </section>

      {/* Best Sellers */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max">
          <SectionHeader badge="Best Sellers" badgeIcon={Star} title="Customer Favorites" subtitle="The products our customers love the most, with the highest ratings and most reviews." />
          <ProductGrid products={bestSellers} />
        </div>
      </section>

      {/* AI Shopping Assistant */}
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
                  { icon: Brain, title: "Smart Recommendations", desc: "Get personalized product suggestions based on your preferences and budget." },
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

      {/* Recommended for You */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max">
          <SectionHeader badge="Recommended for You" badgeIcon={Brain} title="Picked Just for You" subtitle="Based on popular categories and trending products, here is what our AI thinks you will love." />
          <ProductGrid products={recommended} />
        </div>
      </section>

      {/* Why Choose ShopAi */}
      <section className="section-padding">
        <div className="container-max">
          <SectionHeader badge="Why ShopAi" badgeIcon={Shield} title="Why Choose ShopAi" subtitle="We combine cutting-edge technology with a human-centered shopping experience." />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "AI-Powered", desc: "Personalized recommendations and intelligent search powered by artificial intelligence." },
              { icon: Shield, title: "Secure & Transparent", desc: "Demo payments clearly labeled, no real charges, and your data stays safe." },
              { icon: Zap, title: "Fast & Seamless", desc: "Lightning-fast browsing, instant search, and a smooth checkout experience." },
              { icon: TrendingUp, title: "Best Prices", desc: "Competitive pricing with demo discount codes and flash sales on top products." },
              { icon: CheckCircle2, title: "Quality Products", desc: "Every product is curated from trusted brands with verified ratings and reviews." },
              { icon: ShoppingBag, title: "Smart Cart", desc: "Your cart and wishlist persist across visits, with easy quantity management." },
            ].map((item) => (
              <div key={item.title} className="glass-dark p-8">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-violet-600/20 mb-4">
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="font-display text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max">
          <SectionHeader badge="Reviews" badgeIcon={Quote} title="What Our Customers Say" subtitle="Demo reviews from fictional customers — shown to illustrate the review experience." />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {DEMO_REVIEWS.map((review, idx) => (
              <div key={idx} className="glass-dark p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full gradient-bg text-lg font-bold text-white shadow-lg shadow-violet-600/30">
                    {review.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-white">{review.author}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} size={12} className={s <= review.rating ? "fill-violet-400 text-violet-400" : "fill-ink-700 text-ink-600"} />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">{review.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="section-padding">
        <div className="container-max">
          <div className="glass-dark p-12 text-center max-w-2xl mx-auto">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-violet-600/30 mb-6">
              <Mail size={28} className="text-white" />
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-white">
              Subscribe to Our Newsletter
            </h2>
            <p className="mt-3 text-gray-400">
              Get the latest deals, new arrivals, and AI-powered recommendations delivered to your inbox. (Demo — no email is actually sent.)
            </p>
            <form onSubmit={handleNewsletter} className="mt-6 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                required
                placeholder="you@example.com"
                className="input-field flex-1"
              />
              <button type="submit" className="btn-primary whitespace-nowrap">
                <Mail size={18} />
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="section-padding bg-ink-900/30">
        <div className="container-max max-w-3xl">
          <SectionHeader badge="FAQ" badgeIcon={Sparkles} title="Frequently Asked Questions" subtitle="Everything you need to know about ShopAi and how it works." />
          <div className="space-y-3">
            {FAQ_ITEMS.map((item, idx) => (
              <div key={idx} className="glass-dark overflow-hidden">
                <button
                  onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left"
                >
                  <span className="font-medium text-white">{item.q}</span>
                  <ChevronDown
                    size={20}
                    className={`text-violet-400 transition-transform duration-300 ${faqOpen === idx ? "rotate-180" : ""}`}
                  />
                </button>
                {faqOpen === idx && (
                  <div className="px-5 pb-5 text-sm text-gray-400 leading-relaxed animate-fade-in">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About ShopAi */}
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
              { icon: Code2, title: "Full-Stack Development", desc: "React, TypeScript, Vite, and Tailwind CSS on the frontend. Supabase for a scalable, real-time backend that handles thousands of products and users." },
              { icon: Shield, title: "Software Engineering", desc: "Clean architecture, reusable components, REST API endpoints, secure authentication, type-safe database models, and comprehensive error handling throughout." },
              { icon: Brain, title: "AI Engineering", desc: "Server-side AI integration for product recommendations, intelligent search, and a shopping chatbot. API keys stay secure on the server — never exposed to the browser." },
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
