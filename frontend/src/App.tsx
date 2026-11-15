import AppRoutes from "@/routes/AppRoutes";
import { CartProvider } from "@/features/cart/context/CartContext";

export default function App() {
  return <CartProvider><AppRoutes /></CartProvider>;
}
