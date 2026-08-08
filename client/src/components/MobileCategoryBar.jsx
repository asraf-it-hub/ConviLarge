import { useEffect, useRef } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  FileArchive,
  FileText,
  Home,
  Image,
  Layers,
  RefreshCw,
  Scissors,
  Send,
  ShieldCheck,
  Sparkles
} from "lucide-react";

const categories = [
  { label: "Home", href: "/", icon: Home },
  { label: "Convert", href: "/convert", icon: RefreshCw },
  { label: "Merge", href: "/merge", icon: Layers },
  { label: "Compress", href: "/compress", icon: FileArchive },
  { label: "Image", href: "/image", icon: Image },
  { label: "PDF", href: "/pdf", icon: FileText },
  { label: "Transfer", href: "/transfer", icon: Send },
  { label: "AI Tools", href: "/ai", icon: Sparkles },
  { label: "Split", href: "/split", icon: Scissors },
  { label: "Security", href: "/security", icon: ShieldCheck }
];

export default function MobileCategoryBar() {
  const { pathname } = useLocation();
  const navRef = useRef(null);

  // Auto-scroll active category button into view on mobile
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector('[data-active="true"]');
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [pathname]);

  return (
    <div className="sticky top-16 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 lg:hidden">
      <div
        ref={navRef}
        className="flex items-center gap-1.5 overflow-x-auto px-3 py-2.5 text-xs no-scrollbar scroll-smooth"
      >
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = cat.href === "/" ? pathname === "/" : pathname.startsWith(cat.href);
          return (
            <NavLink
              key={cat.href}
              to={cat.href}
              data-active={isActive}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-bold transition-all select-none ${
                isActive
                  ? "bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950 ring-1 ring-slate-950/10 dark:ring-white/20"
                  : "bg-slate-100/90 text-slate-650 hover:bg-slate-200/70 dark:bg-slate-900/90 dark:text-slate-350 dark:hover:bg-slate-800"
              }`}
            >
              <Icon size={14} className={isActive ? "text-brand-400 dark:text-brand-600" : "opacity-70"} />
              <span className="whitespace-nowrap">{cat.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
