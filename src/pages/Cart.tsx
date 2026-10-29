import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight, Tag, X, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/Toast";

const SHIPPING_FREE_THRESHOLD = 100;
const SHIPPING_FLAT = 9.99;

export function Cart() {
  const {
    items,
    updateQuantity,
    removeFromCart,
    cartTotal,
    clearCart,
    discountCode,
    discountPercent,
    discountAmount,
    applyDiscountCode,
    removeDiscountCode,
  } = useCart();
  const { push } = useToast();
  const [codeInput, setCodeInput] = useState("");

  const shipping = cartTotal >= SHIPPING_FREE_THRESHOLD || cartTotal === 0 ? 0 : SHIPPING_FLAT;
  const tax = Math.max(0, cartTotal - discountAmount) * 0.08;
  const total = Math.max(0, cartTotal - discountAmount) + shipping + tax;

  const handleApplyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codeInput.trim()) return;
    const ok = applyDiscountCode(codeInput);
    if (ok) {
      push(`Discount code ${codeInput.toUpperCase()} applied!`, "success");
      setCodeInput("");
    } else {
      push("Invalid discount code. Try SHOPAI10, WELCOME20, or FLASH50.", "error");
    }
  };

  if (items.length === 0) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-2xl text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl glass mb-6">
            <ShoppingBag size={36} className="text-violet-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Your Cart is Empty</h1>
          <p className="mt-3 text-gray-400">Browse our products and add items to your cart.</p>
          <Link to="/" className="btn-primary mt-8 inline-flex">
            Continue Shopping
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-max">
        <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">
          Shopping Cart
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.product.id} className="glass-dark p-4 flex gap-4 items-center">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="h-20 w-20 rounded-xl object-cover"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-white truncate">{item.product.name}</h3>
                  <p className="text-sm text-gray-400 truncate">{item.product.brand} · {item.product.category}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-lg font-bold gradient-text">
                      ${item.product.price.toFixed(2)}
                    </span>
                    {item.product.original_price && item.product.original_price > item.product.price && (
                      <span className="text-xs text-gray-500 line-through">
                        ${item.product.original_price.toFixed(2)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="rounded-lg bg-white/5 p-2 text-gray-300 hover:bg-violet-600/20 hover:text-white transition-all"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-8 text-center text-white font-medium">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="rounded-lg bg-white/5 p-2 text-gray-300 hover:bg-violet-600/20 hover:text-white transition-all"
                    aria-label="Increase quantity"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-white font-semibold">
                    ${(item.product.price * item.quantity).toFixed(2)}
                  </p>
                </div>

                <button
                  onClick={() => removeFromCart(item.product.id)}
                  className="rounded-lg bg-white/5 p-2 text-gray-400 hover:bg-red-600/20 hover:text-red-300 transition-all"
                  aria-label="Remove item"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="btn-ghost text-red-300 hover:bg-red-600/10"
            >
              <Trash2 size={16} />
              Clear Cart
            </button>
          </div>

          {/* Summary */}
          <div className="lg:col-span-1">
            <div className="glass-dark p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-white mb-4">Order Summary</h2>

              {/* Discount code input */}
              <div className="mb-4">
                {discountCode ? (
                  <div className="flex items-center justify-between rounded-xl border border-violet-500/30 bg-violet-600/10 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Check size={16} className="text-violet-300" />
                      <div>
                        <p className="text-sm font-medium text-violet-200">{discountCode}</p>
                        <p className="text-xs text-violet-300/70">{discountPercent}% off applied</p>
                      </div>
                    </div>
                    <button
                      onClick={removeDiscountCode}
                      className="rounded-lg p-1 text-gray-400 hover:text-white"
                      aria-label="Remove discount code"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCode} className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value)}
                        placeholder="Discount code"
                        className="input-field !py-2.5 pl-9 text-sm"
                      />
                    </div>
                    <button type="submit" className="btn-secondary !px-4 !py-2.5 text-sm">
                      Apply
                    </button>
                  </form>
                )}
                {!discountCode && (
                  <p className="mt-2 text-xs text-gray-500">
                    Try: SHOPAI10, WELCOME20, FLASH50
                  </p>
                )}
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-violet-300">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-400" : "text-white"}>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
                {shipping > 0 && (
                  <p className="text-xs text-gray-500">
                    Add ${(SHIPPING_FREE_THRESHOLD - cartTotal).toFixed(2)} more for free shipping
                  </p>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Tax (8%)</span>
                  <span className="text-white">${tax.toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-display text-xl font-bold gradient-text">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <Link to="/checkout" className="btn-primary w-full mt-6 justify-center">
                Proceed to Checkout
                <ArrowRight size={18} />
              </Link>

              <Link to="/" className="btn-ghost w-full mt-3 justify-center">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
