import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, User, Link as LinkIcon, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import type { ChatMessage } from "@/types";
import type { Product } from "@/types";
import { useProducts } from "@/hooks/useProducts";
import { StarRating } from "@/components/StarRating";
import { supabase } from "@/lib/supabase";

const SUGGESTIONS = [
  "Find me a gaming laptop under $1500",
  "Compare iPhone and Samsung",
  "Recommend the best headphones for gaming",
  "Show me products under $200",
];

interface AIResponse {
  text: string;
  products: Product[];
}

export function AIAssistant() {
  const [messages, setMessages] = useState<(ChatMessage & { products?: Product[] })[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI shopping assistant. Ask me about products, compare specs, or get personalized recommendations. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const extractBudget = (query: string): number | null => {
    const match = query.match(/\$?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    if (!match) return null;
    const amount = parseFloat(match[1].replace(/,/g, ""));
    if (query.match(/under|below|less than|cheaper than|max/i)) return amount;
    if (query.match(/around|about|approximately|~|\?/i)) return amount * 1.1;
    return null;
  };

  const extractCategory = (query: string): string | null => {
    const lower = query.toLowerCase();
    const catMap: Record<string, string[]> = {
      "Smartphones": ["phone", "smartphone", "iphone", "samsung", "android", "galaxy", "pixel"],
      "Laptops": ["laptop", "notebook", "macbook", "ultrabook"],
      "Gaming PCs": ["gaming pc", "desktop", "battlestation", "gaming rig"],
      "Graphics Cards": ["gpu", "graphics card", "rtx", "geforce", "radeon"],
      "Headphones": ["headphone", "earbud", "earphone", "audio", "headset"],
      "Smart Watches": ["watch", "smartwatch", "fitness tracker"],
      "Fashion": ["hoodie", "fashion", "apparel", "clothing", "wear"],
      "Electronics": ["speaker", "smart home", "electronics", "gadget"],
      "Accessories": ["keyboard", "mouse", "charger", "charging", "accessories"],
    };
    for (const [cat, keywords] of Object.entries(catMap)) {
      if (keywords.some((kw) => lower.includes(kw))) return cat;
    }
    return null;
  };

  const generateResponse = (query: string): AIResponse => {
    const lower = query.toLowerCase();
    const budget = extractBudget(lower);
    const category = extractCategory(lower);

    let matches = products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower);
      const catMatch = category ? p.category === category : false;
      const keywordMatch = lower.split(" ").some((word) => word.length > 3 && (p.name.toLowerCase().includes(word) || p.description.toLowerCase().includes(word)));
      return nameMatch || catMatch || keywordMatch;
    });

    if (budget !== null) {
      matches = matches.filter((p) => p.price <= budget);
    }

    if (matches.length === 0) {
      if (budget !== null) {
        const alternatives = [...products].sort((a, b) => a.price - b.price).slice(0, 3);
        return {
          text: `I couldn't find products under $${budget.toFixed(2)}${category ? ` in ${category}` : ""}. Here are the most affordable options I found:`,
          products: alternatives,
        };
      }
      return {
        text: "I'd be happy to help! Try asking about specific categories like Smartphones, Laptops, Headphones, or Gaming PCs. You can also mention a budget, like \"gaming laptop under $1500\".",
        products: [],
      };
    }

    if (lower.includes("compare")) {
      const top2 = matches.slice(0, 2);
      const comparison = top2
        .map((p) => `${p.name} (${p.brand}): $${p.price.toFixed(2)}, ${p.rating}★`)
        .join("\n");
      return {
        text: `Here's a quick comparison:\n\n${comparison}\n\nThe first option offers ${top2[0].rating > top2[1]?.rating ? "a higher rating" : "better value"}, while the second ${top2[1] && top2[1].price < top2[0].price ? "is more affordable" : "has solid specs"}.`,
        products: top2,
      };
    }

    if (lower.includes("recommend") || lower.includes("best")) {
      const top = [...matches].sort((a, b) => b.rating - a.rating).slice(0, 4);
      return {
        text: `Here are my top recommendations${category ? ` for ${category}` : ""}${budget ? ` under $${budget.toFixed(2)}` : ""}, ranked by rating:`,
        products: top,
      };
    }

    const top = matches.slice(0, 4);
    return {
      text: `Based on your query, here are some products I found${category ? ` in ${category}` : ""}${budget ? ` under $${budget.toFixed(2)}` : ""}:`,
      products: top,
    };
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage & { products?: Product[] } = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-assistant`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          message: userMsg.content,
          products: products.map((p) => ({
            name: p.name,
            price: p.price,
            rating: p.rating,
            category: p.category,
            description: p.description,
          })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          setAiConfigured(true);
          const demo = generateDemoResponse(userMsg.content);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply, timestamp: Date.now(), products: demo.products },
          ]);
          setLoading(false);
          return;
        }
      }
      setAiConfigured(false);
    } catch {
      setAiConfigured(false);
    }

    await new Promise((r) => setTimeout(r, 600));
    const demoResponse = generateDemoResponse(userMsg.content);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: demoResponse.text,
        timestamp: Date.now(),
        products: demoResponse.products,
      },
    ]);
    setLoading(false);
  };

  const generateDemoResponse = (query: string): AIResponse => {
    const lower = query.toLowerCase();
    const budget = extractBudget(lower);
    const category = extractCategory(lower);

    let matches = products.filter((p) => {
      const nameMatch = p.name.toLowerCase().includes(lower) || p.description.toLowerCase().includes(lower);
      const catMatch = category ? p.category === category : false;
      const keywordMatch = lower.split(" ").some((word) => word.length > 3 && (p.name.toLowerCase().includes(word) || p.description.toLowerCase().includes(word)));
      return nameMatch || catMatch || keywordMatch;
    });

    if (budget !== null) {
      matches = matches.filter((p) => p.price <= budget);
    }

    if (matches.length === 0) {
      if (budget !== null) {
        const alternatives = [...products].sort((a, b) => a.price - b.price).slice(0, 3);
        return {
          text: `I couldn't find products under $${budget.toFixed(2)}${category ? ` in ${category}` : ""}. Here are the most affordable options available:`,
          products: alternatives,
        };
      }
      return {
        text: "I'd be happy to help! Try asking about specific categories like Smartphones, Laptops, Headphones, or Gaming PCs. You can also mention a budget, like \"gaming laptop under $1500\".",
        products: [],
      };
    }

    if (lower.includes("compare")) {
      const top2 = matches.slice(0, 2);
      const comparison = top2
        .map((p) => `${p.name} (${p.brand}): $${p.price.toFixed(2)}, ${p.rating}★`)
        .join("\n");
      return {
        text: `Here's a quick comparison:\n\n${comparison}\n\nCheck the product pages for full specifications, or use our comparison tool for a side-by-side breakdown.`,
        products: top2,
      };
    }

    if (lower.includes("recommend") || lower.includes("best")) {
      const top = [...matches].sort((a, b) => b.rating - a.rating).slice(0, 4);
      return {
        text: `Here are my top recommendations${category ? ` for ${category}` : ""}${budget ? ` under $${budget.toFixed(2)}` : ""}, ranked by rating:`,
        products: top,
      };
    }

    const top = matches.slice(0, 4);
    return {
      text: `Based on your query, here are some products I found${category ? ` in ${category}` : ""}${budget ? ` under $${budget.toFixed(2)}` : ""}:`,
      products: top,
    };
  };

  return (
    <div className="glass-dark overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-white/10 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-violet-600/30">
          <Bot size={22} className="text-white" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-white">AI Shopping Assistant</h3>
          <p className="text-xs text-violet-300 flex items-center gap-1">
            <Sparkles size={12} />
            {aiConfigured === false ? "Demo Mode — AI not configured" : "Powered by ShopAi AI"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-80 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 animate-fade-in-up ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${msg.role === "user" ? "bg-blue-600/30" : "bg-violet-600/30"}`}>
              {msg.role === "user" ? <User size={16} className="text-blue-300" /> : <Bot size={16} className="text-violet-300" />}
            </div>
            <div className={`max-w-[85%] ${msg.role === "user" ? "" : "w-full"}`}>
              <div className={`rounded-2xl px-4 py-3 text-sm whitespace-pre-line ${msg.role === "user" ? "bg-blue-600/20 text-gray-100" : "bg-white/5 text-gray-200"}`}>
                {msg.content}
              </div>
              {/* Product cards in AI response */}
              {msg.products && msg.products.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.products.map((product) => (
                    <Link
                      key={product.id}
                      to={`/product/${product.id}`}
                      className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3 transition-all hover:border-violet-500/30 hover:bg-violet-600/10 group"
                    >
                      <img src={product.image_url} alt={product.name} className="h-12 w-12 rounded-lg object-cover shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-white truncate">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.brand}</p>
                        <StarRating rating={product.rating} size={12} />
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-display text-sm font-bold gradient-text">${product.price.toFixed(2)}</p>
                        <span className="text-xs text-violet-300 group-hover:text-violet-200 flex items-center gap-1">
                          <LinkIcon size={10} />
                          View
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 animate-fade-in">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/30">
              <Bot size={16} className="text-violet-300" />
            </div>
            <div className="rounded-2xl bg-white/5 px-4 py-3">
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-2 w-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Config notice */}
      {aiConfigured === false && (
        <div className="px-5 pb-3">
          <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-xs text-amber-200">
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>AI API credentials are not configured. Responses are generated by a local rule-based engine and labeled as demo mode.</span>
          </div>
        </div>
      )}

      {/* Suggestions */}
      {messages.length <= 1 && (
        <div className="px-5 pb-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="rounded-full bg-white/5 px-3 py-1.5 text-xs text-violet-200 hover:bg-violet-600/20 transition-all"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-white/10 p-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Ask me anything about products..."
            className="input-field !py-2.5"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="btn-primary !px-4 !py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Send message"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
