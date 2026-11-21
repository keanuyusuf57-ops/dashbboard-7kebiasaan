'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Calendar } from 'lucide-react'

type ActivityItem = {
  id: string
  judul: string
  kategori_kebiasaan: string
  deskripsi: string | null
  image_url: string
  tanggal_kegiatan: string
}

const DEFAULT_ACTIVITIES: ActivityItem[] = [
  {
    id: 'default-1',
    judul: 'Pembiasaan Literasi Pagi 15 Menit Sebelum KBM',
    kategori_kebiasaan: 'Gemar Membaca',
    deskripsi:
      'Siswa SMAN 5 Semarang membaca buku non-pelajaran secara serentak di ruang kelas dan perpustakaan sekolah.',
    image_url:
      'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80',
    tanggal_kegiatan: '2026-11-10',
  },
  {
    id: 'default-2',
    judul: 'Jumat Sehat & Senam Kebugaran Warga Sekolah',
    kategori_kebiasaan: 'Berolahraga',
    deskripsi:
      'Kegiatan olahraga bersama di lapangan SMAN 5 Semarang untuk menjaga kebugaran jasmani siswa dan guru.',
    image_url:
      'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=900&q=80',
    tanggal_kegiatan: '2026-11-14',
  },
  {
    id: 'default-3',
    judul: 'Aksi Peduli Lingkungan & Gotong Royong Kelas',
    kategori_kebiasaan: 'Bermasyarakat',
    deskripsi:
      'Kolaborasi antarsiswa menjaga kebersihan taman sekolah dan lingkungan kelas sebagai wujud karakter peduli sosial.',
    image_url:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=900&q=80',
    tanggal_kegiatan: '2026-11-18',
  },
]

export default function ActivityGallery() {
  const supabase = createClient()
  const [activities, setActivities] = useState<ActivityItem[]>(DEFAULT_ACTIVITIES)

  const fetchActivities = useCallback(async () => {
    const { data, error } = await supabase
      .from('school_activities')
      .select('*')
      .order('tanggal_kegiatan', { ascending: false })

    if (!error && data && data.length > 0) {
      setActivities(data as ActivityItem[])
    } else if (!error && data && data.length === 0) {
      setActivities(DEFAULT_ACTIVITIES)
    }
  }, [supabase])

  useEffect(() => {
    fetchActivities()

    const channel = supabase
      .channel('realtime-school-activities')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'school_activities' },
        () => fetchActivities()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchActivities, supabase])

  const formatTanggal = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    } catch {
      return dateStr
    }
  }

  return (
    <section className="kaih-glass-card p-6 sm:p-8 rounded-3xl space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200/80 pb-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-extrabold uppercase tracking-wider">
            <Camera size={13} />
            <span>Dokumentasi Nyata Sekolah</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-black text-[#090D16] tracking-tight">
            Galeri Kegiatan 7 KAIH SMAN 5 Semarang
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-700 max-w-md leading-relaxed">
          Implementasi langsung 7 Kebiasaan Anak Indonesia Hebat dalam budaya keseharian di SMAN 5
          Semarang.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {activities.map((item) => (
          <article
            key={item.id}
            className="rounded-3xl bg-white/95 border border-white shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
          >
            <div>
              <div className="relative h-52 bg-slate-100 overflow-hidden">
                <img
                  src={item.image_url}
                  alt={item.judul}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-lg bg-indigo-950/90 text-amber-300 text-[10px] font-black uppercase tracking-wider shadow-xs">
                  {item.kategori_kebiasaan}
                </span>
              </div>

              <div className="p-5 space-y-2">
                <h3 className="font-heading text-base sm:text-lg font-black text-[#090D16] leading-snug">
                  {item.judul}
                </h3>
                {item.deskripsi && (
                  <p className="text-xs text-slate-700 leading-relaxed line-clamp-3">
                    {item.deskripsi}
                  </p>
                )}
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-slate-500">
              <Calendar size={14} className="text-indigo-700 shrink-0" />
              <span>{formatTanggal(item.tanggal_kegiatan)}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}