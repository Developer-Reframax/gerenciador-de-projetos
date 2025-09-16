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
          id: string
          project_id: string
          user_id: string
          url: string
          name: string
          file_type: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          url: string
          name: string
          file_type?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          url?: string
          name?: string
          file_type?: string | null
          created_at?: string | null
          updated_at?: string | null
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
            foreignKeyName: "attachments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      comments: {
        Row: {
          id: string
          content: string
          created_at: string
          updated_at: string
          user_id: string
          project_id: string
        }
        Insert: {
          id?: string
          content: string
          created_at?: string
          updated_at?: string
          user_id: string
          project_id: string
        }
        Update: {
          id?: string
          content?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
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
    }
    Enums: {
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