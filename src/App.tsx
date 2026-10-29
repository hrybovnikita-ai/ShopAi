import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { AdminProvider } from "@/context/AdminContext";
import { CompareProvider } from "@/context/CompareContext";
import { ToastProvider } from "@/components/Toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { CompareBar } from "@/components/CompareBar";
import { Home } from "@/pages/Home";
import { About } from "@/pages/About";
import { Contacts } from "@/pages/Contacts";
import { Pricing } from "@/pages/Pricing";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { Cart } from "@/pages/Cart";
import { Checkout } from "@/pages/Checkout";
import { ProductDetail } from "@/pages/ProductDetail";
import { SemanticSearch } from "@/pages/SemanticSearch";
import { Compare } from "@/pages/Compare";
import { Wishlist } from "@/pages/Wishlist";
import { OrderHistory } from "@/pages/OrderHistory";
import { Dashboard } from "@/pages/Dashboard";
import { AdminLayout, RequireAdmin } from "@/components/admin/AdminLayout";
import { AdminOverview } from "@/pages/admin/AdminOverview";
import { AdminProducts } from "@/pages/admin/AdminProducts";
import { AdminCategories } from "@/pages/admin/AdminCategories";
import { AdminOrders } from "@/pages/admin/AdminOrders";
import { AdminCustomers } from "@/pages/admin/AdminCustomers";
import { AdminMonitor } from "@/pages/admin/AdminMonitor";
import { ScrollToTop } from "@/components/ScrollToTop";

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AdminProvider>
          <CartProvider>
            <CompareProvider>
              <ScrollToTop />
              <Navbar />
              <CompareBar />
              <main className="min-h-screen pt-16">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/discover" element={<SemanticSearch />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/orders" element={<OrderHistory />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route
                    path="/admin"
                    element={
                      <RequireAdmin>
                        <AdminLayout />
                      </RequireAdmin>
                    }
                  >
                    <Route index element={<AdminOverview />} />
                    <Route path="products" element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders" element={<AdminOrders />} />
                    <Route path="customers" element={<AdminCustomers />} />
                    <Route path="monitor" element={<AdminMonitor />} />
                  </Route>
                </Routes>
              </main>
              <Footer />
            </CompareProvider>
          </CartProvider>
        </AdminProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
