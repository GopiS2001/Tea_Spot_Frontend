import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../utils/api";
import { useAuth } from "../components/Auth/AuthContext";
import { useBranch } from "../components/Branches/BranchContext";

// apiFetch silently appends the Topbar-selected branch as ?branchId= for
// super_admin (see appendBranchScope in utils/api.ts). React Query has no way
// to know that, so branch-scoped hooks must fold selectedBranchId into their
// queryKey themselves or a branch switch won't trigger a refetch.

const qs = (params?: Record<string, string | number | undefined | null>) => {
  if (!params) return "";
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    usp.set(key, String(value));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
};

// ---------------- MENU ----------------

export const useMenu = (params?: { search?: string; category?: string }) => {
  const { accessToken } = useAuth();
  // Menu is a shared catalog — not scoped to the selected branch.
  return useQuery({
    queryKey: ["menu", params?.search || "", params?.category || "all"],
    queryFn: () =>
      apiFetch(
        `/menu${qs({
          search: params?.search,
          category: params?.category && params.category !== "all" && params.category !== "All" ? params.category : undefined,
        })}`,
        accessToken
      ),
    enabled: !!accessToken,
  });
};

export const useCreateMenuItem = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/menu", accessToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
};

export const useUpdateMenuItem = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/menu/${id}`, accessToken, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
};

export const useDeleteMenuItem = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/menu/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["menu"] }),
  });
};

// ---------------- CATEGORIES ----------------

export const useCategories = () => {
  const { accessToken } = useAuth();
  // Categories are a shared catalog — not scoped to the selected branch.
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => apiFetch("/categories", accessToken),
    enabled: !!accessToken,
  });
};

export const useCreateCategory = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/categories", accessToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useUpdateCategory = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/categories/${id}`, accessToken, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

export const useDeleteCategory = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/categories/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["categories"] });
      qc.invalidateQueries({ queryKey: ["menu"] });
    },
  });
};

// ---------------- ORDERS ----------------

export interface OrderFilters {
  search?: string;
  status?: string;
  orderType?: string;
  paymentMethod?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export const useOrders = (filters: OrderFilters) => {
  const { accessToken } = useAuth();
  const { selectedBranchId } = useBranch();
  return useQuery({
    queryKey: ["orders", filters, selectedBranchId],
    queryFn: () =>
      apiFetch(
        `/orders${qs({
          search: filters.search,
          status: filters.status !== "all" ? filters.status : undefined,
          orderType: filters.orderType !== "all" ? filters.orderType : undefined,
          paymentMethod: filters.paymentMethod !== "all" ? filters.paymentMethod : undefined,
          startDate: filters.startDate,
          endDate: filters.endDate,
          page: filters.page,
          limit: filters.limit,
        })}`,
        accessToken
      ),
    enabled: !!accessToken,
    placeholderData: (prev) => prev, // keep showing old page while the next page loads
  });
};

export const useCreateOrder = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/orders", accessToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["orders"] }),
  });
};

// ---------------- INVENTORY ----------------

export const useInventory = (params?: { type?: string; search?: string }) => {
  const { accessToken } = useAuth();
  const { selectedBranchId } = useBranch();
  return useQuery({
    queryKey: ["inventory", params?.type || "all", params?.search || "", selectedBranchId],
    queryFn: () =>
      apiFetch(
        `/inventory${qs({
          type: params?.type !== "all" ? params?.type : undefined,
          search: params?.search,
        })}`,
        accessToken
      ),
    enabled: !!accessToken,
  });
};

export const useLowStockAlerts = () => {
  const { accessToken } = useAuth();
  const { selectedBranchId } = useBranch();
  return useQuery({
    queryKey: ["inventory", "alerts", selectedBranchId],
    queryFn: () => apiFetch("/inventory/alerts", accessToken),
    enabled: !!accessToken,
  });
};

export const useCreateInventoryItem = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/inventory", accessToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
};

