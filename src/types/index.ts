export type PackSizeUnit = "ml" | "litre" | "g" | "kg" | "piece" | "pack";

export interface InventoryItem {
  _id: string;
  name: string;
  unit: string;
  type: "raw" | "finished";
  currentQty: number;
  minQty: number;
  packSize: number;
  packSizeUnit: PackSizeUnit;
  totalBaseQty?: number; // computed virtual from backend (currentQty * packSize)
  branchId: string;
  createdAt: string;
}

export interface StockTransaction {
  _id: string;
  stockItemId: string;
  type: "in" | "out" | "adjust";
  qty: number;
  reason: string;
  employeeId: { name: string } | string;
  createdAt: string;
}

export interface SpecialOrderItem {
  menuItem: string;
  name: string;
  qty: number;
  price: number;
  subtotal: number;
  variantName: string | null;
}

export interface OperatingHour {
  day: string;
  enabled: boolean;
  openTime: string;
  closeTime: string;
}

export interface Settings {
  _id: string;
  branchId: string;
  shopName: string;
  address: string;
  phone: string;
  email: string;
  operatingHours: OperatingHour[];
  acceptCash: boolean;
  acceptUpi: boolean;
  taxName: string;
  taxRate: number;
  taxNumber: string;
  applyTaxToAllItems: boolean;
  printerName: string;
  printerIp: string;
  printerPort: string;
}

export interface DashboardData {
  scope: "all-branches" | "single-branch";
  today: {
    totalRevenue: number;
    cashRevenue: number;
    upiRevenue: number;
    totalBills: number;
    cancelledCount: number;
    avgBillValue: number;
    dineInCount: number;
    dineInRevenue: number;
    takeawayCount: number;
    takeawayRevenue: number;
  };
  lowStock: {
    count: number;
    items: { name: string; currentQty: number; minQty: number; unit: string }[];
  };
  specialOrders: {
    upcomingCount: number;
    pendingBalanceCount: number;
    upcoming: {
      _id: string;
      customerName: string;
      deliveryDate: string;
      deliveryTime: string;
      totalAmount: number;
      balanceCollected: boolean;
    }[];
  };
  branchBreakdown: {
    branchId: string;
    branchName: string;
    city: string;
    ordersToday: number;
    revenueToday: number;
    staffCount: number;
  }[];
}

export interface WeeklyTrendPoint {
  date: string;
  revenue: number;
  bills: number;
}

export interface TopItem {
  name: string;
  qty: number;
  revenue: number;
}

export interface DailyReportSummary {
  totalRevenue: number;
  totalBills: number;
  cancelledCount: number;
  cashTotal: number;
  upiTotal: number;
  avgBillValue: number;
  dineInCount: number;
  dineInRevenue: number;
  takeawayCount: number;
  takeawayRevenue: number;
}

export interface DailyBreakdownPoint {
  date: string;
  revenue: number;
  bills: number;
}

export interface EmployeeReportRow {
  name: string;
  bills: number;
  revenue: number;
  avgBillValue: number;
}

export interface ItemReportRow {
  name: string;
  qty: number;
  revenue: number;
}

export interface SpecialOrder {
  _id: string;
  customerName: string;
  customerPhone: string;
  items: SpecialOrderItem[];
  totalAmount: number;
  advancePaid: number;
  balanceAmount: number;
  balanceCollected: boolean;
  balanceCollectedAt: string | null;
  deliveryDate: string;
  deliveryTime: string;
  status: "pending" | "confirmed" | "ready" | "delivered" | "cancelled";
  notes: string;
  branchId: string;
  createdAt: string;
}
