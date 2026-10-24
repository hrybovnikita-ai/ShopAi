import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  AlertTriangle,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Package,
} from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminCategory, AdminProduct, Paginated } from "@/types/admin";
import { formatCurrency } from "@/lib/format";
import { Badge, ConfirmDialog, EmptyState, Modal, PageHeader, Pagination, Skeleton } from "@/components/admin/ui";
import {
  ProductForm,
  emptyProductForm,
  formToPayload,
  productToForm,
  type ProductFormValues,
} from "@/components/admin/ProductForm";
import { useToast } from "@/components/Toast";

const SORT_OPTIONS = [
  { value: "created_at:desc", label: "Newest first" },
  { value: "name:asc", label: "Name A–Z" },
  { value: "price:asc", label: "Price: low to high" },
  { value: "price:desc", label: "Price: high to low" },
  { value: "stock:asc", label: "Stock: low to high" },
];

export function AdminProducts() {
  const [searchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [availability, setAvailability] = useState(searchParams.get("availability") ?? "all");
  const [sortValue, setSortValue] = useState("created_at:desc");
  const [page, setPage] = useState(1);

  const [data, setData] = useState<Paginated<AdminProduct> | null>(null);
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [form, setForm] = useState<ProductFormValues>(emptyProductForm());
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminProduct | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { push } = useToast();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const loadProducts = useCallback(async (signal?: AbortSignal) => {
    const [sort, order] = sortValue.split(":");
    const params = new URLSearchParams({
      page: String(page),
      pageSize: "10",
      sort,
      order,
      availability,
    });
    if (search) params.set("search", search);
    if (category) params.set("category", category);

    setLoading(true);
    try {
      const result = await apiRequest<Paginated<AdminProduct>>(`/admin/products?${params.toString()}`, { signal });
      setData(result);
      setError(null);
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Could not load products");
    } finally {
      setLoading(false);
    }
  }, [page, sortValue, availability, search, category]);

  useEffect(() => {
    const controller = new AbortController();
    void loadProducts(controller.signal);
    return () => controller.abort();
  }, [loadProducts, reloadKey]);

  useEffect(() => {
    apiRequest<{ categories: AdminCategory[] }>("/admin/categories")
      .then((result) => setCategories(result.categories))
      .catch(() => setCategories([]));
  }, []);

  const refresh = () => {
    setReloadKey((key) => key + 1);
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyProductForm(categories[0]?.name ?? ""));
    setSubmitError(null);
    setFormOpen(true);
  };

  const openEdit = (product: AdminProduct) => {
    setEditing(product);
    setForm(productToForm(product));
    setSubmitError(null);
    setFormOpen(true);
  };

  const saveProduct = async () => {
    setSaving(true);
    setSubmitError(null);
    try {
      const payload = formToPayload(form);
      if (editing) {
        await apiRequest(`/admin/products/${editing.id}`, { method: "PATCH", body: payload });
        push(`“${payload.name}” updated`);
      } else {
        await apiRequest("/admin/products", { method: "POST", body: payload });
        push(`“${payload.name}” created`);
      }
      setFormOpen(false);
      refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Could not save the product");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      push(`“${deleteTarget.name}” deleted`);
      setDeleteTarget(null);
      refresh();
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not delete the product", "error");
    } finally {
      setDeleting(false);
    }
  };

  const items = data?.items ?? [];

  return (
    <div>
      <PageHeader
        title="Products"
        description="Create, edit and remove catalog products. Writes are validated by the API and restricted by row-level security."
        actions={
          <>
            <button type="button" onClick={refresh} className="btn-secondary !py-2.5 text-sm" disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button type="button" onClick={openCreate} className="btn-primary !py-2.5 text-sm">
              <Plus size={16} />
              New product
            </button>
          </>
        }
      />

      <div className="glass-dark mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative sm:col-span-2 lg:col-span-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="search"
            aria-label="Search products"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search name, description…"
            className="input-field !py-2.5 pl-9 text-sm"
          />
        </div>
        <select
          aria-label="Filter by category"
          value={category}
          onChange={(event) => {
            setCategory(event.target.value);
            setPage(1);
          }}
          className="input-field !py-2.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((item) => (
            <option key={item.id} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <select
          aria-label="Filter by availability"
          value={availability}
          onChange={(event) => {
            setAvailability(event.target.value);
            setPage(1);
          }}
          className="input-field !py-2.5 text-sm"
        >
          <option value="all">All availability</option>
          <option value="active">Active only</option>
          <option value="low">Low stock (≤ 5)</option>
          <option value="out">Out of stock</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          aria-label="Sort products"
          value={sortValue}
          onChange={(event) => {
            setSortValue(event.target.value);
            setPage(1);
          }}
          className="input-field !py-2.5 text-sm"
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      <div className="glass-dark overflow-hidden">
        {loading ? (
          <div className="space-y-2 p-4">
            {[...Array(6)].map((_, index) => (
              <Skeleton key={index} className="h-14" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products match these filters"
            description="Try a different search, category or availability filter."
            action={
              <button type="button" onClick={openCreate} className="btn-primary !py-2.5 text-sm">
                <Plus size={16} />
                Add a product
              </button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">Price</th>
                    <th className="px-4 py-3 font-medium">Inventory</th>
                    <th className="px-4 py-3 font-medium">Rating</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {items.map((product) => (
                    <tr key={product.id} className="transition hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={product.image_url}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg border border-white/10 object-cover"
                          />
                          <div className="min-w-0">
                            <p className="truncate font-medium text-white">{product.name}</p>
                            <p className="text-xs text-gray-500">{product.category}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-200">{formatCurrency(product.price)}</td>
                      <td className="px-4 py-3">
                        <Badge tone={product.stock === 0 ? "danger" : product.stock <= 5 ? "warning" : "neutral"}>
                          {product.stock === 0 ? "Out of stock" : `${product.stock} units`}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-300">{product.rating.toFixed(1)} ★</td>
                      <td className="px-4 py-3">
                        <Badge tone={product.is_active ? "success" : "neutral"}>
                          {product.is_active ? "Active" : "Hidden"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openEdit(product)}
                            aria-label={`Edit ${product.name}`}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(product)}
                            aria-label={`Delete ${product.name}`}
                            className="rounded-lg p-2 text-gray-400 transition hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-white/10 px-4 py-3">
              <Pagination
                page={data?.page ?? 1}
                totalPages={data?.totalPages ?? 1}
                total={data?.total ?? 0}
                onPage={setPage}
              />
            </div>
          </>
        )}
      </div>

      <Modal
        open={formOpen}
        title={editing ? "Edit product" : "New product"}
        description={editing ? editing.name : "Add a product to the ShopAi catalog."}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary !py-2.5 text-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="product-form" className="btn-primary !py-2.5 text-sm" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
            </button>
          </>
        }
      >
        <ProductForm
          values={form}
          onChange={setForm}
          categories={categories}
          onSubmit={saveProduct}
          submitting={saving}
          submitError={submitError}
        />
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete product"
        description={deleteTarget ? `“${deleteTarget.name}” will be removed from the catalog. Past order lines keep their recorded name and price.` : ""}
        confirmLabel="Delete product"
        loading={deleting}
        onConfirm={deleteProduct}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
