# Restaurant Billing & Management SaaS Application

A comprehensive multi-tenant SaaS solution for restaurant management covering Point-of-Sale (POS), Kitchen Display System (KDS), Menu & Inventory management, Staff & Role control, Advanced Analytics, and Admin management.

## Features

### 1. Point of Sale (POS)
- **Cart Management**: Add items from inventory, adjust quantities
- **Discount System**: Apply percentage or fixed-amount discounts to orders
- **Split Bill**: Split bills among multiple payers (equal or custom allocation)
- **Save & Close**: Park orders for later resumption
- **Payment Processing**: Multiple payment methods
  - Credit/Debit Card
  - UPI
  - Net Banking
  - Cash
- **Receipt Generation**: Print or download receipts in JSON format
- **Order Types**: Dine-in, Takeaway, Delivery

### 2. Inventory Management
- Full CRUD operations for menu items
- Track SKU, name, price, tax, category, quantity, kitchen display flag
- Role-based access (Owner/Manager can add/edit, Owner can delete)
- Real-time stock tracking

### 3. Authentication & Authorization
- Secure login system with JWT tokens
- Role-based access control (RBAC)
  - **Owner**: Full access (inventory CRUD, settings, role management, all billing operations)
  - **Manager**: Inventory add/edit, view parked orders, process payments, analytics
  - **Cashier**: Create orders, apply discounts, split bills, pay/park orders
- Profile management with avatar support
- Secure password hashing with bcrypt

### 4. Kitchen Display System (KDS)
- View orders marked for kitchen display
- Filter by category, time, status, table number
- Update order status (new, in-progress, completed)
- Real-time order tracking

### 5. Settings & Configuration
- Default tax rate configuration
- Receipt header customization
- Timezone settings
- User role management (Owner only)

## Technical Architecture

### Backend (Supabase Edge Functions)
- **Framework**: Hono web server on Deno
- **Database**: Supabase KV Store
- **Authentication**: JWT with bcrypt password hashing
- **API Endpoints**:
  - `POST /api/auth/login` - User login
  - `POST /api/auth/logout` - User logout
  - `POST /api/auth/register` - Register new user (Owner only)
  - `GET /api/auth/me` - Get current user
  - `PUT /api/auth/profile` - Update user profile
  - `GET /api/items` - Get all items (with filters)
  - `POST /api/items` - Create item (Manager/Owner)
  - `PUT /api/items/:id` - Update item (Manager/Owner)
  - `DELETE /api/items/:id` - Delete item (Owner)
  - `POST /api/orders` - Create order
  - `GET /api/orders/:id` - Get order
  - `GET /api/orders` - Get all orders
  - `POST /api/orders/:id/park` - Park order
  - `GET /api/orders/parked` - Get parked orders
  - `POST /api/orders/:id/resume` - Resume parked order
  - `PUT /api/orders/:id/pay` - Process payment
  - `POST /api/payments/mock` - Mock payment gateway
  - `GET /api/kitchen/orders` - Get kitchen orders
  - `PUT /api/kitchen/orders/:id/status` - Update kitchen order status
  - `GET /api/settings` - Get settings (Owner)
  - `PUT /api/settings` - Update settings (Owner)
  - `GET /api/users` - Get all users (Owner)
  - `PUT /api/users/:id/role` - Update user role (Owner)

### Frontend (React + TypeScript)
- **UI Framework**: React with TypeScript
- **Styling**: Tailwind CSS with pastel color system
- **State Management**: React Context API
- **Animations**: Motion (formerly Framer Motion)
- **UI Components**: shadcn/ui components
- **Icons**: Lucide React

### Data Models (KV Store)

