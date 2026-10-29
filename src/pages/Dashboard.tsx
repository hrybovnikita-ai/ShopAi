import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  User,
  Package,
  Heart,
  ShoppingBag,
  MapPin,
  Settings,
  LogOut,
  ArrowRight,
  Trash2,
  ShoppingCart,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/components/Toast";
import { ProductCard } from "@/components/ProductCard";
import { OrderHistory } from "@/pages/OrderHistory";
import { formatCurrency } from "@/lib/format";

type Tab = "profile" | "orders" | "wishlist" | "cart" | "addresses" | "settings";

const TABS: { id: Tab; label: string; icon: typeof User }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "orders", label: "My Orders", icon: Package },
  { id: "wishlist", label: "Wishlist", icon: Heart },
  { id: "cart", label: "Shopping Cart", icon: ShoppingBag },
  { id: "addresses", label: "Saved Addresses", icon: MapPin },
  { id: "settings", label: "Account Settings", icon: Settings },
];

const ADDRESS_KEY = "shopai.addresses";

interface SavedAddress {
  id: string;
  label: string;
  fullName: string;
  address: string;
  city: string;
  zipCode: string;
  country: string;
}

export function Dashboard() {
  const { user, isDemo, signOut } = useAuth();
  const { wishlist, items, cartTotal, removeFromWishlist, addToCart } = useCart();
  const { push } = useToast();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("profile");
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [addrForm, setAddrForm] = useState<Omit<SavedAddress, "id">>({
    label: "Home",
    fullName: "",
    address: "",
    city: "",
    zipCode: "",
    country: "United States",
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(ADDRESS_KEY);
      if (raw) setAddresses(JSON.parse(raw));
    } catch {
      /* empty */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(addresses));
  }, [addresses]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const saveAddress = (e: React.FormEvent) => {
    e.preventDefault();
    const newAddr: SavedAddress = { ...addrForm, id: `addr_${Date.now()}` };
    setAddresses((prev) => [...prev, newAddr]);
    setShowAddrForm(false);
    setAddrForm({ label: "Home", fullName: "", address: "", city: "", zipCode: "", country: "United States" });
    push("Address saved", "success");
  };

  const deleteAddress = (id: string) => {
    setAddresses((prev) => prev.filter((a) => a.id !== id));
    push("Address removed", "info");
  };

  const moveToCart = (product: typeof wishlist[0]) => {
    addToCart(product);
    removeFromWishlist(product.id);
    push(`${product.name} moved to cart`, "success");
  };

  if (!user) {
    return (
      <div className="section-padding">
        <div className="container-max max-w-2xl text-center">
          <h1 className="font-display text-3xl font-bold text-white">Sign In to View Your Dashboard</h1>
          <Link to="/signin" className="btn-primary mt-8 inline-flex">
            Sign In
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg text-xl font-bold uppercase text-white shadow-lg shadow-violet-600/30">
            {(user.email ?? "?").charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-white">My Dashboard</h1>
            <p className="text-sm text-gray-400">
              {user.email}
              {isDemo && <span className="ml-2 text-violet-300">Demo account</span>}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-dark p-2 space-y-1">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                      active
                        ? "bg-violet-600/20 text-white"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <Icon size={18} />
                    {t.label}
                    {t.id === "wishlist" && wishlist.length > 0 && (
                      <span className="ml-auto rounded-full bg-violet-600/30 px-2 py-0.5 text-xs text-violet-200">
                        {wishlist.length}
                      </span>
                    )}
                    {t.id === "cart" && items.length > 0 && (
                      <span className="ml-auto rounded-full bg-violet-600/30 px-2 py-0.5 text-xs text-violet-200">
                        {items.length}
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-red-300 hover:bg-red-600/10 transition-all"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {tab === "profile" && (
              <div className="glass-dark p-6">
                <h2 className="font-display text-xl font-bold text-white mb-6">Profile Information</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Email</label>
                    <input type="email" value={user.email ?? ""} disabled className="input-field opacity-60" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Account Type</label>
                    <input
                      type="text"
                      value={isDemo ? "Demo Account" : "Registered Account"}
                      disabled
                      className="input-field opacity-60"
                    />
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-3 gap-4">
                  <div className="glass p-4 text-center">
                    <p className="font-display text-2xl font-bold gradient-text">{items.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Cart Items</p>
                  </div>
                  <div className="glass p-4 text-center">
                    <p className="font-display text-2xl font-bold gradient-text">{wishlist.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Wishlist</p>
                  </div>
                  <div className="glass p-4 text-center">
                    <p className="font-display text-2xl font-bold gradient-text">{addresses.length}</p>
                    <p className="text-xs text-gray-400 mt-1">Addresses</p>
                  </div>
                </div>
              </div>
            )}

            {tab === "orders" && <OrderHistory />}

            {tab === "wishlist" && (
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-6">My Wishlist</h2>
                {wishlist.length === 0 ? (
                  <div className="glass-dark p-8 text-center">
                    <Heart size={32} className="text-violet-400 mx-auto mb-4" />
                    <p className="text-gray-400">Your wishlist is empty.</p>
                    <Link to="/" className="btn-secondary mt-4 inline-flex">Browse Products</Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((product) => (
                      <div key={product.id} className="flex flex-col gap-3">
                        <ProductCard product={product} />
                        <button
                          onClick={() => moveToCart(product)}
                          className="btn-primary !py-2.5 text-sm"
                        >
                          <ShoppingCart size={16} />
                          Move to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "cart" && (
              <div>
                <h2 className="font-display text-xl font-bold text-white mb-6">Shopping Cart</h2>
                {items.length === 0 ? (
                  <div className="glass-dark p-8 text-center">
                    <ShoppingBag size={32} className="text-violet-400 mx-auto mb-4" />
                    <p className="text-gray-400">Your cart is empty.</p>
                    <Link to="/" className="btn-secondary mt-4 inline-flex">Browse Products</Link>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3 mb-6">
                      {items.map((item) => (
                        <div key={item.product.id} className="glass-dark p-4 flex items-center gap-4">
                          <img src={item.product.image_url} alt={item.product.name} className="h-16 w-16 rounded-xl object-cover" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{item.product.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-semibold text-white">{formatCurrency(item.product.price * item.quantity)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total: <span className="font-display font-bold gradient-text">{formatCurrency(cartTotal)}</span></span>
                      <Link to="/cart" className="btn-primary">
                        Go to Cart
                        <ArrowRight size={16} />
                      </Link>
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === "addresses" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-xl font-bold text-white">Saved Addresses</h2>
                  <button onClick={() => setShowAddrForm(!showAddrForm)} className="btn-secondary text-sm">
                    {showAddrForm ? "Cancel" : "+ Add Address"}
                  </button>
                </div>

                {showAddrForm && (
                  <form onSubmit={saveAddress} className="glass-dark p-6 mb-6 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Label</label>
                        <input type="text" value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} placeholder="Home, Work..." className="input-field" required />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">Full Name</label>
                        <input type="text" value={addrForm.fullName} onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })} className="input-field" required />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Address</label>
                        <input type="text" value={addrForm.address} onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} className="input-field" required />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">City</label>
                        <input type="text" value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} className="input-field" required />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-300 mb-2">ZIP Code</label>
                        <input type="text" value={addrForm.zipCode} onChange={(e) => setAddrForm({ ...addrForm, zipCode: e.target.value })} className="input-field" required />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-sm text-gray-300 mb-2">Country</label>
                        <select value={addrForm.country} onChange={(e) => setAddrForm({ ...addrForm, country: e.target.value })} className="input-field">
                          <option>United States</option>
                          <option>Canada</option>
                          <option>United Kingdom</option>
                          <option>Germany</option>
                          <option>France</option>
                          <option>Australia</option>
                        </select>
                      </div>
                    </div>
                    <button type="submit" className="btn-primary">Save Address</button>
                  </form>
                )}

                {addresses.length === 0 && !showAddrForm ? (
                  <div className="glass-dark p-8 text-center">
                    <MapPin size={32} className="text-violet-400 mx-auto mb-4" />
                    <p className="text-gray-400">No saved addresses yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="glass-dark p-5">
                        <div className="flex items-start justify-between mb-3">
                          <span className="rounded-full bg-violet-600/20 px-3 py-1 text-xs font-medium text-violet-200">{addr.label}</span>
                          <button onClick={() => deleteAddress(addr.id)} className="text-gray-400 hover:text-red-300" aria-label="Delete address">
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p className="text-sm text-white font-medium">{addr.fullName}</p>
                        <p className="text-sm text-gray-400">{addr.address}</p>
                        <p className="text-sm text-gray-400">{addr.city}, {addr.zipCode}</p>
                        <p className="text-sm text-gray-400">{addr.country}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "settings" && (
              <div className="glass-dark p-6">
                <h2 className="font-display text-xl font-bold text-white mb-6">Account Settings</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">Email</label>
                    <input type="email" value={user.email ?? ""} disabled className="input-field opacity-60" />
                  </div>
                  <p className="text-sm text-gray-500">
                    {isDemo
                      ? "This is a demo account. Changes are stored locally only and no data is sent to a server."
                      : "Account settings are managed through your Supabase authentication profile."}
                  </p>
                  <button onClick={handleSignOut} className="btn-secondary text-red-300">
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
