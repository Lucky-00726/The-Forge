// ─────────────────────────────────────────────────────────────
// THE FORGE — Supabase Database Types
// ─────────────────────────────────────────────────────────────

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Relationships: [];
        Row: {
          id:               string;
          display_name:     string;
          target:           string | null;
          total_xp:         number;
          current_rank:     string;
          current_streak:   number;
          last_active_date: string | null;
          created_at:       string;
          is_admin:         boolean;
        };
        Insert: {
          id:               string;
          display_name:     string;
          target?:          string | null;
          total_xp?:        number;
          current_rank?:    string;
          current_streak?:  number;
          last_active_date?:string | null;
          created_at?:      string;
          is_admin?:        boolean;
        };
        Update: {
          display_name?:    string;
          target?:          string | null;
          total_xp?:        number;
          current_rank?:    string;
          current_streak?:  number;
          last_active_date?:string | null;
          is_admin?:        boolean;
        };
      };
      missions: {
        Relationships: [];
        Row: {
          id:                 string;
          title:              string;
          category:           string;
          mission_type:       string;
          week_number:        number;
          unlock_day:         number;
          xp_reward:          number;
          content:            any;
          time_limit_seconds: number | null;
        };
        Insert: {
          id:                 string;
          title:              string;
          category:           string;
          mission_type:       string;
          week_number:        number;
          unlock_day:         number;
          xp_reward:          number;
          content:            any;
          time_limit_seconds?: number | null;
        };
        Update: {
          title?:              string;
          category?:           string;
          mission_type?:       string;
          week_number?:        number;
          unlock_day?:         number;
          xp_reward?:          number;
          content?:            any;
          time_limit_seconds?: number | null;
        };
      };
      mission_completions: {
        Relationships: [];
        Row: {
          id:             string;
          user_id:        string;
          mission_id:     string;
          completed_date: string;
          xp_awarded:     number;
          responses:      any;
        };
        Insert: {
          id?:            string;
          user_id:        string;
          mission_id:     string;
          completed_date: string;
          xp_awarded:     number;
          responses?:     any;
        };
        Update: never;
      };
      feedback: {
        Relationships: [];
        Row: {
          id:         string;
          user_id:    string | null;
          message:    string;
          created_at: string;
        };
        Insert: {
          id?:        string;
          user_id?:   string | null;
          message:    string;
          created_at?:string;
        };
        Update: never;
      };
      analytics_events: {
        Relationships: [];
        Row: {
          id:         number;
          user_id:    string;
          event:      string;
          metadata:   any;
          created_at: string;
        };
        Insert: {
          id?:        number;
          user_id:    string;
          event:      string;
          metadata?:  any;
          created_at?:string;
        };
        Update: never;
      };
      questions: {
        Relationships: [];
        Row: {
          id:                string;
          category:          string;
          subcategory:       string | null;
          difficulty:        string;
          question_type:     string;
          question:          string;
          prompt:            string | null;
          answer_data:       any;
          xp_reward:         number;
          time_limit:        number | null;
          tags:              string[];
          source:            string | null;
          active:            boolean;
          status:            string;
          question_category: string;
          sequence_order:    number;
          created_at:        string;
          updated_at:        string;
        };
        Insert: {
          id:                string;
          category:          string;
          subcategory?:      string | null;
          difficulty:        string;
          question_type:     string;
          question:          string;
          prompt?:           string | null;
          answer_data?:      any;
          xp_reward?:        number;
          time_limit?:       number | null;
          tags?:             string[];
          source?:           string | null;
          active?:           boolean;
          status?:           string;
          question_category: string;
          sequence_order?:   number;
          created_at?:       string;
          updated_at?:       string;
        };
        Update: {
          category?:          string;
          subcategory?:       string | null;
          difficulty?:        string;
          question_type?:     string;
          question?:          string;
          prompt?:            string | null;
          answer_data?:       any;
          xp_reward?:         number;
          time_limit?:        number | null;
          tags?:              string[];
          source?:            string | null;
          active?:            boolean;
          status?:            string;
          question_category?: string;
          sequence_order?:    number;
          updated_at?:        string;
        };
      };
      import_staging_questions: {
        Relationships: [];
        Row: {
          id:                string;
          source_name:       string;
          category:          string;
          subcategory:       string | null;
          difficulty:        string;
          question_type:     string;
          question:          string;
          prompt:            string | null;
          answer_data:       any;
          xp_reward:         number;
          time_limit:        number | null;
          tags:              string[];
          source:            string | null;
          active:            boolean;
          status:            string;
          question_category: string;
          import_status:     string;
          sequence_order:    number;
          created_at:        string;
        };
        Insert: {
          id:                string;
          source_name:       string;
          category:          string;
          subcategory?:      string | null;
          difficulty:        string;
          question_type:     string;
          question:          string;
          prompt?:           string | null;
          answer_data?:      any;
          xp_reward?:        number;
          time_limit?:       number | null;
          tags?:             string[];
          source?:           string | null;
          active?:           boolean;
          status?:           string;
          question_category: string;
          import_status?:     string;
          sequence_order?:    number;
          created_at?:       string;
        };
        Update: {
          source_name?:       string;
          category?:          string;
          subcategory?:       string | null;
          difficulty?:        string;
          question_type?:     string;
          question?:          string;
          prompt?:            string | null;
          answer_data?:       any;
          xp_reward?:         number;
          time_limit?:        number | null;
          tags?:              string[];
          source?:            string | null;
          active?:            boolean;
          status?:            string;
          question_category?: string;
          import_status?:     string;
          sequence_order?:    number;
        };
      };
      user_content_progress: {
        Relationships: [];
        Row: {
          user_id:     string;
          session_key: string;
          scope:       string;
          position:    number;
          updated_at:  string;
        };
        Insert: {
          user_id:     string;
          session_key: string;
          scope:       string;
          position?:    number;
          updated_at?:  string;
        };
        Update: {
          position?:    number;
          updated_at?:  string;
        };
      };
      user_daily_sessions: {
        Relationships: [];
        Row: {
          id:                      string;
          user_id:                 string;
          session_date:            string;
          session_number:          number;
          question_ids:            string[];
          started_at:              string;
          completed_at:            string | null;
          xp_earned:               number;
          score:                   number | null;
          total_questions:         number | null;
          completion_time_seconds: number | null;
          difficulty:              string | null;
          progress:                any;
        };
        Insert: {
          id?:                      string;
          user_id:                 string;
          session_date:            string;
          session_number:          number;
          question_ids:            string[];
          started_at?:              string;
          completed_at?:            string | null;
          xp_earned?:               number;
          score?:                   number | null;
          total_questions?:         number | null;
          completion_time_seconds?: number | null;
          difficulty?:              string | null;
          progress?:                any;
        };
        Update: {
          completed_at?:            string | null;
          xp_earned?:               number;
          score?:                   number | null;
          total_questions?:         number | null;
          completion_time_seconds?: number | null;
          difficulty?:              string | null;
          progress?:                any;
        };
      };
    };
    Views: Record<string, never>;
    Functions: {
      [key: string]: any;
    };
  };
}
