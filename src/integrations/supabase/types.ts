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
      categories: {
        Row: {
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number | null
        }
        Relationships: []
      }
      favorites: {
        Row: {
          client_id: string
          created_at: string
          provider_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          provider_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          request_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          request_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          request_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          project_date: string | null
          provider_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_date?: string | null
          provider_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          project_date?: string | null
          provider_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_items_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      provider_categories: {
        Row: {
          category_id: string
          provider_id: string
        }
        Insert: {
          category_id: string
          provider_id: string
        }
        Update: {
          category_id?: string
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_categories_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      providers: {
        Row: {
          availability: string | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          currency: string | null
          gallery_urls: string[] | null
          headline: string | null
          hourly_rate_max: number | null
          hourly_rate_min: number | null
          id: string
          is_verified: boolean | null
          rating: number | null
          reviews_count: number | null
          service_areas: string[] | null
          specialties: string[] | null
          tags: string[] | null
          updated_at: string
          whatsapp_number: string | null
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          currency?: string | null
          gallery_urls?: string[] | null
          headline?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id: string
          is_verified?: boolean | null
          rating?: number | null
          reviews_count?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          tags?: string[] | null
          updated_at?: string
          whatsapp_number?: string | null
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          currency?: string | null
          gallery_urls?: string[] | null
          headline?: string | null
          hourly_rate_max?: number | null
          hourly_rate_min?: number | null
          id?: string
          is_verified?: boolean | null
          rating?: number | null
          reviews_count?: number | null
          service_areas?: string[] | null
          specialties?: string[] | null
          tags?: string[] | null
          updated_at?: string
          whatsapp_number?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "providers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          address: string | null
          category_id: string | null
          client_id: string
          created_at: string
          description: string
          id: string
          preferred_date: string | null
          provider_id: string
          status: Database["public"]["Enums"]["request_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          category_id?: string | null
          client_id: string
          created_at?: string
          description: string
          id?: string
          preferred_date?: string | null
          provider_id: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          category_id?: string | null
          client_id?: string
          created_at?: string
          description?: string
          id?: string
          preferred_date?: string | null
          provider_id?: string
          status?: Database["public"]["Enums"]["request_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_requests_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          amount: number
          created_at: string
          estimated_days: number | null
          id: string
          notes: string | null
          provider_id: string
          request_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          estimated_days?: number | null
          id?: string
          notes?: string | null
          provider_id: string
          request_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          estimated_days?: number | null
          id?: string
          notes?: string | null
          provider_id?: string
          request_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quotes_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          client_id: string
          comment: string | null
          created_at: string
          id: string
          provider_id: string
          rating: number
          request_id: string | null
        }
        Insert: {
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id: string
          rating: number
          request_id?: string | null
        }
        Update: {
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          provider_id?: string
          rating?: number
          request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "quote_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          provider_id: string
          starting_price: number | null
          title: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          provider_id: string
          starting_price?: number | null
          title: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          provider_id?: string
          starting_price?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      request_status:
        | "pending"
        | "quoted"
        | "accepted"
        | "completed"
        | "cancelled"
      user_role: "client" | "provider"
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
      request_status: [
        "pending",
        "quoted",
        "accepted",
        "completed",
        "cancelled",
      ],
      user_role: ["client", "provider"],
    },
  },
} as const
