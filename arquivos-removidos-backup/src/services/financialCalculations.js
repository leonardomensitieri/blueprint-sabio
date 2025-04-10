/**
 * Serviço centralizado para cálculos financeiros especializados
 * Implementa algoritmos específicos para diferentes tipos de ativos e cenários
 * Inclui análise quantitativa de ações, valuation, projeções de dividendos e métricas de crescimento
 */

/**
 * Calcula projeções de dividendos para bancos com base no ROE
 * @param {Object} bankStock - Objeto com dados da ação do banco
 * @param {string} bankStock.ticker - Código da ação do banco
 * @param {number} bankStock.price - Preço atual da ação
 * @param {number} bankStock.quantity - Quantidade de ações
 * @param {number} [bankStock.roe] - ROE do banco (se disponível)
 * @param {number} [bankStock.bookValue] - Valor patrimonial por ação (se disponível)
 * @param {number} [bankStock.payoutRatio] - Índice de pagamento de dividendos (se disponível)
 * @returns {Object} Projeções de dividendos
 */
export const calculateBankDividends = (bankStock) => {
  // ROE padrão para bancos específicos (caso não seja fornecido)
  const defaultROEs = {
    'ITUB4': 20.5, // Itaú
    'ITUB3': 20.5,
    'BBDC4': 18.7, // Bradesco
    'BBDC3': 18.7,
    'BBAS3': 15.2, // Banco do Brasil
    'SANB11': 16.8, // Santander
    'SANB3': 16.8,
    'BPAC11': 14.5, // BTG Pactual
    'BIDI11': 12.8, // Banco Inter
    'BIDI4': 12.8
  };

  // Obter o ROE do banco (fornecido ou padrão)
  const roe = bankStock.roe || defaultROEs[bankStock.ticker] || 15;
  
  // Obter ou calcular o valor patrimonial por ação (VPA)
  let bookValue = bankStock.bookValue;
  if (!bookValue) {
    // Estimativa baseada no preço e ROE (relação aproximada)
    const estimatedPriceToBook = 1.5; // Relação média de preço/VPA para bancos brasileiros
    bookValue = bankStock.price / estimatedPriceToBook;
  }
  
  // Obter ou estimar o payout ratio (% do lucro distribuído como dividendo)
  const payoutRatio = bankStock.payoutRatio || 0.40; // 40% é um valor médio para bancos brasileiros
  
  // Calcular o lucro por ação estimado com base no ROE e valor patrimonial
  const estimatedEPS = bookValue * (roe / 100);
  
  // Calcular o dividendo por ação com base no payout ratio
  const estimatedDPS = estimatedEPS * payoutRatio;
  
  // Calcular o dividend yield
  const dividendYield = (estimatedDPS / bankStock.price) * 100;
  
  // Calcular renda total de dividendos
  const annualDividendIncome = estimatedDPS * bankStock.quantity;
  
  // Calcular renda mensal média
  const monthlyDividendIncome = annualDividendIncome / 12;
  
  // Distribuição típica de pagamentos para bancos (trimestral, em meses diferentes dos padrões)
  const paymentMonths = [2, 5, 8, 11]; // Fevereiro, Maio, Agosto, Novembro
  
  // Distribuição de pagamentos mensais
  const monthlyDistribution = Array(12).fill(0);
  paymentMonths.forEach(month => {
    // Meses são base 1, arrays são base 0
    monthlyDistribution[month - 1] = annualDividendIncome / paymentMonths.length;
  });
  
  return {
    annualDividendIncome,
    monthlyDividendIncome,
    estimatedDPS,
    dividendYield,
    paymentMonths,
    monthlyDistribution,
    roe,
    bookValue,
    estimatedEPS,
    payoutRatio
  };
};

