/** Export untrusted catalog strings as text, never as spreadsheet formulas. */
export function escapeCsvField(value: string): string {
  const text = /^[\s\p{Cc}]*[=+@-]/u.test(value) || /^[\t\r\n]/.test(value)
    ? `'${value}` : value
  return /[,"\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
