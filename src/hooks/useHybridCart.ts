"use client"

import { useEffect, useCallback } from "react"
import { useCartStore, CartItem } from "@/store/cart"
import {
  useCart,
  useCreateCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveFromCart,
} from "@/lib/medusa-hooks"

// Hook that provides cart operations with Medusa fallback
export function useHybridCart() {
  const {
    items,
    medusaCartId,
    addItem: addLocalItem,
    removeItem: removeLocalItem,
    updateQuantity: updateLocalQuantity,
    clearCart: clearLocalCart,
    total,
    setMedusaCartId,
    syncFromMedusa,
  } = useCartStore()

  // Medusa hooks
  const { data: medusaCart, isLoading: cartLoading } = useCart(medusaCartId)
  const createCartMutation = useCreateCart()
  const addToCartMutation = useAddToCart(medusaCartId || "")
  const updateCartItemMutation = useUpdateCartItem(medusaCartId || "")
  const removeFromCartMutation = useRemoveFromCart(medusaCartId || "")

  // Initialize Medusa cart if needed
  useEffect(() => {
    // Check localStorage for existing cart ID
    const storedCartId = typeof window !== "undefined" 
      ? localStorage.getItem("medusa_cart_id") 
      : null
    
    if (storedCartId && !medusaCartId) {
      setMedusaCartId(storedCartId)
    }
  }, [medusaCartId, setMedusaCartId])

  // Sync Medusa cart to local state when it changes
  useEffect(() => {
    if (medusaCart && medusaCart.items) {
      const convertedItems: CartItem[] = medusaCart.items.map((item: any) => ({
        id: item.variant?.product_id || item.id,
        name: item.title,
        price: item.unit_price / 100, // Medusa stores in cents
        image: item.thumbnail || "/images/awake-default.jpg",
        quantity: item.quantity,
        variantId: item.variant_id,
        lineItemId: item.id,
      }))
      syncFromMedusa(convertedItems, medusaCart.id)
    }
  }, [medusaCart, syncFromMedusa])

  // Add item to cart
  const addItem = useCallback(async (item: CartItem) => {
    // Always update local state immediately for UI responsiveness
    addLocalItem(item)

    // If we have a Medusa cart and variant ID, sync with Medusa
    if (medusaCartId && item.variantId) {
      try {
        await addToCartMutation.mutateAsync({
          variantId: item.variantId,
          quantity: item.quantity || 1,
        })
      } catch (error) {
        console.warn("Failed to sync with Medusa, using local cart:", error)
      }
    } else if (item.variantId && !medusaCartId) {
      // Create a new Medusa cart if we have a variant ID but no cart
      try {
        const cart = await createCartMutation.mutateAsync()
        setMedusaCartId(cart.id)
        localStorage.setItem("medusa_cart_id", cart.id)
        // Add item to the new cart
        await addToCartMutation.mutateAsync({
          variantId: item.variantId,
          quantity: item.quantity || 1,
        })
      } catch (error) {
        console.warn("Failed to create Medusa cart:", error)
      }
    }
  }, [medusaCartId, addLocalItem, addToCartMutation, createCartMutation, setMedusaCartId])

  // Remove item from cart
  const removeItem = useCallback(async (id: string) => {
    const item = items.find(i => i.id === id)
    removeLocalItem(id)

    if (medusaCartId && item?.lineItemId) {
      try {
        await removeFromCartMutation.mutateAsync(item.lineItemId)
      } catch (error) {
        console.warn("Failed to remove from Medusa cart:", error)
      }
    }
  }, [medusaCartId, items, removeLocalItem, removeFromCartMutation])

  // Update item quantity
  const updateQuantity = useCallback(async (id: string, quantity: number) => {
    const item = items.find(i => i.id === id)
    updateLocalQuantity(id, quantity)

    if (medusaCartId && item?.lineItemId) {
      try {
        if (quantity < 1) {
          await removeFromCartMutation.mutateAsync(item.lineItemId)
        } else {
          await updateCartItemMutation.mutateAsync({
            lineItemId: item.lineItemId,
            quantity,
          })
        }
      } catch (error) {
        console.warn("Failed to update Medusa cart:", error)
      }
    }
  }, [medusaCartId, items, updateLocalQuantity, updateCartItemMutation, removeFromCartMutation])

  // Clear cart
  const clearCart = useCallback(() => {
    clearLocalCart()
    localStorage.removeItem("medusa_cart_id")
  }, [clearLocalCart])

  return {
    items,
    medusaCartId,
    isLoading: cartLoading,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    isMedusaConnected: !!medusaCartId,
  }
}

