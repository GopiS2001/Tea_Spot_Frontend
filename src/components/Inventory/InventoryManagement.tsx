import { useState, useEffect, useMemo } from "react";
import {
  Package,
  AlertTriangle,
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  Settings2,
  History as HistoryIcon,
  Edit,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useAuth } from "../Auth/AuthContext";
import { useBranch } from "../Branches/BranchContext";
import { toast } from "sonner@2.0.3";
import type { InventoryItem, PackSizeUnit, StockTransaction } from "../../types";
import {
  useInventory,
  useCreateInventoryItem,
  useUpdateInventoryItem,
  useDeleteInventoryItem,
  useStockIn,
  useStockOut,
  useStockAdjust,
  useStockHistory,
} from "../../hooks/useApi";

const UNITS = ["kg", "litre", "packet", "piece", "gram", "ml", "box", "bottle"];
const PACK_SIZE_UNITS: PackSizeUnit[] = ["ml", "litre", "g", "kg", "piece", "pack"];
const OUT_REASONS = ["Waste", "Spillage", "Expired", "Other"];

const emptyAddForm = {
  name: "",
  unit: "kg",
  type: "raw" as "raw" | "finished",
  currentQty: "",
  minQty: "",
  packSize: "1",
  packSizeUnit: "kg" as PackSizeUnit,
};

// Format "{currentQty} {unit} ({total}{packSizeUnit})", omitting the parens
// when the counting unit already matches the base unit (e.g. 5 kg packs of 1 kg).
const formatStockDisplay = (
  qty: number,
  unit: string,
  packSize: number,
  packSizeUnit: PackSizeUnit
) => {
  const total = qty * (packSize || 0);
  return `${qty} ${unit} (${total}${packSizeUnit})`;
};

const formatDateTime = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const isLow = (it: InventoryItem) => it.currentQty <= it.minQty;

