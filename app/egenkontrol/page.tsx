export default function EgenkontrolPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Egenkontrol</h2>

      <p className="text-sm text-gray-600 dark:text-gray-400">
        Oversigt over egenkontrolpunkter
      </p>

      <div className="space-y-2">
        <div className="p-3 rounded bg-white dark:bg-gray-800 shadow">
          🔲 Kølerum kontrolleret
        </div>

        <div className="p-3 rounded bg-white dark:bg-gray-800 shadow">
          🔲 Temperatur logget
        </div>

        <div className="p-3 rounded bg-white dark:bg-gray-800 shadow">
          🔲 Rengøring udført
        </div>
      </div>
    </div>
  )
}
