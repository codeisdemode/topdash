"use client"

export default function TestPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-orange-500 text-2xl font-bold mb-4">TOPDASH TEST</h1>
        <p className="text-neutral-400">Test page is working!</p>
        <div className="mt-8 space-y-2">
          <div className="text-sm text-neutral-500">Backend Status: Testing...</div>
          <div className="text-sm text-neutral-500">Database: Testing...</div>
        </div>
      </div>
    </div>
  )
}