'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LayoutDashboard, FileText, Database, Users, LogOut } from 'lucide-react'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const menuItems = [
    { name: 'Edit Beranda', href: '/admin/beranda', icon: LayoutDashboard },
    { name: 'Edit Survey', href: '/admin/survey', icon: FileText },
    { name: 'Database Survey', href: '/admin/database', icon: Database },
    { name: 'Edit Tim Pengembang', href: '/admin/tim', icon: Users },
  ]

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* Sidebar Admin */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col justify-between p-4 sticky top-0 h-screen">
        <div>
          <div className="flex items-center gap-3 px-3 py-4 mb-6 border-b border-gray-800">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">
              A
            </div>
            <span className="font-bold text-base">Panel Admin</span>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Keluar (Logout)
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  )
}