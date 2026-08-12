import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { fileData } = await req.json();

    if (!fileData) {
      return NextResponse.json({ error: "No file data provided" }, { status: 400 });
    }

    // Try Cloudinary upload if configured
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      const uploaded = await uploadImage(fileData);
      if (uploaded?.url) {
        return NextResponse.json({
          url: uploaded.url,
          publicId: uploaded.publicId,
          storage: "cloudinary",
        });
      }
    }

    // Fallback: If Cloudinary is not configured or fails, return base64 Data URL so image upload NEVER fails
    return NextResponse.json({
      url: fileData,
      publicId: `data-img-${Date.now()}`,
      storage: "local-base64",
    });
  } catch (err) {
    console.error("[Image Upload API Error]:", err);
    // Even on error, fallback to base64 data if available in body
    try {
      const body = await req.clone().json();
      if (body?.fileData) {
        return NextResponse.json({
          url: body.fileData,
          publicId: `data-img-${Date.now()}`,
          storage: "local-base64",
        });
      }
    } catch {}

    return NextResponse.json({ error: "Failed to process image upload" }, { status: 500 });
  }
}
