import fs from "fs";
import path from "path";

export interface ChatMessageMemory {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  storyCards?: {
    id: string;
    title: string;
    summary: string;
    sourceName: string;
    category: string;
    imageUrl?: string;
    status: "new" | "sent_to_inbox" | "in_draft" | "paraphrasing";
  }[];
}

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
