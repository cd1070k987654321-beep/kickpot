export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          name: string;
          nickname: string;
          bio: string;
          profile_image_url: string | null;
          cover_image_url: string | null;
          main_position: "GK" | "DF" | "MF" | "FW" | "ALL" | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          name?: string;
          nickname: string;
          bio?: string;
          profile_image_url?: string | null;
          cover_image_url?: string | null;
          main_position?: "GK" | "DF" | "MF" | "FW" | "ALL" | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      teams: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          description: string;
          logo_url: string | null;
          cover_image_url: string | null;
          invite_code: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          name: string;
          description?: string;
          logo_url?: string | null;
          cover_image_url?: string | null;
          invite_code?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["teams"]["Insert"]>;
      };
      team_members: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          role: "owner" | "member";
          number: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          role?: "owner" | "member";
          number?: number | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_members"]["Insert"]>;
      };
      matches: {
        Row: {
          id: string;
          team_a_id: string;
          team_b_id: string | null;
          created_by: string;
          title: string | null;
          description: string;
          date: string;
          location: string;
          status: "pending" | "requested" | "accepted" | "rejected" | "completed";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          team_a_id: string;
          team_b_id?: string | null;
          created_by: string;
          title?: string | null;
          description?: string;
          date: string;
          location: string;
          status?: "pending" | "requested" | "accepted" | "rejected" | "completed";
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["matches"]["Insert"]>;
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: "team_joined" | "team_removed" | "team_owner_transferred" | "team_join_request";
          title: string;
          body: string;
          link: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: "team_joined" | "team_removed" | "team_owner_transferred" | "team_join_request";
          title: string;
          body?: string;
          link?: string | null;
          is_read?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
      };
      team_join_requests: {
        Row: {
          id: string;
          team_id: string;
          user_id: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
        };
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["team_join_requests"]["Insert"]>;
      };
    };
  };
};
