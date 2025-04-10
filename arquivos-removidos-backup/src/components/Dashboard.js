import React, { useState, useEffect } from 'react';
import { useNavigate, Outlet, Link } from 'react-router-dom';
import { useAuth } from './auth/AuthProvider';
import { checkActiveTrial } from '../firebase/db';
import './Dashboard.css';

const Dashboard = () => {
  const { currentUser, userData, logout, hasActiveSubscription, isInTrialPeriod, isAdminUser } = useAuth();
  const [activeTab, setActiveTab] = useState('stocks');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Calcular dias restantes do período de teste
    const calculateTrialDaysLeft = async () => {
      if (currentUser && isInTrialPeriod) {
        try {
          const userRef = await checkActiveTrial(currentUser.uid, 7);
          if (userRef && userRef.data) {
            const createdAt = userRef.data.createdAt.toDate();
            const trialEnd = new Date(createdAt);
            trialEnd.setDate(trialEnd.getDate() + 7);
            
            const now = new Date();
            const diffTime = Math.abs(trialEnd - now);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            setTrialDaysLeft(diffDays);
          }
        } catch (error) {
          console.error('Erro ao calcular dias de teste:', error);
          setTrialDaysLeft(0);
        }
      }
    };
    
    calculateTrialDaysLeft();
  }, [currentUser, isInTrialPeriod]);

  useEffect(() => {
    // Definir aba ativa com base na URL atual
    const path = window.location.pathname;
    if (path === '/dashboard') setActiveTab('stocks');
    else if (path === '/dashboard/checklist') setActiveTab('checklist');
    else if (path === '/dashboard/top-stocks') setActiveTab('top-stocks');
    else if (path === '/dashboard/tutorials') setActiveTab('tutorials');
    else if (path === '/dashboard/account') setActiveTab('account');
    else if (path === '/dashboard/carteira') setActiveTab('carteira');
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
      case 'stocks':
        navigate('/dashboard');
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
      case 'carteira':
        navigate('/dashboard/carteira');
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
          {(isInTrialPeriod && !hasActiveSubscription) && (
            <div className="trial-badge">
              <span>Período de Teste: {trialDaysLeft} dias restantes</span>
              <Link to="/payment" className="upgrade-btn">Fazer Upgrade</Link>
            </div>
          )}
          
          <div className="user-menu">
            <div className="user-info">
              <span className="user-name">{userData?.name || currentUser?.email}</span>
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
            
            {isAdminUser && (
              <li 
                className="admin-option"
                onClick={() => navigate('/admin/fundamentos')}
              >
                <i className="nav-icon">⚙️</i>
                <span>Dados Fundamentais</span>
              </li>
            )}
          </ul>
        </nav>
        
        {!hasActiveSubscription && (
          <div className="sidebar-upgrade">
            <h3>Acesso Premium</h3>
            <p>Desbloqueie todos os recursos com nossa assinatura premium.</p>
            <Link to="/payment" className="upgrade-btn-full">Fazer Upgrade</Link>
          </div>
        )}
      </aside>
      
      {/* Main Content */}
      <main className="dashboard-content">
        <Outlet />
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