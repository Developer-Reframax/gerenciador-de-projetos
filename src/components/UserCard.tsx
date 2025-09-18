'use client'

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { User, USER_ROLES } from '@/types/user'
import { 
  MoreHorizontal,
  Mail, 
  Calendar, 
  Edit, 
  Trash2, 
  UserX,
  UserCheck,
  Shield,
  User as UserIcon
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'

interface UserCardProps {
  user: User
  onEdit?: (user: User) => void
  onDelete?: (userId: string) => void
  onToggleStatus?: (userId: string, isActive: boolean) => void
}

export function UserCard({ user, onEdit, onDelete, onToggleStatus }: UserCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((word: string) => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'editor':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'membro':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'user':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Shield className="h-3 w-3" />
      case 'editor':
        return <Edit className="h-3 w-3" />
      case 'membro':
        return <UserCheck className="h-3 w-3" />
      case 'user':
        return <UserIcon className="h-3 w-3" />
      default:
        return <UserIcon className="h-3 w-3" />
    }
  }



  return (
    <Card className={`transition-all duration-200 hover:shadow-md p-3 ${
      !user.is_active ? 'opacity-60 bg-gray-50' : ''
    }`}>
      <div className="flex items-center gap-3 w-full">
        {/* Avatar */}
        <Avatar className="h-10 w-10 flex-shrink-0">
          <AvatarImage src={user.avatar_url || undefined} alt={user.full_name || undefined} />
          <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
            {getInitials(user.full_name || '')}
          </AvatarFallback>
        </Avatar>
        
        {/* Nome e Email */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">
              {user.full_name}
            </h3>
            {!user.is_active && (
              <Badge variant="secondary" className="text-xs flex-shrink-0">
                Inativo
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Mail className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{user.email}</span>
          </div>
        </div>

        {/* Função */}
        <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
          <span className="text-sm text-muted-foreground">Função:</span>
          <Badge className={`${getRoleColor(user.role || 'user')} flex items-center gap-1 text-xs`}>
            {getRoleIcon(user.role || 'user')}
            <span>{USER_ROLES[(user.role || 'user') as keyof typeof USER_ROLES]}</span>
          </Badge>
        </div>

        {/* Data de criação */}
        <div className="hidden md:flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
          <Calendar className="h-3 w-3" />
          <span>Criado {user.created_at ? formatDistanceToNow(new Date(user.created_at), { 
            addSuffix: true, 
            locale: ptBR 
          }) : 'N/A'}</span>
        </div>

        {/* Menu de opções */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 flex-shrink-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onEdit && (
              <DropdownMenuItem onClick={() => onEdit(user)}>
                <Edit className="mr-2 h-4 w-4" />
                Editar
              </DropdownMenuItem>
            )}
            {onToggleStatus && (
              <DropdownMenuItem 
                onClick={() => onToggleStatus(user.id, !user.is_active)}
              >
                {user.is_active ? (
                  <>
                    <UserX className="mr-2 h-4 w-4" />
                    Desativar
                  </>
                ) : (
                  <>
                    <UserCheck className="mr-2 h-4 w-4" />
                    Ativar
                  </>
                )}
              </DropdownMenuItem>
            )}
            {onDelete && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(user.id)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Informações móveis - mostradas apenas em telas pequenas */}
      <div className="sm:hidden mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <Badge className={`${getRoleColor(user.role || 'user')} flex items-center gap-1 text-xs`}>
            {getRoleIcon(user.role || 'user')}
            <span>{USER_ROLES[(user.role || 'user') as keyof typeof USER_ROLES]}</span>
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>Criado {user.created_at ? formatDistanceToNow(new Date(user.created_at), { 
              addSuffix: true, 
              locale: ptBR 
            }) : 'N/A'}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
