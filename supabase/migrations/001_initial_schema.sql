-- ThreadLoop Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CAMPUSES
-- ============================================
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, -- e.g., 'stanford', 'berkeley'
  email_domains TEXT[] NOT NULL, -- e.g., ['stanford.edu']
  location JSONB, -- { city, state, coordinates: { lat, lng } }
  locker_locations JSONB DEFAULT '[]',
  safe_zones JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert initial campuses
INSERT INTO campuses (id, name, slug, email_domains, location) VALUES
  ('22222222-2222-2222-2222-222222222222', 'Stanford University', 'stanford',
   ARRAY['stanford.edu'],
   '{"city": "Stanford", "state": "CA", "coordinates": {"lat": 37.4275, "lng": -122.1697}}'::jsonb),
  ('33333333-3333-3333-3333-333333333333', 'UC Berkeley', 'berkeley',
   ARRAY['berkeley.edu'],
   '{"city": "Berkeley", "state": "CA", "coordinates": {"lat": 37.8719, "lng": -122.2585}}'::jsonb);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth0_id TEXT UNIQUE NOT NULL, -- Auth0 user ID (sub claim)
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  campus_id UUID REFERENCES campuses(id),
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,

  -- Authentication
  auth_provider TEXT NOT NULL DEFAULT 'auth0', -- 'auth0', 'stanford-saml', 'berkeley-saml'
  last_login TIMESTAMPTZ DEFAULT NOW(),

  -- Reputation & Trust
  rating DECIMAL(3,2) DEFAULT 0, -- 0-5 average rating
  total_ratings INTEGER DEFAULT 0,
  swap_count INTEGER DEFAULT 0,
  successful_swaps INTEGER DEFAULT 0,
  badges TEXT[] DEFAULT ARRAY['verified-student'],
  swap_streak INTEGER DEFAULT 0,

  -- Response metrics
  average_response_time INTEGER DEFAULT 0, -- in minutes
  response_rate DECIMAL(5,2) DEFAULT 0, -- percentage

  -- Style Profile
  style_vibes TEXT[] DEFAULT '{}',
  favorite_colors TEXT[] DEFAULT '{}',
  sizing_profile JSONB DEFAULT '{}',

  -- Privacy settings
  settings JSONB DEFAULT '{
    "showProfile": true,
    "allowMessages": true,
    "shareStylePreferences": true,
    "emailNotifications": true,
    "pushNotifications": true
  }',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_users_auth0_id ON users(auth0_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_campus_id ON users(campus_id);

-- ============================================
-- LISTINGS
-- ============================================
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campus_id UUID NOT NULL REFERENCES campuses(id),

  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'tops', 'bottoms', 'dresses', 'shoes', 'accessories', 'outerwear'
  size TEXT,
  condition TEXT NOT NULL CHECK (condition IN ('new', 'like_new', 'good', 'fair')),
  brand TEXT,
  color TEXT,

  price DECIMAL(10,2),
  swap_value DECIMAL(10,2),
  is_swappable BOOLEAN DEFAULT TRUE,
  is_sellable BOOLEAN DEFAULT TRUE,

  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reserved', 'sold', 'swapped', 'cancelled')),

  -- AI-generated metadata
  ai_metadata JSONB DEFAULT '{}',

  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listings_seller_id ON listings(seller_id);
CREATE INDEX idx_listings_campus_id ON listings(campus_id);
CREATE INDEX idx_listings_status ON listings(status);
CREATE INDEX idx_listings_category ON listings(category);

-- ============================================
-- LISTING IMAGES
-- ============================================
CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  storage_url TEXT NOT NULL,
  position INTEGER DEFAULT 0, -- for ordering
  quality_score DECIMAL(3,2), -- AI quality score
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_listing_images_listing_id ON listing_images(listing_id);

-- ============================================
-- CONVERSATIONS
-- ============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'offer-made', 'accepted', 'completed', 'archived')),

  -- Unread counts stored as JSON for flexibility
  unread_count JSONB DEFAULT '{"buyer": 0, "seller": 0}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate conversations for same listing/buyer
  UNIQUE(listing_id, buyer_id)
);

CREATE INDEX idx_conversations_buyer_id ON conversations(buyer_id);
CREATE INDEX idx_conversations_seller_id ON conversations(seller_id);
CREATE INDEX idx_conversations_listing_id ON conversations(listing_id);

-- ============================================
-- MESSAGES
-- ============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

  content TEXT NOT NULL,
  attachments JSONB DEFAULT '[]', -- [{ type: 'image' | 'location', url: string }]

  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- ============================================
