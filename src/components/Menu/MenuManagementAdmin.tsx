import { useState, useEffect } from "react";
import { Plus, Search, Edit, Trash2, TrendingUp, ShoppingCart } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useCart } from "../Cart/CartContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { motion } from "motion/react";

import { toast } from "sonner";
import { supabase } from "../../supabaseClient";
import { formatCurrency } from "../../utils/formatCurrency";

interface MenuItem {
  sku: string;
  name: string;
  price: number;
  tax: number;
  category: string;
  qty: number;
  kitchen_display: boolean;
}

export function MenuManagement() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const { addToCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(["all"]);

  const [newItem, setNewItem] = useState({
    sku: "",
    name: "",
    price: "",
    tax: "",
    category: "",
    qty: "",
    kitchen_display: "",
  });

  // ✅ Fetch all menu items from Supabase
  useEffect(() => {
    const fetchMenu = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("menu_items")
        .select("sku, name, price, tax, category, qty, kitchen_display");

      if (error) {
        console.error("Supabase fetch error:", error);
        toast.error("Failed to load menu items");
        setIsLoading(false);
        return;
      }

      setMenuItems(data || []);
      setCategories(["all", ...new Set((data || []).map((i) => i.category))]);
      setIsLoading(false);
    };

    fetchMenu();
  }, []);

  // ✅ Filter menu items
  const filteredItems = menuItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // ✅ Add to cart
  const handleAddToCart = (item: any) => {
  addToCart({
    id: item.sku || item.id,
    name: item.name,
    price: Number(item.price),
    category: item.category,
    image: "🍽️",
  });
  toast.success(`${item.name} added to cart`);
};

  // ✅ Save new item
  const handleSaveNewItem = async () => {
    if (!newItem.name || !newItem.price || !newItem.category) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const { error } = await supabase.from("menu_items").insert([
        {
          sku: newItem.sku || `SKU-${Date.now()}`,
          name: newItem.name,
          price: parseFloat(newItem.price),
          tax: parseFloat(newItem.tax || "0"),
          category: newItem.category,
          qty: parseInt(newItem.qty || "0"),
          kitchen_display: newItem.kitchen_display === "true" ? true : false,
        },
      ]);

      if (error) throw error;

      toast.success("✅ Menu item added to Supabase successfully!");

      setNewItem({
        sku: "",
        name: "",
        price: "",
        tax: "",
        category: "",
        qty: "",
        kitchen_display: "",
      });

      const { data: updated } = await supabase
        .from("menu_items")
        .select("sku, name, price, tax, category, qty, kitchen_display")
        .order("name", { ascending: true });
      setMenuItems(updated || []);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to add new item");
    }
  };

  // ✅ Delete menu item
  const handleDelete = async (sku: string) => {
    const { error } = await supabase.from("menu_items").delete().eq("sku", sku);
    if (error) {
      toast.error("Failed to delete item");
      return;
    }
    toast.success("✅ Menu item deleted");
    setMenuItems((prev) => prev.filter((item) => item.sku !== sku));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Menu Management</h1>
          <p className="text-muted-foreground">Manage and sync your Supabase menu</p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2 bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black">
              <Plus className="w-4 h-4" />
              Add Menu Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Menu Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Item Name</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="e.g., Margherita Pizza"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    placeholder="e.g., Pizza"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Price (₹)</Label>
                  <Input
                    type="number"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    placeholder="150"
                  />
                </div>
                <div>
                  <Label>Tax (%)</Label>
                  <Input
                    type="number"
                    value={newItem.tax}
                    onChange={(e) => setNewItem({ ...newItem, tax: e.target.value })}
                    placeholder="5"
                  />
                </div>
              </div>

              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={newItem.qty}
                  onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div>
                <Label>Kitchen Display (true/false)</Label>
                <Input
                  value={newItem.kitchen_display}
                  onChange={(e) => setNewItem({ ...newItem, kitchen_display: e.target.value })}
                  placeholder="true / false"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline">Cancel</Button>
                <Button
                  className="bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
                  onClick={handleSaveNewItem}
                >
                  Save Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
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

        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat === "all" ? "All Items" : cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <div className="col-span-full text-center text-gray-500 py-12">Loading...</div>
          ) : (
            filteredItems.map((item, index) => (
              <motion.div
                key={item.sku}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7DD3FC]/20 to-[#FBCFE8]/20 flex items-center justify-center text-2xl">
                          🍽️
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDelete(item.sku)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Price</span>
                        <span>₹{item.price}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tax</span>
                        <span>{item.tax}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Qty</span>
                        <span>{item.qty}</span>
                      </div>
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
    </div>
  );
}

export default MenuManagement;
