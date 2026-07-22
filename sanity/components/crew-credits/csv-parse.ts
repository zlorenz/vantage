/**
 * Pure CSV parsing for crew-credit imports.
 * Accepts UTF-8 BOM, Excel-quoted fields, and header aliases.
 */

import {
  matchCsvHeader,
  type CsvColumnKind,
} from '@crew-credits'

export interface ParsedCsvRow {
  lineNumber: number
  department: string
  role: string
  names: string
  url: string
}

export interface ParseCsvResult {
  rows: ParsedCsvRow[]
  errors: string[]
  headers: Partial<Record<CsvColumnKind, string>>
}

/** Strip a leading UTF-8 BOM if present. */
export function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * Minimal RFC4180-ish CSV parser.
 * Avoids a hard dependency for unit tests while remaining Excel-compatible.
 */
export function parseCsvText(text: string): string[][] {
  const input = stripBom(text)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < input.length; i++) {
    const char = input[i]
    const next = input[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
      continue
    }

    if (char === '"') {
      inQuotes = true
      continue
    }

    if (char === ',') {
      row.push(field)
      field = ''
      continue
    }

    if (char === '\n') {
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    if (char === '\r') {
      if (next === '\n') continue
      row.push(field)
      rows.push(row)
      row = []
      field = ''
      continue
    }

    field += char
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''))
}

export function parseCrewCreditsCsv(text: string): ParseCsvResult {
  const matrix = parseCsvText(text)
  if (!matrix.length) {
    return {
      rows: [],
      errors: ['CSV is empty'],
      headers: {},
    }
  }

  const headerCells = matrix[0]
  const headers: Partial<Record<CsvColumnKind, number>> = {}
  const headerLabels: Partial<Record<CsvColumnKind, string>> = {}

  headerCells.forEach((cell, index) => {
    const kind = matchCsvHeader(cell)
    if (!kind) return
    if (headers[kind] === undefined) {
      headers[kind] = index
      headerLabels[kind] = cell.trim()
    }
  })

  const errors: string[] = []
  if (headers.role === undefined) {
    errors.push('Missing required Role column (accepted: Role, Position, Title, Credit, Job)')
  }
  if (headers.names === undefined) {
    errors.push(
      'Missing required Names column (accepted: Names, Name, Credit Name, Credits, People, Person)',
    )
  }

  if (errors.length) {
    return {rows: [], errors, headers: headerLabels}
  }

  const rows: ParsedCsvRow[] = []

  for (let i = 1; i < matrix.length; i++) {
    const cells = matrix[i]
    const lineNumber = i + 1
    const department =
      headers.department !== undefined ? String(cells[headers.department] ?? '').trim() : ''
    const role = String(cells[headers.role!] ?? '').trim()
    const names = String(cells[headers.names!] ?? '').trim()
    const url =
      headers.url !== undefined ? String(cells[headers.url] ?? '').trim() : ''

    // Blank rows and empty Names are ignored (not errors).
    if (!role && !names && !department && !url) continue
    if (!names) continue

    rows.push({lineNumber, department, role, names, url})
  }

  return {rows, errors, headers: headerLabels}
}
