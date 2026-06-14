import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export function ProtectedRoute() {
  const { user } = useAuth();

  if (!user) {
    // Redirect to login page if user is not authenticated
    return <Navigate to="/login" replace />;
  }

  // Render child routes if user is authenticated
  return <Outlet />;
}
