# ThreadLoop Campus Clothing Exchange

## Problem & Opportunity
Students accumulate closets full of under-used clothes, yet existing resale platforms feel like overkill for quick, local swaps. Shipping costs, listing effort, marketplace fees, and fear of meeting strangers create friction that keeps dorm-room inventory idle. ThreadLoop removes those barriers by creating a campus-only, instant, trusted exchange designed for the way students already trade items.

## Product Vision
ThreadLoop is a mobile-first marketplace that lets students sell, buy, or swap items with nearby classmates in minutes. Listings are AI-assisted, discovery is personalized, and local meetups (or locker drop-offs) keep the experience free, fast, and safe. The platform builds liquidity through smart matching, fair-pricing guidance, and social proof (successful swaps, ratings, style vibes).

## Core Principles
- **Campus trust boundary**: University SSO + optional campus ID verification, campus-only geofences, and swap histories make students confident to transact.
- **Low friction**: AI handles tagging, titles, descriptions, smart pricing, and outfit matching so posting takes seconds.
- **Instant liquidity**: Personalized feed ranking, similar-item recommendations, and smart swap suggestions help every new listing find a match quickly.
- **Mobile moments**: React Native app is the primary experience; a lightweight web dashboard helps admins and power sellers.

## MVP Scope
### Client Apps
- React Native iOS/Android app for students (Expo for faster iteration).
- Optional React (Next.js) web dashboard for moderators, analytics, and content review.

### Backend & API
- Node.js (NestJS or Express + TypeScript) REST API, with GraphQL gateway considered later for richer filtering.
- Authentication via email magic link plus campus SSO (OAuth/SAML provider per university).
- Core services: Profiles, Listings, Media upload, Swap requests, Messaging, Notifications, Moderation.

### Data & Storage
- PostgreSQL on Supabase or RDS for transactional data.
- Redis for caching hot feeds, session tokens, and rate limiting.
- S3-compatible bucket (Supabase Storage or AWS S3) for listing images.
- Elasticsearch/OpenSearch for keyword + filter search; OpenSearch vector extension ready for embeddings.

### Messaging & Notifications
- Lightweight in-app messaging with room-per-transaction model stored in Postgres to start, move to a managed chat service (Stream/Firebase) if needed.
- Push notifications via Firebase Cloud Messaging and Apple Push Notification service.

### Safety & Trust
- University SSO gating + SMS/email verification for meetup coordination.
- Report/flag workflow with moderator dashboard.
- Ratings, swap counts, and badge system to highlight trustworthy traders.
- Optional campus ID barcode scan stored as hashed token for dispute resolution.

### Deployment & DevOps
- Monorepo managed with PNPM workspaces (mobile + backend + shared packages).
- GitHub Actions for CI (lint, test, build, deploy).
- Infrastructure on AWS (ECS Fargate or Lambda + API Gateway) or Supabase for faster MVP; Terraform scripts once architecture stabilizes.

## AI Features
| Feature | User Value | Data/Model Inputs |
| --- | --- | --- |
| Automated photo tagging | Upload -> auto-filled category, color, brand, style, size suggestions for 1-tap confirmation. | Vision transformer (e.g., CLIP) fine-tuned on apparel; metadata feedback loop. |
| AI-assisted listing creation | Title + description drafted instantly from uploaded images and size info. | Image embeddings + prompt template via GPT-4o mini or local LLM. |
| Smart pricing & swap suggestions | Recommended price band + highlight equivalent-value swap opportunities on campus. | Campus historical sales, online resale comps via public APIs, listing embeddings. |
| Similar-item recommendations | Boost liquidity by showing comparable items and bundles. | Vector search (OpenSearch k-NN) using CLIP embeddings and text metadata. |
| Outfit/Style matching | Suggest complementary items (“Pairs well with white sneakers”). | Embedding similarity + curated style graph. |
| Quality/fraud detection | Flag blurry, stock, or suspicious photos for review. | Vision quality heuristics, reverse image search, anomaly detection on text/image mix. |
| Personalized feed ranking | Predict interest per user to order the home feed. | Behavioral events (views, saves, swaps), listing embeddings, collaborative filtering. |

## High-Level Architecture
```
[React Native App] --REST/WS--> [API Gateway]
                                   |
                     [Auth Service / SSO Adapter]
                                   |
                              [Core API]
            Profiles  Listings  Messaging  Notifications  Moderation
                 |          |          |           |             |
            [PostgreSQL]---[Redis cache]---[Elasticsearch/OpenSearch]
                 |                         \
                 |                          -> [Vector Index (k-NN)]
                 |-> [S3 Storage for images]

AI Assist Pipeline: Upload -> (Image preprocessing) -> (Tagger + CLIP embeddings) ->
-> Auto-metadata suggestions -> GPT template -> Listing draft -> User confirmation.
```

## Key Data Entities
| Entity | Important Fields |
| --- | --- |
| `campus` | id, name, domain whitelist, geo-boundaries, locker locations |
| `user` | id, email, hashed campus id, auth provider, status |
| `profile` | user_id, display_name, bio, measurements, style tags, rating, swap_count |
| `listing` | id, seller_id, campus_id, title, description, category, size, condition, price, swap_value, status, ai_metadata jsonb |
| `listing_image` | id, listing_id, storage_url, embedding_vector reference, quality_score |
| `swap_request` | id, listing_id, buyer_id, offer_listing_id?, offered_price, status, meetup_option, chat_room_id |
| `message` | id, room_id, sender_id, body, attachments |
| `notification` | id, user_id, type, payload jsonb, read_at |
| `rating` | id, rater_id, ratee_id, transaction_id, score, comment |
| `style_tag` | id, name, embedding, popularity_rank |
| `audit_event` | id, actor_id, type, payload, created_at (for moderation) |

