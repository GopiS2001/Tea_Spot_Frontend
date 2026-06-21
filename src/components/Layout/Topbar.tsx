import { Bell, Search, ChevronDown, Plus, IndianRupee, ShoppingCart, User as UserIcon, Settings as SettingsIcon, LogOut, Sun, Moon, MapPin } from "lucide-react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useCart } from "../Cart/CartContext";
import { useAuth } from "../Auth/AuthContext";
import { useTheme } from "../Theme/ThemeContext";
import { useBranch } from "../Branches/BranchContext";

interface TopbarProps {
  onQuickAction: (action: string) => void;
  onNavigateToPOS: () => void;
  onNavigate?: (view: string) => void;
}

export function Topbar({ onQuickAction, onNavigateToPOS, onNavigate }: TopbarProps) {
  const { getCartCount } = useCart();
  const { user, logout, isSuperAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { branches, selectedBranchId, setSelectedBranchId } = useBranch();
  const cartCount = getCartCount();

  const currentBranchName =
    branches.find((b) => b._id === selectedBranchId)?.name ||
    user?.branchName ||
    "All Branches";

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="h-20 shrink-0 backdrop-blur-xl border-b border-border/50 z-10 flex items-center pl-6 pr-3 gap-6 shadow-sm" style={{ backgroundColor: 'var(--topbar-panel-bg)' }}>
      {isSuperAdmin ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <div className="text-left">
                <div className="text-sm">{currentBranchName}</div>
                <div className="text-xs text-muted-foreground">
                  {selectedBranchId ? "Filtered" : "Showing all branches"}
                </div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel>Select Branch</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSelectedBranchId(null)}>
              <div>
                <div>All Branches</div>
                <div className="text-xs text-muted-foreground">View data across every branch</div>
              </div>
            </DropdownMenuItem>
            {branches.map((b) => (
              <DropdownMenuItem
                key={b._id}
                onClick={() => setSelectedBranchId(b._id)}
              >
                <div>
                  <div>{b.name}</div>
                  {b.city && (
                    <div className="text-xs text-muted-foreground">{b.city}</div>
                  )}
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <div className="text-left">
            <div className="text-sm">{user?.branchName || "—"}</div>
            <div className="text-xs text-muted-foreground capitalize">
              {user?.role || ""}
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-2xl relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search orders, menu items..."
          className="pl-10 bg-input-background border-0"
        />
      </div>

      <div className="flex items-center gap-3 ml-auto">
        <Button
          variant="default"
          className="gap-2 bg-[#7DD3FC] hover:bg-[#7DD3FC]/90 text-black"
          onClick={() => onQuickAction("new-order")}
        >
          <Plus className="w-4 h-4" />
          New Order
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={() => onQuickAction("open-drawer")}
        >
          <IndianRupee className="w-4 h-4" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          className="relative"
          onClick={onNavigateToPOS}
        >
          <ShoppingCart className="w-4 h-4" />
          {cartCount > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center bg-[#7DD3FC] text-black text-xs">
              {cartCount}
            </Badge>
          )}
        </Button>

        <Button variant="outline" size="icon" onClick={toggleTheme} title={theme === "dark" ? "Switch to Light" : "Switch to Dark"}>
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>

        <Button variant="outline" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <Badge className="absolute -top-1 -right-1 w-5 h-5 rounded-full p-0 flex items-center justify-center bg-[#FBCFE8] text-black text-xs">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src={user?.avatar} alt={user?.display_name} />
                <AvatarFallback className="bg-gradient-to-br from-[#7DD3FC] to-[#FBCFE8] text-white">
                  {user?.display_name?.charAt(0).toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="text-sm">{user?.display_name || 'User'}</div>
                <div className="text-xs text-muted-foreground capitalize">{user?.role || 'Staff'}</div>
              </div>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate?.('profile')}>
              <UserIcon className="w-4 h-4 mr-2" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate?.('settings')}>
              <SettingsIcon className="w-4 h-4 mr-2" />
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
