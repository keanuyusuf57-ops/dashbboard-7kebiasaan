"use client"

import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white rounded-3xl p-8 md:p-12 shadow-2xl border border-indigo-500/20 my-6">
      {/* Background Glow Overlay */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-3xl space-y-6">
        {/* Badge Identitas SMAN 5 Semarang */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-indigo-200 text-xs font-medium">
          <Sparkles size={14} className="text-purple-300" />
          <span>7 KAIH • SMAN 5 Semarang</span>
        </div>

        {/* Judul Utama */}
        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight bg-gradient-to-r from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
          7 Kebiasaan Anak Indonesia Hebat
        </h1>

        {/* Deskripsi Singkat */}
        <p className="text-sm md:text-base text-indigo-100/80 leading-relaxed max-w-2xl">
          Panduan kebiasaan positif menurut Kementerian Pendidikan Dasar dan Menengah (Kemendikdasmen) untuk membentuk generasi yang berkarakter, mandiri, dan berdaya saing di SMAN 5 Semarang.
        </p>

        {/* Tombol Aksi (Preservasi fitur asli) */}
        <div className="flex flex-wrap gap-4 pt-2">
          <Link
            href="/survey"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span>Isi Survey Sekarang</span>
            <ArrowRight size={16} />
          </Link>
          <Link
            href="/game"
            className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-2xl hover:bg-white/20 transition-all"
          >
            <span>Mainkan Kuis Game 🎮</span>
          </Link>
        </div>
      </div>
    </div>
  )
}