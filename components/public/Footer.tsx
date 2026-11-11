'use client'

import { useEffect, useState } from 'react'

export default function Footer() {
  const [year, setYear] = useState<number | null>(null)

  useEffect(() => {
    setYear(new Date().getFullYear())
  }, [])

  return (
    <footer className="bg-gray-900 text-gray-300 py-8 border-t border-gray-800">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <p className="text-sm font-semibold">
          &copy; {year ?? '2026'} SMAN 5 Semarang. Dashboard Penilaian 7 Kebiasaan Anak Indonesia Hebat.
        </p>
      </div>
    </footer>
  )
}