'use client'

import { useState, useEffect, useCallback } from 'react'

const AUTH_KEY = 'electromagaz_user'

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  company?: string
  createdAt: string
}

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
      company?: string
    }): { success: boolean; error?: string } => {
      const users = loadUsers()
      const exists = Object.values(users).some((u) => u.email === data.email)
      if (exists) return { success: false, error: 'Email уже зарегистрирован' }

      const user: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        createdAt: new Date().toISOString(),
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
    (data: Partial<Omit<User, 'id' | 'createdAt'>>): void => {
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
    login,
    register,
    logout,
    updateProfile,
  }
}
