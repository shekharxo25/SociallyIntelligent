export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      brands: {
        Row: {
          id: string
          user_id: string
          name: string
          industry: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          industry?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          industry?: string | null
          created_at?: string
        }
      }
      platform_accounts: {
        Row: {
          id: string
          brand_id: string
          platform: 'youtube' | 'instagram' | 'x' | 'linkedin' | 'csv_upload'
          handle: string
          external_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          platform: 'youtube' | 'instagram' | 'x' | 'linkedin' | 'csv_upload'
          handle: string
          external_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          platform?: 'youtube' | 'instagram' | 'x' | 'linkedin' | 'csv_upload'
          handle?: string
          external_id?: string | null
          created_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          platform_account_id: string
          platform_post_id: string
          url: string | null
          posted_at: string
          content_text: string | null
          content_type: string | null
          hashtags: string[]
          created_at: string
        }
        Insert: {
          id?: string
          platform_account_id: string
          platform_post_id: string
          url?: string | null
          posted_at: string
          content_text?: string | null
          content_type?: string | null
          hashtags?: string[]
          created_at?: string
        }
        Update: {
          id?: string
          platform_account_id?: string
          platform_post_id?: string
          url?: string | null
          posted_at?: string
          content_text?: string | null
          content_type?: string | null
          hashtags?: string[]
          created_at?: string
        }
      }
      post_metrics: {
        Row: {
          id: string
          post_id: string
          captured_at: string
          likes: number
          comments: number
          shares: number
          views: number
          saves: number
          reach: number
          other_metrics: Json
        }
        Insert: {
          id?: string
          post_id: string
          captured_at?: string
          likes?: number
          comments?: number
          shares?: number
          views?: number
          saves?: number
          reach?: number
          other_metrics?: Json
        }
        Update: {
          id?: string
          post_id?: string
          captured_at?: string
          likes?: number
          comments?: number
          shares?: number
          views?: number
          saves?: number
          reach?: number
          other_metrics?: Json
        }
      }
      daily_aggregates: {
        Row: {
          id: string
          platform_account_id: string
          date: string
          followers: number
          impressions: number
          engagements: number
          engagement_rate: number
          sentiment_score_avg: number | null
          extra: Json
        }
        Insert: {
          id?: string
          platform_account_id: string
          date: string
          followers?: number
          impressions?: number
          engagements?: number
          engagement_rate?: number
          sentiment_score_avg?: number | null
          extra?: Json
        }
        Update: {
          id?: string
          platform_account_id?: string
          date?: string
          followers?: number
          impressions?: number
          engagements?: number
          engagement_rate?: number
          sentiment_score_avg?: number | null
          extra?: Json
        }
      }
      ai_insights: {
        Row: {
          id: string
          brand_id: string
          time_range_start: string
          time_range_end: string
          scope: string
          prompt: string | null
          summary_markdown: string
          raw_json: Json
          created_at: string
        }
        Insert: {
          id?: string
          brand_id: string
          time_range_start: string
          time_range_end: string
          scope: string
          prompt?: string | null
          summary_markdown: string
          raw_json?: Json
          created_at?: string
        }
        Update: {
          id?: string
          brand_id?: string
          time_range_start?: string
          time_range_end?: string
          scope?: string
          prompt?: string | null
          summary_markdown?: string
          raw_json?: Json
          created_at?: string
        }
      }
    }
  }
}
