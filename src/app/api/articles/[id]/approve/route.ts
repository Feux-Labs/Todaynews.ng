import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

/**
 * One-click Email Approval Endpoint
 * Hits when admin clicks "APPROVE NOW" inside the ZeptoMail alert email.
 * Sets story status from AI_PENDING to PUBLISHED immediately.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (isDbConfigured()) {
      await prisma.article.update({
        where: { id },
        data: { status: "PUBLISHED" as any },
      });
    } else {
      await memoryDb.updateArticleStatus(id, "PUBLISHED");
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // Redirect to admin published tab with success message
    return NextResponse.redirect(`${baseUrl}/ng-admin/published?approved=${id}`);
  } catch (err) {
    console.error("[Email Approve Error]:", err);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
