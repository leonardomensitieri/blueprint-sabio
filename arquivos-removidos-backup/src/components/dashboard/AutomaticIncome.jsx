import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import './AutomaticIncome.css';

const AutomaticIncome = ({ portfolioData, fixedIncomeData }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [flowPeriod, setFlowPeriod] = useState('todo');
  const [flowComparisonType, setFlowComparisonType] = useState('media');
  const [comparisonMenuOpen, setComparisonMenuOpen] = useState(false);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [expandedStock, setExpandedStock] = useState(null);
  const [incomeStats, setIncomeStats] = useState({
    total: 0,
    received: 0,
    toReceive: 0,
    projected: 0,
    growth: 0,
    monthlyAverage: 0,
    lastYearTotal: 0
  });
  const [calendarData, setCalendarData] = useState([]);
  const [monthlyIncomeData, setMonthlyIncomeData] = useState([]);
  const [renderMode, setRenderMode] = useState('dividendos'); // 'dividendos' ou 'yoc'
  const [selectedPeriod, setSelectedPeriod] = useState('2025');
  const [periodMenuOpen2, setPeriodMenuOpen2] = useState(false);
  const [dividendGrowth, setDividendGrowth] = useState([]);
  
  // Removed unused COLORS array
  
  const YEARS = ['2022', '2023', '2024', '2025', '2026'];

  // Definir as funções de processamento dentro do componente
  // e depois memoizá-las com useCallback
  const processPortfolioData = useCallback(() => {
    setIsLoading(true);
    // Using fixedIncomeData to integrate with stocks income
    try {
      // Processar dados do portfólio de ações
      const processStockData = () => {
        // Calcular valores por ano para o gráfico de barras de fluxo (baseado nos dividendos das ações)
        const baseStockValues = {
          '2022': 186940.59,
          '2023': 226524.34,
          '2024': 248009.15,
          '2025': 298902.51,
          '2026': 338746.18
        };
        
        return baseStockValues;
      };
      
      // Processar dados de renda fixa
      const processFixedIncomeData = () => {
        const hasFixedIncomeData = fixedIncomeData && fixedIncomeData.totalValue > 0;
        
        // Se não tiver dados, retorna valores zerados
        if (!hasFixedIncomeData) {
          return {
            '2022': 0,
            '2023': 0, 
            '2024': 0,
            '2025': 0,
            '2026': 0
          };
        }
        
        // Calcular renda anual baseada nos dados de renda fixa
        const annualIncome = fixedIncomeData.annualIncome || 
          (fixedIncomeData.totalValue * fixedIncomeData.annualReturn);
        
        // Projeção de crescimento de 3% ao ano para renda fixa
        return {
          '2022': annualIncome * 0.94, // Valores menores para anos anteriores
          '2023': annualIncome * 0.97,
          '2024': annualIncome,
          '2025': annualIncome * 1.03, // Projeção com crescimento
          '2026': annualIncome * 1.06
        };
      };
      
      // Combinar dados de ações e renda fixa
      const stockValues = processStockData();
      const fixedIncomeValues = processFixedIncomeData();
      
      // Somar os valores para cada ano
      const combinedYearlyValues = {};
      Object.keys(stockValues).forEach(year => {
        combinedYearlyValues[year] = stockValues[year] + (fixedIncomeValues[year] || 0);
      });
      
      // Criar dados para o gráfico de barras anual
      const yearlyData = Object.keys(combinedYearlyValues).map(year => ({
        name: year,
        value: combinedYearlyValues[year],
        stockValue: stockValues[year],
        fixedIncomeValue: fixedIncomeValues[year] || 0,
        status: parseInt(year) <= 2024 ? 'received' : 'projected'
      }));
      
      setMonthlyIncomeData(yearlyData);
      
      // Criar distribuição de crescimento de dividendos baseada no portfólio real
      const stockGrowth = [
        { ticker: 'AESB3', growthPercentage: 0.08, totalDividends: 231.30 },
        { ticker: 'TASA4', growthPercentage: 0.55, totalDividends: 1517.29 },
        { ticker: 'VALE3', growthPercentage: 2.08, totalDividends: 5682.06 },
        { ticker: 'BBAS3', growthPercentage: 97.27, totalDividends: 264954.73 }
      ].sort((a, b) => a.growthPercentage - b.growthPercentage);
      
      // Adicionar "Renda Fixa" como um item de crescimento se houver dados
      if (fixedIncomeData && fixedIncomeData.totalValue > 0) {
        stockGrowth.push({
          ticker: 'Renda Fixa',
          growthPercentage: 3.0, // Crescimento fixo de 3% para renda fixa
          totalDividends: fixedIncomeData.annualIncome || 
            (fixedIncomeData.totalValue * fixedIncomeData.annualReturn)
        });
      }
      
      setDividendGrowth(stockGrowth);
      
      // Calcular crescimento geral (média ponderada)
      let totalDividends = 0;
      let weightedGrowthSum = 0;
      
      stockGrowth.forEach(stock => {
        totalDividends += stock.totalDividends;
        weightedGrowthSum += stock.growthPercentage * stock.totalDividends;
      });
      
      const weightedGrowth = totalDividends > 0 ? 
        (weightedGrowthSum / totalDividends) : 2.50;
      
      // Calcular valores consolidados incluindo renda fixa
      const totalFixedIncome = fixedIncomeData ? 
        (fixedIncomeData.annualIncome || 0) : 0;
      
      const currentYear = new Date().getFullYear();
      const currentYearIndex = yearlyData.findIndex(item => item.name === currentYear.toString());
      const currentYearData = currentYearIndex >= 0 ? yearlyData[currentYearIndex] : { value: 0 };
      
      // Atualizar estados com valores combinados
      setIncomeStats({
        total: currentYearData.value || 63578.80,
        received: currentYearData.value || 63578.80,
        toReceive: 0,
        projected: yearlyData.find(item => item.name === '2025')?.value || 298902.51,
        growth: weightedGrowth.toFixed(2),
        monthlyAverage: (currentYearData.value / 12) || 21005.90,
        lastYearTotal: yearlyData.find(item => item.name === '2024')?.value || 252070.84
      });
      
      // Criar dados para o mini calendário - distribuição mensal com renda fixa
      const monthlyFixedIncome = fixedIncomeData ? 
        (fixedIncomeData.monthlyIncome || fixedIncomeData.annualIncome / 12) : 0;
      
      const currentMonth = new Date().getMonth();
      
      const monthStatus = [
        {month: 'Janeiro', status: currentMonth >= 0 ? 'received' : 'pending', value: 5298.23 + (currentMonth >= 0 ? monthlyFixedIncome : 0)},
        {month: 'Fevereiro', status: currentMonth >= 1 ? 'received' : 'pending', value: 5298.23 + (currentMonth >= 1 ? monthlyFixedIncome : 0)},
        {month: 'Março', status: currentMonth >= 2 ? 'received' : 'pending', value: 63578.80 + (currentMonth >= 2 ? monthlyFixedIncome : 0)},
        {month: 'Abril', status: currentMonth >= 3 ? 'received' : 'pending', value: currentMonth >= 3 ? monthlyFixedIncome : 0},
        {month: 'Maio', status: currentMonth >= 4 ? 'received' : 'pending', value: currentMonth >= 4 ? monthlyFixedIncome : 0},
        {month: 'Junho', status: currentMonth >= 5 ? 'received' : 'pending', value: currentMonth >= 5 ? monthlyFixedIncome : 0},
        {month: 'Julho', status: currentMonth >= 6 ? 'received' : 'pending', value: currentMonth >= 6 ? monthlyFixedIncome : 0},
        {month: 'Agosto', status: currentMonth >= 7 ? 'received' : 'pending', value: currentMonth >= 7 ? monthlyFixedIncome : 0},
        {month: 'Setembro', status: currentMonth >= 8 ? 'received' : 'pending', value: currentMonth >= 8 ? monthlyFixedIncome : 0},
        {month: 'Outubro', status: currentMonth >= 9 ? 'received' : 'pending', value: currentMonth >= 9 ? monthlyFixedIncome : 0},
        {month: 'Novembro', status: currentMonth >= 10 ? 'received' : 'pending', value: currentMonth >= 10 ? monthlyFixedIncome : 0},
        {month: 'Dezembro', status: currentMonth >= 11 ? 'received' : 'pending', value: currentMonth >= 11 ? monthlyFixedIncome : 0}
      ];
      
      setCalendarData(monthStatus);
    } catch (error) {
      console.error('Erro ao processar dados de portfólio:', error);
      // Recursive call removed to prevent infinite loop
    } finally {
      setIsLoading(false);
    }
  }, [fixedIncomeData]);
  
  const processExampleData = useCallback(() => {
    // Simply call processPortfolioData as it already contains sample data
    processPortfolioData();
  }, [processPortfolioData]);

  useEffect(() => {
    if (portfolioData && portfolioData.length > 0) {
      processPortfolioData();
    } else {
      // Usar dados de exemplo caso não tenha portfólio
      processExampleData();
    }
  }, [
    portfolioData, 
    fixedIncomeData, 
    flowPeriod, 
    flowComparisonType, 
    renderMode, 
    selectedPeriod, 
    processPortfolioData, 
    processExampleData
  ]);

  
  // Formatar valores monetários
  const formatCurrency = (value) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Componente para tooltip personalizado no gráfico de barras
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="income-tooltip">
          <p className="tooltip-year">{label}</p>
          <p className="tooltip-label">Total: {formatCurrency(data.value)}</p>
          <p className="tooltip-detail">
            <span className="tooltip-color-dot" style={{ backgroundColor: '#63BDAB' }}></span>
            Ações: {formatCurrency(data.stockValue)}
          </p>
          <p className="tooltip-detail">
            <span className="tooltip-color-dot" style={{ backgroundColor: '#FFB347' }}></span>
            Renda fixa: {formatCurrency(data.fixedIncomeValue)}
          </p>
          <p className="tooltip-status">
            {data.status === 'received' ? 'Recebido' : 'A receber'}
          </p>
        </div>
      );
    }
    return null;
  };
  
  // Removed unused formatPercentage function
  
  // Determinar classe CSS com base no crescimento (positivo/negativo)
  const getGrowthClass = (growth) => {
    if (growth > 10) return 'growth-high-positive';
    if (growth > 0) return 'growth-positive';
    if (growth > -10) return 'growth-negative';
    return 'growth-high-negative';
  };
  
  // Toggle para expandir/colapsar detalhes de crescimento
  const toggleExpandStock = (ticker) => {
    if (expandedStock === ticker) {
      setExpandedStock(null);
    } else {
      setExpandedStock(ticker);
    }
  };
  
  // Toggle para alternar entre visualizações
  const toggleRenderMode = (mode) => {
    setRenderMode(mode);
  };
  
  // Alternar tipo de comparação (média ou meta)
  const toggleComparisonType = (type) => {
    setFlowComparisonType(type);
    setComparisonMenuOpen(false);
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando dados de renda automática...</p>
      </div>
    );
  }

  return (
    <div className="automatic-income">
      {/* Seção 1: Fluxo de Renda Automática */}
      <section className="section flow-section">
        <h2>Fluxo de renda</h2>
        
        <div className="flow-controls">
          <div className="flow-dropdown">
            <button 
              className="dropdown-btn"
              onClick={() => setComparisonMenuOpen(!comparisonMenuOpen)}
            >
              {flowComparisonType === 'media' ? 'Comparar com a média' : 'Comparar com a meta'}
              <span className="arrow-down">▼</span>
            </button>
            {comparisonMenuOpen && (
              <div className="dropdown-content">
                <div className="dropdown-item" onClick={() => toggleComparisonType('media')}>
                  Média recebida
                </div>
                <div className="dropdown-item" onClick={() => toggleComparisonType('media_periodo')}>
                  Média do valor recebido no período
                </div>
                <div className="dropdown-item" onClick={() => toggleComparisonType('meta')}>
                  Meta de renda
                </div>
                <div className="dropdown-item" onClick={() => toggleComparisonType('valor')}>
                  Valor definido que você deseja receber
                </div>
                <div className="dropdown-item" onClick={() => toggleComparisonType('nenhum')}>
                  Nenhum
                </div>
              </div>
            )}
          </div>
          
          <div className="flow-dropdown period-dropdown">
            <button 
              className="dropdown-btn"
              onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
            >
              Todo o período
              <span className="arrow-down">▼</span>
            </button>
            {periodMenuOpen && (
              <div className="dropdown-content">
                <div className="dropdown-item" onClick={() => {setFlowPeriod('todo'); setPeriodMenuOpen(false);}}>
                  Todo o período
                </div>
                <div className="dropdown-item" onClick={() => {setFlowPeriod('12meses'); setPeriodMenuOpen(false);}}>
                  Últimos 12 meses
                </div>
                <div className="dropdown-item" onClick={() => {setFlowPeriod('2026'); setPeriodMenuOpen(false);}}>
                  2026
                </div>
                <div className="dropdown-item" onClick={() => {setFlowPeriod('2025'); setPeriodMenuOpen(false);}}>
                  2025
                </div>
                <div className="dropdown-item" onClick={() => {setFlowPeriod('2024'); setPeriodMenuOpen(false);}}>
                  2024
                </div>
                <div className="dropdown-item" onClick={() => {setFlowPeriod('2023'); setPeriodMenuOpen(false);}}>
                  2023
                </div>
                <div className="dropdown-item" onClick={() => {setFlowPeriod('2022'); setPeriodMenuOpen(false);}}>
                  2022
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flow-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={monthlyIncomeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#AAAAAA' }} />
              <YAxis 
                tick={{ fill: '#AAAAAA' }} 
                tickFormatter={(value) => `R$ ${(value/1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              {flowComparisonType !== 'nenhum' && (
                <ReferenceLine 
                  y={252070.84} 
                  label={{ 
                    value: flowComparisonType === 'media' ? "Média" : "Meta", 
                    fill: "#FFD700",
                    position: "right" 
                  }} 
                  stroke="#FFD700" 
                />
              )}
              <Bar 
                name="Renda Fixa" 
                dataKey="fixedIncomeValue" 
                stackId="a" 
                fill="#FFB347"
              />
              <Bar 
                name="Ações" 
                dataKey="stockValue" 
                stackId="a" 
                fill="#63BDAB"
              >
                {monthlyIncomeData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.status === 'received' ? '#63BDAB' : '#4FA599'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      
      <div className="income-details-container">
        <section className="section income-details">
          <div className="income-total">
            <h3>Total previsto para 2025</h3>
            <div className="amount">{formatCurrency(incomeStats.total)}</div>
            
            <div className="income-sources">
              <div className="income-source">
                <div className="source-color" style={{ backgroundColor: '#63BDAB' }}></div>
                <span className="source-label">Ações</span>
                <span className="source-value">
                  {formatCurrency(monthlyIncomeData.find(item => item.name === '2025')?.stockValue || 0)}
                </span>
              </div>
              <div className="income-source">
                <div className="source-color" style={{ backgroundColor: '#FFB347' }}></div>
                <span className="source-label">Renda Fixa</span>
                <span className="source-value">
                  {formatCurrency(monthlyIncomeData.find(item => item.name === '2025')?.fixedIncomeValue || 0)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="status-cards">
            <div className="status-card">
              <div className="status-dot received"></div>
              <span className="status-label">Recebido</span>
              <span className="status-value">{formatCurrency(incomeStats.received)}</span>
            </div>
            <div className="status-card">
              <div className="status-dot to-receive"></div>
              <span className="status-label">A receber</span>
              <span className="status-value">{formatCurrency(incomeStats.toReceive)}</span>
            </div>
            <div className="status-card">
              <div className="status-dot projected"></div>
              <span className="status-label">Projetado</span>
              <span className="status-value">{formatCurrency(incomeStats.projected)}</span>
            </div>
          </div>
          
          <div className="month-calendar">
            <div className="calendar-row">
              {calendarData.slice(0, 6).map((month, index) => (
                <div key={index} className={`calendar-month ${month.status}`}>
                  <div className="month-name">{month.month.substring(0, 3)}</div>
                  {month.status === 'received' && <div className="check-mark">✓</div>}
                  <div className="month-value">{month.value > 0 ? formatCurrency(month.value) : 'Sem previsão'}</div>
                </div>
              ))}
            </div>
            <div className="calendar-row">
              {calendarData.slice(6, 12).map((month, index) => (
                <div key={index + 6} className={`calendar-month ${month.status}`}>
                  <div className="month-name">{month.month.substring(0, 3)}</div>
                  {month.status === 'received' && <div className="check-mark">✓</div>}
                  <div className="month-value">{month.value > 0 ? formatCurrency(month.value) : 'Sem previsão'}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="extrato-link">
            <span>Extrato</span>
            <button className="view-details link-button">Ver detalhes ➔</button>
          </div>
        </section>
        
        {/* Seção 4: Renda dos Últimos 12 Meses */}
        <section className="section income-summary">
          <h2>Renda dos últimos 12 meses</h2>
          
          <div className="income-summary-data">
            <div className="summary-item">
              <span className="summary-label">Acumulado</span>
              <span className="summary-value">{formatCurrency(incomeStats.lastYearTotal)}</span>
            </div>
            <div className="summary-item">
              <span className="summary-label">Média mensal</span>
              <span className="summary-value">{formatCurrency(incomeStats.monthlyAverage)}</span>
            </div>
          </div>
          
          <div className="goal-section">
            <div className="goal-tooltip">
              <span className="tooltip-title">Próxima meta</span>
              <span className="tooltip-year">2025</span>
              <span className="tooltip-value">{formatCurrency(52415.00)}</span>
            </div>
            
            <div className="year-blocks">
              {YEARS.map((year, index) => (
                <div 
                  key={index} 
                  className={`year-block ${parseInt(year) < 2025 ? 'completed' : parseInt(year) === 2025 ? 'current' : ''}`}
                >
                  {year}
                </div>
              ))}
            </div>
            
            <div className="current-goal">
              <span className="goal-year">2025</span>
              <span className="goal-amount">{formatCurrency(52415.00)}</span>
            </div>
          </div>
          
          <div className="goal-charts">
            <div className="goal-chart">
              <div className="chart-container">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Realizado', value: 10.11 },
                        { name: 'Pendente', value: 89.89 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={55}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#FF9F67" />
                      <Cell fill="#E0E0E0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-label">10,11%</div>
              </div>
              <div className="chart-title">Meta 2025</div>
            </div>
            
            <div className="goal-chart">
              <div className="chart-container">
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Realizado', value: 40.07 },
                        { name: 'Pendente', value: 59.93 }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={55}
                      startAngle={90}
                      endAngle={-270}
                      dataKey="value"
                    >
                      <Cell fill="#FFD67F" />
                      <Cell fill="#E0E0E0" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="chart-label">40,07%</div>
              </div>
              <div className="chart-title">Meta 2025</div>
            </div>
          </div>
          
          <button className="adjust-goal-btn">Ajustar meta de renda</button>
        </section>
      </div>
      
      {/* Seção 2: Máquina Automática de Renda */}
      <section className="section income-machine-section">
        <h2>Renda por empresa</h2>
        
        <div className="income-machine-controls">
          <div className="view-toggle">
            <button 
              className={`toggle-btn ${renderMode === 'dividendos' ? 'active' : ''}`}
              onClick={() => toggleRenderMode('dividendos')}
            >
              Dividendos
            </button>
            <button 
              className={`toggle-btn ${renderMode === 'yoc' ? 'active' : ''}`}
              onClick={() => toggleRenderMode('yoc')}
            >
              Retorno sobre o capital investido (YOC)
            </button>
          </div>
          
          <div className="period-dropdown">
            <button 
              className="dropdown-btn"
              onClick={() => setPeriodMenuOpen2(!periodMenuOpen2)}
            >
              {selectedPeriod}
              <span className="arrow-down">▼</span>
            </button>
            {periodMenuOpen2 && (
              <div className="dropdown-content right-aligned">
                <div className="dropdown-item" onClick={() => {setSelectedPeriod('todo'); setPeriodMenuOpen2(false);}}>
                  Todo o período
                </div>
                <div className="dropdown-item" onClick={() => {setSelectedPeriod('12meses'); setPeriodMenuOpen2(false);}}>
                  Últimos 12 meses
                </div>
                <div className="dropdown-item" onClick={() => {setSelectedPeriod('2026'); setPeriodMenuOpen2(false);}}>
                  2026
                </div>
                <div className="dropdown-item" onClick={() => {setSelectedPeriod('2025'); setPeriodMenuOpen2(false);}}>
                  2025
                </div>
                <div className="dropdown-item" onClick={() => {setSelectedPeriod('2024'); setPeriodMenuOpen2(false);}}>
                  2024
                </div>
                <div className="dropdown-item" onClick={() => {setSelectedPeriod('2023'); setPeriodMenuOpen2(false);}}>
                  2023
                </div>
                <div className="dropdown-item" onClick={() => {setSelectedPeriod('2022'); setPeriodMenuOpen2(false);}}>
                  2022
                </div>
              </div>
            )}
          </div>
        </div>
        
        {renderMode === 'yoc' && (
          <div className="yoc-heading">
            <h3>YoC Carteira 12,31%</h3>
          </div>
        )}
        
        <div className="income-chart">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={renderMode === 'dividendos' ? [
                { name: 'BBAS3', value: 294932.97, received: 81511.37 },
                { name: 'VALE3', value: 3969.53, received: 2067.43 },
                { name: 'TASA4', value: 1517.29, received: 543.15 },
                { name: 'AESB3', value: 231.30, received: 112.45 },
                { 
                  name: 'Renda Fixa', 
                  value: fixedIncomeData ? fixedIncomeData.annualIncome : 4250,
                  received: fixedIncomeData ? 
                    (new Date().getMonth() / 12 * fixedIncomeData.annualIncome) : 
                    (new Date().getMonth() / 12 * 4250)
                }
              ] : [
                { name: 'BBAS3', value: 12.25 },
                { name: 'VALE3', value: 6.81 },
                { name: 'TASA4', value: 2.28 },
                { name: 'AESB3', value: 0.08 },
                { 
                  name: 'Renda Fixa', 
                  value: fixedIncomeData ? (fixedIncomeData.annualReturn * 100) : 8.50
                }
              ]}
              margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" tick={{ fill: '#AAAAAA' }} />
              <YAxis 
                tick={{ fill: '#AAAAAA' }} 
                tickFormatter={(value) => renderMode === 'dividendos' 
                  ? `R$ ${(value/1000).toFixed(0)}k` 
                  : `${value}%`
                }
              />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (renderMode === 'dividendos') {
                    if (name === 'received') {
                      return [formatCurrency(value), 'Recebido'];
                    }
                    return [formatCurrency(value), 'Total'];
                  } else {
                    return [`${value.toFixed(2)}%`, 'YoC'];
                  }
                }}
                labelFormatter={(label) => `${label}`}
              />
              <Bar 
                dataKey="value" 
                fill={props => props.payload.name === 'Renda Fixa' ? '#FFB347' : '#63BDAB'}
              >
                {renderMode === 'dividendos' && 
                  <Bar 
                    dataKey="received" 
                    fill={props => props.payload.name === 'Renda Fixa' ? '#E69124' : '#3D8B7B'} 
                  />
                }
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          
          {renderMode === 'dividendos' && (
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#63BDAB' }}></div>
                <span className="legend-label">Total projetado</span>
              </div>
              <div className="legend-item">
                <div className="legend-color" style={{ backgroundColor: '#3D8B7B' }}></div>
                <span className="legend-label">Recebido até o momento</span>
              </div>
            </div>
          )}
        </div>
      </section>
      
      {/* Seção 3: Crescimento dos Dividendos */}
      <section className="section growth-section">
        <h2>Crescimento dos dividendos nos últimos 12 meses</h2>
        
        <div className="growth-value">
          <span className={getGrowthClass(incomeStats.growth)}>
            {incomeStats.growth}%
          </span>
        </div>
        
        <div className="growth-by-company">
          {dividendGrowth.map((stock) => (
            <div key={stock.ticker} className="company-growth-item">
              <div className="growth-header" onClick={() => toggleExpandStock(stock.ticker)}>
                <div className="company-ticker">{stock.ticker}</div>
                <div 
                  className="growth-bar" 
                  style={{ 
                    width: `${Math.min(Math.abs(stock.growthPercentage) * 200, 90)}%`,
                    backgroundColor: stock.growthPercentage >= 0 ? '#63BDAB' : '#F44336'
                  }}
                ></div>
                <div className="growth-percentage">
                  {stock.growthPercentage.toFixed(2)}%
                </div>
                <div className="expand-icon">
                  {expandedStock === stock.ticker ? '▼' : '▲'}
                </div>
              </div>
              
              {expandedStock === stock.ticker && (
                <div className="growth-details">
                  <p>
                    {stock.ticker === 'Renda Fixa' 
                      ? `Seus rendimentos de Renda Fixa cresceram ${stock.growthPercentage.toFixed(2)}% nos últimos 12 meses, totalizando ${formatCurrency(stock.totalDividends)}. Os rendimentos de renda fixa são considerados mais previsíveis e estáveis que dividendos de ações.`
                      : stock.growthPercentage >= 0 
                        ? `Seus dividendos de ${stock.ticker} cresceram ${stock.ticker === 'AESB3' ? '23.029,66%' : stock.ticker === 'VALE3' ? '568.106,02%' : stock.ticker === 'BBAS3' ? '2,68%' : stock.growthPercentage + '%'} nos últimos 12 meses, totalizando ${formatCurrency(stock.totalDividends)}.`
                        : `Seus dividendos de ${stock.ticker} caíram -80,28% nos últimos 12 meses, totalizando ${formatCurrency(stock.totalDividends)}.`
                    }
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AutomaticIncome;