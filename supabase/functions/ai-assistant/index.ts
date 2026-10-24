const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ProductInfo {
  name: string;
  price: number;
  rating: number;
  category: string;
  description: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message, products } = await req.json();
    const userQuery: string = (message || "").toLowerCase();
    const productList: ProductInfo[] = products || [];

    // Keyword-based demo recommendation engine.
    // If an AI API key (e.g. OPENAI_API_KEY) is configured server-side,
    // this is where a real LLM call would be made instead.
    let reply = "";

    if (userQuery.includes("best") || userQuery.includes("recommend") || userQuery.includes("top")) {
      const sorted = [...productList].sort((a, b) => b.rating - a.rating).slice(0, 3);
      reply = `Here are my top recommendations:\n\n${sorted
        .map((p) => `• ${p.name} — $${p.price.toFixed(2)} (${p.rating}★) — ${p.category}`)
        .join("\n")}\n\nWould you like more details on any of these?`;
    } else if (userQuery.includes("compare")) {
      if (productList.length >= 2) {
        const [a, b] = productList;
        reply = `Here's a quick comparison:\n\n${a.name}: $${a.price.toFixed(2)}, ${a.rating}★, ${a.category}\n${b.name}: $${b.price.toFixed(2)}, ${b.rating}★, ${b.category}\n\n${a.rating >= b.rating ? a.name : b.name} has a higher rating, while ${a.price <= b.price ? a.name : b.name} offers better value.`;
      } else {
        reply = "I need at least two products to compare. Try browsing more products first!";
      }
    } else {
      // Search products by keyword
      const matches = productList.filter(
        (p) =>
          p.name.toLowerCase().includes(userQuery) ||
          p.description.toLowerCase().includes(userQuery) ||
          p.category.toLowerCase().includes(userQuery)
      );

      if (matches.length > 0) {
        const top = matches.slice(0, 3);
        reply = `I found some products that match your search:\n\n${top
          .map((p) => `• ${p.name} — $${p.price.toFixed(2)} (${p.rating}★)\n  ${p.description}`)
          .join("\n\n")}\n\nWould you like more details on any of these?`;
      } else {
        reply = `I'd be happy to help! You can ask me about specific product categories like Electronics, Gaming, Computers, Smartphones, Accessories, or Smart Home. Try asking "What are the best headphones?" or "Show me gaming products".`;
      }
    }

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