export function InventoryManagement() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const { selectedBranchId } = useBranch();

  // Filters
  const [typeFilter, setTypeFilter] = useState<"all" | "raw" | "finished">("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lowOnly, setLowOnly] = useState(false);

  // Modals
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<InventoryItem | null>(null);
  const [inTarget, setInTarget] = useState<InventoryItem | null>(null);
  const [outTarget, setOutTarget] = useState<InventoryItem | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [historyTarget, setHistoryTarget] = useState<InventoryItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<InventoryItem | null>(null);

  const { data: inventoryData, isLoading } = useInventory({
    type: typeFilter,
    search: debouncedSearch.trim() || undefined,
  });
  const items: InventoryItem[] = inventoryData?.items || [];

  const createInventoryItem = useCreateInventoryItem();
  const updateInventoryItem = useUpdateInventoryItem();
  const deleteInventoryItem = useDeleteInventoryItem();
  const stockIn = useStockIn();
  const stockOut = useStockOut();
  const stockAdjust = useStockAdjust();

  const { data: historyData, isLoading: historyLoading } = useStockHistory(
    historyTarget?._id || null,
    1,
    50
  );
  const historyTx: StockTransaction[] = historyData?.transactions || [];

  // Form state
  const [addForm, setAddForm] = useState(emptyAddForm);
  const [editForm, setEditForm] = useState({
    name: "",
    unit: "kg",
    minQty: "",
    packSize: "1",
    packSizeUnit: "kg" as PackSizeUnit,
  });
  const [inForm, setInForm] = useState({ qty: "", reason: "Purchase" });
  const [outForm, setOutForm] = useState({ qty: "", reason: "Waste" });
  const [adjustForm, setAdjustForm] = useState({ newQty: "", reason: "Manual count" });
  const [submitting, setSubmitting] = useState(false);

  // ---- Debounce search ----
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  // ---- Honor dashboard deep-link to "low stock only" ----
  useEffect(() => {
    if (sessionStorage.getItem("inventoryFilter") === "low") {
      setLowOnly(true);
      sessionStorage.removeItem("inventoryFilter");
    }
  }, []);

  const visibleItems = useMemo(
    () => (lowOnly ? items.filter(isLow) : items),
    [items, lowOnly]
  );

  const lowStockCount = useMemo(() => items.filter(isLow).length, [items]);

  // ---- Mutations ----
  const submitAdd = async () => {
    if (!addForm.name.trim() || !addForm.unit) {
      toast.error("Name and unit are required");
      return;
    }
    if (isSuperAdmin && !selectedBranchId) {
      toast.error("Pick a branch in the top bar before adding stock");
      return;
    }
    setSubmitting(true);
    try {
      await createInventoryItem.mutateAsync({
        name: addForm.name.trim(),
        unit: addForm.unit,
        type: addForm.type,
        currentQty: Number(addForm.currentQty) || 0,
        minQty: Number(addForm.minQty) || 0,
        packSize: Number(addForm.packSize) || 1,
        packSizeUnit: addForm.packSizeUnit,
        branchId: isSuperAdmin ? selectedBranchId : undefined,
      });
      toast.success("Item added");
      setAddOpen(false);
      setAddForm(emptyAddForm);
    } catch (err: any) {
      toast.error(err?.message || "Failed to add item");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (item: InventoryItem) => {
    setEditTarget(item);
    setEditForm({
      name: item.name,
      unit: item.unit,
      minQty: String(item.minQty),
      packSize: String(item.packSize ?? 1),
      packSizeUnit: (item.packSizeUnit || "piece") as PackSizeUnit,
    });
  };

  const submitEdit = async () => {
    if (!editTarget) return;
    setSubmitting(true);
    try {
      await updateInventoryItem.mutateAsync({
        id: editTarget._id,
        data: {
          name: editForm.name.trim(),
          unit: editForm.unit,
          minQty: Number(editForm.minQty) || 0,
          packSize: Number(editForm.packSize) || 1,
          packSizeUnit: editForm.packSizeUnit,
        },
      });
      toast.success("Item updated");
      setEditTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update item");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteInventoryItem.mutateAsync(deleteTarget._id);
      toast.success("Item deleted");
      setDeleteTarget(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete item");
    }
  };

  const submitStockIn = async () => {
    if (!inTarget) return;
    const qty = Number(inForm.qty);
    if (!qty || qty <= 0) {
      toast.error("Enter a positive quantity");
      return;
    }
    setSubmitting(true);
    try {
      await stockIn.mutateAsync({ id: inTarget._id, qty, reason: inForm.reason });
      toast.success(`+${qty} ${inTarget.unit} added`);
      setInTarget(null);
      setInForm({ qty: "", reason: "Purchase" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to add stock");
    } finally {
      setSubmitting(false);
    }
  };

  const submitStockOut = async () => {
    if (!outTarget) return;
    const qty = Number(outForm.qty);
    if (!qty || qty <= 0) {
      toast.error("Enter a positive quantity");
      return;
    }
    setSubmitting(true);
    try {
      await stockOut.mutateAsync({ id: outTarget._id, qty, reason: outForm.reason });
      toast.success(`-${qty} ${outTarget.unit} removed`);
      setOutTarget(null);
      setOutForm({ qty: "", reason: "Waste" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to remove stock");
    } finally {
      setSubmitting(false);
    }
  };

  const submitAdjust = async () => {
    if (!adjustTarget) return;
    const newQty = Number(adjustForm.newQty);
    if (Number.isNaN(newQty) || newQty < 0) {
      toast.error("Enter a non-negative number");
      return;
    }
    setSubmitting(true);
    try {
      await stockAdjust.mutateAsync({ id: adjustTarget._id, newQty, reason: adjustForm.reason });
      toast.success("Stock count updated");
      setAdjustTarget(null);
      setAdjustForm({ newQty: "", reason: "Manual count" });
    } catch (err: any) {
      toast.error(err?.message || "Failed to adjust stock");
    } finally {
      setSubmitting(false);
    }
  };

  const txBadge = (type: StockTransaction["type"]) => {
    if (type === "in") return <Badge className="bg-green-100 text-green-800 border-0">IN</Badge>;
    if (type === "out") return <Badge className="bg-red-100 text-red-800 border-0">OUT</Badge>;
    return <Badge className="bg-blue-100 text-blue-800 border-0">ADJUST</Badge>;
  };

  // ---- Render ----
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="flex items-center gap-2">
            <Package className="w-6 h-6" /> Inventory
          </h1>
          <p className="text-muted-foreground">
            Track stock levels, restocks, and waste per branch
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={lowOnly ? "default" : "outline"}
            onClick={() => setLowOnly((v) => !v)}
            className={`gap-2 ${lowOnly ? "bg-red-500 hover:bg-red-600 text-white" : ""}`}
            title="Show only items at or below min qty"
          >
            <AlertTriangle className="w-4 h-4" />
            Low stock
            <Badge
              className={`ml-1 ${
                lowStockCount > 0
                  ? "bg-red-100 text-red-800 border-0"
                  : "bg-muted text-muted-foreground border-0"
              }`}
            >
              {lowStockCount}
            </Badge>
          </Button>
          {isAdmin && (
            <Button onClick={() => setAddOpen(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Item
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <Tabs value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="raw">Raw Materials</TabsTrigger>
                <TabsTrigger value="finished">Finished Goods</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Current</TableHead>
                  <TableHead className="text-right">Min</TableHead>
                  <TableHead>Status</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                      Loading inventory…
                    </TableCell>
                  </TableRow>
                ) : visibleItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isAdmin ? 7 : 6} className="text-center text-muted-foreground py-8">
                      {lowOnly ? "No items are below their min level." : "No inventory items yet."}
                    </TableCell>
                  </TableRow>
                ) : (
                  visibleItems.map((item) => {
                    const low = isLow(item);
                    return (
                      <TableRow key={item._id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell className="capitalize">
                          <Badge variant="outline">{item.type}</Badge>
                        </TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right">
                          <div>{item.currentQty} {item.unit}</div>
                          <div className="text-xs text-muted-foreground">
                            ({item.currentQty * (item.packSize || 0)}{item.packSizeUnit})
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{item.minQty}</TableCell>
                        <TableCell>
                          {low ? (
                            <Badge className="bg-red-100 text-red-800 border-0">Low Stock</Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-800 border-0">OK</Badge>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => setInTarget(item)}
                              >
                                <ArrowUpCircle className="w-4 h-4 text-green-600" />
                                In
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => setOutTarget(item)}
                              >
                                <ArrowDownCircle className="w-4 h-4 text-red-600" />
                                Out
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="gap-1"
                                onClick={() => setAdjustTarget(item)}
                              >
                                <Settings2 className="w-4 h-4 text-blue-600" />
                                Adjust
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setHistoryTarget(item)}
                                title="History"
                              >
                                <HistoryIcon className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEdit(item)}
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setDeleteTarget(item)}
                                title="Delete"
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Add Item modal */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Inventory Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name *</Label>
              <Input
                placeholder="e.g. Milk"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit</Label>
                <Select
                  value={addForm.unit}
                  onValueChange={(v) => setAddForm({ ...addForm, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select
                  value={addForm.type}
                  onValueChange={(v) =>
                    setAddForm({ ...addForm, type: v as "raw" | "finished" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="raw">Raw Material</SelectItem>
                    <SelectItem value="finished">Finished Good</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Pack Size (per unit)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 500"
                  value={addForm.packSize}
                  onChange={(e) =>
                    setAddForm({ ...addForm, packSize: e.target.value })
                  }
                />
                <Select
                  value={addForm.packSizeUnit}
                  onValueChange={(v) =>
                    setAddForm({ ...addForm, packSizeUnit: v as PackSizeUnit })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACK_SIZE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                e.g. 500 ml means each {addForm.unit || "unit"} contains 500ml
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Opening Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={addForm.currentQty}
                  onChange={(e) =>
                    setAddForm({ ...addForm, currentQty: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Min Qty (alert)</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={addForm.minQty}
                  onChange={(e) =>
                    setAddForm({ ...addForm, minQty: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Total Stock:{" "}
              <span className="text-foreground">
                {(Number(addForm.currentQty) || 0) * (Number(addForm.packSize) || 0)}{" "}
                {addForm.packSizeUnit}
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={submitAdd} disabled={submitting}>
                {submitting ? "Saving…" : "Save Item"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit modal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Unit</Label>
                <Select
                  value={editForm.unit}
                  onValueChange={(v) => setEditForm({ ...editForm, unit: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Qty</Label>
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editForm.minQty}
                  onChange={(e) =>
                    setEditForm({ ...editForm, minQty: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Pack Size (per unit)</Label>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  type="number"
                  min="0"
                  step="any"
                  value={editForm.packSize}
                  onChange={(e) =>
                    setEditForm({ ...editForm, packSize: e.target.value })
                  }
                />
                <Select
                  value={editForm.packSizeUnit}
                  onValueChange={(v) =>
                    setEditForm({ ...editForm, packSizeUnit: v as PackSizeUnit })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PACK_SIZE_UNITS.map((u) => (
                      <SelectItem key={u} value={u}>
                        {u}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Use Stock In / Out / Adjust to change the quantity.
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditTarget(null)}>
                Cancel
              </Button>
              <Button onClick={submitEdit} disabled={submitting}>
                {submitting ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock In modal */}
      <Dialog open={!!inTarget} onOpenChange={(o) => !o && setInTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock In — {inTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current:{" "}
              <span className="text-foreground">
                {inTarget ? formatStockDisplay(inTarget.currentQty, inTarget.unit, inTarget.packSize, inTarget.packSizeUnit) : ""}
              </span>
            </div>
            <div>
              <Label>Qty to add</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={inForm.qty}
                onChange={(e) => setInForm({ ...inForm, qty: e.target.value })}
                autoFocus
              />
              {inTarget && Number(inForm.qty) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Adding {Number(inForm.qty)} {inTarget.unit} ={" "}
                  {Number(inForm.qty) * (inTarget.packSize || 0)}
                  {inTarget.packSizeUnit}
                </p>
              )}
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={inForm.reason}
                onChange={(e) => setInForm({ ...inForm, reason: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setInTarget(null)}>
                Cancel
              </Button>
              <Button onClick={submitStockIn} disabled={submitting} className="gap-2">
                <ArrowUpCircle className="w-4 h-4" /> Add Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stock Out modal */}
      <Dialog open={!!outTarget} onOpenChange={(o) => !o && setOutTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stock Out — {outTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current:{" "}
              <span className="text-foreground">
                {outTarget ? formatStockDisplay(outTarget.currentQty, outTarget.unit, outTarget.packSize, outTarget.packSizeUnit) : ""}
              </span>
            </div>
            <div>
              <Label>Qty to remove</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={outForm.qty}
                onChange={(e) => setOutForm({ ...outForm, qty: e.target.value })}
                autoFocus
              />
              {outTarget && Number(outForm.qty) > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Removing {Number(outForm.qty)} {outTarget.unit} ={" "}
                  {Number(outForm.qty) * (outTarget.packSize || 0)}
                  {outTarget.packSizeUnit}
                </p>
              )}
            </div>
            <div>
              <Label>Reason</Label>
              <Select
                value={outForm.reason}
                onValueChange={(v) => setOutForm({ ...outForm, reason: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUT_REASONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOutTarget(null)}>
                Cancel
              </Button>
              <Button onClick={submitStockOut} disabled={submitting} className="gap-2">
                <ArrowDownCircle className="w-4 h-4" /> Remove Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Adjust modal */}
      <Dialog open={!!adjustTarget} onOpenChange={(o) => !o && setAdjustTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust — {adjustTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Current:{" "}
              <span className="text-foreground">
                {adjustTarget ? formatStockDisplay(adjustTarget.currentQty, adjustTarget.unit, adjustTarget.packSize, adjustTarget.packSizeUnit) : ""}
              </span>
            </div>
            <div>
              <Label>New actual qty</Label>
              <Input
                type="number"
                min="0"
                step="any"
                value={adjustForm.newQty}
                onChange={(e) => setAdjustForm({ ...adjustForm, newQty: e.target.value })}
                autoFocus
              />
              {adjustTarget && adjustForm.newQty !== "" && (
                <p className="text-xs text-muted-foreground mt-1">
                  New total: {Number(adjustForm.newQty)} {adjustTarget.unit} ={" "}
                  {Number(adjustForm.newQty) * (adjustTarget.packSize || 0)}
                  {adjustTarget.packSizeUnit}
                </p>
              )}
            </div>
            <div>
              <Label>Reason</Label>
              <Input
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm({ ...adjustForm, reason: e.target.value })
                }
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdjustTarget(null)}>
                Cancel
              </Button>
              <Button onClick={submitAdjust} disabled={submitting} className="gap-2">
                <Settings2 className="w-4 h-4" /> Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* History panel */}
      <Sheet open={!!historyTarget} onOpenChange={(o) => !o && setHistoryTarget(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{historyTarget?.name} — Stock History</SheetTitle>
            <SheetDescription>
              Last 50 stock transactions for this item
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-2">
            {historyLoading ? (
              <div className="text-sm text-muted-foreground">Loading history…</div>
            ) : historyTx.length === 0 ? (
              <div className="text-sm text-muted-foreground">No transactions yet.</div>
            ) : (
              historyTx.map((tx) => {
                const staff =
                  typeof tx.employeeId === "object" && tx.employeeId
                    ? tx.employeeId.name
                    : "—";
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border/60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {txBadge(tx.type)}
                      <div className="min-w-0">
                        <div className="text-sm">
                          {tx.type === "adjust" ? "Δ " : ""}
                          {tx.qty > 0 ? `+${tx.qty}` : tx.qty} {historyTarget?.unit}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {tx.reason || "—"} · {staff}
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDateTime(tx.createdAt)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              The item will be removed from your inventory. Stock transaction history
              is kept for audit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
