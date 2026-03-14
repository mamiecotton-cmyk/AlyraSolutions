import React, { createContext, useContext, useState, useEffect } from "react";
import { User, UserRole } from "@workspace/api-client-react";
import { MOCK_USER, MOCK_CLIENT_USER } from "@/lib/mock-data";

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
  demoLogin: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem("alyra_token");
    const storedUser = localStorage.getItem("alyra_user");
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("alyra_user");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem("alyra_token", newToken);
    localStorage.setItem("alyra_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("alyra_token");
    localStorage.removeItem("alyra_user");
    setToken(null);
    setUser(null);
  };

  const demoLogin = (role: UserRole) => {
    const demoUser: User = role === UserRole.client ? MOCK_CLIENT_USER : { ...MOCK_USER, role };
    login("demo_token_123", demoUser);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!user, isLoading, demoLogin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
