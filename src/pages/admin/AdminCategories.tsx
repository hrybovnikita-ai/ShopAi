import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Pencil, Plus, Tags, Trash2, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/api";
import type { AdminCategory } from "@/types/admin";
import { Badge, ConfirmDialog, EmptyState, Modal, PageHeader, Skeleton } from "@/components/admin/ui";
import { useToast } from "@/components/Toast";

const ICON_OPTIONS = ["Cpu", "Smartphone", "Laptop", "Gamepad2", "Watch", "House", "Shirt", "Tags"];

const emptyForm = { name: "", description: "", icon: "Cpu" };

export function AdminCategories() {
  const [categories, setCategories] = useState<AdminCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminCategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminCategory | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { push } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiRequest<{ categories: AdminCategory[] }>("/admin/categories");
      setCategories(result.categories);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load categories");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, reloadKey]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError(null);
    setFormOpen(true);
  };

  const openEdit = (category: AdminCategory) => {
    setEditing(category);
    setForm({ name: category.name, description: category.description, icon: category.icon });
    setFormError(null);
    setFormOpen(true);
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    if (form.name.trim().length < 2) {
      setFormError("Name must be at least 2 characters");
      return;
    }

    setSaving(true);
    setFormError(null);
    try {
      const body = { name: form.name.trim(), description: form.description.trim(), icon: form.icon };
      if (editing) {
        await apiRequest(`/admin/categories/${editing.id}`, { method: "PATCH", body });
        push(`Category “${body.name}” updated`);
      } else {
        await apiRequest("/admin/categories", { method: "POST", body });
        push(`Category “${body.name}” created`);
      }
      setFormOpen(false);
      setReloadKey((key) => key + 1);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save the category");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await apiRequest(`/admin/categories/${deleteTarget.id}`, { method: "DELETE" });
      push(`Category “${deleteTarget.name}” deleted`);
      setDeleteTarget(null);
      setReloadKey((key) => key + 1);
    } catch (err) {
      push(err instanceof Error ? err.message : "Could not delete the category", "error");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Categories group the catalog and power the storefront filters."
        actions={
          <>
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="btn-secondary !py-2.5 text-sm" disabled={loading}>
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
            <button type="button" onClick={openCreate} className="btn-primary !py-2.5 text-sm">
              <Plus size={16} />
              New category
            </button>
          </>
        }
      />

      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, index) => (
            <Skeleton key={index} className="h-16" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <EmptyState icon={Tags} title="No categories yet" description="Create one to start grouping products." />
      ) : (
        <div className="glass-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-wide text-gray-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Description</th>
                  <th className="px-4 py-3 font-medium">Products</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {categories.map((category) => (
                  <tr key={category.id} className="transition hover:bg-white/[0.03]">
                    <td className="px-4 py-3 font-medium text-white">{category.name}</td>
                    <td className="px-4 py-3 text-gray-400">{category.description || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone="violet">{category.productCount ?? 0}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => openEdit(category)}
                          aria-label={`Edit ${category.name}`}
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-white/5 hover:text-white"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(category)}
                          aria-label={`Delete ${category.name}`}
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
        </div>
      )}

      <Modal
        open={formOpen}
        title={editing ? "Edit category" : "New category"}
        description="Categories are stored in PostgreSQL and readable by the storefront."
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button type="button" onClick={() => setFormOpen(false)} className="btn-secondary !py-2.5 text-sm" disabled={saving}>
              Cancel
            </button>
            <button type="submit" form="category-form" className="btn-primary !py-2.5 text-sm" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Create category"}
            </button>
          </>
        }
      >
        <form id="category-form" onSubmit={save} className="space-y-4">
          {formError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              <AlertTriangle size={16} />
              {formError}
            </div>
          )}
          <div>
            <label htmlFor="category-name" className="mb-1.5 block text-sm font-medium text-gray-300">
              Name
            </label>
            <input
              id="category-name"
              className="input-field"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Audio"
            />
          </div>
          <div>
            <label htmlFor="category-description" className="mb-1.5 block text-sm font-medium text-gray-300">
              Description
            </label>
            <input
              id="category-description"
              className="input-field"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              placeholder="Headphones, speakers and studio gear"
            />
          </div>
          <div>
            <label htmlFor="category-icon" className="mb-1.5 block text-sm font-medium text-gray-300">
              Icon
            </label>
            <select
              id="category-icon"
              className="input-field"
              value={form.icon}
              onChange={(event) => setForm({ ...form, icon: event.target.value })}
            >
              {ICON_OPTIONS.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Delete category"
        description={deleteTarget ? `“${deleteTarget.name}” will be removed. Categories that still contain products cannot be deleted.` : ""}
        confirmLabel="Delete category"
        loading={deleting}
        onConfirm={remove}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
