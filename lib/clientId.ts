export function createClientId(prefix = '') {
  const cryptoApi = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined

  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return `${prefix}${cryptoApi.randomUUID()}`
  }

  if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
    const values = new Uint32Array(4)
    cryptoApi.getRandomValues(values)
    return `${prefix}${Array.from(values, (value) => value.toString(16).padStart(8, '0')).join('')}`
  }

  return `${prefix}${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`
}
