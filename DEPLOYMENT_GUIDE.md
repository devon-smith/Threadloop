# ThreadLoop Deployment Guide

## Prerequisites Checklist
- [ ] Auth0 account configured
- [ ] Vercel account with environment variables set
- [ ] Supabase account (to be created)

---

## STEP 1: Configure Stanford SAML in Auth0 (30 min)

### 1.1 Create SAML Enterprise Connection

1. Go to [Auth0 Dashboard](https://manage.auth0.com)
2. Navigate to **Authentication** → **Enterprise** → **SAML**
3. Click **+ Create Connection**
4. Configure:
   - **Connection Name**: `stanford-saml`
   - **Sign In URL**: `https://login.stanford.edu/idp/profile/SAML2/Redirect/SSO`
   - **Sign Out URL**: `https://login.stanford.edu/idp/profile/SAML2/Redirect/SLO`

### 1.2 Get Stanford X509 Certificate

1. Download metadata from: `https://login.stanford.edu/idp/shibboleth`
2. Extract the `<X509Certificate>` content
3. Paste into Auth0 **X509 Signing Certificate** field

### 1.3 Configure Attribute Mappings

In **Mappings** tab, add:
```json
{
  "email": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress",
  "given_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname",
  "family_name": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname",
  "user_id": "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"
}
```

### 1.4 Enable for ThreadLoop Application

- Go to **Applications** tab in SAML connection
- Toggle ON for "ThreadLoop" application
- Save changes

---

## STEP 2: Update Auth0 Application Settings (10 min)

### 2.1 Configure Callback URLs

Go to Auth0 Dashboard → **Applications** → **ThreadLoop** → **Settings**

Add to **Allowed Callback URLs**:
```
http://localhost:5173/callback,
http://localhost:5174/callback,
https://threadloop-web.vercel.app/callback
```

Add to **Allowed Logout URLs**:
```
http://localhost:5173,
http://localhost:5174,
https://threadloop-web.vercel.app
```

Add to **Allowed Web Origins**:
```
http://localhost:5173,
http://localhost:5174,
https://threadloop-web.vercel.app
```

### 2.2 Save Changes

Click **Save Changes** at the bottom

---

## STEP 3: Set Up Supabase Database (20 min)

### 3.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **New Project**
3. Configure:
   - **Organization**: Create or select
   - **Project Name**: `threadloop`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to users (e.g., `us-west-1`)
4. Click **Create new project** (takes 2-3 minutes)

### 3.2 Run SQL Schema

1. Go to **SQL Editor** in left sidebar
2. Click **+ New query**
3. Copy content from `supabase-schema.sql` in project root
4. Click **Run** to execute
5. Verify tables created in **Table Editor**

### 3.3 Get API Credentials

1. Go to **Project Settings** → **API**
2. Copy these values:
   - **Project URL** (e.g., `https://abcdefg.supabase.co`)
   - **anon public** key
   - **service_role** secret key

---

## STEP 4: Add Supabase to Vercel Environment Variables (5 min)

### 4.1 Add to Vercel Dashboard

Go to Vercel → **threadloop-web** → **Settings** → **Environment Variables**

Add these NEW variables:

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your_anon_public_key_here
SUPABASE_SERVICE_KEY = your_service_role_secret_key
```

Set **Environment** to: `Production`, `Preview`, `Development` (all three)

### 4.2 Redeploy

After adding variables, trigger a new deployment or wait for next git push.

---

## STEP 5: Test Locally (10 min)

### 5.1 Create .env.local Files

**apps/web/.env.local**:
```env
VITE_AUTH0_DOMAIN=dev-voe0iav0bx1n8qkd.us.auth0.com
VITE_AUTH0_CLIENT_ID=ec2LAdO4LsXxvGV0cefThYKCIizeS512
VITE_API_BASE_URL=/api
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**apps/api/.env.local**:
```env
AUTH0_DOMAIN=dev-voe0iav0bx1n8qkd.us.auth0.com
AUTH0_AUDIENCE=https://api.threadloop.app
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_key
PORT=4000
```

### 5.2 Start Development Servers

```bash
# Terminal 1 - API
pnpm run dev:api

# Terminal 2 - Web
pnpm run dev:web
```

### 5.3 Test Auth Flow

1. Navigate to `http://localhost:5173` (or 5174)
2. Click "Login"
3. Click "Sign in with Stanford" button
4. Should redirect to Auth0 → Stanford Login
5. After login, redirects to `/callback` → `/style-quiz`
6. Complete quiz
7. View profile

---

## STEP 6: Deploy to Production

### 6.1 Push to Git

```bash
git add .
git commit -m "Add Auth0 and Supabase integration"
git push origin main
```

### 6.2 Vercel Auto-Deploy

Vercel will automatically detect the push and deploy. Check deployment at:
- https://vercel.com/your-org/threadloop-web

### 6.3 Test Production

1. Visit `https://threadloop-web.vercel.app`
2. Test Stanford SAML login flow
3. Verify data persists in Supabase

---

## Troubleshooting

### Common Issues

**Issue**: "Invalid callback URL" error
**Solution**: Ensure `https://threadloop-web.vercel.app/callback` is in Auth0 Allowed Callback URLs

**Issue**: Stanford SAML login fails
**Solution**:
- Verify Stanford SAML connection is enabled for ThreadLoop app in Auth0
- Check X509 certificate is correctly copied
- Ensure attribute mappings are configured

**Issue**: User data not saving to Supabase
**Solution**:
- Verify `SUPABASE_SERVICE_KEY` is set in Vercel
- Check SQL schema ran successfully
- View Supabase logs for errors

**Issue**: CORS errors
**Solution**:
- Add production URL to Auth0 Allowed Web Origins
- Verify API CORS settings include Vercel URL

---

## Next Steps After Deployment

1. **Monitor Auth0 Logs**: Check for failed login attempts
2. **Test with Real Stanford Account**: Use actual @stanford.edu email
3. **Add More Universities**: Repeat SAML setup for UC Berkeley, MIT
4. **Enable Row Level Security (RLS)** in Supabase for data protection
5. **Set up Sentry** for error tracking
6. **Configure custom domain** in Vercel (e.g., threadloop.app)

---

## Support

- Auth0 Docs: https://auth0.com/docs/authenticate/protocols/saml
- Supabase Docs: https://supabase.com/docs
- Stanford SAML Info: https://uit.stanford.edu/service/saml

