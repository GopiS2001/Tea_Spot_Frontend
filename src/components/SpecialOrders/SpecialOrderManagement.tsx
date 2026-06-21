import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  CheckCircle2,
  IndianRupee,
  CalendarClock,
  Minus,
} from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useAuth } from "../Auth/AuthContext";
import { useBranch } from "../Branches/BranchContext";
import {
  useSpecialOrders,
  useCreateSpecialOrder,
  useUpdateSpecialOrder,
  useUpdateSpecialOrderStatus,
  useCollectBalance,
  useDeleteSpecialOrder,
  useMenu,
} from "../../hooks/useApi";
import type { SpecialOrder, SpecialOrderItem } from "../../types";
import { toast } from "sonner@2.0.3";

const STATUS_FLOW = ["pending", "confirmed", "ready", "delivered", "cancelled"];
const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  ready: "Ready",
  delivered: "Delivered",
  cancelled: "Cancelled",
};
const STATUS_STYLE: Record<string, string> = {
  pending: "bg-gray-200 text-gray-700",
  confirmed: "bg-[#7DD3FC] text-[#0C4A6E]",
  ready: "bg-[#FDE68A] text-[#92400E]",
  delivered: "bg-[#BBF7D0] text-[#047857]",
  cancelled: "bg-destructive/20 text-destructive",
};

const money = (n?: number) => `₹${(Number(n) || 0).toFixed(2)}`;

const formatDeliveryDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

