import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="font-extrabold text-lg sm:text-xl text-blue-600 tracking-tight">
            SMAN 5 Semarang
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-gray-900">
          <Link href="/" className="hover:text-blue-600 transition-colors">Beranda</Link>
          <Link href="/survey" className="hover:text-blue-600 transition-colors">Yuk Survey!</Link>
          <Link href="/game" className="hover:text-blue-600 transition-colors">🎮 Main Game</Link>
          <Link href="/statistik" className="hover:text-blue-600 transition-colors">Statistik</Link>
          <Link href="/tentang" className="hover:text-blue-600 transition-colors">Tentang</Link>
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow"
          >
            Laman Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}