/**
 * Calcula projeções de dividendos para ações não-bancárias
 * @param {Object} stock - Objeto com dados da ação
 * @param {string} stock.ticker - Código da ação
 * @param {number} stock.price - Preço atual da ação
 * @param {number} stock.quantity - Quantidade de ações
 * @param {number} [stock.dividendPerShare] - Dividendo por ação (se disponível)
 * @param {number} [stock.payoutRatio] - Índice de pagamento de dividendos (se disponível)
 * @param {number} [stock.eps] - Lucro por ação (se disponível)
 * @returns {Object} Projeções de dividendos
 */
export const calculateStockDividends = (stock) => {
  // Obter ou calcular o dividendo por ação
  let dividendPerShare = stock.dividendPerShare;
  
  if (!dividendPerShare && stock.eps && stock.payoutRatio) {
    // Se temos lucro por ação e payout ratio, podemos calcular o dividendo
    dividendPerShare = stock.eps * stock.payoutRatio;
  } else if (!dividendPerShare) {
    // Estimativa baseada no dividend yield médio do mercado (3.5% para o mercado brasileiro)
    dividendPerShare = stock.price * 0.035;
  }
  
  // Calcular o dividend yield
  const dividendYield = (dividendPerShare / stock.price) * 100;
  
  // Calcular renda total de dividendos
  const annualDividendIncome = dividendPerShare * stock.quantity;
  
  // Calcular renda mensal média
  const monthlyDividendIncome = annualDividendIncome / 12;
  
  // Obter meses de pagamento com base no setor/tipo de empresa
  const paymentMonths = getDefaultPaymentMonths(stock.ticker, stock.sector);
  
  // Distribuição de pagamentos mensais
  const monthlyDistribution = Array(12).fill(0);
  paymentMonths.forEach(month => {
    // Meses são base 1, arrays são base 0
    monthlyDistribution[month - 1] = annualDividendIncome / paymentMonths.length;
  });
  
  return {
    annualDividendIncome,
    monthlyDividendIncome,
    dividendPerShare,
    dividendYield,
    paymentMonths,
    monthlyDistribution
  };
};

/**
 * Obtém os meses padrão de pagamento para diferentes tipos de empresas
 * @param {string} ticker - Código da ação
 * @param {string} [sector] - Setor da empresa (se disponível)
 * @returns {Array<number>} Meses de pagamento (1-12)
 */
export const getDefaultPaymentMonths = (ticker, sector) => {
  // Lista de bancos e empresas financeiras
  const bankTickers = ['ITUB4', 'ITUB3', 'BBDC4', 'BBDC3', 'BBAS3', 'SANB11', 'SANB3', 'BPAC11', 'BIDI11', 'BIDI4'];
  
  // Lista de empresas de serviços públicos (utilities)
  const utilityTickers = ['ELET3', 'ELET6', 'TAEE11', 'TAEE3', 'TRPL4', 'CMIG4', 'SBSP3', 'CPLE6', 'CPFE3', 'EGIE3'];
  
  // Lista de FIIs (Fundos de Investimento Imobiliário)
  const reitTickers = ['KNRI11', 'HGLG11', 'XPLG11', 'VISC11', 'MXRF11', 'BCFF11', 'HFOF11', 'IRDM11', 'HSML11'];
  
  // Verificar ticker específico primeiro
  if (bankTickers.includes(ticker) || sector === 'Financeiro' || sector === 'Bancos') {
    return [2, 5, 8, 11]; // Fevereiro, Maio, Agosto, Novembro
  } else if (utilityTickers.includes(ticker) || sector === 'Utilidade Pública' || sector === 'Energia Elétrica') {
    return [3, 6, 9, 12]; // Março, Junho, Setembro, Dezembro
  } else if (reitTickers.includes(ticker) || ticker.endsWith('11')) {
    return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // Pagamento mensal (comum em FIIs)
  } else {
    // Meses padrão para outras empresas (pagamento trimestral típico)
    return [3, 6, 9, 12]; // Março, Junho, Setembro, Dezembro
  }
};

/**
 * Calcula o imposto de renda para investimentos em renda fixa
 * @param {number} grossValue - Valor bruto do rendimento
 * @param {string} period - Período de investimento ('0-6', '6-12', '1-2', '2+')
 * @returns {Object} Cálculos de imposto de renda
 */
