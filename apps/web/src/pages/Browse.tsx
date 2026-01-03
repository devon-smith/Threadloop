import { useState, useEffect, useMemo } from 'react';
import type { Listing } from '@threadloop/shared';
import { fetchListings } from '../lib/listings';
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
  onClick
}: {
  listing: ListingWithSeller;
  onClick: () => void;
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
  onContactSeller
}: {
  listing: ListingWithSeller;
  onClose: () => void;
  onContactSeller: (message: string) => Promise<void>;
}) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isOwnListing = user?.id === listing.sellerId;

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    await onContactSeller(message);
    setSending(false);
    setSent(true);
    setMessage('');
  };

  const priceLabel = listing.price
    ? `$${listing.price.toFixed(0)}`
    : listing.swapValue
    ? `Swap value: $${listing.swapValue.toFixed(0)}`
    : 'Open to offers';

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal listing-detail-modal" onClick={(e) => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>

        <div className="listing-detail-content">
          <div className="listing-detail-images">
            {listing.images?.[0]?.storageUrl ? (
              <img src={listing.images[0].storageUrl} alt={listing.title} />
            ) : (
              <div className="no-image">No image</div>
            )}
          </div>

          <div className="listing-detail-info">
            <div className="listing-detail-header">
              <span className="pill">{listing.condition.replace('_', ' ')}</span>
              <span className="pill pill-secondary">{listing.category}</span>
            </div>

            <h2>{listing.title}</h2>
            <p className="listing-price-large">{priceLabel}</p>
            <p className="listing-size">Size: {listing.size}</p>

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

            {user && !isOwnListing && !sent && (
              <form className="contact-seller-form" onSubmit={handleSendMessage}>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={`Hi! Is this ${listing.title} still available?`}
                  rows={3}
                />
                <button type="submit" disabled={!message.trim() || sending}>
                  {sending ? 'Sending...' : 'Message Seller'}
                </button>
              </form>
            )}

            {sent && (
              <div className="message-sent-notice">
                Message sent! Check your Messages tab for replies.
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    size: '',
    condition: '',
    priceMax: ''
  });

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

  const filteredListings = useMemo(() => {
    return listings.filter((listing) => {
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
  }, [listings, filters]);

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

  return (
    <div className="page-content">
      <section>
        <div className="section-header">
          <h1>Browse Listings</h1>
          <span>{filteredListings.length} items available</span>
        </div>

        <div className="filters-bar">
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
            />
          ))}
          {!loading && filteredListings.length === 0 && !error && (
            <p className="empty-state">
              {listings.length === 0
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
        />
      )}
    </div>
  );
}
