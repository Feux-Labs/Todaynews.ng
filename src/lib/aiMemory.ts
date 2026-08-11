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

const MEMORY_FILE_PATH = path.join(process.cwd(), "data", "ai_memory.json");
const MAX_MEMORY_ITEMS = 50; // Keep last 50 message exchanges

function ensureDataDirectory() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function getChatMemory(): ChatMessageMemory[] {
  try {
    ensureDataDirectory();
    if (!fs.existsSync(MEMORY_FILE_PATH)) {
      return [];
    }
    const raw = fs.readFileSync(MEMORY_FILE_PATH, "utf-8");
    return JSON.parse(raw) as ChatMessageMemory[];
  } catch (err) {
    console.error("Failed to read AI chat memory:", err);
    return [];
  }
}

export function appendChatMessage(msg: Omit<ChatMessageMemory, "id" | "timestamp"> & { timestamp?: string }): ChatMessageMemory {
  try {
    ensureDataDirectory();
    const history = getChatMemory();
    const newMsg: ChatMessageMemory = {
      ...msg,
      id: `mem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: msg.timestamp || new Date().toISOString(),
    };

    history.push(newMsg);

    // Evict oldest if exceeding max capacity
    const trimmed = history.slice(-MAX_MEMORY_ITEMS);
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(trimmed, null, 2), "utf-8");

    return newMsg;
  } catch (err) {
    console.error("Failed to append AI chat memory:", err);
    return {
      id: `mem-err-${Date.now()}`,
      role: msg.role,
      content: msg.content,
      timestamp: new Date().toISOString(),
    };
  }
}

export function updateMemoryCardStatus(cardId: string, newStatus: "sent_to_inbox" | "in_draft"): boolean {
  try {
    ensureDataDirectory();
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
      fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify(history, null, 2), "utf-8");
    }
    return updated;
  } catch (err) {
    console.error("Failed to update memory card status:", err);
    return false;
  }
}

export function clearChatMemory(): boolean {
  try {
    ensureDataDirectory();
    fs.writeFileSync(MEMORY_FILE_PATH, JSON.stringify([], null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Failed to clear AI chat memory:", err);
    return false;
  }
}