export const calculateIncomeTax = (grossValue, period) => {
  if (!grossValue || grossValue <= 0) {
    return {
      grossValue: 0,
      taxRate: 0,
      taxAmount: 0,
      netValue: 0
    };
  }
  
  // Alíquotas de imposto de renda de acordo com o período
  const taxRates = {
    '0-6': 0.225,  // 22.5% para aplicações até 6 meses
    '6-12': 0.20,  // 20% para aplicações de 6 meses a 1 ano
    '1-2': 0.175,  // 17.5% para aplicações de 1 a 2 anos
    '2+': 0.15,    // 15% para aplicações acima de 2 anos
  };
  
  // Obter alíquota de acordo com o período
  const taxRate = taxRates[period] || 0.15;
  
  // Calcular valor do imposto
  const taxAmount = grossValue * taxRate;
  
  // Calcular valor líquido
  const netValue = grossValue - taxAmount;
  
  return {
    grossValue,
    taxRate,
    taxAmount,
    netValue
  };
};

/**
 * Calcula rendimentos para investimentos em renda fixa
 * @param {number} principal - Valor principal investido
 * @param {number} rate - Taxa anual (em %)
 * @param {number} percentageCDI - Percentual do CDI (em %, ex: 110 para 110% do CDI)
 * @param {string} period - Período de investimento ('0-6', '6-12', '1-2', '2+')
 * @param {boolean} [isTaxFree=false] - Se o investimento é isento de IR (LCI, LCA)
 * @returns {Object} Cálculos de rendimentos
 */
export const calculateFixedIncome = (principal, rate, percentageCDI, period, isTaxFree = false) => {
  // Calcular taxa efetiva
  const effectiveRate = (rate * (percentageCDI / 100)) / 100;
  
  // Calcular rendimento bruto anual
  const grossAnnualIncome = principal * effectiveRate;
  
  // Calcular rendimento bruto mensal
  const grossMonthlyIncome = grossAnnualIncome / 12;
  
  let taxAmount = 0;
  let netAnnualIncome = grossAnnualIncome;
  let netMonthlyIncome = grossMonthlyIncome;
  let netYield = effectiveRate * 100;
  
  // Aplicar imposto de renda se não for isento
  if (!isTaxFree) {
    const taxCalc = calculateIncomeTax(grossAnnualIncome, period);
    taxAmount = taxCalc.taxAmount;
    netAnnualIncome = taxCalc.netValue;
    netMonthlyIncome = netAnnualIncome / 12;
    netYield = (netAnnualIncome / principal) * 100;
  }
  
  return {
    grossAnnualIncome,
    grossMonthlyIncome,
    taxAmount,
    netAnnualIncome,
    netMonthlyIncome,
    grossYield: effectiveRate * 100,
    netYield,
    taxRate: isTaxFree ? 0 : calculateIncomeTax(0, period).taxRate
  };
};

/**
 * Calcula o valor recomendado para reserva de emergência
 * @param {Object} params - Parâmetros para cálculo
 * @param {number} params.monthlyExpenses - Despesas mensais
 * @param {string} params.employmentType - Tipo de emprego ('clt', 'public', 'self_employed', 'business_owner')
 * @param {string} params.riskTolerance - Tolerância a risco ('low', 'moderate', 'high')
 * @param {number} params.dependents - Número de dependentes
 * @returns {Object} Cálculos para reserva de emergência
 */
