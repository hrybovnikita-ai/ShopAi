import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Bot, Loader2, Send, Sparkles, Trash2, User, X } from "lucide-react";
import { apiRequest } from "@/lib/api";
import { useProducts } from "@/hooks/useProducts";
import { AssistantProductCard } from "./AssistantProductCard";
import type { AssistantProduct, AssistantReply } from "@/types";

interface UiMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: AssistantProduct[];
  suggestions?: string[];
  setupHint?: string | null;
  error?: boolean;
  animate?: boolean;
}

interface AssistantStatus {
  configured: boolean;
  model: string | null;
  setupHint: string | null;
}

const STARTERS = [
  "Headphones under $200",
  "Best laptop for coding",
  "Something for my gaming setup",
  "Gift ideas under $100",
];

const GREETING =
  "Hi! I'm the ShopAi assistant. Tell me your budget, what you'll use it for, or the category you're browsing and I'll pull matching products from the live catalog.";

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function TypewriterText({ text, animate }: { text: string; animate?: boolean }) {
  const [visible, setVisible] = useState(() => (animate && !prefersReducedMotion() ? 0 : text.length));

  useEffect(() => {
    if (!animate || prefersReducedMotion()) {
      setVisible(text.length);
      return;
    }
    let index = 0;
    const timer = setInterval(() => {
      index = Math.min(text.length, index + 3);
      setVisible(index);
      if (index >= text.length) clearInterval(timer);
    }, 16);
    return () => clearInterval(timer);
  }, [text, animate]);

  const shown = text.slice(0, visible);
  return (
    <span className="whitespace-pre-line">
      {shown}
      {visible < text.length && <span className="ml-0.5 inline-block h-4 w-1 animate-pulse bg-violet-400/70 align-middle" />}
    </span>
  );
}

