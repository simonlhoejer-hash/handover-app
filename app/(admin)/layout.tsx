export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div
      className="
        min-h-screen
        bg-gray-100
        text-gray-900
        transition-colors duration-300

        dark:bg-[#0f1b2d]
        dark:text-white
      "
    >
      {children}
    </div>
  )
}