'use client'

import { Minus, Plus } from 'lucide-react'

interface QuantityStepperProps {
  value: number
  minOrder: number
  onChange: (quantity: number) => void
}

export function QuantityStepper({ value, minOrder, onChange }: QuantityStepperProps) {
  function handleMinus() {
    const next = value - 1
    if (next >= minOrder) {
      onChange(next)
    }
  }

  function handlePlus() {
    onChange(value + 1)
  }

  return (
    <div className="flex items-center border border-gray-300 bg-white">
      <button
        onClick={handleMinus}
        disabled={value <= minOrder}
        className="flex items-center justify-center w-7 h-8 text-gray-500 hover:bg-gray-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors border-r border-gray-300"
      >
        <Minus size={11} />
      </button>
      <span className="w-9 text-center text-sm font-bold text-gray-900 select-none">
        {value}
      </span>
      <button
        onClick={handlePlus}
        className="flex items-center justify-center w-7 h-8 text-gray-500 hover:bg-gray-100 transition-colors border-l border-gray-300"
      >
        <Plus size={11} />
      </button>
    </div>
  )
}
