import { useState, useEffect, useMemo } from 'react';
import type { Listing } from '@threadloop/shared';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:4000');

type FilterState = {
  category: string;
  size: string;
  condition: string;
  priceMax: string;
};

function ListingCard({ listing }: { listing: Listing }) {
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
      </header>
      <h3>{listing.title}</h3>
      <p className="meta">Size {listing.size} • {priceLabel}</p>
      <p className="description">{listing.description}</p>
    </article>
  );
}

export function Browse() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    category: '',
    size: '',
    condition: '',
    priceMax: ''
  });

  useEffect(() => {
    async function fetchListings() {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/listings`);
        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.error ?? 'Failed to load listings');
        }
        setListings(payload.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load listings');
      } finally {
        setLoading(false);
      }
    }
    fetchListings();
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

  const handleFilterChange = (field: keyof FilterState) => (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFilters((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const clearFilters = () => {
    setFilters({ category: '', size: '', condition: '', priceMax: '' });
  };

  return (
    <div className="page-content">
      <section>
        <div className="section-header">
          <h1>Browse Listings</h1>
          <span>{filteredListings.length} items available on your campus</span>
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

        {loading && <p>Loading listings...</p>}
        {error && <p className="error">{error}</p>}

        <div className="grid">
          {filteredListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
          {!loading && filteredListings.length === 0 && !error && (
            <p className="empty-state">No listings match your filters. Try adjusting them.</p>
          )}
        </div>
      </section>
    </div>
  );
}
