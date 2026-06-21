import { ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { useCart } from "./CartContext";
import { motion, AnimatePresence } from "motion/react";

interface CartIndicatorProps {
  onNavigateToPOS: () => void;
}

export function CartIndicator({ onNavigateToPOS }: CartIndicatorProps) {
  const { getCartCount, getCartTotal } = useCart();
  const cartCount = getCartCount();
  const cartTotal = getCartTotal();

  if (cartCount === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          size="lg"
          onClick={onNavigateToPOS}
          className="bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black shadow-lg hover:shadow-xl transition-all gap-3 pr-6 h-14 rounded-full"
        >
          <div className="relative">
            <ShoppingCart className="w-5 h-5" />
            <Badge className="absolute -top-2 -right-2 bg-[#FBCFE8] text-black border-2 border-white h-5 w-5 p-0 flex items-center justify-center text-xs">
              {cartCount}
            </Badge>
          </div>
          <div className="flex flex-col items-start">
            <span className="text-xs opacity-80">View Cart</span>
            <span>₹{cartTotal.toFixed(2)}</span>
          </div>
        </Button>
      </motion.div>
    </AnimatePresence>
  );
}
