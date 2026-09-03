import { localeFor } from '@/lib/LanguageContext'

export function formatFoodWasteAmount(
  valueKg: number,
  lang: string,
  decimals = 2
) {
  if (valueKg > 0 && valueKg < 1) {
    return `${(valueKg * 1000).toLocaleString(localeFor(lang), {
      maximumFractionDigits: 0,
    })} g`
  }

  if (valueKg >= 1000) {
    return `${(valueKg / 1000).toLocaleString(localeFor(lang), {
      maximumFractionDigits: decimals,
    })} ton`
  }

  return `${valueKg.toLocaleString(localeFor(lang), {
    maximumFractionDigits: decimals,
  })} kg`
}
