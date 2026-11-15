import { getApiErrorMessage } from "@/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { getCart } from "../api/cart.api";
import type { Cart } from "../types/cart.types";

export interface CartContextValue {
  cart: Cart | null;
  isLoading: boolean;
  error: string | null;
  refreshCart: () => Promise<Cart | null>;
  setCart: (cart: Cart) => void;
  retry: () => void;
}

export const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  const refreshCart = useCallback(async () => {
    if (user?.role.name !== "buyer") {
      setCart(null);
      setError(null);
      setIsLoading(false);
      return null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const result = await getCart();
      setCart(result);
      return result;
    } catch (reason) {
      setCart(null);
      setError(getApiErrorMessage(reason));
      throw reason;
    } finally {
      setIsLoading(false);
    }
  }, [user?.role.name]);

  useEffect(() => {
    if (isAuthLoading) return;
    if (user?.role.name !== "buyer") {
      setCart(null);
      setError(null);
      setIsLoading(false);
      return;
    }
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);
    getCart(controller.signal)
      .then((result) => { if (!controller.signal.aborted) setCart(result); })
      .catch((reason: unknown) => { if (!controller.signal.aborted) { setCart(null); setError(getApiErrorMessage(reason)); } })
      .finally(() => { if (!controller.signal.aborted) setIsLoading(false); });
    return () => controller.abort();
  }, [isAuthLoading, user?.id, user?.role.name, reload]);

  const retry = useCallback(() => setReload((value) => value + 1), []);
  const value = useMemo(() => ({ cart, isLoading, error, refreshCart, setCart, retry }), [cart, isLoading, error, refreshCart, retry]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
