import { Link } from "react-router-dom";
import { ShoppingBag, Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function Cart() {
  const { items, updateQuantity, removeFromCart, cartTotal, clearCart } = useCart();

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
                  <p className="text-sm text-gray-400 truncate">{item.product.category}</p>
                  <p className="text-lg font-bold gradient-text mt-1">
                    ${item.product.price.toFixed(2)}
                  </p>
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
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-400">
                  <span>Subtotal</span>
                  <span className="text-white">${cartTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Shipping</span>
                  <span className="text-green-400">Free</span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Tax (8%)</span>
                  <span className="text-white">${(cartTotal * 0.08).toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-white/10 flex justify-between">
                  <span className="font-semibold text-white">Total</span>
                  <span className="font-display text-xl font-bold gradient-text">
                    ${(cartTotal + cartTotal * 0.08).toFixed(2)}
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
