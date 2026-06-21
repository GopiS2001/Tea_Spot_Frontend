import { AlertCircle, Package, ChevronRight, CalendarClock, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { motion } from "motion/react";
import { useDashboard, useWeeklyTrend, useTopItems } from "../../hooks/useApi";
import { useBranch } from "../Branches/BranchContext";
import type { DashboardData, WeeklyTrendPoint, TopItem } from "../../types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardProps {
  onNavigate?: (view: string) => void;
}

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
};

const formatDayLabel = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { weekday: "short" });
};

export function Dashboard({ onNavigate }: DashboardProps = {}) {
  const { setSelectedBranchId } = useBranch();
  const { data, isLoading } = useDashboard();
  const dashboard: DashboardData | undefined = data;
  const { data: trendData } = useWeeklyTrend();
  const trend: WeeklyTrendPoint[] = trendData?.trend || [];
  const { data: topItemsData } = useTopItems();
  const topItems: TopItem[] = topItemsData?.topItems || [];

  const openLowStock = () => {
    sessionStorage.setItem("inventoryFilter", "low");
    onNavigate?.("inventory");
  };

  const today = dashboard?.today;
  const lowStock = dashboard?.lowStock;
  const specialOrders = dashboard?.specialOrders;
  const maxTopQty = Math.max(1, ...topItems.map((i) => i.qty));

  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          {dashboard?.scope === "all-branches"
            ? "Combined view across all branches."
            : "Here's what's happening today."}
        </p>
      </div>

      {/* Top stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-7 w-20" />
              </CardContent>
            </Card>
          ))
        ) : (
          <>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
              <Card className="border-l-4 border-l-[#7DD3FC] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Today's Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">₹{(today?.totalRevenue || 0).toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground mt-1">{today?.totalBills || 0} bills</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <Card className="border-l-4 border-l-[#FBCFE8] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Cash vs UPI</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    ₹{(today?.cashRevenue || 0).toLocaleString()} / ₹{(today?.upiRevenue || 0).toLocaleString()}
                  </div>
                  <div className="flex h-2 rounded-full overflow-hidden mt-2 bg-muted">
                    {(() => {
                      const total = (today?.cashRevenue || 0) + (today?.upiRevenue || 0);
                      const cashPct = total > 0 ? ((today?.cashRevenue || 0) / total) * 100 : 50;
                      return (
                        <>
                          <div className="bg-[#7DD3FC]" style={{ width: `${cashPct}%` }} />
                          <div className="bg-[#FBCFE8]" style={{ width: `${100 - cashPct}%` }} />
                        </>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="border-l-4 border-l-[#BBF7D0] shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Avg Bill Value</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl">₹{today?.avgBillValue || 0}</div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card
                className={`border-l-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${
                  (lowStock?.count || 0) > 0 ? "border-l-red-400" : "border-l-[#FDE68A]"
                }`}
                onClick={openLowStock}
                role="button"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Low Stock Alerts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-2xl ${(lowStock?.count || 0) > 0 ? "text-red-600" : ""}`}>
                    {lowStock?.count || 0}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dine-in vs Takeaway */}
        <Card>
          <CardHeader>
            <CardTitle>Dine-in vs Takeaway</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4 text-sm">
              <div className="flex items-center justify-between">
                <span>🍵 Dine-in: {today?.dineInCount || 0} bills</span>
                <span>₹{(today?.dineInRevenue || 0).toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>🥡 Takeaway: {today?.takeawayCount || 0} bills</span>
                <span>₹{(today?.takeawayRevenue || 0).toLocaleString()}</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={120}>
              <BarChart
                data={[
                  { type: "Dine-in", revenue: today?.dineInRevenue || 0 },
                  { type: "Takeaway", revenue: today?.takeawayRevenue || 0 },
                ]}
                layout="vertical"
              >
                <XAxis type="number" hide />
                <YAxis type="category" dataKey="type" width={70} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#7DD3FC" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Special Orders */}
        <Card
          className="border-l-4 border-l-[#C4B5FD] cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onNavigate?.("specialOrders")}
          role="button"
        >
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="w-5 h-5 text-[#7C3AED]" />
                Special Orders
                <Badge className="bg-[#C4B5FD] text-[#3730A3]">{specialOrders?.upcomingCount || 0} upcoming</Badge>
                {(specialOrders?.pendingBalanceCount || 0) > 0 && (
                  <Badge className="bg-destructive/20 text-destructive">
                    {specialOrders?.pendingBalanceCount} balance pending
                  </Badge>
                )}
              </CardTitle>
              <Button variant="ghost" size="sm" className="gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {!specialOrders?.upcoming?.length ? (
              <div className="text-sm text-muted-foreground">No upcoming special orders.</div>
            ) : (
              <div className="space-y-2">
                {specialOrders.upcoming.slice(0, 3).map((o) => (
                  <div key={o._id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-3">
                      <span
                        className={`w-2 h-2 rounded-full ${o.balanceCollected ? "bg-[#BBF7D0]" : "bg-red-500"}`}
                        title={o.balanceCollected ? "Fully paid" : "Balance pending"}
                      />
                      <div className="text-sm">{o.customerName}</div>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      ₹{o.totalAmount}
                      <div>
                        {formatDate(o.deliveryDate)} {o.deliveryTime}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={trend.map((t) => ({ ...t, label: formatDayLabel(t.date) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₹${value}`} />
                <Line type="monotone" dataKey="revenue" stroke="#7DD3FC" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items Today</CardTitle>
          </CardHeader>
          <CardContent>
            {topItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No items sold yet today.</div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item) => (
                  <div key={item.name}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span>{item.name}</span>
                      <span className="text-muted-foreground">
                        {item.qty} sold · ₹{item.revenue}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-[#7DD3FC]"
                        style={{ width: `${(item.qty / maxTopQty) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      <Card
        className="border-l-4 border-l-red-400 cursor-pointer hover:shadow-md transition-shadow"
        onClick={openLowStock}
        role="button"
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Low Stock Alerts
              <Badge className={(lowStock?.count || 0) > 0 ? "bg-red-100 text-red-800 border-0" : "bg-green-100 text-green-800 border-0"}>
                {isLoading ? "…" : lowStock?.count || 0}
              </Badge>
            </CardTitle>
            <Button variant="ghost" size="sm" className="gap-1">
              View Inventory <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!lowStock?.items?.length ? (
            <div className="text-sm text-muted-foreground">All inventory items are above their minimum level. 🎉</div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {lowStock.items.map((item) => (
                <div
                  key={item.name}
                  className="px-3 py-1.5 rounded-md bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm flex items-center gap-2"
                >
                  <Package className="w-3.5 h-3.5 text-red-500" />
                  <span>{item.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {item.currentQty} / {item.minQty} {item.unit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branch Performance — super_admin viewing all branches only */}
      {dashboard?.scope === "all-branches" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Branch Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-muted-foreground border-b">
                    <th className="py-2 pr-4">Branch</th>
                    <th className="py-2 pr-4">City</th>
                    <th className="py-2 pr-4">Orders Today</th>
                    <th className="py-2 pr-4">Revenue Today</th>
                    <th className="py-2 pr-4">Staff Count</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.branchBreakdown.map((b) => (
                    <tr
                      key={b.branchId}
                      className="border-b last:border-0 cursor-pointer hover:bg-muted/30"
                      onClick={() => setSelectedBranchId(b.branchId)}
                    >
                      <td className="py-2 pr-4">{b.branchName}</td>
                      <td className="py-2 pr-4 text-muted-foreground">{b.city}</td>
                      <td className="py-2 pr-4">{b.ordersToday}</td>
                      <td className="py-2 pr-4">₹{b.revenueToday.toLocaleString()}</td>
                      <td className="py-2 pr-4">{b.staffCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
