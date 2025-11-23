export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8">Multilingual Meeting Platform</h1>
        <p className="text-lg mb-4">Welcome to the platform</p>
        <div className="flex gap-4">
          <a href="/admin/dashboard" className="px-4 py-2 bg-blue-500 text-white rounded">
            Admin Dashboard
          </a>
          <a href="/meeting/join" className="px-4 py-2 bg-green-500 text-white rounded">
            Join Meeting
          </a>
        </div>
      </div>
    </main>
  )
}

