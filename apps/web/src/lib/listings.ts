import { supabase, DbListing, DbListingImage } from './supabase';
import type { Listing, ListingImage } from '@threadloop/shared';

// Convert DB listing to app format
function toAppListing(
  dbListing: DbListing & {
    listing_images?: DbListingImage[];
    seller?: { id: string; display_name: string; avatar_url: string | null; rating: number };
  }
): Listing & { seller?: { id: string; displayName: string; avatarUrl?: string; rating: number } } {
  return {
    id: dbListing.id,
    sellerId: dbListing.seller_id,
    campusId: dbListing.campus_id,
    title: dbListing.title,
    description: dbListing.description || '',
    category: dbListing.category,
    size: dbListing.size || 'One Size',
    condition: dbListing.condition,
    brand: dbListing.brand || undefined,
    price: dbListing.price || undefined,
    swapValue: dbListing.swap_value || undefined,
    status: dbListing.status,
    aiMetadata: dbListing.ai_metadata || {},
    images: (dbListing.listing_images || []).map(img => ({
      id: img.id,
      listingId: img.listing_id,
      storageUrl: img.storage_url,
      qualityScore: img.quality_score || undefined
    })),
    createdAt: new Date(dbListing.created_at),
    updatedAt: new Date(dbListing.updated_at),
    ...(dbListing.seller && {
      seller: {
        id: dbListing.seller.id,
        displayName: dbListing.seller.display_name,
        avatarUrl: dbListing.seller.avatar_url || undefined,
        rating: dbListing.seller.rating
      }
    })
  };
}

// Fetch all active listings with images and seller info
export async function fetchListings(options?: {
  campusId?: string;
  category?: string;
  sellerId?: string;
  limit?: number;
}): Promise<Listing[]> {
  let query = supabase
    .from('listings')
    .select(`
      *,
      listing_images (*),
      seller:users!listings_seller_id_fkey (id, display_name, avatar_url, rating)
    `)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (options?.campusId) {
    query = query.eq('campus_id', options.campusId);
  }
  if (options?.category) {
    query = query.eq('category', options.category);
  }
  if (options?.sellerId) {
    query = query.eq('seller_id', options.sellerId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching listings:', error);
    return [];
  }

  return (data || []).map(toAppListing);
}

// Fetch a single listing by ID
export async function fetchListing(id: string): Promise<(Listing & { seller?: { id: string; displayName: string; avatarUrl?: string; rating: number } }) | null> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images (*),
      seller:users!listings_seller_id_fkey (id, display_name, avatar_url, rating)
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching listing:', error);
    return null;
  }

  return toAppListing(data);
}

// Fetch user's own listings
export async function fetchMyListings(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      *,
      listing_images (*)
    `)
    .eq('seller_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching my listings:', error);
    return [];
  }

  return (data || []).map(toAppListing);
}

// Create a new listing
export async function createListing(input: {
  sellerId: string;
  campusId: string;
  title: string;
  description: string;
  category: string;
  size: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  brand?: string;
  price?: number;
  swapValue?: number;
  aiMetadata?: Record<string, unknown>;
  images: { storageUrl: string; qualityScore?: number }[];
}): Promise<Listing | null> {
  // First create the listing
  const { data: listing, error: listingError } = await supabase
    .from('listings')
    .insert({
      seller_id: input.sellerId,
      campus_id: input.campusId,
      title: input.title,
      description: input.description,
      category: input.category,
      size: input.size,
      condition: input.condition,
      brand: input.brand || null,
      price: input.price || null,
      swap_value: input.swapValue || null,
      is_swappable: !!input.swapValue,
      is_sellable: !!input.price,
      status: 'active',
      ai_metadata: input.aiMetadata || {}
    })
    .select()
    .single();

  if (listingError) {
    console.error('Error creating listing:', listingError);
    return null;
  }

  // Then add images
  if (input.images.length > 0) {
    const imageInserts = input.images.map((img, index) => ({
      listing_id: listing.id,
      storage_url: img.storageUrl,
      position: index,
      quality_score: img.qualityScore || null
    }));

    const { error: imageError } = await supabase
      .from('listing_images')
      .insert(imageInserts);

    if (imageError) {
      console.error('Error adding listing images:', imageError);
    }
  }

  // Fetch the complete listing with images
  return fetchListing(listing.id);
}

// Update listing status
export async function updateListingStatus(
  listingId: string,
  status: 'active' | 'reserved' | 'sold' | 'swapped' | 'cancelled'
): Promise<boolean> {
  const { error } = await supabase
    .from('listings')
    .update({ status })
    .eq('id', listingId);

  if (error) {
    console.error('Error updating listing status:', error);
    return false;
  }

  return true;
}

// Add to favorites
export async function addFavorite(userId: string, listingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: userId, listing_id: listingId });

  if (error) {
    console.error('Error adding favorite:', error);
    return false;
  }

  return true;
}

// Remove from favorites
export async function removeFavorite(userId: string, listingId: string): Promise<boolean> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('user_id', userId)
    .eq('listing_id', listingId);

  if (error) {
    console.error('Error removing favorite:', error);
    return false;
  }

  return true;
}

// Get user's favorites
export async function fetchFavorites(userId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('favorites')
    .select(`
      listing:listings (
        *,
        listing_images (*),
        seller:users!listings_seller_id_fkey (id, display_name, avatar_url, rating)
      )
    `)
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }

  return (data || [])
    .filter(f => f.listing)
    .map(f => toAppListing(f.listing as any));
}
