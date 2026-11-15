import { getApiErrorMessage } from "@/api/client";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useCart } from "@/features/cart/hooks/useCart";
import { addCartItem } from "@/features/cart/api/cart.api";
import { useState } from "react";
import { useNavigate } from "react-router";
import "./add-to-cart.css";

export function AddToCartButton({ productId, stock, className = "" }: { productId: number; stock: number; className?: string }) {
  const { user, isLoading: isAuthLoading } = useAuth();
  const { setCart } = useCart();
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const buyer = user?.role.name === "buyer";
  const blockedRole = user !== null && !buyer;

  const handleAdd = async () => {
    if (!user) {
      void navigate("/login", { state: { from: `/cart?addProductId=${productId}` } });
      return;
    }
    if (!buyer || stock < 1) return;
    setIsAdding(true);
    setMessage(null);
    setIsError(false);
    try {
      const updated = await addCartItem(productId, 1);
      setCart(updated);
      setMessage("Added to cart");
    } catch (reason) {
      setMessage(getApiErrorMessage(reason));
      setIsError(true);
    } finally {
      setIsAdding(false);
    }
  };

  return <div className="marketplace-add-cart-wrap">
    <button type="button" className={`marketplace-add-cart ${className}`} onClick={() => void handleAdd()} disabled={isAuthLoading || isAdding || stock < 1 || blockedRole} title={blockedRole ? "Only buyer accounts can add items to a cart" : undefined}>
      {isAuthLoading ? "Checking account…" : isAdding ? "Adding…" : stock < 1 ? "Out of stock" : blockedRole ? "Buyer account required" : message === "Added to cart" ? "Add another" : "Add to cart"}
    </button>
    {message && <p className={`marketplace-cart-action-message ${isError ? "error" : "success"}`} role={isError ? "alert" : "status"}>{message}</p>}
  </div>;
}
