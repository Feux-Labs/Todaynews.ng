import React from "react";
import { Facebook, Twitter, Send, Instagram, PhoneCall } from "lucide-react";

interface SocialHandlesProps {
  className?: string;
  iconOnly?: boolean;
}

export default function SocialHandles({ className = "", iconOnly = false }: SocialHandlesProps) {
  const handles = [
    {
      name: "Facebook",
      href: "#",
      icon: <Facebook className="h-4 w-4" />,
      color: "hover:text-[#1877F2]",
    },
    {
      name: "WhatsApp",
      href: "#",
      icon: <PhoneCall className="h-4 w-4" />,
      color: "hover:text-[#25D366]",
    },
    {
      name: "X (Twitter)",
      href: "#",
      icon: <Twitter className="h-4 w-4" />,
      color: "hover:text-black",
    },
    {
      name: "Telegram",
      href: "#",
      icon: <Send className="h-4 w-4" />,
      color: "hover:text-[#0088cc]",
    },
    {
      name: "Instagram",
      href: "#",
      icon: <Instagram className="h-4 w-4" />,
      color: "hover:text-[#E1306C]",
    },
  ];

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {handles.map((h) => (
        <a
          key={h.name}
          href={h.href}
          target="_blank"
          rel="noopener noreferrer"
          title={`Follow Todaynews.ng on ${h.name}`}
          className={`flex items-center gap-1.5 transition-colors text-muted ${h.color}`}
        >
          {h.icon}
          {!iconOnly && <span className="text-xs font-semibold">{h.name}</span>}
        </a>
      ))}
    </div>
  );
}
