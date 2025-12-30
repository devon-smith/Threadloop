import React, { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import type { Listing } from '@threadloop/shared';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:4000';

export default function App() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchListings() {
      try {
        const response = await fetch(`${API_BASE_URL}/listings`);
        const payload = await response.json();
        if (!payload.success) {
          throw new Error(payload.error ?? 'Unknown error');
        }
        setListings(payload.data ?? []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listings');
      }
    }

    fetchListings();
  }, []);

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="dark-content" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>ThreadLoop</Text>
        <Text style={styles.subheading}>Campus swaps, instantly.</Text>
        {error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          listings.map((listing) => (
            <View key={listing.id} style={styles.card}>
              <Text style={styles.title}>{listing.title}</Text>
              <Text style={styles.meta}>{listing.category} • {listing.size}</Text>
              <Text style={styles.description}>{listing.description}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f8f5ff'
  },
  container: {
    padding: 24,
    gap: 16
  },
  heading: {
    fontSize: 28,
    fontWeight: '700'
  },
  subheading: {
    fontSize: 16,
    color: '#6b6b6b'
  },
  error: {
    color: '#c00'
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  title: {
    fontSize: 18,
    fontWeight: '600'
  },
  meta: {
    color: '#6b6b6b',
    marginBottom: 8
  },
  description: {
    color: '#1f1f1f'
  }
});
