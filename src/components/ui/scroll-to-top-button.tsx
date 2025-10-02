'use client'

import { useState, useEffect } from 'react'
import { ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ScrollToTopButton() {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const mainElement = document.querySelector('main')
    
    if (!mainElement) return

    const handleScroll = () => {
      const scrollTop = mainElement.scrollTop
      const windowHeight = window.innerHeight
      setIsVisible(scrollTop > windowHeight)
    }

    mainElement.addEventListener('scroll', handleScroll)

    return () => {
      mainElement.removeEventListener('scroll', handleScroll)
    }
  }, [])

  const scrollToTop = () => {
    const mainElement = document.querySelector('main')
    if (mainElement) {
      mainElement.scrollTo({
        top: 0,
        behavior: 'smooth'
      })
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Button
        onClick={scrollToTop}
        size="icon"
        className="h-12 w-12 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 bg-primary hover:bg-primary/90 text-primary-foreground"
        aria-label="Voltar ao topo"
      >
        <ChevronUp className="h-5 w-5" />
      </Button>
    </div>
  )
}