"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";
import { themeConfig } from "@/lib/theme";
import AdminLayoutModern from "@/components/admin/AdminLayoutModern";
import {
  Plus,
  Trash2,
  Edit,
  Image as ImageIcon,
  ExternalLink,
  CheckCircle,
  Circle,
  AlertCircle,
} from "lucide-react";

interface SponsoredAd {
  id: string;
  title: string;
  sponsor: string;
  imageUrl: string;
  targetUrl: string;
  category?: string;
  badgeText: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function SponsoredAdsPage() {
  const { theme } = useTheme();
  const colors = themeConfig[theme];
  const [ads, setAds] = useState<SponsoredAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    sponsor: "",
    imageUrl: "",
    targetUrl: "",
    category: "",
    badgeText: "Sponsored",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Fetch ads
  useEffect(() => {
    const fetchAds = async () => {
      try {
        const res = await fetch("/api/admin/sponsored-ads");
        if (!res.ok) throw new Error("Failed to fetch ads");
        const data = await res.json();
        setAds(data);
      } catch (err) {
        setError("Failed to load sponsored ads");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAds();
  }, []);

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (
      !formData.title ||
      !formData.sponsor ||
      !formData.imageUrl ||
      !formData.targetUrl
    ) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      const res = await fetch("/api/admin/sponsored-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create ad");
      const newAd = await res.json();
      setAds([newAd, ...ads]);
      setFormData({
        title: "",
        sponsor: "",
        imageUrl: "",
        targetUrl: "",
        category: "",
        badgeText: "Sponsored",
      });
      setShowForm(false);
      setSuccess("Sponsored ad created successfully!");
    } catch (err) {
      setError("Failed to create sponsored ad");
      console.error(err);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ad?")) return;

    try {
      const res = await fetch(`/api/admin/sponsored-ads/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete ad");
      setAds(ads.filter((ad) => ad.id !== id));
      setSuccess("Ad deleted successfully!");
    } catch (err) {
      setError("Failed to delete ad");
      console.error(err);
    }
  };

  // Handle toggle active
  const handleToggleActive = async (ad: SponsoredAd) => {
    try {
      const res = await fetch(`/api/admin/sponsored-ads/${ad.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !ad.active }),
      });
      if (!res.ok) throw new Error("Failed to update ad");
      const updated = await res.json();
      setAds(ads.map((a) => (a.id === ad.id ? updated : a)));
      setSuccess(`Ad ${!ad.active ? "activated" : "deactivated"}!`);
    } catch (err) {
      setError("Failed to update ad status");
      console.error(err);
    }
  };

  return (
    <AdminLayoutModern
      title="Sponsored Ads"
      subtitle="Manage your sponsored advertisements"
    >
      {/* Alerts */}
      {error && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            theme === "light"
              ? "bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 text-red-800 dark:text-red-300"
              : "bg-red-950 border border-red-800 text-red-100"
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div
          className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${
            theme === "light"
              ? "bg-green-50 border border-green-200 text-green-800"
              : "bg-green-950 border border-green-800 text-green-100"
          }`}
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          {success}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-2xl font-bold ${colors.text}`}>Ads ({ads.length})</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Ad
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div
          className={`mb-8 p-6 rounded-lg border ${colors.card} ${colors.border}`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${colors.text}`}>
            Create New Sponsored Ad
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Ad Title *"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`px-4 py-2 rounded-lg border ${colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <input
              type="text"
              placeholder="Sponsor Name *"
              value={formData.sponsor}
              onChange={(e) =>
                setFormData({ ...formData, sponsor: e.target.value })
              }
              className={`px-4 py-2 rounded-lg border ${colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <input
              type="url"
              placeholder="Image URL *"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className={`px-4 py-2 rounded-lg border ${colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <input
              type="url"
              placeholder="Target URL *"
              value={formData.targetUrl}
              onChange={(e) =>
                setFormData({ ...formData, targetUrl: e.target.value })
              }
              className={`px-4 py-2 rounded-lg border ${colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <input
              type="text"
              placeholder="Category (optional)"
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className={`px-4 py-2 rounded-lg border ${colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <input
              type="text"
              placeholder="Badge Text"
              value={formData.badgeText}
              onChange={(e) =>
                setFormData({ ...formData, badgeText: e.target.value })
              }
              className={`px-4 py-2 rounded-lg border ${colors.input} focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
            <div className="md:col-span-2 flex gap-2">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Create Ad
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${colors.hover} ${colors.text}`}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Ads List */}
      {loading ? (
        <div className={`text-center py-12 ${colors.textSecondary}`}>
          Loading ads...
        </div>
      ) : ads.length === 0 ? (
        <div className={`text-center py-12 ${colors.textSecondary}`}>
          No sponsored ads yet. Create one to get started!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ads.map((ad) => (
            <div
              key={ad.id}
              className={`rounded-lg overflow-hidden border ${colors.card} ${colors.border} flex flex-col transition-shadow hover:shadow-lg`}
            >
              {/* Image */}
              <div className={`relative h-48 ${colors.bgTertiary} overflow-hidden`}>
                <img
                  src={ad.imageUrl}
                  alt={ad.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <button
                    onClick={() => handleToggleActive(ad)}
                    className={`p-2 rounded-full ${
                      ad.active
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-gray-500 hover:bg-gray-600"
                    } text-slate-900 dark:text-white transition-colors`}
                  >
                    {ad.active ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className={`font-semibold ${colors.text} line-clamp-2`}>
                      {ad.title}
                    </h3>
                    <p className={`text-sm ${colors.textSecondary}`}>
                      {ad.sponsor}
                    </p>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded font-medium whitespace-nowrap ${
                      theme === "light"
                        ? "bg-blue-100 text-blue-800 dark:text-blue-300"
                        : "bg-blue-900 text-blue-100"
                    }`}
                  >
                    {ad.badgeText}
                  </span>
                </div>

                {ad.category && (
                  <p className={`text-xs ${colors.textTertiary} mb-2`}>
                    Category: {ad.category}
                  </p>
                )}

                <p className={`text-xs ${colors.textTertiary} mb-3 line-clamp-2`}>
                  {ad.targetUrl}
                </p>

                <p className={`text-xs ${colors.textTertiary}`}>
                  {new Date(ad.createdAt).toLocaleDateString()}
                </p>
              </div>

              {/* Actions */}
              <div className={`border-t ${colors.border} p-3 flex gap-2`}>
                <a
                  href={ad.targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950 dark:hover:bg-blue-950 rounded-lg font-medium text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Visit
                </a>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950 dark:hover:bg-red-950 rounded-lg font-medium text-sm transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayoutModern>
  );
}
