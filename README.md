# Gerenciador de Projetos v0.1.0

Sistema completo de gerenciamento de projetos e tarefas desenvolvido com Next.js, Supabase e Shadcn/ui.

## 📋 Versão Atual: 0.1.0

Esta é a primeira versão estável do sistema, incluindo:
- ✅ Sistema de autenticação completo
- ✅ Dashboard principal funcional
- ✅ Gerenciamento de projetos (CRUD completo)
- ✅ Gerenciamento de equipes
- ✅ Sistema de comentários
- ✅ Interface responsiva e moderna
- ✅ Integração com Supabase

## 🚀 Tecnologias Utilizadas

- **Frontend**: Next.js 15 + React 18 + TypeScript
- **Styling**: Tailwind CSS + Shadcn/ui
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Autenticação**: Supabase Auth com RLS (Row Level Security)
- **Armazenamento**: Supabase Storage para arquivos e documentos

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router do Next.js
│   ├── (auth)/            # Grupo de rotas de autenticação
│   ├── (dashboard)/       # Grupo de rotas do dashboard
│   ├── api/               # API Routes
│   ├── globals.css        # Estilos globais
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Página inicial
├── components/            # Componentes React
│   └── ui/               # Componentes do Shadcn/ui
├── contexts/             # Contextos React
├── hooks/                # Custom hooks
├── lib/                  # Utilitários e configurações
│   ├── supabase.ts       # Configuração do Supabase
│   └── utils.ts          # Utilitários gerais
├── types/                # Definições de tipos TypeScript
│   ├── database.ts       # Tipos do banco de dados
│   └── index.ts          # Tipos gerais
└── utils/                # Funções utilitárias
```

## ⚙️ Configuração do Ambiente

### 1. Instalação das Dependências

```bash
npm install
```

### 2. Configuração do Supabase

1. Crie uma conta no [Supabase](https://supabase.com/)
2. Crie um novo projeto
3. Copie as credenciais do projeto
4. Renomeie `.env.example` para `.env.local`
5. Preencha as variáveis de ambiente:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Next.js Configuration
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### 3. Executar o Projeto

```bash
npm run dev
```

O projeto estará disponível em `http://localhost:3000`

## 🔧 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Gera a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter
- `npm run type-check` - Verifica os tipos TypeScript

## 📝 Funcionalidades Implementadas

- ✅ Sistema de autenticação com Supabase Auth
- ✅ Dashboard principal com estatísticas
- ✅ Gerenciamento completo de projetos (criar, editar, excluir, visualizar)
- ✅ Gerenciamento de equipes e colaboradores
- ✅ Sistema de comentários em projetos
- ✅ Interface responsiva com Shadcn/ui
- ✅ Filtros e busca de projetos
- ✅ Controle de acesso com RLS (Row Level Security)
- ✅ Upload e gerenciamento de arquivos
- ✅ Notificações em tempo real

## 🔮 Próximas Versões

- ⏳ Sistema de tarefas e subtarefas
- ⏳ Kanban board para gerenciamento visual
- ⏳ Relatórios e analytics avançados
- ⏳ Integração com calendário
- ⏳ Sistema de notificações por email
- ⏳ API pública para integrações

## 🔒 Segurança

- **RLS (Row Level Security)**: Implementado no Supabase para controle de acesso a nível de linha
- **SSR**: Utilização de Server-Side Rendering para proteção de rotas
- **Middleware**: Controle de acesso e redirecionamentos
- **Variáveis de Ambiente**: Chaves e segredos protegidos

## 🤝 Contribuição

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
