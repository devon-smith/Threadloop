// Authentication routes (OAuth simulation for MVP)

import { Router } from 'express';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { findCampusByEmailDomain } from '../data/campuses';
import type { UserProfile as ExtendedUserProfile, StyleVibe } from '@threadloop/shared';

const router = Router();

// In-memory user storage (would be database in production)
const users = new Map<string, ExtendedUserProfile>();

// Mock session storage
const sessions = new Map<string, string>(); // sessionId -> userId

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6).optional() // Optional for OAuth flow
});

const styleProfileSchema = z.object({
  styleVibes: z.array(z.string()),
  favoriteColors: z.array(z.string()),
  sizingProfile: z.object({
    topSize: z.string().optional(),
    bottomSize: z.string().optional(),
    shoeSize: z.string().optional(),
    dressSize: z.string().optional()
  }).optional()
});

// POST /auth/login - Simulate OAuth login
router.post('/login', (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const { email } = parsed.data;

  // Find campus from email domain
  const campus = findCampusByEmailDomain(email);
  if (!campus) {
    return res.status(400).json({
      success: false,
      error: 'Email domain not recognized. Please use your university email (.edu domain).'
    });
  }

  // Check if user exists
  let user = Array.from(users.values()).find(u => u.email === email);

  if (!user) {
    // Create new user
    user = {
      id: randomUUID(),
      email,
      emailVerified: true, // Assume OAuth verifies email
      campusId: campus.id,
      displayName: email.split('@')[0], // Default to email username
      authProvider: 'google',
      lastLogin: new Date(),
      createdAt: new Date(),
      rating: 0,
      totalRatings: 0,
      swapCount: 0,
      successfulSwaps: 0,
      badges: ['verified-student'], // Auto-grant verified badge
      swapStreak: 0,
      averageResponseTime: 0,
      responseRate: 0,
      styleVibes: [],
      favoriteColors: [],
      sizingProfile: {},
      settings: {
        showProfile: true,
        allowMessages: true,
        shareStylePreferences: true,
        emailNotifications: true,
        pushNotifications: true
      }
    };

    users.set(user.id, user);
  } else {
    // Update last login
    user.lastLogin = new Date();
  }

  // Create session
  const sessionId = randomUUID();
  sessions.set(sessionId, user.id);

  return res.json({
    success: true,
    data: {
      user,
      sessionId,
      campus
    }
  });
});

// GET /auth/me - Get current user
router.get('/me', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const userId = sessions.get(sessionId)!;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  return res.json({ success: true, data: user });
});

// PUT /auth/style-profile - Update style profile
router.put('/style-profile', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const parsed = styleProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ success: false, error: parsed.error.flatten() });
  }

  const userId = sessions.get(sessionId)!;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Update style profile
  user.styleVibes = parsed.data.styleVibes as StyleVibe[];
  user.favoriteColors = parsed.data.favoriteColors;
  if (parsed.data.sizingProfile) {
    user.sizingProfile = parsed.data.sizingProfile;
  }

  return res.json({ success: true, data: user });
});

// PUT /auth/profile - Update user profile
router.put('/profile', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');

  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ success: false, error: 'Not authenticated' });
  }

  const userId = sessions.get(sessionId)!;
  const user = users.get(userId);

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found' });
  }

  // Update allowed fields
  const { displayName, bio, avatarUrl } = req.body;

  if (displayName) user.displayName = displayName;
  if (bio !== undefined) user.bio = bio;
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl;

  return res.json({ success: true, data: user });
});

// POST /auth/logout
router.post('/logout', (req, res) => {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');

  if (sessionId) {
    sessions.delete(sessionId);
  }

  return res.json({ success: true });
});

// GET /auth/campuses - List available campuses
router.get('/campuses', (req, res) => {
  const { findCampusByEmailDomain, CAMPUSES } = require('../data/campuses');

  return res.json({
    success: true,
    data: CAMPUSES.map((c: { id: string; name: string; emailDomains: string[]; location: string }) => ({
      id: c.id,
      name: c.name,
      emailDomains: c.emailDomains,
      location: c.location
    }))
  });
});

export default router;
