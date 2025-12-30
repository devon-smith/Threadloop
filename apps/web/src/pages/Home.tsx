import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Listing } from '@threadloop/shared';
import { useListings } from '../hooks/useListings';

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
  const { data, loading, error } = useListings();
  const navigate = useNavigate();

  const campusFeatures = [
    {
      label: 'Verified students only',
      detail: 'University SSO + campus ID scanning keeps swaps inside your dorm bubble.'
    },
    {
      label: 'Locker drop network',
      detail: 'Pick up at the student center, library pods, or dorm lobby lockers.'
    },
    {
      label: 'Smart matching heatmap',
      detail: 'See which residence halls want your style before you list.'
    }
  ];

  const lockers = [
    { name: 'Student Center Locker Wall', status: '24/7 access', queue: 'Low' },
    { name: 'North Quad Lobby Lockers', status: 'Access 8a-11p', queue: 'Med' },
    { name: 'STEM Library Smart Locker', status: 'Staff assisted', queue: 'Low' }
  ];

  return (
    <div className="page-content">
      <main>
        <section className="hero">
          <p className="eyebrow">ThreadLoop MVP</p>
          <h1>Swap clothes with your campus in minutes.</h1>
          <p className="lead">
            Listings are AI-assisted, local, and locker-friendly. Post an item, get instant smart matches, and meet up on your own terms.
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

        <section className="locker-section">
          <div className="section-header">
            <h2>Locker drop availability</h2>
            <span>Reserve a locker when you accept a swap</span>
          </div>
          <div className="locker-grid">
            {lockers.map((locker) => (
              <article key={locker.name} className="locker-card">
                <h3>{locker.name}</h3>
                <p>{locker.status}</p>
                <span className="pill">Queue: {locker.queue}</span>
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
              <p>No listings posted yet. Use the API to seed sample data.</p>
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
