import { useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import type { AdminCategory } from "@/types/admin";

export interface ProductFormValues {
  name: string;
  description: string;
  price: string;
  image_url: string;
  category: string;
  stock: string;
  rating: string;
  features: string;
  is_active: boolean;
}

export interface ProductPayload {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  rating: number;
  features: string[];
  is_active: boolean;
}

export function emptyProductForm(category = ""): ProductFormValues {
  return {
    name: "",
    description: "",
    price: "0",
    image_url: "",
    category,
    stock: "0",
    rating: "0",
    features: "",
    is_active: true,
  };
}

export function productToForm(product: {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category: string;
  stock: number;
  rating: number;
  features: string[];
  is_active?: boolean;
}): ProductFormValues {
  return {
    name: product.name,
    description: product.description,
    price: String(product.price),
    image_url: product.image_url,
    category: product.category,
    stock: String(product.stock),
    rating: String(product.rating),
    features: (product.features ?? []).join(", "),
    is_active: product.is_active ?? true,
  };
}

export function validateProductForm(values: ProductFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  if (values.name.trim().length < 2) errors.name = "Enter a product name";
  if (values.description.trim().length < 5) errors.description = "Describe the product";
  if (!Number.isFinite(Number(values.price)) || Number(values.price) < 0) errors.price = "Price must be 0 or more";
  if (!/^(https?:\/\/|\/)/.test(values.image_url.trim())) errors.image_url = "Use an http(s) image URL";
  if (values.category.trim().length < 2) errors.category = "Choose a category";
  if (!Number.isInteger(Number(values.stock)) || Number(values.stock) < 0) errors.stock = "Stock must be a whole number";
  const rating = Number(values.rating);
  if (!Number.isFinite(rating) || rating < 0 || rating > 5) errors.rating = "Rating must be between 0 and 5";
  return errors;
}

export function formToPayload(values: ProductFormValues): ProductPayload {
  return {
    name: values.name.trim(),
    description: values.description.trim(),
    price: Number(values.price),
    image_url: values.image_url.trim(),
    category: values.category.trim(),
    stock: Number(values.stock),
    rating: Number(values.rating),
    features: values.features.split(",").map((feature) => feature.trim()).filter(Boolean),
    is_active: values.is_active,
  };
}

interface ProductFormProps {
  values: ProductFormValues;
  onChange: (values: ProductFormValues) => void;
  categories: AdminCategory[];
  onSubmit: () => void;
  submitting: boolean;
  submitError: string | null;
}

export function ProductForm({ values, onChange, categories, onSubmit, submitting, submitError }: ProductFormProps) {
  const [touched, setTouched] = useState(false);
  const errors = touched ? validateProductForm(values) : {};

  const update = (patch: Partial<ProductFormValues>) => onChange({ ...values, ...patch });

  const categoryOptions = categories.map((category) => category.name);
  if (values.category && !categoryOptions.includes(values.category)) categoryOptions.push(values.category);

  return (
    <form
      id="product-form"
      onSubmit={(event) => {
        event.preventDefault();
        setTouched(true);
        if (Object.keys(validateProductForm(values)).length === 0) onSubmit();
      }}
      className="space-y-4"
    >
      {submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      <div>
        <label htmlFor="product-name" className="mb-1.5 block text-sm font-medium text-gray-300">
          Name
        </label>
        <input
          id="product-name"
          className="input-field"
          value={values.name}
          onChange={(event) => update({ name: event.target.value })}
          placeholder="Aurora Wireless Headphones"
        />
        {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="product-description" className="mb-1.5 block text-sm font-medium text-gray-300">
          Description
        </label>
        <textarea
          id="product-description"
          rows={3}
          className="input-field resize-y"
          value={values.description}
          onChange={(event) => update({ description: event.target.value })}
          placeholder="What makes this product worth buying?"
        />
        {errors.description && <p className="mt-1 text-xs text-red-300">{errors.description}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="product-price" className="mb-1.5 block text-sm font-medium text-gray-300">
            Price (USD)
          </label>
          <input
            id="product-price"
            type="number"
            min="0"
            step="0.01"
            className="input-field"
            value={values.price}
            onChange={(event) => update({ price: event.target.value })}
          />
          {errors.price && <p className="mt-1 text-xs text-red-300">{errors.price}</p>}
        </div>
        <div>
          <label htmlFor="product-stock" className="mb-1.5 block text-sm font-medium text-gray-300">
            Inventory
          </label>
          <input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            className="input-field"
            value={values.stock}
            onChange={(event) => update({ stock: event.target.value })}
          />
          {errors.stock && <p className="mt-1 text-xs text-red-300">{errors.stock}</p>}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="product-category" className="mb-1.5 block text-sm font-medium text-gray-300">
            Category
          </label>
          <select
            id="product-category"
            className="input-field"
            value={values.category}
            onChange={(event) => update({ category: event.target.value })}
          >
            <option value="">Select a category</option>
            {categoryOptions.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {errors.category && <p className="mt-1 text-xs text-red-300">{errors.category}</p>}
        </div>
        <div>
          <label htmlFor="product-rating" className="mb-1.5 block text-sm font-medium text-gray-300">
            Rating (0–5)
          </label>
          <input
            id="product-rating"
            type="number"
            min="0"
            max="5"
            step="0.1"
            className="input-field"
            value={values.rating}
            onChange={(event) => update({ rating: event.target.value })}
          />
          {errors.rating && <p className="mt-1 text-xs text-red-300">{errors.rating}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="product-image" className="mb-1.5 block text-sm font-medium text-gray-300">
          Image URL
        </label>
        <input
          id="product-image"
          className="input-field"
          value={values.image_url}
          onChange={(event) => update({ image_url: event.target.value })}
          placeholder="https://images.example.com/product.jpg"
        />
        {errors.image_url && <p className="mt-1 text-xs text-red-300">{errors.image_url}</p>}
      </div>

      <div>
        <label htmlFor="product-features" className="mb-1.5 block text-sm font-medium text-gray-300">
          Features <span className="font-normal text-gray-500">(comma separated)</span>
        </label>
        <input
          id="product-features"
          className="input-field"
          value={values.features}
          onChange={(event) => update({ features: event.target.value })}
          placeholder="Adaptive ANC, 40h Battery, Bluetooth 5.3"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={values.is_active}
          onChange={(event) => update({ is_active: event.target.checked })}
          className="h-4 w-4 rounded border-white/20 bg-ink-800 text-violet-600"
        />
        Available for purchase
      </label>

      <button type="submit" className="hidden" disabled={submitting} aria-hidden="true">
        {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
      </button>
    </form>
  );
}
