'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  ClipboardList,
  Gamepad2,
  PieChart,
  Info,
  Shield,
  PanelLeftOpen,
  PanelLeftClose,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/', label: 'Beranda', mobileLabel: 'Beranda', icon: Home },
  { href: '/survey', label: 'Yuk Survey!', mobileLabel: 'Survey', icon: ClipboardList },
  { href: '/game', label: 'Main Game', mobileLabel: 'Game', icon: Gamepad2 },
  { href: '/statistik', label: 'Statistik Saya', mobileLabel: 'Statistik', icon: PieChart },
  { href: '/tentang', label: 'Tentang', mobileLabel: 'Tentang', icon: Info },
  { href: '/login', label: 'Admin', mobileLabel: 'Admin', icon: Shield },
]

function SevenHabitsEmblem({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Ikon 7 KAIH"
    >
      <circle cx="20" cy="5.5" r="2.8" fill="#EAB308" />
      <circle cx="31.3" cy="11" r="2.6" fill="#CA8A04" />
      <circle cx="34.1" cy="23.2" r="2.6" fill="#EAB308" />
      <circle cx="26.3" cy="33.1" r="2.6" fill="#CA8A04" />
      <circle cx="13.7" cy="33.1" r="2.6" fill="#EAB308" />
      <circle cx="5.9" cy="23.2" r="2.6" fill="#CA8A04" />
      <circle cx="8.7" cy="11" r="2.6" fill="#EAB308" />
      <path
        d="M20 11L22.5 16.5L28.5 17.3L24.1 21.4L25.2 27.4L20 24.5L14.8 27.4L15.9 21.4L11.5 17.3L17.5 16.5L20 11Z"
        fill="#1E3A8A"
        stroke="#EAB308"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isPinned, setIsPinned] = useState<boolean>(false)
  const [isHovered, setIsHovered] = useState<boolean>(false)
  const isSidebarOpen = isPinned || isHovered

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-x-hidden">
      {/* Sidebar Navigasi Kiri (Desktop) */}
      <aside
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`hidden lg:flex lg:flex-col shrink-0 py-5 px-2.5 sticky top-0 h-screen z-40 transition-all duration-300 ease-out ${
          isSidebarOpen ? 'lg:w-60' : 'lg:w-20'
        }`}
      >
        <div className="kaih-glass-card w-full h-full rounded-[2rem] py-4 px-2.5 flex flex-col justify-between overflow-hidden">
          <Link
            href="/"
            title="Dashboard 7KAIH"
            className={`h-11 flex items-center transition-all ${
              isSidebarOpen ? 'px-2 gap-3 justify-start' : 'w-11 mx-auto justify-center'
            }`}
          >
            <SevenHabitsEmblem className="w-8 h-8 shrink-0" />
            {isSidebarOpen && (
              <span className="text-xs font-extrabold text-blue-950 truncate">
                Dashboard 7KAIH
              </span>
            )}
          </Link>

          <nav className="flex flex-col gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              const isActive =
                item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`h-11 rounded-2xl flex items-center transition-all ${
                    isSidebarOpen ? 'px-3.5 gap-3 justify-start' : 'w-11 mx-auto justify-center'
                  } ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-900 to-sky-700 text-amber-300 shadow-sm'
                      : 'text-slate-800 hover:bg-white/80 hover:text-blue-950'
                  }`}
                >
                  <Icon size={19} className="shrink-0" />
                  {isSidebarOpen && (
                    <span className="text-xs font-bold whitespace-nowrap">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          <button
            type="button"
            onClick={() => setIsPinned((prev) => !prev)}
            title={isPinned ? 'Lipat Sidebar' : 'Kunci Sidebar'}
            className={`h-11 rounded-2xl flex items-center bg-white/65 hover:bg-white text-slate-800 transition-all cursor-pointer ${
              isSidebarOpen ? 'px-3.5 gap-3 justify-start' : 'w-11 mx-auto justify-center'
            }`}
          >
            {isPinned ? (
              <PanelLeftClose size={18} className="shrink-0 text-blue-800" />
            ) : (
              <PanelLeftOpen size={18} className="shrink-0 text-blue-800" />
            )}
            {isSidebarOpen && (
              <span className="text-[11px] font-bold whitespace-nowrap">
                {isPinned ? 'Lipat Otomatis' : 'Kunci Sidebar'}
              </span>
            )}
          </button>
        </div>
      </aside>

      {/* Konten Utama (Langsung dimulai dari Bar Pencarian di atas) */}
      <div className="flex-1 min-w-0 px-3 sm:px-6 lg:pr-7 lg:pl-2 py-3.5 sm:py-5 pb-24 lg:pb-8 max-w-[1440px] mx-auto w-full">
        <main className="w-full min-w-0">{children}</main>
      </div>

      {/* Navigasi Bawah Mobile */}
      <nav
        aria-label="Navigasi Mobile"
        className="lg:hidden fixed bottom-2.5 inset-x-2.5 z-40 kaih-glass-card rounded-2xl px-1.5 py-1.5 flex items-center justify-between gap-0.5 shadow-xl"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 min-w-0 flex flex-col items-center justify-center gap-0.5 py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all active:scale-95 ${
                isActive
                  ? 'bg-blue-900 text-amber-300 shadow-xs'
                  : 'text-slate-700 hover:text-blue-900'
              }`}
            >
              <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
              <span className="truncate w-full text-center leading-tight">
                {item.mobileLabel}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}