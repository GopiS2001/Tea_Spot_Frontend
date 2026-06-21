import { TrendingUp, TrendingDown, Users, Clock, AlertCircle, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { motion } from "motion/react";
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
  Cell,
} from "recharts";

const revenueData = [
  { time: "9AM", amount: 2400 },
  { time: "12PM", amount: 4800 },
  { time: "3PM", amount: 3200 },
  { time: "6PM", amount: 5600 },
  { time: "9PM", amount: 7200 },
];

const topItems = [
  { name: "Margherita Pizza", sales: 145, revenue: 2175, image: "🍕" },
  { name: "Caesar Salad", sales: 98, revenue: 1470, image: "🥗" },
  { name: "Burger Deluxe", sales: 87, revenue: 1305, image: "🍔" },
  { name: "Pasta Carbonara", sales: 76, revenue: 1140, image: "🍝" },
];

const activeOrders = [
  { id: "#1234", table: "T-12", items: 4, status: "cooking", time: "12 min" },
  { id: "#1235", table: "T-05", items: 2, status: "ready", time: "2 min" },
  { id: "#1236", table: "Takeaway", items: 6, status: "pending", time: "18 min" },
  { id: "#1237", table: "T-08", items: 3, status: "cooking", time: "8 min" },
];

const alerts = [
  { type: "warning", message: "Low stock: Tomatoes (5 kg remaining)", icon: Package },
  { type: "error", message: "Order #1232 delayed by 15 minutes", icon: Clock },
  { type: "info", message: "3 refund requests pending approval", icon: AlertCircle },
];

const tables = [
  { id: 1, number: "T-01", status: "occupied", guests: 4 },
  { id: 2, number: "T-02", status: "available", guests: 0 },
  { id: 3, number: "T-03", status: "occupied", guests: 2 },
  { id: 4, number: "T-04", status: "reserved", guests: 6 },
  { id: 5, number: "T-05", status: "occupied", guests: 3 },
  { id: 6, number: "T-06", status: "available", guests: 0 },
  { id: 7, number: "T-07", status: "occupied", guests: 2 },
  { id: 8, number: "T-08", status: "available", guests: 0 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Revenue Snapshot */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="border-l-4 border-l-[#7DD3FC] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Today's Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl">$12,458</div>
                  <div className="flex items-center gap-1 text-sm text-[#10B981] mt-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>+12.5%</span>
                  </div>
                </div>
                <ResponsiveContainer width={80} height={40}>
                  <LineChart data={revenueData.slice(0, 4)}>
                    <Line type="monotone" dataKey="amount" stroke="#7DD3FC" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-l-4 border-l-[#FBCFE8] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl">$84,250</div>
                  <div className="flex items-center gap-1 text-sm text-[#10B981] mt-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>+8.2%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-l-4 border-l-[#BBF7D0] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl">$342,890</div>
                  <div className="flex items-center gap-1 text-sm text-[#EF4444] mt-1">
                    <TrendingDown className="w-4 h-4" />
                    <span>-2.4%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-l-4 border-l-[#FDE68A] shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground">Active Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  <div className="text-2xl">24</div>
                  <div className="text-sm text-muted-foreground mt-1">8 pending</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Active Orders</CardTitle>
              <Button variant="ghost" size="sm">View All</Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <div>{order.id}</div>
                      <div className="text-xs text-muted-foreground">{order.table}</div>
                    </div>
                    <div className="text-sm text-muted-foreground">{order.items} items</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {order.time}
                    </div>
                    <Badge
                      className={
                        order.status === "ready"
                          ? "bg-[#BBF7D0] text-[#047857]"
                          : order.status === "cooking"
                          ? "bg-[#FDE68A] text-[#92400E]"
                          : "bg-[#FBCFE8] text-[#9F1239]"
                      }
                    >
                      {order.status}
                    </Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Staff On Duty */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Staff On Duty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {["Sarah (Manager)", "Mike (Chef)", "Anna (Waiter)", "Tom (Cashier)"].map((staff, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7DD3FC] to-[#FBCFE8] flex items-center justify-center">
                    <span className="text-sm text-white">{staff[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{staff}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.floor(Math.random() * 4 + 2)}h active
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-[#BBF7D0]"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Items */}
        <Card>
          <CardHeader>
            <CardTitle>Top Selling Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#7DD3FC]/20 to-[#FBCFE8]/20 flex items-center justify-center text-2xl">
                    {item.image}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm">{item.name}</div>
                    <div className="text-xs text-muted-foreground">{item.sales} orders</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">${item.revenue}</div>
                    <div className="text-xs text-muted-foreground">
                      {Math.round((item.sales / 400) * 100)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Live Floor Map */}
        <Card>
          <CardHeader>
            <CardTitle>Live Floor Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {tables.map((table) => (
                <motion.div
                  key={table.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                    table.status === "occupied"
                      ? "bg-[#FBCFE8]/30 border-2 border-[#FBCFE8]"
                      : table.status === "reserved"
                      ? "bg-[#FDE68A]/30 border-2 border-[#FDE68A]"
                      : "bg-[#BBF7D0]/30 border-2 border-[#BBF7D0]"
                  }`}
                >
                  <div className="text-sm">{table.number}</div>
                  {table.status === "occupied" && (
                    <div className="text-xs text-muted-foreground">{table.guests} guests</div>
                  )}
                  {table.status === "reserved" && (
                    <div className="text-xs text-muted-foreground">Reserved</div>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Alerts & Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert, index) => {
                const Icon = alert.icon;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`flex items-center gap-4 p-4 rounded-lg ${
                      alert.type === "error"
                        ? "bg-destructive/10"
                        : alert.type === "warning"
                        ? "bg-[#FDE68A]/30"
                        : "bg-[#7DD3FC]/10"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="flex-1 text-sm">{alert.message}</div>
                    <Button variant="ghost" size="sm">
                      Resolve
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
