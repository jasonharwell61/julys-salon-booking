// Labels for the category values stored in the database
export const CATEGORY_LABELS = {
  'full-set': 'Full Sets',
  fill: 'Fills',
  'lash-lift': 'Lash Lifts',
  removal: 'Removal',
}

// Prices are stored in cents: 6500 -> "$65", 6550 -> "$65.50"
export function formatPrice(priceCents) {
  const dollars = priceCents / 100
  const hasCents = priceCents % 100 !== 0
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(dollars)
}

// 135 -> "2 hr 15 min"
export function formatDuration(minutes) {
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  if (rest === 0) return `${hours} hr`
  return `${hours} hr ${rest} min`
}
