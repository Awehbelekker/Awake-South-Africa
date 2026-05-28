# How to Add Videos to Product Pages ("See It In Action")

## Where to Add Videos

The video management section is **already built into the admin**! Here's where to find it:

### Step-by-Step Guide:

1. **Go to Admin Products Page**
   - Navigate to: `/admin/products`
   - Or click "Products" in the admin sidebar

2. **Click "Edit" on Any Product**
   - Find the product you want to add videos to
   - Click the edit button (pencil icon)

3. **Scroll Down to "Media Management"**
   - In the edit modal, scroll past the basic fields
   - You'll see a section titled **"Media Management"**
   - Below "Product Images", you'll find **"Product Videos"**

4. **Add Videos Using 3 Methods:**

   ### Method 1: YouTube/Vimeo URL (RECOMMENDED)
   - Copy the YouTube or Vimeo video URL
   - Examples:
     - YouTube: `https://www.youtube.com/watch?v=VIDEO_ID`
     - YouTube Embed: `https://www.youtube.com/embed/VIDEO_ID`
     - Vimeo: `https://vimeo.com/VIDEO_ID`
   - Paste into the **"Enter video URL..."** input field
   - Click **"Add URL"**
   - ✅ Video added instantly!

   ### Method 2: Upload Video File
   - Click **"Upload Videos"** button
   - Select video files from your computer (MP4, WebM, etc.)
   - ⚠️ **Note:** Max 5MB per file (use YouTube for larger videos)
   - Video will upload and appear in the list

   ### Method 3: Google Drive
   - Click **"Select from Google Drive"**
   - Browse your Drive folders
   - Select video files
   - Videos will be linked from your Drive

5. **Save Your Changes**
   - After adding videos, scroll to bottom
   - Click **"Save Changes"**
   - Videos will now appear in the "See It In Action" section!

---

## Video Section Features

### What You Can Do:
- ✅ Add up to 5 videos per product
- ✅ Reorder videos (Move Up/Down buttons)
- ✅ Preview videos in admin
- ✅ Remove videos easily
- ✅ Mix uploaded files + YouTube links

### Video Display on Product Page:
- Videos show in **"See It In Action"** section
- Beautiful grid layout with thumbnails
- Click to play in full-screen modal
- Only shows if product has videos added

---

## YouTube Video Best Practices

### How to Get YouTube Video URL:
1. Go to your video on YouTube
2. Click "Share" button
3. Copy the link: `https://youtu.be/VIDEO_ID`
4. **OR** right-click video → "Copy video URL"
5. Paste into the video URL field in admin

### Recommended Videos to Add:
- ✅ Product demonstrations
- ✅ Unboxing videos
- ✅ Riding tutorials
- ✅ Customer testimonials
- ✅ Feature highlights
- ✅ Comparison videos

### YouTube Embed URLs Work Too:
If you have an embed code like:
```html
<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" ...></iframe>
```

Just copy the URL part: `https://www.youtube.com/embed/dQw4w9WgXcQ`

---

## Example: Adding Awake Ravik Videos

Let's say you want to add videos from Awake's official YouTube channel:

1. Go to [Awake Boards YouTube](https://www.youtube.com/@awakeboards)
2. Find relevant product videos
3. Copy video URLs
4. Add to your product in admin

**Example URLs:**
```
https://www.youtube.com/watch?v=example1
https://www.youtube.com/watch?v=example2
https://vimeo.com/123456789
```

---

## Troubleshooting

### "I don't see the video section"
- Make sure you're editing a product (not creating new)
- Scroll down past "Description", "Specs", "Features"
- Look for **"Media Management"** heading
- The **"Product Videos"** section is right below "Product Images"

### "Videos not showing on product page"
- Make sure you clicked **"Save Changes"** in the edit modal
- Refresh the product detail page
- Check that the video URL is correct
- Try opening the video URL in a new tab to verify it works

### "Upload failed - file too large"
- Video files are limited to 5MB for localStorage
- **Solution:** Upload to YouTube first, then use the URL method
- YouTube handles large files better and loads faster for customers

### "Video preview not working"
- External URLs (YouTube/Vimeo) show a placeholder icon - this is normal
- They'll load properly on the live product page
- Uploaded videos show a preview with play button

---

## Current Implementation Status

✅ **Fully Implemented Features:**
- Video management in admin (ProductEditModal)
- Support for YouTube, Vimeo, and uploaded files
- "See It In Action" section on product pages
- Video gallery with click-to-play
- Full-screen video modal
- Reorder, remove, and preview videos

📦 **What's Included Section:**
- Also added in this update!
- Find it in the same edit modal
- Shows package contents like:
  - 1x Jetboard
  - 1x Battery
  - 1x Charger
  - 1x Remote Control
  - 1x Manual

---

## Visual Guide

### Admin Product Edit Modal Structure:
```
┌─────────────────────────────────────┐
│ Edit Product: Awake Ravik 3         │
├─────────────────────────────────────┤
│ Name: [          ]                  │
│ Price: [          ]                 │
│ Category: [          ]              │
│ Description: [          ]           │
│ Specifications: [   ] [   ] [   ]  │
│ Features: [   ] [   ] [   ]        │
│ What's Included: [   ] [   ] [   ] │ ← NEW!
│                                     │
│ ─────  Media Management  ───────   │
│                                     │
│ Product Images (0/10)               │
│ [Upload] [Google Drive] [URL]      │
│ [Empty - add images here]          │
│                                     │
│ Product Videos (0/5)   ← HERE!      │
│ [Upload Videos]                     │
│ [Select from Google Drive]          │
│ [Enter video URL...] [Add URL] ← EASY!
│ [Empty - add videos here]          │
│                                     │
│ [Cancel] [Save Changes]             │
└─────────────────────────────────────┘
```

### Product Page "See It In Action" Section:
```
┌─────────────────────────────────────┐
│      See It In Action               │
│  Watch real riders experience the   │
│  thrill...                          │
│                                     │
│ ┌─────┐  ┌─────┐  ┌─────┐         │
│ │ ▶️   │  │ ▶️   │  │ ▶️   │         │
│ │Video1│  │Video2│  │Video3│         │
│ └─────┘  └─────┘  └─────┘         │
│                                     │
│ Click any video to play full screen │
└─────────────────────────────────────┘
```

---

## Quick Start Checklist

- [ ] Open admin products page
- [ ] Edit a product
- [ ] Scroll to "Media Management"
- [ ] Find "Product Videos" section
- [ ] Copy YouTube video URL
- [ ] Paste into URL field
- [ ] Click "Add URL"
- [ ] Save changes
- [ ] View product page to see result!

---

## Tips for Best Results

1. **Use High-Quality Videos**
   - HD (1080p) recommended
   - Good lighting and sound
   - Show product in action

2. **Multiple Angles**
   - Add 2-3 videos per product
   - Different perspectives
   - Various riding conditions

3. **Keep it Short**
   - 30-90 seconds ideal
   - Customers want quick demos
   - Longer videos lose attention

4. **Consistent Branding**
   - Use videos with Awake branding
   - Professional production quality
   - Match your store's aesthetic

5. **Add Variety**
   - Feature video (main demo)
   - Customer testimonial
   - Setup/unboxing guide

---

## Need Help?

If you're still having trouble finding the video section:
1. Make sure you're on the latest deployment
2. Check browser console for errors (F12)
3. Try creating a test product and editing it
4. Clear browser cache and try again

The feature is already live and working - you just need to find the "Product Videos" section in the edit modal! 🎥
