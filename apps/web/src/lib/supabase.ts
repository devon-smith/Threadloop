import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://krfbrprbevswfgpacjal.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtyZmJycHJiZXZzd2ZncGFjamFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcxNzE0NTcsImV4cCI6MjA4Mjc0NzQ1N30.MQB6ktrEuniZJcgkcylZhjE25vEQVgU976oaexh46Hc';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types (generated from schema)
export type DbUser = {
  id: string;
  auth0_id: string;
  email: string;
  email_verified: boolean;
  campus_id: string | null;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  auth_provider: string;
  last_login: string;
  rating: number;
  total_ratings: number;
  swap_count: number;
  successful_swaps: number;
  badges: string[];
  swap_streak: number;
  average_response_time: number;
  response_rate: number;
  style_vibes: string[];
  favorite_colors: string[];
  sizing_profile: Record<string, string>;
  settings: Record<string, boolean>;
  created_at: string;
  updated_at: string;
};

export type DbCampus = {
  id: string;
  name: string;
  slug: string;
  email_domains: string[];
  location: {
    city: string;
    state: string;
    coordinates: { lat: number; lng: number };
  };
  locker_locations: any[];
  safe_zones: any[];
  created_at: string;
  updated_at: string;
};

export type DbListing = {
  id: string;
  seller_id: string;
  campus_id: string;
  title: string;
  description: string | null;
  category: string;
  size: string | null;
  condition: 'new' | 'like_new' | 'good' | 'fair';
  brand: string | null;
  color: string | null;
  price: number | null;
  swap_value: number | null;
  is_swappable: boolean;
  is_sellable: boolean;
  status: 'active' | 'reserved' | 'sold' | 'swapped' | 'cancelled';
  ai_metadata: Record<string, unknown>;
  view_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
};

export type DbListingImage = {
  id: string;
  listing_id: string;
  storage_url: string;
  position: number;
  quality_score: number | null;
  created_at: string;
};

export type DbConversation = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  status: 'active' | 'offer-made' | 'accepted' | 'completed' | 'archived';
  unread_count: { buyer: number; seller: number };
  created_at: string;
  updated_at: string;
};

export type DbMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  attachments: { type: 'image' | 'location'; url: string }[];
  read: boolean;
  read_at: string | null;
  created_at: string;
};

export type DbTransaction = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  conversation_id: string | null;
  type: 'purchase' | 'swap';
  price: number | null;
  swap_item_id: string | null;
  meetup_location: Record<string, unknown> | null;
  meetup_time: string | null;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled' | 'disputed';
  payment_status: 'pending' | 'held' | 'released' | 'refunded' | null;
  completed_at: string | null;
  buyer_confirmed: boolean;
  seller_confirmed: boolean;
  created_at: string;
  updated_at: string;
};

export type DbRating = {
  id: string;
  transaction_id: string;
  rater_id: string;
  ratee_id: string;
  score: number;
  comment: string | null;
  communication_score: number | null;
  item_condition_score: number | null;
  timeliness_score: number | null;
  created_at: string;
};

export type DbFavorite = {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
};
