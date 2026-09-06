export function safeStorageGet(key: string) {
  try {
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}

export function safeStorageSet(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
    return true
  } catch {
    return false
  }
}
