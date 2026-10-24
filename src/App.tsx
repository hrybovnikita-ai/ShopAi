import { Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { CartProvider } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Home } from "@/pages/Home";
import { About } from "@/pages/About";
import { Contacts } from "@/pages/Contacts";
import { Pricing } from "@/pages/Pricing";
import { SignIn } from "@/pages/SignIn";
import { SignUp } from "@/pages/SignUp";
import { Cart } from "@/pages/Cart";
import { Checkout } from "@/pages/Checkout";
import { ProductDetail } from "@/pages/ProductDetail";
import { ScrollToTop } from "@/components/ScrollToTop";

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ScrollToTop />
        <Navbar />
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
          </Routes>
        </main>
        <Footer />
      </CartProvider>
    </AuthProvider>
  );
}
