import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";

export default function AppLayout() {
  return (
    <div className="app-shell text-slate-900 dark:text-slate-100">
      <Navbar />
      <Outlet />
    </div>
  );
}
