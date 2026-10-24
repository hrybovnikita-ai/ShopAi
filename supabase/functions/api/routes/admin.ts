/** Administrator API: catalog CRUD, orders, customers, monitoring. */
import { dbDelete, dbInsert, dbRpc, dbSelect, dbUpdate } from "../lib/db.ts";
import { HttpError, json, readJson } from "../lib/http.ts";
import type { RouteContext } from "../lib/types.ts";
import { ensureProductEmbeddings, storeEmbeddingForProduct, embeddingSource } from "../lib/embeddings.ts";
import { isAdmin } from "../lib/auth.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ORDER_STATUS = ["pending", "paid", "shipped", "delivered", "cancelled"];

function intParam(url: URL, key: string, fallback: number, min: number, max: number): number {
  const value = Number(url.searchParams.get(key));
  if (!Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function sanitizeSearch(value: string): string {
  return value.replace(/[,()*%]/g, " ").trim().slice(0, 80);
}

function requireUuid(id: string | undefined, label = "id"): string {
  if (!id || !UUID_RE.test(id)) throw new HttpError(400, `Invalid ${label}`, "invalid_id");
  return id;
}

// ---------------------------------------------------------------------------
// Session
// ---------------------------------------------------------------------------
export async function handleAdminSession({ req, user }: RouteContext): Promise<Response> {
  if (!user) return json({ authenticated: false, isAdmin: false, user: null });
  const admin = await isAdmin(user);
  return json({
    authenticated: true,
    isAdmin: admin,
    user: { id: user.id, email: user.email },
  });
}

// ---------------------------------------------------------------------------
// Statistics
// ---------------------------------------------------------------------------
export async function handleAdminStats(): Promise<Response> {
  const stats = await dbRpc<Record<string, unknown>>("admin_stats", {});
  return json(stats);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------
const PRODUCT_SORTS = new Set(["created_at", "name", "price", "stock", "rating", "category"]);

export async function handleListProducts({ url }: RouteContext): Promise<Response> {
  const search = sanitizeSearch(url.searchParams.get("search") ?? "");
  const category = sanitizeSearch(url.searchParams.get("category") ?? "");
  const availability = url.searchParams.get("availability") ?? "all";
  const sortParam = url.searchParams.get("sort") ?? "created_at";
  const sort = PRODUCT_SORTS.has(sortParam) ? sortParam : "created_at";
  const order = url.searchParams.get("order") === "asc" ? "asc" : "desc";
  const page = intParam(url, "page", 1, 1, 500);
  const pageSize = intParam(url, "pageSize", 10, 1, 50);

  const filters: Record<string, string | string[]> = {
    select: "*",
    order: `${sort}.${order}`,
  };
  if (category) filters.category = `eq.${category}`;
  if (search) {
    filters.or = `(name.ilike.*${search}*,description.ilike.*${search}*,category.ilike.*${search}*)`;
  }
  if (availability === "low") filters.stock = ["gte.1", "lte.5"];
  if (availability === "out") filters.stock = "eq.0";
  if (availability === "active") filters.is_active = "eq.true";
  if (availability === "inactive") filters.is_active = "eq.false";

  const from = (page - 1) * pageSize;
  const { data, total } = await dbSelect<Record<string, unknown>[]>("products", filters, {
    range: { from, to: from + pageSize - 1 },
    count: true,
  });

  return json({
    items: data,
    page,
    pageSize,
    total: total ?? data.length,
    totalPages: total ? Math.max(1, Math.ceil(total / pageSize)) : 1,
  });
}

interface ProductInput {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  rating?: number;
  category?: string;
  stock?: number;
  features?: string[];
  is_active?: boolean;
}

function parseProductInput(body: Record<string, unknown>, partial: boolean): ProductInput {
  const errors: string[] = [];
  const output: ProductInput = {};
  const provided = (key: string) => body[key] !== undefined && body[key] !== null;

  if (!partial || provided("name")) {
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 120) errors.push("Name must be between 2 and 120 characters");
    else output.name = name;
  }

  if (!partial || provided("description")) {
    const description = String(body.description ?? "").trim();
    if (description.length < 5 || description.length > 2000) errors.push("Description must be between 5 and 2000 characters");
    else output.description = description;
  }

  if (!partial || provided("price")) {
    const price = Number(body.price);
    if (!Number.isFinite(price) || price < 0 || price > 100000) errors.push("Price must be between 0 and 100000");
    else output.price = Math.round(price * 100) / 100;
  }

  if (!partial || provided("image_url")) {
    const imageUrl = String(body.image_url ?? "").trim();
    if (!/^(https?:\/\/|\/)/.test(imageUrl) || imageUrl.length > 500) errors.push("Image URL must start with http(s):// or /");
    else output.image_url = imageUrl;
  }

  if (!partial || provided("category")) {
    const category = String(body.category ?? "").trim();
    if (category.length < 2 || category.length > 60) errors.push("Category must be between 2 and 60 characters");
    else output.category = category;
  }

  if (!partial || provided("stock")) {
    const stock = Number(body.stock);
    if (!Number.isInteger(stock) || stock < 0 || stock > 100000) errors.push("Stock must be a whole number between 0 and 100000");
    else output.stock = stock;
  }

  if (provided("rating")) {
    const rating = Number(body.rating);
    if (!Number.isFinite(rating) || rating < 0 || rating > 5) errors.push("Rating must be between 0 and 5");
    else output.rating = Math.round(rating * 10) / 10;
  }

  if (provided("features")) {
    const raw = body.features;
    const features = Array.isArray(raw)
      ? raw.map((item) => String(item).trim()).filter(Boolean)
      : String(raw).split(",").map((item) => item.trim()).filter(Boolean);
    if (features.length > 20 || features.some((feature) => feature.length > 80)) {
      errors.push("Provide at most 20 features, each under 80 characters");
    } else {
      output.features = features;
    }
  }

  if (provided("is_active")) output.is_active = Boolean(body.is_active);

  if (errors.length > 0) {
    throw new HttpError(400, errors.join(". "), "validation_failed", { errors });
  }
  return output;
}

export async function handleCreateProduct({ req }: RouteContext): Promise<Response> {
  const body = await readJson<Record<string, unknown>>(req);
  const input = parseProductInput(body, false);
  const payload = { rating: 0, features: [], is_active: true, ...input };

  const rows = await dbInsertProduct(payload);
  await storeEmbeddingForProduct({
    id: String(rows.id),
    name: String(rows.name),
    description: String(rows.description),
    category: String(rows.category),
    features: (rows.features as string[]) ?? [],
    updated_at: rows.updated_at as string,
  });

  return json({ product: rows }, 201);
}

async function dbInsertProduct(payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  const rows = await dbInsert<Record<string, unknown>[]>("products", payload);
  if (!rows[0]) throw new HttpError(500, "The product could not be created", "product_not_created");
  return rows[0];
}

export async function handleUpdateProduct({ req, params }: RouteContext): Promise<Response> {
  const id = requireUuid(params.id, "product id");
  const body = await readJson<Record<string, unknown>>(req);
  const patch = parseProductInput(body, true);

  if (Object.keys(patch).length === 0) {
    throw new HttpError(400, "Nothing to update", "empty_patch");
  }

  const rows = await dbUpdate<Record<string, unknown>[]>("products", { id: `eq.${id}` }, patch);
  if (!rows[0]) throw new HttpError(404, "Product not found", "product_not_found");

  await storeEmbeddingForProduct({
    id,
    name: String(rows[0].name),
    description: String(rows[0].description),
    category: String(rows[0].category),
    features: (rows[0].features as string[]) ?? [],
    updated_at: rows[0].updated_at as string,
  });

  return json({ product: rows[0] });
}

export async function handleDeleteProduct({ params }: RouteContext): Promise<Response> {
  const id = requireUuid(params.id, "product id");
  const { data } = await dbSelect<{ id: string }[]>("products", { select: "id", id: `eq.${id}` });
  if (data.length === 0) throw new HttpError(404, "Product not found", "product_not_found");
  await dbDelete("products", { id: `eq.${id}` });
  return json({ deleted: id });
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------
export async function handleListCategories(): Promise<Response> {
  const { data: categories } = await dbSelect<Record<string, unknown>[]>("categories", {
    select: "*",
    order: "name.asc",
  });
  const { data: products } = await dbSelect<{ category: string }[]>("products", { select: "category" });

  const counts = new Map<string, number>();
  for (const product of products) {
    counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
  }

  return json({
    categories: categories.map((category) => ({
      ...category,
      productCount: counts.get(String(category.name)) ?? 0,
    })),
  });
}

export async function handleCreateCategory({ req }: RouteContext): Promise<Response> {
  const body = await readJson<{ name?: string; description?: string; icon?: string }>(req);
  const name = (body.name ?? "").trim();
  if (name.length < 2 || name.length > 60) {
    throw new HttpError(400, "Category name must be between 2 and 60 characters", "validation_failed");
  }

  const existing = await dbSelect<{ id: string }[]>("categories", { select: "id", name: `eq.${name}` });
  if (existing.data.length > 0) {
    throw new HttpError(409, "That category already exists", "duplicate_category");
  }

  const rows = await dbInsert<Record<string, unknown>[]>("categories", {
    name,
    description: (body.description ?? "").trim().slice(0, 200),
    icon: (body.icon ?? "Cpu").trim().slice(0, 40),
  });
  return json({ category: rows[0] }, 201);
}

export async function handleUpdateCategory({ req, params }: RouteContext): Promise<Response> {
  const id = requireUuid(params.id, "category id");
  const body = await readJson<{ name?: string; description?: string; icon?: string }>(req);

  const patch: Record<string, unknown> = {};
  if (body.name !== undefined) {
    const name = body.name.trim();
    if (name.length < 2 || name.length > 60) {
      throw new HttpError(400, "Category name must be between 2 and 60 characters", "validation_failed");
    }
    patch.name = name;
  }
  if (body.description !== undefined) patch.description = body.description.trim().slice(0, 200);
  if (body.icon !== undefined) patch.icon = body.icon.trim().slice(0, 40);
  if (Object.keys(patch).length === 0) throw new HttpError(400, "Nothing to update", "empty_patch");

  const rows = await dbUpdate<Record<string, unknown>[]>("categories", { id: `eq.${id}` }, patch);
  if (!rows[0]) throw new HttpError(404, "Category not found", "category_not_found");
  return json({ category: rows[0] });
}

export async function handleDeleteCategory({ params }: RouteContext): Promise<Response> {
  const id = requireUuid(params.id, "category id");
  const { data: rows } = await dbSelect<{ name: string }[]>("categories", { select: "name", id: `eq.${id}` });
  const category = rows[0];
  if (!category) throw new HttpError(404, "Category not found", "category_not_found");

  const { data: inUse } = await dbSelect<{ id: string }[]>("products", {
    select: "id",
    category: `eq.${category.name}`,
    limit: "1",
  });
  if (inUse.length > 0) {
    throw new HttpError(409, "Move or delete the products in this category first", "category_in_use");
  }

  await dbDelete("categories", { id: `eq.${id}` });
  return json({ deleted: id });
}

// ---------------------------------------------------------------------------
// Orders
// ---------------------------------------------------------------------------
export async function handleListOrders({ url }: RouteContext): Promise<Response> {
  const status = url.searchParams.get("status") ?? "";
  const search = sanitizeSearch(url.searchParams.get("search") ?? "");
  const page = intParam(url, "page", 1, 1, 500);
  const pageSize = intParam(url, "pageSize", 10, 1, 50);

  const filters: Record<string, string | string[]> = {
    select: "*,order_items(*)",
    order: "created_at.desc",
  };
  if (status && ORDER_STATUS.includes(status)) filters.status = `eq.${status}`;
  if (search) {
    filters.or = `(customer_email.ilike.*${search}*,customer_name.ilike.*${search}*)`;
  }

  const from = (page - 1) * pageSize;
  const { data, total } = await dbSelect<Record<string, unknown>[]>("orders", filters, {
    range: { from, to: from + pageSize - 1 },
    count: true,
  });

  return json({
    items: data,
    page,
    pageSize,
    total: total ?? data.length,
    totalPages: total ? Math.max(1, Math.ceil(total / pageSize)) : 1,
  });
}

export async function handleUpdateOrderStatus({ req, params }: RouteContext): Promise<Response> {
  const id = requireUuid(params.id, "order id");
  const body = await readJson<{ status?: string }>(req);
  const status = (body.status ?? "").trim();
  if (!ORDER_STATUS.includes(status)) {
    throw new HttpError(400, `Status must be one of: ${ORDER_STATUS.join(", ")}`, "validation_failed");
  }

  const rows = await dbUpdate<Record<string, unknown>[]>("orders", { id: `eq.${id}` }, { status });
  if (!rows[0]) throw new HttpError(404, "Order not found", "order_not_found");
  return json({ order: rows[0] });
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------
export async function handleListCustomers({ url }: RouteContext): Promise<Response> {
  const search = sanitizeSearch(url.searchParams.get("search") ?? "");
  const page = intParam(url, "page", 1, 1, 500);
  const pageSize = intParam(url, "pageSize", 10, 1, 50);

  const filters: Record<string, string> = {
    select: "id,email,created_at,last_sign_in_at,order_count,lifetime_value",
    order: "created_at.desc",
  };
  if (search) filters.email = `ilike.*${search}*`;

  const from = (page - 1) * pageSize;
  const { data, total } = await dbSelect<Record<string, unknown>[]>("customer_directory", filters, {
    range: { from, to: from + pageSize - 1 },
    count: true,
  });

  return json({
    items: data,
    page,
    pageSize,
    total: total ?? data.length,
    totalPages: total ? Math.max(1, Math.ceil(total / pageSize)) : 1,
  });
}

// ---------------------------------------------------------------------------
// Monitoring
// ---------------------------------------------------------------------------
export async function handleMonitorOverview({ url }: RouteContext): Promise<Response> {
  const hours = intParam(url, "hours", 24, 1, 720);
  const overview = await dbRpc<Record<string, unknown>>("admin_monitor_overview", { hours });
  return json(overview);
}

export async function handleMonitorErrors({ url }: RouteContext): Promise<Response> {
  const limit = intParam(url, "limit", 25, 1, 100);
  const { data } = await dbSelect<Record<string, unknown>[]>("app_errors", {
    select: "id,level,message,path,method,status,code,created_at",
    order: "created_at.desc",
    limit: String(limit),
  });
  return json({ errors: data });
}

export async function handleMonitorRequests({ url }: RouteContext): Promise<Response> {
  const limit = intParam(url, "limit", 25, 1, 100);
  const { data } = await dbSelect<Record<string, unknown>[]>("api_request_logs", {
    select: "id,method,path,status,duration_ms,created_at",
    order: "created_at.desc",
    limit: String(limit),
  });
  return json({ requests: data });
}

export async function handleEmbeddingBackfill(): Promise<Response> {
  await ensureProductEmbeddings(true);
  const { data } = await dbSelect<{ product_id: string }[]>("product_embeddings", { select: "product_id" });
  return json({ ok: true, source: embeddingSource(), embeddedProducts: data.length });
}
