import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area,
  ReferenceLine
} from 'recharts';
import './ConsolidatedPortfolio.css';

const ConsolidatedPortfolio = ({ stocksData, fixedIncomeData }) => {
  const [summary, setSummary] = useState({
    totalStocks: 0,
    totalFixedIncome: 0,
    totalPortfolio: 0,
    totalStocksDividends: 0,
    totalFixedIncomeEarnings: 0,
    totalAnnualIncome: 0,
    monthlyAverageIncome: 0
  });

  const [allocationData, setAllocationData] = useState([]);
  const [incomeData, setIncomeData] = useState([]);
  const [companyData, setCompanyData] = useState([]);
  const [companyYOCData, setCompanyYOCData] = useState([]);
  const [companyGrowthData, setCompanyGrowthData] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [timelineData, setTimelineData] = useState([]);
  const [distributionData, setDistributionData] = useState([]);
  const [chartsLoaded, setChartsLoaded] = useState({
    allocation: false,
    income: false,
    companies: false,
    timeline: false
  });

  // Cores para os gráficos
  const COLORS = ['#63BDAB', '#2196F3', '#FFBB28', '#FF8042', '#A28CFF', '#4CAF50', '#FFC107', '#F44336', '#9C27B0'];
  // Memoized MONTHS array to avoid recreating on each render
  const MONTHS = useMemo(() => ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'], []);

  // Memoize as funções para evitar recriações em cada render
  const calculateSummary = useCallback((stocks, fixedIncome) => {
    // Totais dos investimentos em ações
    const totalStocks = stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalStocksDividends = stocks.reduce((sum, stock) => sum + stock.expectedIncome, 0);

    // Totais dos investimentos em renda fixa
    const totalFixedIncome = fixedIncome.totalValue;
    const totalFixedIncomeEarnings = fixedIncome.annualIncome;

    // Totais consolidados
    const totalPortfolio = totalStocks + totalFixedIncome;
    const totalAnnualIncome = totalStocksDividends + totalFixedIncomeEarnings;
    const monthlyAverageIncome = totalAnnualIncome / 12;

    setSummary({
      totalStocks,
      totalFixedIncome,
      totalPortfolio,
      totalStocksDividends,
      totalFixedIncomeEarnings,
      totalAnnualIncome,
      monthlyAverageIncome
    });

    // Dados para o gráfico de alocação
    setAllocationData([
      { name: 'Ações', value: totalStocks },
      { name: 'Renda Fixa', value: totalFixedIncome }
    ]);

    // Dados para o gráfico de rendimentos
    setIncomeData([
      { name: 'Dividendos', value: totalStocksDividends },
      { name: 'Juros Renda Fixa', value: totalFixedIncomeEarnings }
    ]);
  }, []);

  // Preparar dados específicos por empresa
  const prepareCompanyData = useCallback((stocks) => {
    // Processar dados para gráficos por empresa
    const companyIncome = stocks.map(stock => ({
      name: stock.ticker,
      value: stock.expectedIncome,
      totalValue: stock.totalValue
    })).sort((a, b) => b.value - a.value);

    const companyYOC = stocks.map(stock => ({
      name: stock.ticker,
      value: ((stock.dividendPerShare / stock.price) * 100).toFixed(2),
      actualValue: (stock.dividendPerShare / stock.price) * 100,
      totalIncome: stock.expectedIncome
    })).sort((a, b) => b.actualValue - a.actualValue);

    // Simular dados de crescimento de dividendos
    const growthData = [
      { ticker: 'BBAS3', growthPercentage: 12.25, totalDividends: 210 },
      { ticker: 'VALE3', growthPercentage: 6.81, totalDividends: 870 },
      { ticker: 'TASA4', growthPercentage: 2.28, totalDividends: 277.50 }
    ].sort((a, b) => b.growthPercentage - a.growthPercentage);

    setCompanyData(companyIncome);
    setCompanyYOCData(companyYOC);
    setCompanyGrowthData(growthData);
  }, []);

  // Gerar dados de timeline de rendimentos
  const generateTimelineData = useCallback((stocks) => {
    // Gerar dados simulados para o timeline de rendimentos
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    
    // Dados para os últimos 24 meses
    const monthlyData = [];
    
    for (let i = 0; i < 24; i++) {
      const month = (currentMonth - i + 12) % 12;
      const year = currentYear - Math.floor((i - currentMonth) / 12);
      
      // Gerar valor simulado (mais alto nos meses mais recentes)
      const baseValue = 2000 + Math.random() * 1000;
      const factor = 1 - (i / 30); // Fator decrescente para meses mais antigos
      const value = baseValue * factor;
      
      monthlyData.unshift({
        name: `${MONTHS[month]}/${year}`,
        value: value,
        month,
        year
      });
    }
    
    setTimelineData(monthlyData);
  }, [MONTHS]);
  
  // Gerar dados de distribuição de rendimentos
  const generateDistributionData = useCallback((stocks) => {
    // Simular distribuição de pagamentos durante o ano
    const distributionByMonth = MONTHS.map(month => {
      // Distribuir valores entre os meses (alguns meses com mais pagamentos)
      let value;
      if (['Mar', 'Jun', 'Set', 'Dez'].includes(month)) {
        // Trimestres com valores maiores
        value = 4000 + Math.random() * 2000;
      } else if (['Abr', 'Out'].includes(month)) {
        // Alguns meses com valores médios
        value = 2000 + Math.random() * 1000;
      } else {
        // Outros meses com valores menores
        value = 500 + Math.random() * 800;
      }
      
      return {
        name: month,
        value: value
      };
    });
    
    setDistributionData(distributionByMonth);
  }, [MONTHS]);
  
  // Initialize data when component mounts
  useEffect(() => {
    // Usar dados de exemplo se não houver dados reais
    const sampleStocksData = stocksData || [
      { id: '1', ticker: 'BBAS3', quantity: 100, price: 32.50, totalValue: 3250, expectedIncome: 210, dividendPerShare: 2.10 },
      { id: '2', ticker: 'VALE3', quantity: 200, price: 68.75, totalValue: 13750, expectedIncome: 870, dividendPerShare: 4.35 },
      { id: '3', ticker: 'TASA4', quantity: 150, price: 27.30, totalValue: 4095, expectedIncome: 277.5, dividendPerShare: 1.85 }
    ];

    const sampleFixedIncomeData = fixedIncomeData || {
      totalValue: 50000,
      annualReturn: 0.085, // 8.5% ao ano após impostos
      annualIncome: 4250,
      monthlyIncome: 354.17
    };

    calculateSummary(sampleStocksData, sampleFixedIncomeData);
    prepareCompanyData(sampleStocksData);
    generateTimelineData(sampleStocksData);
    generateDistributionData(sampleStocksData);
  }, [stocksData, fixedIncomeData, calculateSummary, prepareCompanyData, generateTimelineData, generateDistributionData]);
  
  // Initialize chart loading states
  useEffect(() => {
    // Gradually show charts for better perceived performance
    setChartsLoaded(prev => ({ ...prev, allocation: true }));
    
    const timers = [
      setTimeout(() => setChartsLoaded(prev => ({ ...prev, income: true })), 200),
      setTimeout(() => setChartsLoaded(prev => ({ ...prev, companies: true })), 400),
      setTimeout(() => setChartsLoaded(prev => ({ ...prev, timeline: true })), 600)
    ];
    
    return () => timers.forEach(timer => clearTimeout(timer));
  }, []);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatPercentage = (value, total) => {
    if (total === 0) return '0%';
    return `${((value / total) * 100).toFixed(1)}%`;
  };

  // Tooltips personalizados para gráficos
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
          <p className="tooltip-percentage">{formatPercentage(payload[0].value, summary.totalPortfolio)}</p>
        </div>
      );
    }
    return null;
  };

  const IncomeTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
          <p className="tooltip-percentage">{formatPercentage(payload[0].value, summary.totalAnnualIncome)}</p>
        </div>
      );
    }
    return null;
  };

  const CompanyTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${data.name}`}</p>
          <p className="tooltip-value">{`Dividendos: ${formatCurrency(data.value)}`}</p>
          <p className="tooltip-value">{`Capital Alocado: ${formatCurrency(data.totalValue || 0)}`}</p>
          <p className="tooltip-percentage">{`YoC: ${data.actualValue?.toFixed(2) || Number(data.value).toFixed(2)}%`}</p>
        </div>
      );
    }
    return null;
  };

  const TimelineTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-label">{`${payload[0].payload.name}`}</p>
          <p className="tooltip-value">{`Rendimento: ${formatCurrency(payload[0].value)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Função para selecionar uma empresa
  const handleSelectCompany = (ticker) => {
    if (selectedCompany === ticker) {
      setSelectedCompany(null);
    } else {
      setSelectedCompany(ticker);
    }
  };

  return (
    <div className="consolidated-portfolio">
      <h2>Análise de Empresas</h2>

      <div className="portfolio-tabs">
        <button 
          className={activeTab === 'overview' ? 'tab-btn active' : 'tab-btn'} 
          onClick={() => setActiveTab('overview')}
        >
          Visão Geral
        </button>
        <button 
          className={activeTab === 'companies' ? 'tab-btn active' : 'tab-btn'} 
          onClick={() => setActiveTab('companies')}
        >
          Empresas
        </button>
        <button 
          className={activeTab === 'timeline' ? 'tab-btn active' : 'tab-btn'} 
          onClick={() => setActiveTab('timeline')}
        >
          Timeline de Rendimentos
        </button>
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="portfolio-overview">
            <div className="overview-card total">
              <h3>Patrimônio Total</h3>
              <p className="value">{formatCurrency(summary.totalPortfolio)}</p>
            </div>

            <div className="overview-card">
              <h3>Renda Anual</h3>
              <p className="value">{formatCurrency(summary.totalAnnualIncome)}</p>
              <p className="yield">{(summary.totalAnnualIncome / summary.totalPortfolio * 100).toFixed(2)}% a.a.</p>
            </div>

            <div className="overview-card">
              <h3>Renda Mensal Média</h3>
              <p className="value">{formatCurrency(summary.monthlyAverageIncome)}</p>
            </div>
          </div>

          <div className="portfolio-details">
            <div className="detail-card">
              <div className="detail-header">
                <h3>Ações</h3>
                <span className="allocation">{formatPercentage(summary.totalStocks, summary.totalPortfolio)}</span>
              </div>
              <p className="detail-value">{formatCurrency(summary.totalStocks)}</p>
              <div className="detail-income">
                <span>Dividendos Anuais:</span>
                <span>{formatCurrency(summary.totalStocksDividends)}</span>
              </div>
              <div className="detail-yield">
                <span>Dividend Yield Médio:</span>
                <span>{(summary.totalStocksDividends / summary.totalStocks * 100).toFixed(2)}%</span>
              </div>
            </div>

            <div className="detail-card">
              <div className="detail-header">
                <h3>Renda Fixa</h3>
                <span className="allocation">{formatPercentage(summary.totalFixedIncome, summary.totalPortfolio)}</span>
              </div>
              <p className="detail-value">{formatCurrency(summary.totalFixedIncome)}</p>
              <div className="detail-income">
                <span>Rendimento Anual:</span>
                <span>{formatCurrency(summary.totalFixedIncomeEarnings)}</span>
              </div>
              <div className="detail-yield">
                <span>Rendimento Médio:</span>
                <span>{(summary.totalFixedIncomeEarnings / summary.totalFixedIncome * 100).toFixed(2)}%</span>
              </div>
            </div>
          </div>

          <div className="charts-container">
            <div className="chart-wrapper allocation-chart">
              <h3>Alocação por Classe de Ativos</h3>
              {chartsLoaded.allocation ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={allocationData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {allocationData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-loading">
                  <div className="spinner"></div>
                  <p>Carregando gráfico...</p>
                </div>
              )}
            </div>

            <div className="chart-wrapper income-chart">
              <h3>Rendimentos por Tipo de Investimento</h3>
              {chartsLoaded.income ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={incomeData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="name" tick={{ fill: '#AAAAAA' }} />
                    <YAxis tick={{ fill: '#AAAAAA' }} />
                    <Tooltip content={<IncomeTooltip />} />
                    <Legend />
                    <Bar dataKey="value" name="Rendimento Anual">
                      {incomeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="chart-loading">
                  <div className="spinner"></div>
                  <p>Carregando gráfico...</p>
                </div>
              )}
            </div>
          </div>

          <div className="recommendations-container">
            <h3>Recomendações para Otimização</h3>

            <div className="recommendation-cards">
              <div className="recommendation-card">
                <div className="recommendation-icon">📊</div>
                <div className="recommendation-content">
                  <h4>Avaliação da Alocação</h4>
                  {summary.totalStocks > summary.totalFixedIncome * 2 && (
                    <p>
                      Sua carteira está bastante concentrada em ações ({formatPercentage(summary.totalStocks, summary.totalPortfolio)}). 
                      Considere aumentar a alocação em renda fixa para melhorar a estabilidade.
                    </p>
                  )}
                  {summary.totalFixedIncome > summary.totalStocks * 2 && (
                    <p>
                      Sua carteira está bastante concentrada em renda fixa ({formatPercentage(summary.totalFixedIncome, summary.totalPortfolio)}). 
                      Considere aumentar a alocação em ações para potencializar retornos no longo prazo.
                    </p>
                  )}
                  {summary.totalFixedIncome <= summary.totalStocks * 2 && summary.totalStocks <= summary.totalFixedIncome * 2 && (
                    <p>
                      Sua alocação entre ações e renda fixa está bem balanceada. Continue monitorando e rebalanceando conforme necessário.
                    </p>
                  )}
                </div>
              </div>

              <div className="recommendation-card">
                <div className="recommendation-icon">💰</div>
                <div className="recommendation-content">
                  <h4>Rendimentos</h4>
                  {summary.totalAnnualIncome / summary.totalPortfolio < 0.05 && (
                    <p>
                      O rendimento total da sua carteira está abaixo de 5% ao ano. Considere investimentos com maior potencial de geração de renda.
                    </p>
                  )}
                  {summary.totalAnnualIncome / summary.totalPortfolio >= 0.05 && summary.totalAnnualIncome / summary.totalPortfolio < 0.08 && (
                    <p>
                      Sua carteira apresenta um rendimento moderado. Avalie oportunidades de melhorar o rendimento sem aumentar significativamente o risco.
                    </p>
                  )}
                  {summary.totalAnnualIncome / summary.totalPortfolio >= 0.08 && (
                    <p>
                      Excelente rendimento! Sua carteira está gerando boa renda. Continue monitorando a sustentabilidade desses rendimentos.
                    </p>
                  )}
                </div>
              </div>

              <div className="recommendation-card">
                <div className="recommendation-icon">📈</div>
                <div className="recommendation-content">
                  <h4>Próximos Passos</h4>
                  <ul>
                    <li>Revise sua carteira trimestralmente</li>
                    <li>Rebalanceie quando a alocação desviar mais de 5% do alvo</li>
                    <li>Reinvista os dividendos para acelerar o crescimento patrimonial</li>
                    <li>Utilize a Máquina de Renda para identificar novas oportunidades de investimento</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'companies' && (
        <div className="companies-analysis">
          <div className="section company-income-section">
            <h3>Dividendos por Empresa</h3>
            
            <div className="toggle-container">
              <button className="toggle-btn active">Valor Recebido</button>
              <button className="toggle-btn">Yield on Cost (YoC)</button>
            </div>
            
            {chartsLoaded.companies ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={companyData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#AAAAAA' }} />
                  <YAxis 
                    tick={{ fill: '#AAAAAA' }} 
                    tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
                  />
                  <Tooltip content={<CompanyTooltip />} />
                  <Bar dataKey="value" fill="#63BDAB" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-loading">
                <div className="spinner"></div>
                <p>Carregando dados das empresas...</p>
              </div>
            )}
          </div>
          
          <div className="section yoc-section">
            <h3>Yield on Cost (YoC) por Empresa</h3>
            
            {chartsLoaded.companies ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={companyYOCData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#AAAAAA' }} />
                  <YAxis 
                    tick={{ fill: '#AAAAAA' }} 
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip content={<CompanyTooltip />} />
                  <ReferenceLine 
                    y={7.5} 
                    stroke="#FFD700" 
                    strokeDasharray="3 3" 
                    label={{ value: "Média", position: "right", fill: "#FFD700" }} 
                  />
                  <Bar dataKey="value" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-loading">
                <div className="spinner"></div>
                <p>Carregando dados de YoC...</p>
              </div>
            )}
          </div>
          
          <div className="section growth-section">
            <h3>Crescimento de Dividendos por Empresa</h3>
            
            <div className="growth-items">
              {companyGrowthData.map((company) => (
                <div 
                  key={company.ticker} 
                  className={`growth-item ${selectedCompany === company.ticker ? 'expanded' : ''}`}
                  onClick={() => handleSelectCompany(company.ticker)}
                >
                  <div className="growth-header">
                    <span className="company-ticker">{company.ticker}</span>
                    <div 
                      className="growth-bar" 
                      style={{ 
                        width: `${Math.min(Math.max(company.growthPercentage * 3, 10), 80)}%`,
                        backgroundColor: company.growthPercentage > 0 ? '#63BDAB' : '#F44336'
                      }}
                    ></div>
                    <span className="growth-value">{company.growthPercentage.toFixed(2)}%</span>
                    <span className="expand-icon">{selectedCompany === company.ticker ? '▼' : '▲'}</span>
                  </div>
                  
                  {selectedCompany === company.ticker && (
                    <div className="growth-details">
                      <p>
                        Dividendos pagos nos últimos 12 meses: {formatCurrency(company.totalDividends)}
                      </p>
                      <p>
                        Taxa de crescimento anual: {company.growthPercentage.toFixed(2)}%
                      </p>
                      <p>
                        Projeção para os próximos 12 meses: {formatCurrency(company.totalDividends * (1 + company.growthPercentage/100))}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="section company-details">
            <h3>Detalhes de Pagamento por Empresa</h3>
            
            <div className="payment-details">
              <div className="payment-card">
                <h4>BBAS3</h4>
                <div className="payment-info">
                  <div className="payment-row">
                    <span className="payment-label">Próximo Pagamento:</span>
                    <span className="payment-value">10/04/2025</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Valor Esperado:</span>
                    <span className="payment-value">R$ 0,56 por ação</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Data Com:</span>
                    <span className="payment-value">26/03/2025</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Periodicidade:</span>
                    <span className="payment-value">Trimestral</span>
                  </div>
                </div>
              </div>
              
              <div className="payment-card">
                <h4>VALE3</h4>
                <div className="payment-info">
                  <div className="payment-row">
                    <span className="payment-label">Próximo Pagamento:</span>
                    <span className="payment-value">15/06/2025</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Valor Esperado:</span>
                    <span className="payment-value">R$ 1,25 por ação</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Data Com:</span>
                    <span className="payment-value">31/05/2025</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Periodicidade:</span>
                    <span className="payment-value">Semestral</span>
                  </div>
                </div>
              </div>
              
              <div className="payment-card">
                <h4>TASA4</h4>
                <div className="payment-info">
                  <div className="payment-row">
                    <span className="payment-label">Próximo Pagamento:</span>
                    <span className="payment-value">22/05/2025</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Valor Esperado:</span>
                    <span className="payment-value">R$ 0,48 por ação</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Data Com:</span>
                    <span className="payment-value">10/05/2025</span>
                  </div>
                  <div className="payment-row">
                    <span className="payment-label">Periodicidade:</span>
                    <span className="payment-value">Trimestral</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="timeline-analysis">
          <div className="section timeline-section">
            <h3>Evolução de Recebimentos (24 meses)</h3>
            
            {chartsLoaded.timeline ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart
                  data={timelineData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#AAAAAA' }} />
                  <YAxis tick={{ fill: '#AAAAAA' }} tickFormatter={(value) => `R$ ${(value/1000).toFixed(1)}k`} />
                  <Tooltip content={<TimelineTooltip />} />
                  <ReferenceLine 
                    y={2500} 
                    stroke="#FFD700" 
                    strokeDasharray="3 3" 
                    label={{ value: "Meta Mensal", position: "left", fill: "#FFD700" }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#63BDAB" 
                    fill="url(#colorGradient)" 
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#63BDAB" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#63BDAB" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-loading">
                <div className="spinner"></div>
                <p>Carregando timeline de rendimentos...</p>
              </div>
            )}
          </div>
          
          <div className="section distribution-section">
            <h3>Distribuição de Recebimentos por Mês</h3>
            
            {chartsLoaded.timeline ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={distributionData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" tick={{ fill: '#AAAAAA' }} />
                  <YAxis 
                    tick={{ fill: '#AAAAAA' }} 
                    tickFormatter={(value) => `R$ ${(value/1000).toFixed(1)}k`}
                  />
                  <Tooltip content={<TimelineTooltip />} />
                  <ReferenceLine 
                    y={2100} 
                    stroke="#FFD700" 
                    strokeDasharray="3 3" 
                    label={{ value: "Meta Mensal", position: "right", fill: "#FFD700" }} 
                  />
                  <Bar dataKey="value" fill="#FFBB28" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-loading">
                <div className="spinner"></div>
                <p>Carregando dados de distribuição...</p>
              </div>
            )}
          </div>
          
          <div className="section stats-section">
            <h3>Estatísticas dos Recebimentos</h3>
            
            <div className="stats-grid">
              <div className="stat-card">
                <h4>Média Mensal</h4>
                <div className="stat-value">R$ 2.183,25</div>
                <div className="stat-change positive">+12,8% vs. ano anterior</div>
              </div>
              
              <div className="stat-card">
                <h4>Maior Mês</h4>
                <div className="stat-value">R$ 5.487,93</div>
                <div className="stat-meta">Dezembro/2024</div>
              </div>
              
              <div className="stat-card">
                <h4>Menor Mês</h4>
                <div className="stat-value">R$ 642,15</div>
                <div className="stat-meta">Fevereiro/2024</div>
              </div>
              
              <div className="stat-card">
                <h4>Previsão Anual</h4>
                <div className="stat-value">R$ 26.199,00</div>
                <div className="stat-change positive">+15,3% vs. ano anterior</div>
              </div>
              
              <div className="stat-card">
                <h4>Meses Acima da Meta</h4>
                <div className="stat-value">6 de 12</div>
                <div className="stat-progress">
                  <div className="progress-bar" style={{ width: '50%' }}></div>
                </div>
              </div>
              
              <div className="stat-card">
                <h4>Crescimento Médio</h4>
                <div className="stat-value">1,8%</div>
                <div className="stat-meta">ao mês</div>
              </div>
            </div>
          </div>
          
          <div className="section calendar-section">
            <h3>Calendário de Pagamentos - 2025</h3>
            
            <div className="payment-calendar">
              <div className="calendar-row">
                {MONTHS.slice(0, 6).map((month, index) => (
                  <div key={index} className={`calendar-month ${index < 3 ? 'received' : ''}`}>
                    <div className="month-name">{month}</div>
                    {index < 3 && <div className="check-mark">✓</div>}
                    <div className="month-companies">
                      {index === 0 && <span className="company-tag">BBAS3</span>}
                      {index === 1 && <span className="company-tag">TASA4</span>}
                      {index === 2 && (
                        <>
                          <span className="company-tag">BBAS3</span>
                          <span className="company-tag">VALE3</span>
                        </>
                      )}
                      {index === 3 && <span className="company-tag">TASA4</span>}
                      {index === 5 && <span className="company-tag">BBAS3</span>}
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="calendar-row">
                {MONTHS.slice(6, 12).map((month, index) => (
                  <div key={index + 6} className="calendar-month">
                    <div className="month-name">{month}</div>
                    <div className="month-companies">
                      {index === 0 && <span className="company-tag">TASA4</span>}
                      {index === 2 && <span className="company-tag">BBAS3</span>}
                      {index === 3 && <span className="company-tag">VALE3</span>}
                      {index === 5 && (
                        <>
                          <span className="company-tag">BBAS3</span>
                          <span className="company-tag">TASA4</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedPortfolio;