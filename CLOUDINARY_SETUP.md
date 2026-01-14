# Cloudinary Integration Setup Guide

## Overview
The application now uses Cloudinary to host all media assets (avatars, images) instead of local storage.

## Prerequisites
1. Create a free Cloudinary account at https://cloudinary.com/users/register_free
2. Get your credentials from the Cloudinary Dashboard

## Configuration

### 1. Get Cloudinary Credentials
After creating your account, go to your Dashboard and find:
- **Cloud Name**: Your unique cloud name (e.g., `dxxxxxxxxxxxx`)
- **API Key**: Your API key (e.g., `123456789012345`)
- **API Secret**: Your API secret (keep this private!)

### 2. Update Environment Variables
Edit `apps/api/.env` and update the Cloudinary configuration:

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
CLOUDINARY_API_KEY=your_actual_api_key
CLOUDINARY_API_SECRET=your_actual_api_secret
```

### 3. Cloudinary Features Used

#### Avatar Upload
- **Automatic transformations**: Images are resized to 400x400px
- **Smart cropping**: Uses face detection for optimal cropping
- **Format optimization**: Automatically serves WebP/AVIF for modern browsers
- **Quality optimization**: Automatically adjusts quality for best performance
- **Folder structure**: Avatars stored in `free2talk/avatars/`

#### Public IDs
Format: `avatars/{userId}/{timestamp}-{hash}`
Example: `avatars/user123/1705234567890-a1b2c3d4e5f6g7h8`

## API Changes

### Upload Avatar Response
```json
{
  "success": true,
  "data": {
    "avatarUrl": "https://res.cloudinary.com/.../image/upload/.../avatars/user123/...",
    "publicId": "free2talk/avatars/user123/1705234567890-a1b2c3d4",
    "size": 45678,
    "format": "jpg"
  }
}
```

### Features
- **Old image cleanup**: When uploading a new avatar, the old one is automatically deleted
- **Secure URLs**: Always uses HTTPS
- **CDN delivery**: Global CDN for fast loading worldwide
- **No local storage**: No need to manage uploads folder

## Benefits

1. **Performance**: CDN-based delivery worldwide
2. **Scalability**: No server storage needed
3. **Optimization**: Automatic image optimization and format conversion
4. **Transformations**: On-the-fly image resizing and manipulation
5. **Reliability**: 99.99% uptime SLA
6. **Cost-effective**: Free tier includes 25GB storage and 25GB bandwidth/month

## Folder Structure in Cloudinary

```
free2talk/
└── avatars/
    ├── user-id-1/
    │   └── timestamp-hash.jpg
    ├── user-id-2/
    │   └── timestamp-hash.png
    └── ...
```

## Migration Notes

- Local file storage has been completely removed
- Static file serving removed from Express
- All avatar URLs are now Cloudinary URLs
- Old local uploads can be safely deleted

## Troubleshooting

### Error: "Missing required configuration parameter"
- Ensure all three Cloudinary env variables are set correctly
- Restart the API server after updating .env

### Error: "Upload failed"
- Check your Cloudinary account status
- Verify API credentials are correct
- Check if you've exceeded free tier limits

### Images not displaying
- Ensure the URL is a full Cloudinary URL (starts with `https://res.cloudinary.com`)
- Check browser console for CORS or loading errors
- Verify the image still exists in Cloudinary dashboard

## Free Tier Limits
- 25 GB storage
- 25 GB bandwidth per month
- 25,000 transformations per month
- Should be sufficient for development and small-scale production
