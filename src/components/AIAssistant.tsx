import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/types";
import { useProducts } from "@/hooks/useProducts";
import { supabase } from "@/lib/supabase";

const SUGGESTIONS = [
  "What are the best headphones?",
  "Show me gaming products",
  "I need a new laptop for work",
  "Compare smartphones under $1000",
];

export function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: "Hi! I'm your AI shopping assistant. Ask me about products, compare specs, or get personalized recommendations. How can I help you today?",
      timestamp: Date.now(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const generateDemoResponse = (query: string): string => {
    const lower = query.toLowerCase();

    // Search products by keyword
    const matches = products.filter(
      (p) =>
        p.name.toLowerCase().includes(lower) ||
        p.description.toLowerCase().includes(lower) ||
        p.category.toLowerCase().includes(lower)
    );

    if (matches.length > 0) {
      const top = matches.slice(0, 3);
      const list = top
        .map((p) => `• ${p.name} — $${p.price.toFixed(2)} (${p.rating}★)`)
        .join("\n");
      return `Based on your query, here are some products I found:\n\n${list}\n\nWould you like more details on any of these?`;
    }

    if (lower.includes("compare")) {
      const top2 = products.slice(0, 2);
      return `Here's a quick comparison:\n\n${top2[0].name}: $${top2[0].price}, ${top2[0].rating}★\n${top2[1].name}: $${top2[1].price}, ${top2[1].rating}★\n\nThe first option offers better value, while the second has a higher rating.`;
    }

    if (lower.includes("recommend") || lower.includes("best")) {
      const top = [...products].sort((a, b) => b.rating - a.rating).slice(0, 3);
      return `Here are my top recommendations based on ratings:\n\n${top
        .map((p) => `• ${p.name} — $${p.price.toFixed(2)} (${p.rating}★)`)
        .join("\n")}`;
    }

    return `I'd be happy to help with that! You can browse our featured products on this page, or ask me about specific categories like Electronics, Gaming, Computers, or Smart Home. Try asking "What are the best headphones?" or "Show me gaming products".`;
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: "user",
      content: input.trim(),
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      // Try edge function first
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
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.reply, timestamp: Date.now() },
          ]);
          setLoading(false);
          return;
        }
      }
    } catch {
      // Fall through to demo
    }

    // Demo fallback — clearly labeled
    await new Promise((r) => setTimeout(r, 800));
    const demoResponse = generateDemoResponse(userMsg.content);
    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: `[Demo Mode] ${demoResponse}`,
        timestamp: Date.now(),
      },
    ]);
    setLoading(false);
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
            Powered by ShopAi AI
          </p>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="h-80 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in-up ${
              msg.role === "user" ? "flex-row-reverse" : ""
            }`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                msg.role === "user"
                  ? "bg-blue-600/30"
                  : "bg-violet-600/30"
              }`}
            >
              {msg.role === "user" ? (
                <User size={16} className="text-blue-300" />
              ) : (
                <Bot size={16} className="text-violet-300" />
              )}
            </div>
            <div
              className={`rounded-2xl px-4 py-3 text-sm max-w-[80%] whitespace-pre-line ${
                msg.role === "user"
                  ? "bg-blue-600/20 text-gray-100"
                  : "bg-white/5 text-gray-200"
              }`}
            >
              {msg.content}
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
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

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
