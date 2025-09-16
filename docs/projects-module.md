# Módulo de Projetos - Documentação

## Visão Geral

O módulo de Projetos é um sistema completo de gerenciamento de projetos integrado ao Supabase, permitindo que usuários criem, editem, visualizem e gerenciem projetos com controle de acesso baseado em equipes.

## Estrutura de Componentes

### 1. Tipos e Interfaces (`/src/types/project.ts`)
```typescript
- Project: Interface principal do projeto
- CreateProjectData: Dados para criação
- UpdateProjectData: Dados para atualização
- PROJECT_STATUS_LABELS: Labels dos status
- PROJECT_PRIORITY_LABELS: Labels das prioridades
- PROJECT_STATUS_COLORS: Cores dos status
- PROJECT_PRIORITY_COLORS: Cores das prioridades
```

### 2. Hooks Personalizados (`/src/hooks/use-projects.ts`)
```typescript
- useProjects(): Lista todos os projetos do usuário
- useProject(id): Busca um projeto específico
- useProjectMutations(): Operações CRUD (create, update, delete)
- useProjectStats(): Estatísticas dos projetos
```

### 3. Componentes React

#### ProjectCard (`/src/components/projects/project-card.tsx`)
- Exibe informações do projeto em formato de card
- Mostra status, prioridade, progresso, datas
- Ações de edição e exclusão
- Integração com hooks de projetos

#### ProjectForm (`/src/components/projects/project-form.tsx`)
- Formulário completo para criação/edição
- Validação com Zod e React Hook Form
- Seleção de equipes
- Campos: nome, descrição, status, prioridade, datas, orçamento

#### ProjectModal (`/src/components/projects/project-modal.tsx`)
- Modal responsivo para formulário
- Suporte a modo criação e edição
- Integração com ProjectForm

### 4. Página Principal (`/src/app/projects/page.tsx`)
- Listagem completa de projetos
- Sistema de filtros (busca, status, prioridade)
- Estatísticas em cards
- Botão para criar novos projetos
- Estados de loading e erro

## Estrutura do Banco de Dados

### Tabela `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'planning',
  priority VARCHAR(10) DEFAULT 'medium',
  owner_id UUID REFERENCES auth.users(id),
  team_id UUID REFERENCES teams(id),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  progress INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela `teams`
```sql
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela `team_members`
```sql
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id),
  user_id UUID REFERENCES auth.users(id),
  role VARCHAR(20) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(team_id, user_id)
);
```

## Políticas de Segurança (RLS)

### Projetos
- **SELECT**: Usuários veem apenas projetos próprios ou de equipes que fazem parte
- **INSERT**: Usuários podem criar projetos (owner_id = auth.uid())
- **UPDATE**: Usuários podem editar projetos próprios ou de equipes
- **DELETE**: Apenas donos podem deletar projetos

### Equipes
- **SELECT**: Usuários veem equipes que são membros
- **INSERT/UPDATE/DELETE**: Apenas donos das equipes

### Membros de Equipe
- **SELECT**: Membros veem outros membros da mesma equipe
- **INSERT/UPDATE/DELETE**: Donos e admins da equipe

## Fluxo de Dados

### 1. Carregamento Inicial
```
Usuário acessa /projects
↓
useProjects() hook é executado
↓
Supabase query com RLS aplicado
↓
Dados filtrados retornados
↓
Componentes renderizados
```

### 2. Criação de Projeto
```
Usuário clica "Novo Projeto"
↓
ProjectModal abre com ProjectForm
↓
Usuário preenche formulário
↓
Validação com Zod
↓
useProjectMutations.createProject()
↓
Supabase INSERT com owner_id = auth.uid()
↓
RLS permite inserção
↓
Lista atualizada automaticamente
↓
Modal fechado
```

### 3. Edição de Projeto
```
Usuário clica "Editar" no ProjectCard
↓
ProjectModal abre com dados preenchidos
↓
Usuário modifica campos
↓
Validação com Zod
↓
useProjectMutations.updateProject()
↓
Supabase UPDATE com verificação RLS
↓
Dados atualizados na lista
↓
Modal fechado
```

### 4. Filtros e Busca
```
Usuário digita na busca ou seleciona filtros
↓
Estado local atualizado (searchTerm, statusFilter, priorityFilter)
↓
filteredProjects recalculado
↓
Lista re-renderizada com filtros aplicados
```

### 5. Integração com Equipes
```
Projeto associado a team_id
↓
RLS permite acesso a membros da equipe
↓
Membros veem projeto na listagem
↓
Permissões baseadas no papel na equipe
```

## Recursos Implementados

✅ **CRUD Completo**
- Criar, ler, atualizar e deletar projetos
- Validação de dados com Zod
- Tratamento de erros

✅ **Interface Responsiva**
- Cards de projeto informativos
- Modal para formulários
- Filtros e busca
- Estados de loading

✅ **Integração Supabase**
- Queries otimizadas com índices
- Row Level Security (RLS)
- Triggers para updated_at
- Relacionamentos com equipes

✅ **Sistema de Permissões**
- Acesso baseado em propriedade
- Compartilhamento via equipes
- Diferentes níveis de acesso

✅ **Estatísticas**
- Total de projetos
- Projetos em andamento
- Projetos concluídos
- Projetos de alta prioridade

## Próximos Passos

1. **Implementar notificações** quando projetos são atualizados
2. **Adicionar comentários** nos projetos
3. **Sistema de anexos** para documentos
4. **Dashboard de métricas** mais avançado
5. **Integração com calendário** para datas importantes
6. **Relatórios** de progresso e performance

## Como Usar

1. **Configurar variáveis de ambiente** no `.env.local`
2. **Executar migrações** do Supabase (já aplicadas)
3. **Acessar `/projects`** na aplicação
4. **Criar primeiro projeto** clicando em "Novo Projeto"
5. **Gerenciar projetos** através da interface

## Comandos Úteis

```bash
# Instalar dependências
npm install

# Executar em desenvolvimento
npm run dev

# Verificar tipos TypeScript
npm run type-check

# Executar testes
npm run test
```