## Sample API Surface
- `POST /auth/magic-link` – start login; `POST /auth/verify` – confirm OTP.
- `GET /campus/:id/feed` – paginated feed sorted by personalized rank.
- `POST /listings` – create listing (payload includes AI metadata suggestions, final user confirmation).
- `POST /listings/:id/swap-requests` – offer purchase or swap.
- `POST /swap-requests/:id/messages` – transactional chat thread.
- `POST /listings/:id/report` – flag suspicious content.
- `GET /recommendations/:userId` – personalized bundle/outfit suggestions.
- `POST /ai/listing-suggestions` – (MVP stub) accept uploaded image data or URL and return auto-filled listing metadata.

## AI/ML Workflow
1. **Image ingest**: Images uploaded to S3 via signed URL → Lambda/SQS event triggers processing pipeline.
2. **Pre-processing**: Resize, background cleanup; store derivatives.
3. **Tagging & embeddings**: Run through apparel classifier + CLIP to output categories/colors and vector index entries.
4. **Listing draft**: Combine predicted metadata with user-supplied size info; prompt LLM for concise title/description.
5. **Quality/fraud check**: Evaluate blur, detect stock imagery; send suspicious listings to moderation queue.
6. **Personalization**: Track user actions -> feature store; nightly or streaming updates to ranking model; online inference re-orders feeds.
7. **Smart pricing**: Blend campus comparable sales, regional resale API comps, and inflation indices to create price bands; display confidence level.

## Roadmap
1. **Phase 0 – Foundations (Weeks 0-2)**
   - Bootstrap monorepo, Auth scaffolding, campus config, storage wiring.
   - Manual listing creation, browse feed, swap request messaging.
2. **Phase 1 – MVP Launch (Weeks 3-8)**
   - AI-assisted listing (tagging + GPT description), push notifications, moderator dashboard, reporting.
   - Initial personalized feed (rules + lightweight collaborative filtering), smart pricing beta.
   - Pilot on single campus with concierge onboarding and locker drop-off experiment.
3. **Phase 2 – Liquidity & Trust (Weeks 9-16)**
   - Formal ratings/badges, dispute workflow, verified locker partners.
   - Similar-item recs + outfit suggestions using embeddings.
   - Automated fraud detection alerts; A/B test ranking improvements.
4. **Phase 3 – Scale & Automation (Weeks 17+)**
   - Expand multi-campus with domain-based gating and campus-specific configs.
   - Advanced AI closet management, style personas, swap matchmaking graph.
   - Infrastructure hardening (Terraform, multi-region failover), growth analytics.

## Metrics to Track
- Liquidity: % listings receiving swap request within 48h, average time-to-first-offer, sell-through rate.
- Supply health: Active listings per active seller, repost rate, average quality score.
- Trust & Safety: Report rate, resolution time, rating distribution, repeat transactors.
- AI Impact: % listings auto-tagged without edits, pricing suggestion adoption, rec CTR → swap conversion.
- Engagement: DAU/WAU, session length, saves per user, outfit suggestion taps.

## Next Steps
1. Create wireframes/user flows for onboarding, listing creation, and swap messaging.
2. Stand up PNPM monorepo (`apps/mobile`, `apps/api`, `packages/shared`).
3. Implement Supabase (or AWS Cognito + Postgres) auth + storage baseline.
4. Prototype AI tagging workflow with hosted CLIP endpoint + GPT-4o mini for description drafting.
5. Run campus interviews to validate pricing guidance and locker logistics assumptions.

## Repository Structure
```
ThreadLoop/
├── apps/
│   ├── api/         # Node/Express TypeScript API
│   ├── mobile/      # Expo/React Native client
│   └── web/         # Vite/React web MVP
├── packages/
│   └── shared/      # Cross-platform domain types
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── README.md
```

## Local Development
1. Install dependencies with `pnpm install` from the repo root.
2. Duplicate `apps/api/.env.example` into `.env` and set secrets.
3. Run the backend with `pnpm dev:api` (defaults to port `4000`).
4. Run the mobile client with `pnpm dev:mobile` and point `EXPO_PUBLIC_API_BASE_URL` to the API.
5. Alternatively, start the web client with `VITE_API_BASE_URL=http://localhost:4000 pnpm dev:web` for a browser-based MVP.
6. Drop temporary photos into `clothing_photos/`; the API serves that directory at `/static/...` so the web feed can load real campus imagery.

Shared domain contracts live in `packages/shared`. Both the API and mobile app import those definitions to stay in sync as entities evolve.

## Campus-Focused MVP Features
- Verified access (SSO + optional ID scan) ensures listings stay within the university boundary.
- Locker drop network coordinates staffed and self-serve drop spots with digital reservations.
- Residence heatmaps highlight which dorms or clubs are most interested in each category.
- AI concierge auto-fills titles/descriptions from a quick upload, keeping posts effortless.
- Trust signals like swap streaks, meet-up ratings, and style badges surface reliable traders.