export const calculateEmergencyFund = (params) => {
  const { monthlyExpenses, employmentType, riskTolerance, dependents } = params;
  
  // Determinar meses base de acordo com o tipo de emprego
  let baseMonths = 6; // Valor padrão
  
  switch (employmentType) {
    case 'clt':
      baseMonths = 6; // Empregado CLT - recomendação média
      break;
    case 'public':
      baseMonths = 4; // Servidor público - maior estabilidade
      break;
    case 'self_employed':
      baseMonths = 9; // Autônomo - menor estabilidade
      break;
    case 'business_owner':
      baseMonths = 12; // Empresário - maior variação de renda
      break;
  }
  
  // Aplicar ajuste por tolerância a risco
  let riskMultiplier = 1.0; // Valor padrão
  
  switch (riskTolerance) {
    case 'low':
      riskMultiplier = 1.25; // Baixa tolerância - aumenta a reserva
      break;
    case 'moderate':
      riskMultiplier = 1.0; // Tolerância média - sem ajuste
      break;
    case 'high':
      riskMultiplier = 0.85; // Alta tolerância - reduz a reserva
      break;
  }
  
  // Aplicar ajuste por dependentes (cada dependente adiciona 15%)
  const dependentMultiplier = 1 + (parseInt(dependents) * 0.15);
  
  // Calcular meses recomendados
  const recommendedMonths = Math.round(baseMonths * riskMultiplier * dependentMultiplier);
  
  // Calcular valor recomendado
  const recommendedAmount = monthlyExpenses * recommendedMonths;
  
  return {
    recommendedMonths,
    recommendedAmount,
    baseMonths,
    riskMultiplier,
    dependentMultiplier
  };
};

/**
 * Calcula dados consolidados para um portfólio completo
 * @param {Array<Object>} stocks - Array de ações na carteira
 * @param {Object} [fixedIncome] - Dados de renda fixa (opcional)
 * @returns {Object} Dados consolidados do portfólio
 */
export const calculatePortfolioSummary = (stocks, fixedIncome = null) => {
  // Dados iniciais
  let totalEquity = 0;
  let totalDividends = 0;
  let totalQuantity = 0;
  let monthlyIncome = 0;
  let portfolioYield = 0;
  
  // Valores de renda fixa (se fornecidos)
  let fixedIncomeValue = 0;
  let fixedIncomeMonthlyIncome = 0;
  
  if (fixedIncome) {
    fixedIncomeValue = fixedIncome.principal || 0;
    fixedIncomeMonthlyIncome = fixedIncome.monthlyIncome || 0;
  }
  
  // Calcular valores das ações
  if (stocks && stocks.length > 0) {
    // Somar valores totais
    totalEquity = stocks.reduce((sum, stock) => sum + (stock.totalValue || (stock.price * stock.quantity)), 0);
    totalDividends = stocks.reduce((sum, stock) => sum + (stock.expectedIncome || (stock.dividendPerShare * stock.quantity)), 0);
    totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
    
    // Calcular renda mensal de dividendos
    monthlyIncome = totalDividends / 12;
    
    // Calcular yield médio da carteira
    portfolioYield = totalEquity > 0 ? (totalDividends / totalEquity) * 100 : 0;
  }
  
  // Adicionar valores de renda fixa aos totais
  const totalPortfolio = totalEquity + fixedIncomeValue;
  const totalMonthlyIncome = monthlyIncome + fixedIncomeMonthlyIncome;
  const combinedYield = totalPortfolio > 0 ? ((totalDividends + (fixedIncomeMonthlyIncome * 12)) / totalPortfolio) * 100 : 0;
  
  // Cálculo da distribuição mensal de dividendos
  const monthlyDistribution = Array(12).fill(0);
  
  // Adicionar distribuição de cada ação ao total mensal
  stocks.forEach(stock => {
    // Determinar meses de pagamento
    const paymentMonths = stock.paymentMonths || getDefaultPaymentMonths(stock.ticker, stock.sector);
    const dividendPerPayment = (stock.expectedIncome || (stock.dividendPerShare * stock.quantity)) / paymentMonths.length;
    
    // Adicionar ao array de distribuição mensal
    paymentMonths.forEach(month => {
      // Meses são base 1, arrays são base 0
      monthlyDistribution[month - 1] += dividendPerPayment;
    });
  });
  
  // Adicionar renda fixa distribuída uniformemente entre os meses
  if (fixedIncomeMonthlyIncome > 0) {
    for (let i = 0; i < 12; i++) {
      monthlyDistribution[i] += fixedIncomeMonthlyIncome;
    }
  }
  
  return {
    totalEquity,
    totalDividends,
    totalQuantity,
    monthlyDividendIncome: monthlyIncome,
    equityYield: portfolioYield,
    
    fixedIncomeValue,
    fixedIncomeMonthlyIncome,
    
    totalPortfolio,
    totalMonthlyIncome,
    combinedYield,
    
    monthlyDistribution
  };
};

