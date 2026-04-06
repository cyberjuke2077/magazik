'use client'

import { useState } from 'react'
import { Search, Check, X, Ban, UserCheck, Clock, AlertCircle } from 'lucide-react'
import type { User, VerificationStatus } from '@/types'
import { mockUsers } from '@/lib/users-mock-data'

export function AdminUsers() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<VerificationStatus | 'all'>('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.companyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.inn?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' || user.verificationStatus === statusFilter

    return matchesSearch && matchesStatus
  })

  function updateUserStatus(userId: string, newStatus: VerificationStatus) {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, verificationStatus: newStatus } : u))
    )
    if (selectedUser?.id === userId) {
      setSelectedUser((prev) => (prev ? { ...prev, verificationStatus: newStatus } : null))
    }
  }

  function getStatusBadge(status: VerificationStatus) {
    const styles = {
      verified: 'bg-green-50 text-green-700 border-green-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      unverified: 'bg-gray-50 text-gray-600 border-gray-200',
      rejected: 'bg-red-50 text-red-700 border-red-200',
      banned: 'bg-red-50 text-red-700 border-red-200',
    }

    const labels = {
      verified: 'Верифицирован',
      pending: 'На проверке',
      unverified: 'Не верифицирован',
      rejected: 'Отклонён',
      banned: 'Заблокирован',
    }

    return (
      <span className={`px-2 py-1 text-xs border rounded ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  function getUserTypeLabel(userType: string) {
    const labels = {
      individual: 'Физ. лицо',
      'self-employed': 'ИП',
      'legal-entity': 'Юр. лицо',
    }
    return labels[userType as keyof typeof labels] || userType
  }

  const statusCounts = {
    all: users.length,
    verified: users.filter((u) => u.verificationStatus === 'verified').length,
    pending: users.filter((u) => u.verificationStatus === 'pending').length,
    unverified: users.filter((u) => u.verificationStatus === 'unverified').length,
    rejected: users.filter((u) => u.verificationStatus === 'rejected').length,
    banned: users.filter((u) => u.verificationStatus === 'banned').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Управление пользователями</h2>
        <p className="text-sm text-gray-500 mt-1">
          Всего пользователей: {users.length}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Поиск по имени, email, компании, ИНН..."
            className="w-full h-10 pl-10 pr-4 text-sm border border-gray-300 rounded outline-none focus:border-[#0066cc] transition-colors"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as VerificationStatus | 'all')}
          className="h-10 px-3 text-sm border border-gray-300 rounded outline-none focus:border-[#0066cc] transition-colors"
        >
          <option value="all">Все статусы ({statusCounts.all})</option>
          <option value="verified">Верифицированы ({statusCounts.verified})</option>
          <option value="pending">На проверке ({statusCounts.pending})</option>
          <option value="unverified">Не верифицированы ({statusCounts.unverified})</option>
          <option value="rejected">Отклонены ({statusCounts.rejected})</option>
          <option value="banned">Заблокированы ({statusCounts.banned})</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="border border-gray-200 rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Пользователь</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Тип</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Компания / ИНН</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Статус</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Заказы</th>
              <th className="px-4 py-3 text-left font-medium text-gray-700">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">{user.name}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    {user.phone && <div className="text-xs text-gray-400">{user.phone}</div>}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-700">{getUserTypeLabel(user.userType)}</td>
                <td className="px-4 py-3">
                  {user.companyName ? (
                    <div>
                      <div className="text-gray-900">{user.companyName}</div>
                      {user.inn && <div className="text-xs text-gray-500">ИНН: {user.inn}</div>}
                      {user.position && (
                        <div className="text-xs text-gray-400">{user.position}</div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3">{getStatusBadge(user.verificationStatus)}</td>
                <td className="px-4 py-3">
                  <div>
                    <div className="text-gray-900">{user.ordersCount} заказов</div>
                    <div className="text-xs text-gray-500">
                      {user.totalSpent.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-[#0066cc] hover:text-[#0052a3] text-sm transition-colors"
                  >
                    Управление
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredUsers.length === 0 && (
          <div className="py-12 text-center text-gray-500">
            <p>Пользователи не найдены</p>
          </div>
        )}
      </div>

      {/* User Details Modal */}
      {selectedUser && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setSelectedUser(null)}
          />
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl bg-white rounded border border-gray-200 z-50 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{selectedUser.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              {/* User Info */}
              <div className="space-y-4 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Тип покупателя</div>
                    <div className="text-sm text-gray-900">
                      {getUserTypeLabel(selectedUser.userType)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Статус верификации</div>
                    <div>{getStatusBadge(selectedUser.verificationStatus)}</div>
                  </div>
                </div>

                {selectedUser.phone && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Телефон</div>
                    <div className="text-sm text-gray-900">{selectedUser.phone}</div>
                  </div>
                )}

                {selectedUser.companyName && (
                  <>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Компания</div>
                      <div className="text-sm text-gray-900">{selectedUser.companyName}</div>
                    </div>
                    {selectedUser.inn && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">ИНН</div>
                        <div className="text-sm text-gray-900">{selectedUser.inn}</div>
                      </div>
                    )}
                    {selectedUser.position && (
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Должность</div>
                        <div className="text-sm text-gray-900">{selectedUser.position}</div>
                      </div>
                    )}
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Дата регистрации</div>
                    <div className="text-sm text-gray-900">
                      {new Date(selectedUser.registeredAt).toLocaleDateString('ru-RU')}
                    </div>
                  </div>
                  {selectedUser.lastLogin && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Последний вход</div>
                      <div className="text-sm text-gray-900">
                        {new Date(selectedUser.lastLogin).toLocaleDateString('ru-RU')}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Заказов</div>
                    <div className="text-sm text-gray-900">{selectedUser.ordersCount}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Сумма покупок</div>
                    <div className="text-sm text-gray-900">
                      {selectedUser.totalSpent.toLocaleString('ru-RU')} ₽
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-6">
                <div className="text-sm font-medium text-gray-700 mb-3">Действия</div>
                <div className="grid grid-cols-2 gap-3">
                  {selectedUser.verificationStatus !== 'verified' && (
                    <button
                      onClick={() => updateUserStatus(selectedUser.id, 'verified')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                    >
                      <UserCheck size={16} />
                      Верифицировать
                    </button>
                  )}

                  {selectedUser.verificationStatus === 'pending' && (
                    <button
                      onClick={() => updateUserStatus(selectedUser.id, 'rejected')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                    >
                      <X size={16} />
                      Отклонить
                    </button>
                  )}

                  {selectedUser.verificationStatus !== 'banned' && (
                    <button
                      onClick={() => updateUserStatus(selectedUser.id, 'banned')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-gray-800 hover:bg-gray-900 rounded transition-colors"
                    >
                      <Ban size={16} />
                      Заблокировать
                    </button>
                  )}

                  {selectedUser.verificationStatus === 'banned' && (
                    <button
                      onClick={() => updateUserStatus(selectedUser.id, 'verified')}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                    >
                      <Check size={16} />
                      Разблокировать
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