```typescript
// User
{
  id: string,
  username: string,
  password_hash: string,
  role: 'owner' | 'manager' | 'cashier',
  display_name: string,
  avatar: string,
  created_at: string
}

// Item
{
  id: string,
  sku: string,
  name: string,
  price: number,
  tax: number,
  category: string,
  qty: number,
  kitchen_display: boolean,
  created_at: string
}

// Order
{
  id: string,
  user_id: string,
  status: 'draft' | 'parked' | 'paid' | 'new' | 'in_progress' | 'completed',
  items: OrderItem[],
  subtotal: number,
  discount: number,
  discount_type: 'percentage' | 'fixed',
  tax_amount: number,
  total_amount: number,
  table_number?: string,
  created_at: string,
  updated_at: string,
  parked_at?: string,
  paid_at?: string,
  payment_id?: string
}

// Payment
{
  id: string,
  order_id: string,
  method: 'credit_card' | 'upi' | 'netbanking' | 'cash',
  provider_ref: string,
  amount: number,
  status: 'success' | 'failed',
  created_at: string
}
```

## Default Credentials

**Username**: `admin`  
**Password**: `admin123`  
**Role**: Owner

## Setup Instructions

The application is pre-configured and ready to use in the Figma Make environment. The backend automatically seeds the database with:
- An admin/owner account
- Sample inventory items (pizzas, burgers, salads, beverages, desserts)

### First Time Setup

1. The application will automatically seed the database on first run
2. Log in with the default credentials above
3. Start using the POS system immediately
4. Add more users via the Settings page (Owner only)

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure authentication with 24-hour expiration
- **Role-Based Access Control**: Granular permissions per role
- **Input Validation**: Frontend and backend validation
- **Parameterized Queries**: SQL injection prevention through KV store
- **CORS**: Configured for secure cross-origin requests

## Payment Gateway

The application includes a **mock payment gateway** for testing:
- Deterministic behavior for testing
- Simulates real payment processing with 1.5s delay
- **Test Cases**:
  - Card ending in `0000` → Payment fails
  - Amount exactly `$13.00` → Payment fails
  - All other cases → Payment succeeds

## Export Functionality

### Export Orders to CSV
To export orders, use the browser console:

```javascript
// Get all orders
const orders = await fetch('https://[projectId].supabase.co/functions/v1/make-server-1b17e9b2/api/orders', {
  headers: { 'Authorization': 'Bearer [token]' }
}).then(r => r.json());

// Convert to CSV
const csv = [
  ['Order ID', 'User ID', 'Status', 'Total', 'Created At'],
  ...orders.orders.map(o => [o.id, o.user_id, o.status, o.total_amount, o.created_at])
].map(row => row.join(',')).join('\\n');

// Download
const blob = new Blob([csv], { type: 'text/csv' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'orders.csv';
a.click();
```

## Design System

### Color Palette
- **Sky Blue**: `#7DD3FC` - Primary actions, highlights
- **Blush Pink**: `#FBCFE8` - Secondary accents
- **Mint Green**: `#BBF7D0` - Success states
- **Peach**: `#FDE68A` - Warnings, highlights

### Typography
- **Font**: Inter/Manrope
- **Spacing**: 8px baseline grid
- **Border Radius**: 12px for cards
- **Effects**: Glass morphism, gradient backgrounds, soft shadows

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

## Known Limitations

1. **Database Migrations**: The KV store doesn't support traditional SQL migrations. All schema changes must be handled programmatically.
2. **Email Verification**: Email confirmation is automatically set to true as no email server is configured.
3. **File Uploads**: Avatar images use URLs or base64 encoding.
4. **Real-time Updates**: The system uses polling rather than websockets for real-time updates.

## Future Enhancements

- Real-time order updates via websockets
- Advanced analytics and reporting
- Multi-currency support
- Online ordering integration
- Table management and reservations
- Loyalty program integration
- Integration with external payment gateways (Stripe, Razorpay)
- Automated inventory replenishment alerts

## Support

For issues or questions:
- Check the Help & Support section in the application
- Review API endpoint documentation above
- Inspect browser console for error messages

## License

Proprietary - Restaurant Management SaaS Platform

---

**Version**: 1.0.0  
**Last Updated**: October 2025
