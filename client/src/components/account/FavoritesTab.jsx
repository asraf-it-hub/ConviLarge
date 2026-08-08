import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Star } from "lucide-react";
import toast from "react-hot-toast";

const STORAGE_KEY = "convilarge_favorite_tools";

export default function FavoritesTab() {
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (e) {
      console.error("Failed to save favorites to localStorage", e);
    }
  }, [favorites]);

  function removeFavorite(name) {
    setFavorites((prev) => prev.filter((f) => f.name !== name));
    toast.success(`Removed ${name} from favorites`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-950 dark:text-white">Favorite Tools</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Save and launch your most frequently used document tools with one click.</p>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl">
          {favorites.map((fav) => (
            <div
              key={fav.name}
              className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-between group"
            >
              <Link to={fav.path} className="space-y-1 flex-1 pr-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{fav.category}</span>
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm hover:underline">{fav.name}</h3>
              </Link>
              <button
                onClick={() => removeFavorite(fav.name)}
                title="Remove from favorites"
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
              >
                <Star className="text-amber-400 fill-amber-400 h-5 w-5 shrink-0" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="max-w-3xl py-12 text-center border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900">
          <Star className="mx-auto h-12 w-12 text-slate-350 dark:text-slate-600" />
          <h3 className="mt-4 font-semibold text-slate-900 dark:text-white">No favorite tools saved</h3>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            Star your favorite tools on tool pages to quickly access them here in your account dashboard.
          </p>
        </div>
      )}
    </div>
  );
}