// "07:00" -> "07:00 AM"
const formatTime = (t?: string) => {
  if (!t) return "";
  if (/am|pm/i.test(t)) return t;
  const [hStr, m] = t.split(":");
  let h = parseInt(hStr, 10);
  if (Number.isNaN(h)) return t;
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${String(h).padStart(2, "0")}:${m ?? "00"} ${ampm}`;
};

const itemsSummary = (items: SpecialOrderItem[]) => {
  if (!items?.length) return "—";
  const first = `${items[0].qty}x ${items[0].name}`;
  return items.length > 1 ? `${first} +${items.length - 1} more` : first;
};

interface MenuItemLite {
  _id: string;
  name: string;
  price: number;
  hasVariants?: boolean;
  variants?: { _id: string; name: string; price: number }[];
}

interface DraftItem extends SpecialOrderItem {
  key: string;
}

const emptyForm = {
  customerName: "",
  customerPhone: "",
  deliveryDate: "",
  deliveryTime: "",
  advancePaid: "",
  notes: "",
};

export function SpecialOrderManagement() {
  const { isSuperAdmin } = useAuth();
  const { selectedBranchId } = useBranch();

  const [tab, setTab] = useState<"upcoming" | "today" | "all" | "completed">("upcoming");
  const [paymentFilter, setPaymentFilter] = useState("all");

  const filters = useMemo(() => {
    const f: any = { paymentStatus: paymentFilter };
    if (tab === "upcoming") f.upcoming = true;
    else if (tab === "today") f.today = true;
    else if (tab === "completed") f.status = "delivered";
    return f;
  }, [tab, paymentFilter]);

  const { data, isLoading } = useSpecialOrders(filters);
  const orders: SpecialOrder[] = data?.orders || [];

  const createOrder = useCreateSpecialOrder();
  const updateOrder = useUpdateSpecialOrder();
  const updateStatus = useUpdateSpecialOrderStatus();
  const collectBalance = useCollectBalance();
  const deleteOrder = useDeleteSpecialOrder();

  const { data: menuData = [] } = useMenu();
  const menuItems: MenuItemLite[] = menuData as MenuItemLite[];

  // ---- modal state ----
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SpecialOrder | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [itemSearch, setItemSearch] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [collectTarget, setCollectTarget] = useState<SpecialOrder | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SpecialOrder | null>(null);

  const total = draftItems.reduce((s, i) => s + i.subtotal, 0);
  const advance = Number(form.advancePaid) || 0;
  const balance = total - advance;

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDraftItems([]);
    setItemSearch("");
    setDialogOpen(true);
  };

  const openEdit = (o: SpecialOrder) => {
    setEditing(o);
    setForm({
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      deliveryDate: o.deliveryDate ? o.deliveryDate.substring(0, 10) : "",
      deliveryTime: o.deliveryTime || "",
      advancePaid: String(o.advancePaid ?? 0),
      notes: o.notes || "",
    });
    setDraftItems(
      (o.items || []).map((it, idx) => ({ ...it, key: `${it.menuItem}-${idx}` }))
    );
    setItemSearch("");
    setDialogOpen(true);
  };

  const addDraftItem = (item: MenuItemLite, variant?: { _id: string; name: string; price: number }) => {
    const price = variant ? variant.price : item.price;
    const variantName = variant ? variant.name : null;
    const key = `${item._id}::${variant?._id ?? ""}`;
    setDraftItems((prev) => {
      const existing = prev.find((d) => d.key === key);
      if (existing) {
        return prev.map((d) =>
          d.key === key ? { ...d, qty: d.qty + 1, subtotal: (d.qty + 1) * d.price } : d
        );
      }
      return [
        ...prev,
        { key, menuItem: item._id, name: item.name, qty: 1, price, subtotal: price, variantName },
      ];
    });
  };

  const changeQty = (key: string, delta: number) => {
    setDraftItems((prev) =>
      prev
        .map((d) =>
          d.key === key ? { ...d, qty: d.qty + delta, subtotal: (d.qty + delta) * d.price } : d
        )
        .filter((d) => d.qty > 0)
    );
  };

  const setQty = (key: string, qty: number) => {
    setDraftItems((prev) =>
      prev.map((d) => (d.key === key ? { ...d, qty, subtotal: qty * d.price } : d))
    );
  };

  const filteredMenu = itemSearch.trim()
    ? menuItems.filter((m) => m.name.toLowerCase().includes(itemSearch.trim().toLowerCase()))
    : menuItems;

  const handleSave = async () => {
    if (!form.customerName.trim() || !form.customerPhone.trim()) {
      toast.error("Customer name and phone are required");
      return;
    }
    if (draftItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    if (!form.deliveryDate || !form.deliveryTime) {
      toast.error("Delivery date and time are required");
      return;
    }
    if (isSuperAdmin && !selectedBranchId && !editing) {
      toast.error("Pick a branch in the top bar before creating a special order");
      return;
    }

    const payload: any = {
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      items: draftItems.map(({ key, ...rest }) => rest),
      totalAmount: total,
      advancePaid: advance,
      deliveryDate: form.deliveryDate,
      deliveryTime: form.deliveryTime,
      notes: form.notes.trim(),
    };
    if (isSuperAdmin && selectedBranchId) payload.branchId = selectedBranchId;

    setIsSaving(true);
    try {
      if (editing) {
        await updateOrder.mutateAsync({ id: editing._id, data: payload });
        toast.success("Special order updated");
      } else {
        await createOrder.mutateAsync(payload);
        toast.success("Special order created");
      }
      setDialogOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to save special order");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (o: SpecialOrder, status: string) => {
    try {
      await updateStatus.mutateAsync({ id: o._id, status });
      toast.success(`Status: ${STATUS_LABEL[status]}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to update status");
    }
  };

  const confirmCollect = async () => {
    if (!collectTarget) return;
    try {
      await collectBalance.mutateAsync(collectTarget._id);
      toast.success("Balance collected");
    } catch (err: any) {
      toast.error(err.message || "Failed to collect balance");
    } finally {
      setCollectTarget(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteOrder.mutateAsync(deleteTarget._id);
      toast.success("Special order deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2">
            <CalendarClock className="w-6 h-6" /> Special Orders
          </h1>
          <p className="text-muted-foreground">
            Advance & bulk orders for functions and events
          </p>
        </div>
        <Button className="gap-2 bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black" onClick={openAdd}>
          <Plus className="w-4 h-4" /> New Special Order
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={paymentFilter} onValueChange={setPaymentFilter}>
            <SelectTrigger className="w-full sm:w-56">
              <SelectValue placeholder="All Payments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Payments</SelectItem>
              <SelectItem value="pending">Balance Pending</SelectItem>
              <SelectItem value="paid">Fully Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading special orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center gap-2">
            <CalendarClock className="w-8 h-8 opacity-50" />
            No special orders
          </div>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Advance</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o._id}>
                    <TableCell className="font-medium">{o.customerName}</TableCell>
                    <TableCell className="text-muted-foreground">{o.customerPhone}</TableCell>
                    <TableCell className="text-sm">{itemsSummary(o.items)}</TableCell>
                    <TableCell className="text-sm">
                      {formatDeliveryDate(o.deliveryDate)}
                      <div className="text-xs text-muted-foreground">{formatTime(o.deliveryTime)}</div>
                    </TableCell>
                    <TableCell className="text-right">{money(o.totalAmount)}</TableCell>
                    <TableCell className="text-right">{money(o.advancePaid)}</TableCell>
                    <TableCell className="text-right">
                      {o.balanceCollected ? (
                        <span className="text-[#047857] inline-flex items-center gap-1 justify-end">
                          <CheckCircle2 className="w-3.5 h-3.5" />₹0
                        </span>
                      ) : (
                        <span className="text-amber-600">{money(o.balanceAmount)}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {o.balanceCollected ? (
                        <Badge className="bg-[#BBF7D0] text-[#047857]">Fully Paid</Badge>
                      ) : (
                        <Badge className="bg-destructive/20 text-destructive">Balance Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Select value={o.status} onValueChange={(v) => handleStatusChange(o, v)}>
                        <SelectTrigger className="h-8 w-32 border-0 p-0 bg-transparent shadow-none focus:ring-0">
                          <Badge className={STATUS_STYLE[o.status]}>{STATUS_LABEL[o.status]}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {STATUS_FLOW.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!o.balanceCollected && o.balanceAmount > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-[#047857] border-[#BBF7D0]"
                            onClick={() => setCollectTarget(o)}
                          >
                            <IndianRupee className="w-3.5 h-3.5" />
                            Collect
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(o)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setDeleteTarget(o)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Add / Edit modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Special Order" : "New Special Order"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder="e.g. Ravi"
                />
              </div>
              <div className="space-y-2">
                <Label>Phone Number *</Label>
                <Input
                  value={form.customerPhone}
                  onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
            </div>

            {/* Item picker */}
            <div className="space-y-2">
              <Label>Items</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  className="pl-9"
                  placeholder="Search menu items to add..."
                  value={itemSearch}
                  onChange={(e) => setItemSearch(e.target.value)}
                />
              </div>
              {itemSearch.trim() && (
                <div className="max-h-44 overflow-y-auto rounded-lg border border-border divide-y">
                  {filteredMenu.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">No items found</div>
                  ) : (
                    filteredMenu.slice(0, 20).map((m) => (
                      <div key={m._id} className="p-2 flex items-center justify-between gap-2">
                        <span className="text-sm">{m.name}</span>
                        {m.hasVariants && m.variants?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {m.variants.map((v) => (
                              <Button
                                key={v._id}
                                size="sm"
                                variant="outline"
                                className="h-7"
                                onClick={() => addDraftItem(m, v)}
                              >
                                {v.name} ₹{v.price}
                              </Button>
                            ))}
                          </div>
                        ) : (
                          <Button size="sm" variant="outline" className="h-7" onClick={() => addDraftItem(m)}>
                            Add ₹{m.price}
                          </Button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}

              {draftItems.length > 0 && (
                <div className="rounded-lg border border-border divide-y">
                  {draftItems.map((d) => (
                    <div key={d.key} className="p-2 flex items-center justify-between gap-2">
                      <div className="text-sm">
                        {d.name}
                        {d.variantName ? <span className="text-muted-foreground"> ({d.variantName})</span> : ""}
                        <span className="text-xs text-muted-foreground"> · ₹{d.price}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(d.key, -1)}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <Input
                          type="number"
                          min={1}
                          value={d.qty}
                          onChange={(e) => setQty(d.key, Math.max(1, Number(e.target.value) || 1))}
                          className="w-16 h-7 text-center"
                        />
                        <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => changeQty(d.key, 1)}>
                          <Plus className="w-3 h-3" />
                        </Button>
                        <span className="w-20 text-right text-sm">{money(d.subtotal)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Delivery Date *</Label>
                <Input
                  type="date"
                  value={form.deliveryDate}
                  onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Delivery Time *</Label>
                <Input
                  type="time"
                  value={form.deliveryTime}
                  onChange={(e) => setForm({ ...form, deliveryTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Advance Paid (₹)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.advancePaid}
                  onChange={(e) => setForm({ ...form, advancePaid: e.target.value })}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="e.g. Function order, deliver to back gate"
              />
            </div>

            {/* Live summary */}
            <div className="rounded-lg bg-muted/40 p-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total:</span>
                <span>{money(total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Advance Paid:</span>
                <span>{money(advance)}</span>
              </div>
              <div className="flex justify-between font-medium pt-1 border-t">
                <span>Balance Remaining:</span>
                {balance <= 0 ? (
                  <span className="text-[#047857]">Fully Paid</span>
                ) : (
                  <span className="text-amber-600">{money(balance)}</span>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                className="bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
                onClick={handleSave}
                disabled={isSaving}
              >
                {editing ? "Update Order" : "Create Order"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collect balance confirm */}
      <AlertDialog open={!!collectTarget} onOpenChange={(o) => !o && setCollectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Collect balance?</AlertDialogTitle>
            <AlertDialogDescription>
              Mark {money(collectTarget?.balanceAmount)} as collected from{" "}
              {collectTarget?.customerName}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#047857] text-white hover:bg-[#047857]/90"
              onClick={confirmCollect}
            >
              Mark Collected
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirm */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete special order?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {deleteTarget?.customerName}'s special order.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={confirmDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
