# Implementação de Comentários e Anexos para Workflows

## 1. Visão Geral

Este documento detalha a implementação de comentários e anexos para o módulo de workflows (works), seguindo exatamente o mesmo padrão já estabelecido para projetos.

## 2. Estrutura do Banco de Dados

### 2.1 Tabelas Existentes

As tabelas `workflow_comments` e `workflow_attachments` já existem no banco de dados (criadas na migração 054). Estrutura atual:

#### workflow_comments
```sql
CREATE TABLE workflow_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES workflow_comments(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### workflow_attachments
```sql
CREATE TABLE workflow_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID REFERENCES workflows(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER CHECK (file_size <= 10485760),
    description TEXT,
    uploaded_by UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2.2 Melhorias Necessárias

Para seguir o padrão dos projetos, as tabelas precisam ser expandidas:

#### Migração para workflow_comments
```sql
-- Adicionar campos para compatibilidade com o padrão de projetos
ALTER TABLE workflow_comments 
ADD COLUMN type VARCHAR(20) DEFAULT 'comment' CHECK (type IN ('comment', 'status_change', 'assignment', 'mention', 'system')),
ADD COLUMN mentioned_users UUID[] DEFAULT '{}',
ADD COLUMN reactions JSONB DEFAULT '{}',
ADD COLUMN is_edited BOOLEAN DEFAULT FALSE,
ADD COLUMN is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN is_internal BOOLEAN DEFAULT FALSE,
ADD COLUMN edited_at TIMESTAMP WITH TIME ZONE;

-- Renomear user_id para author_id para consistência
ALTER TABLE workflow_comments RENAME COLUMN user_id TO author_id;
```

#### Migração para workflow_attachments
```sql
-- Adicionar campos para compatibilidade com o padrão de projetos
ALTER TABLE workflow_attachments 
ADD COLUMN original_filename VARCHAR(255),
ADD COLUMN mime_type VARCHAR(255),
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Renomear campos para consistência
ALTER TABLE workflow_attachments RENAME COLUMN file_name TO filename;
```

## 3. APIs REST

### 3.1 Comentários

#### GET /api/workflows/[id]/comments
**Descrição:** Listar comentários do workflow

**Resposta:**
```typescript
{
  comments: Comment[]
}
```

#### POST /api/workflows/[id]/comments
**Descrição:** Criar novo comentário

**Request Body:**
```typescript
{
  content: string
  type?: 'comment' | 'status_change' | 'assignment' | 'mention' | 'system'
  parent_id?: string
  mentioned_users?: string[]
  is_internal?: boolean
}
```

**Resposta:**
```typescript
{
  comment: Comment
}
```

#### PUT /api/workflows/[id]/comments/[commentId]
**Descrição:** Atualizar comentário

**Request Body:**
```typescript
{
  content?: string
  is_pinned?: boolean
  is_internal?: boolean
  mentioned_users?: string[]
}
```

#### DELETE /api/workflows/[id]/comments/[commentId]
**Descrição:** Deletar comentário

### 3.2 Anexos

#### GET /api/workflows/[id]/attachments
**Descrição:** Listar anexos do workflow

**Resposta:**
```typescript
{
  attachments: Attachment[]
}
```

#### POST /api/workflows/[id]/attachments
**Descrição:** Upload de anexo

**Request:** FormData com:
- file: File
- description: string

**Resposta:**
```typescript
{
  message: string
  attachment: Attachment
}
```

#### GET /api/workflows/[id]/attachments/[attachmentId]
**Descrição:** Download de anexo

#### DELETE /api/workflows/[id]/attachments/[attachmentId]
**Descrição:** Deletar anexo

## 4. Tipos TypeScript

### 4.1 Comentários

```typescript
// src/types/workflow-comment.ts
export type WorkflowCommentType = 'comment' | 'status_change' | 'assignment' | 'mention' | 'system'

export interface WorkflowComment {
  id: string
  workflow_id: string
  type: WorkflowCommentType
  content: string
  author_id: string
  parent_id?: string
  mentioned_users: string[]
  reactions: Record<string, string[]>
  is_edited: boolean
  is_pinned: boolean
  is_internal: boolean
  created_at: string
  updated_at: string
  edited_at?: string
  author: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
  replies?: WorkflowComment[]
}

export interface CreateWorkflowCommentData {
  content: string
  type?: WorkflowCommentType
  parent_id?: string
  mentioned_users?: string[]
  is_internal?: boolean
}

export interface UpdateWorkflowCommentData {
  content?: string
  is_pinned?: boolean
  is_internal?: boolean
  mentioned_users?: string[]
}
```

### 4.2 Anexos

```typescript
// src/types/workflow-attachment.ts
export interface WorkflowAttachment {
  id: string
  workflow_id: string
  filename: string
  original_filename: string
  file_path: string
  file_size: number
  mime_type: string
  file_type: string
  description: string
  uploaded_by: string
  created_at: string
  updated_at: string
  users: {
    full_name: string
    email: string
  }
}
```

## 5. Hooks Personalizados

### 5.1 useWorkflowComments

```typescript
// src/hooks/use-workflow-comments.ts
import { useState, useEffect, useCallback } from 'react'
import { WorkflowComment, CreateWorkflowCommentData, UpdateWorkflowCommentData } from '@/types/workflow-comment'
import { toast } from 'sonner'

interface UseWorkflowCommentsReturn {
  comments: WorkflowComment[]
  loading: boolean
  error: string | null
  createComment: (data: CreateWorkflowCommentData) => Promise<WorkflowComment | null>
  updateComment: (commentId: string, data: UpdateWorkflowCommentData) => Promise<WorkflowComment | null>
  deleteComment: (commentId: string) => Promise<boolean>
  refreshComments: () => Promise<void>
}

export function useWorkflowComments(workflowId: string): UseWorkflowCommentsReturn {
  // Implementação similar ao useComments, mas para workflows
}
```

### 5.2 useWorkflowAttachments

```typescript
// src/hooks/use-workflow-attachments.ts
import { useState, useEffect, useCallback } from 'react'
import { WorkflowAttachment } from '@/types/workflow-attachment'
import { toast } from 'sonner'

interface UseWorkflowAttachmentsReturn {
  attachments: WorkflowAttachment[]
  loading: boolean
  error: string | null
  uploadAttachment: (file: File, description: string) => Promise<WorkflowAttachment | null>
  deleteAttachment: (attachmentId: string) => Promise<boolean>
  downloadAttachment: (attachmentId: string, filename: string) => Promise<void>
  refreshAttachments: () => Promise<void>
}

export function useWorkflowAttachments(workflowId: string): UseWorkflowAttachmentsReturn {
  // Implementação similar aos anexos de projetos, mas para workflows
}
```

## 6. Componentes React

### 6.1 Comentários

#### WorkflowComments
```typescript
// src/components/workflows/workflow-comments.tsx
interface WorkflowCommentsProps {
  workflowId: string
}

export function WorkflowComments({ workflowId }: WorkflowCommentsProps) {
  // Implementação similar ao ProjectComments
}
```

#### WorkflowCommentList
```typescript
// src/components/workflows/workflow-comment-list.tsx
// Reutilizar CommentList existente ou criar versão específica
```

### 6.2 Anexos

#### WorkflowAttachments
```typescript
// src/components/workflows/workflow-attachments.tsx
interface WorkflowAttachmentsProps {
  workflowId: string
}

export function WorkflowAttachments({ workflowId }: WorkflowAttachmentsProps) {
  // Implementação similar ao ProjectAttachments
}
```

## 7. Integração na Interface

### 7.1 Página de Detalhes do Workflow

Adicionar abas para comentários e anexos na página de detalhes do workflow:

```typescript
// src/app/workflows/[id]/page.tsx
import { WorkflowComments } from '@/components/workflows/workflow-comments'
import { WorkflowAttachments } from '@/components/workflows/workflow-attachments'

// Adicionar nas abas:
<TabsContent value="comments">
  <WorkflowComments workflowId={workflow.id} />
</TabsContent>

<TabsContent value="attachments">
  <WorkflowAttachments workflowId={workflow.id} />
</TabsContent>
```

## 8. Políticas de Segurança (RLS)

As políticas RLS já existem para as tabelas de workflows. Verificar se cobrem adequadamente comentários e anexos:

```sql
-- Verificar políticas existentes
\d+ workflow_comments
\d+ workflow_attachments
```

## 9. Testes

### 9.1 Testes de API
- Criar, listar, atualizar e deletar comentários
- Upload, download e deleção de anexos
- Validação de permissões

### 9.2 Testes de Componentes
- Renderização de comentários
- Upload de arquivos
- Interações do usuário

## 10. Considerações de Performance

- Paginação para comentários em workflows com muita atividade
- Lazy loading para anexos grandes
- Cache de dados quando apropriado

## 11. Próximos Passos

1. Executar migrações do banco de dados
2. Implementar APIs REST
3. Criar hooks personalizados
4. Desenvolver componentes React
5. Integrar na interface existente
6. Implementar testes
7. Documentar funcionalidades para usuários finais