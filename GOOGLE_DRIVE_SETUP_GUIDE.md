# Google Drive Integration Setup Guide

This guide will help you set up Google Drive integration for the Awake SA Admin Portal to enable uploading and managing product images and videos directly from Google Drive.

## Prerequisites

- A Google account
- Access to Google Cloud Console
- Admin access to the Awake SA Admin Portal

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `Awake-SA-Media-Manager` (or any name you prefer)
5. Click "Create"

## Step 2: Enable Google Drive API

1. In your Google Cloud project, go to **APIs & Services** > **Library**
2. Search for "Google Drive API"
3. Click on "Google Drive API"
4. Click "Enable"
5. Repeat for "Google Picker API" if available

## Step 3: Create OAuth 2.0 Credentials

### Create OAuth 2.0 Client ID

1. Go to **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "External" user type
   - Fill in the app name: "Awake SA Media Manager"
   - Add support email
   - Add authorized domains: `awakesa.co.za` and `localhost` (for development)
   - Click "Save and Continue"
   - Skip optional scopes
   - Add test users if needed
   - Click "Save and Continue"

4. Back to Create OAuth client ID:
   - Application type: **Web application**
   - Name: "Awake SA Admin Portal"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (for development)
     - `https://awakesa.co.za` (for production)
     - `https://your-vercel-url.vercel.app` (if using Vercel)
   - Click "Create"

5. Copy the **Client ID** - you'll need this

### Create API Key

1. Still in **APIs & Services** > **Credentials**
2. Click "Create Credentials" > "API key"
3. Copy the **API Key**
4. Click "Restrict Key" (recommended):
   - Under "API restrictions", select "Restrict key"
   - Choose "Google Drive API" and "Google Picker API"
   - Under "Application restrictions", select "HTTP referrers"
   - Add your domains:
     - `http://localhost:3000/*`
     - `https://awakesa.co.za/*`
     - `https://*.vercel.app/*` (if using Vercel)
   - Click "Save"

## Step 4: Get Google Drive App ID

1. Go to **APIs & Services** > **OAuth consent screen**
2. Your App ID is shown at the top of the page
3. Copy this number

## Step 5: Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Google Drive Integration
NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID=1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY=AIzaSyAbCdEfGhIjKlMnOpQrStUvWxYz1234567
NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID=1234567890
```

Replace with your actual values from the previous steps.

## Step 6: Restart Your Application

```bash
npm run dev
```

## Step 7: Test the Integration

1. Log in to the Admin Portal: `http://localhost:3000/admin`
2. Go to Dashboard and click "Media Library"
3. Or go to "Manage Products" and edit any product
4. In the Media Management section, click "Select from Google Drive"
5. You should see the Google Drive Picker open
6. Select files from your Google Drive
7. The files should be added to the product

## Troubleshooting

### "Google Drive is not configured" Error

**Problem**: The Google Drive picker button is disabled and shows "not configured"

**Solution**: 
- Check that all three environment variables are set in `.env.local`
- Make sure the values are not the placeholder text (`your-client-id`, etc.)
- Restart your development server after adding the variables

### "Access Blocked: This app's request is invalid"

**Problem**: OAuth consent screen is not configured properly

**Solution**:
- Go to OAuth consent screen in Google Cloud Console
- Make sure all required fields are filled
- Add your domain to "Authorized domains"
- If testing, add your email to "Test users"

### "The origin http://localhost:3000 is not allowed"

**Problem**: Your domain is not authorized in OAuth credentials

**Solution**:
- Go to Credentials in Google Cloud Console
- Edit your OAuth 2.0 Client ID
- Add `http://localhost:3000` to "Authorized JavaScript origins"
- Wait a few minutes for changes to propagate

### Files from Google Drive not loading

**Problem**: CORS or API restrictions

**Solution**:
- Check API Key restrictions in Google Cloud Console
- Make sure Google Drive API is enabled
- Verify that your domain is allowed in both OAuth and API Key settings

## Security Best Practices

1. **Never commit credentials to Git**
   - `.env.local` is in `.gitignore` by default
   - Always use environment variables

2. **Use restricted API keys**
   - Limit API key to specific APIs (Google Drive, Picker)
   - Restrict by HTTP referrer

3. **Limit OAuth scopes**
   - Only request necessary permissions
   - The current setup only needs file picker access

4. **Regular key rotation**
   - Periodically rotate API keys
   - Update credentials in production environment

## Production Deployment

When deploying to production (Vercel, etc.):

1. Add the same environment variables to your production environment:
   - Go to your hosting platform settings
   - Add `NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID`
   - Add `NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY`
   - Add `NEXT_PUBLIC_GOOGLE_DRIVE_APP_ID`

2. Update authorized domains in Google Cloud Console:
   - Add your production domain to OAuth 2.0 credentials
   - Add your production domain to API key restrictions

3. Test the integration on production

## Additional Features

The Google Drive integration supports:

- ✅ **Multiple file selection** - Select multiple images/videos at once
- ✅ **File type filtering** - Automatically filters by images or videos
- ✅ **Direct links** - Uses Google Drive direct links for reliable access
- ✅ **Thumbnail support** - Shows thumbnails from Google Drive
- ✅ **Upload support** - Can upload new files to Google Drive
- ✅ **Shared drives** - Supports files from shared/team drives

## Alternative: Manual URL Input

If you prefer not to set up Google Drive integration, you can still:

1. Upload files to Google Drive manually
2. Get the shareable link
3. Use the "Add URL" option in the Media Manager
4. Paste the Google Drive link

## Support

For issues or questions:
- Email: info@awakesa.co.za
- Check Google Cloud Console documentation
- Review Google Drive API documentation

---

**Last Updated**: January 2026
