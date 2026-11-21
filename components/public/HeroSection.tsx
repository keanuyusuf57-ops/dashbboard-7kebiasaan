'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ClipboardList,
  Gamepad2,
  PieChart,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react'

type HomeConfig = {
  hero_title: string
  hero_subtitle: string
  logo_url: string | null
  poster_url: string | null
  hero_media_url: string | null
}

function getBerandaTitle(raw?: string | null): string {
  const clean = (raw || '').trim()
  if (!clean || clean.toLowerCase() === 'nexara') {
    return 'Dashboard 7KAIH'
  }
  return clean
}

export default function HeroSection() {
  const supabase = createClient()

  const [config, setConfig] = useState<HomeConfig>({
    hero_title: 'Dashboard 7KAIH',
    hero_subtitle: '7 Kebiasaan Anak Indonesia Hebat • SMAN 5 Semarang',
    logo_url: null,
    poster_url: null,
    hero_media_url: null,
  })

  const fetchHeroConfig = useCallback(async () => {
    const { data, error } = await supabase
      .from('home_config')
      .select('hero_title, hero_subtitle, logo_url, poster_url, hero_media_url')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!error && data) {
      setConfig({
        hero_title: getBerandaTitle(data.hero_title),
        hero_subtitle:
          data.hero_subtitle && data.hero_subtitle.toLowerCase() !== 'nexara'
            ? data.hero_subtitle
            : '7 Kebiasaan Anak Indonesia Hebat • SMAN 5 Semarang',
        logo_url: data.logo_url || null,
        poster_url: data.poster_url || null,
        hero_media_url: data.hero_media_url || null,
      })
    }
  }, [supabase])

  useEffect(() => {
    fetchHeroConfig()

    const channel = supabase
      .channel('realtime-hero-section-config')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'home_config' },
        () => fetchHeroConfig()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchHeroConfig, supabase])

  const watermarkLogo = config.logo_url || config.hero_media_url
  const showSeparatePosterCard = Boolean(config.poster_url)

  return (
    <div className="space-y-5">
      {/* Animasi scroll vertikal halus 0.5x (atas -> bawah -> atas) */}
      <style jsx>{`
        @keyframes smalaVerticalPan {
          0% {
            background-position: 50% 0%;
          }
          50% {
            background-position: 50% 100%;
          }
          100% {
            background-position: 50% 0%;
          }
        }
        .smala-bg-pan {
          animation: smalaVerticalPan 28s ease-in-out infinite;
        }
      `}</style>

      {/* === HERO BANNER UTAMA DENGAN LOGO SMALA PENUH UJUNG KE UJUNG === */}
      <section className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-950 via-blue-950 to-slate-900 text-white p-7 sm:p-10 lg:p-12 shadow-xl">
        {/* Layer Logo SMALA Full Lebar Banner & Bergulir Vertikal Pelan */}
        {watermarkLogo && (
          <div
            aria-hidden="true"
            className="smala-bg-pan pointer-events-none select-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage: `url("${watermarkLogo}")`,
              backgroundSize: '100% auto',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '50% 0%',
            }}
          />
        )}

        {/* Lapisan gradasi tipis agar teks tetap tajam dan mudah dibaca */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-indigo-950/85 via-blue-950/65 to-indigo-950/45"
        />

        {/* Konten Utama Beranda */}
        <div className="relative z-10 max-w-2xl space-y-4">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-amber-300">
            SMAN 5 Semarang
          </p>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {config.hero_title}
          </h1>

          <p className="text-sm sm:text-base text-indigo-100/95 leading-relaxed">
            {config.hero_subtitle}
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              href="/survey"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs sm:text-sm font-extrabold shadow-md transition-all"
            >
              <ClipboardList size={16} />
              <span>Isi Survei</span>
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/statistik"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold backdrop-blur-xs transition-all"
            >
              <PieChart size={16} className="text-sky-300" />
              <span>Statistik Saya</span>
            </Link>

            <Link
              href="/game"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-xs sm:text-sm font-bold backdrop-blur-xs transition-all"
            >
              <Gamepad2 size={16} className="text-amber-300" />
              <span>Kuis XP</span>
            </Link>
          </div>
        </div>
      </section>

      {/* === KARTU POSTER INFOGRAFIS 7 KAIH === */}
      {showSeparatePosterCard && config.poster_url && (
        <section className="kaih-glass-card p-5 sm:p-6 rounded-3xl space-y-3">
          <div className="flex items-center">
            <div className="inline-flex items-center gap-2 text-indigo-950 text-xs font-extrabold uppercase tracking-wider">
              <ImageIcon size={14} className="text-indigo-700" />
              <span>Infografis 7 KAIH</span>
            </div>
          </div>

          <div className="rounded-2xl overflow-hidden">
            <img
              src={config.poster_url}
              alt="Poster Infografis 7 Kebiasaan Anak Indonesia Hebat"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
              className="w-full max-h-[520px] object-contain mx-auto bg-transparent"
            />
          </div>
        </section>
      )}
    </div>
  )
}