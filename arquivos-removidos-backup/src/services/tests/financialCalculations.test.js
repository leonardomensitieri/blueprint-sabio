/**
 * Testes para o serviço de cálculos financeiros
 */

// Simular o módulo com dados de exemplo para teste
const financialCalculations = {
  calculateBankDividends: (bankStock) => {
    // ROE padrão para bancos específicos
    const defaultROEs = {
      'ITUB4': 20.5, // Itaú
      'BBDC4': 18.7, // Bradesco
      'BBAS3': 15.2, // Banco do Brasil
      'SANB11': 16.8, // Santander
    };

    // Obter o ROE do banco
    const roe = bankStock.roe || defaultROEs[bankStock.ticker] || 15;
    
    // Valor patrimonial estimado
    const bookValue = bankStock.bookValue || bankStock.price / 1.5;
    
    // Payout ratio estimado
    const payoutRatio = bankStock.payoutRatio || 0.40;
    
    // Calcular lucro e dividendo por ação
    const estimatedEPS = bookValue * (roe / 100);
    const estimatedDPS = estimatedEPS * payoutRatio;
    
    // Calcular yield e rendas
    const dividendYield = (estimatedDPS / bankStock.price) * 100;
    const annualDividendIncome = estimatedDPS * bankStock.quantity;
    const monthlyDividendIncome = annualDividendIncome / 12;
    
    // Meses de pagamento para bancos
    const paymentMonths = [2, 5, 8, 11];
    
    // Distribuição mensal
    const monthlyDistribution = Array(12).fill(0);
    paymentMonths.forEach(month => {
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
  },

  calculateStockDividends: (stock) => {
    // Obter ou calcular dividendo por ação
    const dividendPerShare = stock.dividendPerShare || stock.price * 0.035;
    
    // Calcular yield e rendas
    const dividendYield = (dividendPerShare / stock.price) * 100;
    const annualDividendIncome = dividendPerShare * stock.quantity;
    const monthlyDividendIncome = annualDividendIncome / 12;
    
    // Meses padrão de pagamento
    const paymentMonths = [3, 6, 9, 12];
    
    // Distribuição mensal
    const monthlyDistribution = Array(12).fill(0);
    paymentMonths.forEach(month => {
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
  },

  getDefaultPaymentMonths: (ticker, sector) => {
    // Verificação simplificada para teste
    if (ticker.startsWith('ITUB') || ticker.startsWith('BBDC') || sector === 'Financeiro') {
      return [2, 5, 8, 11]; // Bancos
    } else if (ticker.endsWith('11')) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; // FIIs
    } else {
      return [3, 6, 9, 12]; // Padrão
    }
  },

  calculateIncomeTax: (grossValue, period) => {
    // Alíquotas de IR
    const taxRates = {
      '0-6': 0.225,
      '6-12': 0.20,
      '1-2': 0.175,
      '2+': 0.15,
    };
    
    const taxRate = taxRates[period] || 0.15;
    const taxAmount = grossValue * taxRate;
    const netValue = grossValue - taxAmount;
    
    return {
      grossValue,
      taxRate,
      taxAmount,
      netValue
    };
  },

  calculateFixedIncome: (principal, rate, percentageCDI, period, isTaxFree = false) => {
    // Calcular taxas
    const effectiveRate = (rate * (percentageCDI / 100)) / 100;
    const grossAnnualIncome = principal * effectiveRate;
    const grossMonthlyIncome = grossAnnualIncome / 12;
    
    let taxAmount = 0;
    let netAnnualIncome = grossAnnualIncome;
    let netMonthlyIncome = grossMonthlyIncome;
    let netYield = effectiveRate * 100;
    
    // Aplicar imposto se não for isento
    if (!isTaxFree) {
      const taxRates = {
        '0-6': 0.225,
        '6-12': 0.20,
        '1-2': 0.175,
        '2+': 0.15,
      };
      
      const taxRate = taxRates[period] || 0.15;
      taxAmount = grossAnnualIncome * taxRate;
      netAnnualIncome = grossAnnualIncome - taxAmount;
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
      taxRate: isTaxFree ? 0 : (period ? { '0-6': 0.225, '6-12': 0.20, '1-2': 0.175, '2+': 0.15 }[period] : 0.15)
    };
  },

  calculateEmergencyFund: (params) => {
    const { monthlyExpenses, employmentType, riskTolerance, dependents } = params;
    
    // Meses base por tipo de emprego
    const baseMonthsMap = {
      'clt': 6,
      'public': 4,
      'self_employed': 9,
      'business_owner': 12
    };
    
    // Multiplicador por risco
    const riskMultiplierMap = {
      'low': 1.25,
      'moderate': 1.0,
      'high': 0.85
    };
    
    const baseMonths = baseMonthsMap[employmentType] || 6;
    const riskMultiplier = riskMultiplierMap[riskTolerance] || 1.0;
    const dependentMultiplier = 1 + (parseInt(dependents) * 0.15);
    
    const recommendedMonths = Math.round(baseMonths * riskMultiplier * dependentMultiplier);
    const recommendedAmount = monthlyExpenses * recommendedMonths;
    
    return {
      recommendedMonths,
      recommendedAmount,
      baseMonths,
      riskMultiplier,
      dependentMultiplier
    };
  },

  calculatePortfolioSummary: (stocks, fixedIncome = null) => {
    // Cálculos para ações
    let totalEquity = 0;
    let totalDividends = 0;
    let totalQuantity = 0;
    let monthlyIncome = 0;
    let portfolioYield = 0;
    
    // Dados de renda fixa
    let fixedIncomeValue = 0;
    let fixedIncomeMonthlyIncome = 0;
    
    if (fixedIncome) {
      fixedIncomeValue = fixedIncome.principal || 0;
      fixedIncomeMonthlyIncome = fixedIncome.monthlyIncome || 0;
    }
    
    // Calcular valores para ações
    if (stocks && stocks.length > 0) {
      totalEquity = stocks.reduce((sum, stock) => sum + (stock.totalValue || (stock.price * stock.quantity)), 0);
      totalDividends = stocks.reduce((sum, stock) => sum + (stock.expectedIncome || (stock.dividendPerShare * stock.quantity)), 0);
      totalQuantity = stocks.reduce((sum, stock) => sum + stock.quantity, 0);
      
      monthlyIncome = totalDividends / 12;
      portfolioYield = totalEquity > 0 ? (totalDividends / totalEquity) * 100 : 0;
    }
    
    // Cálculos consolidados
    const totalPortfolio = totalEquity + fixedIncomeValue;
    const totalMonthlyIncome = monthlyIncome + fixedIncomeMonthlyIncome;
    const combinedYield = totalPortfolio > 0 ? ((totalDividends + (fixedIncomeMonthlyIncome * 12)) / totalPortfolio) * 100 : 0;
    
    // Distribuição mensal
    const monthlyDistribution = Array(12).fill(fixedIncomeMonthlyIncome);
    
    // Adicionar dividendos à distribuição
    stocks.forEach(stock => {
      const paymentMonths = stock.paymentMonths || [3, 6, 9, 12];
      const dividendPerPayment = (stock.expectedIncome || (stock.dividendPerShare * stock.quantity)) / paymentMonths.length;
      
      paymentMonths.forEach(month => {
        monthlyDistribution[month - 1] += dividendPerPayment;
      });
    });
    
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
  },

  formatCurrency: (value, locale = 'pt-BR', currency = 'BRL') => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  },

  formatPercentage: (value, locale = 'pt-BR') => {
    return new Intl.NumberFormat(locale, {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value / 100);
  }
};

// Exemplos de uso
console.log('=== TESTE 1: CÁLCULO DE DIVIDENDOS PARA BANCOS ===');
const itauExample = {
  ticker: 'ITUB4',
  price: 32.50,
  quantity: 100
};

const bankResult = financialCalculations.calculateBankDividends(itauExample);
console.log('ROE estimado:', bankResult.roe, '%');
console.log('Valor Patrimonial estimado:', bankResult.bookValue.toFixed(2));
console.log('Lucro por Ação estimado:', bankResult.estimatedEPS.toFixed(2));
console.log('Dividendo por Ação estimado:', bankResult.estimatedDPS.toFixed(2));
console.log('Dividend Yield:', bankResult.dividendYield.toFixed(2), '%');
console.log('Renda Anual de Dividendos:', bankResult.annualDividendIncome.toFixed(2));
console.log('Renda Mensal Média:', bankResult.monthlyDividendIncome.toFixed(2));
console.log('Meses de Pagamento:', bankResult.paymentMonths.join(', '));
console.log();

// Exemplo 2: Cálculo de dividendos para ações comuns
console.log('=== TESTE 2: CÁLCULO DE DIVIDENDOS PARA AÇÕES COMUNS ===');
const petrobrasExample = {
  ticker: 'PETR4',
  price: 34.75,
  quantity: 200,
  dividendPerShare: 3.2
};

const stockResult = financialCalculations.calculateStockDividends(petrobrasExample);
console.log('Dividendo por Ação:', stockResult.dividendPerShare.toFixed(2));
console.log('Dividend Yield:', stockResult.dividendYield.toFixed(2), '%');
console.log('Renda Anual de Dividendos:', stockResult.annualDividendIncome.toFixed(2));
console.log('Renda Mensal Média:', stockResult.monthlyDividendIncome.toFixed(2));
console.log('Meses de Pagamento:', stockResult.paymentMonths.join(', '));
console.log();

// Exemplo 3: Cálculo de imposto para renda fixa
console.log('=== TESTE 3: CÁLCULO DE IMPOSTO PARA RENDA FIXA ===');
const taxExamples = [
  { period: '0-6', amount: 1000 },
  { period: '6-12', amount: 1000 },
  { period: '1-2', amount: 1000 },
  { period: '2+', amount: 1000 }
];

taxExamples.forEach(example => {
  const taxResult = financialCalculations.calculateIncomeTax(example.amount, example.period);
  console.log(`Período ${example.period}:`);
  console.log(`  Alíquota: ${(taxResult.taxRate * 100).toFixed(1)}%`);
  console.log(`  Valor Bruto: ${taxResult.grossValue.toFixed(2)}`);
  console.log(`  Imposto: ${taxResult.taxAmount.toFixed(2)}`);
  console.log(`  Valor Líquido: ${taxResult.netValue.toFixed(2)}`);
});
console.log();

// Exemplo 4: Cálculo de rendimentos para renda fixa
console.log('=== TESTE 4: CÁLCULO DE RENDIMENTOS PARA RENDA FIXA ===');
const fixedIncomeExamples = [
  { principal: 100000, cdiRate: 12.15, cdiPercentage: 100, period: '2+', isTaxFree: false },
  { principal: 100000, cdiRate: 12.15, cdiPercentage: 110, period: '2+', isTaxFree: false },
  { principal: 100000, cdiRate: 12.15, cdiPercentage: 100, period: '2+', isTaxFree: true }
];

fixedIncomeExamples.forEach((example, index) => {
  console.log(`Exemplo ${index + 1}:`);
  console.log(`  Principal: ${example.principal}`);
  console.log(`  CDI: ${example.cdiRate}% a.a.`);
  console.log(`  % do CDI: ${example.cdiPercentage}%`);
  console.log(`  Período: ${example.period}`);
  console.log(`  Isento de IR: ${example.isTaxFree ? 'Sim' : 'Não'}`);
  
  const result = financialCalculations.calculateFixedIncome(
    example.principal,
    example.cdiRate,
    example.cdiPercentage,
    example.period,
    example.isTaxFree
  );
  
  console.log(`  Rendimento Bruto Anual: ${result.grossAnnualIncome.toFixed(2)}`);
  console.log(`  Rendimento Bruto Mensal: ${result.grossMonthlyIncome.toFixed(2)}`);
  console.log(`  Imposto: ${result.taxAmount.toFixed(2)}`);
  console.log(`  Rendimento Líquido Anual: ${result.netAnnualIncome.toFixed(2)}`);
  console.log(`  Rendimento Líquido Mensal: ${result.netMonthlyIncome.toFixed(2)}`);
  console.log(`  Taxa Bruta: ${result.grossYield.toFixed(2)}% a.a.`);
  console.log(`  Taxa Líquida: ${result.netYield.toFixed(2)}% a.a.`);
  console.log();
});

// Exemplo 5: Cálculo de reserva de emergência
console.log('=== TESTE 5: CÁLCULO DE RESERVA DE EMERGÊNCIA ===');
const emergencyFundExamples = [
  { monthlyExpenses: 5000, employmentType: 'clt', riskTolerance: 'moderate', dependents: 0 },
  { monthlyExpenses: 5000, employmentType: 'self_employed', riskTolerance: 'low', dependents: 2 },
  { monthlyExpenses: 5000, employmentType: 'public', riskTolerance: 'high', dependents: 1 }
];

emergencyFundExamples.forEach((example, index) => {
  console.log(`Exemplo ${index + 1}:`);
  console.log(`  Despesas Mensais: ${example.monthlyExpenses}`);
  console.log(`  Tipo de Emprego: ${example.employmentType}`);
  console.log(`  Tolerância a Risco: ${example.riskTolerance}`);
  console.log(`  Dependentes: ${example.dependents}`);
  
  const result = financialCalculations.calculateEmergencyFund(example);
  
  console.log(`  Meses Recomendados: ${result.recommendedMonths}`);
  console.log(`  Valor Recomendado: ${result.recommendedAmount.toFixed(2)}`);
  console.log(`  Meses Base: ${result.baseMonths}`);
  console.log(`  Multiplicador de Risco: ${result.riskMultiplier.toFixed(2)}`);
  console.log(`  Multiplicador de Dependentes: ${result.dependentMultiplier.toFixed(2)}`);
  console.log();
});

// Exemplo 6: Cálculo de portfólio consolidado
console.log('=== TESTE 6: CÁLCULO DE PORTFÓLIO CONSOLIDADO ===');
const sampleStocks = [
  { ticker: 'PETR4', quantity: 200, price: 34.75, dividendPerShare: 3.2, totalValue: 6950, expectedIncome: 640 },
  { ticker: 'ITUB4', quantity: 100, price: 32.5, dividendPerShare: 1.8, totalValue: 3250, expectedIncome: 180 },
  { ticker: 'VALE3', quantity: 150, price: 68.5, dividendPerShare: 4.1, totalValue: 10275, expectedIncome: 615 }
];

const sampleFixedIncome = {
  principal: 100000,
  monthlyIncome: 850
};

const portfolioResult = financialCalculations.calculatePortfolioSummary(sampleStocks, sampleFixedIncome);

console.log('Patrimônio em Ações:', portfolioResult.totalEquity.toFixed(2));
console.log('Renda Anual de Dividendos:', portfolioResult.totalDividends.toFixed(2));
console.log('Quantidade Total de Ações:', portfolioResult.totalQuantity);
console.log('Renda Mensal de Dividendos:', portfolioResult.monthlyDividendIncome.toFixed(2));
console.log('Yield da Carteira de Ações:', portfolioResult.equityYield.toFixed(2), '%');
console.log();
console.log('Patrimônio em Renda Fixa:', portfolioResult.fixedIncomeValue.toFixed(2));
console.log('Renda Mensal de Renda Fixa:', portfolioResult.fixedIncomeMonthlyIncome.toFixed(2));
console.log();
console.log('Patrimônio Total:', portfolioResult.totalPortfolio.toFixed(2));
console.log('Renda Mensal Total:', portfolioResult.totalMonthlyIncome.toFixed(2));
console.log('Yield Médio Combinado:', portfolioResult.combinedYield.toFixed(2), '%');
console.log();
console.log('Distribuição Mensal:', portfolioResult.monthlyDistribution.map(v => v.toFixed(2)).join(', '));