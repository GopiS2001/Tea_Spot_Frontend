import { useState } from "react";
import { Plus, Search, Edit, Trash2, TrendingUp, ShoppingCart, Settings } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { Switch } from "../ui/switch";
import { motion } from "motion/react";
import { useCart } from "../Cart/CartContext";
import { useAuth } from "../Auth/AuthContext";
import { uploadFile, resolveImageUrl } from "../../utils/api";
import { toast } from "sonner@2.0.3";
import {
  useMenu,
  useCategories,
  useCreateMenuItem,
  useUpdateMenuItem,
  useDeleteMenuItem,
} from "../../hooks/useApi";

interface Variant {
  _id?: string;
  name: string;
  price: number;
}

interface MenuItem {
  _id: string;
  name: string;
  category_id: string;
  category: string;
  price: number;
  hasVariants: boolean;
  variants: Variant[];
  image: string;
  sales: number;
  status: string;
  allergens: string[];
  description?: string;
}

interface Category {
  _id: string;
  name: string;
}

interface VariantRow {
  name: string;
  price: string;
}

interface FormState {
  name: string;
  category_id: string;
  price: string;
  description: string;
  allergens: string;
  image: string;
  hasVariants: boolean;
  variants: VariantRow[];
}

const emptyForm: FormState = {
  name: "",
  category_id: "",
  price: "",
  description: "",
  allergens: "",
  image: "",
  hasVariants: false,
  variants: [{ name: "", price: "" }],
};

const isImagePath = (image: string) =>
  image.startsWith("/uploads") || image.startsWith("http") || image.startsWith("data:");

