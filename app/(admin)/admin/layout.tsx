'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutGrid,
  FileText,
  Database,
  Users,
  LogOut,
  Lock,
  ShieldAlert,
  Menu,
  X,
} from 'lucide-react'

const ALLOWED_ADMINS = [
  '7kaihadmin@sman5.sch.id',
  'admin@sman5smg.sch.id',
  'paknico@sman5smg.sch.id',
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const pathname = usePathname()

  const [session, setSession] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [loggingIn, setLoggingIn] = useState(false)
  const [mobileAdminMenu, setMobileAdminMenu] = useState(false)

  const isAllowedAdmin = (userSession: any) => {
    const email = userSession?.user?.email?.toLowerCase().trim()
    if (!email) return false
    return ALLOWED_ADMINS.map((e) => e.toLowerCase().trim()).includes(email)
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && !isAllowedAdmin(session)) {
        await supabase.auth.signOut()
        setSession(null)
        setLoginError('Akun ini bukan akun resmi Admin. Gunakan akun khusus Admin.')
      } else {
        setSession(session)
      }
      setAuthLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session && !isAllowedAdmin(session)) {
        await supabase.auth.signOut()
        setSession(null)
        setLoginError('Akun ini bukan akun resmi Admin. Gunakan akun khusus Admin.')
      } else {
        setSession(session)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoggingIn(true)
    setLoginError('')

    const cleanEmail = adminEmail.trim().toLowerCase()

    if (!ALLOWED_ADMINS.map((e) => e.toLowerCase().trim()).includes(cleanEmail)) {
      setLoginError('Akses ditolak! Email ini tidak terdaftar sebagai Admin.')
      setLoggingIn(false)
      return
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password: adminPassword,
    })

    if (error) {
      setLoginError('Akses ditolak! Email atau kata sandi khusus Admin salah.')
    }
    setLoggingIn(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
  }

  const navLinks = [
    { label: 'Edit Beranda', href: '/admin', icon: LayoutGrid },
    { label: 'Edit Survey', href: '/admin/survey', icon: FileText },
    { label: 'Database Survey', href: '/admin/database', icon: Database },
    { label: 'Edit Tim Pengembang', href: '/admin/tim', icon: Users },
  ]

  return (
    <>
      {authLoading && (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center text-white text-sm">
          Memeriksa otorisasi Admin...
        </div>
      )}

      {!authLoading && !session && (
        <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
                <Lock size={26} />
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900">Panel Admin 7 KAIH</h1>
              <p className="text-xs text-slate-500">
                Masuk menggunakan akun khusus pengelola SMAN 5 Semarang.
              </p>
            </div>

            {loginError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 p-3.5 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <ShieldAlert size={16} className="shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Email Admin
                </label>
                <input
                  type="email"
                  required
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  placeholder="7kaihadmin@sman5.sch.id"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                  Kata Sandi
                </label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-2xl text-sm shadow-md transition-all cursor-pointer"
              >
                {loggingIn ? 'Memverifikasi...' : 'Masuk ke Panel Admin'}
              </button>
            </form>

            <div className="text-center">
              <Link href="/" className="text-xs font-bold text-slate-400 hover:text-blue-600">
                ← Kembali ke Web Publik
              </Link>
            </div>
          </div>
        </div>
      )}

      <div
        className={
          !authLoading && session
            ? 'flex flex-col lg:flex-row min-h-screen bg-slate-50 font-sans'
            : 'hidden'
        }
      >
        {/* Header Admin Khusus Layar HP */}
        <header className="lg:hidden bg-[#0f172a] text-white px-4 py-3.5 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center font-black text-xs">
              A
            </div>
            <span className="font-bold text-sm">Panel Admin 7 KAIH</span>
          </div>
          <button
            type="button"
            onClick={() => setMobileAdminMenu(!mobileAdminMenu)}
            className="p-2 rounded-xl bg-slate-800 text-white"
          >
            {mobileAdminMenu ? <X size={18} /> : <Menu size={18} />}
          </button>
        </header>

        {/* Dropdown Menu Admin HP */}
        {mobileAdminMenu && (
          <div className="lg:hidden bg-[#0f172a] text-white px-4 pb-4 space-y-2 border-b border-slate-800">
            {navLinks.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileAdminMenu(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                    isActive ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-rose-400 text-xs font-bold"
            >
              <LogOut size={16} />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        )}

        {/* Sidebar Admin Desktop */}
        <aside className="hidden lg:flex w-64 bg-[#0f172a] text-white flex-col justify-between p-5 shrink-0">
          <div>
            <div className="flex items-center gap-3 pb-6 border-b border-slate-800">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center font-black text-sm">
                A
              </div>
              <span className="font-bold text-base">Panel Admin</span>
            </div>

            <nav className="mt-6 space-y-2 text-sm font-medium">
              {navLinks.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white font-bold shadow-md'
                        : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                    }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-400 hover:bg-rose-950/40 text-sm font-bold transition-all cursor-pointer"
          >
            <LogOut size={18} />
            <span>Keluar (Logout)</span>
          </button>
        </aside>

        <div className="flex-1 min-w-0 overflow-x-auto">{children}</div>
      </div>
    </>
  )
}