-- TRANSACTIONS
-- ============================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id),
  buyer_id UUID NOT NULL REFERENCES users(id),
  seller_id UUID NOT NULL REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),

  -- Transaction details
  type TEXT NOT NULL CHECK (type IN ('purchase', 'swap')),
  price DECIMAL(10,2),
  swap_item_id UUID REFERENCES listings(id), -- if type is 'swap'

  -- Meetup info
  meetup_location JSONB,
  meetup_time TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'completed', 'cancelled', 'disputed')),
  payment_status TEXT CHECK (payment_status IN ('pending', 'held', 'released', 'refunded')),

  -- Completion
  completed_at TIMESTAMPTZ,
  buyer_confirmed BOOLEAN DEFAULT FALSE,
  seller_confirmed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_buyer_id ON transactions(buyer_id);
CREATE INDEX idx_transactions_seller_id ON transactions(seller_id);
CREATE INDEX idx_transactions_listing_id ON transactions(listing_id);

-- ============================================
-- RATINGS
-- ============================================
CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  transaction_id UUID NOT NULL REFERENCES transactions(id),
  rater_id UUID NOT NULL REFERENCES users(id),
  ratee_id UUID NOT NULL REFERENCES users(id),

  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  comment TEXT,

  -- Category ratings
  communication_score INTEGER CHECK (communication_score >= 1 AND communication_score <= 5),
  item_condition_score INTEGER CHECK (item_condition_score >= 1 AND item_condition_score <= 5),
  timeliness_score INTEGER CHECK (timeliness_score >= 1 AND timeliness_score <= 5),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- One rating per rater per transaction
  UNIQUE(transaction_id, rater_id)
);

CREATE INDEX idx_ratings_ratee_id ON ratings(ratee_id);

-- ============================================
-- FAVORITES (Wishlist)
-- ============================================
CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, listing_id)
);

CREATE INDEX idx_favorites_user_id ON favorites(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE campuses ENABLE ROW LEVEL SECURITY;

-- Campuses: Everyone can read
CREATE POLICY "Campuses are viewable by everyone" ON campuses
  FOR SELECT USING (true);

-- Users: Public profiles viewable, own profile editable
CREATE POLICY "Public profiles are viewable by everyone" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid()::text = auth0_id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid()::text = auth0_id);

-- Listings: Active listings viewable by all, own listings editable
CREATE POLICY "Active listings are viewable by everyone" ON listings
  FOR SELECT USING (status = 'active' OR seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

CREATE POLICY "Users can insert own listings" ON listings
  FOR INSERT WITH CHECK (seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

CREATE POLICY "Users can update own listings" ON listings
  FOR UPDATE USING (seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

CREATE POLICY "Users can delete own listings" ON listings
  FOR DELETE USING (seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

-- Listing Images: Follow listing permissions
CREATE POLICY "Listing images viewable with listing" ON listing_images
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own listing images" ON listing_images
  FOR ALL USING (listing_id IN (
    SELECT id FROM listings WHERE seller_id IN (
      SELECT id FROM users WHERE auth0_id = auth.uid()::text
    )
  ));

-- Conversations: Only participants can view/create
CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text) OR
    seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text)
  );

CREATE POLICY "Users can create conversations" ON conversations
  FOR INSERT WITH CHECK (buyer_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

-- Messages: Only conversation participants can view/send
CREATE POLICY "Users can view messages in own conversations" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE
        buyer_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text) OR
        seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text)
    )
  );

CREATE POLICY "Users can send messages in own conversations" ON messages
  FOR INSERT WITH CHECK (
    sender_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text) AND
    conversation_id IN (
      SELECT id FROM conversations WHERE
        buyer_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text) OR
        seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text)
    )
  );

-- Favorites: Users manage own favorites
CREATE POLICY "Users can view own favorites" ON favorites
  FOR SELECT USING (user_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (user_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

-- Transactions: Only participants can view
CREATE POLICY "Users can view own transactions" ON transactions
  FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text) OR
    seller_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text)
  );

-- Ratings: Public viewing, own creation
CREATE POLICY "Ratings are viewable by everyone" ON ratings
  FOR SELECT USING (true);

CREATE POLICY "Users can create own ratings" ON ratings
  FOR INSERT WITH CHECK (rater_id IN (SELECT id FROM users WHERE auth0_id = auth.uid()::text));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update user rating when new rating is added
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE users SET
    rating = (SELECT AVG(score) FROM ratings WHERE ratee_id = NEW.ratee_id),
    total_ratings = (SELECT COUNT(*) FROM ratings WHERE ratee_id = NEW.ratee_id)
  WHERE id = NEW.ratee_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_rating_on_new_rating
  AFTER INSERT ON ratings
  FOR EACH ROW EXECUTE FUNCTION update_user_rating();

-- Function to increment listing view count
CREATE OR REPLACE FUNCTION increment_view_count(listing_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE listings SET view_count = view_count + 1 WHERE id = listing_uuid;
END;
$$ LANGUAGE plpgsql;
