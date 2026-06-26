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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_insights: {
        Row: {
          created_at: string
          id: string
          payload: Json
          period_end: string
          period_start: string
          provider: Database["public"]["Enums"]["insight_provider"]
          requested_by: string
          summary: string
          team_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payload?: Json
          period_end: string
          period_start: string
          provider: Database["public"]["Enums"]["insight_provider"]
          requested_by: string
          summary: string
          team_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payload?: Json
          period_end?: string
          period_start?: string
          provider?: Database["public"]["Enums"]["insight_provider"]
          requested_by?: string
          summary?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_insights_requested_by_team_fkey"
            columns: ["requested_by", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "ai_insights_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          assigned_sales_executive_id: string
          company_name: string
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          created_by: string
          id: string
          last_interaction_at: string | null
          next_follow_up_date: string | null
          notes: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          status: Database["public"]["Enums"]["customer_status"]
          team_id: string
          territory_id: string
          updated_at: string
        }
        Insert: {
          assigned_sales_executive_id: string
          company_name: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by: string
          id?: string
          last_interaction_at?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["customer_status"]
          team_id: string
          territory_id: string
          updated_at?: string
        }
        Update: {
          assigned_sales_executive_id?: string
          company_name?: string
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string
          id?: string
          last_interaction_at?: string | null
          next_follow_up_date?: string | null
          notes?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          status?: Database["public"]["Enums"]["customer_status"]
          team_id?: string
          territory_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_assigned_sales_executive_team_fkey"
            columns: ["assigned_sales_executive_id", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "customers_created_by_team_fkey"
            columns: ["created_by", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "customers_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_territory_team_fkey"
            columns: ["territory_id", "team_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id", "team_id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          assigned_sales_executive_id: string
          completed_at: string | null
          completion_note: string | null
          created_at: string
          created_by: string
          customer_id: string
          due_date: string
          id: string
          planning_note: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          state: Database["public"]["Enums"]["work_item_state"]
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_sales_executive_id: string
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by: string
          customer_id: string
          due_date: string
          id?: string
          planning_note?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          state?: Database["public"]["Enums"]["work_item_state"]
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_sales_executive_id?: string
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by?: string
          customer_id?: string
          due_date?: string
          id?: string
          planning_note?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          state?: Database["public"]["Enums"]["work_item_state"]
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_assigned_sales_executive_team_fkey"
            columns: ["assigned_sales_executive_id", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "follow_ups_created_by_team_fkey"
            columns: ["created_by", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "follow_ups_customer_team_fkey"
            columns: ["customer_id", "team_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "follow_ups_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      monthly_targets: {
        Row: {
          created_at: string
          id: string
          sales_executive_id: string
          target_completions: number
          target_conversions: number
          target_month: string
          target_visits: number
          team_id: string
          territory_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          sales_executive_id: string
          target_completions?: number
          target_conversions?: number
          target_month: string
          target_visits?: number
          team_id: string
          territory_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          sales_executive_id?: string
          target_completions?: number
          target_conversions?: number
          target_month?: string
          target_visits?: number
          team_id?: string
          territory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_targets_sales_executive_team_fkey"
            columns: ["sales_executive_id", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "monthly_targets_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_targets_territory_team_fkey"
            columns: ["territory_id", "team_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id", "team_id"]
          },
        ]
      }
      organization_invitation_events: {
        Row: {
          actor_profile_id: string | null
          event_type: Database["public"]["Enums"]["organization_invitation_event_type"]
          id: string
          invitation_id: string
          occurred_at: string
          organization_id: string
        }
        Insert: {
          actor_profile_id?: string | null
          event_type: Database["public"]["Enums"]["organization_invitation_event_type"]
          id?: string
          invitation_id: string
          occurred_at?: string
          organization_id: string
        }
        Update: {
          actor_profile_id?: string | null
          event_type?: Database["public"]["Enums"]["organization_invitation_event_type"]
          id?: string
          invitation_id?: string
          occurred_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitation_events_actor_profile_fkey"
            columns: ["actor_profile_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_invitation_events_invitation_org_fkey"
            columns: ["invitation_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "organization_invitations"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_profile_id: string | null
          created_at: string
          expires_at: string
          id: string
          invited_by_profile_id: string
          job_title: string | null
          last_sent_at: string | null
          normalized_invited_email: string
          organization_id: string
          resend_count: number
          revoked_at: string | null
          revoked_by_profile_id: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["organization_invitation_status"]
          target_role: Database["public"]["Enums"]["app_role"]
          target_team_id: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_profile_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          invited_by_profile_id: string
          job_title?: string | null
          last_sent_at?: string | null
          normalized_invited_email: string
          organization_id: string
          resend_count?: number
          revoked_at?: string | null
          revoked_by_profile_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["organization_invitation_status"]
          target_role: Database["public"]["Enums"]["app_role"]
          target_team_id: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_profile_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          invited_by_profile_id?: string
          job_title?: string | null
          last_sent_at?: string | null
          normalized_invited_email?: string
          organization_id?: string
          resend_count?: number
          revoked_at?: string | null
          revoked_by_profile_id?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["organization_invitation_status"]
          target_role?: Database["public"]["Enums"]["app_role"]
          target_team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_accepted_profile_fkey"
            columns: ["accepted_profile_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_invitations_inviter_profile_fkey"
            columns: ["invited_by_profile_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_revoker_profile_fkey"
            columns: ["revoked_by_profile_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "organization_id"]
          },
          {
            foreignKeyName: "organization_invitations_team_organization_fkey"
            columns: ["target_team_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          is_organization_admin: boolean
          job_title: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          status: Database["public"]["Enums"]["profile_status"]
          team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id: string
          is_organization_admin?: boolean
          job_title?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          is_organization_admin?: boolean
          job_title?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          status?: Database["public"]["Enums"]["profile_status"]
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_organization_fkey"
            columns: ["team_id", "organization_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id", "organization_id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_sales_executive_id: string
          completed_at: string | null
          completion_note: string | null
          created_at: string
          created_by: string
          due_date: string
          id: string
          planning_note: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          related_customer_id: string | null
          state: Database["public"]["Enums"]["work_item_state"]
          team_id: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_sales_executive_id: string
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by: string
          due_date: string
          id?: string
          planning_note?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          related_customer_id?: string | null
          state?: Database["public"]["Enums"]["work_item_state"]
          team_id: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_sales_executive_id?: string
          completed_at?: string | null
          completion_note?: string | null
          created_at?: string
          created_by?: string
          due_date?: string
          id?: string
          planning_note?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          related_customer_id?: string | null
          state?: Database["public"]["Enums"]["work_item_state"]
          team_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_sales_executive_team_fkey"
            columns: ["assigned_sales_executive_id", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "tasks_created_by_team_fkey"
            columns: ["created_by", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "tasks_related_customer_team_fkey"
            columns: ["related_customer_id", "team_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "tasks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          created_at: string
          id: string
          name: string
          team_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          team_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "territories_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      visit_plans: {
        Row: {
          assigned_sales_executive_id: string
          created_at: string
          created_by: string
          customer_id: string
          id: string
          planning_note: string | null
          priority: Database["public"]["Enums"]["priority_level"]
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["visit_plan_status"]
          team_id: string
          updated_at: string
        }
        Insert: {
          assigned_sales_executive_id: string
          created_at?: string
          created_by: string
          customer_id: string
          id?: string
          planning_note?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["visit_plan_status"]
          team_id: string
          updated_at?: string
        }
        Update: {
          assigned_sales_executive_id?: string
          created_at?: string
          created_by?: string
          customer_id?: string
          id?: string
          planning_note?: string | null
          priority?: Database["public"]["Enums"]["priority_level"]
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["visit_plan_status"]
          team_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "visit_plans_assigned_sales_executive_team_fkey"
            columns: ["assigned_sales_executive_id", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "visit_plans_created_by_team_fkey"
            columns: ["created_by", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "visit_plans_customer_team_fkey"
            columns: ["customer_id", "team_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "visit_plans_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      visits: {
        Row: {
          assigned_sales_executive_id: string
          completed_at: string
          completed_by: string
          created_at: string
          customer_id: string
          id: string
          next_follow_up_action: string | null
          notes: string | null
          outcome: string
          team_id: string
          updated_at: string
          visit_plan_id: string | null
        }
        Insert: {
          assigned_sales_executive_id: string
          completed_at?: string
          completed_by: string
          created_at?: string
          customer_id: string
          id?: string
          next_follow_up_action?: string | null
          notes?: string | null
          outcome: string
          team_id: string
          updated_at?: string
          visit_plan_id?: string | null
        }
        Update: {
          assigned_sales_executive_id?: string
          completed_at?: string
          completed_by?: string
          created_at?: string
          customer_id?: string
          id?: string
          next_follow_up_action?: string | null
          notes?: string | null
          outcome?: string
          team_id?: string
          updated_at?: string
          visit_plan_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "visits_assigned_sales_executive_team_fkey"
            columns: ["assigned_sales_executive_id", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "visits_completed_by_team_fkey"
            columns: ["completed_by", "team_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "visits_customer_team_fkey"
            columns: ["customer_id", "team_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id", "team_id"]
          },
          {
            foreignKeyName: "visits_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visits_visit_plan_team_fkey"
            columns: ["visit_plan_id", "team_id"]
            isOneToOne: false
            referencedRelation: "visit_plans"
            referencedColumns: ["id", "team_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      complete_assigned_follow_up: {
        Args: { p_completion_note: string; p_follow_up_id: string }
        Returns: {
          completed_at: string
          follow_up_id: string
        }[]
      }
      complete_assigned_task: {
        Args: { p_completion_note: string; p_task_id: string }
        Returns: {
          completed_at: string
          task_id: string
        }[]
      }
      complete_assigned_visit_plan: {
        Args: {
          p_next_follow_up_action?: string
          p_notes: string
          p_outcome: string
          p_visit_plan_id: string
        }
        Returns: {
          completed_at: string
          visit_id: string
          visit_plan_id: string
        }[]
      }
      create_assigned_follow_up: {
        Args: {
          p_assigned_sales_executive_id: string
          p_customer_id: string
          p_due_date: string
          p_planning_note?: string
          p_priority?: Database["public"]["Enums"]["priority_level"]
          p_title: string
        }
        Returns: {
          created_at: string
          follow_up_id: string
        }[]
      }
      create_assigned_task: {
        Args: {
          p_assigned_sales_executive_id: string
          p_due_date: string
          p_planning_note?: string
          p_priority?: Database["public"]["Enums"]["priority_level"]
          p_related_customer_id?: string
          p_title: string
        }
        Returns: {
          created_at: string
          task_id: string
        }[]
      }
      create_assigned_visit_plan: {
        Args: {
          p_assigned_sales_executive_id: string
          p_customer_id: string
          p_planning_note?: string
          p_priority?: Database["public"]["Enums"]["priority_level"]
          p_scheduled_date: string
          p_scheduled_time: string
        }
        Returns: {
          created_at: string
          visit_plan_id: string
        }[]
      }
      current_user_is_active: { Args: never; Returns: boolean }
      current_user_is_manager: { Args: never; Returns: boolean }
      current_user_is_manager_for_team: {
        Args: { target_team_id: string }
        Returns: boolean
      }
      current_user_is_organization_admin: { Args: never; Returns: boolean }
      current_user_organization_id: { Args: never; Returns: string }
      current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["app_role"]
      }
      current_user_team_id: { Args: never; Returns: string }
      expire_organization_invitation: {
        Args: { p_actor_profile_id: string; p_invitation_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_status: Database["public"]["Enums"]["organization_invitation_status"]
          last_sent_at: string
          newly_created: boolean
          outcome: string
          resend_count: number
        }[]
      }
      mark_organization_invitation_send_failed: {
        Args: { p_actor_profile_id: string; p_invitation_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_status: Database["public"]["Enums"]["organization_invitation_status"]
          last_sent_at: string
          newly_created: boolean
          outcome: string
          resend_count: number
        }[]
      }
      mark_organization_invitation_sent: {
        Args: { p_actor_profile_id: string; p_invitation_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_status: Database["public"]["Enums"]["organization_invitation_status"]
          last_sent_at: string
          newly_created: boolean
          outcome: string
          resend_count: number
        }[]
      }
      record_organization_invitation_resend_failure: {
        Args: { p_actor_profile_id: string; p_invitation_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_status: Database["public"]["Enums"]["organization_invitation_status"]
          last_sent_at: string
          newly_created: boolean
          outcome: string
          resend_count: number
        }[]
      }
      record_organization_invitation_resend_success: {
        Args: {
          p_actor_profile_id: string
          p_expected_prior_last_sent_at: string
          p_invitation_id: string
        }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_status: Database["public"]["Enums"]["organization_invitation_status"]
          last_sent_at: string
          newly_created: boolean
          outcome: string
          resend_count: number
        }[]
      }
      reserve_organization_invitation: {
        Args: {
          p_actor_profile_id: string
          p_expires_at?: string
          p_invited_email: string
          p_job_title?: string
          p_target_role: Database["public"]["Enums"]["app_role"]
          p_target_team_id: string
        }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_status: Database["public"]["Enums"]["organization_invitation_status"]
          last_sent_at: string
          newly_created: boolean
          outcome: string
          resend_count: number
        }[]
      }
      revoke_organization_invitation: {
        Args: { p_actor_profile_id: string; p_invitation_id: string }
        Returns: {
          expires_at: string
          invitation_id: string
          invitation_status: Database["public"]["Enums"]["organization_invitation_status"]
          last_sent_at: string
          newly_created: boolean
          outcome: string
          resend_count: number
        }[]
      }
      update_own_profile: {
        Args: { p_display_name: string; p_job_title?: string }
        Returns: {
          display_name: string
          job_title: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      app_role: "manager" | "sales_executive"
      customer_status:
        | "prospect"
        | "active"
        | "at_risk"
        | "converted"
        | "inactive"
      insight_provider: "gemini" | "mock"
      organization_invitation_event_type:
        | "created"
        | "sent"
        | "resent"
        | "send_failed"
        | "accepted"
        | "expired"
        | "revoked"
      organization_invitation_status:
        | "pending"
        | "sent"
        | "accepted"
        | "expired"
        | "revoked"
        | "send_failed"
      priority_level: "high" | "medium" | "low"
      profile_status: "invited" | "active" | "disabled"
      visit_plan_status: "pending" | "completed" | "missed" | "cancelled"
      work_item_state: "open" | "completed" | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["manager", "sales_executive"],
      customer_status: [
        "prospect",
        "active",
        "at_risk",
        "converted",
        "inactive",
      ],
      insight_provider: ["gemini", "mock"],
      organization_invitation_event_type: [
        "created",
        "sent",
        "resent",
        "send_failed",
        "accepted",
        "expired",
        "revoked",
      ],
      organization_invitation_status: [
        "pending",
        "sent",
        "accepted",
        "expired",
        "revoked",
        "send_failed",
      ],
      priority_level: ["high", "medium", "low"],
      profile_status: ["invited", "active", "disabled"],
      visit_plan_status: ["pending", "completed", "missed", "cancelled"],
      work_item_state: ["open", "completed", "cancelled"],
    },
  },
} as const
