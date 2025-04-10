/**
 * Configuração para simular APIs financeiras durante o desenvolvimento
 * Este arquivo configura mocks para requisições HTTP simuladas
 */

const mockStocksData = {
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
  }
};

// Versão simplificada da API mock
export const initMockApi = () => {
  console.log('Mock API inicializada em modo simplificado');
  // Intercepta fetch globalmente para fins de desenvolvimento
  const originalFetch = window.fetch;
  
  window.fetch = function(url, options) {
    // Se a URL corresponder a algum dos nossos padrões de API, use mock
    if (url.includes('api.example.com') || url.includes('brapi.dev')) {
      console.log('Interceptando requisição para:', url);
      
      // Mock para preços de ações
      if (url.includes('/stocks/') && url.includes('/price')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ price: Math.random() * 80 + 20 })
        });
      }
      
      // Mock para dados de ações
      if (url.includes('/stocks/') || url.includes('/quote/')) {
        const ticker = url.split('/').pop().split('?')[0];
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockStocksData[ticker] || {
            name: `${ticker} S.A.`,
            price: Math.random() * 100 + 10,
            dividendPerShare: Math.random() * 3
          })
        });
      }
      
      // Mock para CDI
      if (url.includes('/indicators/cdi') || url.includes('/prime-rate')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ cdiRate: 12.15 })
        });
      }
      
      // Se não corresponder a nenhum padrão específico, use o fetch original
      return originalFetch(url, options);
    }
    
    // Para todas as outras URLs, use o comportamento normal do fetch
    return originalFetch(url, options);
  };
};

export const stopMockApi = () => {
  console.log('Mock API encerrada');
  // Nada a fazer na versão simplificada
};

// Exportar como objeto para compatibilidade com o código existente
const mockApi = {
  initMockApi,
  stopMockApi
};

export default mockApi;