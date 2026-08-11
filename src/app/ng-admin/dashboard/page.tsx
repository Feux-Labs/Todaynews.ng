"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Eye,
  FileText,
  Inbox,
  TrendingUp,
  Clock,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardStats {
  totalViews: number;
  totalArticles: number;
  topArticles: { slug: string; views: number }[];
  categoryBreakdown: { category: string; count: number }[];
  hourlyViews: { hour: string; views: number }[];
}

interface ArticleCounts {
  total: number;
  published: number;
  drafts: number;
  pending: number;
}

const CHART_COLORS = ["#00e676", "#2979ff", "#ff6d00", "#aa00ff", "#ffea00", "#ff1744", "#00b0ff", "#76ff03", "#f50057"];

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [counts, setCounts] = useState<ArticleCounts | null>(null);
  const [period, setPeriod] = useState<"today" | "week" | "month">("today");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [period]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [statsRes, countsRes] = await Promise.all([
        fetch(`/api/analytics/stats?period=${period}`),
        fetch("/api/analytics/stats?type=counts"),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (countsRes.ok) setCounts(await countsRes.json());
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const kpiCards = [
    {
      label: "Page Views",
      value: stats?.totalViews?.toLocaleString() || "0",
      icon: Eye,
      color: "#00e676",
      subtitle: period === "today" ? "Today" : period === "week" ? "This Week" : "This Month",
    },
    {
      label: "Published",
      value: counts?.published?.toString() || "0",
      icon: FileText,
      color: "#2979ff",
      subtitle: "Live articles",
    },
    {
      label: "Pending Review",
      value: counts?.pending?.toString() || "0",
      icon: Inbox,
      color: "#ff6d00",
      subtitle: "AI scraped",
    },
    {
      label: "Drafts",
      value: counts?.drafts?.toString() || "0",
      icon: TrendingUp,
      color: "#aa00ff",
      subtitle: "Awaiting publish",
    },
  ];

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-[#00e676]" />
            Dashboard
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Welcome back, {session?.user?.name || "Admin"}
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
          {(["today", "week", "month"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-xs font-medium capitalize transition ${
                period === p
                  ? "bg-[#00e676]/20 text-[#00e676]"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              {p === "today" ? "Today" : p === "week" ? "This Week" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#0f1729]/80 border border-white/5 rounded-xl p-5 hover:border-white/10 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ background: `${card.color}15` }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{card.subtitle}</span>
              </div>
              <p className="text-2xl font-bold text-white">{card.value}</p>
              <p className="text-xs text-slate-400 mt-1">{card.label}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Hourly Traffic Chart */}
        <div className="lg:col-span-2 bg-[#0f1729]/80 border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-[#00e676]" />
            <h3 className="text-sm font-semibold text-white">Hourly Traffic (Last 24h)</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.hourlyViews || []}>
                <defs>
                  <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00e676" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#00e676" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="hour" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis tick={{ fill: "#64748b", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#0f1729",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="#00e676"
                  fillOpacity={1}
                  fill="url(#viewsGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Breakdown Pie */}
        <div className="bg-[#0f1729]/80 border border-white/5 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[#2979ff]" />
            <h3 className="text-sm font-semibold text-white">Category Breakdown</h3>
          </div>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats?.categoryBreakdown || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="category"
                >
                  {(stats?.categoryBreakdown || []).map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "#0f1729",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {(stats?.categoryBreakdown || []).map((cat, idx) => (
              <span
                key={cat.category}
                className="text-[10px] px-2 py-0.5 rounded-full border border-white/10"
                style={{ color: CHART_COLORS[idx % CHART_COLORS.length] }}
              >
                {cat.category} ({cat.count})
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Top Articles */}
      <div className="bg-[#0f1729]/80 border border-white/5 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-[#ff6d00]" />
          <h3 className="text-sm font-semibold text-white">Top 10 Articles by Views</h3>
        </div>
        {stats?.topArticles && stats.topArticles.length > 0 ? (
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.topArticles} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} />
                <YAxis
                  type="category"
                  dataKey="slug"
                  width={200}
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#0f1729",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="views" fill="#00e676" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">No view data available yet. Articles will appear here as they receive traffic.</p>
        )}
      </div>
    </div>
  );
}
