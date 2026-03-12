export default function KalkulationDetail({
  params,
}: {
  params: { id: string }
}) {

  return (
    <div>
      <h1>Kalkulation #{params.id}</h1>
      <p>Her kan du redigere retten</p>
    </div>
  )
}