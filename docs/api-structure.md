# Estrutura das APIs e Rotas

Este documento define a estrutura das APIs REST e RPCs para o sistema de gerenciamento de projetos.

## Convenções Gerais

### Padrões de URL
- **REST APIs**: `/api/v1/{resource}`
- **RPCs**: `/api/rpc/{function_name}`
- **Autenticação**: Todas as rotas requerem autenticação via JWT do Supabase

### Códigos de Status HTTP
- `200` - Sucesso
- `201` - Criado com sucesso
- `400` - Erro de validação
- `401` - Não autenticado
- `403` - Não autorizado
- `404` - Não encontrado
- `409` - Conflito
- `500` - Erro interno do servidor

### Formato de Resposta
```json
{
  "success": true,
  "data": {},
  "message": "Operação realizada com sucesso",
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## 1. Users API

### Rotas REST

#### `GET /api/v1/users/profile`
- **Descrição**: Obter perfil do usuário atual
- **Autenticação**: Requerida
- **Resposta**: Dados do perfil do usuário

#### `PUT /api/v1/users/profile`
- **Descrição**: Atualizar perfil do usuário atual
- **Autenticação**: Requerida
- **Body**:
```json
{
  "full_name": "string",
  "bio": "string",
  "avatar_url": "string",
  "timezone": "string",
  "language": "string",
  "notification_preferences": {}
}
```

#### `GET /api/v1/users/search`
- **Descrição**: Buscar usuários por email ou nome
- **Autenticação**: Requerida
- **Query Params**: `q` (string), `limit` (number)
- **Resposta**: Lista de usuários encontrados

### RPCs

#### `POST /api/rpc/update_last_seen`
- **Descrição**: Atualizar último acesso do usuário
- **Autenticação**: Requerida

#### `POST /api/rpc/get_user_stats`
- **Descrição**: Obter estatísticas do usuário
- **Autenticação**: Requerida
- **Resposta**: Estatísticas de projetos, tarefas, etc.

---

## 2. Teams API

### Rotas REST

#### `GET /api/v1/teams`
- **Descrição**: Listar equipes do usuário
- **Autenticação**: Requerida
- **Query Params**: `page`, `limit`

#### `POST /api/v1/teams`
- **Descrição**: Criar nova equipe
- **Autenticação**: Requerida
- **Body**:
```json
{
  "name": "string",
  "description": "string",
  "avatar_url": "string",
  "is_private": "boolean"
}
```

#### `GET /api/v1/teams/{id}`
- **Descrição**: Obter detalhes de uma equipe
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `PUT /api/v1/teams/{id}`
- **Descrição**: Atualizar equipe
- **Autenticação**: Requerida (apenas owner/admin)
- **Params**: `id` (UUID)

#### `DELETE /api/v1/teams/{id}`
- **Descrição**: Excluir equipe
- **Autenticação**: Requerida (apenas owner)
- **Params**: `id` (UUID)

#### `GET /api/v1/teams/{id}/members`
- **Descrição**: Listar membros da equipe
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `POST /api/v1/teams/{id}/members`
- **Descrição**: Adicionar membro à equipe
- **Autenticação**: Requerida (apenas admin/owner)
- **Body**:
```json
{
  "user_email": "string",
  "role": "member|admin"
}
```

#### `PUT /api/v1/teams/{id}/members/{userId}`
- **Descrição**: Atualizar papel do membro
- **Autenticação**: Requerida (apenas admin/owner)
- **Body**:
```json
{
  "role": "member|admin"
}
```

#### `DELETE /api/v1/teams/{id}/members/{userId}`
- **Descrição**: Remover membro da equipe
- **Autenticação**: Requerida (apenas admin/owner)

### RPCs

#### `POST /api/rpc/invite_team_member`
- **Descrição**: Enviar convite para equipe
- **Body**:
```json
{
  "team_id": "uuid",
  "email": "string",
  "role": "string"
}
```

#### `POST /api/rpc/accept_team_invitation`
- **Descrição**: Aceitar convite para equipe
- **Body**:
```json
{
  "invitation_token": "string"
}
```

---

## 3. Projects API

### Rotas REST

#### `GET /api/v1/projects`
- **Descrição**: Listar projetos do usuário
- **Autenticação**: Requerida
- **Query Params**: `team_id`, `status`, `page`, `limit`

#### `POST /api/v1/projects`
- **Descrição**: Criar novo projeto
- **Autenticação**: Requerida
- **Body**:
```json
{
  "name": "string",
  "description": "string",
  "team_id": "uuid",
  "start_date": "date",
  "end_date": "date",
  "priority": "low|medium|high",
  "is_template": "boolean"
}
```

#### `GET /api/v1/projects/{id}`
- **Descrição**: Obter detalhes do projeto
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `PUT /api/v1/projects/{id}`
- **Descrição**: Atualizar projeto
- **Autenticação**: Requerida (apenas colaboradores)
- **Params**: `id` (UUID)

#### `DELETE /api/v1/projects/{id}`
- **Descrição**: Excluir projeto
- **Autenticação**: Requerida (apenas owner)
- **Params**: `id` (UUID)

#### `GET /api/v1/projects/{id}/collaborators`
- **Descrição**: Listar colaboradores do projeto
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `POST /api/v1/projects/{id}/collaborators`
- **Descrição**: Adicionar colaborador ao projeto
- **Autenticação**: Requerida (apenas owner/admin)
- **Body**:
```json
{
  "user_id": "uuid",
  "role": "viewer|editor|admin"
}
```

### RPCs

#### `POST /api/rpc/duplicate_project`
- **Descrição**: Duplicar projeto
- **Body**:
```json
{
  "project_id": "uuid",
  "new_name": "string",
  "include_tasks": "boolean"
}
```

#### `POST /api/rpc/archive_project`
- **Descrição**: Arquivar/desarquivar projeto
- **Body**:
```json
{
  "project_id": "uuid",
  "archived": "boolean"
}
```

---

## 4. Stages API

### Rotas REST

#### `GET /api/v1/projects/{projectId}/stages`
- **Descrição**: Listar etapas do projeto
- **Autenticação**: Requerida
- **Params**: `projectId` (UUID)

#### `POST /api/v1/projects/{projectId}/stages`
- **Descrição**: Criar nova etapa
- **Autenticação**: Requerida
- **Body**:
```json
{
  "name": "string",
  "description": "string",
  "color": "string",
  "position": "number",
  "task_limit": "number"
}
```

#### `PUT /api/v1/stages/{id}`
- **Descrição**: Atualizar etapa
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `DELETE /api/v1/stages/{id}`
- **Descrição**: Excluir etapa
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

### RPCs

#### `POST /api/rpc/reorder_stages`
- **Descrição**: Reordenar etapas do projeto
- **Body**:
```json
{
  "project_id": "uuid",
  "stage_orders": [
    {"stage_id": "uuid", "position": 1},
    {"stage_id": "uuid", "position": 2}
  ]
}
```

---

## 5. Tasks API

### Rotas REST

#### `GET /api/v1/projects/{projectId}/tasks`
- **Descrição**: Listar tarefas do projeto
- **Autenticação**: Requerida
- **Query Params**: `stage_id`, `assignee_id`, `status`, `priority`, `page`, `limit`

#### `POST /api/v1/projects/{projectId}/tasks`
- **Descrição**: Criar nova tarefa
- **Autenticação**: Requerida
- **Body**:
```json
{
  "title": "string",
  "description": "string",
  "stage_id": "uuid",
  "assignee_id": "uuid",
  "priority": "low|medium|high|urgent",
  "due_date": "date",
  "estimated_hours": "number",
  "tags": ["string"]
}
```

#### `GET /api/v1/tasks/{id}`
- **Descrição**: Obter detalhes da tarefa
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `PUT /api/v1/tasks/{id}`
- **Descrição**: Atualizar tarefa
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `DELETE /api/v1/tasks/{id}`
- **Descrição**: Excluir tarefa
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `GET /api/v1/tasks/{id}/watchers`
- **Descrição**: Listar observadores da tarefa
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `POST /api/v1/tasks/{id}/watchers`
- **Descrição**: Adicionar observador à tarefa
- **Autenticação**: Requerida
- **Body**:
```json
{
  "user_id": "uuid"
}
```

#### `DELETE /api/v1/tasks/{id}/watchers/{userId}`
- **Descrição**: Remover observador da tarefa
- **Autenticação**: Requerida

### RPCs

#### `POST /api/rpc/move_task`
- **Descrição**: Mover tarefa entre etapas
- **Body**:
```json
{
  "task_id": "uuid",
  "new_stage_id": "uuid",
  "new_position": "number"
}
```

#### `POST /api/rpc/assign_task`
- **Descrição**: Atribuir tarefa a usuário
- **Body**:
```json
{
  "task_id": "uuid",
  "assignee_id": "uuid"
}
```

#### `POST /api/rpc/update_task_status`
- **Descrição**: Atualizar status da tarefa
- **Body**:
```json
{
  "task_id": "uuid",
  "status": "todo|in_progress|review|done|cancelled"
}
```

#### `POST /api/rpc/get_task_statistics`
- **Descrição**: Obter estatísticas das tarefas
- **Body**:
```json
{
  "project_id": "uuid",
  "user_id": "uuid"
}
```

---

## 6. Attachments API

### Rotas REST

#### `GET /api/v1/attachments`
- **Descrição**: Listar anexos por contexto
- **Autenticação**: Requerida
- **Query Params**: `context`, `context_id`, `file_type`, `page`, `limit`

#### `POST /api/v1/attachments`
- **Descrição**: Upload de anexo
- **Autenticação**: Requerida
- **Content-Type**: `multipart/form-data`
- **Body**:
```
file: File
context: string (task|project|comment)
context_id: uuid
description: string (opcional)
is_public: boolean (opcional)
```

#### `GET /api/v1/attachments/{id}`
- **Descrição**: Obter detalhes do anexo
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `GET /api/v1/attachments/{id}/download`
- **Descrição**: Download do anexo
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `PUT /api/v1/attachments/{id}`
- **Descrição**: Atualizar metadados do anexo
- **Autenticação**: Requerida
- **Body**:
```json
{
  "description": "string",
  "is_public": "boolean"
}
```

#### `DELETE /api/v1/attachments/{id}`
- **Descrição**: Excluir anexo
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `GET /api/v1/attachments/{id}/versions`
- **Descrição**: Listar versões do anexo
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `POST /api/v1/attachments/{id}/versions`
- **Descrição**: Upload de nova versão
- **Autenticação**: Requerida
- **Content-Type**: `multipart/form-data`

### RPCs

#### `POST /api/rpc/generate_attachment_thumbnail`
- **Descrição**: Gerar thumbnail para anexo
- **Body**:
```json
{
  "attachment_id": "uuid",
  "size": "small|medium|large"
}
```

#### `POST /api/rpc/get_attachment_stats`
- **Descrição**: Obter estatísticas de anexos
- **Body**:
```json
{
  "context": "string",
  "context_id": "uuid"
}
```

---

## 7. Comments API

### Rotas REST

#### `GET /api/v1/comments`
- **Descrição**: Listar comentários por contexto
- **Autenticação**: Requerida
- **Query Params**: `context`, `context_id`, `parent_id`, `page`, `limit`

#### `POST /api/v1/comments`
- **Descrição**: Criar novo comentário
- **Autenticação**: Requerida
- **Body**:
```json
{
  "context": "task|project|team",
  "context_id": "uuid",
  "content": "string",
  "parent_id": "uuid",
  "mentioned_users": ["uuid"],
  "is_internal": "boolean"
}
```

#### `GET /api/v1/comments/{id}`
- **Descrição**: Obter detalhes do comentário
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `PUT /api/v1/comments/{id}`
- **Descrição**: Atualizar comentário
- **Autenticação**: Requerida (apenas autor)
- **Body**:
```json
{
  "content": "string",
  "mentioned_users": ["uuid"]
}
```

#### `DELETE /api/v1/comments/{id}`
- **Descrição**: Excluir comentário
- **Autenticação**: Requerida (apenas autor)
- **Params**: `id` (UUID)

#### `GET /api/v1/comments/{id}/replies`
- **Descrição**: Listar respostas do comentário
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

### RPCs

#### `POST /api/rpc/add_comment_reaction`
- **Descrição**: Adicionar/remover reação ao comentário
- **Body**:
```json
{
  "comment_id": "uuid",
  "emoji": "string"
}
```

#### `POST /api/rpc/pin_comment`
- **Descrição**: Fixar/desfixar comentário
- **Body**:
```json
{
  "comment_id": "uuid",
  "pinned": "boolean"
}
```

#### `POST /api/rpc/mark_mentions_as_read`
- **Descrição**: Marcar menções como lidas
- **Body**:
```json
{
  "comment_ids": ["uuid"]
}
```

#### `POST /api/rpc/get_comment_stats`
- **Descrição**: Obter estatísticas de comentários
- **Body**:
```json
{
  "context": "string",
  "context_id": "uuid"
}
```

---

## 8. Notifications API

### Rotas REST

#### `GET /api/v1/notifications`
- **Descrição**: Listar notificações do usuário
- **Autenticação**: Requerida
- **Query Params**: `type`, `is_read`, `page`, `limit`

#### `PUT /api/v1/notifications/{id}/read`
- **Descrição**: Marcar notificação como lida
- **Autenticação**: Requerida
- **Params**: `id` (UUID)

#### `PUT /api/v1/notifications/read-all`
- **Descrição**: Marcar todas as notificações como lidas
- **Autenticação**: Requerida

### RPCs

#### `POST /api/rpc/get_notification_count`
- **Descrição**: Obter contagem de notificações não lidas
- **Autenticação**: Requerida

---

## 9. Search API

### RPCs

#### `POST /api/rpc/global_search`
- **Descrição**: Busca global no sistema
- **Body**:
```json
{
  "query": "string",
  "filters": {
    "types": ["project", "task", "comment"],
    "team_id": "uuid",
    "project_id": "uuid"
  },
  "limit": "number"
}
```

---

## 10. Analytics API

### RPCs

#### `POST /api/rpc/get_project_analytics`
- **Descrição**: Obter analytics do projeto
- **Body**:
```json
{
  "project_id": "uuid",
  "date_range": {
    "start": "date",
    "end": "date"
  }
}
```

#### `POST /api/rpc/get_team_analytics`
- **Descrição**: Obter analytics da equipe
- **Body**:
```json
{
  "team_id": "uuid",
  "date_range": {
    "start": "date",
    "end": "date"
  }
}
```

---

## Implementação no Next.js

### Estrutura de Pastas
```
app/
├── api/
│   ├── v1/
│   │   ├── users/
│   │   │   ├── profile/
│   │   │   │   └── route.ts
│   │   │   └── search/
│   │   │       └── route.ts
│   │   ├── teams/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       └── members/
│   │   │           └── route.ts
│   │   ├── projects/
│   │   │   ├── route.ts
│   │   │   └── [id]/
│   │   │       ├── route.ts
│   │   │       ├── stages/
│   │   │       │   └── route.ts
│   │   │       └── tasks/
│   │   │           └── route.ts
│   │   ├── tasks/
│   │   │   └── [id]/
│   │   │       └── route.ts
│   │   ├── attachments/
│   │   │   └── route.ts
│   │   └── comments/
│   │       └── route.ts
│   └── rpc/
│       ├── move_task/
│       │   └── route.ts
│       ├── add_comment_reaction/
│       │   └── route.ts
│       └── global_search/
│           └── route.ts
```

### Exemplo de Implementação

#### `/app/api/v1/tasks/[id]/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assignee:assignee_id(id, full_name, avatar_url),
        project:project_id(id, name),
        stage:stage_id(id, name, color)
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Tarefa não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const body = await request.json()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { data: task, error } = await supabase
      .from('tasks')
      .update(body)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Erro ao atualizar tarefa' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data: task,
      message: 'Tarefa atualizada com sucesso'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

