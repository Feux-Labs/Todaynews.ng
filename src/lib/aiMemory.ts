import fs from "fs";
import path from "path";
import { isDbConfigured, prisma } from "./db";

export interface ChatMessageMemory {
  id: string;
  sessionId?: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  storyCards?: {
    id: string;
    title: string;
    summary: string;
    content?: string;
    sourceName: string;
    sourceUrl?: string;
    category: string;
    imageUrl?: string;
    status: "new" | "sent_to_inbox" | "in_draft" | "paraphrasing";
  }[];
}

export interface AiChatSessionMemory {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

type StoryCardStatus = "new" | "sent_to_inbox" | "in_draft" | "paraphrasing";

// In serverless environment (Vercel), use /tmp directory which is guaranteed to be writable
const MEMORY_FILE_PATH =
  process.env.NODE_ENV === "production" || process.env.VERCEL
    ? path.join("/tmp", "ai_memory.json")
    : path.join(process.cwd(), "data", "ai_memory.json");

const MAX_MEMORY_ITEMS = 60; // Keep last 60 message exchanges

// Global in-memory cache for warm lambda executions
const globalForMemory = globalThis as unknown as { _aiChatMemory?: ChatMessageMemory[] };
if (!globalForMemory._aiChatMemory) {
  globalForMemory._aiChatMemory = [];
}

function ensureDirectory(filePath: string) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (err) {
    // Ignore error if directory creation fails in restricted env
  }
}

export function getChatMemory(): ChatMessageMemory[] {
  try {
    if (globalForMemory._aiChatMemory && globalForMemory._aiChatMemory.length > 0) {
      return [...globalForMemory._aiChatMemory];
    }

    if (fs.existsSync(MEMORY_FILE_PATH)) {
      const raw = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as ChatMessageMemory[];
      globalForMemory._aiChatMemory = parsed;
      return parsed;
    }
  } catch (err) {
    console.error("Failed to read AI chat memory file:", err);
  }
  return globalForMemory._aiChatMemory || [];
}

function sessionTitleFromText(text?: string) {
  const title = (text || "AI News Session").replace(/\s+/g, " ").trim();
  return title.length > 70 ? `${title.slice(0, 67)}...` : title;
}

export async function listPersistentChatSessions(): Promise<AiChatSessionMemory[]> {
  if (!isDbConfigured()) {
    const history = getChatMemory();
    if (history.length === 0) return [];
    return [{
      id: "local",
      title: "Local AI Session",
      createdAt: history[0].timestamp,
      updatedAt: history[history.length - 1].timestamp,
    }];
  }

  try {
    const sessions = await (prisma as any).aiChatSession.findMany({
      orderBy: { updatedAt: "desc" },
      take: 30,
    });

    return sessions.map((session: any) => ({
      id: session.id,
      title: session.title,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    }));
  } catch (err) {
    console.error("Failed to list persistent AI sessions:", err);
    return [];
  }
}

