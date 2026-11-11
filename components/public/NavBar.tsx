import Link from 'next/link'

export default function Navbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-extrabold text-base shadow-md shadow-indigo-200">
            5
          </div>
          <span className="font-extrabold text-lg sm:text-xl bg-gradient-to-r from-indigo-700 via-purple-700 to-blue-600 bg-clip-text text-transparent tracking-tight">
            SMAN 5 Semarang
          </span>
        </Link>
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold text-slate-700">
          <Link href="/" className="hover:text-indigo-600 transition-colors">Beranda</Link>
          <Link href="/survey" className="hover:text-indigo-600 transition-colors">Yuk Survey!</Link>
          <Link href="/game" className="hover:text-indigo-600 transition-colors">🎮 Main Game</Link>
          <Link href="/statistik" className="hover:text-indigo-600 transition-colors">Statistik</Link>
          <Link href="/tentang" className="hover:text-indigo-600 transition-colors">Tentang</Link>
          <Link
            href="/login"
            className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:opacity-95 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-200"
          >
            Laman Admin
          </Link>
        </div>
      </div>
    </nav>
  )
}