/**
 * Formata um valor monetário em reais (R$)
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado como moeda brasileira
 */
export const formatCurrency = (value) => {
  if (value === undefined || value === null) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
};

/**
 * Formata um valor percentual
 * @param {number} value - Valor a ser formatado
 * @returns {string} Valor formatado como percentual
 */
export const formatPercentage = (value) => {
  if (value === undefined || value === null) return '0%';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value / 100);
};

/**
 * Calcula métricas de valuation para uma ação
 * @param {Object} stock - Objeto com dados da ação
 * @param {string} stock.ticker - Código da ação
 * @param {number} stock.price - Preço atual da ação
 * @param {number} stock.shares - Quantidade total de ações da empresa
 * @param {number} stock.netIncome - Lucro líquido estimado
 * @param {number} [stock.historicalPE] - P/L médio histórico
 * @param {number} [stock.ebitda] - EBITDA da empresa (não necessário para bancos)
 * @param {number} [stock.netDebt] - Dívida líquida da empresa (não necessário para bancos)
 * @param {number} [stock.growthRate] - Taxa de crescimento estimada (5 anos)
 * @param {number} [stock.roe] - Retorno sobre patrimônio (necessário para bancos)
 * @returns {Object} Métricas de valuation
 */
export const calculateValuation = (stock) => {
  // Calcular valor de mercado
  const marketCap = stock.price * stock.shares;
  
  // Calcular lucro por ação
  const eps = stock.netIncome / stock.shares;
  
  // Calcular P/L atual
  const currentPE = stock.price / eps;
  
  // Calcular desvio do P/L da média histórica se disponível
  let peDivergence = null;
  if (stock.historicalPE) {
    peDivergence = (currentPE / stock.historicalPE) - 1;
  }
  
  // Calcular divida/EBITDA (exceto para bancos)
  let debtToEBITDA = null;
  const isBankStock = stock.ticker.match(/^(ITUB|BBDC|BBAS|SANB|BPAC|B3SA)/i) || stock.sector === 'Financeiro';
  
  if (!isBankStock && stock.ebitda && stock.netDebt) {
    debtToEBITDA = stock.netDebt / stock.ebitda;
  }
  
  // Calcular Dividend Yield com base no payout
  const expectedPayout = getExpectedPayout(stock.ticker, stock.sector);
  const expectedDividendPerShare = eps * expectedPayout;
  const dividendYield = (expectedDividendPerShare / stock.price) * 100;
  
  // Calcular preço-teto
  let ceilingPrice;
  
  if (isBankStock && stock.roe) {
    // Método específico para bancos baseado no ROE
    const growthRate = stock.growthRate || 0.05; // 5% de crescimento padrão se não fornecido
    const requiredReturn = 0.12; // 12% de retorno exigido
    
    // Fórmula personalizada para bancos considerando ROE e crescimento
    const bookValue = stock.price / (stock.roe / 100 * expectedPayout * 10); // Estimativa do valor patrimonial
    const adjustedROE = stock.roe / 100 * (1 + growthRate);
    ceilingPrice = bookValue * adjustedROE * expectedPayout / (requiredReturn - growthRate);
  } else {
    // Método padrão: dividendo dividido pela taxa de retorno mínima desejada (6%)
    ceilingPrice = expectedDividendPerShare / 0.06;
  }
  
  // Calcular margem de segurança
  const safetyMargin = (ceilingPrice / stock.price) - 1;
  
  return {
    marketCap,
    eps,
    currentPE,
    peDivergence,
    debtToEBITDA,
    expectedPayout,
    expectedDividendPerShare,
    dividendYield,
    ceilingPrice,
    safetyMargin
  };
};

