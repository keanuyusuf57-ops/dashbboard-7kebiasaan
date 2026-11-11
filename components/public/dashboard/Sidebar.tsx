"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, HelpCircle, FileText, BarChart3, User, Settings } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Beranda", href: "/", icon: LayoutDashboard },
    { name: "Kebiasaan", href: "/#kebiasaan", icon: FileText },
    { name: "Kuis", href: "/game", icon: HelpCircle },
    { name: "Statistik", href: "/statistik", icon: BarChart3 },
    { name: "Saya", href: "/survey", icon: User },
  ];

  return (
    <aside className="w-64 bg-indigo-900 text-white min-h-screen p-6 flex flex-col justify-between rounded-r-3xl shadow-xl shrink-0">
      <div>
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600/50 rounded-xl flex items-center justify-center font-bold text-lg border border-indigo-400/30">
            7
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none text-white">7 KAIH</h1>
            <p className="text-xs text-indigo-300 mt-1">SMAN 5 Semarang</p>
          </div>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-2xl transition-all ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-700/50"
                    : "text-indigo-100 hover:bg-white/10 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="pt-6 border-t border-indigo-800">
        <Link
          href="/admin"
          className="flex items-center gap-4 px-4 py-3 text-sm font-medium rounded-2xl hover:bg-white/10 transition-all text-indigo-200 w-full"
        >
          <Settings size={20} />
          <span>Pengaturan / Admin</span>
        </Link>
      </div>
    </aside>
  );
}