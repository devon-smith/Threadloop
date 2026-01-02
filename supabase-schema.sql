-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Campuses table
CREATE TABLE campuses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email_domains TEXT[] NOT NULL,
  location JSONB,
  locker_locations JSONB,
  safe_zones JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth0_user_id TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  campus_id UUID REFERENCES campuses(id),
  display_name TEXT,
  auth_provider TEXT DEFAULT 'auth0',
  avatar_url TEXT,
  bio TEXT,
  rating DECIMAL(3,2) DEFAULT 0,
  total_ratings INTEGER DEFAULT 0,
  swap_count INTEGER DEFAULT 0,
  successful_swaps INTEGER DEFAULT 0,
  swap_streak INTEGER DEFAULT 0,
  average_response_time INTEGER DEFAULT 0,
  response_rate DECIMAL(3,2) DEFAULT 0,
  style_vibes TEXT[],
  favorite_colors TEXT[],
  sizing_profile JSONB DEFAULT '{}'::jsonb,
  settings JSONB DEFAULT '{"showProfile": true, "allowMessages": true, "shareStylePreferences": true}'::jsonb,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User badges (many-to-many)
CREATE TABLE user_badges (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  earned_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

-- Listings table
CREATE TABLE listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES users(id),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  size TEXT,
  condition TEXT,
  price DECIMAL(10,2),
  image_url TEXT,
  campus_id UUID REFERENCES campuses(id),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES listings(id),
  buyer_id UUID REFERENCES users(id),
  seller_id UUID REFERENCES users(id),
  amount DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  meetup_location JSONB,
  meetup_time TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_users_auth0_id ON users(auth0_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_listings_seller ON listings(seller_id);
CREATE INDEX idx_listings_campus ON listings(campus_id);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);

-- Seed campuses data
INSERT INTO campuses (id, name, email_domains, location, safe_zones, locker_locations) VALUES
(
  '22222222-2222-2222-2222-222222222222',
  'Stanford University',
  ARRAY['stanford.edu'],
  '{"city": "Stanford", "state": "CA", "coordinates": {"lat": 37.4275, "lng": -122.1697}}'::jsonb,
  '[
    {"name": "Green Library 3rd Floor", "type": "library", "coordinates": {"lat": 37.4265, "lng": -122.1686}, "hours": "24/7"},
    {"name": "Coupa Cafe", "type": "cafe", "coordinates": {"lat": 37.426, "lng": -122.1693}, "hours": "7am-7pm"},
    {"name": "Tresidder Student Union", "type": "student-center", "coordinates": {"lat": 37.4252, "lng": -122.1698}, "hours": "7am-10pm"}
  ]'::jsonb,
  '[
    {"name": "Green Library Lockers", "building": "Green Library", "coordinates": {"lat": 37.4265, "lng": -122.1686}, "hours": "24/7", "capacity": 50},
    {"name": "Tresidder Union Lockers", "building": "Tresidder Student Union", "coordinates": {"lat": 37.4252, "lng": -122.1698}, "hours": "6am-12am", "capacity": 30}
  ]'::jsonb
),
(
  '33333333-3333-3333-3333-333333333333',
  'UC Berkeley',
  ARRAY['berkeley.edu'],
  '{"city": "Berkeley", "state": "CA", "coordinates": {"lat": 37.8719, "lng": -122.2585}}'::jsonb,
  '[
    {"name": "Doe Library", "type": "library", "coordinates": {"lat": 37.8723, "lng": -122.2594}, "hours": "8am-12am"},
    {"name": "Student Union", "type": "student-center", "coordinates": {"lat": 37.8698, "lng": -122.2601}, "hours": "7am-11pm"}
  ]'::jsonb,
  '[
    {"name": "Doe Library Lockers", "building": "Doe Memorial Library", "coordinates": {"lat": 37.8723, "lng": -122.2594}, "hours": "8am-12am", "capacity": 40}
  ]'::jsonb
),
(
  '44444444-4444-4444-4444-444444444444',
  'MIT',
  ARRAY['mit.edu'],
  '{"city": "Cambridge", "state": "MA", "coordinates": {"lat": 42.3601, "lng": -71.0942}}'::jsonb,
  '[
    {"name": "Hayden Library", "type": "library", "coordinates": {"lat": 42.3598, "lng": -71.0923}, "hours": "24/7"},
    {"name": "Student Center", "type": "student-center", "coordinates": {"lat": 42.3584, "lng": -71.0956}, "hours": "7am-2am"}
  ]'::jsonb,
  '[
    {"name": "Student Center Lockers", "building": "Stratton Student Center", "coordinates": {"lat": 42.3584, "lng": -71.0956}, "hours": "24/7", "capacity": 60}
  ]'::jsonb
);
