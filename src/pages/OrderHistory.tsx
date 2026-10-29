import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, ArrowRight, ChevronDown, ChevronUp, Clock, CheckCircle2, Truck, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { formatCurrency, formatDateTime } from "@/lib/format";
import type { AdminOrder } from "@/types/admin";

type OrderRow = AdminOrder & { order_items?: { id: string; name: string; unit_price: number; quantity: number }[] };

const STATUS_CONFIG: Record<string, { icon: typeof Clock; color: string; label: string }> = {
  pending: { icon: Clock, color: "text-amber-400 bg-amber-600/15", label: "Pending" },
  paid: { icon: CheckCircle2, color: "text-violet-300 bg-violet-600/15", label: "Paid" },
  shipped: { icon: Truck, color: "text-blue-300 bg-blue-600/15", label: "Shipped" },
  delivered: { icon: CheckCircle2, color: "text-green-400 bg-green-600/15", label: "Delivered" },
  cancelled: { icon: XCircle, color: "text-red-400 bg-red-600/15", label: "Cancelled" },
};

export function OrderHistory() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function fetchOrders() {
      if (!user?.email) {
        setLoading(false);
        return;
      }
      try {
        const { data, error: err } = await supabase
          .from("orders")
          .select("*, order_items(*)")
          .eq("customer_email", user.email)
          .order("created_at", { ascending: false });

        if (err) throw err;
        setOrders((data ?? []) as unknown as OrderRow[]);
      } catch {
        setError("Unable to load your orders right now.");
      } finally {
        setLoading(false);
      }
    }
    fetchOrders();
  }, [user?.email]);

  if (loading) {
    return (
      <div className="section-padding">
        <div className="container-max">
          <h1 className="font-display text-3xl font-bold text-white mb-8">Order History</h1>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-dark h-32 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-2xl text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl glass mb-6">
            <Package size={36} className="text-violet-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Sign In to View Orders</h1>
          <p className="mt-3 text-gray-400">Your order history is linked to your account.</p>
          <Link to="/signin" className="btn-primary mt-8 inline-flex">
            Sign In
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold text-white">Order History</h1>
          <p className="mt-4 text-red-300">{error}</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-2xl text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl glass mb-6">
            <Package size={36} className="text-violet-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">No Orders Yet</h1>
          <p className="mt-3 text-gray-400">When you place a demo order, it will appear here.</p>
          <Link to="/" className="btn-primary mt-8 inline-flex">
            Start Shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-max">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">Order History</h1>

        <div className="space-y-4">
          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            const StatusIcon = cfg.icon;
            const isOpen = expanded === order.id;

            return (
              <div key={order.id} className="glass-dark overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  className="w-full flex items-center justify-between gap-4 p-5 text-left"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${cfg.color}`}>
                      <StatusIcon size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-display font-semibold text-white">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-xs text-gray-500">{formatDateTime(order.created_at)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden sm:block">
                      <p className="text-sm text-gray-400">{order.item_count} item{order.item_count !== 1 ? "s" : ""}</p>
                      <p className="font-display font-bold gradient-text">{formatCurrency(order.total)}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {isOpen ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                  </div>
                </button>

                {isOpen && order.order_items && order.order_items.length > 0 && (
                  <div className="border-t border-white/10 p-5 animate-fade-in">
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center justify-between text-sm">
                          <div>
                            <p className="text-white">{item.name}</p>
                            <p className="text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-gray-300">{formatCurrency(item.unit_price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                      <span className="text-gray-400">Total (incl. tax)</span>
                      <span className="font-display font-bold gradient-text">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
