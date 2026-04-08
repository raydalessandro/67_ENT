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
      ai_agent_configs: {
        Row: {
          artist_id: string
          created_at: string | null
          daily_message_limit: number | null
          id: string
          is_enabled: boolean | null
          max_tokens: number | null
          model_name: string | null
          provider: string | null
          system_prompt_activity: string | null
          system_prompt_boundaries: string | null
          system_prompt_extra: string | null
          system_prompt_identity: string | null
          system_prompt_marketing: string | null
          system_prompt_ontology: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          artist_id: string
          created_at?: string | null
          daily_message_limit?: number | null
          id?: string
          is_enabled?: boolean | null
          max_tokens?: number | null
          model_name?: string | null
          provider?: string | null
          system_prompt_activity?: string | null
          system_prompt_boundaries?: string | null
          system_prompt_extra?: string | null
          system_prompt_identity?: string | null
          system_prompt_marketing?: string | null
          system_prompt_ontology?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          artist_id?: string
          created_at?: string | null
          daily_message_limit?: number | null
          id?: string
          is_enabled?: boolean | null
          max_tokens?: number | null
          model_name?: string | null
          provider?: string | null
          system_prompt_activity?: string | null
          system_prompt_boundaries?: string | null
          system_prompt_extra?: string | null
          system_prompt_identity?: string | null
          system_prompt_marketing?: string | null
          system_prompt_ontology?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_agent_configs_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: true
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chat_messages: {
        Row: {
          artist_id: string
          content: string
          created_at: string | null
          id: string
          role: string
          session_date: string
          user_id: string
        }
        Insert: {
          artist_id: string
          content: string
          created_at?: string | null
          id?: string
          role: string
          session_date?: string
          user_id: string
        }
        Update: {
          artist_id?: string
          content?: string
          created_at?: string | null
          id?: string
          role?: string
          session_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_chat_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_daily_usage: {
        Row: {
          id: string
          message_count: number | null
          usage_date: string
          user_id: string
        }
        Insert: {
          id?: string
          message_count?: number | null
          usage_date?: string
          user_id: string
        }
        Update: {
          id?: string
          message_count?: number | null
          usage_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_daily_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      artists: {
        Row: {
          color: string
          created_at: string | null
          deactivated_at: string | null
          id: string
          instagram_handle: string | null
          instagram_token: string | null
          instagram_token_expires_at: string | null
          is_active: boolean | null
          name: string
          spotify_handle: string | null
          tiktok_handle: string | null
          updated_at: string | null
          user_id: string
          youtube_handle: string | null
        }
        Insert: {
          color?: string
          created_at?: string | null
          deactivated_at?: string | null
          id?: string
          instagram_handle?: string | null
          instagram_token?: string | null
          instagram_token_expires_at?: string | null
          is_active?: boolean | null
          name: string
          spotify_handle?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id: string
          youtube_handle?: string | null
        }
        Update: {
          color?: string
          created_at?: string | null
          deactivated_at?: string | null
          id?: string
          instagram_handle?: string | null
          instagram_token?: string | null
          instagram_token_expires_at?: string | null
          is_active?: boolean | null
          name?: string
          spotify_handle?: string | null
          tiktok_handle?: string | null
          updated_at?: string | null
          user_id?: string
          youtube_handle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "artists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guideline_item_artists: {
        Row: {
          artist_id: string | null
          guideline_item_id: string
          id: string
        }
        Insert: {
          artist_id?: string | null
          guideline_item_id: string
          id?: string
        }
        Update: {
          artist_id?: string | null
          guideline_item_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guideline_item_artists_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guideline_item_artists_guideline_item_id_fkey"
            columns: ["guideline_item_id"]
            isOneToOne: false
            referencedRelation: "guideline_items"
            referencedColumns: ["id"]
          },
        ]
      }
      guideline_items: {
        Row: {
          content: string
          created_at: string | null
          created_by: string
          display_order: number | null
          id: string
          item_type: Database["public"]["Enums"]["guideline_type"]
          priority: number | null
          section_id: string
          title: string
          updated_at: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          created_by: string
          display_order?: number | null
          id?: string
          item_type?: Database["public"]["Enums"]["guideline_type"]
          priority?: number | null
          section_id: string
          title: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          created_by?: string
          display_order?: number | null
          id?: string
          item_type?: Database["public"]["Enums"]["guideline_type"]
          priority?: number | null
          section_id?: string
          title?: string
          updated_at?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guideline_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guideline_items_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "guideline_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      guideline_reads: {
        Row: {
          guideline_item_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          guideline_item_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          guideline_item_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guideline_reads_guideline_item_id_fkey"
            columns: ["guideline_item_id"]
            isOneToOne: false
            referencedRelation: "guideline_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guideline_reads_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      guideline_sections: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          related_post_id: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          related_post_id?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          related_post_id?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_post_id_fkey"
            columns: ["related_post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      post_history: {
        Row: {
          changed_by: string
          created_at: string | null
          id: string
          new_status: Database["public"]["Enums"]["post_status"]
          old_status: Database["public"]["Enums"]["post_status"] | null
          post_id: string
          reason: string | null
        }
        Insert: {
          changed_by: string
          created_at?: string | null
          id?: string
          new_status: Database["public"]["Enums"]["post_status"]
          old_status?: Database["public"]["Enums"]["post_status"] | null
          post_id: string
          reason?: string | null
        }
        Update: {
          changed_by?: string
          created_at?: string | null
          id?: string
          new_status?: Database["public"]["Enums"]["post_status"]
          old_status?: Database["public"]["Enums"]["post_status"] | null
          post_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_history_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_history_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      post_media: {
        Row: {
          created_at: string | null
          display_order: number | null
          file_size: number | null
          file_type: string
          file_url: string
          id: string
          post_id: string
          thumbnail_url: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          file_type: string
          file_url: string
          id?: string
          post_id: string
          thumbnail_url?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          file_size?: number | null
          file_type?: string
          file_url?: string
          id?: string
          post_id?: string
          thumbnail_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_media_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts_with_details"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          approved_by: string | null
          artist_id: string
          caption: string | null
          created_at: string | null
          created_by: string
          hashtags: string | null
          id: string
          platforms: Json
          rejection_reason: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at: string | null
        }
        Insert: {
          approved_by?: string | null
          artist_id: string
          caption?: string | null
          created_at?: string | null
          created_by: string
          hashtags?: string | null
          id?: string
          platforms?: Json
          rejection_reason?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title: string
          updated_at?: string | null
        }
        Update: {
          approved_by?: string | null
          artist_id?: string
          caption?: string | null
          created_at?: string | null
          created_by?: string
          hashtags?: string | null
          id?: string
          platforms?: Json
          rejection_reason?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          created_at: string | null
          endpoint: string
          id: string
          keys_auth: string
          keys_p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          id?: string
          keys_auth: string
          keys_p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          id?: string
          keys_auth?: string
          keys_p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string | null
          display_name: string
          email: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name: string
          email: string
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          email?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      posts_with_details: {
        Row: {
          approved_by: string | null
          artist_color: string | null
          artist_id: string | null
          artist_name: string | null
          caption: string | null
          comment_count: number | null
          created_at: string | null
          created_by: string | null
          first_media_type: string | null
          first_media_url: string | null
          hashtags: string | null
          id: string | null
          media_count: number | null
          platforms: Json | null
          rejection_reason: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["post_status"] | null
          title: string | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "posts_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_artist_id_fkey"
            columns: ["artist_id"]
            isOneToOne: false
            referencedRelation: "artists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_artist_atomic: {
        Args: {
          p_color?: string
          p_email: string
          p_instagram_handle?: string
          p_instagram_token?: string
          p_name: string
          p_spotify_handle?: string
          p_tiktok_handle?: string
          p_user_id: string
          p_youtube_handle?: string
        }
        Returns: string
      }
      deactivate_artist: { Args: { p_artist_id: string }; Returns: undefined }
      get_artist_id: { Args: never; Returns: string }
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      increment_daily_usage: {
        Args: { p_usage_date: string; p_user_id: string }
        Returns: undefined
      }
      is_admin: { Args: never; Returns: boolean }
      is_staff: { Args: never; Returns: boolean }
    }
    Enums: {
      guideline_type: "permanent" | "campaign" | "update"
      notification_type:
        | "post_review"
        | "post_approved"
        | "post_rejected"
        | "post_published"
        | "new_guideline"
        | "system"
      post_status: "draft" | "in_review" | "approved" | "rejected" | "published"
      user_role: "admin" | "manager" | "artist"
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
      guideline_type: ["permanent", "campaign", "update"],
      notification_type: [
        "post_review",
        "post_approved",
        "post_rejected",
        "post_published",
        "new_guideline",
        "system",
      ],
      post_status: ["draft", "in_review", "approved", "rejected", "published"],
      user_role: ["admin", "manager", "artist"],
    },
  },
} as const
