import { TrendingUp, IndianRupee, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const dailySalesData = [
  { day: "Mon", sales: 12400, orders: 45 },
  { day: "Tue", sales: 15800, orders: 58 },
  { day: "Wed", sales: 14200, orders: 52 },
  { day: "Thu", sales: 18900, orders: 67 },
  { day: "Fri", sales: 24500, orders: 89 },
  { day: "Sat", sales: 28700, orders: 102 },
  { day: "Sun", sales: 22100, orders: 78 },
];

const hourlySalesData = [
  { hour: "9AM", sales: 850 },
  { hour: "10AM", sales: 1200 },
  { hour: "11AM", sales: 2400 },
  { hour: "12PM", sales: 4800 },
  { hour: "1PM", sales: 5200 },
  { hour: "2PM", sales: 3800 },
  { hour: "3PM", sales: 2100 },
  { hour: "4PM", sales: 1800 },
  { hour: "5PM", sales: 3200 },
  { hour: "6PM", sales: 5600 },
  { hour: "7PM", sales: 7200 },
  { hour: "8PM", sales: 6400 },
  { hour: "9PM", sales: 4200 },
];

const categorySalesData = [
  { name: "Pizza", value: 35, color: "#7DD3FC" },
  { name: "Burgers", value: 25, color: "#FBCFE8" },
  { name: "Salads", value: 15, color: "#BBF7D0" },
  { name: "Pasta", value: 15, color: "#FDE68A" },
  { name: "Drinks", value: 10, color: "#C4B5FD" },
];

const topCustomers = [
  { name: "John Smith", orders: 24, spent: 1240 },
  { name: "Emma Wilson", orders: 18, spent: 980 },
  { name: "Michael Brown", orders: 16, spent: 850 },
  { name: "Sarah Davis", orders: 14, spent: 720 },
  { name: "David Lee", orders: 12, spent: 640 },
];

export function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1>Reports & Analytics</h1>
        <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-[#7DD3FC]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₹136,700</div>
            <div className="flex items-center gap-1 text-sm text-[#10B981] mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>+15.3% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#FBCFE8]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Total Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">491</div>
            <div className="flex items-center gap-1 text-sm text-[#10B981] mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>+8.2% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#BBF7D0]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">₹278.41</div>
            <div className="flex items-center gap-1 text-sm text-[#10B981] mt-1">
              <TrendingUp className="w-4 h-4" />
              <span>+6.5% from last week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-[#FDE68A]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl">342</div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
              <span>128 new this week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="hourly">Hourly</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Sales & Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={dailySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="sales"
                    stroke="#7DD3FC"
                    strokeWidth={3}
                    name="Sales ($)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="orders"
                    stroke="#FBCFE8"
                    strokeWidth={3}
                    name="Orders"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={categorySalesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categorySalesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySalesData.map((category) => (
                    <div key={category.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{category.name}</span>
                        <span className="text-muted-foreground">{category.value}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full transition-all"
                          style={{
                            width: `${category.value}%`,
                            backgroundColor: category.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Customers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {topCustomers.map((customer, index) => (
                  <div
                    key={customer.name}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#7DD3FC] to-[#FBCFE8] flex items-center justify-center">
                        <span className="text-sm text-white">{index + 1}</span>
                      </div>
                      <div>
                        <div>{customer.name}</div>
                        <div className="text-sm text-muted-foreground">{customer.orders} orders</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[#7DD3FC]">₹{customer.spent}</div>
                      <div className="text-xs text-muted-foreground">Total spent</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hourly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hourly Sales Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={hourlySalesData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="hour" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="sales" fill="#7DD3FC" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
