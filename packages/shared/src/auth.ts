// Authentication and user profile types

export type Campus = {
  id: string;
  name: string;
  emailDomains: string[]; // e.g., ['stanford.edu', 'berkeley.edu']
  location: {
    city: string;
    state: string;
    coordinates: { lat: number; lng: number };
  };
  lockerLocations?: {
    name: string;
    building: string;
    coordinates: { lat: number; lng: number };
    hours: string;
    capacity: number;
  }[];
  safeZones?: {
    name: string;
    type: 'library' | 'cafe' | 'student-center' | 'dining-hall' | 'other';
    coordinates: { lat: number; lng: number };
    hours: string;
  }[];
};

export type TrustBadge =
  | 'verified-student'
  | 'stanford'              // Stanford verified via SAML
  | 'berkeley'              // Berkeley verified via SAML
  | 'reliable-swapper'      // 10+ successful swaps
  | 'quick-responder'       // avg response < 2 hours
  | 'campus-og'             // active for 1+ year
  | 'top-seller'            // 50+ sales
  | 'sustainability-champion'; // 100+ items swapped

export type StyleVibe =
  | 'minimalist'
  | 'preppy'
  | 'streetwear'
  | 'vintage'
  | 'bohemian'
  | 'sporty'
  | 'professional'
  | 'edgy'
  | 'casual';

export type UserProfile = {
  id: string;
  email: string;
  emailVerified: boolean;
  campusId: string;
  displayName: string;
  avatarUrl?: string;
  bio?: string;

  // Authentication
  authProvider: 'google' | 'email' | 'auth0' | 'stanford-saml' | 'berkeley-saml';
  lastLogin: Date;
  createdAt: Date;

  // Reputation & Trust
  rating: number; // 0-5 average rating
  totalRatings: number;
  swapCount: number;
  successfulSwaps: number;
  badges: TrustBadge[];
  swapStreak: number; // consecutive days with activity

  // Response metrics
  averageResponseTime: number; // in minutes
  responseRate: number; // percentage of messages responded to

  // Style Profile
  styleVibes: StyleVibe[];
  favoriteColors: string[];
  sizingProfile: {
    topSize?: string;
    bottomSize?: string;
    shoeSize?: string;
    dressSize?: string;
  };

  // Privacy settings
  settings: {
    showProfile: boolean;
    allowMessages: boolean;
    shareStylePreferences: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
};

export type Rating = {
  id: string;
  transactionId: string;
  raterId: string;
  rateeId: string;
  score: number; // 1-5
  comment?: string;
  categories: {
    communication: number; // 1-5
    itemCondition: number; // 1-5
    timeliness: number; // 1-5
  };
  createdAt: Date;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  listingId?: string;
  content: string;
  attachments?: {
    type: 'image' | 'location';
    url: string;
  }[];
  read: boolean;
  createdAt: Date;
};

export type Conversation = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  lastMessage?: Message;
  unreadCount: { buyer: number; seller: number };
  status: 'active' | 'offer-made' | 'accepted' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  listingId: string;
  buyerId: string;
  sellerId: string;
  conversationId: string;

  // Transaction details
  type: 'purchase' | 'swap';
  price?: number;
  swapItemId?: string; // if type is 'swap'

  // Meetup info
  meetupLocation?: {
    name: string;
    type: 'safe-zone' | 'locker' | 'custom';
    coordinates?: { lat: number; lng: number };
  };
  meetupTime?: Date;

  // Status
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'disputed';
  paymentStatus?: 'pending' | 'held' | 'released' | 'refunded';

  // Completion
  completedAt?: Date;
  buyerConfirmed: boolean;
  sellerConfirmed: boolean;

  createdAt: Date;
  updatedAt: Date;
};

export type MeetupSuggestion = {
  location: {
    name: string;
    type: 'library' | 'cafe' | 'student-center' | 'dining-hall' | 'locker' | 'custom';
    coordinates: { lat: number; lng: number };
    distanceFromBuyer: number; // in meters
    distanceFromSeller: number;
  };
  suggestedTimes: {
    time: Date;
    reason: string; // e.g., "Both free between classes"
  }[];
  score: number; // 0-100 convenience score
};
