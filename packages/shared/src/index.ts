export type UUID = string;

export interface Campus {
  id: UUID;
  name: string;
  domainWhitelist: string[];
  geoBoundary: { lat: number; lng: number; radiusKm: number };
  lockerLocations: string[];
}

export interface PublicProfileSummary {
  id: UUID;
  userId: UUID;
  displayName: string;
  bio?: string;
  measurements?: string;
  styleTags: string[];
  rating?: number;
  swapCount: number;
}

export interface ListingImage {
  id: UUID;
  listingId: UUID;
  storageUrl: string;
  qualityScore?: number;
}

export interface Listing {
  id: UUID;
  sellerId: UUID;
  campusId: UUID;
  title: string;
  description: string;
  category: string;
  size: string;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  price?: number;
  swapValue?: number;
  status: 'active' | 'reserved' | 'completed' | 'cancelled';
  aiMetadata?: Record<string, unknown>;
  images: ListingImage[];
}

export interface SwapRequest {
  id: UUID;
  listingId: UUID;
  buyerId: UUID;
  offerListingId?: UUID;
  offeredPrice?: number;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  meetupOption: 'in_person' | 'locker';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Re-export auth types
export * from './auth';
