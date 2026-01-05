import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '@threadloop/shared';
import { useAuth } from '../context/AuthContext';
import { fetchMyListings, createListing, updateListingStatus } from '../lib/listings';
import { generateListingSuggestions, suggestPrice, getCategoryDemand } from '../lib/aiSuggestions';
import { seedSampleListings, checkSampleListingsExist } from '../lib/seedListings';
import { createImagePreview, SUPPORTED_IMAGE_TYPES, SUPPORTED_FORMATS_TEXT, isHeicFile } from '../lib/imageUtils';

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
  const [form, setForm] = useState<{
    title: string;
    description: string;
    category: string;
    size: string;
    condition: 'new' | 'like_new' | 'good' | 'fair';
    price: string;
    swapValue: string;
    brand: string;
  }>({
    title: '',
    description: '',
    category: 'Tops',
    size: 'M',
    condition: 'like_new',
    price: '',
    swapValue: '',
    brand: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiSuggested, setAiSuggested] = useState(false);
  const [demandInfo, setDemandInfo] = useState<{ level: string; reason: string } | null>(null);
  const [priceSuggestion, setPriceSuggestion] = useState<{ suggested: number; range: { min: number; max: number } } | null>(null);
  const MAX_IMAGES = 5;

  const handleChange = (field: keyof typeof form) => (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));

    // Update price suggestion when category or condition changes
    if (field === 'category' || field === 'condition') {
      const newCategory = field === 'category' ? event.target.value : form.category;
      const newCondition = field === 'condition' ? event.target.value : form.condition;
      const suggestion = suggestPrice(newCategory, newCondition, form.brand || undefined);
      setPriceSuggestion(suggestion);
      setDemandInfo(getCategoryDemand(newCategory));
    }
  };

  // Process image with AI when first image is uploaded
  const processWithAI = async (imageData: string, filename?: string) => {
    setAiProcessing(true);
    try {
      const suggestions = await generateListingSuggestions(imageData, filename, {
        category: form.category !== 'Tops' ? form.category : undefined,
        brand: form.brand || undefined
      });

      // Apply AI suggestions to form
      setForm(prev => ({
        ...prev,
        title: suggestions.title,
        description: suggestions.description,
        category: suggestions.category,
        size: suggestions.size,
        condition: suggestions.condition,
        price: String(suggestions.price),
        brand: suggestions.brand || prev.brand
      }));

      // Update demand and price info
      setDemandInfo(getCategoryDemand(suggestions.category));
      setPriceSuggestion(suggestPrice(suggestions.category, suggestions.condition, suggestions.brand));
      setAiSuggested(true);
      setMessage('AI suggestions applied! Feel free to edit any field.');
    } catch (error) {
      console.error('AI processing error:', error);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    // Check how many more images we can add
    const spotsLeft = MAX_IMAGES - images.length;
    const filesToProcess = Array.from(files).slice(0, spotsLeft);

    // Check for HEIC files early and show helpful message
    const heicFiles = filesToProcess.filter(isHeicFile);
    if (heicFiles.length > 0) {
      setMessage(
        'HEIC images are not supported by web browsers. Please convert to JPG or PNG first.\n\n' +
        'On iPhone: Settings → Camera → Formats → "Most Compatible"'
      );
      event.target.value = '';
      return;
    }

    try {
      // Process each file
      const processedImages = await Promise.all(
        filesToProcess.map(async (file) => {
          // Validate file size
          if (file.size > 5 * 1024 * 1024) {
            throw new Error(`File too large: ${file.name} (max 5MB)`);
          }

          // Create preview
          return await createImagePreview(file);
        })
      );

      setImages(prev => [...prev, ...processedImages]);
      setMessage(null);
    } catch (error) {
      console.error('Error processing images:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to process images');
    }

    // Clear the input so the same file can be selected again
    event.target.value = '';
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setMessage('Please enter a title');
      return;
    }

    if (images.length === 0) {
      setMessage('Please add at least one image');
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
        brand: form.brand.trim() || undefined,
        price: form.price ? Number(form.price) : undefined,
        swapValue: form.swapValue ? Number(form.swapValue) : undefined,
        images: images.map(img => ({ storageUrl: img }))
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

  return (
    <form className="listing-form" onSubmit={handleSubmit}>
      {/* Image Upload Section - Multiple Images */}
      <div className="image-upload-section">
        <div className="images-grid">
          {images.map((img, idx) => (
            <div key={idx} className="image-preview-item">
              <img src={img} alt={`Preview ${idx + 1}`} />
              <button
                type="button"
                className="remove-image-btn"
                onClick={() => removeImage(idx)}
                aria-label="Remove image"
              >
                ×
              </button>
              {idx === 0 && <span className="cover-badge">Cover</span>}
            </div>
          ))}
          {images.length < MAX_IMAGES && (
            <div
              className="image-drop-zone add-more"
              onClick={() => document.getElementById('image-input')?.click()}
            >
              <div className="upload-placeholder">
                <span className="upload-icon">+</span>
                <span>{images.length === 0 ? 'Add photos' : 'Add more'}</span>
                <span className="upload-hint">{images.length}/{MAX_IMAGES}</span>
              </div>
            </div>
          )}
        </div>
        <input
          id="image-input"
          type="file"
          accept={SUPPORTED_IMAGE_TYPES.join(',')}
          multiple
          onChange={handleImageUpload}
          className="hidden-input"
        />
        <p className="image-hint">First image will be the cover photo. Add up to {MAX_IMAGES} images.</p>

        {/* AI Processing Status */}
        {aiProcessing && (
          <div className="ai-status processing">
            <span className="ai-icon">🤖</span>
            <span>AI is analyzing your image...</span>
          </div>
        )}
        {aiSuggested && !aiProcessing && (
          <div className="ai-status success">
            <span className="ai-icon">✨</span>
            <span>AI suggestions applied! Edit any field below.</span>
          </div>
        )}
      </div>

      {/* Demand & Pricing Insights */}
      {demandInfo && (
        <div className={`demand-insight ${demandInfo.level}`}>
          <div className="demand-header">
            <span className={`demand-badge ${demandInfo.level}`}>
              {demandInfo.level.toUpperCase()} DEMAND
            </span>
            <span className="demand-reason">{demandInfo.reason}</span>
          </div>
          {priceSuggestion && (
            <div className="price-insight">
              <span>Suggested: <strong>${priceSuggestion.suggested}</strong></span>
              <span className="price-range">(Range: ${priceSuggestion.range.min} - ${priceSuggestion.range.max})</span>
            </div>
          )}
        </div>
      )}

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
          <label htmlFor="brand">Brand (optional)</label>
          <input
            id="brand"
            value={form.brand}
            onChange={handleChange('brand')}
            placeholder="e.g., Nike, Zara, Vintage"
          />
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
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);

  // Load user's listings from Supabase
  useEffect(() => {
    if (!user) return;

    const userId = user.id;
    async function loadMyListings() {
      setLoading(true);
      const listings = await fetchMyListings(userId);
      setMyListings(listings);
      setLoading(false);
    }

    loadMyListings();
  }, [user]);

  // Seed sample listings for demo
  const handleSeedListings = async () => {
    if (!user) return;

    setSeeding(true);
    setSeedMessage(null);

    try {
      const exists = await checkSampleListingsExist();
      if (exists) {
        setSeedMessage('Sample listings already exist in the database.');
        setSeeding(false);
        return;
      }

      const result = await seedSampleListings(user.id);
      if (result.success) {
        setSeedMessage(`Added ${result.count} sample listings! Refresh to see them.`);
        // Reload listings
        const listings = await fetchMyListings(user.id);
        setMyListings(listings);
      } else {
        setSeedMessage(result.error || 'Failed to seed listings');
      }
    } catch (error) {
      setSeedMessage('Error seeding listings');
    } finally {
      setSeeding(false);
    }
  };

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
              <div className="empty-closet-actions">
                <button className="cta-primary" onClick={() => setIsModalOpen(true)}>
                  Add Your First Listing
                </button>
                <button
                  className="cta-secondary"
                  onClick={handleSeedListings}
                  disabled={seeding}
                >
                  {seeding ? 'Adding...' : 'Add Sample Listings (Demo)'}
                </button>
              </div>
              {seedMessage && (
                <p className={`seed-message ${seedMessage.includes('Added') ? 'success' : ''}`}>
                  {seedMessage}
                </p>
              )}
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