#### `/app/api/rpc/move_task/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { task_id, new_stage_id, new_position } = await request.json()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Não autenticado' },
        { status: 401 }
      )
    }

    // Chamar função RPC do Supabase
    const { data, error } = await supabase.rpc('move_task_to_stage', {
      p_task_id: task_id,
      p_new_stage_id: new_stage_id,
      p_new_position: new_position
    })

    if (error) {
      return NextResponse.json(
        { success: false, message: 'Erro ao mover tarefa' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Tarefa movida com sucesso'
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
```

### Middleware de Autenticação

#### `/lib/api-middleware.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function withAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    try {
      const supabase = createRouteHandlerClient({ cookies })
      
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return NextResponse.json(
          { success: false, message: 'Não autenticado' },
          { status: 401 }
        )
      }

      // Adicionar usuário ao contexto
      context.user = user
      context.supabase = supabase
      
      return handler(request, context)
    } catch (error) {
      return NextResponse.json(
        { success: false, message: 'Erro de autenticação' },
        { status: 401 }
      )
    }
  }
}
```

### Cliente API (Frontend)

#### `/lib/api-client.ts`
```typescript
class ApiClient {
  private baseUrl: string
  private supabase: any

  constructor(supabase: any) {
    this.baseUrl = '/api/v1'
    this.supabase = supabase
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const { data: { session } } = await this.supabase.auth.getSession()
    
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
        ...options.headers,
      },
    })

    return response.json()
  }

  // Users
  async getProfile() {
    return this.request('/users/profile')
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // Tasks
  async getTasks(projectId: string, params?: any) {
    const query = new URLSearchParams(params).toString()
    return this.request(`/projects/${projectId}/tasks?${query}`)
  }

  async createTask(projectId: string, data: any) {
    return this.request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateTask(taskId: string, data: any) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  // RPCs
  async moveTask(taskId: string, newStageId: string, newPosition: number) {
    return this.request('/rpc/move_task', {
      method: 'POST',
      body: JSON.stringify({
        task_id: taskId,
        new_stage_id: newStageId,
        new_position: newPosition,
      }),
    })
  }
}

export default ApiClient
```

Esta estrutura de APIs fornece uma base sólida e escalável para o sistema de gerenciamento de projetos, seguindo as melhores práticas de REST e RPC, com autenticação segura e integração completa com o Supabase.