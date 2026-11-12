'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ClipboardCheck, BarChart2, Gamepad2, ArrowRight } from 'lucide-react'

export default function HeroSection({
  onLogoLoaded,
}: {
  onLogoLoaded?: (url: string) => void
}) {
  const supabase = createClient()
  const [settings, setSettings] = useState<any>({
    hero_badge: '7 KAIH • SMAN 5 Semarang',
    hero_title: '7 KEBIASAAN ANAK INDONESIA HEBAT',
    hero_subtitle: 'Gerakan Karakter Unggul Siswa-Siswi SMAN 5 Semarang',
    nexara_logo_url: '',
  })

  useEffect(() => {
    async function loadHero() {
      const { data } = await supabase
        .from('site_settings')
        .select('*')
        .limit(1)
        .maybeSingle()

      if (data) {
        setSettings((prev: any) => ({ ...prev, ...data }))
        if (data.nexara_logo_url && onLogoLoaded) {
          onLogoLoaded(data.nexara_logo_url)
        }
      }
    }
    loadHero()
  }, [])

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2e1065] via-[#3b0764] to-[#0f172a] text-white p-5 sm:p-8 lg:p-10 shadow-xl">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
        {/* Bagian Kiri: Logo, Judul & Tombol Utama */}
        <div className="lg:col-span-7 space-y-4 sm:space-y-5">
          <div className="flex items-center gap-3 sm:gap-4">
            {settings.nexara_logo_url ? (
              <img
                src={settings.nexara_logo_url}
                alt="Logo Nexara"
                className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl object-contain p-1.5 bg-slate-950/60 border border-white/15 shrink-0 shadow-md"
              />
            ) : (
              <div className="h-14 w-14 sm:h-20 sm:w-20 rounded-2xl bg-indigo-500/30 border border-white/20 flex items-center justify-center font-black text-lg sm:text-2xl shrink-0">
                NX
              </div>
            )}

            <span className="inline-block px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-[11px] sm:text-xs font-bold tracking-wide text-indigo-100">
              {settings.hero_badge}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-[42px] font-black tracking-tight leading-[1.15]">
            {settings.hero_title}
          </h1>

          <p className="text-xs sm:text-base text-indigo-200 max-w-xl leading-relaxed">
            {settings.hero_subtitle}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            <Link
              href="/survey"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-extrabold text-xs sm:text-sm shadow-md transition-all"
            >
              <span>Isi Survey Sekarang</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/game"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-xs sm:text-sm transition-all"
            >
              <span>Mainkan Kuis Game 🎮</span>
            </Link>
          </div>
        </div>

        {/* Bagian Kanan: Navigasi Cepat Siswa */}
        <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 space-y-2.5">
          <p className="text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 px-1">
            Navigasi Cepat Siswa
          </p>

          <Link
            href="/survey"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-xs sm:text-sm font-bold"
          >
            <span className="flex items-center gap-2.5">
              <ClipboardCheck size={17} className="text-indigo-300 shrink-0" />
              <span>Yuk Survey! (Isi Evaluasi)</span>
            </span>
            <ArrowRight size={15} className="text-indigo-300 shrink-0" />
          </Link>

          <Link
            href="/statistik"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-xs sm:text-sm font-bold"
          >
            <span className="flex items-center gap-2.5">
              <BarChart2 size={17} className="text-purple-300 shrink-0" />
              <span>Statistik Pribadi Saya</span>
            </span>
            <ArrowRight size={15} className="text-purple-300 shrink-0" />
          </Link>

          <Link
            href="/game"
            className="flex items-center justify-between p-3.5 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-xs sm:text-sm font-bold"
          >
            <span className="flex items-center gap-2.5">
              <Gamepad2 size={17} className="text-pink-300 shrink-0" />
              <span>Kuis Kebiasaan Harian</span>
            </span>
            <ArrowRight size={15} className="text-pink-300 shrink-0" />
          </Link>
        </div>
      </div>
    </section>
  )
}