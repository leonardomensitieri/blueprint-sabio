import React, { useState, useEffect } from 'react';
import { getAcoes, adicionarAcao, removerAcao, atualizarAcao } from '../../services/userService';
import { useAuth } from '../auth/AuthProvider';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import './StockPortfolio.css';

const StockPortfolio = () => {
  const { currentUser } = useAuth();
  const [acoes, setAcoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para nova ação
  const [novaAcao, setNovaAcao] = useState({
    ticker: '',
    quantidadeAcoes: 0,
    precoMedio: 0,
    dividendoProjetado: 0
  });

  // Buscar ações ao carregar componente
  useEffect(() => {
    const carregarAcoes = async () => {
      if (!currentUser?.uid) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Primeiro, verifique se o documento financialData/main existe
        // Se não existir, tente criá-lo
        const db = getFirestore();
        const financialDocRef = doc(db, 'users', currentUser.uid, 'financialData', 'main');
        const financialDoc = await getDoc(financialDocRef);
        
        // Se não existir, inicializar a estrutura
        if (!financialDoc.exists()) {
          console.log('Inicializando estrutura de dados financeiros...');
          const now = serverTimestamp();
          await setDoc(financialDocRef, {
            updatedAt: now,
            poderDeAporte: 0,
            custoDeVidaMensal: 0,
            patrimonioAcoes: {
              total: 0,
              tickers: {}
            },
            patrimonioRendaFixa: {
              total: 0,
              tempoInvestido: ''
            },
            patrimonioReservaDeEmergencia: {
              total: 0
            }
          });
          
          // Aqui não temos ações ainda, já que acabamos de criar
          setAcoes([]);
          setLoading(false);
          return;
        }
        
        // Se o documento existir, carregar ações
        const acoesData = await getAcoes(currentUser.uid);
        
        // Transformar dados para formato de exibição
        const acoesDisplay = acoesData.map(({ ticker, info }) => ({
          ticker,
          quantidadeAcoes: info.quantidadeAcoes,
          precoMedio: info.precoMedio,
          valor: info.valor,
          dividendoProjetado: info.dividendoProjetado
        }));
        
        setAcoes(acoesDisplay);
      } catch (err) {
        console.error('Erro ao carregar ações:', err);
        setError('Não foi possível carregar sua carteira de ações. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      carregarAcoes();
    }
  }, [currentUser]);

  // Handler para mudanças nos inputs do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovaAcao(prev => ({
      ...prev,
      [name]: name === 'ticker' ? value.toUpperCase() : parseFloat(value) || 0
    }));
  };

  // Adicionar nova ação
  const handleAddStock = async (e) => {
    e.preventDefault();
    
    if (!currentUser?.uid || !novaAcao.ticker) {
      setError('Preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Transformar para o formato esperado pela API
      const tickerInfo = {
        quantidadeAcoes: novaAcao.quantidadeAcoes,
        precoMedio: novaAcao.precoMedio,
        dividendoProjetado: novaAcao.dividendoProjetado
      };
      
      await adicionarAcao(currentUser.uid, novaAcao.ticker, tickerInfo);
      
      // Limpar formulário
      setNovaAcao({
        ticker: '',
        quantidadeAcoes: 0,
        precoMedio: 0,
        dividendoProjetado: 0
      });
      
      // Recarregar lista de ações
      const acoesData = await getAcoes(currentUser.uid);
      const acoesDisplay = acoesData.map(({ ticker, info }) => ({
        ticker,
        quantidadeAcoes: info.quantidadeAcoes,
        precoMedio: info.precoMedio,
        valor: info.valor,
        dividendoProjetado: info.dividendoProjetado
      }));
      
      setAcoes(acoesDisplay);
      setError(null);
    } catch (err) {
      console.error('Erro ao adicionar ação:', err);
      setError('Ocorreu um erro ao adicionar a ação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Remover ação
  const handleRemoveStock = async (ticker) => {
    if (!currentUser?.uid) return;
    
    if (!window.confirm('Tem certeza que deseja remover esta ação?')) return;
    
    try {
      setLoading(true);
      await removerAcao(currentUser.uid, ticker);
      
      // Atualizar lista de ações localmente (otimista)
      setAcoes(prevAcoes => prevAcoes.filter(acao => acao.ticker !== ticker));
      
      setError(null);
    } catch (err) {
      console.error('Erro ao remover ação:', err);
      setError('Ocorreu um erro ao remover a ação. Tente novamente.');
      
      // Recarregar lista de ações em caso de erro
      const acoesData = await getAcoes(currentUser.uid);
      const acoesDisplay = acoesData.map(({ ticker, info }) => ({
        ticker,
        quantidadeAcoes: info.quantidadeAcoes,
        precoMedio: info.precoMedio,
        valor: info.valor,
        dividendoProjetado: info.dividendoProjetado
      }));
      
      setAcoes(acoesDisplay);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="stock-portfolio">
      <h2>Carteira de Ações</h2>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="add-stock-form">
        <form onSubmit={handleAddStock}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="ticker">Código da Ação</label>
              <input
                type="text"
                id="ticker"
                name="ticker"
                value={novaAcao.ticker}
                onChange={handleInputChange}
                placeholder="BBAS3"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="quantidadeAcoes">Quantidade</label>
              <input
                type="number"
                id="quantidadeAcoes"
                name="quantidadeAcoes"
                value={novaAcao.quantidadeAcoes || ''}
                onChange={handleInputChange}
                min="1"
                step="1"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="precoMedio">Preço Médio (R$)</label>
              <input
                type="number"
                id="precoMedio"
                name="precoMedio"
                value={novaAcao.precoMedio || ''}
                onChange={handleInputChange}
                min="0.01"
                step="0.01"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="dividendoProjetado">Dividendo Anual/Ação (R$)</label>
              <input
                type="number"
                id="dividendoProjetado"
                name="dividendoProjetado"
                value={novaAcao.dividendoProjetado || ''}
                onChange={handleInputChange}
                min="0"
                step="0.01"
              />
            </div>
            
            <button 
              type="submit" 
              className="add-button"
              disabled={loading}
            >
              {loading ? 'Adicionando...' : 'Adicionar Ação'}
            </button>
          </div>
        </form>
      </div>
      
      {/* Resumo do Portfolio */}
      <div className="portfolio-summary">
        <div className="summary-card">
          <h3>Total de Ações</h3>
          <p>{acoes.length}</p>
        </div>
        <div className="summary-card">
          <h3>Valor Total</h3>
          <p>
            R$ {acoes.reduce((total, acao) => 
              total + ((acao.valor || acao.quantidadeAcoes * (acao.precoMedio || 0)) || 0), 0
            ).toFixed(2)}
          </p>
        </div>
        <div className="summary-card">
          <h3>Dividendos Anuais</h3>
          <p>
            R$ {acoes.reduce((total, acao) => 
              total + ((acao.dividendoProjetado || 0) * acao.quantidadeAcoes), 0
            ).toFixed(2)}
          </p>
        </div>
      </div>
      
      {/* Tabela de Ações */}
      <div className="stocks-table-container">
        <h3>Minhas Ações</h3>
        
        {loading && acoes.length === 0 ? (
          <div className="loading-indicator">
            <div className="spinner"></div>
            <p>Carregando sua carteira...</p>
          </div>
        ) : acoes.length === 0 ? (
          <div className="empty-portfolio">
            <p>Você ainda não possui ações na sua carteira.</p>
            <p>Adicione sua primeira ação utilizando o formulário acima.</p>
          </div>
        ) : (
          <table className="stocks-table">
            <thead>
              <tr>
                <th>Ticker</th>
                <th>Quantidade</th>
                <th>Preço Médio</th>
                <th>Total Investido</th>
                <th>Div. Projetado</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {acoes.map(acao => (
                <tr key={acao.ticker}>
                  <td>{acao.ticker}</td>
                  <td>{acao.quantidadeAcoes}</td>
                  <td>R$ {acao.precoMedio?.toFixed(2) || '0.00'}</td>
                  <td>
                    R$ {acao.valor?.toFixed(2) || 
                      (acao.quantidadeAcoes * (acao.precoMedio || 0)).toFixed(2)}
                  </td>
                  <td>
                    {acao.dividendoProjetado 
                      ? `R$ ${(acao.dividendoProjetado * acao.quantidadeAcoes).toFixed(2)}` 
                      : '-'}
                  </td>
                  <td>
                    <button 
                      className="remove-button" 
                      onClick={() => handleRemoveStock(acao.ticker)}
                      title="Remover ação"
                      disabled={loading}
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Ações em lote (opcional) */}
      <div className="refresh-section">
        <div>
          <button 
            className="refresh-button"
            disabled={loading || acoes.length === 0}
            onClick={async () => {
              try {
                setLoading(true);
                const acoesData = await getAcoes(currentUser.uid);
                const acoesDisplay = acoesData.map(({ ticker, info }) => ({
                  ticker,
                  quantidadeAcoes: info.quantidadeAcoes,
                  precoMedio: info.precoMedio,
                  valor: info.valor,
                  dividendoProjetado: info.dividendoProjetado
                }));
                setAcoes(acoesDisplay);
              } catch (err) {
                setError('Erro ao atualizar dados.');
              } finally {
                setLoading(false);
              }
            }}
          >
            Atualizar Dados
          </button>
        </div>
        
        <div className="last-update">
          Última atualização: {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default StockPortfolio;