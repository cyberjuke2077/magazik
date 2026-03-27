// SVG-иконки электронных компонентов
// Нарисованы как реальные схемные обозначения

interface IconProps {
  className?: string
  size?: number
}

export function ResistorIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <line x1="4" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="12" y="16" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      <line x1="36" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="18" y1="20" x2="18" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="24" y1="20" x2="24" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
      <line x1="30" y1="20" x2="30" y2="28" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
    </svg>
  )
}

export function CapacitorIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <line x1="4" y1="24" x2="20" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="20" y1="12" x2="20" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="12" x2="28" y2="36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <text x="17" y="10" fontSize="7" fill="currentColor" fontFamily="monospace" opacity="0.6">+</text>
    </svg>
  )
}

export function ChipIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <rect x="12" y="12" width="24" height="24" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      {/* Left pins */}
      <line x1="4" y1="18" x2="12" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="24" x2="12" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="30" x2="12" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Right pins */}
      <line x1="36" y1="18" x2="44" y2="18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="36" y1="30" x2="44" y2="30" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Inner grid */}
      <rect x="17" y="17" width="14" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.4" />
      <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.5" />
    </svg>
  )
}

export function TransistorIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Base line */}
      <line x1="4" y1="24" x2="18" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Vertical bar */}
      <line x1="18" y1="14" x2="18" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      {/* Collector */}
      <line x1="18" y1="17" x2="34" y2="10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="10" x2="34" y2="4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Emitter with arrow */}
      <line x1="18" y1="31" x2="34" y2="38" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="34" y1="38" x2="34" y2="44" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Arrow */}
      <polygon points="28,33 34,38 30,40" fill="currentColor" opacity="0.8" />
    </svg>
  )
}

export function RelayIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Coil box */}
      <rect x="6" y="28" width="18" height="12" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Coil lines */}
      <path d="M9 34 Q12 30 15 34 Q18 38 21 34" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      {/* Armature */}
      <line x1="6" y1="20" x2="42" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Contact */}
      <line x1="30" y1="8" x2="42" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 2" />
      <circle cx="30" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="42" cy="8" r="2.5" stroke="currentColor" strokeWidth="2" fill="none" />
      {/* Leads */}
      <line x1="6" y1="34" x2="2" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="34" x2="28" y2="34" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function SensorIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Body */}
      <rect x="14" y="20" width="20" height="20" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      {/* Pins */}
      <line x1="19" y1="40" x2="19" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="24" y1="40" x2="24" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="29" y1="40" x2="29" y2="46" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Waves (sensing) */}
      <path d="M24 16 Q28 12 24 8 Q20 4 24 0" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.5" />
      <path d="M30 18 Q36 12 30 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35" />
      <path d="M18 18 Q12 12 18 6" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.35" />
      {/* Dot */}
      <circle cx="24" cy="30" r="3" fill="currentColor" opacity="0.6" />
    </svg>
  )
}

export function ControllerIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Main chip */}
      <rect x="10" y="10" width="28" height="28" rx="4" stroke="currentColor" strokeWidth="2.5" fill="none" />
      {/* Top pins */}
      <line x1="17" y1="4" x2="17" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="4" x2="24" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="31" y1="4" x2="31" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Bottom pins */}
      <line x1="17" y1="38" x2="17" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="24" y1="38" x2="24" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="31" y1="38" x2="31" y2="44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Left pins */}
      <line x1="4" y1="17" x2="10" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="4" y1="31" x2="10" y2="31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Right pins */}
      <line x1="38" y1="17" x2="44" y2="17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="31" x2="44" y2="31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {/* Inner circuit */}
      <rect x="16" y="16" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.35" />
      <circle cx="24" cy="24" r="3" fill="currentColor" opacity="0.5" />
      <line x1="21" y1="24" x2="16" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
      <line x1="27" y1="24" x2="32" y2="24" stroke="currentColor" strokeWidth="1" opacity="0.4" />
    </svg>
  )
}

export function DiodeIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <line x1="4" y1="24" x2="16" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Triangle */}
      <polygon points="16,14 16,34 32,24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      {/* Bar */}
      <line x1="32" y1="14" x2="32" y2="34" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  )
}

export function LEDIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      <line x1="4" y1="28" x2="14" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <polygon points="14,18 14,38 28,28" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinejoin="round" />
      <line x1="28" y1="18" x2="28" y2="38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="28" y1="28" x2="44" y2="28" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Light rays */}
      <line x1="32" y1="12" x2="36" y2="6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="38" y1="16" x2="44" y2="12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="35" y1="8" x2="42" y2="8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}

export function ConnectorIcon({ className = '', size = 48 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
      {/* Housing */}
      <rect x="16" y="8" width="16" height="32" rx="3" stroke="currentColor" strokeWidth="2.5" fill="none" />
      {/* Pins left */}
      <line x1="4" y1="16" x2="16" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4" y1="24" x2="16" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="4" y1="32" x2="16" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      {/* Contacts inside */}
      <circle cx="24" cy="16" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="24" cy="24" r="2" fill="currentColor" opacity="0.5" />
      <circle cx="24" cy="32" r="2" fill="currentColor" opacity="0.5" />
      {/* Right side */}
      <line x1="32" y1="16" x2="44" y2="16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
      <line x1="32" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
      <line x1="32" y1="32" x2="44" y2="32" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 2" />
    </svg>
  )
}

// Маппинг slug → компонент
export const categoryIconMap: Record<string, React.FC<IconProps>> = {
  rezistory:    ResistorIcon,
  kondensatory: CapacitorIcon,
  mikroskhemy:  ChipIcon,
  tranzistory:  TransistorIcon,
  rele:         RelayIcon,
  datchiki:     SensorIcon,
  kontrollery:  ControllerIcon,
  diody:        DiodeIcon,
  svetodiody:   LEDIcon,
  razyomy:      ConnectorIcon,
}

export function CategoryIcon({ slug, size = 48, className = '' }: { slug: string; size?: number; className?: string }) {
  const Icon = categoryIconMap[slug]
  if (!Icon) return <span className={`font-mono text-4xl ${className}`}>◆</span>
  return <Icon size={size} className={className} />
}
