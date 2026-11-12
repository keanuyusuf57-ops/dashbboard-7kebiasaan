'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowRight, ClipboardList, BarChart2, Gamepad2 } from 'lucide-react'

export default function HeroSection({ onLogoLoaded }: { onLogoLoaded?: (url: string) => void }) {
  const supabase = createClient()
  const [config, setConfig] = useState({
    hero_title: '7 Kebiasaan Anak Indonesia Hebat',
    hero_subtitle: 'Gerakan Karakter Unggul Siswa-Siswi SMAN 5 Semarang',
    hero_media_url: '',
  })

  useEffect(() => {
    async function loadHomeConfig() {
      const { data } = await supabase
        .from('home_config')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .single()

      if (data) {
        setConfig({
          hero_title: data.hero_title || config.hero_title,
          hero_subtitle: data.hero_subtitle || config.hero_subtitle,
          hero_media_url: data.hero_media_url || '',
        })
        if (data.hero_media_url && onLogoLoaded) {
          onLogoLoaded(data.hero_media_url)
        }
      }
    }
    loadHomeConfig()
  }, [])

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white rounded-3xl p-8 md:p-10 shadow-xl border border-indigo-500/20">
      <div className="relative z-20 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Kiri: Judul & Tombol Utama */}
        <div className="lg:col-span-7 space-y-5">
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/15 text-indigo-200 text-xs font-semibold">
            {config.hero_media_url && (
              <img
                src={config.hero_media_url}
                alt="Nexara"
                className="w-5 h-5 rounded-full object-cover"
              />
            )}
            <span>7 KAIH • SMAN 5 Semarang</span>
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
            {config.hero_title}
          </h1>

          <p className="text-sm md:text-base text-indigo-100/85 leading-relaxed">
            {config.hero_subtitle}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/survey"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-sm px-6 py-3.5 rounded-2xl shadow-lg hover:opacity-95 transition-all cursor-pointer"
            >
              <span>Isi Survey Sekarang</span>
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/game"
              className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-sm px-6 py-3.5 rounded-2xl hover:bg-white/20 transition-all cursor-pointer"
            >
              <span>Mainkan Kuis Game 🎮</span>
            </Link>
          </div>
        </div>

        {/* Kanan: Panel Navigasi Cepat Siswa */}
        <div className="lg:col-span-5 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-5 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-indigo-200 px-1">
            Navigasi Cepat Siswa
          </p>
          <Link
            href="/survey"
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
          >
            <span className="flex items-center gap-2.5">
              <ClipboardList size={18} className="text-purple-300" />
              Yuk Survey! (Isi Evaluasi)
            </span>
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/statistik"
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
          >
            <span className="flex items-center gap-2.5">
              <BarChart2 size={18} className="text-blue-300" />
              Statistik Pribadi Saya
            </span>
            <ArrowRight size={15} />
          </Link>
          <Link
            href="/game"
            className="flex items-center justify-between p-3.5 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-sm font-bold"
          >
            <span className="flex items-center gap-2.5">
              <Gamepad2 size={18} className="text-emerald-300" />
              Kuis Kebiasaan Harian
            </span>
            <ArrowRight size={15} />
          </Link>
        </div>
      </div>
    </div>
  )
}