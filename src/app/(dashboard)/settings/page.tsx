'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { useTheme } from '@/contexts/ThemeContext'
import { Settings, Moon, Sun } from 'lucide-react'
import { toast } from 'react-hot-toast'

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [isLoading, setIsLoading] = useState(false)

  const handleThemeChange = async (isDark: boolean) => {
    try {
      setIsLoading(true)
      const newTheme = isDark ? 'dark' : 'light'
      setTheme(newTheme)
      
      toast.success(`Tema alterado para ${newTheme === 'dark' ? 'escuro' : 'claro'}`)
    } catch (error) {
      console.error('Erro ao alterar tema:', error)
      toast.error('Erro ao alterar tema')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Configurações</h1>
        </div>
        <p className="text-muted-foreground">
          Gerencie as configurações da sua conta e preferências do sistema.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Seção de Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {theme === 'dark' ? (
                <Moon className="h-5 w-5" />
              ) : (
                <Sun className="h-5 w-5" />
              )}
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize a aparência da interface do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode" className="text-base font-medium">
                  Modo Escuro
                </Label>
                <p className="text-sm text-muted-foreground">
                  Alterna entre tema claro e escuro da interface.
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={handleThemeChange}
                disabled={isLoading}
              />
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  <span>Claro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  <span>Escuro</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações sobre futuras configurações */}
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-muted-foreground">Mais Configurações</CardTitle>
            <CardDescription>
              Novas opções de configuração serão adicionadas em breve.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Estamos trabalhando para adicionar mais opções de personalização, 
              como configurações de notificação, preferências de idioma e muito mais.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}