export async function createPersistentChatSession(title?: string): Promise<AiChatSessionMemory | null> {
  if (!isDbConfigured()) return null;

  try {
    const created = await (prisma as any).aiChatSession.create({
      data: { title: sessionTitleFromText(title) },
    });
    return {
      id: created.id,
      title: created.title,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  } catch (err) {
    console.error("Failed to create persistent AI session:", err);
    return null;
  }
}

async function ensurePersistentSession(sessionId?: string, title?: string): Promise<string | undefined> {
  if (!isDbConfigured()) return undefined;
  if (sessionId) {
    const existing = await (prisma as any).aiChatSession.findUnique({ where: { id: sessionId } });
    if (existing) return existing.id;
  }
  const created = await createPersistentChatSession(title);
  return created?.id;
}

export async function getPersistentChatMemory(sessionId?: string): Promise<ChatMessageMemory[]> {
  if (!isDbConfigured()) return getChatMemory();

  try {
    const resolvedSessionId = sessionId || (await listPersistentChatSessions())[0]?.id;
    if (!resolvedSessionId) return [];

    const rows = await (prisma as any).aiChatMessage.findMany({
      where: { sessionId: resolvedSessionId },
      orderBy: { createdAt: "asc" },
      take: MAX_MEMORY_ITEMS,
    });

    return rows.map((row: any) => ({
      id: row.id,
      sessionId: row.sessionId || undefined,
      role: row.role,
      content: row.content,
      timestamp: row.createdAt.toISOString(),
      storyCards: Array.isArray(row.storyCards) ? row.storyCards : undefined,
    }));
  } catch (err) {
    console.error("Failed to read persistent AI chat memory:", err);
    return getChatMemory();
  }
}

export function appendChatMessage(
  msg: Omit<ChatMessageMemory, "id" | "timestamp"> & { timestamp?: string }
): ChatMessageMemory {
  const newMsg: ChatMessageMemory = {
    ...msg,
    id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: msg.timestamp || new Date().toISOString(),
  };

  try {
    const history = getChatMemory();
    history.push(newMsg);

    const trimmed = history.slice(-MAX_MEMORY_ITEMS);
    globalForMemory._aiChatMemory = trimmed;

    ensureDirectory(MEMORY_FILE_PATH);
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(trimmed, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to write AI chat memory file (using in-memory fallback):", err);
  }

  return newMsg;
}

export async function appendPersistentChatMessage(
  msg: Omit<ChatMessageMemory, "id" | "timestamp"> & { timestamp?: string; sessionId?: string }
): Promise<ChatMessageMemory> {
  if (!isDbConfigured()) return appendChatMessage(msg);

  try {
    const sessionId = await ensurePersistentSession(msg.sessionId, msg.role === "user" ? msg.content : undefined);
    const created = await (prisma as any).aiChatMessage.create({
      data: {
        sessionId,
        role: msg.role,
        content: msg.content,
        storyCards: msg.storyCards || undefined,
        createdAt: msg.timestamp ? new Date(msg.timestamp) : undefined,
      },
    });

    const excess = await (prisma as any).aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: "desc" },
      skip: MAX_MEMORY_ITEMS,
      select: { id: true },
    });
    if (excess.length > 0) {
      await (prisma as any).aiChatMessage.deleteMany({
        where: { id: { in: excess.map((row: any) => row.id) } },
      });
    }

    if (sessionId) {
      await (prisma as any).aiChatSession.update({
        where: { id: sessionId },
        data: { updatedAt: new Date() },
      });
    }

    return {
      id: created.id,
      sessionId: created.sessionId || undefined,
      role: created.role,
      content: created.content,
      timestamp: created.createdAt.toISOString(),
      storyCards: Array.isArray(created.storyCards) ? created.storyCards : undefined,
    };
  } catch (err) {
    console.error("Failed to write persistent AI chat memory:", err);
    return appendChatMessage(msg);
  }
}

export function updateMemoryCardStatus(
  cardId: string,
  newStatus: "sent_to_inbox" | "in_draft"
): boolean {
  try {
    const history = getChatMemory();
    let updated = false;

    for (const msg of history) {
      if (msg.storyCards) {
        for (const card of msg.storyCards) {
          if (card.id === cardId) {
            card.status = newStatus;
            updated = true;
          }
        }
      }
    }

    if (updated) {
      globalForMemory._aiChatMemory = history;
      try {
        ensureDirectory(MEMORY_FILE_PATH);
        fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(history, null, 2), "utf-8");
      } catch {}
    }
    return updated;
  } catch (err) {
    console.error("Failed to update memory card status:", err);
    return false;
  }
}

export async function updatePersistentMemoryCardStatus(
  cardId: string,
  newStatus: Exclude<StoryCardStatus, "new" | "paraphrasing">,
  sessionId?: string
): Promise<boolean> {
  if (!isDbConfigured()) return updateMemoryCardStatus(cardId, newStatus);

  try {
    const rows = await (prisma as any).aiChatMessage.findMany({
      where: sessionId ? { sessionId } : undefined,
      orderBy: { createdAt: "desc" },
      take: MAX_MEMORY_ITEMS,
    });

    let updated = false;
    await Promise.all(
      rows.map(async (row: any) => {
        const cards = Array.isArray(row.storyCards) ? row.storyCards : [];
        const nextCards = cards.map((card: any) => {
          if (card.id !== cardId) return card;
          updated = true;
          return { ...card, status: newStatus };
        });

        if (nextCards !== cards && cards.some((card: any) => card.id === cardId)) {
          await (prisma as any).aiChatMessage.update({
            where: { id: row.id },
            data: { storyCards: nextCards },
          });
        }
      })
    );

    return updated;
  } catch (err) {
    console.error("Failed to update persistent memory card status:", err);
    return updateMemoryCardStatus(cardId, newStatus);
  }
}

export function clearChatMemory(): boolean {
  try {
    globalForMemory._aiChatMemory = [];
    if (fs.existsSync(MEMORY_FILE_PATH)) {
      fs.unlinkSync(MEMORY_FILE_PATH);
    }
    return true;
  } catch (err) {
    console.error("Failed to clear AI chat memory:", err);
    return false;
  }
}

export async function clearPersistentChatMemory(sessionId?: string): Promise<boolean> {
  if (!isDbConfigured()) return clearChatMemory();

  try {
    if (sessionId) {
      await (prisma as any).aiChatSession.delete({ where: { id: sessionId } });
    } else {
      await (prisma as any).aiChatMessage.deleteMany({});
      await (prisma as any).aiChatSession.deleteMany({});
    }
    clearChatMemory();
    return true;
  } catch (err) {
    console.error("Failed to clear persistent AI chat memory:", err);
    return clearChatMemory();
  }
}
