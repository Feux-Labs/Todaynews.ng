"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Mail, MapPin, Phone, Send, CheckCircle, ShieldAlert } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Editorial Query",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10 font-body space-y-10">
      {/* Header */}
      <div className="border-b-4 border-ink pb-6">
        <span className="bg-flag text-white text-xs font-display font-black px-3 py-1 uppercase tracking-wider rounded">
          Contact Desk
        </span>
        <h1 className="font-display font-black text-3xl md:text-5xl tracking-tight text-ink mt-3">
          Get in Touch with Todaynews.ng
        </h1>
        <p className="text-muted text-lg mt-3 leading-relaxed">
          Have a news tip, correction request, press release, or advertising inquiry? Our editorial desk is available 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Contact Info Cards */}
        <div className="md:col-span-1 space-y-4">
          <div className="border-2 border-ink p-5 rounded bg-paper shadow-brutal space-y-2">
            <Mail className="w-6 h-6 text-flag" />
            <h3 className="font-display font-bold text-ink text-base">Editorial & Newsroom</h3>
            <p className="text-xs text-muted">Send press statements, story tips & corrections:</p>
            <a href="mailto:editor@todaynews.ng" className="text-xs font-bold text-ink hover:text-flag block underline">
              editor@todaynews.ng
            </a>
          </div>

          <div className="border-2 border-ink p-5 rounded bg-paper shadow-brutal space-y-2">
            <ShieldAlert className="w-6 h-6 text-flag" />
            <h3 className="font-display font-bold text-ink text-base">Advertising & Monies</h3>
            <p className="text-xs text-muted">Direct brand placements & sponsored posts:</p>
            <a href="mailto:ads@todaynews.ng" className="text-xs font-bold text-ink hover:text-flag block underline">
              ads@todaynews.ng
            </a>
          </div>

          <div className="border-2 border-ink p-5 rounded bg-paper shadow-brutal space-y-2">
            <MapPin className="w-6 h-6 text-flag" />
            <h3 className="font-display font-bold text-ink text-base">Bureau Locations</h3>
            <p className="text-xs text-muted leading-relaxed">
              <strong>Lagos Desk:</strong> Ikeja City Mall Environs, Lagos State.<br />
              <strong>Abuja Desk:</strong> Central Business District, FCT Abuja.
            </p>
          </div>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2 border-2 border-ink p-6 rounded-lg bg-paper shadow-brutal">
          <h2 className="font-display font-black text-xl text-ink mb-4">Send a Direct Message</h2>

          {submitted ? (
            <div className="p-6 bg-flag/10 border-2 border-flag rounded-lg text-center space-y-3">
              <CheckCircle className="w-12 h-12 text-flag mx-auto" />
              <h3 className="font-display font-bold text-lg text-ink">Message Received!</h3>
              <p className="text-xs text-muted">
                Thank you for contacting Todaynews.ng. Our duty editor will review your submission and respond within 2 to 4 hours.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-2 text-xs font-bold text-flag hover:underline"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chukwuma Adebayo"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-ink rounded text-xs bg-paper focus:outline-none focus:border-flag"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-ink mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="you@domain.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 border-2 border-ink rounded text-xs bg-paper focus:outline-none focus:border-flag"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Subject / Category</label>
                <select
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-ink rounded text-xs bg-paper focus:outline-none focus:border-flag font-bold"
                >
                  <option value="Editorial Query">Editorial Query & News Tip</option>
                  <option value="Correction Request">Correction or Error Report</option>
                  <option value="Advertising">Advertising & Brand Partnership</option>
                  <option value="Other">General Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-ink mb-1">Message Content</label>
                <textarea
                  required
                  rows={5}
                  placeholder="Provide full details of your news tip, feedback, or press inquiry..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border-2 border-ink rounded text-xs bg-paper focus:outline-none focus:border-flag"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-ink text-paper font-display font-black text-xs uppercase tracking-wider rounded hover:bg-flag transition-colors flex items-center justify-center gap-2 shadow-brutal"
              >
                <Send className="w-4 h-4" />
                Submit Message to Newsdesk
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
