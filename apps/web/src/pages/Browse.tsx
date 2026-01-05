import { useState, useEffect, useMemo } from 'react';
import type { Listing } from '@threadloop/shared';
import { fetchListings, fetchFavorites, addFavorite, removeFavorite } from '../lib/listings';
import { startConversation } from '../lib/messages';
import { useAuth } from '../context/AuthContext';

type FilterState = {
  category: string;
  size: string;
  condition: string;
  priceMax: string;
};

type ListingWithSeller = Listing & {
  seller?: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    rating: number;
  };
};

function ListingCard({
  listing,
  onClick,
  isFavorite,
  onToggleFavorite
}: {
  listing: ListingWithSeller;
  onClick: () => void;
  isFavorite?: boolean;
  onToggleFavorite?: (e: React.MouseEvent) => void;
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
    <article className="card listing-card" onClick={onClick}>
      {coverImage && (
        <img className="card-image" src={coverImage} alt={listing.title} loading="lazy" />
      )}
      {onToggleFavorite && (
        <button
          className={`favorite-btn ${isFavorite ? 'favorited' : ''}`}
          onClick={onToggleFavorite}
          aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      )}
      <header>
        <span className="pill">{listing.condition.replace('_', ' ')}</span>
        <span className="pill pill-secondary">{listing.category}</span>
      </header>
      <h3>{listing.title}</h3>
      <p className="meta">Size {listing.size} • {priceLabel}</p>
      {listing.seller && (
        <div className="seller-preview">
          <div className="seller-avatar-small">
            {listing.seller.avatarUrl ? (
              <img src={listing.seller.avatarUrl} alt={listing.seller.displayName} />
            ) : (
              listing.seller.displayName.charAt(0)
            )}
          </div>
          <span className="seller-name">{listing.seller.displayName}</span>
          {listing.seller.rating > 0 && (
            <span className="seller-rating">★ {listing.seller.rating.toFixed(1)}</span>
          )}
        </div>
      )}
    </article>
  );
}

