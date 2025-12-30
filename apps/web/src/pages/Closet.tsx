import { useState, useMemo } from 'react';
import type { Listing } from '@threadloop/shared';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const DEFAULT_SELLER_ID = '11111111-1111-1111-1111-111111111111';
const DEFAULT_CAMPUS_ID = '22222222-2222-2222-2222-222222222222';

type AiSuggestion = {
  title: string;
  description: string;
  category: string;
  size: string;
  condition: Listing['condition'];
  price?: number;
  swapValue?: number;
  aiMetadata?: Record<string, unknown>;
};

function formatAiMetadata(metadata?: Record<string, unknown>): string {
  if (!metadata) return '';

  return Object.entries(metadata)
    .flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        return value.map((entry) => String(entry));
      }
      if (typeof value === 'object' && value !== null) {
        return Object.values(value as Record<string, unknown>).map((entry) => String(entry));
      }
      if (typeof value === 'boolean') {
        return value ? [key] : [];
      }
      return [String(value)];
    })
    .filter(Boolean)
    .join(', ');
}

function ListingCard({ listing, owned = false }: { listing: Listing; owned?: boolean }) {
  const priceLabel = useMemo(() => {
    if (listing.price) {
      return `$${listing.price.toFixed(0)}`;
    }
    if (listing.swapValue) {
      return `Swap value: $${listing.swapValue.toFixed(0)}`;
    }
    return 'Open to swaps';
  }, [listing.price, listing.swapValue]);

  const coverImage = listing.images?.[0]?.storageUrl;

  return (
    <article className="card">
      {coverImage && (
        <img className="card-image" src={coverImage} alt={listing.title} loading="lazy" />
      )}
      <header>
        <span className="pill">{listing.condition.replace('_', ' ')}</span>
        <span className="pill pill-secondary">{listing.category}</span>
        {owned && <span className="pill pill-success">Your listing</span>}
      </header>
      <h3>{listing.title}</h3>
      <p className="meta">Size {listing.size} • {priceLabel}</p>
      <p className="description">{listing.description}</p>
    </article>
  );
}

