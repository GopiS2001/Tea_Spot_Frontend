import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

type Role = "super_admin" | "admin" | "staff" | string;

interface User {
  id: string;
  username: string;
  role: Role;
  display_name: string;
  avatar: string;
  branchId: string | null;
  branchName: string | null;
}

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (
    display_name: string,
    avatar?: string,
  ) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const mapUser = (apiUser: any): User => ({
  id: apiUser.id || apiUser._id,
  username: apiUser.email,
  role: apiUser.role,
  display_name: apiUser.name,
  avatar: apiUser.avatar || "",
  branchId: apiUser.branchId ?? null,
  branchName: apiUser.branchName ?? null,
});

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("accessToken");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      setAccessToken(storedToken);
      setUser(JSON.parse(storedUser));

      // Verify token is still valid
      verifyToken(storedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const mappedUser = mapUser(data);
        setUser(mappedUser);
        localStorage.setItem("user", JSON.stringify(mappedUser));
      } else {
        // Token invalid, clear auth
        logout();
      }
    } catch (error) {
      console.error("Token verification failed:", error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email: username, password }),
    });

    if (!response.ok) {
      let errorMsg = "Login failed";
      try {
        const errBody = await response.json();
        errorMsg = errBody.message || errorMsg;
      } catch (e) {
        // ignore json parse errors
      }
      throw new Error(errorMsg);
    }

    const data = await response.json();
    if (!data || !data.token || !data.user) {
      throw new Error("Invalid response from authentication server.");
    }

    const mappedUser = mapUser(data.user);

    setAccessToken(data.token);
    setUser(mappedUser);

    localStorage.setItem("accessToken", data.token);
    localStorage.setItem("user", JSON.stringify(mappedUser));
  };

  const logout = async () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    localStorage.removeItem("selectedBranchId");
  };

  const updateProfile = async (
    display_name: string,
    avatar?: string,
  ) => {
    if (!user) return;

    const updatedUser: User = {
      ...user,
      display_name,
      avatar: avatar ?? user.avatar,
    };

    setUser(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin" || isSuperAdmin;
  const isStaff = user?.role === "staff";

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!user,
        isLoading,
        isSuperAdmin,
        isAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error(
      "useAuth must be used within an AuthProvider",
    );
  }
  return context;
}
