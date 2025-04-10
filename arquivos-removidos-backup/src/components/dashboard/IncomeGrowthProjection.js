import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { projectIncomeGrowth, formatCurrency } from '../../services/financialCalculations';
import './IncomeGrowthProjection.css';

const IncomeGrowthProjection = ({ portfolioData }) => {
  const { currentUser } = useAuth();
  const [initialInvestment, setInitialInvestment] = useState(0);
  const [currentIncome, setCurrentIncome] = useState(0);
  const [monthlyContribution, setMonthlyContribution] = useState(1000);
  const [projectionYears, setProjectionYears] = useState(10);
  const [averageYield, setAverageYield] = useState(5);
  const [growthRate, setGrowthRate] = useState(3);
  const [reinvestDividends, setReinvestDividends] = useState(false);
  
  const [projectionData, setProjectionData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar dados do portfólio
  useEffect(() => {
    const loadPortfolioData = async () => {
      setIsLoading(true);
      try {
        // Se recebeu dados direto via props, use-os
        if (portfolioData) {
          const totalInvestment = portfolioData.reduce((sum, stock) => sum + stock.totalValue, 0);
          const totalIncome = portfolioData.reduce((sum, stock) => sum + stock.expectedIncome, 0);
          
          setInitialInvestment(totalInvestment);
          setCurrentIncome(totalIncome);
        } else if (currentUser) {
          // Caso contrário, carregue do Firestore
          const db = getFirestore();
          const userStocksRef = doc(db, 'portfolios', currentUser.uid);
          const userStocksDoc = await getDoc(userStocksRef);
          
          if (userStocksDoc.exists() && userStocksDoc.data().stocks) {
            const stocks = userStocksDoc.data().stocks;
            const totalInvestment = stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
            const totalIncome = stocks.reduce((sum, stock) => sum + stock.expectedIncome, 0);
            
            setInitialInvestment(totalInvestment);
            setCurrentIncome(totalIncome);
          } else {
            // Valores padrão se não houver dados
            setInitialInvestment(100000);
            setCurrentIncome(5000);
          }
        } else {
          // Valores padrão para usuários não logados
          setInitialInvestment(100000);
          setCurrentIncome(5000);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do portfólio:', error);
        // Valores padrão em caso de erro
        setInitialInvestment(100000);
        setCurrentIncome(5000);
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolioData();
  }, [currentUser, portfolioData]);

  // Calcular projeção quando os parâmetros mudarem
  useEffect(() => {
    if (initialInvestment > 0) {
      calculateProjection();
    }
  }, [initialInvestment, currentIncome, monthlyContribution, projectionYears, averageYield, growthRate, reinvestDividends]);

  const calculateProjection = () => {
    const projection = projectIncomeGrowth({
      initialInvestment,
      currentIncome,
      monthlyContribution,
      years: projectionYears,
      averageYield,
      growthRate,
      reinvestDividends
    });
    
    setProjectionData(projection);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    switch (name) {
      case 'monthlyContribution':
        setMonthlyContribution(parseFloat(value) || 0);
        break;
      case 'projectionYears':
        setProjectionYears(parseInt(value) || 10);
        break;
      case 'averageYield':
        setAverageYield(parseFloat(value) || 0);
        break;
      case 'growthRate':
        setGrowthRate(parseFloat(value) || 0);
        break;
      case 'reinvestDividends':
        setReinvestDividends(e.target.checked);
        break;
      default:
        break;
    }
  };

  // Calcular a meta de renda mensal (usando o último valor da projeção como referência)
  const calculateIncomeGoal = () => {
    if (projectionData.length === 0) return 0;
    
    // Meta de renda: último valor da projeção multiplicado por 1.5
    return projectionData[projectionData.length - 1].monthlyIncome * 1.5;
  };

  // Para o tooltip personalizado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="tooltip-year">Ano: {label}</p>
          <p className="tooltip-investment">
            Capital Total: {formatCurrency(payload[0].payload.totalInvestment)}
          </p>
          <p className="tooltip-income">
            Renda Anual: {formatCurrency(payload[0].payload.annualIncome)}
          </p>
          <p className="tooltip-income">
            Renda Mensal: {formatCurrency(payload[0].payload.monthlyIncome)}
          </p>
          <p className="tooltip-yield">
            Yield Médio: {payload[0].payload.yield.toFixed(2)}%
          </p>
          <p className="tooltip-cumulative">
            Renda Acumulada: {formatCurrency(payload[0].payload.cumulativeIncome)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="income-growth-projection">
      <h2>Projeção de Crescimento da Renda</h2>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Carregando dados do portfólio...</p>
        </div>
      ) : (
        <>
          <div className="projection-inputs">
            <div className="input-header">
              <h3>Parâmetros de Projeção</h3>
              <p className="input-description">
                Ajuste os parâmetros abaixo para simular diferentes cenários de crescimento.
              </p>
            </div>
            
            <div className="current-values">
              <div className="value-card">
                <span className="label">Capital Atual</span>
                <span className="value">{formatCurrency(initialInvestment)}</span>
              </div>
              
              <div className="value-card">
                <span className="label">Renda Anual Atual</span>
                <span className="value">{formatCurrency(currentIncome)}</span>
              </div>
              
              <div className="value-card">
                <span className="label">Renda Mensal Atual</span>
                <span className="value">{formatCurrency(currentIncome / 12)}</span>
              </div>
              
              <div className="value-card">
                <span className="label">Yield Médio Atual</span>
                <span className="value">
                  {initialInvestment > 0 ? ((currentIncome / initialInvestment) * 100).toFixed(2) : 0}%
                </span>
              </div>
            </div>
            
            <div className="input-grid">
              <div className="input-group">
                <label htmlFor="monthlyContribution">Aporte Mensal (R$)</label>
                <input
                  type="number"
                  id="monthlyContribution"
                  name="monthlyContribution"
                  value={monthlyContribution}
                  onChange={handleInputChange}
                  min="0"
                  step="100"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="projectionYears">Anos de Projeção</label>
                <input
                  type="number"
                  id="projectionYears"
                  name="projectionYears"
                  value={projectionYears}
                  onChange={handleInputChange}
                  min="1"
                  max="30"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="averageYield">Yield Médio Esperado (%)</label>
                <input
                  type="number"
                  id="averageYield"
                  name="averageYield"
                  value={averageYield}
                  onChange={handleInputChange}
                  min="0"
                  max="20"
                  step="0.1"
                />
              </div>
              
              <div className="input-group">
                <label htmlFor="growthRate">Crescimento Anual de Dividendos (%)</label>
                <input
                  type="number"
                  id="growthRate"
                  name="growthRate"
                  value={growthRate}
                  onChange={handleInputChange}
                  min="0"
                  max="15"
                  step="0.1"
                />
              </div>
              
              <div className="input-group checkbox">
                <label htmlFor="reinvestDividends">
                  <input
                    type="checkbox"
                    id="reinvestDividends"
                    name="reinvestDividends"
                    checked={reinvestDividends}
                    onChange={handleInputChange}
                  />
                  <span>Reinvestir Dividendos</span>
                </label>
              </div>
            </div>
          </div>
          
          <div className="projection-chart-container">
            <h3>Evolução da Renda Passiva</h3>
            <ResponsiveContainer width="100%" height={400}>
              <LineChart
                data={projectionData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 10
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="year" 
                  tick={{ fill: '#AAAAAA' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                />
                <YAxis 
                  tick={{ fill: '#AAAAAA' }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.2)' }}
                  tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <ReferenceLine 
                  y={calculateIncomeGoal()} 
                  label={{ 
                    value: "Meta de Renda", 
                    position: "top", 
                    fill: "#FFD166" 
                  }} 
                  stroke="#FFD166" 
                  strokeDasharray="3 3" 
                />
                <Line
                  name="Renda Anual"
                  type="monotone"
                  dataKey="annualIncome"
                  stroke="#4CAF50"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  name="Capital Total"
                  type="monotone"
                  dataKey="totalInvestment"
                  stroke="#3F51B5"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          <div className="projection-summary">
            <h3>Resumo da Projeção</h3>
            
            <div className="summary-cards">
              <div className="summary-card">
                <h4>Capital em {projectionYears} anos</h4>
                <p className="summary-value">
                  {formatCurrency(projectionData[projectionData.length - 1]?.totalInvestment || 0)}
                </p>
                <p className="summary-text">
                  Crescimento de {(((projectionData[projectionData.length - 1]?.totalInvestment || 0) / initialInvestment) - 1) * 100}%
                </p>
              </div>
              
              <div className="summary-card highlight">
                <h4>Renda Mensal em {projectionYears} anos</h4>
                <p className="summary-value">
                  {formatCurrency(projectionData[projectionData.length - 1]?.monthlyIncome || 0)}
                </p>
                <p className="summary-text">
                  {initialInvestment > 0 
                    ? `${((projectionData[projectionData.length - 1]?.monthlyIncome || 0) / (currentIncome / 12)).toFixed(1)}x a renda atual`
                    : 'Crescimento significativo de renda passiva'}
                </p>
              </div>
              
              <div className="summary-card">
                <h4>Renda Total Acumulada</h4>
                <p className="summary-value">
                  {formatCurrency(projectionData[projectionData.length - 1]?.cumulativeIncome || 0)}
                </p>
                <p className="summary-text">
                  Total de dividendos recebidos no período
                </p>
              </div>
              
              <div className="summary-card">
                <h4>Yield Médio Final</h4>
                <p className="summary-value">
                  {(projectionData[projectionData.length - 1]?.yield || 0).toFixed(2)}%
                </p>
                <p className="summary-text">
                  {reinvestDividends 
                    ? 'Com reinvestimento de dividendos' 
                    : 'Sem reinvestimento, apenas crescimento natural'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="projection-info">
            <h3>Sobre Estratégias de Crescimento de Renda</h3>
            <p>
              Esta projeção segue a filosofia de investimento focada em quantidade de ações e geração de renda, 
              não em preço médio ou valorização de capital. O objetivo é mostrar o potencial de crescimento da 
              renda passiva com aportes constantes e reinvestimento de dividendos.
            </p>
            
            <div className="strategy-cards">
              <div className="strategy-card">
                <h4>Aporte Regular</h4>
                <p>
                  Contribuições mensais consistentes são o principal motor para o crescimento da renda. 
                  Mesmo valores modestos, quando mantidos com disciplina, produzem resultados expressivos ao longo do tempo.
                </p>
              </div>
              
              <div className="strategy-card">
                <h4>Reinvestimento de Dividendos</h4>
                <p>
                  Reinvestir dividendos acelera significativamente o crescimento da renda através do poder dos juros compostos. 
                  Esta estratégia pode dobrar sua renda em um período muito menor.
                </p>
              </div>
              
              <div className="strategy-card">
                <h4>Crescimento Natural</h4>
                <p>
                  Empresas de qualidade aumentam seus dividendos ao longo do tempo, mesmo sem novos aportes. 
                  Este crescimento orgânico é um componente essencial para o sucesso de longo prazo.
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default IncomeGrowthProjection;