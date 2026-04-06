'use client'

import { useState, useEffect, useCallback } from 'react'
import type { User, UserType, VerificationStatus } from '@/types'

const AUTH_KEY = 'electromagaz_user'

interface AuthState {
  user: User | null
  mounted: boolean
}

// Mock user database stored in localStorage
const USERS_KEY = 'electromagaz_users'

function loadUsers(): Record<string, User & { password: string }> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(USERS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveUsers(users: Record<string, User & { password: string }>): void {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
  } catch {
    // ignore
  }
}

function loadCurrentUser(): User | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({ user: null, mounted: false })

  useEffect(() => {
    setState({ user: loadCurrentUser(), mounted: true })
  }, [])

  const login = useCallback(
    (email: string, password: string): { success: boolean; error?: string } => {
      // Hardcoded admin credentials
      if (email === 'admin' && password === '123') {
        const adminUser: User = {
          id: 'admin_001',
          name: 'Администратор',
          email: 'admin@electromagaz.ru',
          role: 'admin',
          userType: 'legal-entity',
          verificationStatus: 'verified',
          registeredAt: new Date().toISOString(),
          ordersCount: 0,
          totalSpent: 0,
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(adminUser))
        setState((s) => ({ ...s, user: adminUser }))
        return { success: true }
      }

      // Hardcoded test user credentials
      if (email === 'member@gmail.com' && password === '123') {
        const testUser: User = {
          id: 'user_001',
          name: 'Иван Петров',
          email: 'member@gmail.com',
          role: 'user',
          phone: '+7 (999) 123-45-67',
          userType: 'legal-entity',
          companyName: 'ООО "Электроника"',
          inn: '7707083893',
          position: 'Инженер',
          verificationStatus: 'verified',
          registeredAt: new Date().toISOString(),
          ordersCount: 5,
          totalSpent: 45000,
        }
        localStorage.setItem(AUTH_KEY, JSON.stringify(testUser))
        setState((s) => ({ ...s, user: testUser }))
        return { success: true }
      }

      const users = loadUsers()
      const entry = Object.values(users).find((u) => u.email === email)
      if (!entry) return { success: false, error: 'Пользователь не найден' }
      if (entry.password !== password) return { success: false, error: 'Неверный пароль' }

      const { password: _pw, ...user } = entry
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      setState((s) => ({ ...s, user }))
      return { success: true }
    },
    [],
  )

  const register = useCallback(
    (data: {
      name: string
      email: string
      password: string
      phone?: string
      userType: UserType
      companyName?: string
      inn?: string
      position?: string
    }): { success: boolean; error?: string } => {
      const users = loadUsers()
      const exists = Object.values(users).some((u) => u.email === data.email)
      if (exists) return { success: false, error: 'Email уже зарегистрирован' }

      const user: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: 'user',
        userType: data.userType,
        companyName: data.companyName,
        inn: data.inn,
        position: data.position,
        verificationStatus: data.userType === 'individual' ? 'verified' : 'pending',
        registeredAt: new Date().toISOString(),
        ordersCount: 0,
        totalSpent: 0,
      }
      users[user.id] = { ...user, password: data.password }
      saveUsers(users)
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      setState((s) => ({ ...s, user }))
      return { success: true }
    },
    [],
  )

  const updateProfile = useCallback(
    (data: Partial<Omit<User, 'id' | 'registeredAt'>>): void => {
      setState((s) => {
        if (!s.user) return s
        const updated = { ...s.user, ...data }
        localStorage.setItem(AUTH_KEY, JSON.stringify(updated))
        // also update in users db
        const users = loadUsers()
        if (users[updated.id]) {
          users[updated.id] = { ...users[updated.id], ...data }
          saveUsers(users)
        }
        return { ...s, user: updated }
      })
    },
    [],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY)
    setState((s) => ({ ...s, user: null }))
  }, [])

  return {
    user: state.user,
    mounted: state.mounted,
    isLoggedIn: state.user !== null,
    isAdmin: state.user?.role === 'admin',
    isVerified: state.user?.verificationStatus === 'verified',
    login,
    register,
    logout,
    updateProfile,
  }
}
