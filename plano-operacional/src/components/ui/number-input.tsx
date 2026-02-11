import { useState, useEffect } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  onBlur?: () => void
  className?: string
  placeholder?: string
  disabled?: boolean
  allowDecimal?: boolean
  min?: number
  max?: number
  currency?: boolean
}

export function NumberInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder = '0,00',
  disabled = false,
  allowDecimal = true,
  min,
  max,
  currency = false,
}: NumberInputProps) {
  const [inputValue, setInputValue] = useState<string>('')
  const [isFocused, setIsFocused] = useState(false)
  const [_digitsOnly, setDigitsOnly] = useState<string>('') // Para modo calculadora

  // Format number to Brazilian locale (comma as decimal separator)
  const formatNumber = (num: number): string => {
    if (isNaN(num)) return ''
    const formatted = num.toLocaleString('pt-BR', {
      minimumFractionDigits: allowDecimal ? 2 : 0,
      maximumFractionDigits: allowDecimal ? 2 : 0,
    })
    return currency ? `R$ ${formatted}` : formatted
  }

  // Parse Brazilian formatted string to number
  const parseNumber = (str: string): number => {
    if (!str) return 0

    // If currency mode and only digits (calculator-style), treat as cents
    if (currency && /^\d+$/.test(str)) {
      const parsed = parseInt(str, 10)
      return isNaN(parsed) ? 0 : parsed / 100
    }

    // Remove R$ prefix and spaces
    const cleaned = str.replace(/R\$\s?/g, '')
    // Replace comma with dot for parsing
    const normalized = cleaned.replace(/\./g, '').replace(',', '.')
    const parsed = parseFloat(normalized)
    return isNaN(parsed) ? 0 : parsed
  }

  // Update input value when prop value changes (only if not focused)
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatNumber(value))
    }
  }, [value, isFocused, allowDecimal])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newValue = e.target.value

    if (currency && isFocused) {
      // Calculadora: extrair apenas dígitos
      const onlyDigits = newValue.replace(/[^\d]/g, '')

      // Limitar a 15 dígitos (evita overflow)
      if (onlyDigits.length > 15) return

      setDigitsOnly(onlyDigits)

      // Converter para número (dígitos / 100 para centavos)
      const numValue = onlyDigits === '' ? 0 : parseInt(onlyDigits, 10) / 100
      onChange(numValue)

      // Formatar e mostrar em tempo real
      setInputValue(formatNumber(numValue))
    } else {
      // Original behavior for non-currency
      if (allowDecimal) {
        newValue = newValue.replace(/[^\d,\.]/g, '')
        const commas = (newValue.match(/,/g) || []).length
        const periods = (newValue.match(/\./g) || []).length
        if (commas > 1 || periods > 1) return
      } else {
        newValue = newValue.replace(/[^\d]/g, '')
      }

      setInputValue(newValue)
      const parsedValue = parseNumber(newValue)
      onChange(parsedValue)
    }
  }

  const handleBlur = () => {
    setIsFocused(false)
    let finalValue = value // Usar o valor já processado

    // Apply min/max constraints
    if (min !== undefined && finalValue < min) finalValue = min
    if (max !== undefined && finalValue > max) finalValue = max

    // Clear calculator state
    setDigitsOnly('')

    // Always format on blur (will include R$ if currency=true)
    setInputValue(formatNumber(finalValue))
    onChange(finalValue)
    onBlur?.()
  }

  const handleFocus = () => {
    setIsFocused(true)
    if (currency) {
      // Inicializar digitsOnly com o valor atual em centavos
      const cents = value === 0 ? '' : Math.round(value * 100).toString()
      setDigitsOnly(cents)
      // Manter formatação visual
      setInputValue(formatNumber(value))
    } else {
      // Show raw input value when focused for easier editing
      const rawValue = value === 0 ? '' : value.toString().replace('.', ',')
      setInputValue(rawValue)
    }
  }

  return (
    <Input
      type="text"
      value={inputValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={cn('text-right', className)}
      placeholder={placeholder}
      disabled={disabled}
    />
  )
}
