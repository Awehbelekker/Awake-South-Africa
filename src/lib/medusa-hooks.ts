// React Query hooks for Medusa API
// Provides caching, loading states, and automatic refetching

"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  getProducts,
  getProductByHandle,
  getProductById,
  createCart,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  updateCartForCheckout,
  addShippingMethod,
  getShippingOptions,
  setPaymentSession,
  completeCart,
  getOrder,
  loginCustomer,
  registerCustomer,
  getCustomer,
  logoutCustomer,
  adminLogin,
  adminLogout,
  getAdminSession,
  adminGetProducts,
  adminUpdateProduct,
  adminUpdateVariant,
  adminGetOrders,
  adminGetCustomers,
} from "./medusa-client"

// Query Keys
export const queryKeys = {
  products: ["products"] as const,
  product: (id: string) => ["product", id] as const,
  productByHandle: (handle: string) => ["product", "handle", handle] as const,
  cart: (id: string) => ["cart", id] as const,
  customer: ["customer"] as const,
  adminSession: ["admin", "session"] as const,
  adminProducts: ["admin", "products"] as const,
  adminOrders: ["admin", "orders"] as const,
  adminCustomers: ["admin", "customers"] as const,
}

// ============================================
// PRODUCT HOOKS
// ============================================

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: getProducts,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: queryKeys.product(id),
    queryFn: () => getProductById(id),
    enabled: !!id,
  })
}

export function useProductByHandle(handle: string) {
  return useQuery({
    queryKey: queryKeys.productByHandle(handle),
    queryFn: () => getProductByHandle(handle),
    enabled: !!handle,
  })
}

// ============================================
// CART HOOKS
// ============================================

export function useCart(cartId: string | null) {
  return useQuery({
    queryKey: queryKeys.cart(cartId || ""),
    queryFn: () => getCart(cartId!),
    enabled: !!cartId,
  })
}

export function useCreateCart() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createCart,
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cart.id), cart)
      // Store cart ID in localStorage for persistence
      if (typeof window !== "undefined") {
        localStorage.setItem("medusa_cart_id", cart.id)
      }
    },
  })
}

export function useAddToCart(cartId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ variantId, quantity }: { variantId: string; quantity: number }) =>
      addToCart(cartId, variantId, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
    },
  })
}

export function useUpdateCartItem(cartId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ lineItemId, quantity }: { lineItemId: string; quantity: number }) =>
      updateCartItem(cartId, lineItemId, quantity),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
    },
  })
}

export function useRemoveFromCart(cartId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (lineItemId: string) => removeFromCart(cartId, lineItemId),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
    },
  })
}

// ============================================
// CHECKOUT HOOKS
// ============================================

export function useUpdateCartForCheckout(cartId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: Parameters<typeof updateCartForCheckout>[1]) =>
      updateCartForCheckout(cartId, data),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
    },
  })
}

export function useShippingOptions(cartId: string | null) {
  return useQuery({
    queryKey: ["shipping_options", cartId],
    queryFn: () => getShippingOptions(cartId!),
    enabled: !!cartId,
  })
}

export function useAddShippingMethod(cartId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (optionId: string) => addShippingMethod(cartId, optionId),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
    },
  })
}

export function useSetPaymentSession(cartId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (providerId: string = "manual") => setPaymentSession(cartId, providerId),
    onSuccess: (cart) => {
      queryClient.setQueryData(queryKeys.cart(cartId), cart)
    },
  })
}

export function useCompleteCart(cartId: string) {
  return useMutation({
    mutationFn: () => completeCart(cartId),
  })
}

export function useOrder(orderId: string | null) {
  return useQuery({
    queryKey: ["order", orderId],
    queryFn: () => getOrder(orderId!),
    enabled: !!orderId,
  })
}

// ============================================
// CUSTOMER/AUTH HOOKS
// ============================================

export function useCustomer() {
  return useQuery({
    queryKey: queryKeys.customer,
    queryFn: getCustomer,
    retry: false, // Don't retry if not logged in
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      loginCustomer(email, password),
    onSuccess: (customer) => {
      queryClient.setQueryData(queryKeys.customer, customer)
    },
  })
}

export function useRegister() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: registerCustomer,
    onSuccess: (customer) => {
      queryClient.setQueryData(queryKeys.customer, customer)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logoutCustomer,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.customer, null)
      queryClient.invalidateQueries({ queryKey: queryKeys.customer })
    },
  })
}

// ============================================
// ADMIN HOOKS
// ============================================

export function useAdminSession() {
  return useQuery({
    queryKey: queryKeys.adminSession,
    queryFn: getAdminSession,
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes
  })
}

export function useAdminLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      adminLogin(email, password),
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.adminSession, user)
    },
  })
}

export function useAdminLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: adminLogout,
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.adminSession, null)
      queryClient.invalidateQueries({ queryKey: ["admin"] })
    },
  })
}

export function useAdminProducts() {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const isConfigured = medusaUrl && medusaUrl !== 'http://localhost:9000'
  
  return useQuery({
    queryKey: queryKeys.adminProducts,
    queryFn: () => adminGetProducts(),
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: isConfigured, // Only run if Medusa is configured
    retry: false, // Never retry admin queries
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount
  })
}

export function useAdminUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string
      data: {
        title?: string
        description?: string
        thumbnail?: string
        metadata?: Record<string, unknown>
      }
    }) => adminUpdateProduct(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts })
    },
  })
}

export function useAdminUpdateVariant() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      data,
    }: {
      productId: string
      variantId: string
      data: {
        prices?: { amount: number; currency_code: string }[]
        inventory_quantity?: number
        metadata?: Record<string, unknown>
      }
    }) => adminUpdateVariant(productId, variantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.adminProducts })
    },
  })
}

export function useAdminOrders() {
  const medusaUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL
  const isConfigured = medusaUrl && medusaUrl !== 'http://localhost:9000'
  
  return useQuery({
    queryKey: queryKeys.adminOrders,
    queryFn: () => adminGetOrders(),
    staleTime: 1 * 60 * 1000, // 1 minute
    enabled: isConfigured, // Only run if Medusa is configured
    retry: false, // Never retry admin queries
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount
  })
}

export function useAdminCustomers() {
  return useQuery({
    queryKey: queryKeys.adminCustomers,
    queryFn: () => adminGetCustomers(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}
