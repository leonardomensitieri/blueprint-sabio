import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { fetchStockData } from '../../services/financialAPI';
import { 
  calculateBankDividends, 
  calculateStockDividends, 
  getDefaultPaymentMonths,
  formatCurrency
} from '../../services/financialCalculations';
import './DividendProjection.css';

const DividendProjection = ({ portfolioData }) => {
  const { currentUser } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [pieData, setPieData] = useState([]);
  const [barData, setBarData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalDividends: 0,
    monthlyAverage: 0,
    totalPortfolio: 0,
    averageYield: 0,
    monthlyBreakdown: {}
  });

  // Cores para os gráficos
  const COLORS = [
    '#FF8042', '#0088FE', '#00C49F', '#FFBB28', '#D4AF37', 
    '#8884D8', '#4CAF50', '#F44336', '#2196F3', '#9C27B0'
  ];

  // Meses para exibição
  const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  useEffect(() => {
    const loadPortfolioData = async () => {
      setIsLoading(true);
      try {
        // Se recebeu dados direto via props, use-os
        if (portfolioData && portfolioData.length > 0) {
          await processStockData(portfolioData);
        } else if (currentUser) {
          // Caso contrário, carregue do Firestore
          const db = getFirestore();
          const userStocksRef = doc(db, 'portfolios', currentUser.uid);
          const userStocksDoc = await getDoc(userStocksRef);
          
          if (userStocksDoc.exists() && userStocksDoc.data().stocks) {
            await processStockData(userStocksDoc.data().stocks);
          } else {
            // Dados de exemplo se não houver dados no Firestore
            const samplePortfolio = getSamplePortfolio();
            await processStockData(samplePortfolio);
          }
        } else {
          // Dados de exemplo se não houver usuário logado
          const samplePortfolio = getSamplePortfolio();
          await processStockData(samplePortfolio);
        }
      } catch (error) {
        console.error('Erro ao carregar dados da carteira:', error);
        // Em caso de erro, use dados de exemplo
        const samplePortfolio = getSamplePortfolio();
        await processStockData(samplePortfolio);
      } finally {
        setIsLoading(false);
      }
    };

    loadPortfolioData();
  }, [currentUser, portfolioData]);

  // Dados de exemplo para portfólio
  const getSamplePortfolio = () => {
    return [
      { id: '1', ticker: 'PETR4', quantity: 100, price: 32.50, dividendPerShare: 2.10, totalValue: 3250, expectedIncome: 210 },
      { id: '2', ticker: 'VALE3', quantity: 200, price: 68.75, dividendPerShare: 4.35, totalValue: 13750, expectedIncome: 870 },
      { id: '3', ticker: 'ITUB4', quantity: 150, price: 27.30, dividendPerShare: 1.85, totalValue: 4095, expectedIncome: 277.5 },
      { id: '4', ticker: 'BBDC4', quantity: 120, price: 19.80, dividendPerShare: 1.40, totalValue: 2376, expectedIncome: 168 },
      { id: '5', ticker: 'WEGE3', quantity: 80, price: 42.60, dividendPerShare: 0.90, totalValue: 3408, expectedIncome: 72 }
    ];
  };

  // Processa dados das ações e calcula informações de dividendos
  const processStockData = async (stocksData) => {
    // Enriquecer os dados com informações de pagamento de dividendos
    const enrichedStocks = await Promise.all(stocksData.map(async (stock) => {
      try {
        // Buscar dados adicionais se necessário
        if (!stock.sector || !stock.paymentMonths) {
          const stockInfo = await fetchStockData(stock.ticker);
          const updatedStock = {
            ...stock,
            sector: stockInfo.sector || 'Outros',
            paymentMonths: stockInfo.paymentMonths || getDefaultPaymentMonths(stock.ticker, stockInfo.sector)
          };
          
          // Aplicar cálculos especializados
          return enrichStockWithCalculations(updatedStock);
        }
        
        // Se já tem os dados básicos, apenas atualizar com os cálculos
        const updatedStock = {
          ...stock,
          paymentMonths: stock.paymentMonths || getDefaultPaymentMonths(stock.ticker, stock.sector)
        };
        
        return enrichStockWithCalculations(updatedStock);
      } catch (error) {
        console.error(`Erro ao buscar dados adicionais para ${stock.ticker}:`, error);
        // Dados mínimos para cálculo
        const baseStock = {
          ...stock,
          sector: stock.sector || 'Outros',
          paymentMonths: stock.paymentMonths || getDefaultPaymentMonths(stock.ticker)
        };
        
        return enrichStockWithCalculations(baseStock);
      }
    }));

    setStocks(enrichedStocks);
    calculateDividendProjections(enrichedStocks);
  };
  
  // Aplica cálculos especializados baseados no tipo de ação
  const enrichStockWithCalculations = (stock) => {
    // Verificar se é banco para usar cálculo específico
    const bankTickers = ['ITUB4', 'ITUB3', 'BBDC4', 'BBDC3', 'BBAS3', 'SANB11', 'SANB3', 'BPAC11'];
    const isBank = bankTickers.includes(stock.ticker) || stock.sector === 'Financeiro' || stock.sector === 'Bancos';
    
    if (isBank) {
      // Calcular dividendos usando o método especializado para bancos (baseado em ROE)
      const bankDividends = calculateBankDividends(stock);
      
      return {
        ...stock,
        // Manter compatibilidade com estrutura existente
        dividendPerShare: bankDividends.estimatedDPS,
        expectedIncome: bankDividends.annualDividendIncome,
        dividendYield: bankDividends.dividendYield,
        // Adicionar dados especializados
        roe: bankDividends.roe,
        payoutRatio: bankDividends.payoutRatio,
        bookValue: bankDividends.bookValue,
        estimatedEPS: bankDividends.estimatedEPS,
        monthlyDistribution: bankDividends.monthlyDistribution,
        // Meses de pagamento específicos para bancos
        paymentMonths: bankDividends.paymentMonths
      };
    } else {
      // Usar cálculo padrão para outras ações
      const stockDividends = calculateStockDividends(stock);
      
      return {
        ...stock,
        // Garantir que estes campos estejam preenchidos para cálculos
        dividendPerShare: stockDividends.dividendPerShare,
        expectedIncome: stockDividends.annualDividendIncome,
        dividendYield: stockDividends.dividendYield,
        monthlyDistribution: stockDividends.monthlyDistribution,
        paymentMonths: stockDividends.paymentMonths
      };
    }
  };

  // Esta função foi substituída pela importação do serviço de cálculos financeiros
  // Mantida aqui apenas para compatibilidade, chama a função do serviço
  const getDefaultPaymentMonthsLegacy = (ticker) => {
    return getDefaultPaymentMonths(ticker);
  };

  // Calcula todas as projeções de dividendos
  const calculateDividendProjections = (stocks) => {
    // Calcular dados do resumo
    const totalPortfolio = stocks.reduce((sum, stock) => sum + stock.totalValue, 0);
    const totalDividends = stocks.reduce((sum, stock) => sum + stock.expectedIncome, 0);
    const monthlyAverage = totalDividends / 12;
    const averageYield = totalPortfolio > 0 ? (totalDividends / totalPortfolio) * 100 : 0;

    // Preparar dados para o gráfico de pizza (dividendos por ativo)
    const pieChartData = stocks.map(stock => ({
      name: stock.ticker,
      value: stock.expectedIncome
    })).sort((a, b) => b.value - a.value); // Ordena por valor de dividendos

    // Preparar dados para o gráfico de barras (rendimento por ativo)
    const barChartData = stocks.map(stock => {
      const yieldValue = (stock.expectedIncome / stock.totalValue) * 100;
      return {
        name: stock.ticker,
        yield: parseFloat(yieldValue.toFixed(2))
      };
    }).sort((a, b) => b.yield - a.yield); // Ordena por yield

    // Preparar dados para o gráfico de linha (projeção mensal)
    const monthlyProjection = Array(12).fill(0);
    const monthlyBreakdown = {}; // Para armazenar detalhes de pagamentos por mês
    
    // Inicializar o breakdown de cada mês
    MONTHS.forEach((month, index) => {
      monthlyBreakdown[index] = {
        total: 0,
        payments: []
      };
    });
    
    // Distribuir os dividendos nos meses correspondentes
    stocks.forEach(stock => {
      // Se o stock já tem a distribuição mensal calculada pelo serviço especializado
      if (stock.monthlyDistribution && Array.isArray(stock.monthlyDistribution)) {
        // Usar a distribuição já calculada
        stock.monthlyDistribution.forEach((amount, monthIndex) => {
          if (amount > 0) {
            monthlyProjection[monthIndex] += amount;
            
            // Adicionar ao breakdown mensal
            monthlyBreakdown[monthIndex].total += amount;
            monthlyBreakdown[monthIndex].payments.push({
              ticker: stock.ticker,
              amount: amount
            });
          }
        });
      } else {
        // Fallback para o método anterior se não tiver distribuição calculada
        const paymentMonths = stock.paymentMonths || getDefaultPaymentMonths(stock.ticker, stock.sector);
        const dividendPerPayment = stock.expectedIncome / paymentMonths.length;
        
        paymentMonths.forEach(month => {
          const monthIndex = month - 1;
          monthlyProjection[monthIndex] += dividendPerPayment;
          
          monthlyBreakdown[monthIndex].total += dividendPerPayment;
          monthlyBreakdown[monthIndex].payments.push({
            ticker: stock.ticker,
            amount: dividendPerPayment
          });
        });
      }
    });

    // Converter para o formato esperado pelo gráfico
    const formattedMonthlyData = monthlyProjection.map((value, index) => ({
      name: MONTHS[index],
      valor: parseFloat(value.toFixed(2))
    }));

    // Atualizar estados com os dados calculados
    setSummary({
      totalDividends,
      monthlyAverage,
      totalPortfolio,
      averageYield,
      monthlyBreakdown
    });
    
    setPieData(pieChartData);
    setBarData(barChartData);
    setMonthlyData(formattedMonthlyData);
  };

  // Usando a função formatCurrency importada do serviço de cálculos

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${label}: ${formatCurrency(payload[0].value)}`}</p>
          
          {/* Mostrar detalhes dos pagamentos neste mês */}
          {label && summary.monthlyBreakdown && MONTHS.indexOf(label) >= 0 && (
            <div className="tooltip-details">
              <p className="tooltip-subtitle">Pagamentos previstos:</p>
              <ul className="tooltip-list">
                {summary.monthlyBreakdown[MONTHS.indexOf(label)].payments
                  .sort((a, b) => b.amount - a.amount) // Ordenar do maior para o menor
                  .map((payment, idx) => (
                    <li key={idx}>
                      {payment.ticker}: {formatCurrency(payment.amount)}
                    </li>
                  ))
                }
              </ul>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const PieCustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const percentOfTotal = ((payload[0].value / summary.totalDividends) * 100).toFixed(2);
      return (
        <div className="custom-tooltip">
          <p className="label">{`${payload[0].name}: ${formatCurrency(payload[0].value)}`}</p>
          <p className="percent">{`${percentOfTotal}% dos dividendos totais`}</p>
        </div>
      );
    }
    return null;
  };

  const YieldTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{`${payload[0].name}: ${payload[0].value}%`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="dividend-projection">
      <h2>Projeção de Dividendos</h2>
      
      {isLoading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Calculando projeções de dividendos...</p>
        </div>
      ) : (
        <>
          <div className="dividend-summary">
            <div className="summary-card">
              <h3>Dividendos Anuais</h3>
              <p>{formatCurrency(summary.totalDividends)}</p>
            </div>
            
            <div className="summary-card">
              <h3>Média Mensal</h3>
              <p>{formatCurrency(summary.monthlyAverage)}</p>
            </div>
            
            <div className="summary-card">
              <h3>Capital Total</h3>
              <p>{formatCurrency(summary.totalPortfolio)}</p>
            </div>
            
            <div className="summary-card">
              <h3>Yield Médio</h3>
              <p>{summary.averageYield.toFixed(2)}%</p>
            </div>
          </div>
          
          <div className="chart-container monthly-projection">
            <h3>Projeção de Dividendos por Mês</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={monthlyData}
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
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="valor" name="Dividendos Mensais" fill="#4CAF50">
                  {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          <div className="charts-container">
            <div className="chart-wrapper pie-chart">
              <h3>Dividendos por Ativo</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData.slice(0, 10)} // Limitar aos 10 principais para melhor visualização
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => entry.name}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.slice(0, 10).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<PieCustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="chart-wrapper bar-chart">
              <h3>Yield por Ativo (Top 10)</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={barData.slice(0, 10)} // Top 10 por yield
                  layout="vertical"
                  margin={{
                    top: 5,
                    right: 30,
                    left: 50,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" tick={{ fill: '#AAAAAA' }} />
                  <YAxis dataKey="name" type="category" tick={{ fill: '#AAAAAA' }} />
                  <Tooltip content={<YieldTooltip />} />
                  <Legend />
                  <Bar dataKey="yield" name="Dividend Yield (%)" fill="#D4AF37" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="dividend-strategies">
            <h3>Estratégias para Otimizar Dividendos</h3>
            
            <div className="strategy-cards">
              <div className="strategy-card">
                <div className="strategy-icon">📊</div>
                <h4>Distribuição Mensal</h4>
                <p>
                  Seus pagamentos estão {isDistributionBalanced() ? 'bem distribuídos' : 'concentrados em alguns meses'}.
                  {!isDistributionBalanced() && ' Considere diversificar para obter receita mais consistente ao longo do ano.'}
                </p>
              </div>
              
              <div className="strategy-card">
                <div className="strategy-icon">🔍</div>
                <h4>Diversificação</h4>
                <p>
                  {getDiversificationAdvice()}
                </p>
              </div>
              
              <div className="strategy-card">
                <div className="strategy-icon">💰</div>
                <h4>Reinvestimento</h4>
                <p>
                  Reinvestir todos os seus dividendos mensais (R$ {summary.monthlyAverage.toFixed(2)}) 
                  pode gerar aproximadamente R$ {calculateReinvestmentGrowth().toFixed(2)} a mais por ano 
                  no próximo ciclo.
                </p>
              </div>
            </div>
          </div>
          
          <div className="dividend-tips">
            <h3>Dicas para Maximizar seus Dividendos</h3>
            <ul>
              <li>
                <strong>Diversifique entre setores</strong> para reduzir riscos e garantir pagamentos em diferentes ciclos econômicos.
              </li>
              <li>
                <strong>Avalie o ROE</strong> para bancos - instituições com ROE acima de 15% geralmente sustentam melhores dividendos.
              </li>
              <li>
                <strong>Priorize empresas com histórico</strong> consistente de pagamentos e aumentos graduais de dividendos.
              </li>
              <li>
                <strong>Verifique o payout ratio</strong> - empresas com payout muito alto podem não conseguir manter os dividendos no longo prazo.
              </li>
              <li>
                <strong>Reinvista seus dividendos</strong> para acelerar o crescimento patrimonial e sua renda passiva futura.
              </li>
            </ul>
          </div>
        </>
      )}
    </div>
  );

  // Função auxiliar para verificar se os dividendos estão bem distribuídos entre os meses
  function isDistributionBalanced() {
    if (!monthlyData || monthlyData.length === 0) return true;
    
    const values = monthlyData.map(item => item.valor);
    const max = Math.max(...values);
    const min = Math.min(...values);
    const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
    
    // Consideramos balanceado se a diferença entre o maior e menor valor for menor que 50% da média
    return (max - min) < (avg * 0.5);
  }
  
  // Função auxiliar para dar conselhos sobre diversificação
  function getDiversificationAdvice() {
    const uniqueTickers = new Set(stocks.map(stock => stock.ticker));
    
    if (uniqueTickers.size < 5) {
      return 'Sua carteira tem poucos ativos pagadores de dividendos. Considere adicionar mais empresas para diversificar seu risco.';
    } else if (uniqueTickers.size < 10) {
      return 'Sua carteira tem uma diversificação razoável. Para maior segurança, tente incluir ativos de diferentes setores.';
    } else {
      return 'Sua carteira está bem diversificada. Continue monitorando para garantir que os dividendos se mantenham sustentáveis.';
    }
  }
  
  // Função auxiliar para calcular o crescimento por reinvestimento
  function calculateReinvestmentGrowth() {
    // Supondo um yield médio da carteira para o reinvestimento
    const averageMonthlyDividend = summary.monthlyAverage;
    const annualReinvestedAmount = averageMonthlyDividend * 12;
    const averageYield = summary.averageYield / 100;
    
    // Rendimento adicional esperado pelo reinvestimento
    return annualReinvestedAmount * averageYield;
  }
};

export default DividendProjection;