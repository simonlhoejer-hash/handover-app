export type AccessShip = 'crown' | 'pearl'

type ApiErrorBody = { error?: string }

export async function secureFetch<T>(
  input: string,
  init?: RequestInit
): Promise<T> {
  const method = init?.method?.toUpperCase() ?? 'GET'
  const response = await fetch(input, {
    ...init,
    cache: init?.cache ?? (method === 'GET' ? 'no-store' : undefined),
    credentials: 'same-origin',
    headers:
      init?.body instanceof FormData
        ? init.headers
        : {
            'Content-Type': 'application/json',
            ...init?.headers,
          },
  })

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as ApiErrorBody
    throw new Error(body.error || 'Kunne ikke hente eller gemme data.')
  }

  return response.json() as Promise<T>
}

export function queryString(values: Record<string, string | number | undefined>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== '') query.set(key, String(value))
  }
  return query.toString()
}
