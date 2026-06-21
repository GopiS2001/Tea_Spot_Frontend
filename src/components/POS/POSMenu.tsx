import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, IndianRupee, TrendingUp, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { motion } from "motion/react";
import { useCart } from "../Cart/CartContext";
import { toast } from "sonner";
import { supabase } from "../../supabaseClient"; // ✅ your Supabase client

interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  image: string;
  sales: number;
  allergens: string[];
  status: string;
}

export function POSMenu() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { cart, updateQuantity, removeItem, clearCart, getCartTotaladdToCart, getCartCount } = useCart();
  const [categories, setCategories] = useState<string[]>(["all"]);
  const [isLoading, setIsLoading] = useState(true);
  


  // ✅ Fetch menu items from Supabase
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, category, price, cost, tax, sales, status, allergens");

      if (error) {
        console.error("Supabase Error:", error);
        toast.error("Failed to load menu items");
        return;
      }

      const items = (data || []).map((row: any) => ({
        id: String(row.id),
        name: row.name || "Unnamed Item",
        category: row.category || "Uncategorized",
        price: Number(row.price || 0),
        cost: Number(row.cost || 0),
        sales: Number(row.sales || 0),
        status: row.status || "active",
        allergens: row.allergens || [],
        image:
          row.category === "Pizza"
            ? "🍕"
            : row.category === "Burgers"
            ? "🍔"
            : row.category === "Salads"
            ? "🥗"
            : row.category === "Pasta"
            ? "🍝"
            : "🍽️",
      }));

      setMenuItems(items);
      const uniqueCategories = ["all", ...new Set(items.map((i) => i.category))];
      setCategories(uniqueCategories);
      setIsLoading(false);
    };

    fetchMenu();
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getMargin = (price: number, cost: number) => {
    return price > 0 ? (((price - cost) / price) * 100).toFixed(0) : "0";
  };

  const handleAddToCart = (item: MenuItem) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      category: item.category,
      image: item.image,
      modifiers: [],
    });
    toast.success(`${item.name} added to cart!`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>POS Menu</h1>
          <p className="text-muted-foreground">Select and add items to your order</p>
        </div>
        <Button
          className="gap-2 bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
          onClick={() => toast.info("Live menu updates automatically")}
        >
          <Plus className="w-4 h-4" />
          Sync Menu
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-0"
            />
          </div>
        </div>

        {/* ✅ Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat === "all" ? "All Items" : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* ✅ Menu Grid */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              Loading menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No menu items found
            </div>
          ) : (
            filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7DD3FC]/20 to-[#FBCFE8]/20 flex items-center justify-center text-2xl">
                          {item.image}
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Price</span>
                        <span className="text-[#7DD3FC]">₹{item.price.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Cost</span>
                        <span>₹{item.cost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-muted-foreground">Margin</span>
                        <Badge className="bg-[#BBF7D0] text-[#047857]">
                          {getMargin(item.price, item.cost)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          Sales
                        </div>
                        <span className="text-sm">{item.sales} orders</span>
                      </div>

                      {/* ✅ Allergens */}
                      {item.allergens && item.allergens.length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs text-muted-foreground mb-1">Allergens:</div>
                          <div className="flex flex-wrap gap-1">
                            {item.allergens.map((a, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {a}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ✅ Add to Cart */}
                      <Button
                        className="w-full bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black gap-2 mt-3"
                        size="sm"
                        onClick={() => handleAddToCart(item)}
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </Card>

      {/* ✅ Floating Cart */}
      {getCartCount() > 0 && (
        <motion.div
          className="fixed bottom-6 right-6 bg-sky-500 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 cursor-pointer"
          whileHover={{ scale: 1.05 }}
          onClick={() => toast.info("Redirecting to Cart...")}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>View Cart</span>
          <Badge variant="secondary" className="text-black ml-1">
            {getCartCount()}
          </Badge>
        </motion.div>
      )}
    </div>
  );
}
