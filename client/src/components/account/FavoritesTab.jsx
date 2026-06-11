import { Link } from "react-router-dom";
import { Star } from "lucide-react";

export default function FavoritesTab() {
  const favorites = [
    { name: "JPG to PNG", path: "/convert?tool=jpg-to-png", category: "Convert" },
    { name: "Merge PDFs", path: "/merge?tool=merge-pdf", category: "Merge" },
    { name: "Compress PDF", path: "/compress?tool=compress-pdf", category: "Compress" },
    { name: "AI PDF Summarizer", path: "/ai?tool=ai-pdf-summarizer", category: "AI Tools" }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Favorite Tools</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Save and launch your most frequently used document tools with one click.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
        {favorites.map((fav) => (
          <Link
            key={fav.name}
            to={fav.path}
            className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800/80 transition flex items-center justify-between"
          >
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{fav.category}</span>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{fav.name}</h3>
            </div>
            <Star className="text-amber-400 fill-amber-400 h-5 w-5 shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
