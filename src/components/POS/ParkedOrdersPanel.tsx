import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '../ui/sheet';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Clock, Play } from 'lucide-react';
import { apiFetch } from '../../utils/api';
import { useAuth } from '../Auth/AuthContext';
import { toast } from 'sonner@2.0.3';
import { formatDistanceToNow } from 'date-fns';

type OrderType = 'dine-in' | 'takeaway';

interface ParkedOrder {
  id: string;
  items: any[];
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  parked_at: string;
  orderType: OrderType;
}

interface ParkedOrdersPanelProps {
  open: boolean;
  onClose: () => void;
  onResumeOrder: (order: ParkedOrder) => void;
}

const orderTypeBadge = (type: OrderType) =>
  type === 'dine-in' ? (
    <Badge className="text-xs bg-teal-100 text-teal-800 border-0">🍵 Dine-in</Badge>
  ) : (
    <Badge className="text-xs bg-amber-100 text-amber-800 border-0">🥡 Takeaway</Badge>
  );

export function ParkedOrdersPanel({ open, onClose, onResumeOrder }: ParkedOrdersPanelProps) {
  const [parkedOrders, setParkedOrders] = useState<ParkedOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { accessToken } = useAuth();

  const fetchParkedOrders = async () => {
    setIsLoading(true);
    try {
      const data = await apiFetch('/orders?status=pending', accessToken);
      const mapped: ParkedOrder[] = data.map((order: any) => ({
        id: order._id,
        // Keep the original item field names (name/price/variant) so the POS
        // can rebuild the cart faithfully on resume.
        items: order.items.map((item: any) => ({
          name: item.name,
          qty: item.qty,
          price: item.price,
          subtotal: item.subtotal,
          variantId: item.variantId ?? null,
          variantName: item.variantName ?? null,
          menuItem: item.menuItem ?? null,
        })),
        subtotal: order.subtotal,
        tax_amount: order.tax,
        total_amount: order.totalAmount,
        parked_at: order.createdAt,
        // Fall back to takeaway for any legacy parked order without orderType.
        orderType: order.orderType === 'dine-in' ? 'dine-in' : 'takeaway',
      }));
      setParkedOrders(mapped);
    } catch (error) {
      console.error('Error fetching parked orders:', error);
      toast.error('Failed to load parked orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchParkedOrders();
    }
  }, [open]);

  const handleResume = async (order: ParkedOrder) => {
    try {
      await apiFetch(`/orders/${order.id}`, accessToken, { method: 'DELETE' });
      toast.success('Order resumed');
      onResumeOrder(order);
      fetchParkedOrders(); // Refresh list
    } catch (error) {
      console.error('Error resuming order:', error);
      toast.error('Failed to resume order');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md backdrop-blur-xl bg-white/90 border-white/40">
        <SheetHeader>
          <SheetTitle>Parked Orders</SheetTitle>
          <SheetDescription>
            Resume a saved order to continue
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3">
          {isLoading ? (
            <div className="text-center py-8 text-gray-500">
              <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading parked orders...
            </div>
          ) : parkedOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No parked orders</p>
              <p className="text-sm mt-1">Saved orders will appear here</p>
            </div>
          ) : (
            parkedOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 bg-white rounded-lg border-2 border-gray-200 hover:border-sky-300 transition-colors"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm">
                        Order #{order.id.substring(0, 8)}
                      </h4>
                      {orderTypeBadge(order.orderType)}
                    </div>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(order.parked_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg text-sky-600">
                      ₹{order.total_amount.toFixed(2)}
                    </div>
                  </div>
                </div>

                <div className="space-y-1 mb-3">
                  {order.items.slice(0, 3).map((item: any, idx: number) => (
                    <div key={idx} className="text-xs text-gray-600 flex justify-between">
                      <span>
                        {item.qty}x {item.name}
                        {item.variantName ? ` (${item.variantName})` : ''}
                      </span>
                      <span>₹{((item.price || 0) * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-gray-500">
                      +{order.items.length - 3} more items
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
                    onClick={() => handleResume(order)}
                  >
                    <Play className="w-3 h-3 mr-1" />
                    Resume
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
