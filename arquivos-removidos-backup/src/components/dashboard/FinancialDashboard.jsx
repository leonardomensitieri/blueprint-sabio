import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { getFirestore, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import StockPortfolio from './StockPortfolio';
import FixedIncome from './FixedIncome';
import EmergencyFund from './EmergencyFund';
import ConsolidatedPortfolio from './ConsolidatedPortfolio';
import AutomaticIncome from './AutomaticIncome';
import WisdomMode from './WisdomMode';
import './FinancialDashboard.css';

const FinancialDashboard = () => {
  const { currentUser, hasActiveSubscription } = useAuth();
  const [activeSection, setActiveSection] = useState('automaticIncome');
  const [activeTab, setActiveTab] = useState('overview');
  
  const [portfolioData, setPortfolioData] = useState({
    stocks: [],
    fixedIncome: {
      totalValue: 0,
      annualReturn: 0,
      annualIncome: 0,
      monthlyIncome: 0
    },
    emergencyFund: {
      currentAmount: 0,
      monthlyExpenses: 0,
      recommendedAmount: 0
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Carregar dados do Firebase
    const loadPortfolioData = async () => {
      if (!currentUser) return;
      
      setIsLoading(true);
      
      try {
        const db = getFirestore();
        
        // Carregar dados de ações
        const userStocksRef = doc(db, 'portfolios', currentUser.uid);
        const userStocksDoc = await getDoc(userStocksRef);
        
        let stocks = [];
        if (userStocksDoc.exists() && userStocksDoc.data().stocks) {
          stocks = userStocksDoc.data().stocks;
        } else {
          // Dados de exemplo se não houver dados
          stocks = [
            { id: '1', ticker: 'BBAS3', quantity: 100, price: 32.50, dividendPerShare: 2.10, totalValue: 3250, expectedIncome: 210 },
            { id: '2', ticker: 'VALE3', quantity: 200, price: 68.75, dividendPerShare: 4.35, totalValue: 13750, expectedIncome: 870 },
            { id: '3', ticker: 'TASA4', quantity: 150, price: 27.30, dividendPerShare: 1.85, totalValue: 4095, expectedIncome: 277.5 }
          ];
          
          // Criar documento inicial
          await setDoc(userStocksRef, { 
            stocks,
            lastUpdated: new Date()
          });
        }
        
        // Calcular valores derivados
        stocks = stocks.map(stock => ({
          ...stock,
          totalValue: stock.price * stock.quantity,
          expectedIncome: stock.dividendPerShare * stock.quantity
        }));
        
        // Carregar dados de renda fixa
        const fixedIncomeRef = doc(db, 'fixedIncome', currentUser.uid);
        const fixedIncomeDoc = await getDoc(fixedIncomeRef);
        
        let fixedIncome = {
          totalValue: 50000,
          annualReturn: 0.085,
          annualIncome: 4250,
          monthlyIncome: 354.17
        };
        
        if (fixedIncomeDoc.exists()) {
          const data = fixedIncomeDoc.data();
          fixedIncome = {
            totalValue: data.totalValue || 0,
            annualReturn: data.annualReturn || 0,
            annualIncome: data.annualIncome || 0,
            monthlyIncome: data.monthlyIncome || 0
          };
        } else {
          // Criar documento inicial
          await setDoc(fixedIncomeRef, fixedIncome);
        }
        
        // Carregar dados de reserva de emergência
        const emergencyRef = doc(db, 'emergencyFunds', currentUser.uid);
        const emergencyDoc = await getDoc(emergencyRef);
        
        let emergencyFund = {
          currentAmount: 30000,
          monthlyExpenses: 5000,
          recommendedAmount: 30000
        };
        
        if (emergencyDoc.exists()) {
          const data = emergencyDoc.data();
          emergencyFund = {
            currentAmount: parseFloat(data.emergencyFundAmount) || 0,
            monthlyExpenses: parseFloat(data.monthlyExpenses) || 0,
            recommendedAmount: 0 // Será calculado pelo componente
          };
        }
        
        setPortfolioData({
          stocks,
          fixedIncome,
          emergencyFund
        });
        
      } catch (error) {
        console.error('Erro ao carregar dados do portfólio:', error);
        // Usar dados de exemplo em caso de erro
        setPortfolioData({
          stocks: [
            { id: '1', ticker: 'BBAS3', quantity: 100, price: 32.50, dividendPerShare: 2.10, totalValue: 3250, expectedIncome: 210 },
            { id: '2', ticker: 'VALE3', quantity: 200, price: 68.75, dividendPerShare: 4.35, totalValue: 13750, expectedIncome: 870 },
            { id: '3', ticker: 'TASA4', quantity: 150, price: 27.30, dividendPerShare: 1.85, totalValue: 4095, expectedIncome: 277.5 }
          ],
          fixedIncome: {
            totalValue: 50000,
            annualReturn: 0.085,
            annualIncome: 4250,
            monthlyIncome: 354.17
          },
          emergencyFund: {
            currentAmount: 30000,
            monthlyExpenses: 5000,
            recommendedAmount: 30000
          }
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadPortfolioData();
  }, [currentUser]);

  const handleSectionChange = (section) => {
    setActiveSection(section);
    // Reset activeTab when changing sections
    setActiveTab('overview');
  };
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  const handleStockUpdate = (updatedStocks) => {
    setPortfolioData(prev => ({
      ...prev,
      stocks: updatedStocks
    }));
    
    // Se o usuário estiver logado, atualizar também no Firestore
    if (currentUser) {
      try {
        const db = getFirestore();
        const userStocksRef = doc(db, 'portfolios', currentUser.uid);
        updateDoc(userStocksRef, {
          stocks: updatedStocks,
          lastUpdated: new Date()
        });
      } catch (error) {
        console.error('Erro ao atualizar dados no Firestore:', error);
      }
    }
  };
  
  const handleFixedIncomeUpdate = (updatedFixedIncome) => {
    setPortfolioData(prev => ({
      ...prev,
      fixedIncome: updatedFixedIncome
    }));
    
    // Atualizar no Firestore
    if (currentUser) {
      try {
        const db = getFirestore();
        const fixedIncomeRef = doc(db, 'fixedIncome', currentUser.uid);
        updateDoc(fixedIncomeRef, updatedFixedIncome);
      } catch (error) {
        console.error('Erro ao atualizar dados de renda fixa no Firestore:', error);
      }
    }
  };
  
  const handleEmergencyFundUpdate = (updatedEmergencyFund) => {
    setPortfolioData(prev => ({
      ...prev,
      emergencyFund: updatedEmergencyFund
    }));
    
    // Atualizar no Firestore
    if (currentUser) {
      try {
        const db = getFirestore();
        const emergencyRef = doc(db, 'emergencyFunds', currentUser.uid);
        updateDoc(emergencyRef, {
          emergencyFundAmount: updatedEmergencyFund.currentAmount,
          monthlyExpenses: updatedEmergencyFund.monthlyExpenses
        });
      } catch (error) {
        console.error('Erro ao atualizar dados da reserva de emergência no Firestore:', error);
      }
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando sua Máquina de Renda...</p>
        </div>
      );
    }

    switch (activeSection) {
      case 'portfolio':
        return (
          <div className="portfolio-container">
            <div className="portfolio-tabs">
              <button 
                className={`tab-btn ${activeTab === 'add' ? 'active' : ''}`} 
                onClick={() => handleTabChange('add')}
              >
                Adicionar Ativos
              </button>
              <button 
                className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`} 
                onClick={() => handleTabChange('events')}
              >
                Eventos e MDI
              </button>
              <button 
                className={`tab-btn ${activeTab === 'companies' ? 'active' : ''}`} 
                onClick={() => handleTabChange('companies')}
              >
                Minhas Empresas
              </button>
              <button 
                className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} 
                onClick={() => handleTabChange('history')}
              >
                Histórico
              </button>
              <button 
                className={`tab-btn ${activeTab === 'besst' ? 'active' : ''}`} 
                onClick={() => handleTabChange('besst')}
              >
                BESST
              </button>
              <button 
                className={`tab-btn ${activeTab === 'patrimony' ? 'active' : ''}`} 
                onClick={() => handleTabChange('patrimony')}
              >
                Patrimônio
              </button>
              <button 
                className={`tab-btn ${activeTab === 'quotes' ? 'active' : ''}`} 
                onClick={() => handleTabChange('quotes')}
              >
                Grade de Cotação
              </button>
              <button 
                className={`tab-btn ${activeTab === 'statement' ? 'active' : ''}`} 
                onClick={() => handleTabChange('statement')}
              >
                Extrato
              </button>
            </div>
            
            <div className="portfolio-content">
              {activeTab === 'add' && (
                <StockPortfolio 
                  portfolioData={portfolioData.stocks} 
                  onUpdateStocks={handleStockUpdate}
                />
              )}
              {activeTab !== 'add' && (
                <div className="coming-soon">
                  <h3>Funcionalidade em desenvolvimento</h3>
                  <p>Esta seção estará disponível em breve.</p>
                </div>
              )}
            </div>
          </div>
        );
        
      case 'consolidated':
        return <ConsolidatedPortfolio 
          stocksData={portfolioData.stocks} 
          fixedIncomeData={portfolioData.fixedIncome} 
          emergencyFundData={portfolioData.emergencyFund}
          onUpdateStocks={handleStockUpdate}
        />;
        
      case 'fixedIncome':
        return <FixedIncome 
          fixedIncomeData={portfolioData.fixedIncome}
          onUpdateFixedIncome={handleFixedIncomeUpdate}
        />;
        
      case 'emergency':
        return <EmergencyFund 
          emergencyFundData={portfolioData.emergencyFund}
          onUpdateEmergencyFund={handleEmergencyFundUpdate}
        />;
        
      case 'wisdom':
        return <WisdomMode />;
        
      case 'automaticIncome':
      default:
        return <AutomaticIncome 
          portfolioData={portfolioData.stocks}
          fixedIncomeData={portfolioData.fixedIncome}
        />;
    }
  };

  if (!hasActiveSubscription) {
    return (
      <div className="subscription-required">
        <div className="subscription-message">
          <h2>Funcionalidade Premium</h2>
          <p>A Máquina de Renda está disponível apenas para assinantes premium.</p>
          <a href="/payment" className="subscribe-button">Fazer Upgrade Agora</a>
        </div>
      </div>
    );
  }

  return (
    <div className="financial-dashboard">
      <div className="top-nav">
        <button 
          className={`nav-item ${activeSection === 'automaticIncome' ? 'active' : ''}`}
          onClick={() => handleSectionChange('automaticIncome')}
        >
          Renda Automática
        </button>
        
        <button 
          className={`nav-item ${activeSection === 'portfolio' ? 'active' : ''}`}
          onClick={() => handleSectionChange('portfolio')}
        >
          Carteira
        </button>
        
        <button 
          className={`nav-item ${activeSection === 'consolidated' ? 'active' : ''}`}
          onClick={() => handleSectionChange('consolidated')}
        >
          Visão Consolidada
        </button>
        
        <button 
          className={`nav-item ${activeSection === 'emergency' ? 'active' : ''}`}
          onClick={() => handleSectionChange('emergency')}
        >
          Reserva de Emergência
        </button>
        
        <button 
          className={`nav-item ${activeSection === 'fixedIncome' ? 'active' : ''}`}
          onClick={() => handleSectionChange('fixedIncome')}
        >
          Renda Fixa
        </button>
        
        <button 
          className={`nav-item ${activeSection === 'wisdom' ? 'active' : ''}`}
          onClick={() => handleSectionChange('wisdom')}
        >
          MSI
        </button>
      </div>
      
      <div className="dashboard-container">
        <h1>Máquina de Renda</h1>
        
        <div className="dashboard-content">
          {renderContent()}
        </div>
      </div>
      
      <div className="dashboard-footer">
        <p>
          Os cálculos e projeções são baseados nos dados fornecidos e em estimativas de mercado. 
          Valores reais podem variar. Atualize regularmente suas informações para maior precisão.
        </p>
        <p className="last-update">
          Última atualização: {new Date().toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>
      </div>
    </div>
  );
};

export default FinancialDashboard;