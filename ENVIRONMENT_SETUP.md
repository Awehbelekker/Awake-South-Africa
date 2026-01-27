# Environment Variables Configuration

This file documents all environment variables required for the Awake South Africa application.

## Required Variables

### Google Drive Integration (Optional)
```bash
# Get these from Google Cloud Console (https://console.cloud.google.com)
# Required for media picker functionality
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=your-client-id.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=your-api-key
NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID=your-app-id
```

### PayFast Payment Gateway (Required for Production)
```bash
# PayFast Merchant Credentials
# Get these from PayFast dashboard (https://www.payfast.co.za)
NEXT_PUBLIC_PAYFAST_MERCHANT_ID=your-merchant-id
NEXT_PUBLIC_PAYFAST_MERCHANT_KEY=your-merchant-key
PAYFAST_PASSPHRASE=your-secure-passphrase

# Use 'sandbox' for testing, 'production' for live
NEXT_PUBLIC_PAYFAST_MODE=sandbox
```

### Email Configuration (Required for Notifications)
```bash
# SMTP Configuration for sending emails
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@awakesouthafrica.co.za
```

### Database (Future - When migrating from localStorage)
```bash
# Supabase Configuration (Recommended)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OR PostgreSQL Direct Connection
DATABASE_URL=postgresql://user:password@host:5432/database
```

### Security & Authentication
```bash
# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET=your-nextauth-secret-key-here
NEXTAUTH_URL=https://your-domain.com

# JWT Secret
JWT_SECRET=your-jwt-secret-key-here
```

### WhatsApp Business (Current Implementation)
```bash
# Your WhatsApp Business number (with country code, no +)
NEXT_PUBLIC_WHATSAPP_NUMBER=27123456789
```

### Analytics & Monitoring (Optional)
```bash
# Google Analytics
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# Sentry Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

### Feature Flags (Optional)
```bash
# Enable/disable features
NEXT_PUBLIC_ENABLE_GOOGLE_DRIVE=true
NEXT_PUBLIC_ENABLE_WISHLIST=true
NEXT_PUBLIC_ENABLE_COMPARE=true
```

## Setup Instructions

### 1. Google Drive Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable Google Drive API and Google Picker API
4. Create OAuth 2.0 credentials (Choose "User data")
5. Add authorized JavaScript origins: `http://localhost:3000` and your production URL
6. Copy Client ID, API Key, and App ID to `.env.local`
7. Follow detailed guide in `GOOGLE_DRIVE_SETUP_GUIDE.md`

### 2. PayFast Setup
1. Sign up at [PayFast](https://www.payfast.co.za)
2. Get Merchant ID and Merchant Key from dashboard
3. Generate a secure passphrase (at least 16 characters)
4. Test in sandbox mode first
5. Configure webhook URL for payment confirmations

### 3. Email Setup (Gmail Example)
1. Enable 2-Factor Authentication on Gmail
2. Generate App Password: Account Settings → Security → App passwords
3. Use the generated 16-character password as `SMTP_PASSWORD`

### 4. Database Setup (Future)
**Recommended: Supabase** (Free tier available)
1. Create project at [Supabase](https://supabase.com)
2. Copy project URL and anon key
3. Create tables for products, locations, orders, users
4. Set up Row Level Security (RLS) policies

### 5. Deployment to Vercel
1. Push code to GitHub
2. Import project to Vercel
3. Add all environment variables in Vercel dashboard
4. Deploy
5. Configure custom domain (optional)

## Vercel Environment Variables

In Vercel Dashboard:
1. Go to Project Settings → Environment Variables
2. Add each variable (choose Production, Preview, or Development)
3. Redeploy after adding variables

**Important**: Do NOT commit `.env.local` to Git. It's already in `.gitignore`.

## Security Notes

- Never expose sensitive keys (SMTP passwords, service role keys) client-side
- Use `NEXT_PUBLIC_` prefix ONLY for variables that need to be exposed to the browser
- Rotate keys regularly
- Use different keys for development, staging, and production
- Keep passphrase secure and complex

## Validation

Check if environment variables are loaded:
```bash
npm run build
```

If any required variables are missing, the build will show warnings.

## Troubleshooting

### Google Drive not working
- Verify OAuth consent screen is configured
- Check authorized JavaScript origins include your domain
- Ensure APIs are enabled in Google Cloud Console

### PayFast payments failing
- Verify you're in correct mode (sandbox vs production)
- Check merchant credentials are correct
- Test webhook URL is accessible from PayFast servers

### Emails not sending
- Verify SMTP credentials
- Check if Less Secure App access is enabled (for Gmail)
- Or use App Password instead of regular password

## Need Help?

Contact: support@awakesouthafrica.co.za
