import React from 'react';
// @ts-ignore: Module resolution issue
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import ProtectedRoute from './components/ProtectedRoute.js';

// Componentes de autenticação
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import ResetPassword from './components/auth/ResetPassword';

// Componentes de pagamento
import PaymentPage from './components/payment/PaymentPage';
import StripeCheckoutPage from './components/payment/StripeCheckoutPage';
import PaymentSuccess from './components/payment/PaymentSuccess';

// Componentes do Dashboard
import Dashboard from './components/Dashboard';
import BlueprintSabio from './BlueprintSabio';
import InvestmentChecklist from './components/dashboard/InvestmentChecklist';
import TopStocks from './components/dashboard/TopStocks';
import TutorialVideo from './components/dashboard/TutorialVideo';

// Novos componentes da fase 1
import CarteiraBrasil from './components/dashboard/CarteiraBrasil';
import DadosFundamentais from './components/admin/DadosFundamentais';

// Componentes administrativos
import AdminSetup from './components/admin/AdminSetup';
import BypassLogin from './components/admin/BypassLogin';
import SetupDatabase from './components/admin/SetupDatabase';
import FirebaseTest from './components/admin/FirebaseTest';

// Estilos globais
import './styles/main.css';
import './styles/dashboard.css';

// Inicializar Mock API em desenvolvimento (opcional)
if (process.env.NODE_ENV === 'development') {
  import('./config/mockApi').then(({ initMockApi }) => {
    initMockApi();
  });
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Rota inicial */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Rotas de autenticação */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Rota de acesso direto para o administrador (leonardomensitierii@gmail.com) */}
          <Route path="/admin-login" element={<BypassLogin />} />
          
          {/* Rotas de pagamento */}
          <Route
            path="/payment"
            element={
              <ProtectedRoute 
                requireAuth={true}
                requireSubscription={false}
                redirectTo="/login"
              />
            }
          >
            {/* Página de pagamento original */}
            <Route index element={<PaymentPage />} />
          </Route>
          
          {/* Nova rota para o Stripe Checkout */}
          <Route
            path="/checkout"
            element={
              <ProtectedRoute 
                requireAuth={true}
                requireSubscription={false}
                redirectTo="/login"
              />
            }
          >
            <Route index element={<StripeCheckoutPage />} />
          </Route>
          
          {/* Rota para página de pagamento bem-sucedido */}
          <Route
            path="/payment-success"
            element={
              <ProtectedRoute 
                requireAuth={true}
                requireSubscription={false}
                redirectTo="/login"
              />
            }
          >
            <Route index element={<PaymentSuccess />} />
          </Route>
          
          {/* Rotas protegidas do dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute 
                requireAuth={true}
                requireSubscription={true}
                allowTrialAccess={true}
                redirectTo="/login"
              />
            }
          >
            <Route element={<Dashboard />}>
              <Route index element={<BlueprintSabio />} />
              <Route path="checklist" element={<InvestmentChecklist />} />
              <Route path="top-stocks" element={<TopStocks stocks={[]} />} />
              <Route path="tutorials" element={<TutorialVideo />} />
              <Route path="account" element={<div>Minha Conta</div>} />
              {/* Nova rota para a Carteira de Ações da fase 1 */}
              <Route path="carteira" element={<CarteiraBrasil />} />
            </Route>
          </Route>
          
          {/* Rota para configuração de administrador */}
          <Route
            path="/admin-setup"
            element={
              <ProtectedRoute 
                requireAuth={true}
                requireSubscription={false}
                redirectTo="/login"
              />
            }
          >
            <Route index element={<AdminSetup />} />
          </Route>
          
          {/* Nova rota para administração de dados fundamentais */}
          <Route
            path="/admin/fundamentos"
            element={
              <ProtectedRoute 
                requireAuth={true}
                requireAdmin={true}
                redirectTo="/login"
              />
            }
          >
            <Route index element={<DadosFundamentais />} />
          </Route>
          
          {/* Nova rota para configuração do banco de dados */}
          <Route
            path="/admin/setup"
            element={
              <ProtectedRoute 
                requireAuth={true}
                redirectTo="/login"
              />
            }
          >
            <Route index element={<SetupDatabase />} />
          </Route>
          
          {/* Nova rota para teste do Firebase */}
          <Route
            path="/admin/firebase-test"
            element={
              <Navigate to="/admin/firebase-test/index" />
            }
          />
          <Route
            path="/admin/firebase-test/*"
            element={
              <ProtectedRoute 
                requireAuth={true}
                redirectTo="/login"
              />
            }
          >
            <Route index element={<FirebaseTest />} />
          </Route>
          
          {/* Rota para qualquer caminho não reconhecido */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;