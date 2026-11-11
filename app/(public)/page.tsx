'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import HeroSection from '@/components/public/HeroSection'
import { Search, Bell, Volume2, ArrowRight } from 'lucide-react'

function Sidebar() {
  const pathname = usePathname()

  const navItems = [
    { label: 'Beranda', href: '/' },
    { label: 'Kebiasaan', href: '#kebiasaan-section' },
    { label: 'Kuis', href: '/game' },
    { label: 'Statistik', href: '/statistik' },
    { label: 'Saya', href: '/survey' },
  ]

  return (
    <aside className="w-72 bg-white rounded-3xl shadow-sm border border-slate-100 p-5 hidden lg:flex flex-col shrink-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-white font-bold shadow-sm">
          7
        </div>
        <div>
          <p className="text-sm font-bold text-slate-800">7 KAIH</p>
          <p className="text-[11px] text-slate-500">Kebiasaan Anak Indonesia Hebat</p>
        </div>
      </div>

      <nav className="mt-6 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`block w-full text-left px-3 py-2.5 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}

function HabitDonutChart() {
  const completion = 78

  return (
    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-800 text-lg">Progress Kebiasaan</h3>
          <p className="text-xs text-slate-500">Ringkasan capaian harian</p>
        </div>
        <span className="bg-indigo-50 text-indigo-600 text-xs font-semibold px-2.5 py-1 rounded-full">
          {completion}%
        </span>
      </div>

      <div className="flex items-center justify-center py-4">
        <div className="relative h-44 w-44">
          <div className="absolute inset-0 rounded-full bg-slate-100" />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(#6366f1 0 ${completion}%, #e2e8f0 ${completion}% 100%)`,
            }}
          />
          <div className="absolute inset-4 rounded-full bg-white shadow-inner flex items-center justify-center">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800">{completion}%</div>
              <div className="text-[11px] text-slate-500">Tercapai</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="bg-slate-50 p-3 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">Kebiasaan</p>
          <p className="font-bold text-slate-800 mt-1">7 dari 7</p>
        </div>
        <div className="bg-indigo-50 p-3 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wide text-indigo-500">Target</p>
          <p className="font-bold text-indigo-700 mt-1">Hari ini</p>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const habits = [
    { title: '1. Bangun Pagi', desc: 'Membiasakan diri bangun tepat waktu untuk memulai hari dengan disiplin.' },
    { title: '2. Beribadah', desc: 'Taat menjalankan ibadah sesuai keyakinan masing-masing.' },
    { title: '3. Berolahraga', desc: 'Menjaga kesehatan dan kebugaran jasmani secara teratur.' },
    { title: '4. Makan Sehat & Bergizi', desc: 'Mengonsumsi makanan yang bernutrisi untuk mendukung tumbuh kembang.' },
    { title: '5. Gemar Membaca', desc: 'Mengembangkan minat baca untuk menambah wawasan dan literasi.' },
    { title: '6. Membantu Orang Tua', desc: 'Aktif berinteraksi, peduli lingkungan, dan bergotong royong.' },
    { title: '7. Istirahat Cukup', desc: 'Menjaga pola tidur yang teratur untuk pemulihan energi fisik dan mental.' },
  ]

  return (
    <div className="flex bg-slate-50 min-h-screen p-4 gap-6 font-sans">
      {/* Sidebar Navigasi Kiri */}
      <Sidebar />

      {/* Konten Utama */}
      <main className="flex-1 space-y-6">
        {/* Top Header Bar */}
        <header className="flex justify-between items-center bg-white p-4 px-6 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 bg-slate-100 px-4 py-2 rounded-xl w-72">
            <Search size={18} className="text-slate-400" />
            <input
              type="text"
              placeholder="Cari kebiasaan atau fitur..."
              className="bg-transparent text-sm focus:outline-none w-full"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all flex items-center gap-2 text-xs font-semibold px-3">
              <Volume2 size={18} />
              <span>Audio FX: ON</span>
            </button>
            <button className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200">
              <Bell size={18} />
            </button>
          </div>
        </header>

        {/* Hero Section bawaan kamu dengan Suspense Fallback */}
        <Suspense
          fallback={
            <div className="h-[200px] bg-indigo-900 rounded-3xl flex items-center justify-center text-white">
              <p className="text-indigo-200 animate-pulse font-semibold">Memuat Beranda...</p>
            </div>
          }
        >
          <HeroSection />
        </Suspense>

        {/* Banner Gradasi Ungu - Biru */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-500 text-white p-6 rounded-3xl shadow-md flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Halo, Siswa SMAN 5 Semarang! 👋</h2>
            <p className="text-indigo-100 text-sm mt-1">
              Rotasi kuis berikutnya dalam <span className="font-semibold text-white">04:32:15</span>
            </p>
          </div>
          <a
            href="/game"
            className="bg-white text-indigo-700 px-5 py-3 rounded-2xl font-bold text-sm hover:bg-indigo-50 transition-all shadow-sm flex items-center gap-2"
          >
            Mulai Kuis Rotasi <ArrowRight size={16} />
          </a>
        </div>

        {/* Grid Dashboard: Donut Chart & Aksi Cepat */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HabitDonutChart />

          <div className="space-y-4">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
              <h3 className="font-bold text-slate-800 text-lg mb-2">Aksi Cepat</h3>
              <p className="text-xs text-slate-500 mb-4">Akses fitur utama 7 KAIH secara langsung.</p>
              <div className="space-y-3">
                <a 
                  href="/survey" 
                  className="block w-full p-4 bg-purple-50 text-purple-700 rounded-2xl font-semibold text-sm text-center hover:bg-purple-100 transition-all"
                >
                  Isi Survei Evaluasi Diri
                </a>
                <a 
                  href="/statistik" 
                  className="block w-full p-4 bg-blue-50 text-blue-700 rounded-2xl font-semibold text-sm text-center hover:bg-blue-100 transition-all"
                >
                  Unduh Poster PNG (Canvas)
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Section 7 Kebiasaan Asli bawaan kamu */}
        <section id="kebiasaan-section" className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              7 Kebiasaan Anak Indonesia Hebat
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed">
              Panduan kebiasaan positif menurut Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) untuk membentuk generasi yang berkarakter, mandiri, dan berdaya saing.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {habits.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:shadow-md transition-shadow">
                <h3 className="text-lg font-bold text-indigo-600 mb-2">{item.title}</h3>
                <p className="text-slate-600 text-xs font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Panel Kanan */}
      <aside className="w-80 space-y-6 hidden xl:block">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h3 className="font-bold text-slate-800 text-base mb-4">Aktivitas Komunitas</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600">Total Siswa Berpartisipasi</span>
              <span className="font-bold text-indigo-600">1,245 Siswa</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full w-[78%]" />
            </div>
            <p className="text-[11px] text-slate-400">78% dari total siswa aktif minggu ini</p>
          </div>
        </div>
      </aside>
    </div>
  )
}