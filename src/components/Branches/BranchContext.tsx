import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { apiFetch } from "../../utils/api";
import { useAuth } from "../Auth/AuthContext";

export interface Branch {
  _id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

interface BranchContextType {
  branches: Branch[];
  // null = "All Branches" (super_admin only)
  selectedBranchId: string | null;
  setSelectedBranchId: (id: string | null) => void;
  refreshBranches: () => Promise<void>;
  isLoading: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const STORAGE_KEY = "selectedBranchId";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const { user, accessToken, isAuthenticated, isSuperAdmin } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchIdState] = useState<string | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const refreshBranches = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const data = await apiFetch("/branches", accessToken);
      setBranches(data?.branches || []);
    } catch (err) {
      console.error("Failed to load branches:", err);
      setBranches([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  // Fetch the branch list once the user is logged in.
  useEffect(() => {
    if (isAuthenticated && accessToken) {
      refreshBranches();
    } else {
      setBranches([]);
    }
  }, [isAuthenticated, accessToken, refreshBranches]);

  // Initialise the selected branch:
  // - super_admin: restore last choice from localStorage, else null (All)
  // - admin/staff: always pinned to their own branch
  useEffect(() => {
    if (!user) {
      setSelectedBranchIdState(null);
      return;
    }
    if (isSuperAdmin) {
      const stored = localStorage.getItem(STORAGE_KEY);
      setSelectedBranchIdState(stored || null);
    } else {
      setSelectedBranchIdState(user.branchId || null);
    }
  }, [user?.id, isSuperAdmin, user?.branchId]);

  const setSelectedBranchId = (id: string | null) => {
    // Non-super_admin users can't switch branches.
    if (!isSuperAdmin) return;
    setSelectedBranchIdState(id);
    if (id) {
      localStorage.setItem(STORAGE_KEY, id);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <BranchContext.Provider
      value={{
        branches,
        selectedBranchId,
        setSelectedBranchId,
        refreshBranches,
        isLoading,
      }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) throw new Error("useBranch must be used within a BranchProvider");
  return ctx;
}
