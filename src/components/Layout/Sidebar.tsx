import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Menu as MenuIcon,
  Tag,
  Package,
  Users,
  BarChart3,
  UserCircle,
  Settings,
  HelpCircle,
  Sparkles,
  Shield,
  Building2,
  CalendarClock
} from "lucide-react";
import { motion, useAnimation } from "motion/react";
import { useAuth } from "../Auth/AuthContext";
import { usePermissions } from "../../hooks/usePermissions";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
}

const menuItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, color: "#7DD3FC" },
  { id: "pos", label: "POS", icon: ShoppingCart, color: "#FBCFE8" },
  { id: "orders", label: "Orders", icon: ClipboardList, color: "#BBF7D0" },
  { id: "menu", label: "Menu", icon: MenuIcon, color: "#C4B5FD" },
  { id: "categories", label: "Categories", icon: Tag, color: "#FCA5A5" },
  { id: "inventory", label: "Inventory", icon: Package, color: "#7DD3FC" },
  { id: "users", label: "Users", icon: Users, color: "#FBCFE8" },
  { id: "branches", label: "Branches", icon: Building2, color: "#A7F3D0" },
  { id: "roles", label: "Roles", icon: Shield, color: "#C4B5FD" },
  { id: "reports", label: "Reports", icon: BarChart3, color: "#BBF7D0" },
  { id: "specialOrders", label: "Special Orders", icon: CalendarClock, color: "#FDE68A" },
  { id: "settings", label: "Settings", icon: Settings, color: "#7DD3FC" },
  { id: "help", label: "Help", icon: HelpCircle, color: "#FBCFE8" },
];

export function Sidebar({ activeView, onViewChange }: SidebarProps) {
  const { user } = useAuth();
  const { canShow } = usePermissions();
  const visibleItems = menuItems.filter((item) => canShow(item.id, user?.role));

  return (
    <div className="w-64 backdrop-blur-xl border-r border-sidebar-border h-screen fixed left-0 top-0 flex flex-col shadow-lg" style={{ backgroundColor: 'var(--sidebar-panel-bg)' }}>
      <div className="p-6 border-b border-sidebar-border/50">
        <motion.div 
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div 
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#7DD3FC] via-[#FBCFE8] to-[#FDE68A] flex items-center justify-center relative overflow-hidden"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-[#FDE68A] via-[#7DD3FC] to-[#FBCFE8]"
              animate={{
                rotate: [0, 360],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear"
              }}
            />
            <ShoppingCart className="w-5 h-5 text-white relative z-10" />
          </motion.div>
          <div>
            <h2 className="text-sidebar-foreground">Tea Spot</h2>
            <p className="text-xs text-muted-foreground">Multi-Outlet</p>
          </div>
        </motion.div>
      </div>
      
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4">
        <div className="space-y-1">
          {visibleItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all relative group ${
                  isActive 
                    ? "text-[#0284C7] shadow-sm" 
                    : "text-sidebar-foreground hover:text-foreground"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ x: 6, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-xl"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}15, ${item.color}08)`
                    }}
                    initial={false}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                {/* Icon glow effect on hover */}
                <motion.div 
                  className="absolute left-4 w-5 h-5 rounded-full blur-md opacity-0 group-hover:opacity-50 transition-opacity"
                  style={{ backgroundColor: item.color }}
                />
                
                {/* Icon with animation */}
                <motion.div
                  className="relative z-10"
                  whileHover={{ 
                    rotate: [0, -10, 10, -10, 0],
                    scale: 1.1
                  }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="relative">
                    <Icon 
                      className={`w-5 h-5 transition-colors ${
                        isActive 
                          ? `text-[${item.color}]` 
                          : "text-muted-foreground group-hover:text-foreground"
                      }`}
                      style={isActive ? { color: item.color } : {}}
                    />
                    {isActive && (
                      <motion.div
                        className="absolute -inset-1 rounded-full blur-sm opacity-30"
                        style={{ backgroundColor: item.color }}
                        animate={{
                          scale: [1, 1.2, 1],
                          opacity: [0.3, 0.5, 0.3]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                      />
                    )}
                  </div>
                </motion.div>
                
                <span className="relative z-10 text-sm">{item.label}</span>
                
                {/* Subtle shine effect */}
                <motion.div
                  className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${item.color}10, transparent)`
                  }}
                  animate={isActive ? {
                    x: ['-100%', '100%']
                  } : {}}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                />
              </motion.button>
            );
          })}
        </div>
      </nav>
      
      {/* Decorative gradient at bottom */}
      <div className="h-20 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 opacity-10"
          style={{
            background: "linear-gradient(180deg, transparent, #7DD3FC, #FBCFE8, #FDE68A)"
          }}
          animate={{
            backgroundPosition: ['0% 0%', '0% 100%', '0% 0%']
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear"
          }}
        />
      </div>
    </div>
  );
}
