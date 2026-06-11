import { useState } from "react";
import {
  User, Key, Shield, Lock, Activity, RefreshCw, CreditCard, Folder, Star,
  Heart, Download, Sparkles, Award, Receipt, Wallet, FileText, Bell, Eye,
  Globe, Moon, HelpCircle, MessageSquare, MessageCircle, AlertTriangle,
  UserCheck, LogOut, ChevronRight, ArrowLeft
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";

// Import tabs
import ProfileTab from "../components/account/ProfileTab.jsx";
import PasswordTab from "../components/account/PasswordTab.jsx";
import SecuritySettingsTab from "../components/account/SecuritySettingsTab.jsx";
import TwoFactorTab from "../components/account/TwoFactorTab.jsx";
import LoginActivityTab from "../components/account/LoginActivityTab.jsx";
import ConversionsTab from "../components/account/ConversionsTab.jsx";
import PurchasesTab from "../components/account/PurchasesTab.jsx";
import ProjectsTab from "../components/account/ProjectsTab.jsx";
import FavoritesTab from "../components/account/FavoritesTab.jsx";
import WishlistTab from "../components/account/WishlistTab.jsx";
import DownloadsTab from "../components/account/DownloadsTab.jsx";
import SubscriptionTab from "../components/account/SubscriptionTab.jsx";
import MembershipTab from "../components/account/MembershipTab.jsx";
import BillingTab from "../components/account/BillingTab.jsx";
import PaymentMethodsTab from "../components/account/PaymentMethodsTab.jsx";
import InvoicesTab from "../components/account/InvoicesTab.jsx";
import NotificationsTab from "../components/account/NotificationsTab.jsx";
import PrivacyTab from "../components/account/PrivacyTab.jsx";
import LanguageTab from "../components/account/LanguageTab.jsx";
import ThemeTab from "../components/account/ThemeTab.jsx";
import HelpCenterTab from "../components/account/HelpCenterTab.jsx";
import SupportTab from "../components/account/SupportTab.jsx";
import FeedbackTab from "../components/account/FeedbackTab.jsx";
import ReportProblemTab from "../components/account/ReportProblemTab.jsx";

// Import modals
import SwitchAccountModal from "../components/account/SwitchAccountModal.jsx";
import LogoutModal from "../components/account/LogoutModal.jsx";

export default function AccountPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [mobileDetail, setMobileDetail] = useState(false); // iOS slide-in settings detail

  // Modals state
  const [switchOpen, setSwitchOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);

  // Group items by category
  const categories = [
    {
      title: "Account Management",
      items: [
        { id: "profile", label: "My Profile", icon: User, component: ProfileTab }
      ]
    },
    {
      title: "Security",
      items: [
        { id: "password", label: "Change Password", icon: Key, component: PasswordTab },
        { id: "security-settings", label: "Security Settings", icon: Shield, component: SecuritySettingsTab },
        { id: "2fa", label: "Two-Factor Auth (2FA)", icon: Lock, component: TwoFactorTab },
        { id: "activity", label: "Login Activity", icon: Activity, component: LoginActivityTab }
      ]
    },
    {
      title: "User Content",
      items: [
        { id: "conversions", label: "My Conversions", icon: RefreshCw, component: ConversionsTab },
        { id: "purchases", label: "Purchase History", icon: CreditCard, component: PurchasesTab },
        { id: "projects", label: "My Projects", icon: Folder, component: ProjectsTab },
        { id: "favorites", label: "Saved Favorites", icon: Star, component: FavoritesTab },
        { id: "wishlist", label: "Feature Wishlist", icon: Heart, component: WishlistTab },
        { id: "downloads", label: "Downloads", icon: Download, component: DownloadsTab }
      ]
    },
    {
      title: "Subscription & Billing",
      items: [
        { id: "subscription", label: "Subscription", icon: Sparkles, component: SubscriptionTab },
        { id: "membership", label: "Membership Benefits", icon: Award, component: MembershipTab },
        { id: "billing", label: "Billing", icon: Receipt, component: BillingTab },
        { id: "payment-methods", label: "Payment Methods", icon: Wallet, component: PaymentMethodsTab },
        { id: "invoices", label: "Invoices", icon: FileText, component: InvoicesTab }
      ]
    },
    {
      title: "Preferences",
      items: [
        { id: "notifications", label: "Notifications", icon: Bell, component: NotificationsTab },
        { id: "privacy", label: "Privacy Settings", icon: Eye, component: PrivacyTab },
        { id: "language", label: "Language", icon: Globe, component: LanguageTab },
        { id: "theme", label: "Theme", icon: Moon, component: ThemeTab }
      ]
    },
    {
      title: "Support",
      items: [
        { id: "help", label: "Help Center", icon: HelpCircle, component: HelpCenterTab },
        { id: "support", label: "Contact Support", icon: MessageSquare, component: SupportTab },
        { id: "feedback", label: "Give Feedback", icon: MessageCircle, component: FeedbackTab },
        { id: "report", label: "Report a Problem", icon: AlertTriangle, component: ReportProblemTab }
      ]
    },
    {
      title: "Session Controls",
      items: [
        { id: "switch", label: "Switch Account", icon: UserCheck, action: () => setSwitchOpen(true) },
        { id: "logout", label: "Log Out", icon: LogOut, action: () => setLogoutOpen(true) }
      ]
    }
  ];

  // Get active tab details
  let ActiveComponent = ProfileTab;
  let activeLabel = "My Profile";
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      if (item.id === activeTab && item.component) {
        ActiveComponent = item.component;
        activeLabel = item.label;
      }
    });
  });

  function selectTab(item) {
    if (item.action) {
      item.action();
    } else {
      setActiveTab(item.id);
      setMobileDetail(true);
    }
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)]">
      {/* Container */}
      <div className="flex flex-col lg:flex-row gap-8 mt-4">
        {/* Desktop Sidebar & Mobile list (hidden depending on mobile state) */}
        <aside className={`w-full lg:w-72 shrink-0 ${mobileDetail ? "hidden lg:block" : "block"}`}>
          {/* User profile brief */}
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-6 shadow-sm">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                className="h-12 w-12 rounded-full object-cover ring-2 ring-slate-200/50 dark:ring-slate-850"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 text-white font-bold text-base dark:bg-white dark:text-slate-950 ring-2 ring-slate-200/50 dark:ring-slate-850">
                {user.name[0]?.toUpperCase()}
              </div>
            )}
            <div className="overflow-hidden">
              <h2 className="font-bold text-slate-900 dark:text-white truncate">{user.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{user.email}</p>
            </div>
          </div>

          {/* Navigation categories */}
          <nav className="space-y-6">
            {categories.map((cat) => (
              <div key={cat.title} className="space-y-1">
                <h3 className="px-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.title}</h3>
                <div className="space-y-0.5">
                  {cat.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => selectTab(item)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm font-semibold rounded-lg transition ${
                          isActive && !item.action
                            ? "bg-slate-950 text-white dark:bg-white dark:text-slate-950"
                            : "text-slate-650 hover:bg-slate-100 dark:text-slate-350 dark:hover:bg-slate-900/50"
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon size={18} className="shrink-0 opacity-80" />
                          <span>{item.label}</span>
                        </span>
                        <ChevronRight size={14} className="opacity-50 lg:hidden" />
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content area */}
        <section className={`flex-1 min-w-0 ${!mobileDetail ? "hidden lg:block" : "block"}`}>
          {/* Mobile Back Header */}
          <div className="flex items-center gap-3 lg:hidden mb-6 border-b border-slate-200 dark:border-slate-800 pb-4">
            <button
              onClick={() => setMobileDetail(false)}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition"
              aria-label="Back to settings menu"
            >
              <ArrowLeft size={20} className="text-slate-700 dark:text-slate-300" />
            </button>
            <span className="font-bold text-slate-900 dark:text-white">{activeLabel}</span>
          </div>

          {/* Render Active Settings panel */}
          <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-soft">
            <ActiveComponent />
          </div>
        </section>
      </div>

      {/* Modals overlay */}
      <SwitchAccountModal isOpen={switchOpen} onClose={() => setSwitchOpen(false)} />
      <LogoutModal isOpen={logoutOpen} onClose={() => setLogoutOpen(false)} />
    </main>
  );
}
