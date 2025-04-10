import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { fetchStockData, fetchStockPrice } from '../../services/financialAPI';
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { saveAs } from 'file-saver';
import './StockPortfolio.css';

const StockPortfolio = ({ portfolioData, onUpdateStocks }) => {
  const { currentUser } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [newStock, setNewStock] = useState({ ticker: '', quantity: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [error, setError] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'ticker', direction: 'ascending' });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Load user portfolio with useCallback to avoid recreation on each render
  const loadUserPortfolio = useCallback(async () => {
    if (!currentUser) return;
    
    // Use portfolio data if passed as prop
    if (portfolioData && portfolioData.length > 0) {
      setStocks(portfolioData);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    try {
      const db = getFirestore();
      const userStocksRef = doc(db, 'portfolios', currentUser.uid);
      const userStocksDoc = await getDoc(userStocksRef);
      
      let portfolioStocks = [];
      if (userStocksDoc.exists() && userStocksDoc.data().stocks) {
        portfolioStocks = userStocksDoc.data().stocks;
      } else {
        // Use example data for new users
        portfolioStocks = [
          { id: '1', ticker: 'PETR4', quantity: 100, price: 32.50, dividendPerShare: 2.10 },
          { id: '2', ticker: 'VALE3', quantity: 200, price: 68.75, dividendPerShare: 4.35 }
        ];
        
        // Create initial document for the user
        await setDoc(userStocksRef, {
          stocks: portfolioStocks,
          lastUpdated: new Date()
        });
      }
      
      // Update current prices and calculate derived values
      const updatedPortfolio = await Promise.all(
        portfolioStocks.map(async (stock) => {
          try {
            const currentPrice = await fetchStockPrice(stock.ticker);
            return {
              ...stock,
              price: currentPrice || stock.price,
              totalValue: (currentPrice || stock.price) * stock.quantity,
              expectedIncome: stock.dividendPerShare * stock.quantity,
              dividendYield: ((stock.dividendPerShare / (currentPrice || stock.price)) * 100).toFixed(2)
            };
          } catch (error) {
            console.error(`Error fetching price for ${stock.ticker}:`, error);
            return {
              ...stock,
              totalValue: stock.price * stock.quantity,
              expectedIncome: stock.dividendPerShare * stock.quantity,
              dividendYield: ((stock.dividendPerShare / stock.price) * 100).toFixed(2)
            };
          }
        })
      );
      
      setStocks(updatedPortfolio);
      
      // Update parent component's state if callback provided
      if (onUpdateStocks) {
        onUpdateStocks(updatedPortfolio);
      }
    } catch (error) {
      console.error('Error loading portfolio:', error);
      setError('Não foi possível carregar sua carteira de ações.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, portfolioData, onUpdateStocks]);

  const handleAddStock = async (e) => {
    e.preventDefault();
    
    if (!newStock.ticker || !newStock.quantity) {
      setError('Por favor, preencha o ticker e a quantidade.');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      // Fetch stock data from API
      const stockData = await fetchStockData(newStock.ticker.toUpperCase());
      
      if (!stockData) {
        setError(`Não foi possível encontrar dados para ${newStock.ticker}.`);
        setIsLoading(false);
        return;
      }
      
      const stockToAdd = {
        id: Date.now().toString(), // Temporary ID
        ticker: newStock.ticker.toUpperCase(),
        quantity: parseInt(newStock.quantity),
        price: stockData.price,
        dividendPerShare: stockData.dividendPerShare,
        totalValue: stockData.price * parseInt(newStock.quantity),
        expectedIncome: stockData.dividendPerShare * parseInt(newStock.quantity),
        dividendYield: ((stockData.dividendPerShare / stockData.price) * 100).toFixed(2)
      };
      
      // Add to local portfolio
      const updatedStocks = [...stocks, stockToAdd];
      setStocks(updatedStocks);
      
      // Update parent component if callback provided
      if (onUpdateStocks) {
        onUpdateStocks(updatedStocks);
      }
      
      // Reset form
      setNewStock({ ticker: '', quantity: '' });
      
      // Persist to Firestore
      const db = getFirestore();
      try {
        const userStocksRef = doc(db, 'portfolios', currentUser.uid);
        const userStocksDoc = await getDoc(userStocksRef);
        
        if (userStocksDoc.exists()) {
          // Update existing document
          await updateDoc(userStocksRef, {
            stocks: arrayUnion(stockToAdd),
            lastUpdated: new Date()
          });
        } else {
          // Create new document
          await setDoc(userStocksRef, {
            stocks: [stockToAdd],
            lastUpdated: new Date()
          });
        }
        console.log('Ação adicionada ao Firestore com sucesso');
      } catch (error) {
        console.error('Erro ao salvar no Firestore:', error);
        setError('A ação foi adicionada localmente, mas houve um erro ao sincronizar com o servidor.');
      }
      
    } catch (error) {
      console.error('Erro ao adicionar ação:', error);
      setError('Ocorreu um erro ao adicionar a ação ao seu portfólio.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveStock = async (stockId) => {
    // Update local state first for better UX
    const updatedStocks = stocks.filter(stock => stock.id !== stockId);
    setStocks(updatedStocks);
    
    // Update parent component if callback provided
    if (onUpdateStocks) {
      onUpdateStocks(updatedStocks);
    }
    
    // Update in Firestore
    try {
      const db = getFirestore();
      const userStocksRef = doc(db, 'portfolios', currentUser.uid);
      const userStocksDoc = await getDoc(userStocksRef);
      
      if (userStocksDoc.exists()) {
        const currentStocks = userStocksDoc.data().stocks || [];
        const updatedFirestoreStocks = currentStocks.filter(stock => stock.id !== stockId);
        
        await updateDoc(userStocksRef, {
          stocks: updatedFirestoreStocks,
          lastUpdated: new Date()
        });
        console.log('Ação removida do Firestore com sucesso');
      }
    } catch (error) {
      console.error('Erro ao remover do Firestore:', error);
      // Reload data from server in case of error
      loadUserPortfolio();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStock((prev) => ({ ...prev, [name]: value }));
  };

  const calculateTotals = () => {
    const totalValue = stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalShares = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    const totalExpectedIncome = stocks.reduce((sum, stock) => sum + stock.expectedIncome, 0);
    const averageYield = totalValue > 0 ? (totalExpectedIncome / totalValue) * 100 : 0;
    const monthlyIncome = totalExpectedIncome / 12;
    
    return {
      totalValue: totalValue.toFixed(2),
      totalShares: totalShares,
      totalExpectedIncome: totalExpectedIncome.toFixed(2),
      monthlyIncome: monthlyIncome.toFixed(2),
      averageYield: averageYield.toFixed(2)
    };
  };

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedStocks = React.useMemo(() => {
    let sortableStocks = [...stocks];
    if (sortConfig.key) {
      sortableStocks.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableStocks;
  }, [stocks, sortConfig]);

  // Export to CSV function
  const exportToCSV = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Ticker,Quantidade,Preço,Dividend por Ação,Renda Anual Esperada,Capital Alocado,Dividend Yield\n";
    
    stocks.forEach(stock => {
      csvContent += `${stock.ticker},${stock.quantity},${stock.price.toFixed(2)},`;
      csvContent += `${stock.dividendPerShare.toFixed(2)},${stock.expectedIncome.toFixed(2)},`;
      csvContent += `${stock.totalValue.toFixed(2)},${stock.dividendYield}%\n`;
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    saveAs(blob, `carteira-acoes-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const refreshPrices = async () => {
    setIsLoadingPrices(true);
    try {
      await loadUserPortfolio();
    } catch (error) {
      console.error('Erro ao atualizar preços:', error);
      setError('Falha ao atualizar cotações. Por favor, tente novamente.');
    } finally {
      setIsLoadingPrices(false);
    }
  };
  
  // Initialize component - use portfolioData if provided, otherwise load from Firestore
  useEffect(() => {
    if (portfolioData && portfolioData.length > 0) {
      setStocks(portfolioData);
    } else if (currentUser) {
      loadUserPortfolio();
    }
  }, [currentUser, loadUserPortfolio, portfolioData]);

  // Calculate stocks for current page
  const indexOfLastStock = currentPage * itemsPerPage;
  const indexOfFirstStock = indexOfLastStock - itemsPerPage;
  const currentStocks = sortedStocks.slice(indexOfFirstStock, indexOfLastStock);
  
  const totals = calculateTotals();

  // Pagination controls
  const pageCount = Math.ceil(stocks.length / itemsPerPage);
  
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const handleNextPage = () => {
    if (currentPage < pageCount) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="stock-portfolio">
      <h2>Carteira de Ações</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      {!currentUser && (
        <div className="error-message">
          Você precisa estar logado para visualizar e gerenciar seu portfólio.
        </div>
      )}
      
      {currentUser && (
        <div className="add-stock-form">
          <form onSubmit={handleAddStock}>
            <div className="form-group">
              <label htmlFor="ticker">Ticker</label>
              <input
                type="text"
                id="ticker"
                name="ticker"
                value={newStock.ticker}
                onChange={handleInputChange}
                placeholder="PETR4"
                disabled={isLoading}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quantity">Quantidade</label>
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={newStock.quantity}
                onChange={handleInputChange}
                placeholder="100"
                min="1"
                disabled={isLoading}
              />
            </div>
            
            <button 
              type="submit" 
              className="add-button"
              disabled={isLoading}
            >
              {isLoading ? 'Adicionando...' : 'Adicionar Ação'}
            </button>
          </form>
        </div>
      )}
      
      {currentUser && (
        <div className="portfolio-summary">
          <div className="summary-card">
            <h3>Quantidade de Ações</h3>
            <p>{totals.totalShares}</p>
          </div>
          <div className="summary-card">
            <h3>Capital Alocado</h3>
            <p>R$ {totals.totalValue}</p>
          </div>
          <div className="summary-card">
            <h3>Renda Anual</h3>
            <p>R$ {totals.totalExpectedIncome}</p>
          </div>
          <div className="summary-card">
            <h3>Renda Mensal</h3>
            <p>R$ {totals.monthlyIncome}</p>
          </div>
          <div className="summary-card">
            <h3>Yield Médio</h3>
            <p>{totals.averageYield}%</p>
          </div>
        </div>
      )}
      
      {currentUser && (
        <div className="stocks-table-container">
          {isLoading ? (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Carregando seu portfólio...</p>
            </div>
          ) : stocks.length > 0 ? (
            <>
              <table className="stocks-table">
                <thead>
                  <tr>
                    <th onClick={() => requestSort('ticker')}>
                      Ticker {sortConfig.key === 'ticker' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => requestSort('quantity')}>
                      Quantidade {sortConfig.key === 'quantity' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => requestSort('price')}>
                      Cotação {sortConfig.key === 'price' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => requestSort('dividendPerShare')}>
                      Div/Ação {sortConfig.key === 'dividendPerShare' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => requestSort('expectedIncome')}>
                      Renda Anual {sortConfig.key === 'expectedIncome' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => requestSort('totalValue')}>
                      Capital Alocado {sortConfig.key === 'totalValue' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th onClick={() => requestSort('dividendYield')}>
                      Dividend Yield {sortConfig.key === 'dividendYield' && (sortConfig.direction === 'ascending' ? '↑' : '↓')}
                    </th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {currentStocks.map((stock) => (
                    <tr key={stock.id}>
                      <td>{stock.ticker}</td>
                      <td>{stock.quantity}</td>
                      <td>R$ {stock.price.toFixed(2)}</td>
                      <td>R$ {stock.dividendPerShare.toFixed(2)}</td>
                      <td>R$ {stock.expectedIncome.toFixed(2)}</td>
                      <td>R$ {stock.totalValue.toFixed(2)}</td>
                      <td>{stock.dividendYield}%</td>
                      <td>
                        <button 
                          className="remove-button" 
                          onClick={() => handleRemoveStock(stock.id)}
                          title="Remover ação"
                        >
                          ✖
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {stocks.length > itemsPerPage && (
                <div className="pagination">
                  <button 
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                    className="pagination-button"
                  >
                    Anterior
                  </button>
                  
                  <span className="page-info">
                    Página {currentPage} de {pageCount}
                  </span>
                  
                  <button 
                    onClick={handleNextPage}
                    disabled={currentPage === pageCount}
                    className="pagination-button"
                  >
                    Próximo
                  </button>
                  
                  <select 
                    value={itemsPerPage}
                    onChange={e => {
                      setItemsPerPage(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                    className="items-per-page"
                  >
                    <option value={5}>5 por página</option>
                    <option value={10}>10 por página</option>
                    <option value={20}>20 por página</option>
                    <option value={50}>50 por página</option>
                  </select>
                </div>
              )}
            </>
          ) : (
            <div className="empty-portfolio">
              <p>Seu portfólio está vazio. Adicione ações para começar.</p>
            </div>
          )}
        </div>
      )}
      
      {currentUser && stocks.length > 0 && (
        <div className="actions-section">
          <div className="refresh-section">
            <button 
              className="refresh-button" 
              onClick={refreshPrices}
              disabled={isLoading || isLoadingPrices}
            >
              {isLoadingPrices ? 'Atualizando...' : 'Atualizar Cotações'}
            </button>
            <span className="last-update">
              Última atualização: {new Date().toLocaleTimeString()}
            </span>
          </div>
          
          <button 
            className="export-button"
            onClick={exportToCSV}
            disabled={stocks.length === 0}
          >
            Exportar CSV
          </button>
        </div>
      )}
      
      {isLoadingPrices && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Atualizando cotações...</p>
        </div>
      )}
    </div>
  );
};

export default StockPortfolio;