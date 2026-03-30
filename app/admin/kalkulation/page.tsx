import Link from "next/link"

export default function KalkulationPage() {
  return (
    <div>

      <h1>Kalkulation</h1>

      <Link href="/admin/kalkulation/ny">
        <button>+ Ny kalkulation</button>
      </Link>

      <table>
        <thead>
          <tr>
            <th>Ret</th>
            <th>Food cost</th>
          </tr>
        </thead>

        <tbody>
          <tr>
            <td>
              <Link href="/kalkulation/1">
                Beef rillette
              </Link>
            </td>
            <td>22%</td>
          </tr>
        </tbody>
      </table>

    </div>
  )
}