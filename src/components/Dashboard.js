import React, { useState, useEffect, lazy, Suspense } from 'react';
import { useNavigate, Outlet, Link, Routes, Route } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import StockPortfolio from './dashboard/StockPortfolio';
import './Dashboard.css';

// Lazy load dos componentes administrativos
const AdminTools = lazy(() => import('../admin/AdminTools'));

const Dashboard = () => {
  const { currentUser, userProfile, logout, hasActiveSubscription, isInTrialPeriod, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('carteira');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const navigate = useNavigate();
  
  // Log para diagnóstico
  console.log('Dashboard renderizado - isAdmin:', isAdmin);

  useEffect(() => {
    // Definir aba ativa com base na URL atual
    const path = window.location.pathname;
    if (path === '/dashboard') setActiveTab('carteira');
    else if (path === '/dashboard/analise') setActiveTab('stocks');
    else if (path === '/dashboard/checklist') setActiveTab('checklist');
    else if (path === '/dashboard/top-stocks') setActiveTab('top-stocks');
    else if (path === '/dashboard/tutorials') setActiveTab('tutorials');
    else if (path === '/dashboard/account') setActiveTab('account');
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    
    switch (tab) {
      case 'carteira':
        navigate('/dashboard');
        break;
      case 'stocks':
        navigate('/dashboard/analise');
        break;
      case 'checklist':
        navigate('/dashboard/checklist');
        break;
      case 'top-stocks':
        navigate('/dashboard/top-stocks');
        break;
      case 'tutorials':
        navigate('/dashboard/tutorials');
        break;
      case 'account':
        navigate('/dashboard/account');
        break;
      default:
        navigate('/dashboard');
    }
  };

  return (
    <div className="dashboard-layout">
      {/* Header */}
      <header className="dashboard-header">
        <div className="logo">
          <Link to="/dashboard">
            <h1>Blueprint Sábio</h1>
          </Link>
        </div>
        
        <div className="header-actions">
          {/* Período de teste temporariamente desabilitado para resolver problemas de acesso */}
          {false && (isInTrialPeriod && !hasActiveSubscription) && (
            <div className="trial-badge">
              <span>Período de Teste: {trialDaysLeft} dias restantes</span>
              <Link to="/payment" className="upgrade-btn">Fazer Upgrade</Link>
            </div>
          )}
          
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{userProfile?.name || currentUser?.email}</span>
              <span className="user-status">
                {hasActiveSubscription 
                  ? <span className="status-premium">Assinante Premium</span> 
                  : isInTrialPeriod 
                    ? <span className="status-trial">Período de Teste</span>
                    : <span className="status-free">Acesso Limitado</span>
                }
              </span>
            </div>
            
            <button className="logout-btn" onClick={handleLogout}>
              <i className="logout-icon">←</i>
              <span>Sair</span>
            </button>
          </div>
          
          <button 
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <span className="menu-icon">☰</span>
          </button>
        </div>
      </header>
      
      {/* Sidebar */}
      <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <nav className="sidebar-nav">
          <ul>
            <li 
              className={activeTab === 'carteira' ? 'active' : ''}
              onClick={() => handleTabChange('carteira')}
            >
              <i className="nav-icon">💰</i>
              <span>Carteira de Ações</span>
            </li>
            <li 
              className={activeTab === 'stocks' ? 'active' : ''}
              onClick={() => handleTabChange('stocks')}
            >
              <i className="nav-icon">📊</i>
              <span>Análise de Ações</span>
            </li>
            <li 
              className={activeTab === 'checklist' ? 'active' : ''}
              onClick={() => handleTabChange('checklist')}
            >
              <i className="nav-icon">✓</i>
              <span>Checklist de Investimento</span>
            </li>
            <li 
              className={activeTab === 'top-stocks' ? 'active' : ''}
              onClick={() => handleTabChange('top-stocks')}
            >
              <i className="nav-icon">⭐</i>
              <span>Top Recomendações</span>
            </li>
            <li 
              className={activeTab === 'tutorials' ? 'active' : ''}
              onClick={() => handleTabChange('tutorials')}
            >
              <i className="nav-icon">🎓</i>
              <span>Tutoriais</span>
            </li>
            <li 
              className={activeTab === 'account' ? 'active' : ''}
              onClick={() => handleTabChange('account')}
            >
              <i className="nav-icon">👤</i>
              <span>Minha Conta</span>
            </li>
            
            {/* Sempre mostrar opções de administrador para diagnóstico */}
            <li 
              className="admin-option"
              onClick={() => navigate('/admin/fundamentos')}
            >
              <i className="nav-icon">⚙️</i>
              <span>Dados Fundamentais</span>
            </li>
            <li 
              className="admin-option"
              onClick={() => navigate('/admin/tools')}
            >
              <i className="nav-icon">🔧</i>
              <span>Ferramentas Admin</span>
            </li>
          </ul>
        </nav>
        
        {/* Banner de upgrade temporariamente desabilitado para resolver problemas de acesso */}
        {false && !hasActiveSubscription && (
          <div className="sidebar-upgrade">
            <h3>Acesso Premium</h3>
            <p>Desbloqueie todos os recursos com nossa assinatura premium.</p>
            <Link to="/payment" className="upgrade-btn-full">Fazer Upgrade</Link>
          </div>
        )}
      </aside>
      
      {/* Main Content - Router */}
      <main className="dashboard-content">
        <Routes>
          <Route path="/" element={<StockPortfolio />} />
          <Route path="/analise" element={<div>Análise de Ações (Em desenvolvimento)</div>} />
          <Route path="/checklist" element={<div>Checklist de Investimento (Em desenvolvimento)</div>} />
          <Route path="/top-stocks" element={<div>Top Recomendações (Em desenvolvimento)</div>} />
          <Route path="/tutorials" element={<div>Tutoriais (Em desenvolvimento)</div>} />
          <Route path="/account" element={<div>Minha Conta (Em desenvolvimento)</div>} />
          {/* Sempre mostrar rotas de administrador para diagnóstico */}
          <Route path="/admin/tools" element={
            <Suspense fallback={<div>Carregando ferramentas de administração...</div>}>
              <AdminTools />
            </Suspense>
          } />
          <Route path="/admin/fundamentos" element={<div>Gerenciamento de Dados Fundamentais (Em desenvolvimento)</div>} />
        </Routes>
      </main>
      
      {/* Footer */}
      <footer className="dashboard-footer">
        <p>&copy; 2025 Blueprint Sábio - Todos os direitos reservados</p>
        <div className="footer-links">
          <a href="/termos">Termos de Uso</a>
          <a href="/privacidade">Política de Privacidade</a>
          <a href="/contato">Contato</a>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;