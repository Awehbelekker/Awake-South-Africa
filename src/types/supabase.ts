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
      tenants: {
        Row: {
          id: string
          slug: string
          name: string
          domain: string | null
          subdomain: string | null
          custom_domain_verified: boolean
          ssl_provisioned: boolean
          logo_url: string | null
          favicon_url: string | null
          primary_color: string
          secondary_color: string
          accent_color: string
          email: string | null
          phone: string | null
          whatsapp: string | null
          address: string | null
          currency: string
          tax_rate: number
          timezone: string
          medusa_store_id: string | null
          cognicore_business_id: string | null
          // Legacy PayFast fields (kept for backward compatibility)
          payfast_merchant_id: string | null
          payfast_merchant_key: string | null
          payfast_passphrase: string | null
          // Google Drive Integration
          google_drive_client_id: string | null
          google_drive_client_secret: string | null
          google_drive_refresh_token: string | null
          google_drive_folder_id: string | null
          google_drive_enabled: boolean
          // OneDrive Integration
          onedrive_client_id: string | null
          onedrive_client_secret: string | null
          onedrive_refresh_token: string | null
          onedrive_folder_id: string | null
          onedrive_enabled: boolean
          is_active: boolean
          plan: 'basic' | 'pro' | 'enterprise'
          created_at: string
          updated_at: string
          oauth_config: Json | null
          ai_config: Json | null
          automation_config: Json | null
        }
        Insert: {
          id?: string
          slug: string
          name: string
          domain?: string | null
          subdomain?: string | null
          custom_domain_verified?: boolean
          ssl_provisioned?: boolean
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          currency?: string
          tax_rate?: number
          timezone?: string
          medusa_store_id?: string | null
          cognicore_business_id?: string | null
          payfast_merchant_id?: string | null
          payfast_merchant_key?: string | null
          payfast_passphrase?: string | null
          google_drive_client_id?: string | null
          google_drive_client_secret?: string | null
          google_drive_refresh_token?: string | null
          google_drive_folder_id?: string | null
          google_drive_enabled?: boolean
          onedrive_client_id?: string | null
          onedrive_client_secret?: string | null
          onedrive_refresh_token?: string | null
          onedrive_folder_id?: string | null
          onedrive_enabled?: boolean
          is_active?: boolean
          plan?: 'basic' | 'pro' | 'enterprise'
          created_at?: string
          updated_at?: string
          oauth_config?: Json | null
          ai_config?: Json | null
          automation_config?: Json | null
        }
        Update: {
          slug?: string
          name?: string
          domain?: string | null
          subdomain?: string | null
          custom_domain_verified?: boolean
          ssl_provisioned?: boolean
          logo_url?: string | null
          favicon_url?: string | null
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          email?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          currency?: string
          tax_rate?: number
          timezone?: string
          medusa_store_id?: string | null
          cognicore_business_id?: string | null
          payfast_merchant_id?: string | null
          payfast_merchant_key?: string | null
          payfast_passphrase?: string | null
          google_drive_client_id?: string | null
          google_drive_client_secret?: string | null
          google_drive_refresh_token?: string | null
          google_drive_folder_id?: string | null
          google_drive_enabled?: boolean
          onedrive_client_id?: string | null
          onedrive_client_secret?: string | null
          onedrive_refresh_token?: string | null
          onedrive_folder_id?: string | null
          onedrive_enabled?: boolean
          is_active?: boolean
          plan?: 'basic' | 'pro' | 'enterprise'
          updated_at?: string
          oauth_config?: Json | null
          ai_config?: Json | null
          automation_config?: Json | null
        }
      }
      master_admin_activity_log: {
        Row: {
          id: string
          admin_email: string | null
          action: string
          tenant_id: string | null
          details: Json | null
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          admin_email?: string | null
          action: string
          tenant_id?: string | null
          details?: Json | null
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          admin_email?: string | null
          action?: string
          tenant_id?: string | null
          details?: Json | null
        }
      }
      admin_users: {
        Row: {
          id: string
          tenant_id: string
          email: string
          password_hash: string
          role: 'admin' | 'super_admin'
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          email: string
          password_hash: string
          role?: 'admin' | 'super_admin'
          created_at?: string
        }
        Update: {
          tenant_id?: string
          email?: string
          password_hash?: string
          role?: 'admin' | 'super_admin'
        }
      }
      products: {
        Row: {
          id: string
          tenant_id: string
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
          tenant_id: string
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
      payment_gateways: {
        Row: {
          id: string
          code: PaymentGatewayCode
          name: string
          description: string | null
          logo_url: string | null
          is_active: boolean
          supported_currencies: string[]
          documentation_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          code: PaymentGatewayCode
          name: string
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          supported_currencies?: string[]
          documentation_url?: string | null
          created_at?: string
        }
        Update: {
          code?: PaymentGatewayCode
          name?: string
          description?: string | null
          logo_url?: string | null
          is_active?: boolean
          supported_currencies?: string[]
          documentation_url?: string | null
        }
      }
      tenant_payment_gateways: {
        Row: {
          id: string
          tenant_id: string
          gateway_id: string
          credentials: PaymentGatewayCredentials
          is_enabled: boolean
          is_default: boolean
          is_sandbox: boolean
          display_order: number
          webhook_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          gateway_id: string
          credentials: PaymentGatewayCredentials
          is_enabled?: boolean
          is_default?: boolean
          is_sandbox?: boolean
          display_order?: number
          webhook_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          tenant_id?: string
          gateway_id?: string
          credentials?: PaymentGatewayCredentials
          is_enabled?: boolean
          is_default?: boolean
          is_sandbox?: boolean
          display_order?: number
          webhook_url?: string | null
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          order_number: string
          customer_id: string | null
          customer_email: string
          customer_phone: string | null
          subtotal: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          total: number
          currency: string
          shipping_address: Json
          billing_address: Json
          payment_method: string
          payment_reference: string | null
          status: string
          payment_status: string
          fulfillment_status: string
          paid_at: string | null
          shipped_at: string | null
          tracking_number: string | null
          tracking_url: string | null
          admin_notes: string | null
          customer_notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_number: string
          customer_id?: string | null
          customer_email: string
          customer_phone?: string | null
          subtotal: number
          tax_amount: number
          shipping_amount: number
          discount_amount: number
          total: number
          currency?: string
          shipping_address: Json
          billing_address: Json
          payment_method: string
          payment_reference?: string | null
          status?: string
          payment_status?: string
          fulfillment_status?: string
          paid_at?: string | null
          shipped_at?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          admin_notes?: string | null
          customer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          order_number?: string
          customer_id?: string | null
          customer_email?: string
          customer_phone?: string | null
          subtotal?: number
          tax_amount?: number
          shipping_amount?: number
          discount_amount?: number
          total?: number
          currency?: string
          shipping_address?: Json
          billing_address?: Json
          payment_method?: string
          payment_reference?: string | null
          status?: string
          payment_status?: string
          fulfillment_status?: string
          paid_at?: string | null
          shipped_at?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
          admin_notes?: string | null
          customer_notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string
          gateway: string
          transaction_id: string
          amount: number
          currency: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          gateway: string
          transaction_id: string
          amount: number
          currency: string
          status?: string
          created_at?: string
        }
        Update: {
          order_id?: string
          gateway?: string
          transaction_id?: string
          amount?: number
          currency?: string
          status?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      set_tenant_context: {
        Args: { tenant_id: string }
        Returns: void
      }
      get_tenant_payment_gateways: {
        Args: { p_tenant_id: string }
        Returns: Array<{
          gateway_code: PaymentGatewayCode
          gateway_name: string
          is_default: boolean
          is_sandbox: boolean
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// Payment Gateway Types
export type PaymentGatewayCode = 'payfast' | 'peach' | 'yoco' | 'ikhokha' | 'stripe'

// Credentials structure for each gateway
export interface PayFastCredentials {
  merchant_id: string
  merchant_key: string
  passphrase: string
}

export interface PeachPaymentsCredentials {
  entity_id: string
  access_token: string
}

export interface YocoCredentials {
  secret_key: string
  public_key: string
}

export interface IKhokhaCredentials {
  application_id: string
  application_secret: string
}

export interface StripeCredentials {
  secret_key: string
  publishable_key: string
  webhook_secret: string
}

export type PaymentGatewayCredentials =
  | PayFastCredentials
  | PeachPaymentsCredentials
  | YocoCredentials
  | IKhokhaCredentials
  | StripeCredentials

// Helper type exports for easier usage
export type Tenant = Database['public']['Tables']['tenants']['Row']
export type TenantInsert = Database['public']['Tables']['tenants']['Insert']
export type TenantUpdate = Database['public']['Tables']['tenants']['Update']
export type AdminUser = Database['public']['Tables']['admin_users']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']
export type PaymentGateway = Database['public']['Tables']['payment_gateways']['Row']
export type TenantPaymentGateway = Database['public']['Tables']['tenant_payment_gateways']['Row']
