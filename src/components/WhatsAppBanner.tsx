import React from "react";
import { MessageCircle } from "lucide-react";

export default function WhatsAppBanner() {
  return (
    <div className="bg-[#25D366]/10 border-2 border-[#25D366] p-5 rounded my-6 flex flex-col sm:flex-row items-center justify-between gap-4 font-body shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-[#25D366] text-white p-2.5 rounded-full shadow-inner shrink-0">
          <MessageCircle className="h-6 w-6 animate-pulse" />
        </div>
        <div>
          <h4 className="font-display font-black text-sm md:text-base text-ink uppercase tracking-wide leading-tight">
            Follow Todaynews.ng on WhatsApp!
          </h4>
          <p className="text-xs text-ink/80 mt-1 leading-relaxed">
            Get instant breaking news alerts, Naira black market rates, and gist directly on your WhatsApp status.
          </p>
        </div>
      </div>
      <a
        href="#"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-[#25D366] hover:bg-[#20ba56] text-white px-5 py-2.5 rounded text-xs font-black uppercase tracking-wider transition-all shadow hover:translate-y-[-1px] active:translate-y-[0px] shrink-0 text-center w-full sm:w-auto"
      >
        Join Channel Now
      </a>
    </div>
  );
}
