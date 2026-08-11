import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

// In-memory admin store for zero-config local development
interface AdminRecord {
  id: string;
  name: string;
  email: string;
  hashedPassword: string;
  role: "SUPERADMIN" | "EDITOR" | "REVIEWER";
  active: boolean;
}

class AdminStore {
  private admins: AdminRecord[] = [];

  constructor() {
    // Create default superadmin on first load
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "todaynews2026";
    const hash = bcrypt.hashSync(defaultPassword, 10);
    this.admins.push({
      id: "admin-super-1",
      name: "Todaynews Admin",
      email: process.env.ADMIN_EMAIL || "admin@todaynews.ng",
      hashedPassword: hash,
      role: "SUPERADMIN",
      active: true,
    });
  }

  findByEmail(email: string) {
    return this.admins.find((a) => a.email === email && a.active) || null;
  }

  findById(id: string) {
    return this.admins.find((a) => a.id === id) || null;
  }

  getAll() {
    return this.admins.map(({ hashedPassword, ...rest }) => rest);
  }

  create(data: Omit<AdminRecord, "id">) {
    const admin: AdminRecord = {
      ...data,
      id: `admin-${Math.random().toString(36).substring(2, 9)}`,
    };
    this.admins.push(admin);
    const { hashedPassword, ...safe } = admin;
    return safe;
  }

  update(id: string, data: Partial<Pick<AdminRecord, "name" | "role" | "active">>) {
    const admin = this.admins.find((a) => a.id === id);
    if (!admin) return null;
    if (data.name !== undefined) admin.name = data.name;
    if (data.role !== undefined) admin.role = data.role;
    if (data.active !== undefined) admin.active = data.active;
    const { hashedPassword, ...safe } = admin;
    return safe;
  }

  delete(id: string) {
    const idx = this.admins.findIndex((a) => a.id === id);
    if (idx === -1) return false;
    this.admins.splice(idx, 1);
    return true;
  }
}

const globalForAdminStore = global as unknown as { adminStore: AdminStore };
export const adminStore = globalForAdminStore.adminStore || new AdminStore();
if (process.env.NODE_ENV !== "production") globalForAdminStore.adminStore = adminStore;

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Todaynews Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const admin = adminStore.findByEmail(credentials.email);
        if (!admin) return null;

        const isValid = await bcrypt.compare(credentials.password, admin.hashedPassword);
        if (!isValid) return null;

        return {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          role: admin.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: "/ng-admin/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  secret: process.env.NEXTAUTH_SECRET || "todaynews-ng-secret-key-change-in-production",
};