export const useUpdateInventoryItem = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/inventory/${id}`, accessToken, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
};

export const useDeleteInventoryItem = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/inventory/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inventory"] }),
  });
};

export const useStockIn = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason?: string }) =>
      apiFetch(`/inventory/${id}/stock-in`, accessToken, {
        method: "POST",
        body: JSON.stringify({ qty, reason }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory", "history", variables.id] });
    },
  });
};

export const useStockOut = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, qty, reason }: { id: string; qty: number; reason?: string }) =>
      apiFetch(`/inventory/${id}/stock-out`, accessToken, {
        method: "POST",
        body: JSON.stringify({ qty, reason }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory", "history", variables.id] });
    },
  });
};

export const useStockAdjust = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, newQty, reason }: { id: string; newQty: number; reason?: string }) =>
      apiFetch(`/inventory/${id}/adjust`, accessToken, {
        method: "POST",
        body: JSON.stringify({ newQty, reason }),
      }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["inventory", "history", variables.id] });
    },
  });
};

export const useStockHistory = (itemId: string | null, page = 1, limit = 20) => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["inventory", "history", itemId, page, limit],
    queryFn: () =>
      apiFetch(`/inventory/${itemId}/history${qs({ page, limit })}`, accessToken),
    enabled: !!accessToken && !!itemId,
  });
};

// ---------------- SPECIAL ORDERS ----------------

export interface SpecialOrderFilters {
  status?: string;
  paymentStatus?: string;
  upcoming?: boolean;
  today?: boolean;
}

export const useSpecialOrders = (filters: SpecialOrderFilters = {}) => {
  const { accessToken } = useAuth();
  const { selectedBranchId } = useBranch();
  return useQuery({
    queryKey: ["specialOrders", filters, selectedBranchId],
    queryFn: () =>
      apiFetch(
        `/special-orders${qs({
          status: filters.status && filters.status !== "all" ? filters.status : undefined,
          paymentStatus:
            filters.paymentStatus && filters.paymentStatus !== "all"
              ? filters.paymentStatus
              : undefined,
          upcoming: filters.upcoming ? "true" : undefined,
          today: filters.today ? "true" : undefined,
        })}`,
        accessToken
      ),
    enabled: !!accessToken,
  });
};

export const useCreateSpecialOrder = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/special-orders", accessToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specialOrders"] }),
  });
};

export const useUpdateSpecialOrder = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/special-orders/${id}`, accessToken, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specialOrders"] }),
  });
};

export const useUpdateSpecialOrderStatus = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiFetch(`/special-orders/${id}/status`, accessToken, {
        method: "PUT",
        body: JSON.stringify({ status }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specialOrders"] }),
  });
};

export const useCollectBalance = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/special-orders/${id}/collect-balance`, accessToken, { method: "PUT" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specialOrders"] }),
  });
};

export const useDeleteSpecialOrder = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/special-orders/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["specialOrders"] }),
  });
};

// ---------------- SETTINGS ----------------

export const useSettings = () => {
  const { accessToken } = useAuth();
  const { selectedBranchId } = useBranch();
  return useQuery({
    // Settings are per-branch; refetch when the active branch changes.
    queryKey: ["settings", selectedBranchId],
    queryFn: () => apiFetch("/settings", accessToken),
    enabled: !!accessToken,
  });
};

export const useUpdateSettings = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/settings", accessToken, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["settings"] }),
  });
};

// ---------------- USERS ----------------

export const useUsers = (params?: { search?: string; role?: string; branchId?: string }) => {
  const { accessToken } = useAuth();
  // Users is a cross-branch admin screen with its own branch filter, so it is
  // NOT scoped by the Topbar-selected branch (scopeBranch: false below).
  return useQuery({
    queryKey: [
      "users",
      params?.search || "",
      params?.role || "all",
      params?.branchId || "all",
    ],
    queryFn: () =>
      apiFetch(
        `/users${qs({
          search: params?.search,
          role: params?.role !== "all" ? params?.role : undefined,
          branchId: params?.branchId !== "all" ? params?.branchId : undefined,
        })}`,
        accessToken,
        undefined,
        false
      ),
    enabled: !!accessToken,
  });
};

export const useCreateUser = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/users", accessToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useUpdateUser = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/users/${id}`, accessToken, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

export const useDeleteUser = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiFetch(`/users/${id}`, accessToken, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
};

// ---------------- BRANCHES ----------------

export const useBranches = () => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["branches"],
    queryFn: () => apiFetch("/branches", accessToken),
    enabled: !!accessToken,
  });
};

export const useCreateBranch = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) =>
      apiFetch("/branches", accessToken, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
};

export const useUpdateBranch = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      apiFetch(`/branches/${id}`, accessToken, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["branches"] }),
  });
};

// ---------------- ROLES (sidebar/screen permissions) ----------------

export const useRoles = () => {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch("/roles", accessToken),
    enabled: !!accessToken,
    // Permission edits are infrequent; keep them cached a while.
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateRole = () => {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roleName, permissions }: { roleName: string; permissions: Record<string, boolean> }) =>
      apiFetch(`/roles/${roleName}`, accessToken, {
        method: "PUT",
        body: JSON.stringify({ permissions }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["roles"] }),
  });
};
