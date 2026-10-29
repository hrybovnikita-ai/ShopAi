import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CreditCard, Apple, Smartphone, Check, ShoppingBag, ArrowLeft, Lock, Wallet, AlertCircle } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { apiRequest } from "@/lib/api";

type PaymentMethod = "visa" | "mastercard" | "applepay" | "googlepay" | "paypal";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
  { id: "visa", label: "Visa", icon: CreditCard },
  { id: "mastercard", label: "Mastercard", icon: CreditCard },
  { id: "applepay", label: "Apple Pay", icon: Apple },
  { id: "googlepay", label: "Google Pay", icon: Smartphone },
  { id: "paypal", label: "PayPal", icon: Wallet },
];

const SHIPPING_FREE_THRESHOLD = 100;
const SHIPPING_FLAT = 9.99;

export function Checkout() {
  const {
    items,
    cartTotal,
    clearCart,
    discountCode,
    discountPercent,
    discountAmount,
  } = useCart();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("visa");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    address: "",
    city: "",
    zipCode: "",
    country: "United States",
  });

  const shipping = cartTotal >= SHIPPING_FREE_THRESHOLD ? 0 : SHIPPING_FLAT;
  const tax = Math.max(0, cartTotal - discountAmount) * 0.08;
  const total = Math.max(0, cartTotal - discountAmount) + shipping + tax;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setCheckoutError(null);

    try {
      const result = await apiRequest<{ order: { id: string; number: string; total: number; tax: number } }>("/orders", {
        method: "POST",
        body: {
          customer_name: form.fullName,
          customer_email: form.email,
          items: items.map((item) => ({ product_id: item.product.id, quantity: item.quantity })),
          shipping_address: {
            address: form.address,
            city: form.city,
            zip_code: form.zipCode,
            country: form.country,
          },
        },
      });

      setOrderNumber(result.order.number);
      setSuccess(true);
      clearCart();
      setTimeout(() => navigate("/orders"), 4000);
    } catch (err) {
      setCheckoutError(err instanceof Error ? err.message : "Checkout is unavailable right now. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-md text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-green-500/20 border border-green-500/30 mb-6 animate-pulse-glow">
            <Check size={40} className="text-green-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Order Confirmed!</h1>
          <p className="mt-3 text-gray-400">
            Your demo order has been recorded. No real payment was processed.
          </p>
          {orderNumber && (
            <p className="mt-3 font-mono text-sm text-violet-200">Order #{orderNumber}</p>
          )}
          <div className="mt-6 flex flex-col gap-3">
            <Link to="/orders" className="btn-primary justify-center">
              View Order History
            </Link>
            <p className="text-sm text-violet-300">Redirecting to your orders...</p>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-2xl text-center">
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl glass mb-6">
            <ShoppingBag size={36} className="text-violet-400" />
          </div>
          <h1 className="font-display text-3xl font-bold text-white">Nothing to Checkout</h1>
          <p className="mt-3 text-gray-400">Your cart is empty. Add some products first.</p>
          <Link to="/" className="btn-primary mt-8 inline-flex">
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-max">
        <Link to="/cart" className="btn-ghost mb-6">
          <ArrowLeft size={16} />
          Back to Cart
        </Link>

        <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-8">Checkout</h1>

        {/* DEMO PAYMENT banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-violet-500/30 bg-violet-600/10 px-5 py-4">
          <AlertCircle size={20} className="shrink-0 text-violet-300" />
          <p className="text-sm font-medium text-violet-100">
            DEMO PAYMENT — NO REAL MONEY WILL BE CHARGED. This is a simulated checkout for demonstration purposes only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping + Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping */}
            <div className="glass-dark p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4">Shipping Information</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Full Name</label>
                  <input type="text" name="fullName" required value={form.fullName} onChange={handleInputChange} placeholder="John Doe" className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Email</label>
                  <input type="email" name="email" required value={form.email} onChange={handleInputChange} placeholder="john@example.com" className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Address</label>
                  <input type="text" name="address" required value={form.address} onChange={handleInputChange} placeholder="123 Main Street" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">City</label>
                  <input type="text" name="city" required value={form.city} onChange={handleInputChange} placeholder="San Francisco" className="input-field" />
                </div>
                <div>
                  <label className="block text-sm text-gray-300 mb-2">ZIP Code</label>
                  <input type="text" name="zipCode" required value={form.zipCode} onChange={handleInputChange} placeholder="94101" className="input-field" />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm text-gray-300 mb-2">Country</label>
                  <select name="country" value={form.country} onChange={handleInputChange} className="input-field">
                    <option>United States</option>
                    <option>Canada</option>
                    <option>United Kingdom</option>
                    <option>Germany</option>
                    <option>France</option>
                    <option>Australia</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="glass-dark p-6">
              <h2 className="font-display text-xl font-bold text-white mb-4">Payment Method</h2>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                {PAYMENT_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPaymentMethod(opt.id)}
                    className={`flex flex-col items-center gap-2 rounded-xl border p-4 transition-all ${
                      paymentMethod === opt.id
                        ? "border-violet-500 bg-violet-600/20 text-white"
                        : "border-white/10 bg-white/5 text-gray-400 hover:border-violet-500/30"
                    }`}
                  >
                    <opt.icon size={24} />
                    <span className="text-xs font-medium">{opt.label}</span>
                  </button>
                ))}
              </div>

              {(paymentMethod === "visa" || paymentMethod === "mastercard") && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Card Number (Test)</label>
                    <input type="text" placeholder="4242 4242 4242 4242" className="input-field" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">Expiry Date</label>
                      <input type="text" placeholder="MM/YY" className="input-field" />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-300 mb-2">CVV</label>
                      <input type="text" placeholder="123" className="input-field" />
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Test card preset — do not enter real card details.</p>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-gray-400 animate-fade-in">
                  You will be redirected to PayPal (demo) to complete your purchase securely.
                </div>
              )}

              {(paymentMethod === "applepay" || paymentMethod === "googlepay") && (
                <div className="rounded-xl bg-white/5 p-4 text-center text-sm text-gray-400 animate-fade-in">
                  You will be redirected to {paymentMethod === "applepay" ? "Apple Pay" : "Google Pay"} to complete your purchase securely.
                </div>
              )}

              <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                <Lock size={14} />
                This is a safe demonstration checkout. No real payment will be processed and no card details are stored.
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="glass-dark p-6 sticky top-24">
              <h2 className="font-display text-xl font-bold text-white mb-4">Order Summary</h2>
              <div className="space-y-3 max-h-60 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3 text-sm">
                    <img src={item.product.image_url} alt={item.product.name} className="h-12 w-12 rounded-lg object-cover" />
                    <div className="flex-1 min-w-0">
                      <p className="text-white truncate">{item.product.name}</p>
                      <p className="text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-white font-medium">
                      ${(item.product.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-sm border-t border-white/10 pt-4">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-violet-300">
                    <span>Discount ({discountPercent}%) {discountCode && `· ${discountCode}`}</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className={shipping === 0 ? "text-green-400" : "text-white"}>
                    {shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}
                  </span>
                </div>
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

              {checkoutError && (
                <p role="alert" className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                  {checkoutError}
                </p>
              )}

              <button
                type="submit"
                disabled={processing}
                className="btn-primary w-full mt-6 justify-center disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {processing ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock size={18} />
                    Place Demo Order
                  </>
                )}
              </button>

              <p className="mt-3 text-center text-xs text-gray-500">
                By placing this order you acknowledge this is a demo checkout.
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
