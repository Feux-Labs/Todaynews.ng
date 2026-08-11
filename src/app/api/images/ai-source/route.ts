import { NextResponse } from "next/server";
import { searchUnsplashImage } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json({ error: "Missing query search parameter" }, { status: 400 });
    }

    const image = await searchUnsplashImage(query);

    if (!image) {
      // Fallback curated Nigerian high quality news imagery
      const fallbacks = [
        "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1580519542036-c47de6196ba5?w=800&auto=format&fit=crop",
        "https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&auto=format&fit=crop",
      ];
      const randomFallback = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return NextResponse.json({
        url: randomFallback,
        credit: "Photo via Unsplash Stock",
        alt: query,
      });
    }

    return NextResponse.json(image);
  } catch (err) {
    console.error("[AI Image Sourcing Error]:", err);
    return NextResponse.json({ error: "Failed to source image" }, { status: 500 });
  }
}
