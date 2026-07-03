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
      lumen_allowed_emails: {
        Row: {
          email: string
        }
        Insert: {
          email: string
        }
        Update: {
          email?: string
        }
        Relationships: []
      }
      lumen_badges: {
        Row: {
          badge_key: string
          earned_at: string
          user_id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          user_id: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumen_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "lumen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_domain_calendar: {
        Row: {
          domain: string
          weekday: number
        }
        Insert: {
          domain: string
          weekday: number
        }
        Update: {
          domain?: string
          weekday?: number
        }
        Relationships: []
      }
      lumen_error_reports: {
        Row: {
          created_at: string
          id: number
          lesson_id: string | null
          message: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          lesson_id?: string | null
          message: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          lesson_id?: string | null
          message?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lumen_error_reports_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lumen_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lumen_error_reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "lumen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_lesson_progress: {
        Row: {
          is_catchup: boolean
          lesson_id: string
          quiz_completed_at: string | null
          read_at: string | null
          score: number | null
          user_id: string
        }
        Insert: {
          is_catchup?: boolean
          lesson_id: string
          quiz_completed_at?: string | null
          read_at?: string | null
          score?: number | null
          user_id: string
        }
        Update: {
          is_catchup?: boolean
          lesson_id?: string
          quiz_completed_at?: string | null
          read_at?: string | null
          score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumen_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lumen_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lumen_lesson_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "lumen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_lessons: {
        Row: {
          anecdote: string | null
          body_md: string
          created_at: string
          date: string
          domain: string
          flex_phrase: string | null
          hook: string
          id: string
          status: string
          title: string
        }
        Insert: {
          anecdote?: string | null
          body_md: string
          created_at?: string
          date: string
          domain: string
          flex_phrase?: string | null
          hook: string
          id?: string
          status?: string
          title: string
        }
        Update: {
          anecdote?: string | null
          body_md?: string
          created_at?: string
          date?: string
          domain?: string
          flex_phrase?: string | null
          hook?: string
          id?: string
          status?: string
          title?: string
        }
        Relationships: []
      }
      lumen_notions: {
        Row: {
          id: string
          label: string
          lesson_id: string
          question_id: string | null
        }
        Insert: {
          id?: string
          label: string
          lesson_id: string
          question_id?: string | null
        }
        Update: {
          id?: string
          label?: string
          lesson_id?: string
          question_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lumen_notions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lumen_lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lumen_notions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lumen_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_points_ledger: {
        Row: {
          id: number
          occurred_at: string
          points: number
          source: string
          user_id: string
        }
        Insert: {
          id?: never
          occurred_at?: string
          points: number
          source: string
          user_id: string
        }
        Update: {
          id?: never
          occurred_at?: string
          points?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumen_points_ledger_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "lumen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string
          id: string
          notif_time: string
          timezone: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name: string
          id: string
          notif_time?: string
          timezone?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          notif_time?: string
          timezone?: string
        }
        Relationships: []
      }
      lumen_push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: number
          p256dh: string
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: never
          p256dh: string
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: never
          p256dh?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumen_push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "lumen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_questions: {
        Row: {
          answer_idx: number
          choices: Json
          explanation: string
          id: string
          lesson_id: string
          position: number
          prompt: string
          tier: string
        }
        Insert: {
          answer_idx: number
          choices: Json
          explanation: string
          id?: string
          lesson_id: string
          position: number
          prompt: string
          tier: string
        }
        Update: {
          answer_idx?: number
          choices?: Json
          explanation?: string
          id?: string
          lesson_id?: string
          position?: number
          prompt?: string
          tier?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumen_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lumen_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_srs_cards: {
        Row: {
          due_date: string
          last_reviewed_at: string | null
          level: number
          notion_id: string
          user_id: string
        }
        Insert: {
          due_date: string
          last_reviewed_at?: string | null
          level?: number
          notion_id: string
          user_id: string
        }
        Update: {
          due_date?: string
          last_reviewed_at?: string | null
          level?: number
          notion_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumen_srs_cards_notion_id_fkey"
            columns: ["notion_id"]
            isOneToOne: false
            referencedRelation: "lumen_notions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lumen_srs_cards_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "lumen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lumen_streaks: {
        Row: {
          best: number
          current: number
          joker_used_week_of: string | null
          last_validated_date: string | null
          user_id: string
        }
        Insert: {
          best?: number
          current?: number
          joker_used_week_of?: string | null
          last_validated_date?: string | null
          user_id: string
        }
        Update: {
          best?: number
          current?: number
          joker_used_week_of?: string | null
          last_validated_date?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lumen_streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "lumen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_admin_config: {
        Row: {
          key: string
          updated_at: string | null
          value: string
        }
        Insert: {
          key: string
          updated_at?: string | null
          value: string
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
      }
      orienta_chat: {
        Row: {
          created_at: string
          id: string
          pseudo: string | null
          text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pseudo?: string | null
          text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pseudo?: string | null
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orienta_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_collective_progress: {
        Row: {
          boss_index_cleared: number
          id: number
          level: number | null
          level_name: string | null
          total_xp: number | null
          updated_at: string | null
        }
        Insert: {
          boss_index_cleared?: number
          id?: number
          level?: number | null
          level_name?: string | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Update: {
          boss_index_cleared?: number
          id?: number
          level?: number | null
          level_name?: string | null
          total_xp?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      orienta_comment_reactions: {
        Row: {
          created_at: string | null
          emoji: string
          id: string
          play_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          emoji: string
          id?: string
          play_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          emoji?: string
          id?: string
          play_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_comment_reactions_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "orienta_plays"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_comment_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_comment_reactions_backup_20260604: {
        Row: {
          created_at: string | null
          emoji: string | null
          id: string | null
          play_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          emoji?: string | null
          id?: string | null
          play_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          emoji?: string | null
          id?: string | null
          play_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      orienta_daily_active: {
        Row: {
          active_date: string
          first_seen_at: string
          user_id: string
        }
        Insert: {
          active_date: string
          first_seen_at?: string
          user_id: string
        }
        Update: {
          active_date?: string
          first_seen_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_daily_active_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_grid_boosts: {
        Row: {
          created_at: string
          grid_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          grid_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          grid_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_grid_boosts_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "orienta_grids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_grid_boosts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_grid_cards: {
        Row: {
          card_id: string | null
          grid_id: string | null
          id: string
          position: number | null
          rotation: number | null
        }
        Insert: {
          card_id?: string | null
          grid_id?: string | null
          id?: string
          position?: number | null
          rotation?: number | null
        }
        Update: {
          card_id?: string | null
          grid_id?: string | null
          id?: string
          position?: number | null
          rotation?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orienta_grid_cards_card_id_fkey"
            columns: ["card_id"]
            isOneToOne: false
            referencedRelation: "orienta_word_cards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_grid_cards_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "orienta_grids"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_grid_grants: {
        Row: {
          created_at: string
          created_grid_id: string | null
          deadline: string
          id: string
          onboarding_seen_at: string | null
          source_date: string
          source_grid_id: string
          status: string
          target_date: string
          winner_user_id: string
        }
        Insert: {
          created_at?: string
          created_grid_id?: string | null
          deadline: string
          id?: string
          onboarding_seen_at?: string | null
          source_date: string
          source_grid_id: string
          status?: string
          target_date: string
          winner_user_id: string
        }
        Update: {
          created_at?: string
          created_grid_id?: string | null
          deadline?: string
          id?: string
          onboarding_seen_at?: string | null
          source_date?: string
          source_grid_id?: string
          status?: string
          target_date?: string
          winner_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_grid_grants_created_grid_id_fkey"
            columns: ["created_grid_id"]
            isOneToOne: false
            referencedRelation: "orienta_grids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_grid_grants_source_grid_id_fkey"
            columns: ["source_grid_id"]
            isOneToOne: true
            referencedRelation: "orienta_grids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_grid_grants_winner_user_id_fkey"
            columns: ["winner_user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_grid_upvotes: {
        Row: {
          created_at: string | null
          grid_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          grid_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          grid_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_grid_upvotes_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "orienta_grids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_grid_upvotes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_grids: {
        Row: {
          ai_generated: boolean
          ai_notes: string | null
          boost_count: number
          clue_bottom: string | null
          clue_left: string | null
          clue_right: string | null
          clue_top: string | null
          created_at: string | null
          creator_id: string | null
          creator_time_seconds: number | null
          daily_date: string | null
          daily_status: string | null
          difficulty: string | null
          edition_number: number | null
          expires_at: string | null
          id: string
          reserve_priority: number | null
          status: string | null
          upvotes_count: number
        }
        Insert: {
          ai_generated?: boolean
          ai_notes?: string | null
          boost_count?: number
          clue_bottom?: string | null
          clue_left?: string | null
          clue_right?: string | null
          clue_top?: string | null
          created_at?: string | null
          creator_id?: string | null
          creator_time_seconds?: number | null
          daily_date?: string | null
          daily_status?: string | null
          difficulty?: string | null
          edition_number?: number | null
          expires_at?: string | null
          id?: string
          reserve_priority?: number | null
          status?: string | null
          upvotes_count?: number
        }
        Update: {
          ai_generated?: boolean
          ai_notes?: string | null
          boost_count?: number
          clue_bottom?: string | null
          clue_left?: string | null
          clue_right?: string | null
          clue_top?: string | null
          created_at?: string | null
          creator_id?: string | null
          creator_time_seconds?: number | null
          daily_date?: string | null
          daily_status?: string | null
          difficulty?: string | null
          edition_number?: number | null
          expires_at?: string | null
          id?: string
          reserve_priority?: number | null
          status?: string | null
          upvotes_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "orienta_grids_creator_id_fkey"
            columns: ["creator_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_notifications: {
        Row: {
          created_at: string | null
          id: string
          payload: Json | null
          read: boolean | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          read?: boolean | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          payload?: Json | null
          read?: boolean | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_play_attempts: {
        Row: {
          answer: Json | null
          attempt_number: number | null
          attempted_at: string | null
          correct_full: number | null
          correct_rotation: number | null
          id: string
          neither: number | null
          play_id: string | null
        }
        Insert: {
          answer?: Json | null
          attempt_number?: number | null
          attempted_at?: string | null
          correct_full?: number | null
          correct_rotation?: number | null
          id?: string
          neither?: number | null
          play_id?: string | null
        }
        Update: {
          answer?: Json | null
          attempt_number?: number | null
          attempted_at?: string | null
          correct_full?: number | null
          correct_rotation?: number | null
          id?: string
          neither?: number | null
          play_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orienta_play_attempts_play_id_fkey"
            columns: ["play_id"]
            isOneToOne: false
            referencedRelation: "orienta_plays"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_play_attempts_backup_20260604: {
        Row: {
          answer: Json | null
          attempt_number: number | null
          attempted_at: string | null
          correct_full: number | null
          correct_rotation: number | null
          id: string | null
          neither: number | null
          play_id: string | null
        }
        Insert: {
          answer?: Json | null
          attempt_number?: number | null
          attempted_at?: string | null
          correct_full?: number | null
          correct_rotation?: number | null
          id?: string | null
          neither?: number | null
          play_id?: string | null
        }
        Update: {
          answer?: Json | null
          attempt_number?: number | null
          attempted_at?: string | null
          correct_full?: number | null
          correct_rotation?: number | null
          id?: string | null
          neither?: number | null
          play_id?: string | null
        }
        Relationships: []
      }
      orienta_plays: {
        Row: {
          attempts_count: number | null
          comment: string | null
          completed_at: string | null
          creator_reply: string | null
          creator_reply_at: string | null
          grid_id: string | null
          id: string
          paused_at: string | null
          paused_seconds: number
          player_id: string | null
          score: number | null
          started_at: string | null
          success: boolean | null
          time_seconds: number | null
          xp_earned: number | null
        }
        Insert: {
          attempts_count?: number | null
          comment?: string | null
          completed_at?: string | null
          creator_reply?: string | null
          creator_reply_at?: string | null
          grid_id?: string | null
          id?: string
          paused_at?: string | null
          paused_seconds?: number
          player_id?: string | null
          score?: number | null
          started_at?: string | null
          success?: boolean | null
          time_seconds?: number | null
          xp_earned?: number | null
        }
        Update: {
          attempts_count?: number | null
          comment?: string | null
          completed_at?: string | null
          creator_reply?: string | null
          creator_reply_at?: string | null
          grid_id?: string | null
          id?: string
          paused_at?: string | null
          paused_seconds?: number
          player_id?: string | null
          score?: number | null
          started_at?: string | null
          success?: boolean | null
          time_seconds?: number | null
          xp_earned?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "orienta_plays_grid_id_fkey"
            columns: ["grid_id"]
            isOneToOne: false
            referencedRelation: "orienta_grids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_plays_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_plays_backup_20260604: {
        Row: {
          attempts_count: number | null
          comment: string | null
          completed_at: string | null
          grid_id: string | null
          id: string | null
          player_id: string | null
          score: number | null
          started_at: string | null
          success: boolean | null
          time_seconds: number | null
          xp_earned: number | null
        }
        Insert: {
          attempts_count?: number | null
          comment?: string | null
          completed_at?: string | null
          grid_id?: string | null
          id?: string | null
          player_id?: string | null
          score?: number | null
          started_at?: string | null
          success?: boolean | null
          time_seconds?: number | null
          xp_earned?: number | null
        }
        Update: {
          attempts_count?: number | null
          comment?: string | null
          completed_at?: string | null
          grid_id?: string | null
          id?: string | null
          player_id?: string | null
          score?: number | null
          started_at?: string | null
          success?: boolean | null
          time_seconds?: number | null
          xp_earned?: number | null
        }
        Relationships: []
      }
      orienta_quest_progress: {
        Row: {
          claimed_at: string | null
          completed_at: string | null
          created_at: string
          id: string
          period_key: string
          progress: number
          quest_id: string
          scope: string
          target: number
          user_id: string
        }
        Insert: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          period_key: string
          progress?: number
          quest_id: string
          scope: string
          target: number
          user_id: string
        }
        Update: {
          claimed_at?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          period_key?: string
          progress?: number
          quest_id?: string
          scope?: string
          target?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_quest_progress_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "orienta_quests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_quest_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_quests: {
        Row: {
          code: string
          created_at: string
          description: string
          goal_type: string
          id: string
          is_active: boolean
          reward_jetons: number
          reward_xp: number
          scope: string
          sort_order: number
          target: number
          threshold_seconds: number | null
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description: string
          goal_type: string
          id?: string
          is_active?: boolean
          reward_jetons?: number
          reward_xp?: number
          scope: string
          sort_order?: number
          target?: number
          threshold_seconds?: number | null
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string
          goal_type?: string
          id?: string
          is_active?: boolean
          reward_jetons?: number
          reward_xp?: number
          scope?: string
          sort_order?: number
          target?: number
          threshold_seconds?: number | null
          title?: string
        }
        Relationships: []
      }
      orienta_raid_attempts: {
        Row: {
          answer: Json
          assault_index: number
          correct_full: number | null
          correct_rotation: number | null
          created_at: string
          damage: number | null
          id: string
          neither: number | null
          session_id: string
          submitted_by: string | null
        }
        Insert: {
          answer: Json
          assault_index: number
          correct_full?: number | null
          correct_rotation?: number | null
          created_at?: string
          damage?: number | null
          id?: string
          neither?: number | null
          session_id: string
          submitted_by?: string | null
        }
        Update: {
          answer?: Json
          assault_index?: number
          correct_full?: number | null
          correct_rotation?: number | null
          created_at?: string
          damage?: number | null
          id?: string
          neither?: number | null
          session_id?: string
          submitted_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orienta_raid_attempts_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "orienta_raid_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_raid_attempts_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_raid_chat: {
        Row: {
          created_at: string
          id: string
          pseudo: string | null
          role: string | null
          session_id: string
          text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          pseudo?: string | null
          role?: string | null
          session_id: string
          text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          pseudo?: string | null
          role?: string | null
          session_id?: string
          text?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orienta_raid_chat_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "orienta_raid_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_raid_chat_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_raid_participants: {
        Row: {
          id: string
          is_ready: boolean
          joined_at: string
          last_seen: string
          pseudo: string | null
          role: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_ready?: boolean
          joined_at?: string
          last_seen?: string
          pseudo?: string | null
          role?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_ready?: boolean
          joined_at?: string
          last_seen?: string
          pseudo?: string | null
          role?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_raid_participants_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "orienta_raid_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orienta_raid_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_raid_session_secrets: {
        Row: {
          card_map: Json
          decoy_handle: string | null
          grid_ids: string[]
          last_feedback: Json | null
          session_id: string
          slot_permutation: number[]
          updated_at: string
        }
        Insert: {
          card_map?: Json
          decoy_handle?: string | null
          grid_ids?: string[]
          last_feedback?: Json | null
          session_id: string
          slot_permutation?: number[]
          updated_at?: string
        }
        Update: {
          card_map?: Json
          decoy_handle?: string | null
          grid_ids?: string[]
          last_feedback?: Json | null
          session_id?: string
          slot_permutation?: number[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_raid_session_secrets_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "orienta_raid_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_raid_sessions: {
        Row: {
          assault_count: number
          assault_deadline: string | null
          assault_index: number
          attempts_remaining: number
          board: Json
          boss_key: string
          boss_level: number | null
          card_order: string[]
          created_at: string
          current_hp: number
          ended_at: string | null
          id: string
          is_open_public: boolean | null
          is_test: boolean
          lives: number
          max_hp: number
          perils: string[]
          sonar_used: boolean
          started_at: string | null
          status: string
          tier: number | null
          window_closes_at: string
          window_opens_at: string
        }
        Insert: {
          assault_count?: number
          assault_deadline?: string | null
          assault_index?: number
          attempts_remaining?: number
          board?: Json
          boss_key: string
          boss_level?: number | null
          card_order?: string[]
          created_at?: string
          current_hp?: number
          ended_at?: string | null
          id?: string
          is_open_public?: boolean | null
          is_test?: boolean
          lives?: number
          max_hp?: number
          perils?: string[]
          sonar_used?: boolean
          started_at?: string | null
          status?: string
          tier?: number | null
          window_closes_at?: string
          window_opens_at?: string
        }
        Update: {
          assault_count?: number
          assault_deadline?: string | null
          assault_index?: number
          attempts_remaining?: number
          board?: Json
          boss_key?: string
          boss_level?: number | null
          card_order?: string[]
          created_at?: string
          current_hp?: number
          ended_at?: string | null
          id?: string
          is_open_public?: boolean | null
          is_test?: boolean
          lives?: number
          max_hp?: number
          perils?: string[]
          sonar_used?: boolean
          started_at?: string | null
          status?: string
          tier?: number | null
          window_closes_at?: string
          window_opens_at?: string
        }
        Relationships: []
      }
      orienta_shop_items: {
        Row: {
          active: boolean
          code: string
          cost_jetons: number
          created_at: string
          description: string
          family: string
          kind: string
          payload: Json
          sort_order: number
          title: string
        }
        Insert: {
          active?: boolean
          code: string
          cost_jetons: number
          created_at?: string
          description?: string
          family: string
          kind: string
          payload?: Json
          sort_order?: number
          title: string
        }
        Update: {
          active?: boolean
          code?: string
          cost_jetons?: number
          created_at?: string
          description?: string
          family?: string
          kind?: string
          payload?: Json
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      orienta_suggestions: {
        Row: {
          content: string
          created_at: string
          id: string
          pseudo: string
          status: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          pseudo: string
          status?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          pseudo?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_user_unlocks: {
        Row: {
          acquired_at: string
          equipped: boolean
          id: string
          item_code: string
          user_id: string
        }
        Insert: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_code: string
          user_id: string
        }
        Update: {
          acquired_at?: string
          equipped?: boolean
          id?: string
          item_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orienta_user_unlocks_item_code_fkey"
            columns: ["item_code"]
            isOneToOne: false
            referencedRelation: "orienta_shop_items"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "orienta_user_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "orienta_users"
            referencedColumns: ["id"]
          },
        ]
      }
      orienta_users: {
        Row: {
          combo_count: number
          combo_updated_at: string | null
          community_unlocked_seen: boolean | null
          created_at: string | null
          equipped_color: string | null
          equipped_frame: string | null
          equipped_theme: string | null
          equipped_title: string | null
          equipped_victory: string | null
          extra_create_slots: number
          id: string
          is_system: boolean
          jetons: number
          last_play_date: string | null
          last_played_at: string | null
          level: number
          new_wojo_seen: boolean
          pseudo: string
          rename_tokens: number
          selected_skin: number
          status_text: string | null
          streak_best: number | null
          streak_current: number | null
          streak_freeze_tokens: number
          streak_last_reset_at: string | null
          tour_create_clues_done: boolean | null
          tour_create_placement_done: boolean | null
          tour_play_done: boolean | null
          tutorial_modal_done: boolean | null
          xp: number
          xp_contributed: number | null
        }
        Insert: {
          combo_count?: number
          combo_updated_at?: string | null
          community_unlocked_seen?: boolean | null
          created_at?: string | null
          equipped_color?: string | null
          equipped_frame?: string | null
          equipped_theme?: string | null
          equipped_title?: string | null
          equipped_victory?: string | null
          extra_create_slots?: number
          id?: string
          is_system?: boolean
          jetons?: number
          last_play_date?: string | null
          last_played_at?: string | null
          level?: number
          new_wojo_seen?: boolean
          pseudo: string
          rename_tokens?: number
          selected_skin?: number
          status_text?: string | null
          streak_best?: number | null
          streak_current?: number | null
          streak_freeze_tokens?: number
          streak_last_reset_at?: string | null
          tour_create_clues_done?: boolean | null
          tour_create_placement_done?: boolean | null
          tour_play_done?: boolean | null
          tutorial_modal_done?: boolean | null
          xp?: number
          xp_contributed?: number | null
        }
        Update: {
          combo_count?: number
          combo_updated_at?: string | null
          community_unlocked_seen?: boolean | null
          created_at?: string | null
          equipped_color?: string | null
          equipped_frame?: string | null
          equipped_theme?: string | null
          equipped_title?: string | null
          equipped_victory?: string | null
          extra_create_slots?: number
          id?: string
          is_system?: boolean
          jetons?: number
          last_play_date?: string | null
          last_played_at?: string | null
          level?: number
          new_wojo_seen?: boolean
          pseudo?: string
          rename_tokens?: number
          selected_skin?: number
          status_text?: string | null
          streak_best?: number | null
          streak_current?: number | null
          streak_freeze_tokens?: number
          streak_last_reset_at?: string | null
          tour_create_clues_done?: boolean | null
          tour_create_placement_done?: boolean | null
          tour_play_done?: boolean | null
          tutorial_modal_done?: boolean | null
          xp?: number
          xp_contributed?: number | null
        }
        Relationships: []
      }
      orienta_wheel_segments: {
        Row: {
          active: boolean
          color: string
          id: string
          idx: number
          label: string
          reward_type: string
          reward_value: number
          weight: number
        }
        Insert: {
          active?: boolean
          color?: string
          id?: string
          idx: number
          label: string
          reward_type: string
          reward_value?: number
          weight?: number
        }
        Update: {
          active?: boolean
          color?: string
          id?: string
          idx?: number
          label?: string
          reward_type?: string
          reward_value?: number
          weight?: number
        }
        Relationships: []
      }
      orienta_word_cards: {
        Row: {
          created_at: string | null
          difficulty: string | null
          id: string
          playable: boolean
          tags: string[] | null
          word_bottom: string
          word_left: string
          word_right: string
          word_top: string
        }
        Insert: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          playable?: boolean
          tags?: string[] | null
          word_bottom: string
          word_left: string
          word_right: string
          word_top: string
        }
        Update: {
          created_at?: string | null
          difficulty?: string | null
          id?: string
          playable?: boolean
          tags?: string[] | null
          word_bottom?: string
          word_left?: string
          word_right?: string
          word_top?: string
        }
        Relationships: []
      }
      orienta_words: {
        Row: {
          created_at: string | null
          id: string
          playable: boolean
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          playable?: boolean
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          playable?: boolean
          text?: string
        }
        Relationships: []
      }
      rental_baux: {
        Row: {
          charges: number | null
          created_at: string | null
          date_debut: string | null
          date_fin: string | null
          id: number
          locataire_id: number | null
          locataire_id_2: number | null
          logement_id: number | null
          loyer_mensuel: number | null
          nom: string
          statut: string | null
          workspace: string | null
        }
        Insert: {
          charges?: number | null
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          id?: number
          locataire_id?: number | null
          locataire_id_2?: number | null
          logement_id?: number | null
          loyer_mensuel?: number | null
          nom: string
          statut?: string | null
          workspace?: string | null
        }
        Update: {
          charges?: number | null
          created_at?: string | null
          date_debut?: string | null
          date_fin?: string | null
          id?: number
          locataire_id?: number | null
          locataire_id_2?: number | null
          logement_id?: number | null
          loyer_mensuel?: number | null
          nom?: string
          statut?: string | null
          workspace?: string | null
        }
        Relationships: []
      }
      rental_depenses: {
        Row: {
          created_at: string | null
          date: string | null
          historique: number | null
          id: number
          logement_id: number | null
          montant: number | null
          nom: string
          note: string | null
          type: string | null
          workspace: string | null
        }
        Insert: {
          created_at?: string | null
          date?: string | null
          historique?: number | null
          id?: number
          logement_id?: number | null
          montant?: number | null
          nom: string
          note?: string | null
          type?: string | null
          workspace?: string | null
        }
        Update: {
          created_at?: string | null
          date?: string | null
          historique?: number | null
          id?: number
          logement_id?: number | null
          montant?: number | null
          nom?: string
          note?: string | null
          type?: string | null
          workspace?: string | null
        }
        Relationships: []
      }
      rental_locataires: {
        Row: {
          created_at: string | null
          email: string | null
          id: number
          nom: string
          telephone: string | null
          workspace: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: number
          nom: string
          telephone?: string | null
          workspace?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: number
          nom?: string
          telephone?: string | null
          workspace?: string | null
        }
        Relationships: []
      }
      rental_logements: {
        Row: {
          adresse: string | null
          created_at: string | null
          id: number
          loyer_theorique: number | null
          nom: string
          statut: string | null
          surface: number | null
          workspace: string | null
        }
        Insert: {
          adresse?: string | null
          created_at?: string | null
          id?: number
          loyer_theorique?: number | null
          nom: string
          statut?: string | null
          surface?: number | null
          workspace?: string | null
        }
        Update: {
          adresse?: string | null
          created_at?: string | null
          id?: number
          loyer_theorique?: number | null
          nom?: string
          statut?: string | null
          surface?: number | null
          workspace?: string | null
        }
        Relationships: []
      }
      rental_loyers: {
        Row: {
          bail_id: number | null
          created_at: string | null
          date_paiement: string | null
          id: number
          logement_id: number | null
          mois: string
          montant_du: number | null
          montant_paye: number | null
          nb_mois_loue: number | null
          note: string | null
          statut: string | null
          type: string | null
          workspace: string | null
        }
        Insert: {
          bail_id?: number | null
          created_at?: string | null
          date_paiement?: string | null
          id?: number
          logement_id?: number | null
          mois: string
          montant_du?: number | null
          montant_paye?: number | null
          nb_mois_loue?: number | null
          note?: string | null
          statut?: string | null
          type?: string | null
          workspace?: string | null
        }
        Update: {
          bail_id?: number | null
          created_at?: string | null
          date_paiement?: string | null
          id?: number
          logement_id?: number | null
          mois?: string
          montant_du?: number | null
          montant_paye?: number | null
          nb_mois_loue?: number | null
          note?: string | null
          statut?: string | null
          type?: string | null
          workspace?: string | null
        }
        Relationships: []
      }
      rental_parametres: {
        Row: {
          bailleur_adresse: string | null
          bailleur_nom: string | null
          date_reprise: string | null
          id: number
          workspace: string | null
        }
        Insert: {
          bailleur_adresse?: string | null
          bailleur_nom?: string | null
          date_reprise?: string | null
          id?: number
          workspace?: string | null
        }
        Update: {
          bailleur_adresse?: string | null
          bailleur_nom?: string | null
          date_reprise?: string | null
          id?: number
          workspace?: string | null
        }
        Relationships: []
      }
      rental_prets: {
        Row: {
          assurance_mensuelle: number | null
          banque: string | null
          capital_restant_du: number | null
          created_at: string | null
          date_debut: string | null
          duree_annees: number | null
          id: number
          logement_id: number | null
          mensualite: number | null
          montant_initial: number | null
          nom: string
          taux: number | null
          workspace: string | null
        }
        Insert: {
          assurance_mensuelle?: number | null
          banque?: string | null
          capital_restant_du?: number | null
          created_at?: string | null
          date_debut?: string | null
          duree_annees?: number | null
          id?: number
          logement_id?: number | null
          mensualite?: number | null
          montant_initial?: number | null
          nom: string
          taux?: number | null
          workspace?: string | null
        }
        Update: {
          assurance_mensuelle?: number | null
          banque?: string | null
          capital_restant_du?: number | null
          created_at?: string | null
          date_debut?: string | null
          duree_annees?: number | null
          id?: number
          logement_id?: number | null
          mensualite?: number | null
          montant_initial?: number | null
          nom?: string
          taux?: number | null
          workspace?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_user_xp: { Args: { amount: number; uid: string }; Returns: undefined }
      apply_quest_progress: {
        Args: {
          p_attempts_count: number
          p_daily_key: string
          p_grid_id: string
          p_is_daily_grid: boolean
          p_success: boolean
          p_time_seconds: number
          p_user_id: string
          p_week_key: string
        }
        Returns: undefined
      }
      award_raid_victory: { Args: { p_session_id: string }; Returns: number }
      award_xp_on_play: {
        Args: {
          p_attempt_bonus?: number
          p_combo_bonus?: number
          p_grid_id: string
          p_player_id: string
          p_streak_bonus?: number
          p_success: boolean
        }
        Returns: number
      }
      boost_grid: {
        Args: { p_grid_id: string; p_user_id: string }
        Returns: Json
      }
      claim_quest_reward: {
        Args: { p_progress_id: string; p_user_id: string }
        Returns: Json
      }
      consume_create_slot: { Args: { p_user_id: string }; Returns: boolean }
      consume_streak_freeze: { Args: { p_user_id: string }; Returns: boolean }
      ensure_quest_period: {
        Args: { p_period_key: string; p_scope: string; p_user_id: string }
        Returns: undefined
      }
      equip_unlock: {
        Args: { p_equip: boolean; p_item_code: string; p_user_id: string }
        Returns: Json
      }
      gift_jetons: {
        Args: { p_amount: number; p_recipient: string; p_sender: string }
        Returns: Json
      }
      lumen_backfill_member: { Args: { p_email: string }; Returns: undefined }
      lumen_is_member: { Args: never; Returns: boolean }
      purchase_item: {
        Args: { p_item_code: string; p_user_id: string }
        Returns: Json
      }
      recalculate_collective_level: { Args: never; Returns: number }
      recalculate_user_level: { Args: { p_user_id: string }; Returns: number }
      rename_user: {
        Args: { p_new_pseudo: string; p_user_id: string }
        Returns: Json
      }
      set_user_status: {
        Args: { p_status: string; p_user_id: string }
        Returns: Json
      }
      spend_jetons: {
        Args: { p_cost: number; p_user_id: string }
        Returns: Json
      }
      spin_wheel: { Args: { p_user_id: string }; Returns: Json }
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
