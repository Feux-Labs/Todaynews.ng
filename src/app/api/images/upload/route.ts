import { NextResponse } from "next/server";
import { uploadImage } from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const { fileData } = await req.json();

    if (!fileData) {
      return NextResponse.json({ error: "No file data provided" }, { status: 400 });
    }

    const uploaded = await uploadImage(fileData);

    if (!uploaded) {
      return NextResponse.json({ error: "Cloudinary upload failed" }, { status: 500 });
    }

    return NextResponse.json({
      url: uploaded.url,
      publicId: uploaded.publicId,
    });
  } catch (err) {
    console.error("[Image Upload API Error]:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
