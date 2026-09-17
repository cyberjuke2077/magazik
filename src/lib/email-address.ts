const LOCAL_PART_RE = /^[A-Z0-9.!#$%&'*+/=_`{|}~-]+$/i
const DOMAIN_LABEL_RE = /^[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i

export function isValidEmailAddress(value: string): boolean {
  if (!value || value.length > 200 || /[\s?#&]/.test(value)) return false
  const parts = value.split('@')
  if (parts.length !== 2) return false
  const [local, domain] = parts
  if (!local || local.length > 64 || !LOCAL_PART_RE.test(local)) return false
  const labels = domain.split('.')
  return labels.length >= 2 && labels.every((label) => DOMAIN_LABEL_RE.test(label))
}

export function mailtoHref(address: string): string | null {
  if (!isValidEmailAddress(address)) return null
  const [local, domain] = address.split('@')
  return `mailto:${encodeURIComponent(local)}@${encodeURIComponent(domain)}`
}
