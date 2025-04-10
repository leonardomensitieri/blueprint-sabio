import React, { useState, useEffect } from 'react';
import { fetchStockData, fetchDividendHistory } from '../../services/financialAPI';
import { 
  calculateValuation,
  calculateDividendFrequency,
  formatCurrency,
  formatPercentage
} from '../../services/financialCalculations';
import './StockAnalysis.css';

const StockAnalysis = () => {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState(null);
  const [analysisData, setAnalysisData] = useState(null);
  const [dividendFrequency, setDividendFrequency] = useState(null);
  const [dividendHistory, setDividendHistory] = useState([]);
  const [customInputs, setCustomInputs] = useState({
    netIncome: '',
    shares: '',
    roe: '',
    ebitda: '',
    netDebt: '',
    growthRate: '',
    historicalPE: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!ticker) {
      setError('Por favor, insira um ticker válido');
      return;
    }

    setIsLoading(true);
    setError('');
    setStockData(null);
    setAnalysisData(null);
    setDividendFrequency(null);
    setDividendHistory([]);

    try {
      // Buscar dados da ação
      const fetchedStockData = await fetchStockData(ticker.toUpperCase());
      setStockData(fetchedStockData);

      // Buscar histórico de dividendos
      const fetchedDividendHistory = await fetchDividendHistory(ticker.toUpperCase());
      setDividendHistory(fetchedDividendHistory);

      // Pré-configurar inputs customizados com valores estimados
      // Estes valores seriam idealmente obtidos de uma API com dados fundamentalistas
      const estimatedShares = 1000000000; // 1 bilhão de ações (exemplo)
      const estimatedNetIncome = fetchedStockData.price * estimatedShares * 0.07; // ROE estimado de 7%
      const estimatedROE = 15;
      const estimatedEBITDA = estimatedNetIncome * 1.5;
      const estimatedNetDebt = estimatedEBITDA * 2;
      const estimatedGrowthRate = 5;
      const estimatedHistoricalPE = 12;

      setCustomInputs({
        netIncome: estimatedNetIncome.toFixed(0),
        shares: estimatedShares,
        roe: estimatedROE,
        ebitda: estimatedEBITDA.toFixed(0),
        netDebt: estimatedNetDebt.toFixed(0),
        growthRate: estimatedGrowthRate,
        historicalPE: estimatedHistoricalPE
      });

      // Calcular frequência de dividendos
      const frequencyData = calculateDividendFrequency(ticker.toUpperCase(), fetchedDividendHistory);
      setDividendFrequency(frequencyData);

    } catch (error) {
      console.error(`Erro ao buscar dados para ${ticker}:`, error);
      setError(`Não foi possível encontrar dados para ${ticker}. Verifique se o ticker está correto.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'ticker') {
      setTicker(value.toUpperCase());
    } else {
      setCustomInputs({
        ...customInputs,
        [name]: value
      });
    }
  };

  const handleAnalyze = () => {
    if (!stockData) return;

    // Converter inputs para números
    const netIncome = parseFloat(customInputs.netIncome) || 0;
    const shares = parseFloat(customInputs.shares) || 0;
    const roe = parseFloat(customInputs.roe) || 0;
    const ebitda = parseFloat(customInputs.ebitda) || 0;
    const netDebt = parseFloat(customInputs.netDebt) || 0;
    const growthRate = parseFloat(customInputs.growthRate) || 0;
    const historicalPE = parseFloat(customInputs.historicalPE) || 0;

    if (netIncome <= 0 || shares <= 0) {
      setError('Lucro líquido e quantidade de ações são necessários para a análise.');
      return;
    }

    // Preparar dados para análise
    const analysisInput = {
      ticker: ticker,
      price: stockData.price,
      netIncome: netIncome,
      shares: shares,
      sector: stockData.sector,
      roe: roe,
      ebitda: ebitda,
      netDebt: netDebt,
      growthRate: growthRate / 100, // Converter para decimal
      historicalPE: historicalPE
    };

    // Calcular métricas de valuation
    const valuationResult = calculateValuation(analysisInput);
    setAnalysisData(valuationResult);
    setError('');
  };

  const getStatusClass = (value, threshold1, threshold2, isInverted = false) => {
    if (value === null || value === undefined) return '';
    
    if (!isInverted) {
      // Normal: valores altos são bons (ex: margem de segurança)
      if (value >= threshold2) return 'positive';
      if (value >= threshold1) return 'neutral';
      return 'negative';
    } else {
      // Invertido: valores baixos são bons (ex: P/L, dívida)
      if (value <= threshold1) return 'positive';
      if (value <= threshold2) return 'neutral';
      return 'negative';
    }
  };

  return (
    <div className="stock-analysis">
      <h2>Análise Quantitativa de Ações</h2>
      
      <div className="search-section">
        <div className="search-form">
          <input 
            type="text" 
            value={ticker} 
            onChange={handleInputChange}
            name="ticker"
            placeholder="Digite o ticker (ex: PETR4)" 
            disabled={isLoading}
          />
          <button 
            onClick={handleSearch}
            disabled={isLoading}
            className="search-button"
          >
            {isLoading ? 'Buscando...' : 'Buscar Ação'}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
      </div>
      
      {stockData && (
        <div className="stock-details">
          <div className="stock-header">
            <h3>{stockData.name} ({ticker})</h3>
            <div className="stock-price">
              <span className="label">Cotação Atual:</span>
              <span className="value">{formatCurrency(stockData.price)}</span>
            </div>
          </div>
          
          <div className="stock-inputs">
            <h4>Dados Fundamentais</h4>
            <p className="input-note">
              Insira ou ajuste os dados abaixo com informações atualizadas da empresa para uma análise mais precisa.
            </p>
            
            <div className="input-grid">
              <div className="input-group">
                <label htmlFor="netIncome">Lucro Líquido Estimado (R$)</label>
                <input 
                  type="number" 
                  id="netIncome" 
                  name="netIncome" 
                  value={customInputs.netIncome} 
                  onChange={handleInputChange} 
                  placeholder="Ex: 1000000000"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="shares">Quantidade de Ações</label>
                <input 
                  type="number" 
                  id="shares" 
                  name="shares" 
                  value={customInputs.shares} 
                  onChange={handleInputChange} 
                  placeholder="Ex: 1000000000"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="roe">ROE (%)</label>
                <input 
                  type="number" 
                  id="roe" 
                  name="roe" 
                  value={customInputs.roe} 
                  onChange={handleInputChange} 
                  placeholder="Ex: 15"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="ebitda">EBITDA (R$)</label>
                <input 
                  type="number" 
                  id="ebitda" 
                  name="ebitda" 
                  value={customInputs.ebitda} 
                  onChange={handleInputChange} 
                  placeholder="Ex: 1500000000"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="netDebt">Dívida Líquida (R$)</label>
                <input 
                  type="number" 
                  id="netDebt" 
                  name="netDebt" 
                  value={customInputs.netDebt} 
                  onChange={handleInputChange} 
                  placeholder="Ex: 3000000000"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="growthRate">Crescimento Projetado (% a.a.)</label>
                <input 
                  type="number" 
                  id="growthRate" 
                  name="growthRate" 
                  value={customInputs.growthRate} 
                  onChange={handleInputChange} 
                  placeholder="Ex: 5"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="historicalPE">P/L Histórico Médio</label>
                <input 
                  type="number" 
                  id="historicalPE" 
                  name="historicalPE" 
                  value={customInputs.historicalPE} 
                  onChange={handleInputChange} 
                  placeholder="Ex: 12"
                />
              </div>
            </div>
            
            <button 
              onClick={handleAnalyze} 
              className="analyze-button"
              disabled={isLoading}
            >
              Analisar
            </button>
          </div>
          
          {analysisData && (
            <div className="analysis-results">
              <h4>Resultados da Análise</h4>
              
              <div className="metrics-grid">
                <div className="metric-card">
                  <div className="metric-header">
                    <h5>Valuation</h5>
                  </div>
                  <div className="metric-body">
                    <div className="metric-item">
                      <span className="label">Valor de Mercado:</span>
                      <span className="value">{formatCurrency(analysisData.marketCap)}</span>
                    </div>
                    <div className="metric-item">
                      <span className="label">Lucro por Ação:</span>
                      <span className="value">{formatCurrency(analysisData.eps)}</span>
                    </div>
                    <div className="metric-item">
                      <span className="label">P/L Atual:</span>
                      <span className={`value ${getStatusClass(analysisData.currentPE, 15, 20, true)}`}>
                        {analysisData.currentPE.toFixed(2)}
                      </span>
                    </div>
                    {analysisData.peDivergence !== null && (
                      <div className="metric-item">
                        <span className="label">Desvio do P/L Histórico:</span>
                        <span className={`value ${getStatusClass(analysisData.peDivergence * 100, -10, 10, true)}`}>
                          {(analysisData.peDivergence * 100).toFixed(2)}%
                        </span>
                      </div>
                    )}
                    {analysisData.debtToEBITDA !== null && (
                      <div className="metric-item">
                        <span className="label">Dívida/EBITDA:</span>
                        <span className={`value ${getStatusClass(analysisData.debtToEBITDA, 2, 3, true)}`}>
                          {analysisData.debtToEBITDA.toFixed(2)}x
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="metric-card">
                  <div className="metric-header">
                    <h5>Dividendos</h5>
                  </div>
                  <div className="metric-body">
                    <div className="metric-item">
                      <span className="label">Payout Esperado:</span>
                      <span className="value">{(analysisData.expectedPayout * 100).toFixed(2)}%</span>
                    </div>
                    <div className="metric-item">
                      <span className="label">Dividendo por Ação:</span>
                      <span className="value">{formatCurrency(analysisData.expectedDividendPerShare)}</span>
                    </div>
                    <div className="metric-item">
                      <span className="label">Dividend Yield:</span>
                      <span className={`value ${getStatusClass(analysisData.dividendYield, 4, 6)}`}>
                        {analysisData.dividendYield.toFixed(2)}%
                      </span>
                    </div>
                    {dividendFrequency && (
                      <>
                        <div className="metric-item">
                          <span className="label">Frequência de Pagamentos:</span>
                          <span className="value">{dividendFrequency.paymentFrequency}x ao ano</span>
                        </div>
                        <div className="metric-item">
                          <span className="label">Próximo Mês de Pagamento:</span>
                          <span className="value">
                            {getMonthName(dividendFrequency.nextPaymentMonth)} 
                            ({dividendFrequency.monthsToNextPayment} {dividendFrequency.monthsToNextPayment === 1 ? 'mês' : 'meses'})
                          </span>
                        </div>
                        {dividendFrequency.isNearAnnouncement && (
                          <div className="dividend-alert">
                            <span>⚠️ Possível anúncio de dividendos em breve</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
                
                <div className="metric-card highlight-card">
                  <div className="metric-header">
                    <h5>Preço-Teto</h5>
                  </div>
                  <div className="metric-body">
                    <div className="metric-item large">
                      <span className="label">Preço-Teto Calculado:</span>
                      <span className="value price-target">{formatCurrency(analysisData.ceilingPrice)}</span>
                    </div>
                    <div className="metric-item large">
                      <span className="label">Margem de Segurança:</span>
                      <span className={`value ${getStatusClass(analysisData.safetyMargin * 100, 10, 30)}`}>
                        {(analysisData.safetyMargin * 100).toFixed(2)}%
                      </span>
                    </div>
                    <div className="metric-note">
                      {analysisData.safetyMargin >= 0.3 ? (
                        <p>Excelente oportunidade de compra com boa margem de segurança</p>
                      ) : analysisData.safetyMargin >= 0.1 ? (
                        <p>Ação está com preço razoável, pode ser boa para complementar a carteira</p>
                      ) : analysisData.safetyMargin > 0 ? (
                        <p>Margem pequena, considere esperar por um preço melhor</p>
                      ) : (
                        <p>Ação acima do preço-teto, momento não é favorável para compra</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="historical-dividends">
                <h4>Histórico de Dividendos</h4>
                {dividendHistory.length > 0 ? (
                  <div className="dividend-history-container">
                    <table className="dividend-history-table">
                      <thead>
                        <tr>
                          <th>Data</th>
                          <th>Valor</th>
                          <th>Tipo</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dividendHistory.slice(0, 5).map((dividend, index) => (
                          <tr key={index}>
                            <td>{formatDate(dividend.date)}</td>
                            <td>{formatCurrency(dividend.amount)}</td>
                            <td>{dividend.type}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {dividendHistory.length > 5 && (
                      <div className="table-note">
                        Mostrando os 5 pagamentos mais recentes de um total de {dividendHistory.length}.
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="no-data-message">
                    Nenhum histórico de dividendos disponível para esta ação.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="analysis-info">
        <h3>Sobre a Análise Quantitativa</h3>
        <p>
          A análise quantitativa fornece uma avaliação objetiva baseada em números para ajudar em decisões de investimento.
          Foco na quantidade de ações e dividendos, não no valor médio investido, seguindo a filosofia do Blueprint Sábio.
        </p>
        
        <div className="info-grid">
          <div className="info-card">
            <h4>P/L (Preço/Lucro)</h4>
            <p>
              Indica quantos anos seriam necessários para o lucro da empresa pagar o investimento.
              Quanto menor, mais "barata" a ação está em relação ao seu lucro.
            </p>
          </div>
          
          <div className="info-card">
            <h4>Preço-Teto</h4>
            <p>
              Valor máximo que faz sentido pagar pela ação. Para ações comuns, calculamos como dividend yield de 6%.
              Para bancos, usamos uma fórmula específica considerando ROE e crescimento.
            </p>
          </div>
          
          <div className="info-card">
            <h4>Margem de Segurança</h4>
            <p>
              Diferença entre o preço-teto e o preço atual. Uma margem maior fornece mais proteção contra 
              oscilações de mercado e possíveis erros nas estimativas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Funções auxiliares
const getMonthName = (monthNumber) => {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return months[monthNumber - 1];
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR');
};

export default StockAnalysis;