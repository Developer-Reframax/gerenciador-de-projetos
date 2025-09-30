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
          description: string | null
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
          description?: string | null
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
          description?: string | null
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
          strategic_objective_id: string | null
          strategic_pillar_id: string | null
          request_date: string | null
          committee_approval_date: string | null
          real_start_date: string | null
          real_end_date: string | null
          lessons_learned: string | null
          strategic_objective_text: string | null
          owner_name: string | null
          direct_responsibles: string | null
          requesting_area: string[] | null
          planned_budget: number | null
          used_budget: number | null
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
          strategic_objective_id?: string | null
          strategic_pillar_id?: string | null
          request_date?: string | null
          committee_approval_date?: string | null
          real_start_date?: string | null
          real_end_date?: string | null
          lessons_learned?: string | null
          strategic_objective_text?: string | null
          owner_name?: string | null
          direct_responsibles?: string | null
          requesting_area?: string[] | null
          planned_budget?: number | null
          used_budget?: number | null
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
          strategic_objective_id?: string | null
          strategic_pillar_id?: string | null
          request_date?: string | null
          committee_approval_date?: string | null
          real_start_date?: string | null
          real_end_date?: string | null
          lessons_learned?: string | null
          strategic_objective_text?: string | null
          owner_name?: string | null
          direct_responsibles?: string | null
          requesting_area?: string[] | null
          planned_budget?: number | null
          used_budget?: number | null
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
          },
          {
            foreignKeyName: "projects_strategic_objective_id_fkey"
            columns: ["strategic_objective_id"]
            isOneToOne: false
            referencedRelation: "strategic_objectives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_strategic_pillar_id_fkey"
            columns: ["strategic_pillar_id"]
            isOneToOne: false
            referencedRelation: "strategic_pillars"
            referencedColumns: ["id"]
          }
        ]
      }
      project_tags: {
        Row: {
          id: string
          project_id: string
          tag_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          tag_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          tag_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_tags_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
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
      strategic_objectives: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      strategic_pillars: {
        Row: {
          id: string
          name: string
          description: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      tags: {
        Row: {
          id: string
          name: string
          color: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          color?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          color?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      areas: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      project_areas: {
        Row: {
          id: string
          project_id: string
          area_id: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          area_id: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          area_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_areas_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_areas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          }
        ]
      }
      impediments: {
          Row: {
            id: string
            stage_id: string
            description: string
            identification_date: string
            responsible_id: string
            expected_resolution_date?: string
            criticality: Database["public"]["Enums"]["impediment_criticality"]
            status: Database["public"]["Enums"]["impediment_status"]
            created_at?: string
            updated_at?: string
          }
          Insert: {
            id?: string
            stage_id: string
            description: string
            identification_date: string
            responsible_id: string
            expected_resolution_date?: string
            criticality?: Database["public"]["Enums"]["impediment_criticality"]
            status?: Database["public"]["Enums"]["impediment_status"]
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            stage_id?: string
            description?: string
            identification_date?: string
            responsible_id?: string
            expected_resolution_date?: string
            criticality?: Database["public"]["Enums"]["impediment_criticality"]
            status?: Database["public"]["Enums"]["impediment_status"]
            created_at?: string
            updated_at?: string
          }
        Relationships: [
          {
            foreignKeyName: "fk_impediments_stage"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_impediments_responsible"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_deviations: {
        Row: {
          id: string
          project_id: string
          description: string
          evaluation_criteria: string
          impact_type: string
          requires_approval: boolean
          approver_id: string | null
          status: string
          approval_notes: string | null
          created_at: string | null
          approved_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          project_id: string
          description: string
          evaluation_criteria: string
          impact_type: string
          requires_approval?: boolean
          approver_id?: string | null
          status?: string
          approval_notes?: string | null
          created_at?: string | null
          approved_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          description?: string
          evaluation_criteria?: string
          impact_type?: string
          requires_approval?: boolean
          approver_id?: string | null
          status?: string
          approval_notes?: string | null
          created_at?: string | null
          approved_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_deviations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_deviations_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_logs: {
        Row: {
          id: string
          project_id: string
          table_name: string
          record_id: string
          action_type: "INSERT" | "UPDATE" | "DELETE"
          user_id: string | null
          created_at: string
          old_data: Json | null
          new_data: Json | null
          description: string | null
        }
        Insert: {
          id?: string
          project_id: string
          table_name: string
          record_id: string
          action_type: "INSERT" | "UPDATE" | "DELETE"
          user_id?: string | null
          created_at?: string
          old_data?: Json | null
          new_data?: Json | null
          description?: string | null
        }
        Update: {
          id?: string
          project_id?: string
          table_name?: string
          record_id?: string
          action_type?: "INSERT" | "UPDATE" | "DELETE"
          user_id?: string | null
          created_at?: string
          old_data?: Json | null
          new_data?: Json | null
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_logs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      risks: {
          Row: {
            id: string
            stage_id: string
            name: string
            description?: string
            status: Database["public"]["Enums"]["risk_status"]
            impact: Database["public"]["Enums"]["risk_impact"]
            probability: Database["public"]["Enums"]["risk_probability"]
            responsible_id: string
            identification_date: string
            expected_resolution_date?: string
            created_at?: string
            updated_at?: string
          }
          Insert: {
            id?: string
            stage_id: string
            name: string
            description?: string
            status?: Database["public"]["Enums"]["risk_status"]
            impact: Database["public"]["Enums"]["risk_impact"]
            probability: Database["public"]["Enums"]["risk_probability"]
            responsible_id: string
            identification_date: string
            expected_resolution_date?: string
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            stage_id?: string
            name?: string
            description?: string
            status?: Database["public"]["Enums"]["risk_status"]
            impact?: Database["public"]["Enums"]["risk_impact"]
            probability?: Database["public"]["Enums"]["risk_probability"]
            responsible_id?: string
            identification_date?: string
            expected_resolution_date?: string
            created_at?: string
            updated_at?: string
          }
        Relationships: [
          {
            foreignKeyName: "fk_risks_stage"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_risks_responsible"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      project_stakeholders: {
        Row: {
          id: string
          project_id: string
          user_id: string
          role: string
          influence_level: string
          interest_level: string
          communication_frequency: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          user_id: string
          role: string
          influence_level: string
          interest_level: string
          communication_frequency?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          user_id?: string
          role?: string
          influence_level?: string
          interest_level?: string
          communication_frequency?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_stakeholders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_stakeholders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          message: string
          type: string
          priority: "low" | "normal" | "high" | "urgent"
          status_viewer: boolean
          status_email: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          message: string
          type: string
          priority?: "low" | "normal" | "high" | "urgent"
          status_viewer?: boolean
          status_email?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          message?: string
          type?: string
          priority?: "low" | "normal" | "high" | "urgent"
          status_viewer?: boolean
          status_email?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
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
          bio: string | null
          timezone: string | null
          language: string | null
          theme: string | null
          notification_preferences: Json | null
          is_active: boolean
          last_seen_at: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string | null
          language?: string | null
          theme?: string | null
          notification_preferences?: Json | null
          is_active?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          timezone?: string | null
          language?: string | null
          theme?: string | null
          notification_preferences?: Json | null
          is_active?: boolean
          last_seen_at?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      workflows: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          created_by: string | null
          start_date: string | null
          end_date: string | null
          status: string | null
          priority: string | null
          progress_percentage: number
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          created_by?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          priority?: string | null
          progress_percentage?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          created_by?: string | null
          start_date?: string | null
          end_date?: string | null
          status?: string | null
          priority?: string | null
          progress_percentage?: number
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_stages: {
        Row: {
          id: string
          workflow_id: string | null
          name: string
          description: string | null
          position: number
          status: string | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          name: string
          description?: string | null
          position: number
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          name?: string
          description?: string | null
          position?: number
          status?: string | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_stages_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_stages_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_tasks: {
        Row: {
          id: string
          workflow_id: string | null
          stage_id: string | null
          title: string
          description: string | null
          status: string | null
          priority: string | null
          assigned_to: string | null
          due_date: string | null
          position: number
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          stage_id?: string | null
          title: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          position: number
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          stage_id?: string | null
          title?: string
          description?: string | null
          status?: string | null
          priority?: string | null
          assigned_to?: string | null
          due_date?: string | null
          position?: number
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_tasks_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "workflow_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_attachments: {
        Row: {
          id: string
          workflow_id: string | null
          filename: string
          file_path: string
          file_type: string | null
          file_size: number | null
          description: string | null
          uploaded_by: string | null
          created_at: string | null
          original_filename: string | null
          mime_type: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          filename: string
          file_path: string
          file_type?: string | null
          file_size?: number | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          original_filename?: string | null
          mime_type?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          filename?: string
          file_path?: string
          file_type?: string | null
          file_size?: number | null
          description?: string | null
          uploaded_by?: string | null
          created_at?: string | null
          original_filename?: string | null
          mime_type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_attachments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_comments: {
        Row: {
          id: string
          workflow_id: string | null
          author_id: string | null
          content: string
          parent_id: string | null
          created_at: string | null
          updated_at: string | null
          type: string | null
          mentioned_users: string[] | null
          reactions: Json | null
          is_edited: boolean | null
          is_pinned: boolean | null
          is_internal: boolean | null
          edited_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          author_id?: string | null
          content: string
          parent_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          type?: string | null
          mentioned_users?: string[] | null
          reactions?: Json | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          is_internal?: boolean | null
          edited_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          author_id?: string | null
          content?: string
          parent_id?: string | null
          created_at?: string | null
          updated_at?: string | null
          type?: string | null
          mentioned_users?: string[] | null
          reactions?: Json | null
          is_edited?: boolean | null
          is_pinned?: boolean | null
          is_internal?: boolean | null
          edited_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_comments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_comments_user_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "workflow_comments"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_logs: {
        Row: {
          id: string
          workflow_id: string | null
          user_id: string | null
          action: string
          description: string | null
          metadata: Json | null
          old_data: Json | null
          new_data: Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          user_id?: string | null
          action: string
          description?: string | null
          metadata?: Json | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          user_id?: string | null
          action?: string
          description?: string | null
          metadata?: Json | null
          old_data?: Json | null
          new_data?: Json | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_impediments: {
        Row: {
          id: string
          workflow_id: string | null
          task_id: string | null
          title: string
          description: string | null
          status: string | null
          severity: string | null
          reported_by: string | null
          reported_date: string | null
          resolved_date: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          task_id?: string | null
          title: string
          description?: string | null
          status?: string | null
          severity?: string | null
          reported_by?: string | null
          reported_date?: string | null
          resolved_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          task_id?: string | null
          title?: string
          description?: string | null
          status?: string | null
          severity?: string | null
          reported_by?: string | null
          reported_date?: string | null
          resolved_date?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_impediments_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_impediments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "workflow_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_impediments_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      workflow_strategic_info: {
        Row: {
          id: string
          workflow_id: string | null
          strategic_data: Json | null
          metrics: Json | null
          kpis: Json | null
          actual_start_date: string | null
          actual_end_date: string | null
          tags: Json | null
          created_by: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          workflow_id?: string | null
          strategic_data?: Json | null
          metrics?: Json | null
          kpis?: Json | null
          actual_start_date?: string | null
          actual_end_date?: string | null
          tags?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          workflow_id?: string | null
          strategic_data?: Json | null
          metrics?: Json | null
          kpis?: Json | null
          actual_start_date?: string | null
          actual_end_date?: string | null
          tags?: Json | null
          created_by?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_strategic_info_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_strategic_info_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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
      impediment_criticality: "alta" | "media" | "baixa"
      impediment_status: "aberto" | "em_resolucao" | "resolvido" | "cancelado"
      project_priority: "tactical" | "important" | "priority"
      project_role: "owner" | "admin" | "member" | "viewer"
      project_status: "not_started" | "in_progress" | "paused" | "completed" | "cancelled"
      risk_impact: "prazo" | "custo" | "qualidade" | "reputacao"
      risk_probability: "baixa" | "media" | "alta"
      risk_status: "identificado" | "em_analise" | "em_mitigacao" | "monitorado" | "materializado" | "encerrado"
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

// Tipos auxiliares para facilitar o uso
export type Area = Database['public']['Tables']['areas']['Row']
export type AreaInsert = Database['public']['Tables']['areas']['Insert']
export type AreaUpdate = Database['public']['Tables']['areas']['Update']

export type ProjectArea = Database['public']['Tables']['project_areas']['Row']
export type ProjectAreaInsert = Database['public']['Tables']['project_areas']['Insert']
export type ProjectAreaUpdate = Database['public']['Tables']['project_areas']['Update']

export type ProjectStakeholder = Database['public']['Tables']['project_stakeholders']['Row']
export type ProjectStakeholderInsert = Database['public']['Tables']['project_stakeholders']['Insert']
export type ProjectStakeholderUpdate = Database['public']['Tables']['project_stakeholders']['Update']

export type Project = Database['public']['Tables']['projects']['Row']
export type ProjectInsert = Database['public']['Tables']['projects']['Insert']
export type ProjectUpdate = Database['public']['Tables']['projects']['Update']

export type User = Database['public']['Tables']['users']['Row']
export type UserInsert = Database['public']['Tables']['users']['Insert']
export type UserUpdate = Database['public']['Tables']['users']['Update']

export type Notification = Database['public']['Tables']['notifications']['Row']
export type NotificationInsert = Database['public']['Tables']['notifications']['Insert']
export type NotificationUpdate = Database['public']['Tables']['notifications']['Update']

// Risk types
export type Risk = Database['public']['Tables']['risks']['Row']
export type RiskInsert = Database['public']['Tables']['risks']['Insert']
export type RiskUpdate = Database['public']['Tables']['risks']['Update']

// Impediment types
export type Impediment = Database['public']['Tables']['impediments']['Row']
export type ImpedimentInsert = Database['public']['Tables']['impediments']['Insert']
export type ImpedimentUpdate = Database['public']['Tables']['impediments']['Update']

// Tipos específicos para stakeholders
export type StakeholderRole = 'sponsor' | 'stakeholder' | 'user' | 'decision_maker' | 'influencer'
export type InfluenceLevel = 'low' | 'medium' | 'high'
export type InterestLevel = 'low' | 'medium' | 'high'
export type CommunicationFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'as_needed'

// Tipo para stakeholder com informações do usuário
export type StakeholderWithUser = ProjectStakeholder & {
  user: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url'>
}

// Tipo para área com contagem de projetos
export type AreaWithProjectCount = Area & {
  project_count?: number
}

// Tipos para desvios de projeto
export type ProjectDeviation = Database['public']['Tables']['project_deviations']['Row']
export type ProjectDeviationInsert = Database['public']['Tables']['project_deviations']['Insert']
export type ProjectDeviationUpdate = Database['public']['Tables']['project_deviations']['Update']

// Enums específicos para desvios
export type DeviationEvaluationCriteria = 'Fatores externo' | 'Inovação' | 'Medida corretiva' | 'Melhorias' | 'Repriorização'
export type DeviationImpactType = 'Custo/Orçamento' | 'Prazo/Cronograma' | 'Escopo/Entregas' | 'Qualidade' | 'Recursos/Equipe'
export type DeviationStatus = 'Pendente' | 'Aprovado' | 'Rejeitado' | 'Em análise' | 'Implementado'

// Tipo para desvio com informações do usuário
export type ProjectDeviationWithUsers = ProjectDeviation & {
  approver_user?: Pick<User, 'id' | 'full_name' | 'email' | 'avatar_url'> | null
}
