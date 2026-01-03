import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '@threadloop/shared';
import { useAuth } from '../context/AuthContext';
import { fetchMyListings, createListing, updateListingStatus } from '../lib/listings';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:4000');

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

function ListingCard({
  listing,
  owned = false,
  onStatusChange
}: {
  listing: Listing;
  owned?: boolean;
  onStatusChange?: (status: 'active' | 'cancelled') => void;
}) {
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
        {owned && listing.status === 'active' && (
          <span className="pill pill-success">Active</span>
        )}
        {listing.status === 'reserved' && (
          <span className="pill pill-warning">Reserved</span>
        )}
      </header>
      <h3>{listing.title}</h3>
      <p className="meta">Size {listing.size} • {priceLabel}</p>
      <p className="description">{listing.description}</p>
      {owned && onStatusChange && listing.status === 'active' && (
        <div className="listing-actions">
          <button
            className="ghost small"
            onClick={() => onStatusChange('cancelled')}
          >
            Remove Listing
          </button>
        </div>
      )}
    </article>
  );
}

function NewListingForm({
  userId,
  campusId,
  onCreated
}: {
  userId: string;
  campusId: string;
  onCreated: (listing: Listing) => void;
}) {
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

  const handleChange = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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

    try {
      const listing = await createListing({
        sellerId: userId,
        campusId: campusId,
        title: form.title || 'Untitled listing',
        description: form.description || 'Listed via ThreadLoop.',
        category: form.category || 'General',
        size: form.size || 'M',
        condition: form.condition as Listing['condition'],
        price: form.price ? Number(form.price) : undefined,
        swapValue: form.swapValue ? Number(form.swapValue) : undefined,
        aiMetadata,
        images: [
          {
            storageUrl:
              imageData ||
              form.imageUrl ||
              'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=900&q=80'
          }
        ]
      });

      if (listing) {
        onCreated(listing);
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
      } else {
        throw new Error('Failed to create listing');
      }
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
          <input
            value={form.title}
            onChange={handleChange('title')}
            placeholder="e.g. Brown leather blazer"
            required
          />
        </label>
        <label className="field">
          <span>Category</span>
          <input
            value={form.category}
            onChange={handleChange('category')}
            placeholder="Outerwear"
          />
        </label>
        <label className="field">
          <span>Size</span>
          <input
            value={form.size}
            onChange={handleChange('size')}
            placeholder="M"
          />
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
          <input
            type="number"
            value={form.price}
            onChange={handleChange('price')}
            min="0"
            step="1"
          />
        </label>
        <label className="field">
          <span>Swap value</span>
          <input
            type="number"
            value={form.swapValue}
            onChange={handleChange('swapValue')}
            min="0"
            step="1"
          />
        </label>
        <label className="field field-full">
          <span>Description</span>
          <textarea
            value={form.description}
            onChange={handleChange('description')}
            rows={3}
            placeholder="Texture, fit, campus meet-up preferences..."
          />
        </label>
        <label className="field field-full">
          <span>Image URL</span>
          <input
            value={form.imageUrl}
            onChange={handleChange('imageUrl')}
            placeholder="https://..."
          />
          <small className="hint">Use any hosted photo or upload a quick mirror pic.</small>
        </label>
        <label className="field field-full">
          <span>Upload image</span>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {imageData && <img className="preview" src={imageData} alt="Preview" />}
        </label>
      </div>
      <div className="actions actions-alt">
        <button
          type="button"
          className="ghost"
          onClick={handleAutoFill}
          disabled={autoFillLoading}
        >
          {autoFillLoading ? 'Letting AI think…' : 'Use AI to auto-fill'}
        </button>
        {aiMetadata && (
          <span className="ai-tags">AI tags: {formatAiMetadata(aiMetadata)}</span>
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

function ListingModal({
  children,
  onClose
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Load user's listings from Supabase
  useEffect(() => {
    if (!user) return;

    async function loadMyListings() {
      setLoading(true);
      const listings = await fetchMyListings(user.id);
      setMyListings(listings);
      setLoading(false);
    }

    loadMyListings();
  }, [user]);

  const handleNewListing = (listing: Listing) => {
    setMyListings((prev) => [listing, ...prev]);
    setIsModalOpen(false);
  };

  const handleStatusChange = async (listingId: string, status: 'active' | 'cancelled') => {
    const success = await updateListingStatus(listingId, status);
    if (success) {
      if (status === 'cancelled') {
        setMyListings((prev) => prev.filter((l) => l.id !== listingId));
      } else {
        setMyListings((prev) =>
          prev.map((l) => (l.id === listingId ? { ...l, status } : l))
        );
      }
    }
  };

  if (!user) {
    return (
      <div className="page-content">
        <div className="empty-state">
          <p>Please log in to manage your closet</p>
          <button className="cta-primary" onClick={() => navigate('/login')}>
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  const activeListings = myListings.filter((l) => l.status === 'active');

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
          <h2>Your Active Listings ({activeListings.length})</h2>
          {loading ? (
            <p className="loading-state">Loading your listings...</p>
          ) : activeListings.length === 0 ? (
            <p className="empty-state">
              You haven't listed any items yet. Click "Add Listing" to upload something
              from your wardrobe!
            </p>
          ) : (
            <div className="grid">
              {activeListings.map((listing) => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  owned
                  onStatusChange={(status) => handleStatusChange(listing.id, status)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {isModalOpen && (
        <ListingModal onClose={() => setIsModalOpen(false)}>
          <NewListingForm
            userId={user.id}
            campusId={user.campusId || '22222222-2222-2222-2222-222222222222'}
            onCreated={handleNewListing}
          />
        </ListingModal>
      )}
    </div>
  );
}
