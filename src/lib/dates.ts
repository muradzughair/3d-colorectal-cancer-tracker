// Dates are stored as "2025-03-11" and shown as "11 Mar 2025".
export function formatDate(date: string): string {
  if (!date) return 'No date'
  const d = new Date(`${date}T00:00:00`) // local midnight, so the day never shifts
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Today as "2026-11-20".
export function today(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
