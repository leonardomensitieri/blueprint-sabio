import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';

interface ProtectedRouteProps {
  requireAuth?: boolean;
  requireSubscription?: boolean;
  allowTrialAccess?: boolean;
  requireAdmin?: boolean;
  redirectTo?: string;
}

/**
 * Componente que protege rotas com base no estado de autenticação e assinatura
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  requireAuth = true,
  requireSubscription = false,
  allowTrialAccess = false,
  requireAdmin = false,
  redirectTo = '/login'
}) => {
  const { currentUser, hasActiveSubscription, isInTrialPeriod, loading, isAdminUser } = useAuth();

  // Se ainda está carregando, mostra tela de loading
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-icon">
          <div className="spinner"></div>
        </div>
        <p>Carregando...</p>
      </div>
    );
  }

  // Verifica se o usuário está autenticado quando necessário
  if (requireAuth && !currentUser) {
    return <Navigate to={redirectTo} />;
  }

  // Verifica se o usuário é administrador quando necessário
  if (requireAdmin && !isAdminUser) {
    console.log("ProtectedRoute - usuário não é admin, redirecionando");
    return <Navigate to="/dashboard" />;
  }
  
  // Verifica se o usuário tem assinatura ativa quando necessário
  if (requireSubscription && !hasActiveSubscription && !isAdminUser) {
    console.log("ProtectedRoute - verificando requisito de assinatura");
    console.log("ProtectedRoute - hasActiveSubscription:", hasActiveSubscription);
    console.log("ProtectedRoute - isInTrialPeriod:", isInTrialPeriod);
    console.log("ProtectedRoute - allowTrialAccess:", allowTrialAccess);
    
    // Se permitir acesso durante o período de teste e o usuário está em período de teste
    if (allowTrialAccess && isInTrialPeriod) {
      console.log("ProtectedRoute - permitindo acesso pelo período de teste");
      return <Outlet />;
    }
    // Caso contrário, redireciona para a página de pagamento
    console.log("ProtectedRoute - redirecionando para pagamento");
    return <Navigate to="/payment" />;
  }

  // Se passou por todas as verificações, renderiza o conteúdo protegido
  return <Outlet />;
};

export default ProtectedRoute;