import React, { useState, useEffect } from 'react';
import { fetchCDIRate } from '../../services/financialAPI';
import { 
  calculateFixedIncome, 
  calculateIncomeTax, 
  formatCurrency, 
  formatPercentage 
} from '../../services/financialCalculations';
import './FixedIncome.css';

const FixedIncome = () => {
  const [totalFixedIncome, setTotalFixedIncome] = useState('');
  const [investmentPeriod, setInvestmentPeriod] = useState('2+');
  const [cdiRate, setCdiRate] = useState(12.15); // Taxa padrão inicial
  const [taxRate, setTaxRate] = useState(0.15); // Alíquota de IR inicial (15%)
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Simulações de rendimentos com diferentes porcentagens do CDI
  const [simulations, setSimulations] = useState([
    { percentage: 100, annualIncome: 0, monthlyIncome: 0, netYield: 0 },
    { percentage: 110, annualIncome: 0, monthlyIncome: 0, netYield: 0 },
    { percentage: 120, annualIncome: 0, monthlyIncome: 0, netYield: 0 }
  ]);

  useEffect(() => {
    // Buscar taxa CDI atual ao carregar o componente
    fetchCurrentCDIRate();
  }, []);

  useEffect(() => {
    // Atualizar a alíquota de IR com base no período selecionado
    updateTaxRate(investmentPeriod);
  }, [investmentPeriod]);

  useEffect(() => {
    // Recalcular as simulações quando os valores mudarem
    calculateSimulations();
  }, [totalFixedIncome, cdiRate, taxRate]);

  const fetchCurrentCDIRate = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const rate = await fetchCDIRate();
      setCdiRate(rate);
    } catch (error) {
      console.error('Erro ao buscar taxa CDI:', error);
      setError('Não foi possível obter a taxa CDI atual. Usando valor padrão de 12.15%.');
      // Mantém a taxa padrão de 12.15%
    } finally {
      setIsLoading(false);
    }
  };

  const updateTaxRate = (period) => {
    // Usar o serviço de cálculo para obter alíquota de IR
    const taxCalc = calculateIncomeTax(0, period);
    setTaxRate(taxCalc.taxRate);
  };

  const calculateSimulations = () => {
    const amount = parseFloat(totalFixedIncome) || 0;
    
    const updatedSimulations = simulations.map((sim) => {
      // Usar o serviço especializado para calcular rendimentos de renda fixa
      const result = calculateFixedIncome(
        amount,               // Principal
        cdiRate,              // Taxa CDI
        sim.percentage,       // Percentual do CDI (100%, 110%, 120%)
        investmentPeriod,     // Período de investimento para cálculo do IR
        false                 // Não isento de IR
      );
      
      return {
        ...sim,
        annualIncome: result.netAnnualIncome,
        monthlyIncome: result.netMonthlyIncome,
        netYield: result.netYield,
        grossYield: result.grossYield,
        taxAmount: result.taxAmount
      };
    });
    
    setSimulations(updatedSimulations);
  };

  const handleInputChange = (e) => {
    // Remover caracteres não numéricos, exceto vírgula e ponto
    let value = e.target.value.replace(/[^\d,.]/g, '');
    
    // Substituir vírgula por ponto
    value = value.replace(',', '.');
    
    setTotalFixedIncome(value);
  };

  const handlePeriodChange = (e) => {
    setInvestmentPeriod(e.target.value);
  };

  // Usando as funções de formatação importadas do serviço de cálculos

  return (
    <div className="fixed-income">
      <h2>Simulação de Renda Fixa</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="fixed-income-form">
        <div className="form-group">
          <label htmlFor="totalFixedIncome">Patrimônio Total em Renda Fixa</label>
          <div className="input-with-prefix">
            <span className="input-prefix">R$</span>
            <input
              type="text"
              id="totalFixedIncome"
              value={totalFixedIncome}
              onChange={handleInputChange}
              placeholder="100.000,00"
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="investmentPeriod">Tempo de Investimento</label>
          <select
            id="investmentPeriod"
            value={investmentPeriod}
            onChange={handlePeriodChange}
            disabled={isLoading}
          >
            <option value="0-6">Até 6 meses (IR: 22,5%)</option>
            <option value="6-12">6 meses a 1 ano (IR: 20%)</option>
            <option value="1-2">1 a 2 anos (IR: 17,5%)</option>
            <option value="2+">Mais de 2 anos (IR: 15%)</option>
          </select>
        </div>
      </div>
      
      <div className="cdi-info">
        <div className="cdi-rate">
          <h3>Taxa CDI Atual</h3>
          <p>{cdiRate.toFixed(2)}% a.a.</p>
          <button 
            className="refresh-button" 
            onClick={fetchCurrentCDIRate}
            disabled={isLoading}
          >
            {isLoading ? 'Atualizando...' : 'Atualizar Taxa'}
          </button>
        </div>
        
        <div className="tax-info">
          <h3>Imposto de Renda</h3>
          <p>{(taxRate * 100).toFixed(1)}%</p>
          <span className="tax-period">
            {investmentPeriod === '0-6' && 'Aplicação até 6 meses'}
            {investmentPeriod === '6-12' && 'Aplicação de 6 meses a 1 ano'}
            {investmentPeriod === '1-2' && 'Aplicação de 1 a 2 anos'}
            {investmentPeriod === '2+' && 'Aplicação acima de 2 anos'}
          </span>
        </div>
      </div>
      
      <div className="simulations-container">
        <h3>Simulações de Rendimento</h3>
        <div className="simulations-grid">
          {simulations.map((sim, index) => (
            <div key={index} className="simulation-card">
              <div className="simulation-header">
                <h4>{sim.percentage}% do CDI</h4>
                <span className="net-yield">{formatPercentage(sim.netYield)} a.a. líquido</span>
              </div>
              
              <div className="simulation-body">
                <div className="income-item">
                  <span className="label">Rendimento Anual:</span>
                  <span className="value">{formatCurrency(sim.annualIncome)}</span>
                </div>
                <div className="income-item">
                  <span className="label">Rendimento Mensal:</span>
                  <span className="value">{formatCurrency(sim.monthlyIncome)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="fixed-income-info">
        <h3>Entendendo o Rendimento Líquido</h3>
        <p>
          No Brasil, investimentos em renda fixa como CDBs, LCIs, LCAs e Tesouro Direto são tributados pelo Imposto de Renda. 
          A alíquota varia de acordo com o tempo que o dinheiro fica aplicado, sendo regressiva quanto maior o prazo.
        </p>
        
        <div className="tax-table">
          <div className="tax-row header">
            <div>Prazo</div>
            <div>Alíquota IR</div>
          </div>
          <div className="tax-row">
            <div>Até 6 meses</div>
            <div>22,5%</div>
          </div>
          <div className="tax-row">
            <div>De 6 meses a 1 ano</div>
            <div>20%</div>
          </div>
          <div className="tax-row">
            <div>De 1 a 2 anos</div>
            <div>17,5%</div>
          </div>
          <div className="tax-row">
            <div>Acima de 2 anos</div>
            <div>15%</div>
          </div>
        </div>
        
        <p>
          <strong>Dica:</strong> Ao planejar seus investimentos em renda fixa, leve em consideração o prazo que pretende deixar 
          o dinheiro aplicado para otimizar o rendimento líquido.
        </p>
        
        <div className="tax-free-info">
          <h4>Investimentos Isentos de IR</h4>
          <p>
            Alguns investimentos são isentos de Imposto de Renda, como LCI (Letra de Crédito Imobiliário), 
            LCA (Letra de Crédito do Agronegócio) e Debêntures Incentivadas. Considere-os em seu planejamento financeiro.
          </p>
        </div>
      </div>
    </div>
  );
};

export default FixedIncome;