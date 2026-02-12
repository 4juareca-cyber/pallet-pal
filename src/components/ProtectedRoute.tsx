import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/useAppStore';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const operarioActual = useAppStore((s) => s.operarioActual);
  if (!operarioActual) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

export default ProtectedRoute;
