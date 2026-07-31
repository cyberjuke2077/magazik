'use client'

import { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Mail,
  PackageCheck,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'

type AuthTab = 'login' | 'register'
type RegisterMethod = 'email' | 'phone'

const futureFeatures = [
  {
    icon: PackageCheck,
    title: 'Статусы заказов',
    text: 'Состав, оплата, сборка, документы и движение поставки.',
  },
  {
    icon: Bell,
    title: 'Сообщения',
    text: 'Уточнения менеджера, изменение сроков и системные уведомления.',
  },
  {
    icon: FileText,
    title: 'Документы',
    text: 'Счета, УПД, сертификаты и история коммерческих предложений.',
  },
]

export function AccountClient() {
  const [tab, setTab] = useState<AuthTab>('login')

  return (
    <div className="mx-auto max-w-[1380px] px-4 pb-14 pt-8 lg:px-0 lg:pb-20 lg:pt-12">
      <div className="mb-7 max-w-3xl">
        <div className="flex items-center gap-2 text-xs font-semibold text-azure">
          <UserRound size={15} />
          Личный кабинет
        </div>
        <h1 className="mt-3 text-[32px] font-bold tracking-[-0.04em] text-ink sm:text-[42px]">
          Заказы и сообщения в одном месте
        </h1>
        <p className="mt-3 max-w-[62ch] text-sm leading-6 text-ink-3 sm:text-base">
          Интерфейс кабинета готовится к подключению серверной авторизации. До этого момента формы не отправляют и не сохраняют персональные данные.
        </p>
      </div>

      <div className="grid overflow-hidden rounded-[26px] bg-white shadow-[var(--shadow-azure-md)] lg:grid-cols-[minmax(0,0.92fr)_minmax(420px,0.68fr)]">
        <AccountPreview />
        <section className="border-t border-[var(--border)] p-5 sm:p-8 lg:border-l lg:border-t-0 lg:p-10" aria-label="Вход и регистрация">
          <AuthTabs tab={tab} onChange={setTab} />
          <div className="mt-7">
            {tab === 'login' ? <LoginForm /> : <RegisterForm />}
          </div>
        </section>
      </div>
    </div>
  )
}

function AccountPreview() {
  return (
    <section className="relative overflow-hidden bg-[#082b59] p-6 text-white sm:p-10 lg:min-h-[610px] lg:p-12">
      <div className="absolute -right-24 -top-24 size-72 rounded-full bg-[#1988ff]/28 blur-3xl" />
      <div className="absolute -bottom-24 left-1/4 size-64 rounded-full bg-cyan-300/12 blur-3xl" />
      <div className="relative">
        <div className="flex size-12 items-center justify-center rounded-2xl bg-white/12 ring-1 ring-white/15">
          <ShieldCheck size={25} />
        </div>
        <h2 className="mt-7 max-w-[14ch] text-[30px] font-bold leading-[1.05] tracking-[-0.035em] sm:text-[38px]">
          Кабинет клиента Electromagaz
        </h2>
        <p className="mt-4 max-w-[48ch] text-sm leading-6 text-white/68">
          После подключения аккаунта здесь появятся реальные данные пользователя и его заказов.
        </p>

        <div className="mt-10 space-y-3">
          {futureFeatures.map((feature) => (
            <div key={feature.title} className="flex gap-4 rounded-2xl bg-white/[0.07] p-4 ring-1 ring-white/10 backdrop-blur-sm">
              <feature.icon className="mt-0.5 shrink-0 text-[#66b4ff]" size={20} />
              <div>
                <h3 className="text-sm font-semibold">{feature.title}</h3>
                <p className="mt-1 text-xs leading-5 text-white/62">{feature.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function AuthTabs({ tab, onChange }: { tab: AuthTab; onChange: (tab: AuthTab) => void }) {
  return (
    <div className="grid grid-cols-2 rounded-xl bg-surface-muted p-1" role="tablist" aria-label="Авторизация">
      {(['login', 'register'] as const).map((item) => (
        <button
          key={item}
          type="button"
          role="tab"
          aria-selected={tab === item}
          onClick={() => onChange(item)}
          className={`h-11 rounded-lg text-sm font-semibold transition duration-200 active:scale-[0.98] ${
            tab === item ? 'bg-white text-ink shadow-[var(--shadow-xs)]' : 'text-ink-3 hover:text-ink'
          }`}
        >
          {item === 'login' ? 'Войти' : 'Регистрация'}
        </button>
      ))}
    </div>
  )
}

function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [message, setMessage] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Серверный вход еще не подключен. Данные не отправлены и не сохранены.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Email или телефон" icon={Mail}>
        <input name="identifier" autoComplete="username" required placeholder="name@example.ru или +7 900 000-00-00" className="account-input" />
      </Field>
      <PasswordField show={showPassword} onToggle={() => setShowPassword((value) => !value)} />
      <button type="submit" className="ui-btn ui-btn-primary h-12 w-full">
        Войти в кабинет
        <ChevronRight size={17} />
      </button>
      <AuthNotice message={message} />
    </form>
  )
}

function RegisterForm() {
  const [method, setMethod] = useState<RegisterMethod>('email')
  const [message, setMessage] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage('Регистрация будет доступна после подключения кодов подтверждения. Данные не отправлены и не сохранены.')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Field label="Ваше имя" icon={UserRound}>
        <input name="name" autoComplete="name" required placeholder="Алексей" className="account-input" />
      </Field>
      <MethodSwitch method={method} onChange={setMethod} />
      <Field label={method === 'email' ? 'Email российского домена' : 'Номер телефона'} icon={method === 'email' ? Mail : Phone}>
        <input
          name={method}
          type={method === 'email' ? 'email' : 'tel'}
          autoComplete={method}
          required
          pattern={method === 'email' ? '.+\\.(ru|su|рф)$' : '\\+?7[0-9 ()-]{10,16}'}
          title={method === 'email' ? 'Используйте адрес в домене .ru, .su или .рф' : 'Используйте российский номер с кодом +7'}
          placeholder={method === 'email' ? 'name@company.ru' : '+7 900 000-00-00'}
          className="account-input"
        />
      </Field>
      <label className="flex items-start gap-3 text-xs leading-5 text-ink-3">
        <input type="checkbox" required className="mt-1 size-4 rounded border-[var(--border-2)] accent-azure" />
        <span>Согласен с политикой конфиденциальности и обработкой персональных данных.</span>
      </label>
      <button type="submit" className="ui-btn ui-btn-primary h-12 w-full">
        Получить код подтверждения
        <ChevronRight size={17} />
      </button>
      <AuthNotice message={message} />
    </form>
  )
}

function MethodSwitch({ method, onChange }: { method: RegisterMethod; onChange: (method: RegisterMethod) => void }) {
  return (
    <div className="flex gap-2">
      <MethodButton active={method === 'email'} onClick={() => onChange('email')} icon={Mail} label="По email" />
      <MethodButton active={method === 'phone'} onClick={() => onChange('phone')} icon={Phone} label="По телефону" />
    </div>
  )
}

function MethodButton({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Mail; label: string }) {
  return (
    <button type="button" onClick={onClick} className={`flex h-10 flex-1 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition ${active ? 'border-azure bg-azure-light text-azure' : 'border-[var(--border)] text-ink-3 hover:border-azure/35 hover:text-ink'}`}>
      <Icon size={15} />
      {label}
    </button>
  )
}

function Field({ label, icon: Icon, children }: { label: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-ink-2">{label}</span>
      <span className="relative block">
        <Icon className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" size={17} />
        {children}
      </span>
    </label>
  )
}

function PasswordField({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-ink-2">Пароль</span>
      <span className="relative block">
        <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-4" size={17} />
        <input type={show ? 'text' : 'password'} name="password" autoComplete="current-password" required className="account-input pr-11" placeholder="Введите пароль" />
        <button type="button" onClick={onToggle} aria-label={show ? 'Скрыть пароль' : 'Показать пароль'} className="absolute right-3 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink-4 transition hover:bg-surface-muted hover:text-ink">
          {show ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </span>
    </label>
  )
}

function AuthNotice({ message }: { message: string }) {
  if (!message) return null

  return (
    <div className="flex gap-2.5 rounded-xl border border-azure/18 bg-azure-light p-3 text-xs leading-5 text-ink-2" role="status">
      <CheckCircle2 className="mt-0.5 shrink-0 text-azure" size={16} />
      {message}
    </div>
  )
}
