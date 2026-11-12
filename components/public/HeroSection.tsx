'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ClipboardList, BarChart2, Gamepad2 } from 'lucide-react'

export default function HeroSection({
  onLogoLoaded,
}: {
  onLogoLoaded?: (url: string) => void
}) {
  const supabase = createClient()
  const [title, setTitle] = useState('7 KEBIASAAN ANAK INDONESIA HEBAT')
  const [subtitle, setSubtitle] = useState(
    'Gerakan Karakter Unggul Siswa-Siswi SMAN 5 Semarang'
  )
  const [mediaUrl, setMediaUrl] = useState('')

  useEffect(() => {
    async function loadHeroConfig() {
      const { data } = await supabase
        .from('home_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        if (data.hero_title) setTitle(data.hero_title)
        if (data.hero_subtitle) setSubtitle(data.hero_subtitle)
        if (data.hero_media_url) {
          setMediaUrl(data.hero_media_url)
          if (onLogoLoaded) onLogoLoaded(data.hero_media_url)
        }
      }
    }
    loadHeroConfig()
  }, [])

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2e1065] via-[#3b0764] to-[#0f172a] text-white p-7 sm:p-10 shadow-lg">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-7 space-y-5">
          <div className="flex items-center gap-4">
            {mediaUrl && (
              <img
                src={mediaUrl}
                alt="Logo Nexara"
                className="h-20 w-20 sm:h-24 sm:w-24 rounded-2xl object-contain p-1.5 bg-slate-950/80 border border-white/15 shadow-xl shrink-0"
              />
            )}
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-bold tracking-wide text-indigo-100">
              7 KAIH • SMAN 5 Semarang
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-[1.1]">
            {title}
          </h1>

          <p className="text-sm sm:text-base text-indigo-200 max-w-xl leading-relaxed">
            {subtitle}
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/survey"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-indigo-500 hover:bg-indigo-400 text-white font-bold text-sm shadow-md transition-all"
            >
              <span>Isi Survey Sekarang</span>
              <ArrowRight size={16} />
            </Link>

            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold text-sm transition-all"
            >
              <span>Mainkan Kuis Game 🎮</span>
            </Link>
          </div>
        </div>

        <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-3xl p-5 sm:p-6 space-y-3">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-200 px-1">
            Navigasi Cepat Siswa
          </p>

          <Link
            href="/survey"
            className="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
          >
            <span className="flex items-center gap-3">
              <ClipboardList size={18} className="text-indigo-300" />
              <span>Yuk Survey! (Isi Evaluasi)</span>
            </span>
            <ArrowRight size={16} className="text-indigo-200" />
          </Link>

          <Link
            href="/statistik"
            className="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
          >
            <span className="flex items-center gap-3">
              <BarChart2 size={18} className="text-purple-300" />
              <span>Statistik Pribadi Saya</span>
            </span>
            <ArrowRight size={16} className="text-indigo-200" />
          </Link>

          <Link
            href="/game"
            className="flex items-center justify-between p-4 rounded-2xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
          >
            <span className="flex items-center gap-3">
              <Gamepad2 size={18} className="text-pink-300" />
              <span>Kuis Kebiasaan Harian</span>
            </span>
            <ArrowRight size={16} className="text-indigo-200" />
          </Link>
        </div>
      </div>
    </section>
  )
}