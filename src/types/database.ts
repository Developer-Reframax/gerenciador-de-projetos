export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      attachments: {
        Row: {
          created_at: string | null
          file_path: string
          file_size: number
          file_type: string | null
          filename: string
          id: string
          mime_type: string
          original_filename: string
          project_id: string
          updated_at: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          file_path: string
          file_size: number
          file_type?: string | null
          filename: string
          id?: string
          mime_type: string
          original_filename: string
          project_id: string
          updated_at?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          file_path?: string
          file_size?: number
          file_type?: string | null
          filename?: string
          id?: string
          mime_type?: string
          original_filename?: string
          project_id?: string
          updated_at?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "attachments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          context: Database["public"]["Enums"]["comment_context"]
          context_id: string
          type: Database["public"]["Enums"]["comment_type"]
          content: string
          content_html: string | null
          author_id: string
          parent_id: string | null
          mentioned_users: string[] | null
          is_edited: boolean | null
          is_pinned: boolean | null
          is_internal: boolean | null
          reactions: Json | null
          created_at: string | null
          updated_at: string | null
          edited_at: string | null
          project_id: string | null
        }
        Insert: {
          id?: string
          context: Database["public"]["Enums"]["comment_context"]
          context_id: string
          type?: Database["public"]["Enums"]["comment_type"]
          content: string
          content_html?: string | null
          author_id: string
          parent_id?: string | null
          mentioned_users?: string[] | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          is_internal?: boolean | null
          reactions?: Json | null
          created_at?: string | null
          updated_at?: string | null
          edited_at?: string | null
          project_id?: string | null
        }
        Update: {
          id?: string
          context?: Database["public"]["Enums"]["comment_context"]
          context_id?: string
          type?: Database["public"]["Enums"]["comment_type"]
          content?: string
          content_html?: string | null
          author_id?: string
          parent_id?: string | null
          mentioned_users?: string[] | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          is_internal?: boolean | null
          reactions?: Json | null
          created_at?: string | null
          updated_at?: string | null
          edited_at?: string | null
          project_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          }
        ]
      }
      project_collaborators: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: Database["public"]["Enums"]["project_role"]
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role?: Database["public"]["Enums"]["project_role"]
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["project_role"]
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_collaborators_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string | null
          status: Database["public"]["Enums"]["project_status"]
          priority: Database["public"]["Enums"]["project_priority"]
          owner_id: string
          team_id: string | null
          start_date: string | null
          due_date: string | null
          budget: number | null
          progress_percentage: number | null
          created_at: string | null
          updated_at: string | null
          completed_at: string | null
          visibility: string | null
          settings: Json | null
          total_tasks: number | null
          completed_tasks: number | null
          color: string | null
          cover_image_url: string | null
          tags: string[] | null
          is_active: boolean | null
          deleted_at: string | null
          requester_id: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          priority?: Database["public"]["Enums"]["project_priority"]
          owner_id: string
          team_id?: string | null
          start_date?: string | null
          due_date?: string | null
          budget?: number | null
          progress_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
          visibility?: string | null
          settings?: Json | null
          total_tasks?: number | null
          completed_tasks?: number | null
          color?: string | null
          cover_image_url?: string | null
          tags?: string[] | null
          is_active?: boolean | null
          deleted_at?: string | null
          requester_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          priority?: Database["public"]["Enums"]["project_priority"]
          owner_id?: string
          team_id?: string | null
          start_date?: string | null
          due_date?: string | null
          budget?: number | null
          progress_percentage?: number | null
          created_at?: string | null
          updated_at?: string | null
          completed_at?: string | null
          visibility?: string | null
          settings?: Json | null
          total_tasks?: number | null
          completed_tasks?: number | null
          color?: string | null
          cover_image_url?: string | null
          tags?: string[] | null
          is_active?: boolean | null
          deleted_at?: string | null
          requester_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          }
        ]
      }
      stages: {
        Row: {
          id: string
          name: string
          description: string | null
          project_id: string
          position: number
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          project_id: string
          position?: number
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          project_id?: string
          position?: number
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          }
        ]
      }
      tasks: {
        Row: {
          id: string
          title: string
          description: string | null
          status: Database["public"]["Enums"]["task_status"]
          priority: Database["public"]["Enums"]["task_priority"]
          assignee_id: string | null
          reporter_id: string
          project_id: string
          stage_id: string | null
          parent_task_id: string | null
          start_date: string | null
          due_date: string | null
          completed_at: string | null
          estimated_hours: number | null
          actual_hours: number | null
          story_points: number | null
          position: number | null
          is_milestone: boolean | null
          is_template: boolean | null
          custom_fields: Json | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          assignee_id?: string | null
          reporter_id: string
          project_id: string
          stage_id?: string | null
          parent_task_id?: string | null
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          story_points?: number | null
          position?: number | null
          is_milestone?: boolean | null
          is_template?: boolean | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          priority?: Database["public"]["Enums"]["task_priority"]
          assignee_id?: string | null
          reporter_id?: string
          project_id?: string
          stage_id?: string | null
          parent_task_id?: string | null
          start_date?: string | null
          due_date?: string | null
          completed_at?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          story_points?: number | null
          position?: number | null
          is_milestone?: boolean | null
          is_template?: boolean | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          }
        ]
      }
      task_status_history: {
        Row: {
          id: string
          task_id: string
          from_status: Database["public"]["Enums"]["task_status"] | null
          to_status: Database["public"]["Enums"]["task_status"]
          from_stage_id: string | null
          to_stage_id: string | null
          changed_by: string
          time_in_previous_status: string | null
          notes: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          from_status?: Database["public"]["Enums"]["task_status"] | null
          to_status: Database["public"]["Enums"]["task_status"]
          from_stage_id?: string | null
          to_stage_id?: string | null
          changed_by: string
          time_in_previous_status?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          from_status?: Database["public"]["Enums"]["task_status"] | null
          to_status?: Database["public"]["Enums"]["task_status"]
          from_stage_id?: string | null
          to_stage_id?: string | null
          changed_by?: string
          time_in_previous_status?: string | null
          notes?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_status_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_history_from_stage_id_fkey"
            columns: ["from_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_history_to_stage_id_fkey"
            columns: ["to_stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      team_members: {
        Row: {
          id: string
          team_id: string
          user_id: string
          role: Database["public"]["Enums"]["team_role"]
          joined_at: string | null
          permissions: Json | null
          invited_by: string | null
          invited_at: string | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
        }
        Insert: {
          id?: string
          team_id: string
          user_id: string
          role?: Database["public"]["Enums"]["team_role"]
          joined_at?: string | null
          permissions?: Json | null
          invited_by?: string | null
          invited_at?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Update: {
          id?: string
          team_id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["team_role"]
          joined_at?: string | null
          permissions?: Json | null
          invited_by?: string | null
          invited_at?: string | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      teams: {
        Row: {
          id: string
          name: string
          description: string | null
          owner_id: string
          created_at: string
          updated_at: string
          settings: Json | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          owner_id: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          owner_id?: string
          created_at?: string
          updated_at?: string
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "teams_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: Database["public"]["Enums"]["user_role"]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      reorder_tasks: {
        Args: {
          task_id: string
          new_stage_id: string
          new_order_index: number
        }
        Returns: undefined
      }
      get_gantt_projects: {
        Args: {
          p_status?: string[] | null
          p_priority?: string[] | null
          p_team_id?: string | null
          p_start_date?: string | null
          p_end_date?: string | null
        }
        Returns: {
          id: string
          name: string
          description: string
          status: string
          priority: string
          start_date: string
          due_date: string
          progress_percentage: number
          owner_name: string
          team_name: string
          total_tasks: number
          completed_tasks: number
        }[]
      }
      get_kanban_project_status_data: {
        Args: {
          p_team_id: string
          p_priority_filter?: string | null
        }
        Returns: {
          status: string
          status_label: string
          projects: {
            id: string
            name: string
            description: string
            priority: string
            due_date: string
            progress_percentage: number
            owner_name: string
            total_tasks: number
            completed_tasks: number
          }[]
        }[]
      }
      get_kanban_assignee_data: {
        Args: {
          p_team_id: string
          p_priority_filter?: string | null
        }
        Returns: {
          assignee_id: string
          assignee_name: string
          assignee_avatar: string
          tasks: {
            id: string
            title: string
            description: string
            priority: string
            status: string
            due_date: string
            project_name: string
          }[]
        }[]
      }
    }
    Enums: {
      comment_context: "task" | "project" | "team"
      comment_type: "comment" | "status_change" | "assignment" | "mention" | "system"
      project_priority: "low" | "medium" | "high" | "urgent"
      project_role: "owner" | "admin" | "member" | "viewer"
      project_status: "planning" | "active" | "on_hold" | "completed" | "cancelled"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status: "todo" | "in_progress" | "review" | "blocked" | "completed" | "cancelled"
      team_role: "owner" | "admin" | "member"
      user_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}