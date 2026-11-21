'use client'

import { useState, useEffect, useCallback, useMemo, Fragment } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  Database,
  Search,
  Filter,
  Download,
  Trash2,
  Users,
  RefreshCw,
  FolderOpen,
  Calendar,
  XCircle,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Layers,
  List,
} from 'lucide-react'

const ALL_ORDERED_CLASSES = [
  ...Array.from({ length: 12 }, (_, i) => `X-${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `XI-${i + 1}`),
  ...Array.from({ length: 12 }, (_, i) => `XII-${i + 1}`),
]

const TOTAL_ABSEN_PER_KELAS = 36

function normalizeClassName(raw: string): string {
  return (raw || '')
    .replace(/^kelas\s+/i, '')
    .replace(/\./g, '-')
    .trim()
    .toUpperCase()
}

function normalizeStudentName(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sortClassNaturally(a: string, b: string): number {
  const rank: Record<string, number> = { X: 1, XI: 2, XII: 3 }
  const [gradeA, numA] = a.split('-')
  const [gradeB, numB] = b.split('-')
  const rA = rank[gradeA] || 99
  const rB = rank[gradeB] || 99
  if (rA !== rB) return rA - rB
  return (Number(numA) || 0) - (Number(numB) || 0)
}

function getRowAverage(row: any): number {
  const dbAvg = Number(row?.rata_rata)
  if (!isNaN(dbAvg) && dbAvg > 0) return Number(dbAvg.toFixed(2))

  const scores = Array.isArray(row?.answers_json)
    ? row.answers_json
    : [row?.q1, row?.q2, row?.q3, row?.q4, row?.q5, row?.q6, row?.q7, row?.q8, row?.q9, row?.q10]
  const valid = scores.map(Number).filter((v: number) => v >= 1 && v <= 4)
  if (valid.length === 0) return 0
  return Number((valid.reduce((a: number, b: number) => a + b, 0) / valid.length).toFixed(2))
}

type MergedStudent = {
  key: string
  no_absen: number | null
  nama: string
  kelas: string
  email: string
  fillCount: number
  combinedAverage: number
  lastSubmittedAt: string | null
  submissions: any[]
}

export default function AdminDatabasePage() {
  const supabase = createClient()

  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedClass, setSelectedClass] = useState<string>('ALL')
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'MERGED' | 'RAW'>('MERGED')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'FILLED' | 'UNFILLED'>('ALL')
  const [expandedStudentKey, setExpandedStudentKey] = useState<string | null>(null)

  // === PAGINASI LOOP >1.000 BARIS AGAR SELURUH DATA TAMPIL & TEREKSPOR PENUH ===
  const fetchResponses = useCallback(async () => {
    setLoading(true)
    let allRows: any[] = []
    let from = 0
    const pageSize = 1000

    while (true) {
      const { data, error } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, from + pageSize - 1)

      if (error || !data || data.length === 0) break
      allRows = allRows.concat(data)
      if (data.length < pageSize) break
      from += pageSize
    }

    setRows(allRows)
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    fetchResponses()

    const channel = supabase
      .channel('realtime-admin-database-page')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'survey_responses' },
        () => fetchResponses()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchResponses, supabase])

  const availableClasses = useMemo(
    () =>
      Array.from(
        new Set([
          ...ALL_ORDERED_CLASSES,
          ...rows.map((r) => normalizeClassName(r.kelas)).filter(Boolean),
        ])
      ).sort(sortClassNaturally),
    [rows]
  )

  const dateFilteredRows = useMemo(() => {
    if (!selectedDate) return rows
    return rows.filter((r) => {
      const rowDate = new Date(r.created_at).toISOString().slice(0, 10)
      return rowDate === selectedDate
    })
  }, [rows, selectedDate])

  // === PENGGABUNGAN CERDAS PER SISWA (TERKUNCI MAKSIMAL 36 SLOT ABSEN PER KELAS) ===
  const allMergedStudents = useMemo(() => {
    const emailToAbsen = new Map<string, number>()
    const nameToAbsen = new Map<string, number>()
    const prefixToAbsen = new Map<string, number>()

    // 1. Peta referensi dari baris yang sudah memiliki nomor absen valid (1..36)
    dateFilteredRows.forEach((r) => {
      const cls = normalizeClassName(r.kelas)
      const absenNum = Number(r.no_absen)
      if (!cls || isNaN(absenNum) || absenNum < 1 || absenNum > TOTAL_ABSEN_PER_KELAS) return

      const cleanEmail = (r.email || '').trim().toLowerCase()
      const cleanNameNorm = normalizeStudentName(r.nama)
      const prefix = cleanNameNorm.split(' ').slice(0, 2).join(' ')

      if (cleanEmail) emailToAbsen.set(`${cls}::${cleanEmail}`, absenNum)
      if (cleanNameNorm.length >= 3) nameToAbsen.set(`${cls}::${cleanNameNorm}`, absenNum)
      if (prefix.length >= 5 && !prefixToAbsen.has(`${cls}::${prefix}`)) {
        prefixToAbsen.set(`${cls}::${prefix}`, absenNum)
      }
    })

    // 2. Catat slot absen 1..36 yang sudah terpakai per kelas
    const usedAbsenByClass = new Map<string, Set<number>>()
    dateFilteredRows.forEach((r) => {
      const cls = normalizeClassName(r.kelas)
      const absenNum = Number(r.no_absen)
      if (cls && absenNum >= 1 && absenNum <= TOTAL_ABSEN_PER_KELAS) {
        if (!usedAbsenByClass.has(cls)) usedAbsenByClass.set(cls, new Set())
        usedAbsenByClass.get(cls)!.add(absenNum)
      }
    })

    const orphanKeyToSlot = new Map<string, number>()
    const grouped = new Map<string, MergedStudent>()

    dateFilteredRows.forEach((r) => {
      const cls = normalizeClassName(r.kelas) || 'TANPA-KELAS'
      const cleanEmail = (r.email || '').trim().toLowerCase()
      const cleanName = (r.nama || 'Tanpa Nama').trim()
      const cleanNameNorm = normalizeStudentName(cleanName)
      const prefix = cleanNameNorm.split(' ').slice(0, 2).join(' ')

      let absenNum = Number(r.no_absen)
      if (isNaN(absenNum) || absenNum < 1 || absenNum > TOTAL_ABSEN_PER_KELAS) {
        absenNum =
          emailToAbsen.get(`${cls}::${cleanEmail}`) ??
          nameToAbsen.get(`${cls}::${cleanNameNorm}`) ??
          prefixToAbsen.get(`${cls}::${prefix}`) ??
          0
      }

      // Alokasikan entri no_absen = 0 yang belum cocok ke slot kosong 1..36 di kelasnya
      if (absenNum === 0 && cls !== 'TANPA-KELAS') {
        const orphanId = `${cls}::${cleanNameNorm || cleanEmail || r.id}`
        if (orphanKeyToSlot.has(orphanId)) {
          absenNum = orphanKeyToSlot.get(orphanId)!
        } else {
          const used = usedAbsenByClass.get(cls) || new Set<number>()
          for (let slot = 1; slot <= TOTAL_ABSEN_PER_KELAS; slot++) {
            if (!used.has(slot)) {
              absenNum = slot
              used.add(slot)
              usedAbsenByClass.set(cls, used)
              orphanKeyToSlot.set(orphanId, slot)
              break
            }
          }
        }
      }

      const hasValidAbsen = absenNum >= 1 && absenNum <= TOTAL_ABSEN_PER_KELAS
      const key = hasValidAbsen
        ? `${cls}::ABSEN-${absenNum}`
        : `${cls}::ABSEN-${TOTAL_ABSEN_PER_KELAS}`

      const rowAvg = getRowAverage(r)

      if (!grouped.has(key)) {
        grouped.set(key, {
          key,
          no_absen: hasValidAbsen ? absenNum : TOTAL_ABSEN_PER_KELAS,
          nama: cleanName,
          kelas: cls,
          email: r.email || '-',
          fillCount: 1,
          combinedAverage: rowAvg,
          lastSubmittedAt: r.created_at,
          submissions: [r],
        })
      } else {
        const existing = grouped.get(key)!
        existing.submissions.push(r)
        existing.fillCount = existing.submissions.length

        if (cleanName.length > existing.nama.length && !cleanName.includes('@')) {
          existing.nama = cleanName
        }
        if ((!existing.email || existing.email === '-') && r.email) {
          existing.email = r.email
        }

        const validAvgs = existing.submissions
          .map((item) => getRowAverage(item))
          .filter((v) => v > 0)
        existing.combinedAverage =
          validAvgs.length > 0
            ? Number((validAvgs.reduce((a, b) => a + b, 0) / validAvgs.length).toFixed(2))
            : 0

        if (
          r.created_at &&
          (!existing.lastSubmittedAt ||
            new Date(r.created_at).getTime() > new Date(existing.lastSubmittedAt).getTime())
        ) {
          existing.lastSubmittedAt = r.created_at
        }
      }
    })

    return grouped
  }, [dateFilteredRows])

  // Hitungan siswa unik per kelas (terkunci maksimal 36/36)
  const uniqueFilledCountByClass = useMemo(() => {
    const counts: Record<string, number> = {}
    allMergedStudents.forEach((student) => {
      if (student.fillCount > 0) {
        counts[student.kelas] = Math.min(
          TOTAL_ABSEN_PER_KELAS,
          (counts[student.kelas] || 0) + 1
        )
      }
    })
    return counts
  }, [allMergedStudents])

  const mergedStudents = useMemo(() => {
    const filteredList = Array.from(allMergedStudents.values()).filter((s) =>
      selectedClass === 'ALL' ? true : s.kelas === selectedClass
    )

    const grouped = new Map<string, MergedStudent>()
    filteredList.forEach((s) => grouped.set(s.key, s))

    if (selectedClass !== 'ALL') {
      for (let absen = 1; absen <= TOTAL_ABSEN_PER_KELAS; absen++) {
        const slotKey = `${selectedClass}::ABSEN-${absen}`
        if (!grouped.has(slotKey)) {
          grouped.set(slotKey, {
            key: slotKey,
            no_absen: absen,
            nama: `Siswa Absen ${absen} (Belum Mengisi)`,
            kelas: selectedClass,
            email: '-',
            fillCount: 0,
            combinedAverage: 0,
            lastSubmittedAt: null,
            submissions: [],
          })
        }
      }
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const clsCmp = sortClassNaturally(a.kelas, b.kelas)
      if (clsCmp !== 0) return clsCmp
      return (a.no_absen ?? 999) - (b.no_absen ?? 999)
    })
  }, [allMergedStudents, selectedClass])

  const classSummaryStats = useMemo(() => {
    const filled = mergedStudents.filter((s) => s.fillCount > 0).length
    const unfilled = mergedStudents.filter((s) => s.fillCount === 0).length
    return { total: mergedStudents.length, filled, unfilled }
  }, [mergedStudents])

  const filteredMergedStudents = useMemo(() => {
    return mergedStudents.filter((s) => {
      if (statusFilter === 'FILLED' && s.fillCount === 0) return false
      if (statusFilter === 'UNFILLED' && s.fillCount > 0) return false

      if (!searchTerm.trim()) return true
      const q = searchTerm.toLowerCase()
      return (
        s.nama.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        String(s.no_absen || '').includes(q) ||
        s.kelas.toLowerCase().includes(q)
      )
    })
  }, [mergedStudents, statusFilter, searchTerm])

  const filteredRawRows = useMemo(() => {
    return dateFilteredRows
      .filter((r) => {
        const rowClass = normalizeClassName(r.kelas)
        if (selectedClass !== 'ALL' && rowClass !== selectedClass) return false
        if (!searchTerm.trim()) return true
        const q = searchTerm.toLowerCase()
        return (
          (r.nama || '').toLowerCase().includes(q) ||
          (r.email || '').toLowerCase().includes(q) ||
          String(r.no_absen || '').includes(q) ||
          rowClass.toLowerCase().includes(q)
        )
      })
      .sort((a, b) => {
        const clsCmp = sortClassNaturally(
          normalizeClassName(a.kelas),
          normalizeClassName(b.kelas)
        )
        if (clsCmp !== 0) return clsCmp
        return (Number(a.no_absen) || 999) - (Number(b.no_absen) || 999)
      })
  }, [dateFilteredRows, selectedClass, searchTerm])

  const handleDeleteRow = async (id: string, nama: string) => {
    if (!confirm(`Hapus 1 entri survei milik "${nama}"?`)) return
    await supabase.from('survey_responses').delete().eq('id', id)
    fetchResponses()
  }

  const handleExportCSV = () => {
    if (viewMode === 'MERGED') {
      const headers = [
        'No Absen',
        'Nama Siswa',
        'Kelas',
        'Email',
        'Status Pengisian',
        'Jumlah Mengisi (Kali)',
        'Rata-Rata Gabungan (Skala 4.0)',
        'Terakhir Mengisi',
      ]
      const csvRows = filteredMergedStudents.map((s) => [
        s.no_absen || '-',
        `"${s.nama.replace(/"/g, '""')}"`,
        s.kelas,
        s.email,
        s.fillCount > 0 ? `Sudah Mengisi ${s.fillCount}x` : 'Belum Mengisi',
        s.fillCount,
        s.fillCount > 0 ? s.combinedAverage.toFixed(2) : '0.00',
        s.lastSubmittedAt
          ? `"${new Date(s.lastSubmittedAt).toLocaleString('id-ID')}"`
          : '"-"',
      ])
      const csvContent =
        '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `rekap-siswa-${selectedClass}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      return
    }

    const headers = ['No Absen', 'Nama', 'Kelas', 'Email', 'Rata-Rata (Skala 4.0)', 'Waktu Isi']
    const csvRows = filteredRawRows.map((r) => [
      r.no_absen || '-',
      `"${(r.nama || '').replace(/"/g, '""')}"`,
      normalizeClassName(r.kelas) || '-',
      r.email || '-',
      getRowAverage(r).toFixed(2),
      `"${new Date(r.created_at).toLocaleString('id-ID')}"`,
    ])
    const csvContent =
      '\uFEFF' + [headers.join(','), ...csvRows.map((e) => e.join(','))].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `log-survey-${selectedClass}-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5 font-sans text-[#090D16]">
      {/* Banner Header */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-indigo-800 to-sky-700 text-white p-6 sm:p-7 shadow-xl border border-indigo-400/20 flex flex-wrap items-center justify-between gap-4 relative overflow-hidden">
        <Sparkles
          size={130}
          className="absolute -right-6 -bottom-6 text-white/[0.07] pointer-events-none"
        />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[11px] font-extrabold text-sky-200 mb-2">
            <Database size={12} />
            <span>REKAPITULASI &amp; FREKUENSI MENGISI • SMAN 5 SEMARANG</span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-black text-white">
            Database Hasil Survey 7 KAIH
          </h1>
          <p className="text-xs sm:text-sm text-indigo-100 font-medium mt-1">
            Terpantau{' '}
            <strong className="text-white">
              {classSummaryStats.filled.toLocaleString('id-ID')} siswa
            </strong>{' '}
            sudah mengisi dari{' '}
            <strong className="text-sky-200">
              {rows.length.toLocaleString('id-ID')} total rekapan
            </strong>{' '}
            masuk.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 relative z-10">
          <button
            type="button"
            onClick={fetchResponses}
            className="px-4 py-2.5 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={
              viewMode === 'MERGED'
                ? filteredMergedStudents.length === 0
                : filteredRawRows.length === 0
            }
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-1.5 cursor-pointer shadow-md transition-all"
          >
            <Download size={14} />
            <span>Eksport Excel (.CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Kelas Urut, Tanggal Opsional & Pencarian */}
      <div className="kaih-glass-card p-5 rounded-3xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Filter Menurut Kelas */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-extrabold uppercase text-[#090D16] mb-1.5">
              Filter Menurut Kelas
            </label>
            <div className="relative">
              <Filter
                size={15}
                className="text-indigo-700 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <select
                value={selectedClass}
                onChange={(e) => {
                  setSelectedClass(e.target.value)
                  setStatusFilter('ALL')
                  setExpandedStudentKey(null)
                }}
                className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-300 bg-white/95 text-sm font-bold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="ALL">
                  Semua Kelas ({rows.length.toLocaleString('id-ID')} Rekapan)
                </option>
                <optgroup label="Kelas X">
                  {availableClasses
                    .filter((c) => c.startsWith('X-'))
                    .map((c) => (
                      <option key={c} value={c}>
                        Kelas {c} ({uniqueFilledCountByClass[c] || 0}/{TOTAL_ABSEN_PER_KELAS} Siswa)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Kelas XI">
                  {availableClasses
                    .filter((c) => c.startsWith('XI-'))
                    .map((c) => (
                      <option key={c} value={c}>
                        Kelas {c} ({uniqueFilledCountByClass[c] || 0}/{TOTAL_ABSEN_PER_KELAS} Siswa)
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Kelas XII">
                  {availableClasses
                    .filter((c) => c.startsWith('XII-'))
                    .map((c) => (
                      <option key={c} value={c}>
                        Kelas {c} ({uniqueFilledCountByClass[c] || 0}/{TOTAL_ABSEN_PER_KELAS} Siswa)
                      </option>
                    ))}
                </optgroup>
              </select>
            </div>
          </div>

          {/* Filter Menurut Tanggal (Opsional) */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-extrabold uppercase text-[#090D16] mb-1.5">
              Filter Tanggal (Opsional)
            </label>
            <div className="relative">
              <Calendar
                size={15}
                className="text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2"
              />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-2xl border border-slate-300 bg-white/95 text-sm font-bold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          {/* Pencarian Nama / Absen */}
          <div className="md:col-span-5">
            <label className="block text-[11px] font-extrabold uppercase text-[#090D16] mb-1.5">
              Cari Nama / Absen Siswa
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search
                  size={15}
                  className="text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2"
                />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Ketik nama siswa atau absen..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-slate-300 bg-white/95 text-sm font-bold text-[#090D16] focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              {(selectedClass !== 'ALL' || selectedDate || searchTerm || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedClass('ALL')
                    setSelectedDate('')
                    setSearchTerm('')
                    setStatusFilter('ALL')
                    setExpandedStudentKey(null)
                  }}
                  className="px-3.5 py-2.5 rounded-2xl bg-rose-100 hover:bg-rose-200 text-rose-800 text-xs font-extrabold flex items-center gap-1 shrink-0 cursor-pointer"
                >
                  <XCircle size={14} />
                  <span>Reset</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Pintasan Cepat Kelas */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-[11px] font-extrabold text-slate-800 shrink-0 flex items-center gap-1">
            <FolderOpen size={13} className="text-indigo-700" /> Pilih Kelas:
          </span>
          <button
            type="button"
            onClick={() => {
              setSelectedClass('ALL')
              setStatusFilter('ALL')
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 cursor-pointer transition-all ${
              selectedClass === 'ALL'
                ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xs'
                : 'bg-white/90 border border-white text-[#090D16] hover:bg-white'
            }`}
          >
            Semua ({rows.length.toLocaleString('id-ID')})
          </button>
          {availableClasses.map((cls) => {
            const filledCount = uniqueFilledCountByClass[cls] || 0
            const active = selectedClass === cls
            return (
              <button
                key={cls}
                type="button"
                onClick={() => {
                  setSelectedClass(cls)
                  setStatusFilter('ALL')
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-indigo-600 to-sky-600 text-white shadow-xs'
                    : filledCount > 0
                    ? 'bg-indigo-100/90 text-indigo-900 hover:bg-indigo-200/80'
                    : 'bg-white/75 text-slate-700 hover:bg-white'
                }`}
              >
                {cls} ({filledCount}/{TOTAL_ABSEN_PER_KELAS})
              </button>
            )
          })}
        </div>
      </div>

      {/* Bar Kontrol Mode Tampilan & Status Pengisian */}
      <div className="kaih-glass-card p-4 rounded-3xl flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 bg-slate-200/70 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setViewMode('MERGED')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'MERGED'
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <Layers size={14} />
            <span>Rekap Per Siswa (Gabungan)</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode('RAW')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
              viewMode === 'RAW'
                ? 'bg-indigo-950 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-950'
            }`}
          >
            <List size={14} />
            <span>Semua Log Kiriman ({filteredRawRows.length})</span>
          </button>
        </div>

        {viewMode === 'MERGED' && selectedClass !== 'ALL' && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'ALL'
                  ? 'bg-slate-900 text-white'
                  : 'bg-white/80 text-slate-700 hover:bg-white'
              }`}
            >
              Semua Absen ({classSummaryStats.total})
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('FILLED')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'FILLED'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Sudah Mengisi ({classSummaryStats.filled})</span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('UNFILLED')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer transition-all ${
                statusFilter === 'UNFILLED'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
              }`}
            >
              <Clock size={13} />
              <span>Belum Mengisi ({classSummaryStats.unfilled})</span>
            </button>
          </div>
        )}
      </div>

      {/* Tabel Daftar Siswa */}
      <div className="kaih-glass-card rounded-3xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-300/60 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-700" />
            <h2 className="font-heading text-sm sm:text-base font-extrabold text-[#090D16]">
              {viewMode === 'MERGED'
                ? selectedClass === 'ALL'
                  ? `Rekap Gabungan Per Siswa (${filteredMergedStudents.length.toLocaleString('id-ID')} Siswa)`
                  : `Pemantauan Absen 1–${classSummaryStats.total} Kelas ${selectedClass}`
                : `Log Pengisian Survei (${filteredRawRows.length.toLocaleString('id-ID')} Entri)`}
            </h2>
          </div>
          <span className="text-[11px] font-extrabold text-slate-800">
            Urut Kelas &amp; No. Absen
          </span>
        </div>

        {loading ? (
          <div className="p-10 text-center text-sm font-bold text-slate-800 animate-pulse">
            Memuat dan menggabungkan data survei siswa...
          </div>
        ) : viewMode === 'MERGED' ? (
          filteredMergedStudents.length === 0 ? (
            <div className="p-10 text-center text-sm font-bold text-slate-800">
              Tidak ada data siswa yang cocok dengan filter saat ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-indigo-950/5 border-b border-slate-300/70 text-[11px] font-extrabold uppercase text-[#090D16]">
                    <th className="py-3.5 px-4">Absen</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Kelas</th>
                    <th className="py-3.5 px-4">Frekuensi Mengisi</th>
                    <th className="py-3.5 px-4">Rata-Rata Gabungan</th>
                    <th className="py-3.5 px-4">Terakhir Mengisi</th>
                    <th className="py-3.5 px-4 text-right">Detail</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm bg-white/85">
                  {filteredMergedStudents.map((student) => {
                    const isFilled = student.fillCount > 0
                    const isExpanded = expandedStudentKey === student.key

                    return (
                      <Fragment key={student.key}>
                        <tr
                          className={`transition-colors ${
                            isFilled
                              ? 'hover:bg-indigo-50/75'
                              : 'bg-rose-50/40 hover:bg-rose-50/75 text-slate-600'
                          }`}
                        >
                          <td className="py-3.5 px-4 font-black text-[#090D16]">
                            {student.no_absen ?? '-'}
                          </td>

                          <td className="py-3.5 px-4">
                            <p
                              className={`font-extrabold ${
                                isFilled ? 'text-[#090D16]' : 'text-rose-800 italic'
                              }`}
                            >
                              {student.nama}
                            </p>
                            {isFilled && student.email !== '-' && (
                              <p className="text-[11px] text-slate-500 font-medium">
                                {student.email}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 text-xs font-extrabold">
                              {student.kelas}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            {student.fillCount === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-extrabold">
                                <Clock size={12} />
                                <span>Belum Mengisi (0x)</span>
                              </span>
                            ) : student.fillCount >= 3 ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black">
                                <CheckCircle2 size={13} />
                                <span>Rajin • Telah Mengisi {student.fillCount}x</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-sky-100 text-sky-900 text-xs font-extrabold">
                                <CheckCircle2 size={13} />
                                <span>Telah Mengisi {student.fillCount}x</span>
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            {isFilled ? (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs">
                                {student.combinedAverage.toFixed(2)} / 4.0
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-slate-400">-</span>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-slate-800 font-medium text-xs">
                            {student.lastSubmittedAt
                              ? new Date(student.lastSubmittedAt).toLocaleString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            {isFilled ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedStudentKey(isExpanded ? null : student.key)
                                }
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-100 hover:bg-indigo-200 text-indigo-900 text-xs font-extrabold cursor-pointer transition-all"
                              >
                                <span>Riwayat ({student.fillCount}x)</span>
                                {isExpanded ? (
                                  <ChevronUp size={14} />
                                ) : (
                                  <ChevronDown size={14} />
                                )}
                              </button>
                            ) : (
                              <span className="text-[11px] font-bold text-slate-400">
                                Kosong
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Baris Rincian Riwayat Pengisian Siswa */}
                        {isFilled && isExpanded && (
                          <tr className="bg-indigo-50/60">
                            <td colSpan={7} className="px-6 py-4">
                              <div className="rounded-2xl bg-white border border-indigo-200/80 p-4 space-y-2.5 shadow-2xs">
                                <p className="text-xs font-black text-indigo-950">
                                  Rincian {student.fillCount} Kali Pengisian — {student.nama} (
                                  {student.kelas} • Absen {student.no_absen ?? '-'})
                                </p>

                                <div className="divide-y divide-slate-100">
                                  {student.submissions.map((sub, idx) => (
                                    <div
                                      key={sub.id}
                                      className="py-2 flex flex-wrap items-center justify-between gap-2 text-xs"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-900 font-black">
                                          Pengisian #{student.submissions.length - idx}
                                        </span>
                                        <span className="font-bold text-slate-700">
                                          {new Date(sub.created_at).toLocaleString('id-ID', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                          })}
                                        </span>
                                        <span className="text-slate-500">({sub.email})</span>
                                      </div>

                                      <div className="flex items-center gap-3">
                                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-900 font-black">
                                          Skor: {getRowAverage(sub).toFixed(2)} / 4.0
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteRow(sub.id, sub.nama)}
                                          className="p-1.5 rounded-lg text-rose-700 hover:bg-rose-100 cursor-pointer"
                                          title="Hapus pengisian ini"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )
        ) : (
          /* Mode Log Mentah (Semua Kiriman Terpisah) */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-indigo-950/5 border-b border-slate-300/70 text-[11px] font-extrabold uppercase text-[#090D16]">
                  <th className="py-3.5 px-4">Absen</th>
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Rata-Rata</th>
                  <th className="py-3.5 px-4">Waktu Kirim</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 text-xs sm:text-sm bg-white/85">
                {filteredRawRows.map((r) => {
                  const avg = getRowAverage(r)
                  return (
                    <tr key={r.id} className="hover:bg-indigo-50/75 transition-colors">
                      <td className="py-3.5 px-4 font-black text-[#090D16]">
                        {r.no_absen || '-'}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-[#090D16]">{r.nama}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-indigo-100 text-indigo-900 text-xs font-extrabold">
                          {normalizeClassName(r.kelas)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium text-xs">
                        {r.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-black text-xs">
                          {avg.toFixed(2)} / 4.0
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-medium text-xs">
                        {new Date(r.created_at).toLocaleString('id-ID', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(r.id, r.nama)}
                          className="p-2 rounded-lg text-rose-700 hover:bg-rose-100 cursor-pointer"
                          title="Hapus baris"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}