/**
 * Retorna o payout esperado para uma ação específica ou setor
 * @param {string} ticker - Código da ação
 * @param {string} [sector] - Setor da empresa
 * @returns {number} Payout esperado (0-1)
 */
export const getExpectedPayout = (ticker, sector) => {
  // Payouts personalizados para ações específicas
  const specificPayouts = {
    'ITUB4': 0.45, // Itaú
    'BBDC4': 0.40, // Bradesco
    'BBAS3': 0.40, // Banco do Brasil
    'SANB11': 0.50, // Santander
    'TAEE11': 0.90, // Taesa
    'EGIE3': 0.85, // Engie
    'TRPL4': 0.85, // ISA CTEEP
    'PETR4': 0.60, // Petrobras
    'VALE3': 0.50, // Vale
    'WEGE3': 0.65, // WEG
    'FLRY3': 0.35, // Fleury
    'ABEV3': 0.70  // Ambev
  };
  
  // Payout por setor (usado como fallback)
  const sectorPayouts = {
    'Financeiro': 0.40,
    'Bancos': 0.40,
    'Energia Elétrica': 0.80,
    'Utilidade Pública': 0.75,
    'Petróleo e Gás': 0.60,
    'Mineração': 0.50,
    'Bens Industriais': 0.55,
    'Consumo': 0.60,
    'Saúde': 0.35,
    'Tecnologia': 0.30,
    'Imobiliário': 0.90
  };
  
  // Verificar se existe payout específico para o ticker
  if (specificPayouts[ticker]) {
    return specificPayouts[ticker];
  }
  
  // Verificar se existe payout para o setor
  if (sector && sectorPayouts[sector]) {
    return sectorPayouts[sector];
  }
  
  // Payout padrão
  return 0.50; // 50% é um valor médio para o mercado brasileiro
};

/**
 * Projeta o crescimento futuro da renda passiva com base em aportes regulares
 * @param {Object} params - Parâmetros para projeção
 * @param {number} params.initialInvestment - Investimento atual total
 * @param {number} params.currentIncome - Renda anual atual
 * @param {number} params.monthlyContribution - Aporte mensal planejado
 * @param {number} params.years - Anos para projeção
 * @param {number} [params.averageYield] - Rendimento médio da carteira (%)
 * @param {number} [params.growthRate] - Taxa de crescimento de dividendos (%)
 * @param {boolean} [params.reinvestDividends] - Se deve reinvestir dividendos
 * @returns {Array<Object>} Projeção ano a ano
 */
export const projectIncomeGrowth = (params) => {
  const {
    initialInvestment,
    currentIncome,
    monthlyContribution,
    years,
    averageYield = 5.0, // Rendimento médio padrão de 5%
    growthRate = 3.0,   // Crescimento de dividendos padrão de 3%
    reinvestDividends = false
  } = params;
  
  // Converter percentuais para decimais
  const yieldRate = averageYield / 100;
  const growthRateDecimal = growthRate / 100;
  
  // Inicializar arrays para projeção
  const projection = [];
  
  // Valores iniciais
  let currentYear = new Date().getFullYear();
  let totalInvestment = initialInvestment;
  let annualIncome = currentIncome;
  let cumulativeIncome = 0;
  
  // Gerar projeção para cada ano
  for (let yearIndex = 0; yearIndex <= years; yearIndex++) {
    // Adicionar ano atual à projeção
    projection.push({
      year: currentYear + yearIndex,
      totalInvestment,
      annualIncome,
      monthlyIncome: annualIncome / 12,
      cumulativeIncome,
      yield: (annualIncome / totalInvestment) * 100
    });
    
    if (yearIndex < years) {
      // Calcular novos aportes para o próximo ano
      const yearlyContribution = monthlyContribution * 12;
      
      // Calcular renda do próximo ano
      let nextYearIncome;
      
      if (reinvestDividends) {
        // Se reinvestir, o valor dos rendimentos também é adicionado ao patrimônio
        totalInvestment += yearlyContribution + annualIncome;
        
        // A renda cresce tanto pelo crescimento natural quanto pelo reinvestimento
        nextYearIncome = totalInvestment * yieldRate;
      } else {
        // Sem reinvestimento, só aportes regulares
        totalInvestment += yearlyContribution;
        
        // Crescimento natural dos dividendos + dividendos dos novos aportes
        nextYearIncome = annualIncome * (1 + growthRateDecimal) + (yearlyContribution * yieldRate);
      }
      
      // Atualizar valores para o próximo ano
      cumulativeIncome += annualIncome;
      annualIncome = nextYearIncome;
    }
  }
  
  return projection;
};

