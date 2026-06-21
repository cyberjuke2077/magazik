'use client'

import { formatPrice } from '@/lib/utils'

interface OrderProgressProps {
  currentAmount: number
  minAmount: number
}

export function OrderProgress({ currentAmount, minAmount }: OrderProgressProps) {
  const progress = Math.min((currentAmount / minAmount) * 100, 100)
  const remaining = Math.max(minAmount - currentAmount, 0)
  const isComplete = currentAmount >= minAmount
  
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">
          {isComplete ? 'Минимальная сумма достигнута' : 'До минимальной суммы заказа'}
        </span>
        <span className={`text-sm font-bold ${isComplete ? 'text-green-600' : 'text-gray-900'}`}>
          {progress.toFixed(0)}%
        </span>
      </div>
      
      {/* Progress bar */}
      <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-500 ${
            isComplete ? 'bg-green-500' : 'bg-azure'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">
          {formatPrice(currentAmount)} из {formatPrice(minAmount)}
        </span>
        {remaining > 0 ? (
          <span className="text-orange-600 font-medium">
            Осталось: {formatPrice(remaining)}
          </span>
        ) : (
          <span className="text-green-600 font-medium">
            ✓ Готово к отправке
          </span>
        )}
      </div>
    </div>
  )
}
