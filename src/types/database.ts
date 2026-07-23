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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          data: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          lead_id: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          data?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      apartment_images: {
        Row: {
          apartment_id: string
          created_at: string | null
          id: string
          order_index: number | null
          type: string | null
          url: string
        }
        Insert: {
          apartment_id: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          type?: string | null
          url: string
        }
        Update: {
          apartment_id?: string
          created_at?: string | null
          id?: string
          order_index?: number | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "apartment_images_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
        ]
      }
      apartments: {
        Row: {
          area: number | null
          available_from: string | null
          balcony: boolean | null
          bedrooms: number | null
          block_id: string | null
          code: string
          created_at: string | null
          currency: string | null
          facing: string | null
          floor_id: string | null
          floor_plan: string | null
          id: string
          installment_eligible: boolean
          parking: boolean | null
          price: number | null
          status: string | null
          updated_at: string | null
          view_count: number
        }
        Insert: {
          area?: number | null
          available_from?: string | null
          balcony?: boolean | null
          bedrooms?: number | null
          block_id?: string | null
          code: string
          created_at?: string | null
          currency?: string | null
          facing?: string | null
          floor_id?: string | null
          floor_plan?: string | null
          id?: string
          installment_eligible?: boolean
          parking?: boolean | null
          price?: number | null
          status?: string | null
          updated_at?: string | null
          view_count?: number
        }
        Update: {
          area?: number | null
          available_from?: string | null
          balcony?: boolean | null
          bedrooms?: number | null
          block_id?: string | null
          code?: string
          created_at?: string | null
          currency?: string | null
          facing?: string | null
          floor_id?: string | null
          floor_plan?: string | null
          id?: string
          installment_eligible?: boolean
          parking?: boolean | null
          price?: number | null
          status?: string | null
          updated_at?: string | null
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "apartments_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "apartments_floor_id_fkey"
            columns: ["floor_id"]
            isOneToOne: false
            referencedRelation: "floors"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          status: string | null
          total_apartments: number | null
          total_floors: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          status?: string | null
          total_apartments?: number | null
          total_floors?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          status?: string | null
          total_apartments?: number | null
          total_floors?: number | null
        }
        Relationships: []
      }
      booking_requests: {
        Row: {
          apartment_id: string
          created_at: string
          id: string
          lead_id: string
          note: string | null
          reject_reason: string | null
          requested_by: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          apartment_id: string
          created_at?: string
          id?: string
          lead_id: string
          note?: string | null
          reject_reason?: string | null
          requested_by: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          apartment_id?: string
          created_at?: string
          id?: string
          lead_id?: string
          note?: string | null
          reject_reason?: string | null
          requested_by?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "booking_requests_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "booking_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          message_id: string | null
          owner: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          message_id?: string | null
          owner?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          message_id?: string | null
          owner?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_tasks_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "team_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      construction_updates: {
        Row: {
          body_en: string | null
          body_ka: string | null
          completion: number | null
          created_at: string | null
          created_by: string | null
          id: string
          images: string[] | null
          is_published: boolean | null
          phase: string | null
          title_en: string | null
          title_ka: string
          updated_at: string | null
        }
        Insert: {
          body_en?: string | null
          body_ka?: string | null
          completion?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          images?: string[] | null
          is_published?: boolean | null
          phase?: string | null
          title_en?: string | null
          title_ka: string
          updated_at?: string | null
        }
        Update: {
          body_en?: string | null
          body_ka?: string | null
          completion?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          images?: string[] | null
          is_published?: boolean | null
          phase?: string | null
          title_en?: string | null
          title_ka?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "construction_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_updates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      floors: {
        Row: {
          block_id: string
          created_at: string | null
          id: string
          number: number
          total_apartments: number | null
        }
        Insert: {
          block_id: string
          created_at?: string | null
          id?: string
          number: number
          total_apartments?: number | null
        }
        Update: {
          block_id?: string
          created_at?: string | null
          id?: string
          number?: number
          total_apartments?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "floors_block_id_fkey"
            columns: ["block_id"]
            isOneToOne: false
            referencedRelation: "blocks"
            referencedColumns: ["id"]
          },
        ]
      }
      investor_scenarios: {
        Row: {
          apartment_code: string | null
          created_at: string
          created_by: string | null
          expense_ratio: number
          horizon_months: number | null
          id: string
          lead_id: string | null
          monthly_income_max: number | null
          monthly_income_min: number | null
          price: number | null
          rent_max: number | null
          rent_min: number | null
          roi_max: number | null
          roi_min: number | null
        }
        Insert: {
          apartment_code?: string | null
          created_at?: string
          created_by?: string | null
          expense_ratio?: number
          horizon_months?: number | null
          id?: string
          lead_id?: string | null
          monthly_income_max?: number | null
          monthly_income_min?: number | null
          price?: number | null
          rent_max?: number | null
          rent_min?: number | null
          roi_max?: number | null
          roi_min?: number | null
        }
        Update: {
          apartment_code?: string | null
          created_at?: string
          created_by?: string | null
          expense_ratio?: number
          horizon_months?: number | null
          id?: string
          lead_id?: string | null
          monthly_income_max?: number | null
          monthly_income_min?: number | null
          price?: number | null
          rent_max?: number | null
          rent_min?: number | null
          roi_max?: number | null
          roi_min?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "investor_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_scenarios_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "investor_scenarios_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_apartment_interests: {
        Row: {
          apartment_code: string | null
          apartment_id: string | null
          created_at: string | null
          id: string
          interest_type: string
          lead_id: string
        }
        Insert: {
          apartment_code?: string | null
          apartment_id?: string | null
          created_at?: string | null
          id?: string
          interest_type?: string
          lead_id: string
        }
        Update: {
          apartment_code?: string | null
          apartment_id?: string | null
          created_at?: string | null
          id?: string
          interest_type?: string
          lead_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_apartment_interests_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_apartment_interests_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_notes: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          id: string
          lead_id: string
          note_type: string
          user_id: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          id?: string
          lead_id: string
          note_type?: string
          user_id?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          id?: string
          lead_id?: string
          note_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_notes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          apartment_code: string | null
          apartment_id: string | null
          assigned_at: string | null
          assigned_to: string | null
          budget_max: number | null
          budget_min: number | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          landing_page: string | null
          last_contact_at: string | null
          loss_note: string | null
          loss_reason: string | null
          meeting_date: string | null
          notes: string | null
          phone: string | null
          priority: string
          referrer_url: string | null
          source: string | null
          status: string
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          apartment_code?: string | null
          apartment_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          landing_page?: string | null
          last_contact_at?: string | null
          loss_note?: string | null
          loss_reason?: string | null
          meeting_date?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          referrer_url?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          apartment_code?: string | null
          apartment_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          landing_page?: string | null
          last_contact_at?: string | null
          loss_note?: string | null
          loss_reason?: string | null
          meeting_date?: string | null
          notes?: string | null
          phone?: string | null
          priority?: string
          referrer_url?: string | null
          source?: string | null
          status?: string
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          body_en: string | null
          body_ka: string | null
          cover_image: string | null
          video_url: string | null
          created_at: string | null
          created_by: string | null
          id: string
          is_published: boolean | null
          published_at: string | null
          slug: string | null
          title_en: string | null
          title_ka: string
          updated_at: string | null
        }
        Insert: {
          body_en?: string | null
          body_ka?: string | null
          cover_image?: string | null
          video_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string | null
          title_en?: string | null
          title_ka: string
          updated_at?: string | null
        }
        Update: {
          body_en?: string | null
          body_ka?: string | null
          cover_image?: string | null
          video_url?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_published?: boolean | null
          published_at?: string | null
          slug?: string | null
          title_en?: string | null
          title_ka?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          is_read: boolean
          message: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          is_read?: boolean
          message?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          apartment_id: string | null
          created_at: string
          currency: string
          due_date: string | null
          id: string
          lead_id: string | null
          note: string | null
          paid_at: string | null
          payment_type: string | null
          percentage: number | null
          status: string
        }
        Insert: {
          amount: number
          apartment_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          note?: string | null
          paid_at?: string | null
          payment_type?: string | null
          percentage?: number | null
          status?: string
        }
        Update: {
          amount?: number
          apartment_id?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          id?: string
          lead_id?: string | null
          note?: string | null
          paid_at?: string | null
          payment_type?: string | null
          percentage?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_apartment_id_fkey"
            columns: ["apartment_id"]
            isOneToOne: false
            referencedRelation: "apartments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          notification_preferences: Json | null
          phone: string | null
          role: string
          updated_at: string
        }
        Insert: {
          avatar?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_active?: boolean
          manager_id?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          avatar?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          description: string | null
          id: string
          key: string
          section: string | null
          type: string | null
          updated_at: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          section?: string | null
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          section?: string | null
          type?: string | null
          updated_at?: string | null
          value?: string | null
        }
        Relationships: []
      }
      site_content: {
        Row: {
          key: string
          label: string
          section: string
          updated_at: string | null
          updated_by: string | null
          value_en: string
          value_ka: string
        }
        Insert: {
          key: string
          label?: string
          section?: string
          updated_at?: string | null
          updated_by?: string | null
          value_en?: string
          value_ka?: string
        }
        Update: {
          key?: string
          label?: string
          section?: string
          updated_at?: string | null
          updated_by?: string | null
          value_en?: string
          value_ka?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          lead_id: string | null
          priority: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          lead_id?: string | null
          priority?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          bio_en: string | null
          bio_ka: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name_en: string | null
          name_ka: string
          order_index: number | null
          photo: string | null
          role_title_en: string | null
          role_title_ka: string | null
        }
        Insert: {
          bio_en?: string | null
          bio_ka?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_ka: string
          order_index?: number | null
          photo?: string | null
          role_title_en?: string | null
          role_title_ka?: string | null
        }
        Update: {
          bio_en?: string | null
          bio_ka?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name_en?: string | null
          name_ka?: string
          order_index?: number | null
          photo?: string | null
          role_title_en?: string | null
          role_title_ka?: string | null
        }
        Relationships: []
      }
      team_messages: {
        Row: {
          ai_processed: boolean | null
          channel: string | null
          content: string
          created_at: string | null
          id: string
          intent: string | null
          sender_name: string
          sender_role: string
          user_id: string | null
        }
        Insert: {
          ai_processed?: boolean | null
          channel?: string | null
          content: string
          created_at?: string | null
          id?: string
          intent?: string | null
          sender_name: string
          sender_role: string
          user_id?: string | null
        }
        Update: {
          ai_processed?: boolean | null
          channel?: string | null
          content?: string
          created_at?: string | null
          id?: string
          intent?: string | null
          sender_name?: string
          sender_role?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles_basic"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profiles_basic: {
        Row: {
          full_name: string | null
          id: string | null
          role: string | null
        }
        Insert: {
          full_name?: string | null
          id?: string | null
          role?: string | null
        }
        Update: {
          full_name?: string | null
          id?: string | null
          role?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_chat_lead: {
        Args: { p_name: string; p_notes?: string; p_phone: string }
        Returns: undefined
      }
      create_contact_lead: {
        Args: {
          p_email?: string
          p_message?: string
          p_name: string
          p_phone: string
        }
        Returns: undefined
      }
      get_my_role: { Args: never; Returns: string }
      increment_apartment_view: { Args: { apt_id: string }; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const

// ── App convenience type aliases ──────────────────────────────────────────────
export type ActivityLog          = Tables<'activity_logs'>;
export type ApartmentImage       = Tables<'apartment_images'>;
export type Apartment            = Tables<'apartments'>;
// Apartment enriched with the FK-joined floors row (from select('*, floors(number)'))
export type ApartmentWithFloor   = Apartment & { floors: { number: number | null } | null };
export type Block                = Tables<'blocks'>;
export type BookingRequest       = Tables<'booking_requests'>;
export type ChatTask             = Tables<'chat_tasks'>;
export type ConstructionUpdate   = Tables<'construction_updates'>;
export type Floor                = Tables<'floors'>;
export type InvestorScenario     = Tables<'investor_scenarios'>;
export type LeadApartmentInterest = Tables<'lead_apartment_interests'>;
export type LeadNote             = Tables<'lead_notes'>;
export type Lead                 = Tables<'leads'>;
// Lead enriched with extra columns (budget added via migration; preferred_rooms/floors TBD)
export type LeadWithBudget       = Lead & {
  budget_min: number | null;
  budget_max: number | null;
  preferred_rooms: number[] | null;
  preferred_floors: number[] | null;
};
export type News                 = Tables<'news'>;
export type Notification         = Tables<'notifications'>;
export type Payment              = Tables<'payments'>;
export type Profile              = Tables<'profiles'>;
export type Setting              = Tables<'settings'>;
export type SiteContent          = Tables<'site_content'>;
export type Task                 = Tables<'tasks'>;
export type TeamMember           = Tables<'team_members'>;
export type TeamMessage          = Tables<'team_messages'>;
