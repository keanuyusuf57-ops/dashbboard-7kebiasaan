'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import * as XLSX from 'xlsx'

type ResponseItem = {
  id: string
  full_name: string
  student_number: number
  class_name: string
  submission_date: string
  answers: Record<string, number>
  created_at: string
}

export default function DatabaseSurveyPage() {
  const supabase = createClient()

  const [responses, setResponses] = useState<ResponseItem[]>([])
  const [questionsMap, setQuestionsMap] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  const [filterClass, setFilterClass] = useState('')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    async function fetchData() {
      const { data: qData } = await supabase.from('questions').select('id, question_text')
      if (qData) {
        const qMap: Record<string, string> = {}
        qData.forEach((q) => {
          qMap[q.id] = q.question_text
        })
        setQuestionsMap(qMap)
      }

      const { data: rData } = await supabase
        .from('survey_responses')
        .select('*')
        .order('created_at', { ascending: false })

      if (rData) setResponses(rData)
      setLoading(false)
    }
    fetchData()
  }, [])

  const filteredResponses = responses.filter((item) => {
    const matchClass = filterClass ? item.class_name === filterClass : true
    const matchDate = filterDate ? item.submission_date === filterDate : true
    return matchClass && matchDate
  })

  const formatDataForExport = () => {
    return filteredResponses.map((item, idx) => {
      const row: Record<string, any> = {
        No: idx + 1,
        'Nama Lengkap': item.full_name,
        'No Presensi': item.student_number,
        Kelas: item.class_name,
        'Tanggal Pengisian': item.submission_date,
      }

      Object.entries(questionsMap).forEach(([qId, qText], qIdx) => {
        row[`P${qIdx + 1}: ${qText}`] = item.answers[qId] || '-'
      })

      return row
    })
  }

  const exportToExcel = () => {
    const data = formatDataForExport()
    const worksheet = XLSX.utils.json_to_sheet(data)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Survey')
    XLSX.writeFile(workbook, `Hasil_Survey_7Kebiasaan_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const exportToCSV = () => {
    const data = formatDataForExport()
    const worksheet = XLSX.utils.json_to_sheet(data)
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet)
    
    const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Hasil_Survey_7Kebiasaan_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const generateClassOptions = () => {
    const classes: string[] = []
    ;['X', 'XI', 'XII'].forEach((level) => {
      for (let i = 1; i <= 12; i++) {
        classes.push(`${level}.${i}`)
      }
    })
    return classes
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Database Hasil Survey</h1>
          <p className="text-sm font-semibold text-gray-700">
            Total {filteredResponses.length} responden terfilter.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportToExcel}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition-all"
          >
            Eksport (.XLSX)
          </button>
          <button
            onClick={exportToCSV}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow transition-all"
          >
            Eksport (.CSV)
          </button>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
            Filter Menurut Kelas
          </label>
          <select
            value={filterClass}
            onChange={(e) => setFilterClass(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm font-medium bg-white"
          >
            <option value="">Semua Kelas</option>
            {generateClassOptions().map((cls) => (
              <option key={cls} value={cls}>
                Kelas {cls}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-900 uppercase tracking-wider mb-1">
            Filter Menurut Tanggal
          </label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-900 text-sm font-medium bg-white"
          />
        </div>

        {(filterClass || filterDate) && (
          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterClass('')
                setFilterDate('')
              }}
              className="px-4 py-2 text-sm text-red-600 font-bold hover:underline"
            >
              Reset Filter
            </button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto shadow-sm">
        {loading ? (
          <p className="p-6 text-gray-900 font-semibold text-sm">Memuat data survey...</p>
        ) : filteredResponses.length === 0 ? (
          <p className="p-6 text-gray-900 font-semibold text-sm">Tidak ada data survey yang cocok.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-100 text-gray-900 border-b border-gray-200 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Lengkap</th>
                <th className="px-4 py-3">No Presensi</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Tanggal</th>
                <th className="px-4 py-3">Jumlah Jawaban</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-gray-900 font-semibold">
              {filteredResponses.map((item, idx) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">{idx + 1}</td>
                  <td className="px-4 py-3 font-bold">{item.full_name}</td>
                  <td className="px-4 py-3">{item.student_number}</td>
                  <td className="px-4 py-3">{item.class_name}</td>
                  <td className="px-4 py-3">{item.submission_date}</td>
                  <td className="px-4 py-3">
                    {Object.keys(item.answers || {}).length} Soal Terisi
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}