import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '@threadloop/shared';
import { useAuth } from '../context/AuthContext';
import { fetchMyListings, createListing, updateListingStatus } from '../lib/listings';

// Common clothing categories
const CATEGORIES = [
  'Tops',
  'Bottoms',
  'Dresses',
  'Outerwear',
  'Shoes',
  'Accessories',
  'Activewear',
  'Formal',
  'Vintage',
  'Other'
];

// Common sizes
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One Size'];

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
  onCreated,
  onCancel
}: {
  userId: string;
  campusId: string;
  onCreated: (listing: Listing) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Tops',
    size: 'M',
    condition: 'like_new' as const,
    price: '',
    swapValue: '',
    imageUrl: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [imageData, setImageData] = useState<string | null>(null);

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

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage('Image must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageData(reader.result);
        setMessage(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage('Please enter a title');
      return;
    }

    if (!imageData && !form.imageUrl) {
      setMessage('Please add an image');
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const listing = await createListing({
        sellerId: userId,
        campusId: campusId,
        title: form.title.trim(),
        description: form.description.trim() || 'No description provided.',
        category: form.category,
        size: form.size,
        condition: form.condition,
        price: form.price ? Number(form.price) : undefined,
        swapValue: form.swapValue ? Number(form.swapValue) : undefined,
        images: [
          {
            storageUrl: imageData || form.imageUrl
          }
        ]
      });

      if (listing) {
        onCreated(listing);
      } else {
        throw new Error('Failed to create listing');
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const imagePreview = imageData || form.imageUrl;

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      {/* Image Upload Section */}
      <div className="image-upload-section">
        <div
          className={`image-drop-zone ${imagePreview ? 'has-image' : ''}`}
          onClick={() => document.getElementById('image-input')?.click()}
        >
          {imagePreview ? (
            <img src={imagePreview} alt="Preview" className="image-preview-large" />
          ) : (
            <div className="upload-placeholder">
              <span className="upload-icon">📷</span>
              <span>Click to upload photo</span>
              <span className="upload-hint">or drag and drop</span>
            </div>
          )}
          <input
            id="image-input"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden-input"
          />
        </div>
        {imagePreview && (
          <button
            type="button"
            className="change-image-btn"
            onClick={() => {
              setImageData(null);
              setForm(prev => ({ ...prev, imageUrl: '' }));
            }}
          >
            Remove image
          </button>
        )}
      </div>

      {/* Form Fields */}
      <div className="form-fields">
        <div className="field">
          <label htmlFor="title">Title *</label>
          <input
            id="title"
            value={form.title}
            onChange={handleChange('title')}
            placeholder="What are you selling?"
            required
          />
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" value={form.category} onChange={handleChange('category')}>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="size">Size</label>
            <select id="size" value={form.size} onChange={handleChange('size')}>
              {SIZES.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="condition">Condition</label>
            <select id="condition" value={form.condition} onChange={handleChange('condition')}>
              <option value="new">New with tags</option>
              <option value="like_new">Like new</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label htmlFor="price">Price ($)</label>
            <input
              id="price"
              type="number"
              value={form.price}
              onChange={handleChange('price')}
              min="0"
              step="1"
              placeholder="0"
            />
          </div>

          <div className="field">
            <label htmlFor="swapValue">Swap Value ($)</label>
            <input
              id="swapValue"
              type="number"
              value={form.swapValue}
              onChange={handleChange('swapValue')}
              min="0"
              step="1"
              placeholder="0"
            />
            <span className="field-hint">Estimated value for swaps</span>
          </div>
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={form.description}
            onChange={handleChange('description')}
            rows={3}
            placeholder="Describe the item, its condition, and any meetup preferences..."
          />
        </div>

        <div className="field">
          <label htmlFor="imageUrl">Or paste image URL</label>
          <input
            id="imageUrl"
            value={form.imageUrl}
            onChange={handleChange('imageUrl')}
            placeholder="https://..."
            disabled={!!imageData}
          />
        </div>
      </div>

      {message && (
        <div className={`form-message ${message.includes('success') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Publishing...' : 'Publish Listing'}
        </button>
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
      <div className="modal listing-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close form">
          ×
        </button>
        <h2>Create Listing</h2>
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
            <div className="empty-closet">
              <span className="empty-icon">👕</span>
              <h3>Your closet is empty</h3>
              <p>List items you want to sell or swap with other students</p>
              <button className="cta-primary" onClick={() => setIsModalOpen(true)}>
                Add Your First Listing
              </button>
            </div>
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
            onCancel={() => setIsModalOpen(false)}
          />
        </ListingModal>
      )}
    </div>
  );
}
