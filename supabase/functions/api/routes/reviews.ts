/** Administrator moderation of product reviews. */
import { dbSelect, dbUpdate } from "../lib/db.ts";
import { HttpError, json, readJson } from "../lib/http.ts";
import type { RouteContext } from "../lib/types.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ReviewRow {
  id: string;
  product_id: string;
  user_id: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  verified_purchase: boolean;
  status: "published" | "hidden";
  created_at: string;
}

export async function handleListReviews({ url }: RouteContext): Promise<Response> {
  const status = url.searchParams.get("status") ?? "all";
  const page = Math.max(1, Math.trunc(Number(url.searchParams.get("page")) || 1));
  const pageSize = Math.min(50, Math.max(1, Math.trunc(Number(url.searchParams.get("pageSize")) || 10)));

  const filters: Record<string, string> = { select: "*", order: "created_at.desc" };
  if (status === "published" || status === "hidden") filters.status = `eq.${status}`;

  const from = (page - 1) * pageSize;
  const [{ data: reviews, total }, { data: products }] = await Promise.all([
    dbSelect<ReviewRow[]>("product_reviews", filters, { range: { from, to: from + pageSize - 1 }, count: true }),
    dbSelect<{ id: string; name: string }[]>("products", { select: "id,name" }),
  ]);

  const names = new Map(products.map((product) => [product.id, product.name]));
  return json({
    items: reviews.map((review) => ({ ...review, product_name: names.get(review.product_id) ?? "Removed product" })),
    total: total ?? reviews.length,
    page,
    pageSize,
  });
}

export async function handleModerateReview({ req, params }: RouteContext): Promise<Response> {
  const id = params.id;
  if (!UUID_RE.test(id)) throw new HttpError(400, "Invalid review id", "invalid_id");

  const body = await readJson<{ status?: string }>(req);
  const status = body.status;
  if (status !== "published" && status !== "hidden") {
    throw new HttpError(400, "Status must be 'published' or 'hidden'", "invalid_status");
  }

  const updated = await dbUpdate<ReviewRow[]>("product_reviews", { id: `eq.${id}` }, { status });
  if (!updated.length) throw new HttpError(404, "Review not found", "review_not_found");
  return json({ review: updated[0] });
}
