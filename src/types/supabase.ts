export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
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
            foreignKeyName: "fk_attachments_project"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          content_html: string | null
          context: Database["public"]["Enums"]["comment_context"]
          context_id: string
          created_at: string | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          is_internal: boolean | null
          is_pinned: boolean | null
          mentioned_users: string[] | null
          parent_id: string | null
          project_id: string | null
          reactions: Json | null
          type: Database["public"]["Enums"]["comment_type"]
          updated_at: string | null
        }
        Insert: {
          author_id: string
          content: string
          content_html?: string | null
          context: Database["public"]["Enums"]["comment_context"]
          context_id: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean | null
          is_pinned?: boolean | null
          mentioned_users?: string[] | null
          parent_id?: string | null
          project_id?: string | null
          reactions?: Json | null
          type?: Database["public"]["Enums"]["comment_type"]
          updated_at?: string | null
        }
        Update: {
          author_id?: string
          content?: string
          content_html?: string | null
          context?: Database["public"]["Enums"]["comment_context"]
          context_id?: string
          created_at?: string | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          is_internal?: boolean | null
          is_pinned?: boolean | null
          mentioned_users?: string[] | null
          parent_id?: string | null
          project_id?: string | null
          reactions?: Json | null
          type?: Database["public"]["Enums"]["comment_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          id: string
          email: string
          full_name: string
          avatar_url: string | null
          bio: string | null
          timezone: string | null
          language: string | null
          theme: string | null
          notification_preferences: Json | null
          is_active: boolean | null
          last_seen_at: string | null
          created_at: string | null
          updated_at: string | null
          deleted_at: string | null
          role: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          avatar_url?: string | null
          bio?: string | null
          timezone?: string | null
          language?: string | null
          theme?: string | null
          notification_preferences?: Json | null
          is_active?: boolean | null
          last_seen_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          role?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          avatar_url?: string | null
          bio?: string | null
          timezone?: string | null
          language?: string | null
          theme?: string | null
          notification_preferences?: Json | null
          is_active?: boolean | null
          last_seen_at?: string | null
          created_at?: string | null
          updated_at?: string | null
          deleted_at?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
    }
    Enums: {
      comment_context: "task" | "project" | "team"
      comment_type: "comment" | "status_change" | "assignment" | "mention" | "system"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Comment = Database['public']['Tables']['comments']['Row']
export type User = Database['public']['Tables']['users']['Row']
export type Attachment = Database['public']['Tables']['attachments']['Row']