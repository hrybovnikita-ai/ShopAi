import { Check, Sparkles, Zap, Crown } from "lucide-react";
import { PRICING_PLANS } from "@/data/catalog";
import { Link } from "react-router-dom";

const PLAN_ICONS = [Sparkles, Zap, Crown];

export function Pricing() {
  return (
    <div className="section-padding">
      <div className="container-max">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 mb-4">
            <Crown size={14} className="text-violet-400" />
            <span className="text-sm text-violet-200">Pricing Plans</span>
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-white">
            Choose Your <span className="gradient-text">Plan</span>
          </h1>
          <p className="mt-4 text-gray-400 max-w-2xl mx-auto">
            Start free and upgrade anytime. All plans include access to our AI-powered shopping platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PRICING_PLANS.map((plan, idx) => {
            const Icon = PLAN_ICONS[idx] ?? Sparkles;
            return (
              <div
                key={plan.id}
                className={`relative glass-dark p-8 flex flex-col ${
                  plan.highlighted
                    ? "border-violet-500/50 shadow-xl shadow-violet-600/20 md:scale-105"
                    : ""
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-bg px-4 py-1 text-xs font-semibold text-white">
                    Most Popular
                  </div>
                )}

                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-bg shadow-lg shadow-violet-600/20 mb-6">
                  <Icon size={28} className="text-white" />
                </div>

                <h3 className="font-display text-2xl font-bold text-white">{plan.name}</h3>
                <p className="mt-2 text-sm text-gray-400">{plan.description}</p>

                <div className="mt-6 flex items-baseline gap-1">
                  <span className="font-display text-4xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-500">{plan.period}</span>
                </div>

                <ul className="mt-8 space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-gray-300">
                      <Check size={18} className="text-violet-400 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  to="/signup"
                  className={`mt-8 w-full ${
                    plan.highlighted ? "btn-primary" : "btn-secondary"
                  } justify-center`}
                >
                  Subscribe to {plan.name}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mt-12 text-center text-sm text-gray-500">
          All plans include secure checkout, 30-day money-back guarantee, and cancel anytime.
        </p>
      </div>
    </div>
  );
}
