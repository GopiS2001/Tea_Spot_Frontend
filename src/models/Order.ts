export type OrderType = "dine-in" | "takeaway";

export interface Order {
  id: string;
  orderType: OrderType;
  items: { name: string; qty: number; price: number }[];
  status: "active" | "done";
  timestamp: number;
  totalAmount: number;
  profit: number;
}
