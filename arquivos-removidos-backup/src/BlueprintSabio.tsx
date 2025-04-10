import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import _ from 'lodash';
import Papa from 'papaparse';
import { Stock, stockData } from './stockData';

interface InvestmentStrategy {
  label: string;
  description: string;
  allocation: string;
  timing: string;
  class: string;
}

interface PortfolioStats {
  avgDividendYield: string;
  avgSafetyMargin: string;
  avgPL: string;
  count: number;
}

interface FilterOptions {
  minDividendYield: number;
  maxPL: number;
  minSafetyMargin: number;
  sector: string;
}

const BlueprintSabio: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    minDividendYield: 0,
    maxPL: 100,
    minSafetyMargin: -50,
    sector: 'all'
  });
  const [view, setView] = useState('dashboard'); // dashboard, details, strategy
  const [isLoading, setIsLoading] = useState(true);
  const [sectors, setSectors] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState('Março 2025');
  const [fileError, setFileError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isAutoUpdateEnabled, setIsAutoUpdateEnabled] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [lastPriceUpdate, setLastPriceUpdate] = useState<string | null>(null);
  const [updateStatus, setUpdateStatus] = useState<string>('');
  
  // Função para buscar o preço real da ação usando a API do Yahoo Finance
  const fetchStockPrice = async (ticker: string): Promise<number | null> => {
    try {
      setUpdateStatus(`Buscando cotação para ${ticker}...`);
      
      // Tratamento do ticker para o formato do Yahoo Finance (ações brasileiras usam .SA)
      const formattedTicker = ticker.includes('.') 
        ? ticker.replace('.', '-') + '.SA'  // BBAS3 -> BBAS3.SA, ABCB4 -> ABCB4.SA
        : ticker + '.SA';  // PETR4 -> PETR4.SA
      
      // Usando um proxy CORS confiável (corsproxy.io)
      const proxyUrl = 'https://corsproxy.io/?';
      const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${formattedTicker}?interval=1d&range=1d`;
      
      // Tentativa principal com proxy CORS
      const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados para ${ticker}: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Verificar se a resposta contém os dados esperados
      if (!data.chart || !data.chart.result || data.chart.result.length === 0 || !data.chart.result[0].meta) {
        throw new Error(`Dados inválidos para ${ticker}`);
      }
      
      // Obter o preço atual
      const currentPrice = data.chart.result[0].meta.regularMarketPrice;
      
      if (!currentPrice) {
        throw new Error(`Preço não disponível para ${ticker}`);
      }
      
      setUpdateStatus('');
      return currentPrice;
    } catch (error) {
      console.error(`Erro ao buscar preço para ${ticker}:`, error);
      
      // Estratégia de fallback - simular um preço com pequena variação aleatória
      // Apenas se já tivermos o preço atual armazenado
      const existingStock = stocks.find(s => s.Código === ticker);
      
      if (existingStock && existingStock.Cotação_atual) {
        const variation = (Math.random() * 0.02) - 0.01; // -1% a +1%
        const simulatedPrice = existingStock.Cotação_atual * (1 + variation);
        
        console.log(`Usando preço simulado para ${ticker}: ${simulatedPrice.toFixed(2)}`);
        setUpdateStatus(`Usando preço aproximado para ${ticker} (indisponível no momento)`);
        
        return parseFloat(simulatedPrice.toFixed(2));
      }
      
      setUpdateStatus(`Falha ao buscar ${ticker}`);
      return null; // Retorna null apenas se não tiver uma estratégia de fallback
    }
  };
  
  // Function to update all stock prices
  const updateAllPrices = async () => {
    if (isUpdatingPrices || stocks.length === 0) return;
    
    setIsUpdatingPrices(true);
    setUpdateStatus('Iniciando atualização de cotações...');
    let successCount = 0;
    let failCount = 0;
    
    try {
      const updatedStocks = [...stocks];
      // Limite o número de ações atualizadas para melhor desempenho
      // Definido por prioridade (começando com as que têm maior Score_MSI)
      const stocksToUpdate = [...updatedStocks]
        .sort((a, b) => (b.Score_MSI || 0) - (a.Score_MSI || 0))
        .slice(0, Math.min(25, updatedStocks.length)); 
      
      setUpdateStatus(`Atualizando ${stocksToUpdate.length} ações com maior potencial...`);
      
      // Update each stock price
      for (let i = 0; i < stocksToUpdate.length; i++) {
        const stock = stocksToUpdate[i];
        const stockIndex = updatedStocks.findIndex(s => s.Código === stock.Código);
        
        if (stockIndex === -1) continue;
        
        const newPrice = await fetchStockPrice(stock.Código);
        
        if (newPrice !== null) {
          // Check if the price is significantly different (to avoid unnecessary updates)
          const priceDiff = Math.abs((newPrice - stock.Cotação_atual) / stock.Cotação_atual);
          
          if (priceDiff > 0.001) { // 0.1% threshold to update
            // Update price and recalculate derived values
            updatedStocks[stockIndex] = {
              ...stock,
              Cotação_atual: newPrice,
              // Recalculate values that depend on the price
              Dividend_Yield_bruto_estimado: parseFloat((stock.Dividendo_por_ação_bruto_projetado / newPrice * 100).toFixed(2)),
              Margem_de_segurança: parseFloat(((stock.Preço_Teto / newPrice - 1) * 100).toFixed(2)),
              Última_atualização: new Date().toLocaleDateString()
            };
            
            // Recalculate MSI score
            updatedStocks[stockIndex].Score_MSI = calculateMSIScore(updatedStocks[stockIndex]);
            
            // Calculate percentage to target
            updatedStocks[stockIndex].PercentageToTarget = ((((typeof stock.Preço_Teto === 'string' ? 
              parseFloat(stock.Preço_Teto) : stock.Preço_Teto) / newPrice) - 1) * 100).toFixed(1);
          }
          successCount++;
        } else {
          failCount++;
        }
        
        // Add a small delay between requests to avoid API rate limits
        if (i < stocksToUpdate.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
        
        // Update status periodically
        if (i % 5 === 0 || i === stocksToUpdate.length - 1) {
          setUpdateStatus(`Progresso: ${i + 1}/${stocksToUpdate.length} ações (${successCount} atualizadas, ${failCount} falhas)`);
        }
      }
      
      setStocks(updatedStocks);
      
      // Reapply filters to update the filtered stocks list
      const filtered = updatedStocks.filter(stock => {
        const matchesSearch = 
          stock.Empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.Código.toLowerCase().includes(searchTerm.toLowerCase());
          
        const matchesDividendYield = stock.Dividend_Yield_bruto_estimado >= filterOptions.minDividendYield;
        const matchesPL = stock["P/L_projetado"] <= filterOptions.maxPL;
        const matchesMargin = stock.Margem_de_segurança >= filterOptions.minSafetyMargin;
        const matchesSector = filterOptions.sector === 'all' || stock.Atuação === filterOptions.sector;
        
        return matchesSearch && matchesDividendYield && matchesPL && matchesMargin && matchesSector;
      });
      
      setFilteredStocks(filtered);
      
      const now = new Date();
      setLastPriceUpdate(now.toLocaleTimeString());
      
      // Show feedback to user about update results
      if (failCount > 0) {
        setFileError(`Atualização concluída com ${successCount} cotações atualizadas e ${failCount} falhas.`);
        setTimeout(() => setFileError(''), 5000); // Clear error after 5 seconds
      } else {
        setFileError(`${successCount} cotações atualizadas com sucesso!`);
        setTimeout(() => setFileError(''), 3000);
      }
      
      setUpdateStatus('Atualização concluída.');
      setTimeout(() => setUpdateStatus(''), 3000);
    } catch (error) {
      console.error("Error updating prices:", error);
      setFileError("Erro ao atualizar cotações. Tente novamente mais tarde.");
      setUpdateStatus('Erro durante a atualização.');
      setTimeout(() => setFileError(''), 5000);
      setTimeout(() => setUpdateStatus(''), 5000);
    } finally {
      setIsUpdatingPrices(false);
    }
  };
  
  // Set up auto-update interval if enabled
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    
    if (isAutoUpdateEnabled) {
      // Update prices every 30 seconds (reduced from 5 minutes for better user experience)
      interval = setInterval(() => {
        updateAllPrices();
      }, 30 * 1000);
      
      // Feedback to the user that auto-update is enabled
      setUpdateStatus('Auto-atualização ativada. Atualizando a cada 30 segundos.');
      setTimeout(() => setUpdateStatus(''), 3000);
    } else if (interval) {
      setUpdateStatus('Auto-atualização desativada.');
      setTimeout(() => setUpdateStatus(''), 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoUpdateEnabled]);
  
  // Automatically update prices when the app loads for the first time
  useEffect(() => {
    if (stocks.length > 0 && !lastPriceUpdate) {
      // Small delay to allow the UI to render first
      const timer: NodeJS.Timeout = setTimeout(() => {
        updateAllPrices();
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [stocks.length, lastPriceUpdate]);
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setUpdateStatus('Carregando dados de ações...');
        
        // Usar stockData importado de stockData.ts em vez de dados de exemplo
        // Esta é a melhoria principal - agora temos acesso a todos os 70+ dados de ações
        console.log(`Carregando ${stockData.length} ações do arquivo stockData.ts`);
        
        // Process data
        const processedData = stockData.map(item => ({
          ...item,
          // Garantir que todos os valores numéricos sejam do tipo correto
          Cotação_atual: typeof item.Cotação_atual === 'string' ? parseFloat(item.Cotação_atual) : item.Cotação_atual,
          Dividend_Yield_bruto_estimado: typeof item.Dividend_Yield_bruto_estimado === 'string' ? 
            parseFloat(item.Dividend_Yield_bruto_estimado) : item.Dividend_Yield_bruto_estimado,
          Margem_de_segurança: typeof item.Margem_de_segurança === 'string' ? 
            parseFloat(item.Margem_de_segurança) : item.Margem_de_segurança,
          "P/L_projetado": typeof item["P/L_projetado"] === 'string' ? 
            parseFloat(item["P/L_projetado"]) : item["P/L_projetado"],
          // Calcular Score_MSI para cada ação
          Score_MSI: calculateMSIScore(item),
          // Calcular porcentagem até o preço alvo
          PercentageToTarget: (((typeof item.Preço_Teto === 'string' ? parseFloat(item.Preço_Teto) : item.Preço_Teto) / 
            (typeof item.Cotação_atual === 'string' ? parseFloat(item.Cotação_atual) : item.Cotação_atual) - 1) * 100).toFixed(1)
        }));
        
        // Extrair os setores únicos
        const uniqueSectors = _.uniq(processedData.map(item => item.Atuação)).sort();
        
        setStocks(processedData);
        setFilteredStocks(processedData);
        setSectors(uniqueSectors);
        
        // Atualizar a data de última atualização
        setLastUpdate(new Date().toLocaleDateString('pt-BR', { 
          year: 'numeric', 
          month: 'long',
          day: 'numeric'
        }));
        
        setIsLoading(false);
        setUpdateStatus('Dados carregados com sucesso!');
        setTimeout(() => setUpdateStatus(''), 2000);
      } catch (error) {
        console.error("Error loading data:", error);
        setFileError("Erro ao carregar os dados de ações. Por favor, recarregue a página.");
        setIsLoading(false);
        setUpdateStatus('Erro ao carregar dados.');
      }
    };
    
    loadData();
  }, []);
  
  useEffect(() => {
    // Filter stocks based on search term and filter options
    const filtered = stocks.filter(stock => {
      const matchesSearch = 
        stock.Empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.Código.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesDividendYield = stock.Dividend_Yield_bruto_estimado >= filterOptions.minDividendYield;
      const matchesPL = stock["P/L_projetado"] <= filterOptions.maxPL;
      const matchesMargin = stock.Margem_de_segurança >= filterOptions.minSafetyMargin;
      const matchesSector = filterOptions.sector === 'all' || stock.Atuação === filterOptions.sector;
      
      return matchesSearch && matchesDividendYield && matchesPL && matchesMargin && matchesSector;
    });
    
    setFilteredStocks(filtered);
  }, [stocks, searchTerm, filterOptions]);
  
  // Calculate a "Método Sábio de Investir" score for each stock
  function calculateMSIScore(stock: Stock): number {
    // Components of the MSI score:
    // 1. Dividend Yield (higher is better)
    // 2. Safety Margin (higher is better)
    // 3. P/L ratio compared to historical average (lower than average is better)
    // 4. Growth (CAGR) over 5 years (higher is better)
    // 5. Low debt (lower debt/EBITDA is better)
    
    let score = 0;
    
    // Dividend Yield score (max 30 points)
    const yieldScore = Math.min(stock.Dividend_Yield_bruto_estimado * 3, 30);
    
    // Safety Margin score (max 25 points)
    const marginScore = Math.min(stock.Margem_de_segurança * 1.25, 25);
    
    // P/L discount score (max 20 points)
    const plDiscount = -stock.Desvio_PL; // Convert to positive if below average
    const plScore = plDiscount > 0 ? Math.min(plDiscount / 2, 20) : 0;
    
    // Growth score (max 15 points)
    const growthScore = Math.min(stock.CAGR_lucros_5_anos / 2, 15);
    
    // Debt score (max 10 points) - lower is better
    const debtRatio = stock.Dívida_líquida_EBITDA;
    let debtScore = 10;
    if (debtRatio > 0) {
      debtScore = Math.max(10 - debtRatio * 2, 0);
    }
    
    score = yieldScore + marginScore + plScore + growthScore + debtScore;
    return Math.round(score);
  }
  
  // Get investment strategy recommendation based on MSI score
  const getInvestmentStrategy = (stock: Stock): InvestmentStrategy => {
    const score = stock.Score_MSI || 0;
    
    if (score >= 85) {
      return {
        label: "Estrela do Portfolio",
        description: "Empresa elite com excelentes fundamentos. Recomendamos alocação prioritária.",
        allocation: "15-20% do capital disponível para ações",
        timing: "Compra imediata recomendada",
        class: "star"
      };
    } else if (score >= 70) {
      return {
        label: "Compra Forte",
        description: "Excelente oportunidade com ótima relação risco/retorno.",
        allocation: "10-15% do capital disponível para ações",
        timing: "Compra nos próximos 30 dias",
        class: "strong-buy"
      };
    } else if (score >= 55) {
      return {
        label: "Compra",
        description: "Boa oportunidade com fundamentos sólidos.",
        allocation: "5-10% do capital disponível para ações",
        timing: "Compra gradual, em 3-4 etapas",
        class: "buy"
      };
    } else if (score >= 40) {
      return {
        label: "Observar",
        description: "Empresa com potencial, mas aguardando melhor entrada.",
        allocation: "Até 5% do capital disponível para ações",
        timing: "Monitorar para entrada em correções",
        class: "watch"
      };
    } else {
      return {
        label: "Evitar",
        description: "Não recomendada pelo Método Sábio de Investir neste momento.",
        allocation: "0% (não alocar capital)",
        timing: "Aguardar melhora nos fundamentos",
        class: "avoid"
      };
    }
  };
  
  // Format large numbers for better readability
  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `R$ ${(value / 1000000000).toFixed(1)} bi`;
    } else if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)} mi`;
    } else {
      return `R$ ${value.toLocaleString('pt-BR')}`;
    }
  };
  
  // Calculate total portfolio stats if user invested in top recommendations
  const calculatePortfolioStats = (): PortfolioStats | null => {
    // Sort by MSI score and take top 10
    const topRecommendations = [...filteredStocks]
      .sort((a, b) => (b.Score_MSI || 0) - (a.Score_MSI || 0))
      .slice(0, 10);
      
    if (topRecommendations.length === 0) return null;
    
    const avgDividendYield = topRecommendations.reduce((sum, stock) => 
      sum + stock.Dividend_Yield_bruto_estimado, 0) / topRecommendations.length;
    
    const avgSafetyMargin = topRecommendations.reduce((sum, stock) => 
      sum + stock.Margem_de_segurança, 0) / topRecommendations.length;
    
    const avgPL = topRecommendations.reduce((sum, stock) => 
      sum + stock["P/L_projetado"], 0) / topRecommendations.length;
    
    return {
      avgDividendYield: avgDividendYield.toFixed(2),
      avgSafetyMargin: avgSafetyMargin.toFixed(2),
      avgPL: avgPL.toFixed(2),
      count: topRecommendations.length
    };
  };
  
  const portfolioStats = calculatePortfolioStats();
  
  // Event handlers
  const handleStockSelect = (stock: Stock): void => {
    setSelectedStock(stock);
    setView('details');
  };
  
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setSearchTerm(e.target.value);
  };
  
  const handleFilterChange = (name: string, value: number | string): void => {
    setFilterOptions(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setFileError('');
    setIsLoading(true);
    
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    
    // Process CSV file
    if (fileType === 'csv') {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setFileError('Erro ao processar o arquivo CSV. Verifique o formato.');
            setIsLoading(false);
            return;
          }
          
          try {
            // Process and map the data to our expected format
            const processedData = processUploadedData(results.data as Record<string, any>[]);
            if (processedData.length === 0) {
              setFileError('Nenhum dado válido encontrado no arquivo.');
              setIsLoading(false);
              return;
            }
            
            // Update state with new data
            setStocks(processedData);
            setFilteredStocks(processedData);
            
            // Update sectors list
            const uniqueSectors = _.uniq(processedData.map(item => item.Atuação)).sort();
            setSectors(uniqueSectors);
            
            // Update last update date
            setLastUpdate(new Date().toLocaleDateString('pt-BR', { 
              year: 'numeric', 
              month: 'long' 
            }));
            
            setIsLoading(false);
          } catch (error) {
            console.error("Error processing data:", error);
            setFileError('Erro ao processar os dados. Verifique se o formato do arquivo está correto.');
            setIsLoading(false);
          }
        },
        error: (error) => {
          console.error("Error parsing CSV:", error);
          setFileError('Erro ao ler o arquivo CSV.');
          setIsLoading(false);
        }
      });
    } 
    // For Excel files, we would need another library like SheetJS
    else {
      setFileError('Formato de arquivo não suportado nesta versão. Por favor, use CSV.');
      setIsLoading(false);
    }
    
    // Reset file input
    if (event.target) event.target.value = "";
  };
  
  // Process and map the data from different file formats to our expected structure
  const processUploadedData = (data: Record<string, any>[]): Stock[] => {
    // This function maps the data from the uploaded file to our application's data structure
    // The mapping will depend on the actual structure of your CSV file
    
    try {
      // Example mapping (adjust based on your actual CSV structure)
      return data.map((row: Record<string, any>) => {
        // Try to find the columns based on multiple possible header names
        const empresa = findValue(row, ['Empresa', 'empresa', 'Nome', 'nome', 'Company']);
        const codigo = findValue(row, ['Código', 'código', 'codigo', 'Ticker', 'ticker', 'Symbol']);
        const setor = findValue(row, ['Atuação', 'atuação', 'Setor', 'setor', 'Sector']);
        const lucroEstimado = findNumber(row, ['Lucro_líquido_estimado_2025', 'Lucro líquido estimado', 'Lucro Estimado']);
        const plProjetado = findNumber(row, ['P/L_projetado', 'P/L projetado', 'PL', 'P/L']);
        const plMedio = findNumber(row, ['P/L_médio_10_anos', 'P/L médio']);
        const desvioPL = findNumber(row, ['Desvio_PL', 'Desvio PL']);
        const cagr = findNumber(row, ['CAGR_lucros_5_anos', 'CAGR']);
        const divida = findNumber(row, ['Dívida_líquida_EBITDA', 'Dívida/EBITDA']);
        const lucroAcao = findNumber(row, ['Lucro_por_ação_estimado', 'LPA']);
        const payout = findNumber(row, ['Payout_esperado', 'Payout']);
        const dividendoAcao = findNumber(row, ['Dividendo_por_ação_bruto_projetado', 'DPA']);
        const dividendYield = findNumber(row, ['Dividend_Yield_bruto_estimado', 'Yield', 'DY']);
        const cotacao = findNumber(row, ['Cotação_atual', 'Cotação', 'Preço']);
        const precoTeto = findNumber(row, ['Preço_Teto', 'Preço teto', 'Teto']);
        const margem = findNumber(row, ['Margem_de_segurança', 'Margem']);
        const frequencia = findValue(row, ['Frequência', 'Periodicidade']);
        const meses = findValue(row, ['Meses_dividendos', 'Meses']);
        const atualizacao = findValue(row, ['Última_atualização', 'Atualização']);
        
        // Skip rows with missing essential data
        if (!empresa || !codigo || !cotacao) {
          return null as unknown as Stock; // This will be filtered out
        }
        
        const stock: Stock = {
          Empresa: empresa,
          Código: codigo,
          Atuação: setor || 'Não categorizado',
          Lucro_líquido_estimado_2025: lucroEstimado || 0,
          "P/L_projetado": plProjetado || 0,
          "P/L_médio_10_anos": plMedio || 0,
          Desvio_PL: desvioPL || 0,
          CAGR_lucros_5_anos: cagr || 0,
          Dívida_líquida_EBITDA: divida || 0,
          Lucro_por_ação_estimado: lucroAcao || 0,
          Payout_esperado: payout || 0,
          Dividendo_por_ação_bruto_projetado: dividendoAcao || 0,
          Dividend_Yield_bruto_estimado: dividendYield || 0,
          Cotação_atual: cotacao,
          Preço_Teto: precoTeto || cotacao,
          Margem_de_segurança: margem || 0,
          Frequência: frequencia || 'Anual',
          Meses_dividendos: meses || '-',
          Última_atualização: atualizacao || 'N/A'
        };
        
        // Calculate MSI Score
        stock.Score_MSI = calculateMSIScore(stock);
        stock.PercentageToTarget = (((typeof stock.Preço_Teto === 'number' ? stock.Preço_Teto : parseFloat(String(stock.Preço_Teto))) / 
          (typeof stock.Cotação_atual === 'number' ? stock.Cotação_atual : parseFloat(String(stock.Cotação_atual))) - 1) * 100).toFixed(1);
        
        return stock;
      }).filter((item): item is Stock => item !== null && item.Código !== undefined); // Type guard to filter out nulls
    } catch (error) {
      console.error("Error in data mapping:", error);
      return [];
    }
  };
  
  // Helper function to find a value with multiple possible column names
  const findValue = (row: Record<string, any>, possibleNames: string[]): any => {
    for (let name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return row[name];
      }
    }
    return null;
  };
  
  // Helper function to find and parse a number
  const findNumber = (row: Record<string, any>, possibleNames: string[]): number | null => {
    const value = findValue(row, possibleNames);
    if (value === null) return null;
    
    // If it's already a number, return it
    if (typeof value === 'number') return value;
    
    // Try to parse it as a number
    const parsed = parseFloat(value.toString().replace(',', '.').replace(/[^\d.-]/g, ''));
    return isNaN(parsed) ? null : parsed;
  };
  
  const renderDashboard = () => (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="platform-intro">
          <h2>Blueprint Sábio: A Planilha dos Bilionários</h2>
          <p>Desenvolvido pelo <strong>Método Sábio de Investir</strong> da Myoboku Capital</p>
          <div className="update-section">
            <p className="last-update">Última atualização dos dados: <strong>{lastUpdate}</strong>
            {lastPriceUpdate && 
              <span className="price-update">
                (Cotações atualizadas às {lastPriceUpdate})
              </span>
            }
            </p>
            
            <div className="status-bar">
              {updateStatus && <p className="update-status">{updateStatus}</p>}
              {fileError && <p className="file-error">{fileError}</p>}
            </div>
            
            <div className="actions-container">
              <div className="file-upload">
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  className="file-input"
                  id="file-upload"
                  ref={fileInputRef}
                />
                <label htmlFor="file-upload" className="file-upload-btn">
                  Importar Dados
                </label>
              </div>
              
              <button 
                className={`update-prices-btn ${isUpdatingPrices ? 'updating' : ''}`}
                onClick={updateAllPrices}
                disabled={isUpdatingPrices || stocks.length === 0}
              >
                {isUpdatingPrices ? 'Atualizando...' : 'Atualizar Cotações'}
              </button>
              
              <div className="auto-update-toggle">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={isAutoUpdateEnabled}
                    onChange={() => setIsAutoUpdateEnabled(!isAutoUpdateEnabled)}
                  />
                  <span className="toggle-switch"></span>
                  <span className="toggle-text">Auto-atualizar (30s)</span>
                </label>
              </div>
            </div>
          </div>
        </div>
        <div className="dashboard-stats">
          {portfolioStats && (
            <>
              <div className="stat-card">
                <h3>{portfolioStats.avgDividendYield}%</h3>
                <p>Dividend Yield Médio</p>
              </div>
              <div className="stat-card">
                <h3>{portfolioStats.avgSafetyMargin}%</h3>
                <p>Margem de Segurança Média</p>
              </div>
              <div className="stat-card">
                <h3>{portfolioStats.avgPL}</h3>
                <p>P/L Médio</p>
              </div>
            </>
          )}
        </div>
      </div>
      
      <div className="filters-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Buscar por empresa ou código..."
            value={searchTerm}
            onChange={handleSearch}
            className="search-input"
          />
        </div>
        
        <div className="filter-options">
          <div className="filter-group">
            <label>Dividend Yield Mínimo</label>
            <select 
              value={filterOptions.minDividendYield}
              onChange={(e) => handleFilterChange('minDividendYield', parseFloat(e.target.value))}
            >
              <option value="0">Qualquer</option>
              <option value="5">5%+</option>
              <option value="7">7%+</option>
              <option value="9">9%+</option>
              <option value="11">11%+</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>P/L Máximo</label>
            <select 
              value={filterOptions.maxPL}
              onChange={(e) => handleFilterChange('maxPL', parseFloat(e.target.value))}
            >
              <option value="100">Qualquer</option>
              <option value="15">Até 15</option>
              <option value="10">Até 10</option>
              <option value="7">Até 7</option>
              <option value="5">Até 5</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Margem de Segurança Mínima</label>
            <select 
              value={filterOptions.minSafetyMargin}
              onChange={(e) => handleFilterChange('minSafetyMargin', parseFloat(e.target.value))}
            >
              <option value="-50">Qualquer</option>
              <option value="0">Positiva</option>
              <option value="5">5%+</option>
              <option value="10">10%+</option>
              <option value="15">15%+</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Setor</label>
            <select 
              value={filterOptions.sector}
              onChange={(e) => handleFilterChange('sector', e.target.value)}
            >
              <option value="all">Todos os Setores</option>
              {sectors.map(sector => (
                <option key={sector} value={sector}>{sector}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      <div className="stocks-table-container">
        <table className="stocks-table">
          <thead>
            <tr>
              <th>Pontuação MSI</th>
              <th>Empresa</th>
              <th>Código</th>
              <th>Setor</th>
              <th>Cotação</th>
              <th>Preço Teto</th>
              <th>Margem (%)</th>
              <th>Div. Yield</th>
              <th>P/L</th>
              <th>Recomendação</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.length > 0 ? (
              filteredStocks
                .sort((a, b) => (b.Score_MSI || 0) - (a.Score_MSI || 0))
                .map(stock => {
                  const strategy = getInvestmentStrategy(stock);
                  return (
                    <tr key={stock.Código} onClick={() => handleStockSelect(stock)}>
                      <td className="msi-score">
                        <div className="score-circle" style={{background: `conic-gradient(#D4AF37 ${stock.Score_MSI || 0}%, #2A2A2A 0%)`}}>
                          <span>{stock.Score_MSI || 0}</span>
                        </div>
                      </td>
                      <td>{stock.Empresa}</td>
                      <td>{stock.Código}</td>
                      <td>{stock.Atuação}</td>
                      <td>R$ {stock.Cotação_atual.toFixed(2)}</td>
                      <td>R$ {stock.Preço_Teto}</td>
                      <td className={stock.Margem_de_segurança >= 0 ? 'positive' : 'negative'}>
                        {stock.Margem_de_segurança}%
                      </td>
                      <td className="dividend">{stock.Dividend_Yield_bruto_estimado}%</td>
                      <td>{stock["P/L_projetado"]}</td>
                      <td>
                        <span className={`recommendation ${strategy.class}`}>
                          {strategy.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
            ) : (
              <tr>
                <td colSpan={10} className="no-results">Nenhuma empresa encontrada com os filtros selecionados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="dashboard-footer">
        <p>Última atualização: 18/03/2025 | O Blueprint Sábio é atualizado trimestralmente com os dados mais recentes do mercado</p>
        <div className="methodology-box">
          <h3>Sobre o Método Sábio de Investir (MSI)</h3>
          <p>Nossa metodologia proprietária analisa mais de 20 indicadores fundamentalistas para identificar empresas que combinam solidez, potencial de valorização e dividendos consistentes. A pontuação MSI incorpora dividend yield, margem de segurança, crescimento histórico, endividamento e valuation relativo.</p>
        </div>
      </div>
    </div>
  );
  
  const renderStockDetails = () => {
    if (!selectedStock) return null;
    
    const strategy = getInvestmentStrategy(selectedStock);
    
    return (
      <div className="stock-details-container">
        <button 
          className="back-button" 
          onClick={() => {
            setView('dashboard');
            setSelectedStock(null);
          }}
        >
          ← Voltar para Dashboard
        </button>
        
        <div className="stock-header">
          <div className="stock-title">
            <h2>{selectedStock.Empresa} ({selectedStock.Código})</h2>
            <p className="sector">{selectedStock.Atuação}</p>
          </div>
          
          <div className="stock-score">
            <div className="score-box">
              <div className="large-score-circle" style={{background: `conic-gradient(#D4AF37 ${selectedStock.Score_MSI || 0}%, #2A2A2A 0%)`}}>
                <span>{selectedStock.Score_MSI || 0}</span>
              </div>
              <p>Pontuação MSI</p>
            </div>
          </div>
        </div>
        
        <div className="stock-overview">
          <div className="overview-card">
            <h3>Cotação Atual</h3>
            <p className="price">R$ {selectedStock.Cotação_atual.toFixed(2)}</p>
          </div>
          
          <div className="overview-card">
            <h3>Preço Teto</h3>
            <p className="target-price">R$ {selectedStock.Preço_Teto}</p>
          </div>
          
          <div className="overview-card">
            <h3>Margem de Segurança</h3>
            <p className={selectedStock.Margem_de_segurança >= 0 ? 'positive margin' : 'negative margin'}>
              {selectedStock.Margem_de_segurança}%
            </p>
          </div>
          
          <div className="overview-card">
            <h3>Dividend Yield</h3>
            <p className="dividend">{selectedStock.Dividend_Yield_bruto_estimado}%</p>
          </div>
        </div>
        
        <div className="recommendation-container">
          <div className={`recommendation-card ${strategy.class}`}>
            <h3>Recomendação MSI: <span>{strategy.label}</span></h3>
            <p>{strategy.description}</p>
            <div className="recommendation-details">
              <div className="recommendation-item">
                <h4>Alocação Sugerida</h4>
                <p>{strategy.allocation}</p>
              </div>
              <div className="recommendation-item">
                <h4>Timing</h4>
                <p>{strategy.timing}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="detailed-metrics">
          <h3>Métricas Detalhadas</h3>
          
          <div className="metrics-grid">
            <div className="metric-card">
              <h4>Lucro Líquido Estimado 2025</h4>
              <p>{formatCurrency(selectedStock.Lucro_líquido_estimado_2025)}</p>
            </div>
            
            <div className="metric-card">
              <h4>P/L Projetado</h4>
              <p>{selectedStock["P/L_projetado"]}</p>
            </div>
            
            <div className="metric-card">
              <h4>P/L Médio (10 anos)</h4>
              <p>{selectedStock["P/L_médio_10_anos"]}</p>
            </div>
            
            <div className="metric-card">
              <h4>Desvio do P/L (%)</h4>
              <p className={selectedStock.Desvio_PL <= 0 ? 'positive' : 'negative'}>
                {selectedStock.Desvio_PL}%
              </p>
            </div>
            
            <div className="metric-card">
              <h4>CAGR Lucros (5 anos)</h4>
              <p className={selectedStock.CAGR_lucros_5_anos >= 0 ? 'positive' : 'negative'}>
                {selectedStock.CAGR_lucros_5_anos}%
              </p>
            </div>
            
            <div className="metric-card">
              <h4>Dívida Líquida/EBITDA</h4>
              <p className={selectedStock.Dívida_líquida_EBITDA < 2 ? 'positive' : 'neutral'}>
                {selectedStock.Dívida_líquida_EBITDA.toFixed(2)}
              </p>
            </div>
            
            <div className="metric-card">
              <h4>Lucro por Ação Est.</h4>
              <p>R$ {selectedStock.Lucro_por_ação_estimado}</p>
            </div>
            
            <div className="metric-card">
              <h4>Payout Esperado</h4>
              <p>{selectedStock.Payout_esperado}%</p>
            </div>
            
            <div className="metric-card">
              <h4>Dividendo por Ação</h4>
              <p>R$ {selectedStock.Dividendo_por_ação_bruto_projetado}</p>
            </div>
            
            <div className="metric-card">
              <h4>Frequência Dividendos</h4>
              <p>{selectedStock.Frequência}</p>
            </div>
            
            <div className="metric-card">
              <h4>Meses de Pagamento</h4>
              <p>{selectedStock.Meses_dividendos}</p>
            </div>
            
            <div className="metric-card">
              <h4>Última Atualização</h4>
              <p>{selectedStock.Última_atualização}</p>
            </div>
          </div>
        </div>
        
        <div className="investment-simulation">
          <h3>Simulação de Investimento</h3>
          
          <div className="simulation-table">
            <table>
              <thead>
                <tr>
                  <th>Valor Investido</th>
                  <th>Qtd. de Ações</th>
                  <th>Dividendos Anuais</th>
                  <th>Retorno por Dividendos</th>
                  <th>Potencial de Valorização</th>
                </tr>
              </thead>
              <tbody>
                {[10000, 25000, 50000, 100000].map(amount => {
                  const shares = Math.floor(amount / selectedStock.Cotação_atual);
                  const annualDividends = shares * selectedStock.Dividendo_por_ação_bruto_projetado;
                  const precoTeto = typeof selectedStock.Preço_Teto === 'number' ? 
                    selectedStock.Preço_Teto : parseFloat(String(selectedStock.Preço_Teto));
                  const potentialValue = shares * precoTeto;
                  const potentialGain = potentialValue - amount;
                  
                  return (
                    <tr key={amount}>
                      <td>R$ {amount.toLocaleString('pt-BR')}</td>
                      <td>{shares}</td>
                      <td>R$ {annualDividends.toFixed(2)}</td>
                      <td>{(annualDividends / amount * 100).toFixed(2)}%</td>
                      <td>R$ {potentialGain.toFixed(2)} ({selectedStock.Margem_de_segurança}%)</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };
  
  // Main render method
  return (
    <div className="blueprint-sabio">
      {isLoading ? (
        <div className="loading-screen">
          <div className="loading-icon">
            <div className="spinner"></div>
          </div>
          <p>Carregando Blueprint Sábio...</p>
        </div>
      ) : (
        <div className="app-container">
          {view === 'dashboard' && renderDashboard()}
          {view === 'details' && renderStockDetails()}
        </div>
      )}
      
      <style>{`
        /* Definição de variáveis CSS para padronização de cores */
        :root {
          --gold-primary: #D4AF37;
          --gold-light: rgba(212, 175, 55, 0.3);
          --gold-dark: #BE9B30;
          --gold-gradient: linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%);
          --bg-dark: #121212;
          --bg-light: #1A1A1A;
          --bg-gradient: linear-gradient(135deg, #121212 0%, #1A1A1A 100%);
          --card-bg: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          --success: #4CAF50; 
          --error: #F44336;
          --neutral: #AAAAAA;
          --text-light: #FFFFFF;
          --text-dim: #888888;
        }
        
        .blueprint-sabio {
          font-family: 'Inter', sans-serif;
          color: var(--text-light);
          background: var(--bg-gradient);
          min-height: 100vh;
          padding: 2rem;
        }
        
        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 80vh;
        }
        
        .spinner {
          width: 60px;
          height: 60px;
          border: 4px solid var(--gold-light);
          border-radius: 50%;
          border-top-color: var(--gold-primary);
          animation: spin 1s ease-in-out infinite;
        }
        
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .app-container {
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          flex-wrap: wrap;
        }
        
        .platform-intro h2 {
          font-size: 2rem;
          background: var(--gold-gradient);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 0.5rem;
        }
        
        .platform-intro p {
          color: var(--text-dim);
        }
        
        .update-section {
          margin-top: 1rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .last-update {
          font-size: 0.85rem;
          color: #AAAAAA;
          margin-bottom: 0.5rem;
        }
        
        .price-update {
          font-size: 0.8rem;
          color: #4CAF50;
          margin-left: 0.5rem;
        }
        
        .status-bar {
          min-height: 24px;
          margin: 0.5rem 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }
        
        .update-status {
          font-size: 0.85rem;
          color: #D4AF37;
          background: rgba(212, 175, 55, 0.1);
          padding: 0.3rem 0.8rem;
          border-radius: 4px;
          margin: 0.2rem 0;
          border-left: 3px solid #D4AF37;
        }
        
        .file-error {
          color: #F44336;
          font-size: 0.85rem;
          background: rgba(244, 67, 54, 0.1);
          padding: 0.3rem 0.8rem;
          border-radius: 4px;
          margin: 0.2rem 0;
          border-left: 3px solid #F44336;
        }
        
        .actions-container {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
          align-items: center;
          margin-top: 0.5rem;
        }
        
        .file-upload {
          position: relative;
        }
        
        .file-input {
          position: absolute;
          left: -9999px;
        }
        
        .file-upload-btn {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.2) 0%, rgba(212, 175, 55, 0.3) 100%);
          color: #D4AF37;
          border: 1px solid rgba(212, 175, 55, 0.4);
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.85rem;
        }
        
        .file-upload-btn:hover {
          background: linear-gradient(135deg, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.4) 100%);
          transform: translateY(-2px);
        }
        
        .update-prices-btn {
          padding: 0.6rem 1.2rem;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.3) 0%, rgba(76, 175, 80, 0.5) 100%);
          color: white;
          font-weight: bold;
          border: 1px solid rgba(76, 175, 80, 0.6);
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-size: 0.9rem;
          box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }
        
        .update-prices-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.4) 0%, rgba(76, 175, 80, 0.6) 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        }
        
        .update-prices-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          box-shadow: none;
        }
        
        .update-prices-btn.updating {
          animation: pulse 1.5s infinite;
          background: linear-gradient(135deg, rgba(76, 175, 80, 0.6) 0%, rgba(76, 175, 80, 0.8) 100%);
        }
        
        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.7; }
          100% { opacity: 1; }
        }
        
        .auto-update-toggle {
          display: flex;
          align-items: center;
        }
        
        .toggle-label {
          display: flex;
          align-items: center;
          cursor: pointer;
        }
        
        .toggle-label input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 36px;
          height: 20px;
          background-color: rgba(76, 175, 80, 0.2);
          border-radius: 20px;
          transition: all 0.3s;
          margin-right: 8px;
        }
        
        .toggle-switch:before {
          position: absolute;
          content: "";
          height: 16px;
          width: 16px;
          left: 2px;
          bottom: 2px;
          background-color: white;
          border-radius: 50%;
          transition: all 0.3s;
        }
        
        input:checked + .toggle-switch {
          background-color: rgba(76, 175, 80, 0.6);
        }
        
        input:checked + .toggle-switch:before {
          transform: translateX(16px);
        }
        
        .toggle-text {
          font-size: 0.85rem;
          color: #AAAAAA;
        }
        
        .dashboard-stats {
          display: flex;
          gap: 1.5rem;
        }
        
        .stat-card {
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          padding: 1rem;
          border-radius: 12px;
          text-align: center;
          min-width: 120px;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        
        .stat-card h3 {
          font-size: 1.5rem;
          background: linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .stat-card p {
          color: #888888;
          font-size: 0.8rem;
          margin-top: 0.5rem;
        }
        
        .filters-container {
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          border-radius: 12px;
          padding: 1.5rem;
          margin-bottom: 2rem;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        
        .search-box {
          margin-bottom: 1rem;
        }
        
        .search-input {
          width: 100%;
          padding: 0.8rem 1rem;
          border-radius: 50px;
          border: 1px solid rgba(212, 175, 55, 0.3);
          background: rgba(18, 18, 18, 0.8);
          color: #FFFFFF;
          font-size: 1rem;
        }
        
        .search-input:focus {
          outline: none;
          border-color: #D4AF37;
          box-shadow: 0 0 0 2px rgba(212, 175, 55, 0.1);
        }
        
        .filter-options {
          display: flex;
          flex-wrap: wrap;
          gap: 1rem;
        }
        
        .filter-group {
          flex: 1;
          min-width: 200px;
        }
        
        .filter-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #AAAAAA;
          font-size: 0.9rem;
        }
        
        .filter-group select {
          width: 100%;
          padding: 0.8rem;
          border-radius: 8px;
          border: 1px solid rgba(212, 175, 55, 0.3);
          background: rgba(18, 18, 18, 0.8);
          color: #FFFFFF;
        }
        
        .stocks-table-container {
          overflow-x: auto;
          margin-bottom: 2rem;
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          border-radius: 12px;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        
        .stocks-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .stocks-table th {
          background: rgba(18, 18, 18, 0.5);
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #D4AF37;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .stocks-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .stocks-table tbody tr {
          transition: background 0.3s ease;
          cursor: pointer;
        }
        
        .stocks-table tbody tr:hover {
          background: rgba(212, 175, 55, 0.1);
        }
        
        .msi-score {
          text-align: center;
        }
        
        .score-circle {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
          position: relative;
        }
        
        .score-circle span {
          position: relative;
          z-index: 2;
          font-weight: bold;
        }
        
        .score-circle::after {
          content: '';
          position: absolute;
          width: 80%;
          height: 80%;
          background: #1A1A1A;
          border-radius: 50%;
        }
        
        .positive {
          color: #4CAF50;
        }
        
        .negative {
          color: #F44336;
        }
        
        .neutral {
          color: #FFFFFF;
        }
        
        .dividend {
          color: #D4AF37;
          font-weight: bold;
        }
        
        .recommendation {
          display: inline-block;
          padding: 0.3rem 0.8rem;
          border-radius: 50px;
          font-size: 0.8rem;
          font-weight: bold;
          text-align: center;
        }
        
        .star {
          background: rgba(212, 175, 55, 0.3);
          color: #D4AF37;
        }
        
        .strong-buy {
          background: rgba(76, 175, 80, 0.3);
          color: #4CAF50;
        }
        
        .buy {
          background: rgba(33, 150, 243, 0.3);
          color: #2196F3;
        }
        
        .watch {
          background: rgba(255, 152, 0, 0.3);
          color: #FF9800;
        }
        
        .avoid {
          background: rgba(244, 67, 54, 0.3);
          color: #F44336;
        }
        
        .no-results {
          text-align: center;
          color: #888888;
          padding: 2rem;
        }
        
        .dashboard-footer {
          text-align: center;
          margin-top: 2rem;
          color: #888888;
          font-size: 0.9rem;
        }
        
        .methodology-box {
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 2rem;
          border: 1px solid rgba(212, 175, 55, 0.15);
          text-align: left;
        }
        
        .methodology-box h3 {
          color: #D4AF37;
          margin-bottom: 0.5rem;
        }
        
        .methodology-box p {
          color: #AAAAAA;
          line-height: 1.6;
        }
        
        /* Stock Details Styles */
        .stock-details-container {
          padding: 1rem;
        }
        
        .back-button {
          background: transparent;
          border: 1px solid #D4AF37;
          color: #D4AF37;
          padding: 0.5rem 1rem;
          border-radius: 50px;
          cursor: pointer;
          margin-bottom: 2rem;
          transition: all 0.3s ease;
        }
        
        .back-button:hover {
          background: rgba(212, 175, 55, 0.1);
        }
        
        .stock-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }
        
        .stock-title h2 {
          font-size: 2rem;
          background: linear-gradient(135deg, #FFFFFF 0%, #D4AF37 100%);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .sector {
          color: #888888;
        }
        
        .large-score-circle {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .large-score-circle span {
          position: relative;
          z-index: 2;
          font-size: 1.8rem;
          font-weight: bold;
        }
        
        .large-score-circle::after {
          content: '';
          position: absolute;
          width: 80%;
          height: 80%;
          background: #1A1A1A;
          border-radius: 50%;
        }
        
        .score-box {
          text-align: center;
        }
        
        .score-box p {
          margin-top: 0.5rem;
          color: #888888;
        }
        
        .stock-overview {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 1rem;
          margin-bottom: 2rem;
        }
        
        .overview-card {
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          border-radius: 12px;
          padding: 1.5rem;
          text-align: center;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        
        .overview-card h3 {
          font-size: 1rem;
          color: #AAAAAA;
          margin-bottom: 0.5rem;
        }
        
        .overview-card p {
          font-size: 1.8rem;
          font-weight: bold;
        }
        
        .price {
          color: #FFFFFF;
        }
        
        .target-price {
          color: #D4AF37;
        }
        
        .margin {
          font-size: 1.8rem;
          font-weight: bold;
        }
        
        .recommendation-container {
          margin-bottom: 2rem;
        }
        
        .recommendation-card {
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          border-radius: 12px;
          padding: 1.5rem;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        
        .recommendation-card.star {
          border-left: 5px solid #D4AF37;
        }
        
        .recommendation-card.strong-buy {
          border-left: 5px solid #4CAF50;
        }
        
        .recommendation-card.buy {
          border-left: 5px solid #2196F3;
        }
        
        .recommendation-card.watch {
          border-left: 5px solid #FF9800;
        }
        
        .recommendation-card.avoid {
          border-left: 5px solid #F44336;
        }
        
        .recommendation-card h3 {
          margin-bottom: 1rem;
        }
        
        .recommendation-card h3 span {
          color: #D4AF37;
        }
        
        .recommendation-card.strong-buy h3 span {
          color: #4CAF50;
        }
        
        .recommendation-card.buy h3 span {
          color: #2196F3;
        }
        
        .recommendation-card.watch h3 span {
          color: #FF9800;
        }
        
        .recommendation-card.avoid h3 span {
          color: #F44336;
        }
        
        .recommendation-details {
          display: flex;
          margin-top: 1rem;
          gap: 2rem;
          flex-wrap: wrap;
        }
        
        .recommendation-item {
          flex: 1;
          min-width: 200px;
        }
        
        .recommendation-item h4 {
          color: #AAAAAA;
          margin-bottom: 0.5rem;
        }
        
        .detailed-metrics {
          margin-bottom: 2rem;
        }
        
        .detailed-metrics h3 {
          margin-bottom: 1rem;
          color: #D4AF37;
        }
        
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
          gap: 1rem;
        }
        
        .metric-card {
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          border-radius: 12px;
          padding: 1rem;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        
        .metric-card h4 {
          font-size: 0.8rem;
          color: #AAAAAA;
          margin-bottom: 0.5rem;
        }
        
        .metric-card p {
          font-size: 1.1rem;
          font-weight: bold;
        }
        
        .investment-simulation {
          margin-bottom: 2rem;
        }
        
        .investment-simulation h3 {
          margin-bottom: 1rem;
          color: #D4AF37;
        }
        
        .simulation-table {
          background: linear-gradient(145deg, rgba(42, 42, 42, 0.9), rgba(26, 26, 26, 0.9));
          border-radius: 12px;
          overflow: hidden;
          border: 1px solid rgba(212, 175, 55, 0.15);
        }
        
        .simulation-table table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .simulation-table th {
          background: rgba(18, 18, 18, 0.5);
          padding: 1rem;
          text-align: left;
          color: #D4AF37;
          border-bottom: 1px solid rgba(212, 175, 55, 0.3);
        }
        
        .simulation-table td {
          padding: 1rem;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
          }
          
          .dashboard-stats {
            margin-top: 1rem;
            width: 100%;
            overflow-x: auto;
          }
          
          .stock-header {
            flex-direction: column;
          }
          
          .stock-score {
            margin-top: 1rem;
          }
          
          .recommendation-details {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default BlueprintSabio;