import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Users, IndianRupee } from 'lucide-react';
import { Badge } from '../ui/badge';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  tax: number;
}

interface SplitBillModalProps {
  open: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  subtotal: number;
  tax: number;
  total: number;
}

export function SplitBillModal({ open, onClose, cartItems, subtotal, tax, total }: SplitBillModalProps) {
  const [numPayers, setNumPayers] = useState(2);
  const [splitMethod, setSplitMethod] = useState<'equal' | 'custom'>('equal');
  const [itemAssignments, setItemAssignments] = useState<{ [key: string]: number }>({});

  const handleNumPayersChange = (value: string) => {
    const num = parseInt(value);
    if (!isNaN(num) && num >= 2 && num <= 10) {
      setNumPayers(num);
      // Reset assignments when changing number of payers
      setItemAssignments({});
    }
  };

  const assignItemToPayer = (itemId: string, payerIndex: number) => {
    setItemAssignments(prev => ({
      ...prev,
      [itemId]: payerIndex,
    }));
  };

  const calculatePayerTotals = () => {
    const payerTotals = Array(numPayers).fill(0);
    const payerItems: { [key: number]: CartItem[] } = {};

    if (splitMethod === 'equal') {
      // Equal split
      const perPersonTotal = total / numPayers;
      return Array(numPayers).fill(perPersonTotal);
    } else {
      // Custom split based on item assignments
      cartItems.forEach(item => {
        const payerIndex = itemAssignments[item.id];
        if (payerIndex !== undefined && payerIndex >= 0 && payerIndex < numPayers) {
          const itemTotal = item.price * item.quantity;
          const itemTax = (itemTotal * item.tax) / 100;
          payerTotals[payerIndex] += itemTotal + itemTax;
          
          if (!payerItems[payerIndex]) {
            payerItems[payerIndex] = [];
          }
          payerItems[payerIndex].push(item);
        }
      });

      return payerTotals;
    }
  };

  const payerTotals = calculatePayerTotals();
  const hasUnassignedItems = splitMethod === 'custom' && 
    cartItems.some(item => itemAssignments[item.id] === undefined);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Split Bill</DialogTitle>
          <DialogDescription>
            Divide the bill among multiple payers
          </DialogDescription>
        </DialogHeader>

        <Tabs value={splitMethod} onValueChange={(v: any) => setSplitMethod(v)} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equal">Equal Split</TabsTrigger>
            <TabsTrigger value="custom">Custom Split</TabsTrigger>
          </TabsList>

          <TabsContent value="equal" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="num-payers">Number of Payers</Label>
              <Input
                id="num-payers"
                type="number"
                min="2"
                max="10"
                value={numPayers}
                onChange={(e) => handleNumPayersChange(e.target.value)}
              />
            </div>

            <div className="p-4 rounded-lg border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <span className="text-sky-900 dark:text-sky-200">Split Summary</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Bill:</span>
                  <span className="text-foreground">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Number of Payers:</span>
                  <span className="text-foreground">{numPayers}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-sky-300 dark:border-sky-800">
                  <span className="text-sky-900 dark:text-sky-200">Per Person:</span>
                  <span className="text-lg text-sky-600 dark:text-sky-400">
                    ₹{(total / numPayers).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: numPayers }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border-2 border-sky-200 dark:border-sky-800 bg-card"
                >
                  <div className="text-sm text-muted-foreground mb-1">Payer {idx + 1}</div>
                  <div className="text-xl text-sky-600 dark:text-sky-400">
                    ₹{(total / numPayers).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="num-payers-custom">Number of Payers</Label>
              <Input
                id="num-payers-custom"
                type="number"
                min="2"
                max="10"
                value={numPayers}
                onChange={(e) => handleNumPayersChange(e.target.value)}
              />
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              <Label>Assign Items to Payers</Label>
              {cartItems.map(item => (
                <div
                  key={item.id}
                  className="p-3 rounded-lg border border-border bg-card"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <div className="text-sm text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity}x ₹{item.price.toFixed(2)} = ₹{(item.price * item.quantity).toFixed(2)}
                      </div>
                    </div>
                    {itemAssignments[item.id] !== undefined && (
                      <Badge className="bg-sky-400 text-white">
                        Payer {itemAssignments[item.id] + 1}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {Array.from({ length: numPayers }).map((_, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={itemAssignments[item.id] === idx ? 'default' : 'outline'}
                        onClick={() => assignItemToPayer(item.id, idx)}
                        className={itemAssignments[item.id] === idx ? 'bg-sky-400 hover:bg-sky-500 text-white' : ''}
                      >
                        P{idx + 1}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {hasUnassignedItems && (
              <div className="p-3 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-100 dark:bg-amber-950/30 text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Some items are not assigned to any payer
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: numPayers }).map((_, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border-2 border-sky-200 dark:border-sky-800 bg-card"
                >
                  <div className="text-sm text-muted-foreground mb-1">Payer {idx + 1}</div>
                  <div className="text-xl text-sky-600 dark:text-sky-400">
                    ₹{payerTotals[idx].toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              // In a real app, this would create separate bills
              alert(`Bill split into ${numPayers} parts. This would generate separate payment requests.`);
              onClose();
            }}
            disabled={splitMethod === 'custom' && hasUnassignedItems}
            className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600"
          >
            <IndianRupee className="w-4 h-4 mr-2" />
            Split & Pay
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
