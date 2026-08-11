import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

/**
 * Upload an image buffer or base64 string to Cloudinary.
 */
export async function uploadImage(
  fileData: string, // base64 data URI or URL
  options?: { folder?: string; publicId?: string }
): Promise<{ url: string; publicId: string } | null> {
  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder: options?.folder || "todaynews",
      public_id: options?.publicId,
      resource_type: "image",
      transformation: [
        { width: 1200, height: 630, crop: "fill", gravity: "auto" },
        { quality: "auto:best", fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (err) {
    console.error("[Cloudinary] Upload failed:", err);
    return null;
  }
}

/**
 * Search Unsplash for a relevant cover image based on keywords.
 */
export async function searchUnsplashImage(
  query: string
): Promise<{ url: string; credit: string; alt: string } | null> {
  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    console.log("[Images] No UNSPLASH_ACCESS_KEY configured.");
    return null;
  }

  try {
    const res = await fetch(
      `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + " Nigeria Africa")}&per_page=1&orientation=landscape`,
      {
        headers: { Authorization: `Client-ID ${accessKey}` },
      }
    );

    if (!res.ok) return null;

    const data = await res.json();
    const photo = data.results?.[0];
    if (!photo) return null;

    return {
      url: photo.urls.regular,
      credit: `Photo by ${photo.user.name} on Unsplash`,
      alt: photo.alt_description || query,
    };
  } catch (err) {
    console.error("[Images] Unsplash search failed:", err);
    return null;
  }
}
