// ─────────────────────────────────────────────────────────────
// THE FORGE — Supabase Database Types
//
// These are hand-authored stubs that mirror the V1 schema.
// Replace with auto-generated types once schema is live:
//
//   npx supabase gen types typescript \
//     --project-id YOUR_PROJECT_REF \
//     > src/types/database.ts
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
        };
        Update: {
          display_name?:    string;
          target?:          string | null;
          total_xp?:        number;
          current_rank?:    string;
          current_streak?:  number;
          last_active_date?:string | null;
        };
      };
      missions: {
        Relationships: [];
        Row: {
          id:           string;
          title:        string;
          category:     string;
          mission_type: string;
          week_number:  number;
          unlock_day:   number;
          xp_reward:    number;
          content:      Json;
        };
        Insert: {
          id:           string;
          title:        string;
          category:     string;
          mission_type: string;
          week_number:  number;
          unlock_day:   number;
          xp_reward:    number;
          content:      Json;
        };
        Update: {
          title?:       string;
          category?:    string;
          mission_type?:string;
          xp_reward?:   number;
          content?:     Json;
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
          responses:      Json | null;
        };
        Insert: {
          id?:            string;
          user_id:        string;
          mission_id:     string;
          completed_date: string;
          xp_awarded:     number;
          responses?:     Json | null;
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
    };
    Views: Record<string, never>;
    Functions: {
      complete_mission: {
        Args: {
          p_user_id:    string;
          p_mission_id: string;
          p_responses:  Json;
          p_xp:         number;
        };
        Returns: {
          xp_awarded:   number;
          new_total_xp: number;
          new_streak:   number;
          new_rank:     string;
        };
      };
    };
  };
}