export function FloatingAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UiMessage[]>([
    { id: "greeting", role: "assistant", content: GREETING, suggestions: STARTERS },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<AssistantStatus | null>(null);
  const [lastFailed, setLastFailed] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { products } = useProducts();

  const catalogNames = useMemo(() => products.slice(0, 3).map((product) => product.name), [products]);

  useEffect(() => {
    apiRequest<AssistantStatus>("/assistant/status")
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  // Home and other surfaces can open the assistant with a custom event.
  useEffect(() => {
    const openAssistant = () => setOpen(true);
    window.addEventListener("shopai:open-assistant", openAssistant);
    return () => window.removeEventListener("shopai:open-assistant", openAssistant);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    const timer = setTimeout(() => inputRef.current?.focus(), 250);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      clearTimeout(timer);
    };
  }, [open]);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) node.scrollTo({ top: node.scrollHeight, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [messages, loading, open]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || loading) return;

      const history = messages
        .filter((message) => !message.error)
        .slice(-6)
        .map((message) => ({ role: message.role, content: message.content }));

      setMessages((prev) => [
        ...prev,
        { id: `u-${Date.now()}`, role: "user", content: text },
      ]);
      setInput("");
      setLoading(true);
      setLastFailed(null);

      try {
        const reply = await apiRequest<AssistantReply>("/assistant/chat", {
          method: "POST",
          body: { message: text, history },
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            content: reply.reply,
            products: reply.products,
            suggestions: reply.suggestions,
            setupHint: reply.setupHint,
            animate: reply.configured,
          },
        ]);
      } catch (error) {
        setLastFailed(text);
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            content:
              error instanceof Error && error.message
                ? error.message
                : "The assistant could not answer right now.",
            error: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages],
  );

  const retry = () => {
    if (lastFailed) {
      setMessages((prev) => prev.filter((message) => !message.error));
      void send(lastFailed);
    }
  };

  const clearChat = () => {
    setMessages([{ id: "greeting", role: "assistant", content: GREETING, suggestions: STARTERS }]);
    setLastFailed(null);
  };

  const setupNeeded = status ? !status.configured : false;

  return (
    <>
      {/* Floating launcher */}
      <button
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "Close AI shopping assistant" : "Open AI shopping assistant"}
        aria-expanded={open}
        className="fixed bottom-24 right-4 z-[70] flex h-14 items-center gap-2 rounded-full px-4 text-sm font-semibold text-white shadow-2xl shadow-violet-700/40 transition-all duration-300 hover:scale-105 sm:bottom-6 sm:right-6 sm:h-16 sm:w-16 sm:justify-center sm:px-0"
        style={{ background: "linear-gradient(135deg, #7c2dff 0%, #2d7fff 100%)" }}
      >
        {open ? <X size={22} /> : <Bot size={22} />}
        <span className="sm:hidden">{open ? "Close" : "Ask AI"}</span>
        {!open && (
          <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-400 ring-2 ring-ink-950" />
        )}
      </button>

      {/* Panel */}
      {open && (
        <aside
          role="dialog"
          aria-label="AI shopping assistant"
          className="fixed inset-x-3 bottom-3 top-20 z-[65] flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-ink-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl animate-fade-in-up sm:inset-x-auto sm:bottom-24 sm:right-6 sm:top-auto sm:h-[600px] sm:w-[400px]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-gradient-to-r from-violet-600/20 to-blue-600/10 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-violet-600/30">
              <Bot size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-sm font-semibold text-white">ShopAi Assistant</h2>
              <p className="flex items-center gap-1 text-[11px] text-violet-200">
                {status == null ? (
                  <>
                    <Loader2 size={10} className="animate-spin" />
                    Checking assistant…
                  </>
                ) : status.configured ? (
                  <>
                    <Sparkles size={10} />
                    AI connected · {status.model}
                  </>
                ) : (
                  <>
                    <AlertTriangle size={10} className="text-amber-300" />
                    AI provider not configured
                  </>
                )}
              </p>
            </div>
            <button
              onClick={clearChat}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Clear conversation"
            >
              <Trash2 size={16} />
            </button>
            <button
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              aria-label="Close assistant"
            >
              <X size={18} />
            </button>
          </div>

          {/* Setup requirement */}
          {setupNeeded && (
            <div className="border-b border-amber-500/20 bg-amber-500/10 px-4 py-2.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                AI provider required
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-100/80">
                The assistant is connected to the live catalog, but conversational answers need an AI
                provider. {status?.setupHint}
              </p>
            </div>
          )}

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-2.5 animate-fade-in-up ${message.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div
                  className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    message.role === "user" ? "bg-blue-600/30" : "bg-violet-600/30"
                  }`}
                >
                  {message.role === "user" ? (
                    <User size={15} className="text-blue-300" />
                  ) : (
                    <Bot size={15} className="text-violet-300" />
                  )}
                </div>
                <div className={`min-w-0 max-w-[85%] space-y-2 ${message.role === "user" ? "text-right" : ""}`}>
                  <div
                    className={`inline-block rounded-2xl px-3.5 py-2.5 text-left text-sm leading-relaxed ${
                      message.role === "user"
                        ? "bg-blue-600/25 text-gray-100"
                        : message.error
                          ? "border border-red-500/30 bg-red-500/10 text-red-100"
                          : "bg-white/5 text-gray-200"
                    }`}
                  >
                    {message.role === "assistant" ? (
                      <TypewriterText text={message.content} animate={message.animate} />
                    ) : (
                      message.content
                    )}

                    {message.error && lastFailed && (
                      <button
                        onClick={retry}
                        className="mt-2 block rounded-lg bg-red-500/20 px-2.5 py-1 text-xs font-medium text-red-100 hover:bg-red-500/30"
                      >
                        Try again
                      </button>
                    )}
                  </div>

                  {message.products && message.products.length > 0 && (
                    <div className="space-y-2">
                      {message.products.map((product) => (
                        <AssistantProductCard
                          key={product.id}
                          product={product}
                          onAsk={(question) => void send(question)}
                        />
                      ))}
                    </div>
                  )}

                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {message.suggestions.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => void send(suggestion)}
                          disabled={loading}
                          className="rounded-full border border-violet-500/30 bg-violet-600/10 px-2.5 py-1 text-[11px] text-violet-100 transition-colors hover:bg-violet-600/25 disabled:opacity-50"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2.5 animate-fade-in">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600/30">
                  <Bot size={15} className="text-violet-300" />
                </div>
                <div className="rounded-2xl bg-white/5 px-4 py-3">
                  <div className="flex gap-1" aria-label="Assistant is thinking">
                    {[0, 1, 2].map((index) => (
                      <span
                        key={index}
                        className="h-2 w-2 rounded-full bg-violet-400 animate-bounce"
                        style={{ animationDelay: `${index * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {messages.length === 1 && !loading && catalogNames.length > 0 && (
              <p className="px-1 text-[11px] text-gray-500">
                Tip: the assistant can only recommend real catalog items — currently {catalogNames.join(", ")}
                {" "}and more in the shop.
              </p>
            )}
          </div>

          {/* Composer */}
          <form
            onSubmit={(event) => {
              event.preventDefault();
              void send(input);
            }}
            className="border-t border-white/10 p-3"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask about products, budgets, use cases…"
                aria-label="Message the shopping assistant"
                maxLength={500}
                disabled={loading}
                className="input-field !py-2.5 text-sm"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-primary !px-3.5 !py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </div>
            <p className="mt-1.5 text-center text-[10px] text-gray-500">
              Recommendations come from the store catalog. Prices and stock are always live.
            </p>
          </form>
        </aside>
      )}
    </>
  );
}
