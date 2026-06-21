import React, { useState, useEffect } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, IndianRupee, Percent, Save, Archive } from 'lucide-react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { motion, AnimatePresence } from 'motion/react';
import { Separator } from '../ui/separator';
import { resolveImageUrl } from '../../utils/api';
import { toast } from 'sonner@2.0.3';
import { useMenu, useCategories, useCreateOrder } from '../../hooks/useApi';
import { DiscountModal } from './DiscountModal';
import { SplitBillModal } from './SplitBillModal';
import { PaymentModal } from './PaymentModal';
import { ParkedOrdersPanel } from './ParkedOrdersPanel';
import { ReceiptModal } from './ReceiptModal';
import { VariantSelector, Variant } from './VariantSelector';

interface MenuItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  tax: number;
  category: string;
  qty: number;
  kitchen_display: boolean;
  image: string;
  hasVariants: boolean;
  variants: Variant[];
}

const isImagePath = (image: string) =>
  image.startsWith('/uploads') || image.startsWith('http') || image.startsWith('data:');

interface CartItem extends MenuItem {
  cartKey: string;
  quantity: number;
  variantId: string | null;
  variantName: string | null;
}

export function POSScreenNew() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('takeaway');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(0);

  // Modal states
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showParkedOrders, setShowParkedOrders] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [showVariantSelector, setShowVariantSelector] = useState(false);
  const [variantItem, setVariantItem] = useState<MenuItem | null>(null);

  // Debounce search so we don't hit the API on every keystroke.
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: categoryData = [] } = useCategories();
  const categories = ['All', ...categoryData.map((c: { name: string }) => c.name)];

  const { data: menuData = [], isLoading } = useMenu({
    search: debouncedSearch.trim() || undefined,
    category: selectedCategory,
  });
  const createOrder = useCreateOrder();

  // Items are already filtered server-side by search term and category.
  const filteredItems: MenuItem[] = menuData.map((row: any) => ({
    id: String(row._id),
    sku: row.sku || '',
    name: row.name,
    price: Number(row.price),
    tax: Number(row.tax) || 0,
    category: row.category,
    qty: Number(row.qty) || 0,
    kitchen_display: Boolean(row.kitchen_display),
    image: row.image || '',
    hasVariants: Boolean(row.hasVariants),
    variants: Array.isArray(row.variants)
      ? row.variants.map((v: any) => ({
          _id: String(v._id),
          name: v.name,
          price: Number(v.price),
        }))
      : [],
  }));

  // Items with variants open a size picker first; others add straight to cart.
  const handleItemClick = (item: MenuItem) => {
    if (item.hasVariants && item.variants.length > 0) {
      setVariantItem(item);
      setShowVariantSelector(true);
    } else {
      addToCart(item);
    }
  };

  const addToCart = (item: MenuItem, variant?: Variant) => {
    const variantId = variant ? variant._id : null;
    const variantName = variant ? variant.name : null;
    const price = variant ? variant.price : item.price;
    const cartKey = `${item.id}::${variantId ?? ''}`;

    const existingItem = cart.find((i) => i.cartKey === cartKey);
    if (existingItem) {
      setCart(
        cart.map((i) =>
          i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i
        )
      );
    } else {
      setCart([
        ...cart,
        { ...item, cartKey, quantity: 1, price, variantId, variantName },
      ]);
    }
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(cart.map(item => {
      if (item.cartKey === cartKey) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeItem = (cartKey: string) => {
    setCart(cart.filter(item => item.cartKey !== cartKey));
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  
  let orderDiscount = 0;
  if (discountValue > 0) {
    if (discountType === 'percentage') {
      orderDiscount = (subtotal * discountValue) / 100;
    } else {
      orderDiscount = Math.min(discountValue, subtotal);
    }
  }

  const tax = cart.reduce((sum, item) => {
    const itemTotal = (item.price * item.quantity);
    return sum + (itemTotal * item.tax / 100);
  }, 0);

  const total = subtotal + tax - orderDiscount;

  const handleApplyDiscount = (type: 'percentage' | 'fixed', value: number) => {
    setDiscountType(type);
    setDiscountValue(value);
    toast.success(`Discount applied: ${type === 'percentage' ? value + '%' : '₹' + value.toFixed(2)}`);
  };

  const handleSaveAndClose = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    try {
      await createOrder.mutateAsync({
        orderType,
        items: cart.map((item) => ({
          menuItem: item.id,
          name: item.name,
          qty: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          variantId: item.variantId,
          variantName: item.variantName,
        })),
        subtotal,
        tax,
        discount: orderDiscount,
        totalAmount: total,
        status: 'pending',
      });

      toast.success('Order saved and parked');
      clearCart();
    } catch (error) {
      console.error('Error saving order:', error);
      toast.error('Failed to save order');
    }
  };

  const handlePayNow = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (method: string, transactionId: string) => {
    try {
      if (cart.length === 0) {
        toast.error('Cart is empty');
        return;
      }

      const items = cart.map((item) => ({
        menuItem: item.id,
        name: item.name,
        qty: item.quantity,
        price: item.price,
        subtotal: item.price * item.quantity,
        variantId: item.variantId,
        variantName: item.variantName,
      }));

      const order = await createOrder.mutateAsync({
        orderType,
        items,
        subtotal,
        tax,
        discount: orderDiscount,
        totalAmount: total,
        status: 'completed',
        paymentMethod: method,
        transactionId,
      });

      setReceiptData({
        orderId: order.orderNumber,
        items,
        subtotal,
        tax,
        discount: orderDiscount,
        total,
        paymentMethod: method,
        transactionId,
        timestamp: order.createdAt,
        orderType,
      });

      setShowPaymentModal(false);
      setShowReceipt(true);
      clearCart();

      toast.success('Payment successful!');
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Failed to complete payment. Try again.');
    }
  };

  const clearCart = () => {
    setCart([]);
    setDiscountValue(0);
    setOrderType('takeaway');
  };

  const handleResumeOrder = (order: any) => {
    // Rebuild the cart from the parked order's items. Look up the live menu
    // item (for image/tax/etc.), but never drop a line if it isn't in the
    // current filtered view or was removed — fall back to the parked data so
    // the resumed cart always matches what was saved.
    const cartItems: CartItem[] = (order.items || []).map((item: any) => {
      const menuItem = filteredItems.find((m) => m.name === item.name);
      const variantId = item.variantId || null;
      const base: MenuItem = menuItem ?? {
        id: item.menuItem ? String(item.menuItem) : String(item.name),
        sku: '',
        name: item.name,
        price: Number(item.price) || 0,
        tax: 0,
        category: '',
        qty: 0,
        kitchen_display: true,
        image: '',
        hasVariants: false,
        variants: [],
      };
      return {
        ...base,
        cartKey: `${base.id}::${variantId ?? ''}`,
        quantity: Number(item.qty) || 1,
        price: Number(item.price) || base.price,
        variantId,
        variantName: item.variantName || null,
      };
    });

    setCart(cartItems);
    // Restore the original order type so it carries through to the final order.
    if (order.orderType === 'dine-in' || order.orderType === 'takeaway') {
      setOrderType(order.orderType);
    }
    setShowParkedOrders(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-4 p-4">
      {/* Menu Section */}
      <div className="flex-1 flex flex-col">
        {/* Search & Parked */}
        <div className="flex gap-3 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search menu items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 backdrop-blur-sm"
              style={{ backgroundColor: 'var(--glass-bg-light)' }}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowParkedOrders(true)}
            className="gap-2 backdrop-blur-sm"
            style={{ backgroundColor: 'var(--glass-bg-light)' }}
          >
            <Archive className="w-4 h-4" />
            Parked
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className={
                selectedCategory === category
                  ? 'bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 text-white whitespace-nowrap'
                  : 'whitespace-nowrap backdrop-blur-sm'
              }
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Menu Items Grid */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && filteredItems.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <div className="w-8 h-8 border-4 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Loading menu...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery.trim()
                ? `No items found for "${searchQuery.trim()}"`
                : 'No menu items found'}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-shadow backdrop-blur-sm border-border/40"
                    style={{ backgroundColor: 'var(--glass-bg)' }}
                    onClick={() => handleItemClick(item)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-square rounded-lg flex items-center justify-center text-4xl mb-3 overflow-hidden" style={{ background: 'var(--item-img-bg)' }}>
                        {isImagePath(item.image) ? (
                          <img
                            src={resolveImageUrl(item.image)}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <>
                            {item.category === 'Pizza' && '🍕'}
                            {item.category === 'Burgers' && '🍔'}
                            {item.category === 'Salads' && '🥗'}
                            {item.category === 'Sides' && '🍟'}
                            {item.category === 'Beverages' && '🥤'}
                            {item.category === 'Desserts' && '🍨'}
                            {item.category === 'Hot Drinks' && '☕'}
                            {item.category === 'Cool Drinks' && '🥤'}
                            {item.category === 'Biscuits' && '🍪'}
                            {!['Pizza', 'Burgers', 'Salads', 'Sides', 'Beverages', 'Desserts', 'Hot Drinks', 'Cool Drinks', 'Biscuits'].includes(item.category) && '🍽️'}
                          </>
                        )}
                      </div>
                      <h4 className="text-sm mb-1 line-clamp-2">{item.name}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sky-600">
                          {item.hasVariants && item.variants.length > 0
                            ? `From ₹${Math.min(...item.variants.map((v) => v.price)).toFixed(2)}`
                            : `₹${item.price.toFixed(2)}`}
                        </span>
                        {item.qty > 0 ? (
                          <Badge variant="outline" className="text-xs stock-badge--in">
                            In Stock
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs stock-badge--out">
                            Out
                          </Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Cart Section */}
      <div className="w-96 flex flex-col backdrop-blur-xl rounded-xl border border-border/40 p-6 shadow-xl" style={{ backgroundColor: 'var(--glass-bg)' }}>
        <div className="flex items-center justify-between mb-6">
          <h3>Current Order</h3>
          <Badge className="bg-gradient-to-r from-pink-300 to-pink-400 text-black border-0 capitalize">
            {orderType === 'dine-in' ? '🍵 Dine-in' : '🥡 Takeaway'}
          </Badge>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto mb-6 -mx-6 px-6">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p>No items in cart</p>
                <p className="text-sm mt-2">Start adding items from the menu</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <motion.div
                    key={item.cartKey}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--glass-bg-light)' }}
                  >
                    <div className="flex-1">
                      <div className="text-sm">{item.name}</div>
                      {item.variantName && (
                        <div className="text-xs text-sky-600">{item.variantName}</div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        ₹{item.price.toFixed(2)} each
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.cartKey, -1)}
                      >
                        <Minus className="w-3 h-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => updateQuantity(item.cartKey, 1)}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() => removeItem(item.cartKey)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>

        <Separator className="my-4" />

        {/* Totals */}
        <div className="space-y-2 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Tax</span>
            <span>₹{tax.toFixed(2)}</span>
          </div>
          {orderDiscount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount ({discountType === 'percentage' ? discountValue + '%' : 'Fixed'})</span>
              <span>-₹{orderDiscount.toFixed(2)}</span>
            </div>
          )}
          <Separator className="my-2" />
          <div className="flex justify-between">
            <span>Total</span>
            <span className="text-xl text-sky-600">₹{total.toFixed(2)}</span>
          </div>
        </div>

        {/* Order Type Toggle */}
        <div
          className="grid grid-cols-2 gap-2 mb-3 p-1 rounded-lg"
          style={{ backgroundColor: 'var(--glass-bg-light)' }}
          role="group"
          aria-label="Order type"
        >
          <button
            type="button"
            onClick={() => setOrderType('dine-in')}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition ${
              orderType === 'dine-in'
                ? 'bg-gradient-to-r from-teal-400 to-emerald-500 text-white shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>🍵</span> Dine-in
          </button>
          <button
            type="button"
            onClick={() => setOrderType('takeaway')}
            className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm transition ${
              orderType === 'takeaway'
                ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span>🥡</span> Takeaway
          </button>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowDiscountModal(true)}
            disabled={cart.length === 0}
          >
            <Percent className="w-4 h-4" />
            Discount
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => setShowSplitBillModal(true)}
            disabled={cart.length === 0}
          >
            <IndianRupee className="w-4 h-4" />
            Split Bill
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            disabled={cart.length === 0}
            onClick={handleSaveAndClose}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </Button>
          <Button
            className="bg-gradient-to-r from-sky-400 to-blue-500 hover:from-sky-500 hover:to-blue-600 gap-2"
            disabled={cart.length === 0}
            onClick={handlePayNow}
          >
            <CreditCard className="w-4 h-4" />
            Pay Now
          </Button>
        </div>
      </div>

      {/* Modals */}
      <DiscountModal
        open={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        onApply={handleApplyDiscount}
        currentSubtotal={subtotal}
      />

      <SplitBillModal
        open={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
        cartItems={cart}
        subtotal={subtotal}
        tax={tax}
        total={total}
      />

      <PaymentModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        total={total}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ParkedOrdersPanel
        open={showParkedOrders}
        onClose={() => setShowParkedOrders(false)}
        onResumeOrder={handleResumeOrder}
      />

      <ReceiptModal
        open={showReceipt}
        onClose={() => {
          setShowReceipt(false);
          setReceiptData(null);
        }}
        receipt={receiptData}
      />

      <VariantSelector
        open={showVariantSelector}
        item={variantItem}
        onSelect={(variant) => {
          if (variantItem) addToCart(variantItem, variant);
          setShowVariantSelector(false);
          setVariantItem(null);
        }}
        onClose={() => {
          setShowVariantSelector(false);
          setVariantItem(null);
        }}
      />
    </div>
  );
}