function ListingDetailModal({
  listing,
  onClose,
  onContactSeller,
  onMakeOffer,
  isFavorite,
  onToggleFavorite
}: {
  listing: ListingWithSeller;
  onClose: () => void;
  onContactSeller: (message: string) => Promise<void>;
  onMakeOffer: (amount: number, message: string) => Promise<void>;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [offerAmount, setOfferAmount] = useState(listing.price?.toString() || '');
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const isOwnListing = user?.id === listing.sellerId;
  const hasMultipleImages = listing.images && listing.images.length > 1;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    await onContactSeller(message);
    setSending(false);
    setSent(true);
    setMessage('');
  };

  const handleMakeOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!offerAmount || sending) return;
    setSending(true);
    const offerMsg = message.trim() || `I'd like to offer $${offerAmount} for this item.`;
    await onMakeOffer(Number(offerAmount), offerMsg);
    setSending(false);
    setSent(true);
    setShowOfferForm(false);
  };

  const priceLabel = listing.price
    ? `$${listing.price.toFixed(0)}`
    : listing.swapValue
    ? `Swap value: $${listing.swapValue.toFixed(0)}`
    : 'Open to offers';

  const nextImage = () => {
    if (listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing.images && listing.images.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + listing.images.length) % listing.images.length);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal listing-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>

        <div className="listing-detail-content">
          <div className="listing-detail-images">
            {listing.images && listing.images.length > 0 ? (
              <div className="image-carousel">
                <img
                  src={listing.images[currentImageIndex]?.storageUrl}
                  alt={`${listing.title} - image ${currentImageIndex + 1}`}
                />
                {hasMultipleImages && (
                  <>
                    <button className="carousel-btn prev" onClick={prevImage}>‹</button>
                    <button className="carousel-btn next" onClick={nextImage}>›</button>
                    <div className="carousel-dots">
                      {listing.images.map((_, idx) => (
                        <span
                          key={idx}
                          className={`dot ${idx === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(idx)}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="no-image">No image</div>
            )}
          </div>

          <div className="listing-detail-info">
            <div className="listing-detail-header">
              <div className="listing-pills">
                <span className="pill">{listing.condition.replace('_', ' ')}</span>
                <span className="pill pill-secondary">{listing.category}</span>
              </div>
              {user && !isOwnListing && onToggleFavorite && (
                <button
                  className={`favorite-btn-large ${isFavorite ? 'favorited' : ''}`}
                  onClick={onToggleFavorite}
                >
                  {isFavorite ? '♥ Saved' : '♡ Save'}
                </button>
              )}
            </div>

            <h2>{listing.title}</h2>
            <p className="listing-price-large">{priceLabel}</p>
            <p className="listing-size">Size: {listing.size}</p>
            {listing.brand && <p className="listing-brand">Brand: {listing.brand}</p>}

            {listing.description && (
              <p className="listing-description">{listing.description}</p>
            )}

            {listing.seller && (
              <div className="seller-info-card">
                <div className="seller-avatar">
                  {listing.seller.avatarUrl ? (
                    <img src={listing.seller.avatarUrl} alt={listing.seller.displayName} />
                  ) : (
                    listing.seller.displayName.charAt(0)
                  )}
                </div>
                <div className="seller-details">
                  <span className="seller-name">{listing.seller.displayName}</span>
                  {listing.seller.rating > 0 && (
                    <span className="seller-rating">★ {listing.seller.rating.toFixed(1)}</span>
                  )}
                </div>
              </div>
            )}

            {user && !isOwnListing && !sent && !showOfferForm && (
              <div className="listing-actions">
                <form className="contact-seller-form" onSubmit={handleSendMessage}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi! Is this ${listing.title} still available?`}
                    rows={3}
                  />
                  <div className="action-buttons">
                    <button type="submit" disabled={!message.trim() || sending}>
                      {sending ? 'Sending...' : 'Message Seller'}
                    </button>
                    {listing.price && (
                      <button
                        type="button"
                        className="offer-btn"
                        onClick={() => setShowOfferForm(true)}
                      >
                        Make Offer
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {user && !isOwnListing && !sent && showOfferForm && (
              <form className="offer-form" onSubmit={handleMakeOffer}>
                <h3>Make an Offer</h3>
                <div className="offer-input-row">
                  <span className="currency-prefix">$</span>
                  <input
                    type="number"
                    value={offerAmount}
                    onChange={(e) => setOfferAmount(e.target.value)}
                    placeholder="Your offer"
                    min="1"
                    step="1"
                  />
                </div>
                {listing.price && (
                  <p className="offer-hint">Asking price: ${listing.price}</p>
                )}
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add a message (optional)"
                  rows={2}
                />
                <div className="action-buttons">
                  <button type="button" className="ghost" onClick={() => setShowOfferForm(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={!offerAmount || sending}>
                    {sending ? 'Sending...' : 'Send Offer'}
                  </button>
                </div>
              </form>
            )}

            {sent && (
              <div className="message-sent-notice">
                {showOfferForm ? 'Offer sent!' : 'Message sent!'} Check your Messages tab for replies.
              </div>
            )}

            {isOwnListing && (
              <div className="own-listing-notice">
                This is your listing
              </div>
            )}

            {!user && (
              <div className="login-prompt">
                <a href="/login">Sign in</a> to message this seller
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Browse() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    size: '',
    condition: '',
    priceMax: ''
  });

  // Load listings
  useEffect(() => {
    async function loadListings() {
      try {
        setLoading(true);
        const data = await fetchListings();
        setListings(data as ListingWithSeller[]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load listings');
      } finally {
        setLoading(false);
      }
    }
    loadListings();
  }, []);

  // Load favorites
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    async function loadFavorites() {
      const favs = await fetchFavorites(userId);
      setFavorites(new Set(favs.map(f => f.id)));
    }
    loadFavorites();
  }, [user]);

  const handleToggleFavorite = async (listingId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (!user) return;

    const isFav = favorites.has(listingId);
    if (isFav) {
      await removeFavorite(user.id, listingId);
      setFavorites(prev => {
        const next = new Set(prev);
        next.delete(listingId);
        return next;
      });
    } else {
      await addFavorite(user.id, listingId);
      setFavorites(prev => new Set(prev).add(listingId));
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
      if (showFavoritesOnly && !favorites.has(listing.id)) return false;
      if (filters.category && listing.category !== filters.category) return false;
      if (filters.size && listing.size !== filters.size) return false;
      if (filters.condition && listing.condition !== filters.condition) return false;
      if (filters.priceMax) {
        const maxPrice = Number(filters.priceMax);
        const listingPrice = listing.price ?? listing.swapValue ?? 0;
        if (listingPrice > maxPrice) return false;
      }
      return true;
    });
  }, [listings, filters, showFavoritesOnly, favorites]);

  const categories = useMemo(() => {
    const cats = new Set(listings.map((l) => l.category));
    return Array.from(cats).sort();
  }, [listings]);

  const sizes = useMemo(() => {
    const szs = new Set(listings.map((l) => l.size));
    return Array.from(szs).sort();
  }, [listings]);

  const handleFilterChange = (field: keyof FilterState) => (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>
  ) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', size: '', condition: '', priceMax: '' });
  };

  const handleContactSeller = async (message: string) => {
    if (!user || !selectedListing?.seller) return;

    await startConversation(
      selectedListing.id,
      user.id,
      selectedListing.seller.id,
      message
    );
  };

  const handleMakeOffer = async (amount: number, message: string) => {
    if (!user || !selectedListing?.seller) return;

    // Format the offer message
    const offerMessage = `💰 OFFER: $${amount}\n\n${message}`;

    await startConversation(
      selectedListing.id,
      user.id,
      selectedListing.seller.id,
      offerMessage
    );
  };

  return (
    <div className="page-content">
      <section>
        <div className="section-header">
          <h1>{showFavoritesOnly ? 'Saved Items' : 'Browse Listings'}</h1>
          <span>{filteredListings.length} items {showFavoritesOnly ? 'saved' : 'available'}</span>
        </div>

        <div className="filters-bar">
          {user && (
            <div className="view-toggle">
              <button
                className={`toggle-btn ${!showFavoritesOnly ? 'active' : ''}`}
                onClick={() => setShowFavoritesOnly(false)}
              >
                All Items
              </button>
              <button
                className={`toggle-btn ${showFavoritesOnly ? 'active' : ''}`}
                onClick={() => setShowFavoritesOnly(true)}
              >
                ♥ Saved ({favorites.size})
              </button>
            </div>
          )}
          <div className="filter-group">
            <label>
              <span>Category</span>
              <select value={filters.category} onChange={handleFilterChange('category')}>
                <option value="">All categories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Size</span>
              <select value={filters.size} onChange={handleFilterChange('size')}>
                <option value="">All sizes</option>
                {sizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Condition</span>
              <select value={filters.condition} onChange={handleFilterChange('condition')}>
                <option value="">All conditions</option>
                <option value="new">New</option>
                <option value="like_new">Like new</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
              </select>
            </label>

            <label>
              <span>Max price</span>
              <input
                type="number"
                min="0"
                step="5"
                placeholder="Any price"
                value={filters.priceMax}
                onChange={handleFilterChange('priceMax')}
              />
            </label>

            <button type="button" className="ghost" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </div>

        {loading && <p className="loading-state">Loading listings...</p>}
        {error && <p className="error">{error}</p>}

        <div className="grid">
          {filteredListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onClick={() => setSelectedListing(listing)}
              isFavorite={favorites.has(listing.id)}
              onToggleFavorite={user ? (e) => handleToggleFavorite(listing.id, e) : undefined}
            />
          ))}
          {!loading && filteredListings.length === 0 && !error && (
            <p className="empty-state">
              {showFavoritesOnly
                ? 'No saved items yet. Browse listings and click the heart to save!'
                : listings.length === 0
                ? 'No listings yet. Be the first to add one!'
                : 'No listings match your filters. Try adjusting them.'}
            </p>
          )}
        </div>
      </section>

      {selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          onClose={() => setSelectedListing(null)}
          onContactSeller={handleContactSeller}
          onMakeOffer={handleMakeOffer}
          isFavorite={favorites.has(selectedListing.id)}
          onToggleFavorite={() => handleToggleFavorite(selectedListing.id)}
        />
      )}
    </div>
  );
}
