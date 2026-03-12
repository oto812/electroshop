import { useAuth } from "@/context/AuthContext";
import { Navigate } from "react-router-dom";



export function AdminRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, user } = useAuth();

    if(!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }
    if(!user?.isAdmin){
        return <Navigate to="/" replace />;
    }
    
    return <>{children}</>;
}