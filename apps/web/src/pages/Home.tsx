import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '@threadloop/shared';
import { fetchListings } from '../lib/listings';
import { seedSampleListings, checkSampleListingsExist } from '../lib/seedListings';

function ListingCard({ listing }: { listing: Listing }) {
  const priceLabel = listing.price
    ? `$${listing.price.toFixed(0)}`
    : listing.swapValue
    ? `Swap value: $${listing.swapValue.toFixed(0)}`
    : 'Open to swaps';

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

export function Home() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const loadListings = async () => {
    try {
      setLoading(true);
      const listings = await fetchListings({ limit: 6 });
      setData(listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadListings();
  }, []);

  // Seed sample listings for demo
  const handleSeedListings = async () => {
    setSeeding(true);
    setSeedMessage(null);

    try {
      const exists = await checkSampleListingsExist();
      if (exists) {
        setSeedMessage('Sample listings already exist!');
        setSeeding(false);
        return;
      }

      const result = await seedSampleListings();
      if (result.success) {
        setSeedMessage(`Added ${result.count} sample listings!`);
        // Reload listings
        await loadListings();
      } else {
        setSeedMessage(result.error || 'Failed to seed listings');
      }
    } catch (err) {
      setSeedMessage('Error seeding listings');
    } finally {
      setSeeding(false);
    }
  };

  const campusFeatures = [
    {
      label: 'No shipping hassles',
      detail: 'Meet up on campus between classes. No packaging, no postage, no waiting for delivery.'
    },
    {
      label: 'Verified students only',
      detail: 'University SSO keeps the marketplace safe and trusted within your campus community.'
    },
    {
      label: 'AI-powered matching',
      detail: 'Smart suggestions help you price items right and find buyers who love your style.'
    }
  ];

  return (
    <div className="page-content">
      <main>
        <section className="hero">
          <p className="eyebrow">ThreadLoop MVP</p>
          <h1>Swap clothes with your campus in minutes.</h1>
          <p className="lead">
            AI-powered listings, local exchanges, and zero shipping. Post an item, get smart price suggestions, and meet up on your own terms.
          </p>
          <div className="cta-row">
            <button className="cta-primary" onClick={() => navigate('/closet')}>
              Add a listing
            </button>
            <button className="cta-secondary" onClick={() => navigate('/browse')}>
              Browse listings
            </button>
          </div>
        </section>

        <section className="campus-section">
          <div className="section-header">
            <h2>Campus-only advantages</h2>
            <span>Designed for dorm life</span>
          </div>
          <div className="campus-grid">
            {campusFeatures.map((feature) => (
              <article key={feature.label} className="campus-card">
                <p className="eyebrow">{feature.label}</p>
                <p>{feature.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="section-header">
            <h2>Live listings</h2>
            <span>{data.length} available</span>
          </div>
          {loading && <p>Loading listings…</p>}
          {error && <p className="error">{error}</p>}
          <div className="grid">
            {data.slice(0, 6).map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
            {!loading && data.length === 0 && !error && (
              <div className="empty-listings">
                <p>No listings yet. Add some sample data to get started!</p>
                <button
                  className="cta-primary"
                  onClick={handleSeedListings}
                  disabled={seeding}
                >
                  {seeding ? 'Adding samples...' : 'Load Sample Listings'}
                </button>
                {seedMessage && (
                  <p className={`seed-message ${seedMessage.includes('Added') ? 'success' : ''}`}>
                    {seedMessage}
                  </p>
                )}
              </div>
            )}
          </div>
          {data.length > 6 && (
            <div className="actions" style={{ marginTop: '2rem' }}>
              <button className="cta-secondary" onClick={() => navigate('/browse')}>
                View all {data.length} listings
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