function NewListingForm({ onCreated }: { onCreated: (listing: Listing) => void }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    size: '',
    condition: 'like_new',
    price: '',
    swapValue: '',
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);
  const [aiMetadata, setAiMetadata] = useState<Record<string, unknown> | undefined>();
  const [autoFillLoading, setAutoFillLoading] = useState(false);

  const handleChange = (field: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setImageData(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageData(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAutoFill = async () => {
    if (!imageData && !form.imageUrl) {
      setMessage('Add an image before requesting AI suggestions.');
      return;
    }

    setAutoFillLoading(true);
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/ai/listing-suggestions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageData: imageData ?? undefined,
          imageUrl: imageData ? undefined : form.imageUrl || undefined
        })
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? 'AI assistant failed.');
      }
      const suggestion: AiSuggestion = payload.data;
      setForm((prev) => ({
        ...prev,
        title: suggestion.title,
        description: suggestion.description,
        category: suggestion.category,
        size: suggestion.size,
        condition: suggestion.condition,
        price: suggestion.price ? String(suggestion.price) : '',
        swapValue: suggestion.swapValue ? String(suggestion.swapValue) : prev.swapValue
      }));
      setAiMetadata(suggestion.aiMetadata);
      setMessage('AI filled in the details. Adjust anything before publishing.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Could not auto-fill.');
    } finally {
      setAutoFillLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const payload = {
      sellerId: DEFAULT_SELLER_ID,
      campusId: DEFAULT_CAMPUS_ID,
      title: form.title || 'Untitled listing',
      description: form.description || 'Listed via ThreadLoop web MVP.',
      category: form.category || 'General',
      size: form.size || 'M',
      condition: form.condition as Listing['condition'],
      price: form.price ? Number(form.price) : undefined,
      swapValue: form.swapValue ? Number(form.swapValue) : undefined,
      status: 'active' as const,
      aiMetadata,
      images: [
        {
          storageUrl:
            imageData ||
            form.imageUrl ||
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'
        }
      ]
    };

    try {
      const response = await fetch(`${API_BASE_URL}/listings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const body = await response.json();
      if (!response.ok || !body.success) {
        throw new Error(body.error ?? 'Failed to create listing');
      }
      onCreated(body.data);
      setForm({
        title: '',
        description: '',
        category: '',
        size: '',
        condition: 'like_new',
        price: '',
        swapValue: '',
        imageUrl: ''
      });
      setImageData(null);
      setAiMetadata(undefined);
      setMessage('Listing published successfully!');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="form-card" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Title</span>
          <input value={form.title} onChange={handleChange('title')} placeholder="e.g. Brown leather blazer" required />
        </label>
        <label className="field">
          <span>Category</span>
          <input value={form.category} onChange={handleChange('category')} placeholder="Outerwear" />
        </label>
        <label className="field">
          <span>Size</span>
          <input value={form.size} onChange={handleChange('size')} placeholder="M" />
        </label>
        <label className="field">
          <span>Condition</span>
          <select value={form.condition} onChange={handleChange('condition') as any}>
            <option value="new">New</option>
            <option value="like_new">Like new</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
          </select>
        </label>
        <label className="field">
          <span>Price (optional)</span>
          <input type="number" value={form.price} onChange={handleChange('price')} min="0" step="1" />
        </label>
        <label className="field">
          <span>Swap value</span>
          <input type="number" value={form.swapValue} onChange={handleChange('swapValue')} min="0" step="1" />
        </label>
        <label className="field field-full">
          <span>Description</span>
          <textarea value={form.description} onChange={handleChange('description')} rows={3} placeholder="Texture, fit, campus meet-up preferences..." />
        </label>
        <label className="field field-full">
          <span>Image URL</span>
          <input value={form.imageUrl} onChange={handleChange('imageUrl')} placeholder="https://..." />
          <small className="hint">Use any hosted photo or upload a quick mirror pic.</small>
        </label>
        <label className="field field-full">
          <span>Upload image</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {imageData && <img className="preview" src={imageData} alt="Preview" />}
        </label>
      </div>
      <div className="actions actions-alt">
        <button type="button" className="ghost" onClick={handleAutoFill} disabled={autoFillLoading}>
          {autoFillLoading ? 'Letting AI think…' : 'Use AI to auto-fill'}
        </button>
        {aiMetadata && (
          <span className="ai-tags">
            AI tags: {formatAiMetadata(aiMetadata)}
          </span>
        )}
      </div>
      <div className="actions">
        <button type="submit" disabled={submitting}>
          {submitting ? 'Publishing…' : 'Publish listing'}
        </button>
        {message && <span className="status-message">{message}</span>}
      </div>
    </form>
  );
}

function ListingModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close form">
          ×
        </button>
        <h2>Add New Listing</h2>
        <p className="modal-subtitle">Upload a photo and let AI fill in the rest.</p>
        {children}
      </div>
    </div>
  );
}

export function Closet() {
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [purchasedItems] = useState<Listing[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleNewListing = (listing: Listing) => {
    setMyListings((prev) => [listing, ...prev]);
    setIsModalOpen(false);
  };

  return (
    <div className="page-content">
      <section>
        <div className="closet-header">
          <div className="closet-header-content">
            <div>
              <h1>My Closet</h1>
              <span className="closet-subtitle">Manage your wardrobe and listings</span>
            </div>
            <button className="add-listing-btn" onClick={() => setIsModalOpen(true)}>
              + Add Listing
            </button>
          </div>
        </div>

        <div className="closet-section">
          <h2>Your Active Listings ({myListings.length})</h2>
          {myListings.length === 0 ? (
            <p className="empty-state">You haven't listed any items yet. Click "Add Listing" to upload something from your wardrobe!</p>
          ) : (
            <div className="grid">
              {myListings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} owned />
              ))}
            </div>
          )}
        </div>

        <div className="closet-section">
          <h2>Purchased Items ({purchasedItems.length})</h2>
          {purchasedItems.length === 0 ? (
            <p className="empty-state">You haven't purchased anything yet. Browse listings to find items you love!</p>
          ) : (
            <div className="grid">
              {purchasedItems.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </section>

      {isModalOpen && (
        <ListingModal onClose={() => setIsModalOpen(false)}>
          <NewListingForm onCreated={handleNewListing} />
        </ListingModal>
      )}
    </div>
  );
}
