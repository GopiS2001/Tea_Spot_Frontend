import { useState } from "react";
import { Download, IndianRupee, Receipt, Ban, Wallet } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
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
import {
  useDailyReport,
  useEmployeeReport,
  useItemReport,
  useExportReport,
  ReportDateParams,
} from "../../hooks/useApi";
import { DailyReportSummary, DailyBreakdownPoint, EmployeeReportRow, ItemReportRow } from "../../types";

type RangeOption = "today" | "week" | "month" | "custom";

const RANGE_LABELS: { value: RangeOption; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "custom", label: "Custom Range" },
];

export function Analytics() {
  const [range, setRange] = useState<RangeOption>("today");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [activeTab, setActiveTab] = useState<"daily" | "employee" | "item">("daily");

  const params: ReportDateParams = { range, startDate, endDate };
  const customIncomplete = range === "custom" && (!startDate || !endDate);

  const dailyReport = useDailyReport(customIncomplete ? { range: "today" } : params);
  const employeeReport = useEmployeeReport(customIncomplete ? { range: "today" } : params);
  const itemReport = useItemReport(customIncomplete ? { range: "today" } : params);
  const exportReport = useExportReport();

  const summary: DailyReportSummary | undefined = dailyReport.data?.summary;
  const dailyBreakdown: DailyBreakdownPoint[] = dailyReport.data?.dailyBreakdown || [];
  const employees: EmployeeReportRow[] = employeeReport.data || [];
  const items: ItemReportRow[] = itemReport.data || [];

  const handleExport = () => {
    exportReport.mutate({ type: activeTab === "item" ? "item" : activeTab, params });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1>Reports & Analytics</h1>
          <p className="text-muted-foreground">Comprehensive insights into your business performance</p>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          {RANGE_LABELS.map((r) => (
            <Button
              key={r.value}
              variant={range === r.value ? "default" : "outline"}
              size="sm"
              onClick={() => setRange(r.value)}
            >
              {r.label}
            </Button>
          ))}

          {range === "custom" && (
            <>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-auto"
              />
            </>
          )}

          <Button size="sm" className="gap-2" onClick={handleExport} disabled={exportReport.isPending}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Daily</TabsTrigger>
          <TabsTrigger value="employee">Employee-wise</TabsTrigger>
          <TabsTrigger value="item">Item-wise</TabsTrigger>
        </TabsList>

        <TabsContent value="daily" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-[#7DD3FC]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <IndianRupee className="w-4 h-4" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">₹{summary?.totalRevenue ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#FBCFE8]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Receipt className="w-4 h-4" />
                  Total Bills
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{summary?.totalBills ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#BBF7D0]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Wallet className="w-4 h-4" />
                  Avg Bill Value
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">₹{summary?.avgBillValue ?? 0}</div>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-[#FDE68A]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                  <Ban className="w-4 h-4" />
                  Cancelled
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl">{summary?.cancelledCount ?? 0}</div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cash vs UPI</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: "Cash", value: summary?.cashTotal ?? 0 },
                      { name: "UPI", value: summary?.upiTotal ?? 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={60} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#7DD3FC" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dine-in vs Takeaway</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    layout="vertical"
                    data={[
                      { name: "Dine-in", value: summary?.dineInRevenue ?? 0 },
                      { name: "Takeaway", value: summary?.takeawayRevenue ?? 0 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" />
                    <YAxis type="category" dataKey="name" width={70} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#FBCFE8" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {dailyBreakdown.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="revenue" stroke="#7DD3FC" strokeWidth={3} name="Revenue" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="employee" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Employee Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Bills</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead>Avg Bill Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp, index) => (
                    <TableRow key={emp.name}>
                      <TableCell>
                        {emp.name}
                        {index === 0 && <span className="ml-2">🏆</span>}
                      </TableCell>
                      <TableCell>{emp.bills}</TableCell>
                      <TableCell>₹{emp.revenue}</TableCell>
                      <TableCell>₹{emp.avgBillValue}</TableCell>
                    </TableRow>
                  ))}
                  {employees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">
                        No data for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Employee</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(200, employees.length * 50)}>
                <BarChart layout="vertical" data={employees}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={100} />
                  <Tooltip />
                  <Bar dataKey="revenue" fill="#BBF7D0" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="item" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Item Sales</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>Qty Sold</TableHead>
                    <TableHead>Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={item.name}>
                      <TableCell>
                        {item.name}
                        {index === 0 && <span className="ml-2">🥇</span>}
                        {index === 1 && <span className="ml-2">🥈</span>}
                        {index === 2 && <span className="ml-2">🥉</span>}
                      </TableCell>
                      <TableCell>{item.qty}</TableCell>
                      <TableCell>₹{item.revenue}</TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No data for this period
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top 10 Items by Quantity</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={Math.max(200, Math.min(items.length, 10) * 50)}>
                <BarChart layout="vertical" data={items.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis type="number" />
                  <YAxis type="category" dataKey="name" width={140} />
                  <Tooltip />
                  <Bar dataKey="qty" fill="#FDE68A" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
