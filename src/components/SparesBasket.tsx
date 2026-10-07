import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import type { SupplySpare } from "@/lib/supply-engine.types";
import { CreditCard, Minus, Plus, ShoppingCart, X } from "lucide-react";
import { toast } from "sonner";

export interface CartItem {
  part: SupplySpare;
  quantity: number;
}

type SparesBasketValue = {
  cart: CartItem[];
  total: number;
  count: number;
  add: (part: SupplySpare, quantity?: number) => void;
  open: () => void;
};

const SparesBasketContext = createContext<SparesBasketValue | null>(null);

function money(value: number) {
  return `£${value.toFixed(2)}`;
}

export function useSparesBasket() {
  const basket = useContext(SparesBasketContext);
  if (!basket) throw new Error("Basket is only available on the spares pages.");
  return basket;
}

export function SparesBasketProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"stripe" | "paypal">("stripe");
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const total = cart.reduce((sum, item) => sum + item.part.price * item.quantity, 0);
  const count = cart.reduce((sum, item) => sum + item.quantity, 0);

  const value = useMemo<SparesBasketValue>(
    () => ({
      cart,
      total,
      count,
      open: () => setIsOpen(true),
      add: (part, quantity = 1) => {
        const amount = Math.max(1, Math.floor(quantity));
        setCart((prev) => {
          const existing = prev.find((item) => item.part.id === part.id);
          if (existing) {
            return prev.map((item) =>
              item.part.id === part.id ? { ...item, quantity: item.quantity + amount } : item,
            );
          }
          return [...prev, { part, quantity: amount }];
        });
        toast.success(
          amount === 1
            ? `Added "${part.name}" to basket`
            : `Added ${amount} × "${part.name}" to basket`,
        );
        setIsOpen(true);
      },
    }),
    [cart, total, count],
  );

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev.flatMap((item) => {
        if (item.part.id !== id) return [item];
        const quantity = item.quantity + delta;
        return quantity > 0 ? [{ ...item, quantity }] : [];
      }),
    );
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    toast.loading(
      `Initializing ${paymentMethod === "stripe" ? "Stripe" : "PayPal"} Secure Checkout...`,
    );

    setTimeout(() => {
      setIsCheckingOut(false);
      toast.dismiss();
      toast.success(
        `Order placed via ${paymentMethod === "stripe" ? "Stripe Credit Card" : "PayPal"}! Thank you for ordering from Maxspect UK.`,
      );
      setCart([]);
      setIsOpen(false);
    }, 2000);
  };

  return (
    <SparesBasketContext.Provider value={value}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="relative w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col text-slate-100 z-10">
            <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-cyan-400" />
                <h2 className="text-base font-bold text-white">Your Basket</h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <ShoppingCart className="w-10 h-10 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-400">Your basket is empty.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.part.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                  >
                    <img
                      src={item.part.thumbnail || "/holding.jpg"}
                      alt=""
                      className="w-12 h-12 object-contain rounded bg-white shrink-0"
                      onError={(event) => {
                        if (!event.currentTarget.src.endsWith("/holding.jpg")) {
                          event.currentTarget.src = "/holding.jpg";
                        }
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{item.part.name}</h4>
                      <p className="text-xs font-mono text-cyan-400 font-extrabold mt-0.5">
                        {money(item.part.price)}
                      </p>
                    </div>
                    <div className="flex items-center bg-slate-900 rounded-lg border border-slate-800">
                      <button
                        onClick={() => updateQuantity(item.part.id, -1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="px-2 text-xs font-mono font-bold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.part.id, 1)}
                        className="p-1 text-slate-400 hover:text-white"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-800 bg-slate-950 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Subtotal</span>
                    <span className="font-mono text-slate-200">{money(total)}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>UK Standard Tracked Shipping</span>
                    <span className="font-mono text-emerald-400 font-bold">FREE</span>
                  </div>
                  <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
                    <span>Total (VAT Included)</span>
                    <span className="font-mono text-cyan-400">{money(total)}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-semibold text-slate-400 block">
                    Select Payment Gateway:
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setPaymentMethod("stripe")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMethod === "stripe"
                          ? "bg-cyan-500/10 border-cyan-500 text-cyan-400"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      Stripe Pay
                    </button>
                    <button
                      onClick={() => setPaymentMethod("paypal")}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                        paymentMethod === "paypal"
                          ? "bg-blue-500/10 border-blue-500 text-blue-400"
                          : "bg-slate-900 border-slate-800 text-slate-400"
                      }`}
                    >
                      PayPal Express
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-extrabold text-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isCheckingOut ? "Processing..." : `Pay ${money(total)} Now`}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </SparesBasketContext.Provider>
  );
}
