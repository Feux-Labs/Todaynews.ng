import { NextResponse } from "next/server";
import { memoryDb, isDbConfigured, prisma } from "@/lib/db";

/**
 * One-click Email Approval Endpoint
 * Hits when admin clicks "APPROVE NOW" inside the ZeptoMail alert email.
 * Moves story from AI_PENDING into DRAFT so editors can review before publishing.
 */
export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (isDbConfigured()) {
      await prisma.article.update({
        where: { id },
        data: { status: "DRAFT" as any },
      });
    } else {
      await memoryDb.updateArticleStatus(id, "DRAFT");
    }

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    return NextResponse.redirect(`${baseUrl}/ng-admin/drafts?approved=${id}`);
  } catch (err) {
    console.error("[Email Approve Error]:", err);
    return NextResponse.json({ error: "Approval failed" }, { status: 500 });
  }
}
