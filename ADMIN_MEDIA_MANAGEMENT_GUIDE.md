# Admin Portal Media Management User Guide

## Overview

The Awake SA Admin Portal now features comprehensive media management capabilities for product images and videos. This guide will help you understand and use all the new features.

## Table of Contents

1. [Accessing the Admin Portal](#accessing-the-admin-portal)
2. [Managing Product Media](#managing-product-media)
3. [Media Library Browser](#media-library-browser)
4. [Google Drive Integration](#google-drive-integration)
5. [Rich Text Editor](#rich-text-editor)
6. [Best Practices](#best-practices)

## Accessing the Admin Portal

1. Navigate to: `https://awakesa.co.za/admin` (or `http://localhost:3000/admin` for local development)
2. Enter your admin credentials
3. Click "Login"

## Managing Product Media

### Edit a Product

1. Go to **Dashboard** → **Manage Products**
2. Find the product you want to edit
3. Click the "Edit" button (pencil icon)
4. The Product Edit Modal will open

### Media Management Section

The Product Edit Modal now includes a dedicated **Media Management** section with two subsections:

#### 1. Product Images

**Features:**
- Upload up to 10 images per product
- Three ways to add images:
  - 📁 **Upload Images** - Upload from your computer
  - ☁️ **Select from Google Drive** - Choose from Google Drive
  - 🔗 **Add URL** - Paste an image URL

**Actions:**
- **Reorder images** - Use ⬆️ Move Up / ⬇️ Move Down buttons
- **Preview images** - Hover over image to see full preview
- **Copy URL** - Click the copy icon to copy image URL
- **View original** - Click external link icon (for URL/Drive images)
- **Remove image** - Click the ❌ button

**Image Order:**
- The first image is the primary product image
- Other images appear in the product gallery
- Use reorder buttons to change the sequence

#### 2. Product Videos

**Features:**
- Upload up to 5 videos per product
- Three ways to add videos:
  - 📁 **Upload Videos** - Upload from your computer (MP4, WebM, etc.)
  - ☁️ **Select from Google Drive** - Choose from Google Drive
  - 🔗 **Add URL** - Paste a video URL

**Actions:**
- Same reordering and management features as images
- Videos can be previewed directly in the admin panel

### Saving Changes

1. After adding/editing media, click **Save Changes**
2. Wait for the "Product updated successfully!" message
3. Changes are saved to local storage
4. The product page will reflect the updates immediately

## Media Library Browser

### Accessing the Media Library

**From Dashboard:**
1. Go to **Admin Dashboard**
2. Click on **📁 Media Library** card
3. Browse all media from all products

**From Product Edit:**
- Currently in development for quick media selection

### Media Library Features

**Search:**
- Search by product name, file name, or URL
- Real-time filtering as you type

**Filter by Type:**
- View all media
- Filter to show only images
- Filter to show only videos

**Actions:**
- **Copy URL** - Click copy icon to copy media URL
- **View Original** - Open original file (for URL/Drive files)
- **Select Media** - Click on media to select it (when used as picker)

**Information Display:**
- Media preview (image/video thumbnail)
- File name
- Product name
- Source type (Uploaded, Google Drive, or URL)

## Google Drive Integration

### Setup (One-Time)

Follow the [Google Drive Setup Guide](./GOOGLE_DRIVE_SETUP_GUIDE.md) to configure Google Drive integration.

### Using Google Drive Picker

1. Click **"Select from Google Drive"** button
2. Sign in to your Google account (first time only)
3. Browse your Google Drive files
4. Select one or multiple files
5. Click "Select" in the picker
6. Files are automatically added to the product

### Google Drive Benefits

✅ **Large file storage** - No need to store files locally
✅ **Easy sharing** - Files already on your Drive
✅ **Team collaboration** - Access shared team drives
✅ **Automatic thumbnails** - Google Drive provides thumbnails
✅ **Version control** - Update files on Drive, URLs stay the same

### Important Notes

- Files must be shared publicly or with link sharing enabled
- Recommended to use a dedicated "Product Media" folder
- Organize files by product for easy management
- Video files should be in common formats (MP4, WebM)

## Rich Text Editor

### Enhanced Formatting Options

The product description editor now includes:

#### Text Formatting
- **Bold** - Make text bold (Ctrl/Cmd + B)
- **Italic** - Italicize text (Ctrl/Cmd + I)
- **Underline** - Underline text (Ctrl/Cmd + U)
- **Highlight** - Highlight text with background color

#### Headings
- **Heading 1** - Large heading for main sections
- **Heading 2** - Medium heading for subsections
- **Heading 3** - Small heading for sub-subsections

#### Lists
- **Bullet List** - Unordered list with bullets
- **Numbered List** - Ordered list with numbers

#### Alignment
- **Align Left** - Left-align text (default)
- **Align Center** - Center text
- **Align Right** - Right-align text

#### Media & Links
- **Add Link** - Insert hyperlinks
  1. Select text
  2. Click link icon
  3. Enter URL
  4. Click "Add Link"

- **Add Image** - Insert images in description
  1. Click image icon
  2. Enter image URL
  3. Preview appears
  4. Click "Add Image"

#### History
- **Undo** - Undo last change (Ctrl/Cmd + Z)
- **Redo** - Redo last undo (Ctrl/Cmd + Shift + Z)

### Preview Mode

- Click **👁️ Preview** to see how the description will look
- Click **✏️ Edit** to return to editing mode
- Preview shows formatted HTML output

### Best Practices for Descriptions

1. **Use headings** to structure content
2. **Bold key features** for emphasis
3. **Use bullet lists** for specifications
4. **Add links** to related products or resources
5. **Insert images** to illustrate features
6. **Keep it readable** with proper spacing

## Best Practices

### Image Management

**File Formats:**
- ✅ Use JPEG for photos (.jpg, .jpeg)
- ✅ Use PNG for graphics with transparency (.png)
- ✅ Use WebP for modern browsers (.webp)
- ❌ Avoid BMP or TIFF (too large)

**Image Sizes:**
- Product images: 1200x800px or higher
- Thumbnails: 400x300px minimum
- Keep file sizes under 2MB for faster loading

**Image Quality:**
- Use high-quality images for main product photos
- Ensure good lighting and clear focus
- Show product from multiple angles
- Include lifestyle/action shots

**Organization:**
- First image should be the hero shot
- Order images from most to least important
- Group related images together
- Use descriptive filenames

### Video Management

**Video Formats:**
- ✅ MP4 (H.264) - Best compatibility
- ✅ WebM - Good for web
- ✅ MOV - For Apple devices
- ❌ Avoid AVI or WMV (compatibility issues)

**Video Guidelines:**
- Keep videos under 5 minutes
- Use 1080p resolution or higher
- Add captions/subtitles if speaking
- Show product in action
- Include clear sound quality

**Video Hosting:**
- For large videos, use Google Drive
- Embed YouTube/Vimeo links for better streaming
- Test video playback on different devices

### Storage Management

**Local Uploads:**
- Files are stored as base64 in browser
- Limited by browser storage (typically 5-10MB)
- Best for small images only
- Can cause slow performance with many files

**Google Drive (Recommended):**
- Unlimited storage with Drive account
- Faster loading times
- Better for large files and videos
- Files can be managed outside the admin panel

**URL Links:**
- Use CDN-hosted images for best performance
- Ensure URLs are permanent and won't break
- Check that URLs are publicly accessible
- Prefer HTTPS URLs for security

### Performance Tips

1. **Optimize images** before uploading
   - Use tools like TinyPNG or ImageOptim
   - Resize to appropriate dimensions
   - Compress without losing quality

2. **Use Google Drive** for large files
   - Videos should always be on Drive or CDN
   - High-resolution images work better on Drive

3. **Limit media per product**
   - 3-5 images is usually sufficient
   - 1-2 videos is ideal
   - More media = slower page loads

4. **Regular cleanup**
   - Remove unused media
   - Delete duplicate images
   - Archive old product media

## Troubleshooting

### Images Not Loading

**Problem**: Image appears broken or doesn't load

**Solutions:**
1. Check URL is correct and publicly accessible
2. Verify image file isn't corrupted
3. Try re-uploading the image
4. Check browser console for errors

### Google Drive Picker Not Working

**Problem**: "Google Drive not configured" message

**Solutions:**
1. Verify environment variables are set in `.env.local`
2. Check credentials are correct in Google Cloud Console
3. Restart development server
4. Clear browser cache

### Video Won't Play

**Problem**: Video doesn't play or shows error

**Solutions:**
1. Check video format is supported (MP4, WebM)
2. Verify video URL is publicly accessible
3. Try uploading a smaller video file
4. Use Google Drive for large videos

### Changes Not Saving

**Problem**: Edits disappear after closing modal

**Solutions:**
1. Click "Save Changes" before closing
2. Check for validation errors (red text)
3. Ensure all required fields are filled
4. Check browser console for errors

### Slow Performance

**Problem**: Admin panel is slow with many images

**Solutions:**
1. Use Google Drive instead of local uploads
2. Reduce number of images per product
3. Clear browser cache and local storage
4. Close other browser tabs

## Support

Need help?
- **Email**: info@awakesa.co.za
- **Documentation**: Check README files
- **Google Drive Setup**: See [GOOGLE_DRIVE_SETUP_GUIDE.md](./GOOGLE_DRIVE_SETUP_GUIDE.md)

## Updates

This guide is for the enhanced admin portal released in January 2026. Features and UI may change in future updates.

---

**Last Updated**: January 22, 2026
