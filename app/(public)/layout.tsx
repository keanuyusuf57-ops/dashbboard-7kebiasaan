'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  Home,
  ClipboardList,
  Gamepad2,
  BarChart2,
  Info,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Beranda', shortLabel: 'Beranda', href: '/', icon: Home },
  { label: 'Yuk Survey!', shortLabel: 'Survey', href: '/survey', icon: ClipboardList },
  { label: 'Main Game', shortLabel: 'Game', href: '/game', icon: Gamepad2 },
  { label: 'Statistik Pribadi', shortLabel: 'Statistik', href: '/statistik', icon: BarChart2 },
  { label: 'Tentang 7 KAIH', shortLabel: 'Tentang', href: '/tentang', icon: Info },
  { label: 'Admin', shortLabel: 'Admin', href: '/admin', icon: ShieldCheck },
]

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const supabase = createClient()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [logoUrl, setLogoUrl] = useState('')

  useEffect(() => {
    async function loadLogo() {
      const { data } = await supabase
        .from('site_settings')
        .select('nexara_logo_url')
        .limit(1)
        .maybeSingle()

      if (data?.nexara_logo_url) {
        setLogoUrl(data.nexara_logo_url)
      }
    }

    loadLogo()
  }, [supabase])

  const isHomePage = pathname === '/'

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20 lg:pb-0">
      <header className="sticky top-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
        <Link href="/" className="flex items-center gap-2.5 min-w-0">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo Nexara"
              className="h-9 w-9 rounded-xl object-contain p-0.5 bg-slate-900 shrink-0"
            />
          ) : (
            <div className="h-9 w-9 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
              NX
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-extrabold text-slate-900 truncate leading-tight">
              NEXARA • 7 KAIH
            </p>
            <p className="text-[10px] font-semibold text-slate-500 truncate">
              SMAN 5 Semarang
            </p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold active:scale-95 transition-all"
          aria-label="Menu Lengkap"
        >
          <Menu size={18} />
          <span>Menu</span>
        </button>
      </header>

      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-slate-900/60 backdrop-blur-xs flex justify-end"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-72 max-w-[82vw] bg-white h-full p-5 flex flex-col justify-between shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">
                  Navigasi 7 KAIH
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-600"
                >
                  <X size={18} />
                </button>
              </div>

              <nav className="mt-4 space-y-1.5">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <p className="text-[11px] font-bold text-slate-600">
                Gerakan 7 Kebiasaan Anak Indonesia Hebat
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">SMAN 5 Semarang</p>
            </div>
          </div>
        </div>
      )}

      <div className={isHomePage ? '' : 'w-full'}>{children}</div>

      <nav className="fixed bottom-0 inset-x-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 px-1.5 py-1.5 flex items-center justify-around shadow-[0_-4px_12px_rgba(0,0,0,0.04)]">
        {NAV_ITEMS.slice(0, 5).map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl min-w-[58px] transition-all ${
                isActive ? 'text-indigo-600 bg-indigo-50/80' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-bold mt-0.5">{item.shortLabel}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}