import { useState } from "react";
import { Mail, MapPin, Phone, Send, MessageSquare, User } from "lucide-react";
import { supabase } from "@/lib/supabase";

export function Contacts() {
  const [form, setForm] = useState({ fullName: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.subject || !form.message) return;

    setStatus("sending");
    setErrorMsg("");

    try {
      const { error } = await supabase.from("contact_messages").insert({
        full_name: form.fullName,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });

      if (error) throw error;

      setStatus("success");
      setForm({ fullName: "", email: "", subject: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch (err) {
      setStatus("error");
      setErrorMsg("Unable to send message right now. Please try again later.");
    }
  };

  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
            <MessageSquare size={14} className="text-violet-400" />
            <span className="text-sm text-violet-200">Get in Touch</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
            Contact <span className="gradient-text">Us</span>
          </h1>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Have a question or need help? We're here for you. Send us a message and we'll get back to you within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact info */}
          <div className="space-y-6">
            {[
              { icon: Mail, title: "Email", value: "support@shopai.com", desc: "We reply within 24h" },
              { icon: Phone, title: "Phone", value: "+1 (800) 555-0199", desc: "Mon–Fri, 9am–6pm EST" },
              { icon: MapPin, title: "Address", value: "100 Market Street, San Francisco, CA", desc: "Visit our HQ" },
            ].map((item) => (
              <div key={item.title} className="glass-dark p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-bg shadow-lg shadow-violet-600/20 mb-4">
                  <item.icon size={24} className="text-white" />
                </div>
                <h3 className="font-display font-semibold text-white">{item.title}</h3>
                <p className="text-sm text-violet-200 mt-1">{item.value}</p>
                <p className="text-xs text-gray-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="glass-dark p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      name="fullName"
                      value={form.fullName}
                      onChange={handleChange}
                      required
                      placeholder="John Doe"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      placeholder="john@example.com"
                      className="input-field pl-10"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Subject</label>
                <input
                  type="text"
                  name="subject"
                  value={form.subject}
                  onChange={handleChange}
                  required
                  placeholder="How can we help?"
                  className="input-field"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Message</label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Tell us more about your inquiry..."
                  className="input-field resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={status === "sending"}
                className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {status === "sending" ? (
                  <>
                    <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>

              {status === "success" && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 px-4 py-3 text-sm text-green-300 animate-fade-in">
                  Your message has been sent successfully. We'll get back to you within 24 hours.
                </div>
              )}

              {status === "error" && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-300 animate-fade-in">
                  {errorMsg}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
