# Arquitetura do Sistema - Gerenciador de Projetos

## 1. Visão Geral

O sistema de gerenciamento de projetos é estruturado em 7 entidades principais que trabalham em conjunto para fornecer uma solução completa de gestão de projetos e tarefas.

## 2. Entidades Principais

### 2.1 Users (Usuários)
- **Propósito**: Gerenciar informações dos usuários do sistema
- **Características**: Autenticação, perfil, preferências
- **Relacionamentos**: 
  - Pode pertencer a múltiplas Teams (N:N)
  - Pode ser owner/member de Projects (1:N)
  - Pode criar/ser assignee de Tasks (1:N)
  - Pode criar Comments (1:N)

### 2.2 Teams (Equipes)
- **Propósito**: Organizar usuários em grupos de trabalho
- **Características**: Nome, descrição, configurações
- **Relacionamentos**:
  - Possui múltiplos Users (N:N)
  - Pode ter múltiplos Projects (1:N)

### 2.3 Projects (Projetos)
- **Propósito**: Container principal para organização do trabalho
- **Características**: Nome, descrição, datas, status, prioridade
- **Relacionamentos**:
  - Pertence a uma Team (N:1)
  - Possui múltiplas Stages (1:N)
  - Possui múltiplas Tasks (1:N)
  - Possui múltiplos Attachments (1:N)

### 2.4 Stages (Etapas/Colunas)
- **Propósito**: Definir fluxo de trabalho (ex: To Do, In Progress, Done)
- **Características**: Nome, ordem, cor, regras
- **Relacionamentos**:
  - Pertence a um Project (N:1)
  - Possui múltiplas Tasks (1:N)

### 2.5 Tasks (Tarefas)
- **Propósito**: Unidade básica de trabalho
- **Características**: Título, descrição, prioridade, datas, status
- **Relacionamentos**:
  - Pertence a um Project (N:1)
  - Pertence a uma Stage (N:1)
  - Assignee é um User (N:1)
  - Creator é um User (N:1)
  - Possui múltiplos Comments (1:N)
  - Possui múltiplos Attachments (1:N)

### 2.6 Attachments (Anexos)
- **Propósito**: Gerenciar arquivos anexados
- **Características**: Nome, tipo, tamanho, URL
- **Relacionamentos**:
  - Pode pertencer a um Project (N:1)
  - Pode pertencer a uma Task (N:1)
  - Uploaded por um User (N:1)

### 2.7 Comments (Comentários)
- **Propósito**: Comunicação e histórico
- **Características**: Conteúdo, data, tipo
- **Relacionamentos**:
  - Pertence a uma Task (N:1)
  - Criado por um User (N:1)

## 3. Diagrama de Relacionamentos (ERD)

```
Users ──────┐
│           │
│           ├─── team_members ───── Teams
│           │                        │
│           │                        │
│           ├─── projects ─────────── Projects ──┐
│           │    (owner_id)            │         │
│           │                          │         │
│           ├─── tasks ──────────────── Tasks ───┤
│           │    (assignee_id,          │         │
│           │     creator_id)           │         │
│           │                          │         │
│           ├─── comments ──────────────┤         │
│           │                          │         │
│           └─── attachments ──────────┤         │
│                                      │         │
└────────────────────────────────────── Stages ──┘
                                        │
                                        └─── tasks
                                             (stage_id)
```

## 4. Relacionamentos Detalhados

### 4.1 Users ↔ Teams (N:N)
- Tabela intermediária: `team_members`
- Campos: `user_id`, `team_id`, `role`, `joined_at`

### 4.2 Teams → Projects (1:N)
- Chave estrangeira: `team_id` em Projects

### 4.3 Projects → Stages (1:N)
- Chave estrangeira: `project_id` em Stages

### 4.4 Projects → Tasks (1:N)
- Chave estrangeira: `project_id` em Tasks

### 4.5 Stages → Tasks (1:N)
- Chave estrangeira: `stage_id` em Tasks

### 4.6 Users → Tasks (1:N)
- Chaves estrangeiras: `assignee_id`, `creator_id` em Tasks

### 4.7 Tasks → Comments (1:N)
- Chave estrangeira: `task_id` em Comments

### 4.8 Tasks/Projects → Attachments (1:N)
- Chaves estrangeiras: `task_id` ou `project_id` em Attachments

## 5. Regras de Negócio

1. **Segurança**: Row Level Security (RLS) em todas as tabelas
2. **Hierarquia**: User → Team → Project → Stage → Task
3. **Permissões**: Baseadas em membership de team e ownership
4. **Auditoria**: Campos created_at, updated_at em todas as tabelas
5. **Soft Delete**: Usar campo deleted_at para exclusão lógica

## 6. Índices Recomendados

- `users.email` (único)
- `projects.team_id`
- `tasks.project_id`
- `tasks.stage_id`
- `tasks.assignee_id`
- `comments.task_id`
- `attachments.task_id`
- `attachments.project_id`