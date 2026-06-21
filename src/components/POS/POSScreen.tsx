import { useState } from "react";
import { Search, Plus, Minus, Trash2, User, CreditCard, IndianRupee, Percent } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { motion, AnimatePresence } from "motion/react";
import { Separator } from "../ui/separator";
import { useCart } from "../Cart/CartContext";

const categories = ["All", "Pizza", "Burgers", "Salads", "Pasta", "Drinks", "Desserts"];

const menuItems = [
  { id: 1, name: "Margherita Pizza", price: 15.99, category: "Pizza", image: "🍕", modifiers: ["Small", "Medium", "Large"] },
  { id: 2, name: "Pepperoni Pizza", price: 17.99, category: "Pizza", image: "🍕", modifiers: ["Small", "Medium", "Large"] },
  { id: 3, name: "Classic Burger", price: 12.99, category: "Burgers", image: "🍔", modifiers: ["Add Cheese", "Add Bacon"] },
  { id: 4, name: "Caesar Salad", price: 10.99, category: "Salads", image: "🥗", modifiers: [] },
  { id: 5, name: "Pasta Carbonara", price: 14.99, category: "Pasta", image: "🍝", modifiers: [] },
  { id: 6, name: "Coca Cola", price: 2.99, category: "Drinks", image: "🥤", modifiers: [] },
  { id: 7, name: "Cheeseburger Deluxe", price: 15.99, category: "Burgers", image: "🍔", modifiers: ["Add Cheese", "Add Bacon"] },
  { id: 8, name: "Greek Salad", price: 11.99, category: "Salads", image: "🥗", modifiers: [] },
];

export function POSScreen() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway" | "delivery">("dine-in");
  const [tableNumber, setTableNumber] = useState("T-12");
  const [discountPercent, setDiscountPercent] = useState(0);
  const { cart, addToCart, updateQuantity, removeItem } = useCart();

  const filteredItems = menuItems.filter(
    (item) =>
      (selectedCategory === "All" || item.category === selectedCategory) &&
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = subtotal * 0.08;
  const serviceCharge = subtotal * 0.05;
  const discount = subtotal * (discountPercent / 100);
  const total = subtotal + tax + serviceCharge - discount;

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col">
        {/* Order Type Tabs */}
        <Tabs value={orderType} onValueChange={(v) => setOrderType(v as any)} className="mb-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="dine-in">Dine In</TabsTrigger>
            <TabsTrigger value="takeaway">Takeaway</TabsTrigger>
            <TabsTrigger value="delivery">Delivery</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search & Table */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-0"
            />
          </div>
          {orderType === "dine-in" && (
            <Input
              placeholder="Table"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-24 bg-input-background border-0"
            />
          )}
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? "bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black whitespace-nowrap"
                  : "whitespace-nowrap"
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Card
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square bg-gradient-to-br from-[#7DD3FC]/20 to-[#FBCFE8]/20 rounded-lg flex items-center justify-center text-4xl mb-3">
                      {item.image}
                    </div>
                    <h4 className="text-sm mb-1">{item.name}</h4>
                    <div className="flex items-center justify-between">
                      <span className="text-[#7DD3FC]">₹{item.price}</span>
                      {item.modifiers.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          +Options
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3>Current Order</h3>
          <Badge className="bg-[#FBCFE8] text-black">
            {orderType === "dine-in" ? tableNumber : orderType}
          </Badge>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-6 -mx-6 px-6">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No items in cart</p>
                <p className="text-sm mt-2">Start adding items from the menu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div className="flex-1">
                      <div className="text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">₹{item.price.toFixed(2)}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        {/* Customer & Notes */}
        <div className="space-y-3 mb-4">
          <Button variant="outline" className="w-full justify-start gap-2">
            <User className="w-4 h-4" />
            Add Customer
          </Button>
          <Input placeholder="Order notes..." className="bg-input-background border-0" />
        </div>

        <Separator className="my-4" />

        {/* Totals */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax (8%)</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Service (5%)</span>
            <span>₹{serviceCharge.toFixed(2)}</span>
          </div>
          {discountPercent > 0 && (
            <div className="flex justify-between text-sm text-[#10B981]">
              <span>Discount ({discountPercent}%)</span>
              <span>-₹{discount.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span>Total</span>
            <span className="text-xl text-[#7DD3FC]">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Percent className="w-4 h-4" />
            Discount
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <IndianRupee className="w-4 h-4" />
            Split Bill
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button variant="outline" disabled={cart.length === 0}>
            Save & Close
          </Button>
          <Button
            className="bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black gap-2"
            disabled={cart.length === 0}
          >
            <CreditCard className="w-4 h-4" />
            Pay Now
          </Button>
        </div>
      </div>
    </div>
  );
}
