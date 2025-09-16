# Estrutura do Frontend - Next.js

Este documento descreve a organização e estrutura de pastas do frontend da aplicação de gerenciamento de projetos.

## Visão Geral da Stack

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Componentes**: Shadcn/ui
- **Autenticação**: Supabase Auth
- **Banco de Dados**: Supabase (PostgreSQL)
- **Estado**: React Context API

## Estrutura de Pastas

```
src/
├── app/                          # App Router do Next.js 14
│   ├── (auth)/                   # Grupo de rotas de autenticação
│   │   ├── login/
│   │   │   └── page.tsx         # Página de login
│   │   ├── signup/
│   │   │   └── page.tsx         # Página de cadastro
│   │   └── layout.tsx           # Layout para rotas de auth
│   ├── (dashboard)/             # Grupo de rotas protegidas
│   │   ├── dashboard/
│   │   │   └── page.tsx         # Dashboard principal
│   │   ├── projects/
│   │   │   ├── page.tsx         # Lista de projetos
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Detalhes do projeto
│   │   ├── teams/
│   │   │   ├── page.tsx         # Gerenciamento de equipes
│   │   │   └── [id]/
│   │   │       └── page.tsx     # Detalhes da equipe
│   │   ├── kanban/
│   │   │   └── page.tsx         # Visualização Kanban
│   │   ├── gantt/
│   │   │   └── page.tsx         # Gráfico de Gantt
│   │   ├── documents/
│   │   │   └── page.tsx         # Gerenciamento de documentos
│   │   └── layout.tsx           # Layout com sidebar/topbar
│   ├── globals.css              # Estilos globais
│   └── layout.tsx               # Layout raiz com providers
├── components/                   # Componentes reutilizáveis
│   ├── ui/                      # Componentes base do Shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── avatar.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── sidebar.tsx
│   │   ├── badge.tsx
│   │   ├── alert.tsx
│   │   └── ...
│   ├── layout/                  # Componentes de layout
│   │   ├── main-layout.tsx      # Layout principal (sidebar + topbar)
│   │   ├── sidebar.tsx          # Componente da sidebar
│   │   └── topbar.tsx           # Componente da topbar
│   ├── forms/                   # Componentes de formulários
│   │   ├── login-form.tsx
│   │   ├── project-form.tsx
│   │   └── task-form.tsx
│   ├── charts/                  # Componentes de gráficos
│   │   ├── gantt-chart.tsx
│   │   └── progress-chart.tsx
│   └── common/                  # Componentes comuns
│       ├── loading.tsx
│       ├── error-boundary.tsx
│       └── confirmation-modal.tsx
├── contexts/                     # Contextos React
│   ├── auth-context.tsx         # Contexto de autenticação
│   ├── theme-context.tsx        # Contexto de tema
│   └── project-context.tsx      # Contexto de projetos
├── hooks/                        # Hooks customizados
│   ├── use-auth.ts              # Hook de autenticação
│   ├── use-projects.ts          # Hook para projetos
│   ├── use-tasks.ts             # Hook para tarefas
│   └── use-mobile.ts            # Hook para detecção mobile
├── lib/                          # Utilitários e configurações
│   ├── supabase.ts              # Cliente Supabase
│   ├── utils.ts                 # Funções utilitárias
│   ├── validations.ts           # Esquemas de validação
│   └── constants.ts             # Constantes da aplicação
├── types/                        # Definições de tipos TypeScript
│   ├── auth.ts                  # Tipos de autenticação
│   ├── project.ts               # Tipos de projetos
│   ├── task.ts                  # Tipos de tarefas
│   └── database.ts              # Tipos do banco de dados
└── middleware.ts                 # Middleware de autenticação
```

## Detalhamento dos Diretórios

### `/app` - App Router

Utiliza o novo App Router do Next.js 14 com grupos de rotas:

- **(auth)**: Rotas de autenticação (login, signup)
- **(dashboard)**: Rotas protegidas da aplicação

### `/components` - Componentes

- **ui/**: Componentes base do Shadcn/ui
- **layout/**: Componentes de estrutura da página
- **forms/**: Formulários específicos
- **charts/**: Componentes de visualização
- **common/**: Componentes reutilizáveis

### `/contexts` - Gerenciamento de Estado

- **auth-context.tsx**: Gerencia estado de autenticação
- **theme-context.tsx**: Gerencia tema claro/escuro
- **project-context.tsx**: Estado global de projetos

### `/hooks` - Hooks Customizados

- **use-auth.ts**: Lógica de autenticação
- **use-projects.ts**: Operações com projetos
- **use-tasks.ts**: Operações com tarefas
- **use-mobile.ts**: Detecção de dispositivos móveis

### `/lib` - Utilitários

- **supabase.ts**: Configuração do cliente Supabase
- **utils.ts**: Funções auxiliares (cn, formatters, etc.)
- **validations.ts**: Esquemas Zod para validação
- **constants.ts**: Constantes da aplicação

### `/types` - Tipos TypeScript

Definições de tipos organizadas por domínio:
- Autenticação
- Projetos e tarefas
- Banco de dados

## Padrões de Desenvolvimento

### 1. Nomenclatura de Arquivos

- **Componentes**: PascalCase (`MainLayout.tsx`)
- **Hooks**: camelCase com prefixo `use` (`useAuth.ts`)
- **Utilitários**: camelCase (`utils.ts`)
- **Tipos**: camelCase (`auth.ts`)

### 2. Estrutura de Componentes

```tsx
"use client" // Se necessário

import { ... } from '...'

interface ComponentProps {
  // Props tipadas
}

export function Component({ ...props }: ComponentProps) {
  // Hooks
  // Estado local
  // Funções
  // Render
}
```

### 3. Gerenciamento de Estado

- **Local**: useState, useReducer
- **Global**: React Context
- **Servidor**: Supabase + React Query (futuro)

### 4. Roteamento

- **App Router**: Estrutura baseada em pastas
- **Grupos**: Organização lógica com `(nome)`
- **Layouts**: Compartilhados entre rotas
- **Middleware**: Proteção de rotas

### 5. Estilização

- **Tailwind CSS**: Classes utilitárias
- **Shadcn/ui**: Componentes base
- **CSS Modules**: Para estilos específicos (se necessário)
- **Variáveis CSS**: Para temas

## Fluxo de Autenticação

1. **Middleware** verifica autenticação
2. **AuthContext** gerencia estado do usuário
3. **Rotas protegidas** redirecionam se não autenticado
4. **Supabase Auth** gerencia sessões

## Próximos Passos

1. **Implementar páginas específicas**:
   - Projetos
   - Equipes
   - Kanban
   - Gantt

2. **Adicionar funcionalidades**:
   - Notificações em tempo real
   - Upload de arquivos
   - Filtros e busca
   - Relatórios

3. **Otimizações**:
   - React Query para cache
   - Lazy loading
   - PWA features
   - Performance monitoring

4. **Testes**:
   - Unit tests (Jest)
   - Integration tests (Testing Library)
   - E2E tests (Playwright)

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build
npm run build

# Adicionar componente Shadcn/ui
npx shadcn@latest add [component]

# Linting
npm run lint

# Testes
npm run test
```

## Configuração do Ambiente

1. Copie `.env.example` para `.env.local`
2. Configure as variáveis do Supabase
3. Execute `npm install`
4. Execute `npm run dev`

Esta estrutura fornece uma base sólida e escalável para o desenvolvimento da aplicação de gerenciamento de projetos.