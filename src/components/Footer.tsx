import { Link } from "react-router-dom";
import { Sparkles, Twitter, Github, Instagram, Linkedin, Mail } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink-950/80 backdrop-blur-xl">
      <div className="container-max px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl gradient-bg">
                <Sparkles size={20} className="text-white" />
              </div>
              <span className="font-display text-xl font-bold text-white">
                Shop<span className="gradient-text">Ai</span>
              </span>
            </Link>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              ShopAi is the next generation of online shopping — powered by artificial intelligence.
              Discover personalized recommendations, compare products, and shop smarter with a seamless,
              secure experience.
            </p>
            <div className="flex gap-3 mt-6">
              {[Twitter, Github, Instagram, Linkedin, Mail].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="flex h-10 w-10 items-center justify-center rounded-lg glass hover:bg-violet-600/20 hover:border-violet-500/40 transition-all duration-300"
                  aria-label="Social link"
                >
                  <Icon size={18} className="text-gray-300" />
                </a>
              ))}
            </div>
          </div>

          {/* Navigation links */}
          <div>
            <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Navigation
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Home", path: "/" },
                { label: "AI Search", path: "/discover" },
                { label: "About", path: "/about" },
                { label: "Pricing", path: "/pricing" },
                { label: "Contacts", path: "/contacts" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 hover:text-violet-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer support */}
          <div>
            <h4 className="font-display text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Support
            </h4>
            <ul className="space-y-3">
              {[
                { label: "Wishlist", path: "/wishlist" },
                { label: "Order History", path: "/orders" },
                { label: "My Dashboard", path: "/dashboard" },
                { label: "Compare Products", path: "/compare" },
              ].map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-sm text-gray-400 hover:text-violet-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              {["Help Center", "Track Order", "Returns", "Shipping Info", "FAQ"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="text-sm text-gray-400 hover:text-violet-300 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500">
            © 2026 ShopAi. All rights reserved.
          </p>
          <div className="flex gap-6">
            <a href="#" className="text-sm text-gray-500 hover:text-violet-300 transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-gray-500 hover:text-violet-300 transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
