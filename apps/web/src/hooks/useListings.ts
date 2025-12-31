import { useState, useEffect, useCallback } from 'react';
import type { Listing } from '@threadloop/shared';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ??
  (import.meta.env.PROD ? `${window.location.origin}/api` : 'http://localhost:4000');

export function useListings() {
  const [data, setData] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchListings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/listings`);

      const contentType = response.headers.get('content-type') ?? '';
      const text = await response.text();

      if (!contentType.includes('application/json')) {
        throw new Error(
          `Failed to load listings (HTTP ${response.status}). ${text ? text.slice(0, 200) : 'Non-JSON response.'}`
        );
      }

      let payload: any;
      try {
        payload = text ? JSON.parse(text) : null;
      } catch {
        throw new Error(`Failed to parse listings response (HTTP ${response.status}).`);
      }

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.error ?? `Failed to load listings (HTTP ${response.status})`);
      }

      setData(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load listings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const addListing = (listing: Listing) => {
    setData((prev) => [listing, ...prev]);
  };

  return { data, loading, error, addListing, refetch: fetchListings };
}