/**
 * Calcula a frequência de pagamentos de dividendos e alertas para anúncios próximos
 * @param {string} ticker - Código da ação
 * @param {Array} [dividendHistory] - Histórico de dividendos anterior
 * @returns {Object} Informações sobre frequência de dividendos e alertas
 */
export const calculateDividendFrequency = (ticker, dividendHistory = []) => {
  const today = new Date();
  const currentMonth = today.getMonth(); // 0-11
  
  // Obter meses padrão de pagamento para o ticker
  const paymentMonths = getDefaultPaymentMonths(ticker);
  
  // Array para contagem de frequência real baseada no histórico
  const frequencyCount = Array(12).fill(0);
  
  // Analisar histórico para confirmar padrões
  if (dividendHistory && dividendHistory.length > 0) {
    dividendHistory.forEach(dividend => {
      const dividendDate = new Date(dividend.date);
      const month = dividendDate.getMonth();
      frequencyCount[month]++;
    });
  }
  
  // Determinar meses reais de pagamento baseado no histórico
  const actualPaymentMonths = [];
  frequencyCount.forEach((count, month) => {
    if (count > 0) {
      actualPaymentMonths.push(month + 1); // Converter para base 1 (1-12)
    }
  });
  
  // Usar meses reais se disponíveis, caso contrário usar os padrão
  const finalPaymentMonths = actualPaymentMonths.length > 0 ? actualPaymentMonths : paymentMonths;
  
  // Calcular próximo mês de pagamento
  const nextPaymentMonths = finalPaymentMonths.filter(month => month > currentMonth + 1);
  const nextPaymentMonth = nextPaymentMonths.length > 0 ? 
    nextPaymentMonths[0] : 
    finalPaymentMonths[0]; // Se não houver próximos este ano, pegar o primeiro do próximo ano
  
  // Meses típicos de anúncio (geralmente 1 mês antes do pagamento)
  const announcementMonths = finalPaymentMonths.map(month => {
    const announceMonth = month - 1 <= 0 ? 12 : month - 1;
    return announceMonth;
  });
  
  // Verificar se estamos próximos de um anúncio
  const isNearAnnouncement = announcementMonths.includes(currentMonth + 1);
  
  // Meses até o próximo pagamento
  let monthsToNextPayment;
  if (nextPaymentMonth > currentMonth + 1) {
    monthsToNextPayment = nextPaymentMonth - (currentMonth + 1);
  } else {
    monthsToNextPayment = (12 - (currentMonth + 1)) + nextPaymentMonth;
  }
  
  return {
    paymentFrequency: finalPaymentMonths.length, // Quantas vezes ao ano
    paymentMonths: finalPaymentMonths,
    announcementMonths,
    nextPaymentMonth,
    monthsToNextPayment,
    isNearAnnouncement,
    historicalFrequency: frequencyCount
  };
};

export default {
  calculateBankDividends,
  calculateStockDividends,
  getDefaultPaymentMonths,
  calculateIncomeTax,
  calculateFixedIncome,
  calculateEmergencyFund,
  calculatePortfolioSummary,
  calculateValuation,
  getExpectedPayout,
  projectIncomeGrowth,
  calculateDividendFrequency,
  formatCurrency,
  formatPercentage
};