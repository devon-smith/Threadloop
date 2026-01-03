export type UUID = string;

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
  brand?: string;
  price?: number;
  swapValue?: number;
  status: 'active' | 'reserved' | 'sold' | 'swapped' | 'cancelled';
  aiMetadata?: Record<string, unknown>;
  images: ListingImage[];
  createdAt?: Date;
  updatedAt?: Date;
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
