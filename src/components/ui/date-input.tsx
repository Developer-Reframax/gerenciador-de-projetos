'use client'

import { forwardRef } from 'react'
import { Input } from './input'
import { cn } from '@/lib/utils'

interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'value'> {
  value?: string
  onChange?: (value: string) => void
}

// Função para converter data ISO para formato brasileiro
const formatToBrazilian = (isoDate: string): string => {
  if (!isoDate) return ''
  const date = new Date(isoDate + 'T00:00:00')
  if (isNaN(date.getTime())) return ''
  
  const day = date.getDate().toString().padStart(2, '0')
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const year = date.getFullYear()
  
  return `${day}/${month}/${year}`
}

// Função para converter formato brasileiro para ISO
const formatToISO = (brazilianDate: string): string => {
  if (!brazilianDate) return ''
  
  // Remove caracteres não numéricos
  const numbers = brazilianDate.replace(/\D/g, '')
  
  if (numbers.length !== 8) return ''
  
  const day = numbers.substring(0, 2)
  const month = numbers.substring(2, 4)
  const year = numbers.substring(4, 8)
  
  // Validação básica
  const dayNum = parseInt(day)
  const monthNum = parseInt(month)
  const yearNum = parseInt(year)
  
  if (dayNum < 1 || dayNum > 31 || monthNum < 1 || monthNum > 12 || yearNum < 1900) {
    return ''
  }
  
  return `${year}-${month}-${day}`
}

// Função para aplicar máscara de data
const applyDateMask = (value: string): string => {
  const numbers = value.replace(/\D/g, '')
  
  if (numbers.length <= 2) {
    return numbers
  } else if (numbers.length <= 4) {
    return `${numbers.substring(0, 2)}/${numbers.substring(2)}`
  } else {
    return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}/${numbers.substring(4, 8)}`
  }
}

const DateInput = forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, value, onChange, ...props }, ref) => {
    const displayValue = value ? formatToBrazilian(value) : ''
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value
      const maskedValue = applyDateMask(inputValue)
      
      // Se a data está completa, converte para ISO e chama onChange
      if (maskedValue.length === 10) {
        const isoDate = formatToISO(maskedValue)
        if (isoDate && onChange) {
          onChange(isoDate)
        }
      } else if (onChange) {
        // Para datas incompletas ou vazias, passa o valor mascarado
        onChange(maskedValue === '' ? '' : value || '')
      }
    }
    
    return (
      <Input
        ref={ref}
        className={cn(className)}
        placeholder="dd/mm/aaaa"
        maxLength={10}
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    )
  }
)

DateInput.displayName = 'DateInput'

export { DateInput }
