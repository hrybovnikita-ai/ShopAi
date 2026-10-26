import { useRef, useState } from "react";
import { ImagePlus, Loader2, Star, Trash2, X } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/components/Toast";
import { compressReviewImage } from "@/lib/image";
import type { ProductReview } from "@/types";

const MAX_IMAGES = 3;
const LINK_PATTERN = /(https?:\/\/|www\.)/i;
const EMAIL_PATTERN = /[\w.%+-]+@[\w.-]+\.[a-z]{2,}/i;

interface ReviewFormProps {
  productId: string;
  existing: ProductReview | null;
  onSaved: () => void;
  onCancel?: () => void;
}

export function ReviewForm({ productId, existing, onSaved, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const { push } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [hovered, setHovered] = useState(0);
  const [title, setTitle] = useState(existing?.title ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [images, setImages] = useState<string[]>(existing?.images ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addImages = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const room = MAX_IMAGES - images.length;
    if (room <= 0) {
      setError(`You can attach up to ${MAX_IMAGES} images.`);
      return;
    }
    const selected = Array.from(files).slice(0, room);
    try {
      const compressed = await Promise.all(selected.map(compressReviewImage));
      setImages((prev) => [...prev, ...compressed].slice(0, MAX_IMAGES));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That image could not be attached.");
    }
  };

  const validate = (): string | null => {
    if (rating < 1) return "Choose a star rating first.";
    if (body.trim().length < 10) return "Please write at least 10 characters about the product.";
    if (body.length > 4000) return "Reviews are limited to 4000 characters.";
    if (title.length > 120) return "Keep the headline under 120 characters.";
    if (LINK_PATTERN.test(body) || EMAIL_PATTERN.test(body)) {
      return "Reviews can't contain links or contact details — please describe the product instead.";
    }
    return null;
  };

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);

    const authorName =
      (user.user_metadata?.full_name as string | undefined)?.trim() ||
      (user.email ? user.email.split("@")[0] : "ShopAi customer");

    const payload = {
      product_id: productId,
      user_id: user.id,
      author_name: authorName.slice(0, 60),
      rating,
      title: title.trim(),
      body: body.trim(),
      images,
    };

    const query = existing
      ? supabase.from("product_reviews").update(payload).eq("id", existing.id).eq("user_id", user.id)
      : supabase.from("product_reviews").insert(payload);

    const { error: saveError } = await query;
    setSaving(false);

    if (saveError) {
      setError(
        saveError.message.includes("product_reviews_product_id_user_id_key")
          ? "You already reviewed this product — edit your existing review instead."
          : saveError.message,
      );
      return;
    }

    push(existing ? "Your review was updated" : "Thanks — your review is live", "success");
    setBody("");
    setTitle("");
    setRating(0);
    setImages([]);
    onSaved();
  };

  return (
    <form onSubmit={submit} className="glass-dark space-y-4 p-5">
      <div className="flex items-start justify-between">
        <h3 className="font-display text-lg font-semibold text-white">
          {existing ? "Edit your review" : "Write a review"}
        </h3>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-ghost !p-1.5" aria-label="Cancel">
            <X size={16} />
          </button>
        )}
      </div>

      <div>
        <span className="mb-2 block text-sm text-gray-300">Your rating</span>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => {
            const active = star <= (hovered || rating);
            return (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHovered(star)}
                onMouseLeave={() => setHovered(0)}
                onClick={() => setRating(star)}
                aria-label={`${star} star${star > 1 ? "s" : ""}`}
                aria-pressed={rating === star}
                className="rounded-md p-1 transition-transform hover:scale-110"
              >
                <Star
                  size={26}
                  className={active ? "fill-violet-400 text-violet-400" : "fill-ink-700 text-ink-600"}
                />
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="review-title" className="mb-1.5 block text-sm text-gray-300">
          Headline <span className="text-gray-500">(optional)</span>
        </label>
        <input
          id="review-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          maxLength={120}
          placeholder="Sums up your experience"
          className="input-field"
        />
      </div>

      <div>
        <label htmlFor="review-body" className="mb-1.5 block text-sm text-gray-300">
          Your review
        </label>
        <textarea
          id="review-body"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          maxLength={4000}
          placeholder="How does it perform? What did you like or dislike?"
          className="input-field resize-y"
          required
        />
        <p className="mt-1 text-right text-xs text-gray-500">{body.length}/4000</p>
      </div>

      <div>
        <span className="mb-2 block text-sm text-gray-300">
          Photos <span className="text-gray-500">(optional, up to {MAX_IMAGES})</span>
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative h-20 w-20 overflow-hidden rounded-lg border border-white/10">
              <img src={image} alt={`Review photo ${index + 1}`} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
                className="absolute right-1 top-1 rounded-full bg-black/70 p-1 text-white hover:bg-red-500/80"
                aria-label={`Remove photo ${index + 1}`}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-white/20 text-xs text-gray-400 transition-colors hover:border-violet-500/50 hover:text-violet-200"
            >
              <ImagePlus size={18} />
              Add
            </button>
          )}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(event) => {
              void addImages(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Photos are resized in your browser before upload. Reviews with links or contact details are
          rejected automatically.
        </p>
      </div>

      {error && (
        <p role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      )}

      <button type="submit" disabled={saving} className="btn-primary w-full disabled:opacity-60">
        {saving ? <Loader2 size={16} className="animate-spin" /> : null}
        {saving ? "Saving…" : existing ? "Save changes" : "Publish review"}
      </button>
    </form>
  );
}
