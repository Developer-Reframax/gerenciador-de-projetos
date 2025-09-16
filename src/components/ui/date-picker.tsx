'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar as CalendarIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/components/ui/input'

interface DatePickerProps {
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
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

export function DatePicker({ value, onChange, placeholder = "Selecione uma data", className, disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value ? formatToBrazilian(value) : '')

  const selectedDate = value ? new Date(value + 'T00:00:00') : undefined

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      const isoDate = format(date, 'yyyy-MM-dd')
      const brazilianDate = formatToBrazilian(isoDate)
      setInputValue(brazilianDate)
      onChange?.(isoDate)
    } else {
      setInputValue('')
      onChange?.('')
    }
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value
    const maskedValue = applyDateMask(inputVal)
    setInputValue(maskedValue)
    
    // Se a data está completa, converte para ISO e chama onChange
    if (maskedValue.length === 10) {
      const isoDate = formatToISO(maskedValue)
      if (isoDate) {
        onChange?.(isoDate)
      }
    } else if (maskedValue === '') {
      onChange?.('')
    }
  }

  const handleInputBlur = () => {
    // Ao perder o foco, se a data não estiver completa, limpa o campo
    if (inputValue.length > 0 && inputValue.length < 10) {
      setInputValue('')
      onChange?.('')
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          maxLength={10}
          disabled={disabled}
          className="pr-10"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 border-l-0 rounded-l-none hover:bg-muted"
              disabled={disabled}
              type="button"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              locale={ptBR}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}