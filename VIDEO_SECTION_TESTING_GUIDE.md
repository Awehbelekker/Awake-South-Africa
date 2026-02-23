# Video Section Testing Guide

## ✅ Deployment Status
- **GitHub:** Commit `78ab3e1` pushed successfully
- **Vercel:** Auto-deployed and live
- **Production URL:** https://awake-south-africa.vercel.app
- **Date:** February 20, 2026

---

## 🎥 New Video System Overview

### What Changed
- **OLD:** Videos mixed in image gallery, basic management
- **NEW:** Separate structured video sections with admin controls

### New Features
1. **Product Introduction** - Single hero video with title/description
2. **Action Videos** - Up to 3 videos in a grid layout
3. **Custom Thumbnails** - Upload your own thumbnail images (2MB limit)
4. **Visibility Toggles** - Show/hide each section independently
5. **No Duplication** - Videos completely separate from image gallery

---

## 📝 Testing Steps

### Step 1: Access Admin
1. Go to https://awake-south-africa.vercel.app/admin
2. Login with: `awake2026admin`
3. Navigate to **Products** tab

### Step 2: Edit a Product
1. Click **Edit** on any product (e.g., "Awake Neo Jacket")
2. Scroll down to **"See It In Action Videos"** section (below images)
3. You should see two sections:
   - Product Introduction
   - Action Videos

### Step 3: Add Product Introduction Video
1. **Enter YouTube URL** (e.g., `https://www.youtube.com/watch?v=dQw4w9WgXcQ`)
2. **Optional:** Add title (e.g., "Meet the Awake Neo Jacket")
3. **Optional:** Add description (e.g., "Experience the future of water sports")
4. **Enable visibility:** Click the eye icon (should turn green ✅)
5. **Preview:** Thumbnail should auto-load from YouTube

### Step 4: Add Action Videos
1. Click **"+ Add Action Video"** button
2. **Enter video URL** (YouTube or Vimeo)
3. **Enter title** (e.g., "Speed Test")
4. **Optional:** Upload custom thumbnail:
   - Hover over video preview
   - Click upload icon
   - Select image file (max 2MB, JPG/PNG/WebP)
5. **Repeat** to add up to 3 videos total
6. **Enable visibility:** Toggle the eye icon for this section

### Step 5: Save and View
1. Click **"Save Product"** button
2. Navigate to the product page: `/products/[product-id]`
3. Scroll to **"See It In Action"** section

### Expected Results
✅ Product Introduction displays as large hero video with title/description  
✅ Action Videos display in responsive grid (1-3 columns)  
✅ Click video thumbnails to play inline  
✅ Videos NOT in image gallery carousel  
✅ Only enabled sections are visible  

---

## 🧪 Test Cases

### Test Case 1: Product Introduction Only
- Enable Product Introduction section
- Disable Action Videos section
- **Expected:** Only hero video displays on product page

### Test Case 2: Action Videos Only
- Disable Product Introduction section
- Enable Action Videos section with 3 videos
- **Expected:** Only video grid displays (no hero video)

### Test Case 3: Both Sections
- Enable both sections
- Add 1 intro video + 3 action videos
- **Expected:** Hero video at top, then grid of 3 videos below

### Test Case 4: Custom Thumbnails
- Add action video
- Upload custom thumbnail image
- **Expected:** Custom thumbnail displays instead of YouTube auto-thumbnail

### Test Case 5: No Videos
- Disable both sections (or leave empty)
- **Expected:** "See It In Action" section doesn't appear on product page

---

## 🎬 Supported Video Platforms

### YouTube
- Standard: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short: `https://youtu.be/VIDEO_ID`
- Embed: `https://www.youtube.com/embed/VIDEO_ID`

### Vimeo
- Standard: `https://vimeo.com/VIDEO_ID`
- Player: `https://player.vimeo.com/video/VIDEO_ID`

---

## 📸 Thumbnail System

### Auto-Generated (YouTube)
- Automatically extracts from: `https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg`
- Falls back to default if not available

### Custom Upload
- **Formats:** JPG, PNG, WebP, GIF
- **Size Limit:** 2MB per image
- **Storage:** Base64 encoded in localStorage
- **Recommended:** 1280x720px (16:9 aspect ratio)

---

## 🔧 Troubleshooting

### Videos Not Appearing
- Check if sections are **enabled** (green eye icon)
- Verify video URLs are valid
- Clear browser cache and refresh

### Thumbnails Not Loading
- YouTube maxresdefault may not exist for all videos
- Upload custom thumbnail as alternative
- Check image file size < 2MB

### Admin Changes Not Saving
- Check browser console for errors
- Verify Medusa backend connection
- Check localStorage quota not exceeded

### Videos in Image Gallery
- This is fixed - videos should NOT appear in gallery anymore
- If you see videos in gallery, clear browser cache

---

## 📦 Database Schema

### Product Model Updates
```typescript
interface VideoSections {
  product_intro?: {
    enabled: boolean
    url?: string
    title?: string
    description?: string
  }
  action_videos?: {
    enabled: boolean
    videos?: Array<{
      url: string
      title: string
      thumbnail?: string        // Auto-generated
      customThumbnail?: string  // User uploaded
    }>
  }
}

interface EditableProduct {
  // ... other fields
  video_sections?: VideoSections
  videos?: MediaFile[]  // DEPRECATED - use video_sections instead
}
```

---

## 🎯 Next Steps After Testing

### If Videos Work
1. ✅ Add videos to all products
2. ✅ Upload custom branded thumbnails
3. ✅ Write compelling titles/descriptions
4. ✅ Test on mobile devices

### If You Need Google Drive
1. See [GOOGLE_OAUTH_FIX_GUIDE.md](GOOGLE_OAUTH_FIX_GUIDE.md)
2. Add redirect URIs to Google Cloud Console
3. Set NEXT_PUBLIC_APP_URL in Vercel
4. Test Drive connection at `/admin/settings`

---

## 📞 Support

### Documentation
- [GOOGLE_OAUTH_FIX_GUIDE.md](GOOGLE_OAUTH_FIX_GUIDE.md) - OAuth setup
- [HOW_TO_ADD_VIDEOS_TO_PRODUCTS.md](HOW_TO_ADD_VIDEOS_TO_PRODUCTS.md) - Video guide
- [FIXES_APPLIED_2026-02-20.md](FIXES_APPLIED_2026-02-20.md) - Recent changes

### Key Files
- `src/components/admin/VideoSectionManager.tsx` - Admin UI
- `src/components/products/ProductVideoSection.tsx` - Frontend display
- `src/store/products.ts` - Data model
- `src/components/admin/ProductEditModal.tsx` - Edit modal
- `src/app/products/[id]/page.tsx` - Product page

---

**Ready to test!** 🚀

Start by editing any product in the admin panel and add your first video.
