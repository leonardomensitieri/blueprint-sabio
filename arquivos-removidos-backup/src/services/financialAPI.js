/**
 * Serviço para interação com APIs financeiras
 * Em ambiente de desenvolvimento, usa dados simulados
 * Em produção, conectar com APIs reais de dados financeiros
 */

import { cacheApiResponse, getCachedApiResponse } from './apiCache';

const IS_DEVELOPMENT = process.env.NODE_ENV === 'development' && !process.env.REACT_APP_FINANCIAL_API_KEY;
const API_KEY = process.env.REACT_APP_FINANCIAL_API_KEY;

/**
 * Busca dados de uma ação pelo ticker
 * @param {string} ticker - Código da ação (ex: PETR4)
 * @returns {Promise<Object>} Dados da ação
 */
export const fetchStockData = async (ticker) => {
  try {
    // Verificar cache primeiro
    const cacheKey = `stock_${ticker}`;
    const cachedData = getCachedApiResponse(cacheKey);
    
    if (cachedData) {
      console.log(`Usando dados em cache para ${ticker}`);
      return cachedData;
    }
    
    if (IS_DEVELOPMENT) {
      // Em ambiente de desenvolvimento, usar dados simulados
      const mockData = getMockStockData(ticker);
      cacheApiResponse(cacheKey, mockData);
      return mockData;
    } else {
      // Em produção, chamar API Brapi
      const response = await fetch(`https://brapi.dev/api/quote/${ticker}?range=1d&interval=1d&token=${API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar dados para ${ticker}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`Nenhum resultado encontrado para ${ticker}`);
      }
      
      const stockData = data.results[0];
      const processedData = {
        name: stockData.longName || `${ticker}`,
        price: stockData.regularMarketPrice,
        dividendPerShare: stockData.dividendYield ? (stockData.dividendYield * stockData.regularMarketPrice / 100) : 0.5,
        sector: stockData.sector || 'N/A',
        paymentMonths: [3, 6, 9, 12] // Meses típicos de pagamento (ajustar conforme dados disponíveis)
      };
      
      // Armazenar no cache
      cacheApiResponse(cacheKey, processedData);
      return processedData;
    }
  } catch (error) {
    console.error(`Erro ao buscar dados para ${ticker}:`, error);
    // Retornar mock mesmo no caso de erro em produção
    const mockData = getMockStockData(ticker);
    return mockData;
  }
};

/**
 * Busca o preço atual de uma ação
 * @param {string} ticker - Código da ação (ex: PETR4)
 * @returns {Promise<number>} Preço atual da ação
 */
export const fetchStockPrice = async (ticker) => {
  try {
    // Verificar cache primeiro
    const cacheKey = `price_${ticker}`;
    const cachedPrice = getCachedApiResponse(cacheKey);
    
    if (cachedPrice !== null) {
      console.log(`Usando preço em cache para ${ticker}`);
      return cachedPrice;
    }
    
    // Usar dados simulados para desenvolvimento e produção até termos acesso a uma API real
    const stockData = getMockStockData(ticker);
    const price = stockData?.price || 0;
    
    // Adicionar pequena variação aleatória para simular mudanças no mercado (entre -2% e 2%)
    const randomVariation = 1 + (Math.random() * 0.04 - 0.02);
    const finalPrice = price * randomVariation;
    
    // Armazenar no cache
    cacheApiResponse(cacheKey, finalPrice);
    return finalPrice;
    
    /* COMENTADO ATÉ TERMOS ACESSO À API REAL
    if (IS_DEVELOPMENT) {
      // Em ambiente de desenvolvimento, usar dados simulados
      const stockData = getMockStockData(ticker);
      const price = stockData?.price || null;
      
      // Armazenar no cache
      cacheApiResponse(cacheKey, price);
      return price;
    } else {
      // Em produção, chamar API Brapi
      const response = await fetch(`https://brapi.dev/api/quote/${ticker}?range=1d&interval=1d&token=${API_KEY}`);
      
      if (!response.ok) {
        throw new Error(`Erro ao buscar preço para ${ticker}`);
      }
      
      const data = await response.json();
      
      if (!data.results || data.results.length === 0) {
        throw new Error(`Nenhum resultado encontrado para ${ticker}`);
      }
      
      const price = data.results[0].regularMarketPrice;
      
      // Armazenar no cache
      cacheApiResponse(cacheKey, price);
      return price;
    }
    */
  } catch (error) {
    console.error(`Erro ao buscar preço para ${ticker}:`, error);
    // Retornar mock mesmo no caso de erro
    const stockData = getMockStockData(ticker);
    return stockData?.price || 25.0; // Valor padrão caso não encontre o ticker
  }
};

/**
 * Busca os dividendos históricos de uma ação
 * @param {string} ticker - Código da ação (ex: PETR4)
 * @returns {Promise<Array>} Histórico de dividendos
 */
export const fetchDividendHistory = async (ticker) => {
  try {
    // Verificar cache primeiro
    const cacheKey = `dividends_${ticker}`;
    const cachedDividends = getCachedApiResponse(cacheKey);
    
    if (cachedDividends) {
      console.log(`Usando histórico de dividendos em cache para ${ticker}`);
      return cachedDividends;
    }
    
    if (IS_DEVELOPMENT) {
      // Em ambiente de desenvolvimento, usar dados simulados
      const mockDividends = getMockDividendHistory(ticker);
      cacheApiResponse(cacheKey, mockDividends);
      return mockDividends;
    } else {
      // Em produção, tentar buscar da API Brapi
      try {
        const response = await fetch(`https://brapi.dev/api/dividend/${ticker}?token=${API_KEY}`);
        
        if (!response.ok) {
          throw new Error(`Erro ao buscar dividendos para ${ticker}`);
        }
        
        const data = await response.json();
        
        if (!data.dividends || data.dividends.length === 0) {
          throw new Error(`Nenhum dividendo encontrado para ${ticker}`);
        }
        
        // Formatar os dados para o formato esperado pela aplicação
        const formattedDividends = data.dividends.map(div => ({
          date: div.paymentDate || div.date,
          amount: div.amount,
          type: div.type || 'Dividendo'
        }));
        
        // Ordenar do mais recente para o mais antigo
        const sortedDividends = formattedDividends.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        // Armazenar no cache
        cacheApiResponse(cacheKey, sortedDividends);
        return sortedDividends;
      } catch (error) {
        console.error(`Erro ao buscar dividendos da API para ${ticker}:`, error);
        // Em caso de erro, usar dados simulados
        const mockDividends = getMockDividendHistory(ticker);
        cacheApiResponse(cacheKey, mockDividends);
        return mockDividends;
      }
    }
  } catch (error) {
    console.error(`Erro ao buscar dividendos para ${ticker}:`, error);
    // Retornar mock mesmo no caso de erro em produção
    return getMockDividendHistory(ticker);
  }
};

/**
 * Busca a taxa CDI atual
 * @returns {Promise<number>} Taxa CDI anual em percentual (ex: 12.15)
 */
export const fetchCDIRate = async () => {
  try {
    // Verificar cache primeiro
    const cacheKey = 'cdi_rate';
    const cachedRate = getCachedApiResponse(cacheKey);
    
    if (cachedRate !== null) {
      console.log('Usando taxa CDI em cache');
      return cachedRate;
    }
    
    if (IS_DEVELOPMENT) {
      // Em ambiente de desenvolvimento, usar dado simulado
      const cdiRate = 12.15; // Taxa CDI simulada: 12,15% a.a.
      cacheApiResponse(cacheKey, cdiRate);
      return cdiRate;
    } else {
      // Em produção, tentar buscar da API Brapi
      try {
        const response = await fetch(`https://brapi.dev/api/v2/prime-rate?country=brazil&token=${API_KEY}`);
        
        if (!response.ok) {
          throw new Error('Erro ao buscar taxa CDI');
        }
        
        const data = await response.json();
        
        if (!data.primeRate || !data.primeRate.length) {
          throw new Error('Dados de CDI não encontrados');
        }
        
        // Obter a taxa CDI mais recente
        const cdiRate = data.primeRate[0].value;
        
        // Armazenar no cache
        cacheApiResponse(cacheKey, cdiRate);
        return cdiRate;
      } catch (error) {
        console.error('Erro ao buscar CDI da API:', error);
        // Em caso de erro, usar valor padrão
        const cdiRate = 12.15;
        cacheApiResponse(cacheKey, cdiRate);
        return cdiRate;
      }
    }
  } catch (error) {
    console.error('Erro ao buscar taxa CDI:', error);
    // Retornar taxa padrão em caso de erro
    return 12.15;
  }
};

// Funções auxiliares para dados simulados

/**
 * Gera dados simulados para uma ação
 * @param {string} ticker - Código da ação
 * @returns {Object} Dados simulados da ação
 */
const getMockStockData = (ticker) => {
  // Banco de dados simulado com algumas ações comuns
  const mockStocksDB = {
    'PETR4': {
      name: 'Petrobras PN',
      price: 32.50,
      dividendPerShare: 2.10,
      sector: 'Petróleo e Gás',
      paymentMonths: [3, 6, 9, 12]
    },
    'VALE3': {
      name: 'Vale ON',
      price: 68.75,
      dividendPerShare: 4.35,
      sector: 'Mineração',
      paymentMonths: [3, 6, 9, 12]
    },
    'ITUB4': {
      name: 'Itaú Unibanco PN',
      price: 27.30,
      dividendPerShare: 1.85,
      sector: 'Financeiro',
      paymentMonths: [2, 5, 8, 11]
    },
    'BBDC4': {
      name: 'Bradesco PN',
      price: 19.80,
      dividendPerShare: 1.40,
      sector: 'Financeiro',
      paymentMonths: [1, 4, 7, 10]
    },
    'BBAS3': {
      name: 'Banco do Brasil ON',
      price: 41.20,
      dividendPerShare: 2.50,
      sector: 'Financeiro',
      paymentMonths: [3, 6, 9, 12]
    },
    'WEGE3': {
      name: 'WEG ON',
      price: 42.60,
      dividendPerShare: 0.90,
      sector: 'Bens Industriais',
      paymentMonths: [3, 6, 9, 12]
    },
    'TAEE11': {
      name: 'Taesa UNIT',
      price: 34.75,
      dividendPerShare: 4.20,
      sector: 'Energia Elétrica',
      paymentMonths: [3, 6, 9, 12]
    },
    'ABEV3': {
      name: 'Ambev ON',
      price: 15.40,
      dividendPerShare: 0.75,
      sector: 'Bebidas',
      paymentMonths: [3, 7, 10, 12]
    }
  };

  // Se o ticker existir no banco de dados simulado, retornar os dados
  if (mockStocksDB[ticker]) {
    return mockStocksDB[ticker];
  }

  // Se o ticker não existir, gerar dados aleatórios
  return {
    name: `${ticker} S.A.`,
    price: Math.random() * 100 + 10, // Preço entre 10 e 110
    dividendPerShare: Math.random() * 3, // Dividendo entre 0 e 3
    sector: 'Outros',
    paymentMonths: [3, 6, 9, 12] // Pagamento trimestral padrão
  };
};

/**
 * Gera histórico de dividendos simulado para uma ação
 * @param {string} ticker - Código da ação
 * @returns {Array} Histórico de dividendos simulado
 */
const getMockDividendHistory = (ticker) => {
  const stockData = getMockStockData(ticker);
  const currentYear = new Date().getFullYear();
  
  // Gerar histórico dos últimos 3 anos
  const history = [];
  for (let year = currentYear - 3; year <= currentYear; year++) {
    for (const month of stockData.paymentMonths) {
      // Variação aleatória de até 20% no valor do dividendo
      const variation = 0.8 + Math.random() * 0.4; // Entre 0.8 e 1.2
      
      // Não incluir dividendos futuros do ano atual
      const now = new Date();
      if (year === currentYear && month > now.getMonth() + 1) {
        continue;
      }
      
      history.push({
        date: `${year}-${month.toString().padStart(2, '0')}-15`,
        amount: stockData.dividendPerShare * variation / stockData.paymentMonths.length,
        type: 'Dividendo'
      });
    }
  }
  
  // Ordenar do mais recente para o mais antigo
  return history.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export default {
  fetchStockData,
  fetchStockPrice,
  fetchDividendHistory,
  fetchCDIRate
};