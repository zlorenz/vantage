/**
 * CSV template generation from the shared crew-credit catalog.
 */

import {CREW_DEPARTMENTS} from '@crew-credits'

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/** Build a UTF-8 CSV template with a BOM for Excel compatibility.
 * Names only — links are managed in Studio and auto-applied from name memory.
 */
export function buildCrewCreditsCsvTemplate(): string {
  const lines = ['Department,Role,Names']

  for (const dept of CREW_DEPARTMENTS) {
    for (const role of dept.roles) {
      lines.push([dept.label, role.label, ''].map(csvEscape).join(','))
    }
  }

  // UTF-8 BOM helps Excel open non-ASCII names correctly.
  return `\uFEFF${lines.join('\n')}\n`
}

export function downloadCrewCreditsCsvTemplate(filename = 'crew-credits-template.csv'): void {
  const csv = buildCrewCreditsCsvTemplate()
  const blob = new Blob([csv], {type: 'text/csv;charset=utf-8'})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}

export function downloadTextFile(filename: string, contents: string, mime = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([contents], {type: mime})
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.click()
  URL.revokeObjectURL(url)
}
