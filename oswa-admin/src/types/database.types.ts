export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      terms: {
        Row: { id: string; name: string; year: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; name: string; year: number; is_active?: boolean; created_at?: string; updated_at?: string };
        Update: Partial<Database["public"]["Tables"]["terms"]["Insert"]>;
        Relationships: [];
      };
      groups: {
        Row: { id: string; term_id: string; name: string; created_at: string };
        Insert: { id?: string; term_id: string; name: string; created_at?: string };
        Update: Partial<Database["public"]["Tables"]["groups"]["Insert"]>;
        Relationships: [];
      };
      participants: {
        Row: { id: string; group_id: string; name: string; grade: number; is_active: boolean; created_at: string; updated_at: string };
        Insert: {
          id?: string;
          group_id: string;
          name: string;
          grade: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["participants"]["Insert"]>;
        Relationships: [];
      };
      criteria: {
        Row: {
          id: string;
          term_id: string;
          name: string;
          kind: string;
          sort_order: number;
          is_active: boolean;
          group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          term_id: string;
          name: string;
          kind?: string;
          sort_order?: number;
          is_active?: boolean;
          group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["criteria"]["Insert"]>;
        Relationships: [];
      };
      scores: {
        Row: {
          id: string;
          participant_id: string;
          criterion_id: string;
          value: number;
          note: string | null;
          updated_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          participant_id: string;
          criterion_id: string;
          value?: number;
          note?: string | null;
          updated_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["scores"]["Insert"]>;
        Relationships: [];
      };
      staff_profiles: {
        Row: { user_id: string; role: string; group_id: string | null; display_name: string | null; created_at: string; updated_at: string };
        Insert: {
          user_id: string;
          role: string;
          group_id?: string | null;
          display_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_profiles"]["Insert"]>;
        Relationships: [];
      };
      recognitions: {
        Row: {
          id: string;
          term_id: string;
          participant_id: string;
          type: string;
          week_date: string | null;
          event_date: string | null;
          note: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          term_id: string;
          participant_id: string;
          type: string;
          week_date?: string | null;
          event_date?: string | null;
          note?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["recognitions"]["Insert"]>;
        Relationships: [];
      };
      staff_access_requests: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          display_name: string | null;
          requested_group_id: string | null;
          status: string;
          reviewed_by: string | null;
          reviewed_at: string | null;
          note: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          display_name?: string | null;
          requested_group_id?: string | null;
          status?: string;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          note?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["staff_access_requests"]["Insert"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      claim_first_manager: { Args: Record<string, never>; Returns: boolean };
      submit_staff_access_request: { Args: { p_group_id: string; p_display_name: string }; Returns: string };
      review_staff_access_request: { Args: { p_request_id: string; p_action: string; p_group_id?: string | null }; Returns: boolean };
      manager_exists: { Args: Record<string, never>; Returns: boolean };
      update_own_display_name: { Args: { p_display_name: string }; Returns: undefined };
      revoke_staff_access: { Args: { p_user_id: string }; Returns: boolean };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
