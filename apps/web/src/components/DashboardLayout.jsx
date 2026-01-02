import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Package, LayoutDashboard, Truck, PlusCircle, Activity, LogOut, Menu, Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/shipments", label: "Shipments", icon: Truck },
  { to: "/shipments/new", label: "Create Shipment", icon: PlusCircle },
  { to: "/tracking-events", label: "Tracking Events", icon: Activity },
];

export default function DashboardLayout({ title, children, onSearch }) {
  const nav = useNavigate();
  const { logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [q, setQ] = useState("");

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const submitSearch = (e) => {
    e.preventDefault();
    if (onSearch) onSearch(q.trim());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
        <div className="h-16 px-4 lg:px-6 flex items-center gap-3">
          <button
            className="lg:hidden p-2 rounded-md hover:bg-slate-100"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <div className="font-bold leading-tight">LogisticsPro</div>
              <div className="text-xs text-slate-500 -mt-0.5">Operations Dashboard</div>
            </div>
          </div>

          <div className="flex-1" />

          {/* Search */}
          <form onSubmit={submitSearch} className="hidden md:block w-[420px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400"
                placeholder="Search by reference / shipment id"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </form>

          <button
            className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => nav("/shipments/new")}
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Create</span>
          </button>

          <button
            className="ml-2 inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <form onSubmit={submitSearch}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-indigo-500/25 focus:border-indigo-400"
                placeholder="Search by reference / shipment id"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </form>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={[
            "fixed lg:sticky top-16 left-0 z-30 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200",
            "transition-transform duration-200",
            sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          ].join(" ")}
        >
          <nav className="p-4 space-y-1">
            {navItems.map((it) => {
              const Icon = it.icon;
              return (
                <NavLink
                  key={it.to}
                  to={it.to}
                  className={({ isActive }) =>
                    [
                      "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium",
                      isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-100 text-slate-700",
                    ].join(" ")
                  }
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {it.label}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* Overlay mobile */}
        {sidebarOpen ? (
          <div className="fixed inset-0 z-20 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />
        ) : null}

        {/* Content */}
        <main className="flex-1 p-4 lg:p-6 lg:ml-0">
          <div className="max-w-[1200px] mx-auto">
            {title ? (
              <div className="mb-5">
                <h1 className="text-2xl font-bold">{title}</h1>
                <p className="text-sm text-slate-500 mt-1">Overview, status distribution, recent activity & alerts.</p>
              </div>
            ) : null}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
