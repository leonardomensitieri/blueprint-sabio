import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';

/**
 * Componente que protege rotas com base no estado de autenticação e assinatura
 * 
 * @param {Object} props - Propriedades do componente
 * @param {boolean} props.requireAuth - Se a rota requer autenticação
 * @param {boolean} props.requireSubscription - Se a rota requer assinatura ativa
 * @param {string} props.redirectTo - Rota para redirecionamento caso não tenha permissão
 */
const ProtectedRoute = ({ 
  requireAuth = true,
  requireSubscription = false,
  allowTrialAccess = false,
  redirectTo = '/login'
}) => {
  const { 
    currentUser, 
    hasActiveSubscription, 
    isInTrialPeriod, 
    loading, 
    isAdminUser 
  } = useAuth();

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
  
  console.log("ProtectedRoute.js - isAdminUser:", isAdminUser);
  
  // Verificar se há marcador de sessão de administrador
  const hasAdminMarker = sessionStorage.getItem('adminAccess') === 'true';
  console.log("ProtectedRoute.js - hasAdminMarker:", hasAdminMarker);
  
  // Administrador tem acesso direto
  if (isAdminUser || hasAdminMarker || 
      currentUser?.email === "leonardomensitierii@gmail.com" || 
      currentUser?.email === "teste@exemplo.com") {
    console.log("ProtectedRoute.js - usuário é admin ou tem marcador de admin, permitindo acesso");
    console.log("ProtectedRoute.js - Email do usuário:", currentUser?.email);
    return <Outlet />;
  }
  
  // Verifica se o usuário tem assinatura ativa quando necessário
  if (requireSubscription && !hasActiveSubscription) {
    console.log("ProtectedRoute.js - verificando requisito de assinatura");
    console.log("ProtectedRoute.js - hasActiveSubscription:", hasActiveSubscription);
    console.log("ProtectedRoute.js - isInTrialPeriod:", isInTrialPeriod);
    console.log("ProtectedRoute.js - allowTrialAccess:", allowTrialAccess);
    
    // Se permitir acesso durante o período de teste e o usuário está em período de teste
    if (allowTrialAccess && isInTrialPeriod) {
      console.log("ProtectedRoute.js - permitindo acesso pelo período de teste");
      return <Outlet />;
    }
    // Caso contrário, redireciona para a página de pagamento
    console.log("ProtectedRoute.js - redirecionando para pagamento");
    return <Navigate to="/payment" />;
  }

  // Se passou por todas as verificações, renderiza o conteúdo protegido
  return <Outlet />;
};

export default ProtectedRoute;