import bcrypt from "bcryptjs";
import { isDbConfigured, prisma } from "./db";

export type AdminRoleValue = "SUPERADMIN" | "EDITOR" | "REVIEWER";

export interface AdminRecord {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  role: AdminRoleValue;
  active: boolean;
}

export type SafeAdminRecord = Omit<AdminRecord, "hashedPassword">;

class MemoryAdminStore {
  private admins: AdminRecord[] = [];

  constructor() {
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "todaynews2026";
    this.admins.push({
      id: "admin-super-1",
      name: "Todaynews Admin",
      email: process.env.ADMIN_EMAIL || "admin@todaynews.ng",
      hashedPassword: bcrypt.hashSync(defaultPassword, 10),
      role: "SUPERADMIN",
      active: true,
    });
  }

  findByEmail(email: string) {
    return this.admins.find((admin) => admin.email.toLowerCase() === email.toLowerCase().trim() && admin.active) || null;
  }

  getAll(): SafeAdminRecord[] {
    return this.admins.map(({ hashedPassword, ...safe }) => safe);
  }

  create(data: Omit<AdminRecord, "id">): SafeAdminRecord {
    const admin = { ...data, id: `admin-${Math.random().toString(36).substring(2, 9)}` };
    this.admins.push(admin);
    const { hashedPassword, ...safe } = admin;
    return safe;
  }

  update(id: string, data: Partial<Pick<AdminRecord, "name" | "role" | "active">>): SafeAdminRecord | null {
    const admin = this.admins.find((item) => item.id === id);
    if (!admin) return null;
    if (data.name !== undefined) admin.name = data.name;
    if (data.role !== undefined) admin.role = data.role;
    if (data.active !== undefined) admin.active = data.active;
    const { hashedPassword, ...safe } = admin;
    return safe;
  }

  delete(id: string): boolean {
    const index = this.admins.findIndex((admin) => admin.id === id);
    if (index === -1) return false;
    this.admins.splice(index, 1);
    return true;
  }
}

const globalForAdminStore = global as unknown as { adminStore?: MemoryAdminStore };
const memoryAdminStore = globalForAdminStore.adminStore || new MemoryAdminStore();
if (process.env.NODE_ENV !== "production") globalForAdminStore.adminStore = memoryAdminStore;

function toSafeAdmin(admin: any): SafeAdminRecord {
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
    active: admin.active,
  };
}

async function ensureDefaultAdmin() {
  const email = (process.env.ADMIN_EMAIL || "admin@todaynews.ng").toLowerCase();
  const existing = await (prisma as any).adminUser.findUnique({ where: { email } });
  if (existing) return existing;

  return (prisma as any).adminUser.create({
    data: {
      name: "Todaynews Admin",
      email,
      hashedPassword: bcrypt.hashSync(process.env.ADMIN_DEFAULT_PASSWORD || "todaynews2026", 10),
      role: "SUPERADMIN",
      active: true,
    },
  });
}

export async function findAdminForLogin(email: string): Promise<AdminRecord | null> {
  if (isDbConfigured()) {
    try {
      await ensureDefaultAdmin();
      const admin = await (prisma as any).adminUser.findUnique({ where: { email: email.toLowerCase().trim() } });
      if (!admin || !admin.active) return null;
      return admin;
    } catch (err) {
      console.error("[AdminUsers] DB login lookup failed; using memory fallback.", err);
    }
  }

  return memoryAdminStore.findByEmail(email);
}

export async function listAdminUsers(): Promise<SafeAdminRecord[]> {
  if (isDbConfigured()) {
    try {
      await ensureDefaultAdmin();
      const users = await (prisma as any).adminUser.findMany({ orderBy: { createdAt: "asc" } });
      return users.map(toSafeAdmin);
    } catch (err) {
      console.error("[AdminUsers] DB list failed; using memory fallback.", err);
    }
  }

  return memoryAdminStore.getAll();
}

export async function createAdminUser(data: {
  name: string;
  email: string;
  password: string;
  role?: AdminRoleValue;
}): Promise<SafeAdminRecord> {
  const payload = {
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    hashedPassword: bcrypt.hashSync(data.password, 10),
    role: data.role || "EDITOR",
    active: true,
  };

  if (isDbConfigured()) {
    try {
      const created = await (prisma as any).adminUser.create({ data: payload });
      return toSafeAdmin(created);
    } catch (err) {
      console.error("[AdminUsers] DB create failed; using memory fallback.", err);
    }
  }

  return memoryAdminStore.create(payload);
}

export async function updateAdminUser(
  id: string,
  data: Partial<Pick<AdminRecord, "name" | "role" | "active">>
): Promise<SafeAdminRecord | null> {
  if (isDbConfigured()) {
    try {
      const updated = await (prisma as any).adminUser.update({
        where: { id },
        data,
      });
      return toSafeAdmin(updated);
    } catch (err) {
      console.error("[AdminUsers] DB update failed; using memory fallback.", err);
    }
  }

  return memoryAdminStore.update(id, data);
}

export async function deleteAdminUser(id: string): Promise<boolean> {
  if (isDbConfigured()) {
    try {
      await (prisma as any).adminUser.delete({ where: { id } });
      return true;
    } catch (err) {
      console.error("[AdminUsers] DB delete failed; using memory fallback.", err);
    }
  }

  return memoryAdminStore.delete(id);
}
