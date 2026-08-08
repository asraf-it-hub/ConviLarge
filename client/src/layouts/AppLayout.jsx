import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import MobileCategoryBar from "../components/MobileCategoryBar.jsx";

export default function AppLayout() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname, search]);

  return (
    <div className="app-shell text-slate-900 dark:text-slate-100">
      <Navbar />
      <MobileCategoryBar />
      <Outlet />
    </div>
  );
}
