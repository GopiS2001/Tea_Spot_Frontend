import { useState, useEffect } from "react";
import {
  Search,
  Filter,
  Download,
  RefreshCcw,
  Printer,
  Eye,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Label } from "../ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Card } from "../ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { motion } from "motion/react";
import { toast } from "sonner@2.0.3";
import { useOrders } from "../../hooks/useApi";

interface OrderItem {
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  variantName?: string | null;
}

type OrderType = 'dine-in' | 'takeaway';

interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  orderType: OrderType;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  staff: string;
  paymentMethod: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface Stats {
  totalOrders: number;
  completed: number;
  refunded: number;
  totalRevenue: number;
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  credit_card: "Card",
  upi: "UPI",
  netbanking: "Net Banking",
};

// DD-MM-YYYY with 12-hour time, e.g. "20-06-2026 01:25 PM".
const formatDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  let h = d.getHours();
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()} ${pad(h)}:${pad(d.getMinutes())} ${ampm}`;
};

// Build a compact page list with ellipses, e.g. [1, '...', 4, 5, 6, '...', 20]
const getPageNumbers = (current: number, total: number): (number | "...")[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  pages.push(1);
  if (left > 2) pages.push("...");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < total - 1) pages.push("...");
  pages.push(total);
  return pages;
};

export function OrdersManagement() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [orderTypeFilter, setOrderTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Debounce the search box (resets to page 1 on change).
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data, isLoading, refetch } = useOrders({
    search: debouncedSearch.trim() || undefined,
    status: statusFilter,
    orderType: orderTypeFilter,
    paymentMethod: paymentFilter,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  const orders: Order[] = data?.orders || [];
  const pagination: Pagination = data?.pagination || { page: 1, limit, total: 0, totalPages: 1 };
  const stats: Stats = data?.stats || { totalOrders: 0, completed: 0, refunded: 0, totalRevenue: 0 };

  const activeFilterCount =
    (paymentFilter !== "all" ? 1 : 0) + (startDate ? 1 : 0) + (endDate ? 1 : 0);

  const clearMoreFilters = () => {
    setPaymentFilter("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const handleExport = () => {
    if (orders.length === 0) {
      toast.error("No orders to export");
      return;
    }

    const header = ["Order ID", "Date", "Order Type", "Items", "Amount", "Status", "Staff", "Payment"];
    const rows = orders.map((order) => [
      order.orderNumber,
      formatDate(order.createdAt),
      order.orderType || "-",
      order.items.length,
      order.totalAmount.toFixed(2),
      order.status,
      order.staff,
      order.paymentMethod,
    ]);
    const csv = [header, ...rows].map((row) => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "orders.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-[#BBF7D0] text-[#047857]">Completed</Badge>;
      case "refunded":
        return <Badge className="bg-[#FDE68A] text-[#92400E]">Refunded</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/20 text-destructive">Cancelled</Badge>;
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getOrderTypeBadge = (type?: string) => {
    if (type === "dine-in") {
      return <Badge className="bg-teal-100 text-teal-800 border-0">🍵 Dine-in</Badge>;
    }
    if (type === "takeaway") {
      return <Badge className="bg-amber-100 text-amber-800 border-0">🥡 Takeaway</Badge>;
    }
    return <Badge variant="outline">—</Badge>;
  };

  const { total, totalPages } = pagination;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>Orders Management</h1>
          <p className="text-muted-foreground">View and manage all orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={handleExport}>
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => refetch()}>
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by order ID or staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-0"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={orderTypeFilter}
            onValueChange={(v) => {
              setOrderTypeFilter(v);
              setPage(1);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="dine-in">🍵 Dine-in</SelectItem>
              <SelectItem value="takeaway">🥡 Takeaway</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="w-4 h-4" />
                More Filters
                {activeFilterCount > 0 && (
                  <Badge className="ml-1 h-5 min-w-5 px-1 bg-[#7DD3FC] text-[#0C4A6E]">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">More Filters</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 text-muted-foreground"
                      onClick={clearMoreFilters}
                    >
                      <X className="w-3 h-3" />
                      Clear
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select
                    value={paymentFilter}
                    onValueChange={(v) => {
                      setPaymentFilter(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Payments" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Payments</SelectItem>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="credit_card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                      <SelectItem value="netbanking">Net Banking</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>From</Label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>To</Label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        setPage(1);
                      }}
                    />
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No orders found matching your criteria</p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Order ID</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Order Type</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Staff</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell>{order.orderNumber}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</TableCell>
                      <TableCell>{getOrderTypeBadge(order.orderType)}</TableCell>
                      <TableCell>{order.items.length}</TableCell>
                      <TableCell className="text-[#7DD3FC]">₹{order.totalAmount.toFixed(2)}</TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>{order.staff || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {PAYMENT_LABELS[order.paymentMethod] || order.paymentMethod || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Printer className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4">
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>
                  Showing {rangeStart}–{rangeEnd} of {total}
                </span>
                <div className="flex items-center gap-2">
                  <span>Show</span>
                  <Select
                    value={String(limit)}
                    onValueChange={(v) => {
                      setLimit(Number(v));
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_SIZE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={String(opt)}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span>per page</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>

                {getPageNumbers(page, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`e-${i}`} className="px-2 text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-[#BBF7D0]">
          <div className="text-sm text-muted-foreground mb-1">Total Orders</div>
          <div className="text-2xl">{stats.totalOrders}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#7DD3FC]">
          <div className="text-sm text-muted-foreground mb-1">Completed</div>
          <div className="text-2xl">{stats.completed}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#FDE68A]">
          <div className="text-sm text-muted-foreground mb-1">Refunded</div>
          <div className="text-2xl">{stats.refunded}</div>
        </Card>
        <Card className="p-4 border-l-4 border-l-[#FBCFE8]">
          <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
          <div className="text-2xl">₹{stats.totalRevenue.toFixed(2)}</div>
        </Card>
      </div>

      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              Order {selectedOrder?.orderNumber}
              {selectedOrder ? getOrderTypeBadge(selectedOrder.orderType) : null}
            </DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                {formatDate(selectedOrder.createdAt)} · {selectedOrder.status}
                {selectedOrder.paymentMethod ? ` · ${selectedOrder.paymentMethod}` : ""}
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead>Item</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead className="text-right">Qty</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedOrder.items.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>{item.variantName || "—"}</TableCell>
                        <TableCell className="text-right">{item.qty}</TableCell>
                        <TableCell className="text-right">₹{Number(item.price).toFixed(2)}</TableCell>
                        <TableCell className="text-right">₹{Number(item.subtotal).toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end text-lg">
                <span className="text-muted-foreground mr-3">Total</span>
                <span className="text-[#7DD3FC]">₹{selectedOrder.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