export function MenuManagement() {
  const { accessToken } = useAuth();
  const { addToCart } = useCart();
  const { data: items = [], isLoading } = useMenu();
  const { data: categoryList = [] } = useCategories();
  const createMenuItem = useCreateMenuItem();
  const updateMenuItem = useUpdateMenuItem();
  const deleteMenuItem = useDeleteMenuItem();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ["all", ...Array.from(new Set((items as MenuItem[]).map((item) => item.category)))];

  const filteredItems = (items as MenuItem[]).filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (item: MenuItem) => {
    const price =
      item.hasVariants && item.variants.length > 0
        ? Math.min(...item.variants.map((v) => v.price))
        : item.price;
    addToCart({
      id: item._id as unknown as number,
      name: item.name,
      price,
      category: item.category,
      image: item.image,
      modifiers: [],
    });
    toast.success(`${item.name} added to cart!`);
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      category_id: item.category_id || "",
      price: String(item.price),
      description: item.description || "",
      allergens: item.allergens.join(", "),
      image: item.image || "",
      hasVariants: Boolean(item.hasVariants),
      variants:
        item.variants && item.variants.length > 0
          ? item.variants.map((v) => ({ name: v.name, price: String(v.price) }))
          : [{ name: "", price: "" }],
    });
    setDialogOpen(true);
  };

  const setHasVariants = (checked: boolean) => {
    setForm((prev) => ({
      ...prev,
      hasVariants: checked,
      variants:
        checked && prev.variants.length === 0
          ? [{ name: "", price: "" }]
          : prev.variants,
    }));
  };

  const addVariantRow = () => {
    setForm((prev) => ({ ...prev, variants: [...prev.variants, { name: "", price: "" }] }));
  };

  const updateVariantRow = (index: number, field: keyof VariantRow, value: string) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)),
    }));
  };

  const removeVariantRow = (index: number) => {
    setForm((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const result = await uploadFile("/upload", accessToken, file);
      setForm((prev) => ({ ...prev, image: result.url }));
      toast.success("Image uploaded");
    } catch (err: any) {
      toast.error(err.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.category_id) {
      toast.error("Name and category are required");
      return;
    }

    let cleanedVariants: Variant[] = [];
    if (form.hasVariants) {
      cleanedVariants = form.variants
        .map((v) => ({ name: v.name.trim(), price: parseFloat(v.price) }))
        .filter((v) => v.name && !Number.isNaN(v.price));
      if (cleanedVariants.length === 0) {
        toast.error("Add at least one valid size variant (name and price)");
        return;
      }
    } else if (!form.price) {
      toast.error("Price is required");
      return;
    }

    const payload = {
      name: form.name,
      category_id: form.category_id,
      hasVariants: form.hasVariants,
      price: form.hasVariants ? 0 : parseFloat(form.price),
      variants: form.hasVariants ? cleanedVariants : [],
      description: form.description,
      allergens: form.allergens
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean),
      ...(form.image ? { image: form.image } : {}),
    };

    try {
      if (editingItem) {
        await updateMenuItem.mutateAsync({ id: editingItem._id, data: payload });
        toast.success("Menu item updated");
      } else {
        await createMenuItem.mutateAsync(payload);
        toast.success("Menu item added");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save menu item");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMenuItem.mutateAsync(id);
      toast.success("Menu item deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete menu item");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Menu Management</h1>
          <p className="text-muted-foreground">Manage your menu items, pricing, and recipes</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <Button
            className="gap-2 bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
            onClick={openAddDialog}
          >
            <Plus className="w-4 h-4" />
            Add Menu Item
          </Button>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editingItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Item Name</Label>
                  <Input
                    placeholder="e.g., Margherita Pizza"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(value) => setForm({ ...form, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoryList.map((category) => (
                        <SelectItem key={category._id} value={category._id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Item Image</Label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-lg border border-border overflow-hidden flex items-center justify-center text-3xl bg-gradient-to-br from-[#7DD3FC]/20 to-[#FBCFE8]/20 shrink-0">
                    {form.image ? (
                      isImagePath(form.image) ? (
                        <img
                          src={resolveImageUrl(form.image)}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        form.image
                      )
                    ) : (
                      "🍽️"
                    )}
                  </div>
                  <Input
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <Label>Has Size Variants</Label>
                  <p className="text-xs text-muted-foreground">
                    Enable to set per-size prices (Small / Medium / Large…)
                  </p>
                </div>
                <Switch checked={form.hasVariants} onCheckedChange={setHasVariants} />
              </div>

              {form.hasVariants ? (
                <div className="space-y-2">
                  <Label>Size Variants</Label>
                  <div className="space-y-2">
                    {form.variants.map((variant, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <Input
                          placeholder="Size name (e.g., Small)"
                          value={variant.name}
                          onChange={(e) => updateVariantRow(index, "name", e.target.value)}
                        />
                        <Input
                          type="number"
                          placeholder="Price"
                          className="w-28"
                          value={variant.price}
                          onChange={(e) => updateVariantRow(index, "price", e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-destructive shrink-0"
                          onClick={() => removeVariantRow(index)}
                          disabled={form.variants.length === 1}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="gap-2" onClick={addVariantRow}>
                    <Plus className="w-4 h-4" />
                    Add Size
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Price ($)</Label>
                  <Input
                    type="number"
                    placeholder="15.99"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the item..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Allergens (comma separated)</Label>
                <Input
                  placeholder="Dairy, Gluten"
                  value={form.allergens}
                  onChange={(e) => setForm({ ...form, allergens: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  className="bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
                  onClick={handleSave}
                >
                  {editingItem ? "Update Item" : "Save Item"}
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
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category === "all" ? "All Items" : category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading menu items...</div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No menu items found</div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7DD3FC]/20 to-[#FBCFE8]/20 flex items-center justify-center text-2xl overflow-hidden shrink-0">
                          {isImagePath(item.image) ? (
                            <img
                              src={resolveImageUrl(item.image)}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            item.image
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {item.category}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openEditDialog(item)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDelete(item._id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {item.hasVariants && item.variants.length > 0 ? (
                        <div className="space-y-1">
                          <span className="text-sm text-muted-foreground">Sizes</span>
                          <div className="flex flex-wrap gap-1">
                            {item.variants.map((v) => (
                              <Badge key={v._id || v.name} variant="outline" className="text-xs">
                                {v.name}: ₹{v.price}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Price</span>
                          <span className="text-[#7DD3FC]">₹{item.price}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendingUp className="w-4 h-4" />
                          Sales
                        </div>
                        <span className="text-sm">{item.sales} orders</span>
                      </div>
                      {item.allergens.length > 0 && (
                        <div className="pt-2">
                          <div className="text-xs text-muted-foreground mb-1">Allergens:</div>
                          <div className="flex flex-wrap gap-1">
                            {item.allergens.map((allergen) => (
                              <Badge key={allergen} variant="outline" className="text-xs">
                                {allergen}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
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
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
