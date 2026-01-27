// Supabase database types
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
      products: {
        Row: {
          id: string
          name: string
          price: number
          price_ex_vat: number
          cost_eur: number | null
          category: string
          category_tag: string | null
          description: string | null
          image: string | null
          images: Json | null
          videos: Json | null
          badge: string | null
          battery: string | null
          skill_level: string | null
          specs: Json | null
          features: Json | null
          in_stock: boolean
          stock_quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          price: number
          price_ex_vat: number
          cost_eur?: number | null
          category: string
          category_tag?: string | null
          description?: string | null
          image?: string | null
          images?: Json | null
          videos?: Json | null
          badge?: string | null
          battery?: string | null
          skill_level?: string | null
          specs?: Json | null
          features?: Json | null
          in_stock?: boolean
          stock_quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          price?: number
          price_ex_vat?: number
          cost_eur?: number | null
          category?: string
          category_tag?: string | null
          description?: string | null
          image?: string | null
          images?: Json | null
          videos?: Json | null
          badge?: string | null
          battery?: string | null
          skill_level?: string | null
          specs?: Json | null
          features?: Json | null
          in_stock?: boolean
          stock_quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      demo_locations: {
        Row: {
          id: string
          name: string
          area: string
          image: string
          description: string | null
          price: number | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          area: string
          image: string
          description?: string | null
          price?: number | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          area?: string
          image?: string
          description?: string | null
          price?: number | null
          active?: boolean
          created?: string
          updated_at?: string
        }
      }
      cart_items: {
        Row: {
          id: string
          session_id: string
          product_id: string
          name: string
          price: number
          image: string
          quantity: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          product_id: string
          name: string
          price: number
          image: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          product_id?: string
          name?: string
          price?: number
          image?: string
          quantity?: number
          created_at?: string
          updated_at?: string
        }
      }
      wishlist_items: {
        Row: {
          id: string
          session_id: string
          product_id: string
          name: string
          price: number
          image: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          product_id: string
          name: string
          price: number
          image: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          product_id?: string
          name?: string
          price?: number
          image?: string
          created_at?: string
        }
      }
      store_settings: {
        Row: {
          id: string
          store_name: string
          email: string
          phone: string
          whatsapp: string
          currency: string
          tax_rate: number
          exchange_rate: number
          margin: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_name?: string
          email?: string
          phone?: string
          whatsapp?: string
          currency?: string
          tax_rate?: number
          exchange_rate?: number
          margin?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_name?: string
          email?: string
          phone?: string
          whatsapp?: string
          currency?: string
          tax_rate?: number
          exchange_rate?: number
          margin?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
