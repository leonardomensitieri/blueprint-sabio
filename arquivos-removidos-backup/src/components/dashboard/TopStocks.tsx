import React, { useState, useEffect } from 'react';
import { Stock } from '../../stockData';
import './TopStocks.css';

interface TopStocksProps {
  stocks: Stock[];
}

interface StockGroup {
  label: string;
  description: string;
  stocks: Stock[];
  class: string;
}

const TopStocks: React.FC<TopStocksProps> = ({ stocks }) => {
  const [stockGroups, setStockGroups] = useState<StockGroup[]>([]);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  useEffect(() => {
    if (stocks.length === 0) return;

    // Calculate MSI score for each stock if not already calculated
    const stocksWithScore = stocks.map(stock => {
      if (stock.Score_MSI) return stock;
      return {
        ...stock,
        Score_MSI: calculateMSIScore(stock)
      };
    });

    // Sort stocks by MSI score (higher = better)
    const sortedStocks = [...stocksWithScore].sort((a, b) => (b.Score_MSI || 0) - (a.Score_MSI || 0));

    // Group stocks by score range
    const eliteStocks = sortedStocks.filter(stock => (stock.Score_MSI || 0) >= 85).slice(0, 5);
    const strongBuyStocks = sortedStocks.filter(stock => (stock.Score_MSI || 0) >= 70 && (stock.Score_MSI || 0) < 85).slice(0, 5);
    const buyStocks = sortedStocks.filter(stock => (stock.Score_MSI || 0) >= 55 && (stock.Score_MSI || 0) < 70).slice(0, 5);
    const dividendStocks = sortedStocks
      .filter(stock => stock.Dividend_Yield_bruto_estimado >= 8)
      .sort((a, b) => b.Dividend_Yield_bruto_estimado - a.Dividend_Yield_bruto_estimado)
      .slice(0, 5);
    const growthStocks = sortedStocks
      .filter(stock => stock.CAGR_lucros_5_anos >= 10)
      .sort((a, b) => b.CAGR_lucros_5_anos - a.CAGR_lucros_5_anos)
      .slice(0, 5);

    // Create groups
    const groups: StockGroup[] = [
      {
        label: "Estrelas do Portfolio",
        description: "As ações de elite com os mais altos scores MSI, combinando valor, qualidade e dividendos.",
        stocks: eliteStocks,
        class: "elite"
      },
      {
        label: "Melhores Compras Atuais",
        description: "Excelentes oportunidades com ótima relação risco/retorno no momento atual.",
        stocks: strongBuyStocks,
        class: "strong-buy"
      },
      {
        label: "Boas Oportunidades",
        description: "Ações sólidas com bom potencial e fundamentos consistentes.",
        stocks: buyStocks,
        class: "buy"
      },
      {
        label: "Maiores Dividend Yields",
        description: "Ações com os maiores rendimentos em dividendos projetados.",
        stocks: dividendStocks,
        class: "dividend"
      },
      {
        label: "Maior Crescimento",
        description: "Ações com maior crescimento histórico de lucros nos últimos 5 anos.",
        stocks: growthStocks,
        class: "growth"
      }
    ];

    setStockGroups(groups);
    // Definir o primeiro grupo como ativo por padrão
    setActiveGroup(groups[0].label);
  }, [stocks]);

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

  // Format currency values
  const formatCurrency = (value: number): string => {
    if (value >= 1000000000) {
      return `R$ ${(value / 1000000000).toFixed(1)} bi`;
    } else if (value >= 1000000) {
      return `R$ ${(value / 1000000).toFixed(1)} mi`;
    } else {
      return `R$ ${value.toLocaleString('pt-BR')}`;
    }
  };

  const handleGroupClick = (label: string) => {
    setActiveGroup(label);
  };

  return (
    <div className="top-stocks-container">
      <div className="top-stocks-header">
        <h2>Top Recomendações do MSI</h2>
        <p>As melhores ações do mercado brasileiro de acordo com o Método Sábio de Investir</p>
      </div>
      
      <div className="stock-groups-navigation">
        {stockGroups.map(group => (
          <button 
            key={group.label}
            className={`group-button ${group.class} ${activeGroup === group.label ? 'active' : ''}`}
            onClick={() => handleGroupClick(group.label)}
          >
            {group.label}
          </button>
        ))}
      </div>
      
      {stockGroups.map(group => (
        <div 
          key={group.label} 
          className={`stock-group ${activeGroup === group.label ? 'active' : ''}`}
        >
          <div className="group-header">
            <h3>{group.label}</h3>
            <p>{group.description}</p>
          </div>
          
          <div className="stocks-grid">
            {group.stocks.length > 0 ? (
              group.stocks.map(stock => (
                <div key={stock.Código} className="stock-card">
                  <div className="stock-card-header">
                    <div className="score-badge">
                      <div className="score-circle" style={{background: `conic-gradient(#D4AF37 ${stock.Score_MSI || 0}%, #2A2A2A 0%)`}}>
                        <span>{stock.Score_MSI || 0}</span>
                      </div>
                    </div>
                    <div className="stock-identity">
                      <h4>{stock.Código}</h4>
                      <p>{stock.Empresa}</p>
                      <span className="sector-tag">{stock.Atuação}</span>
                    </div>
                  </div>
                  
                  <div className="stock-metrics">
                    <div className="metric">
                      <span className="metric-label">Cotação</span>
                      <span className="metric-value price">R$ {stock.Cotação_atual.toFixed(2)}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Preço Teto</span>
                      <span className="metric-value target">R$ {stock.Preço_Teto}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Margem</span>
                      <span className={`metric-value ${stock.Margem_de_segurança >= 0 ? 'positive' : 'negative'}`}>
                        {stock.Margem_de_segurança}%
                      </span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">Div. Yield</span>
                      <span className="metric-value dividend">{stock.Dividend_Yield_bruto_estimado}%</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">P/L</span>
                      <span className="metric-value">{stock["P/L_projetado"]}</span>
                    </div>
                    <div className="metric">
                      <span className="metric-label">CAGR 5 Anos</span>
                      <span className={`metric-value ${stock.CAGR_lucros_5_anos >= 0 ? 'positive' : 'negative'}`}>
                        {stock.CAGR_lucros_5_anos}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="stock-footer">
                    <div className="investment-simulation">
                      <p>Com R$ 10.000 investidos:</p>
                      <div className="simulation-results">
                        <div className="simulation-item">
                          <span className="simulation-label">Dividendos Anuais</span>
                          <span className="simulation-value">
                            R$ {(10000 * stock.Dividend_Yield_bruto_estimado / 100).toFixed(2)}
                          </span>
                        </div>
                        <div className="simulation-item">
                          <span className="simulation-label">Potencial de Valorização</span>
                          <span className="simulation-value">
                            {(((typeof stock.Preço_Teto === 'string' ? parseFloat(stock.Preço_Teto) : stock.Preço_Teto) / 
                              stock.Cotação_atual - 1) * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-stocks">
                <p>Nenhuma ação encontrada nesta categoria</p>
              </div>
            )}
          </div>
        </div>
      ))}
      
      <div className="top-stocks-footer">
        <p>As recomendações são atualizadas diariamente com base nas cotações mais recentes</p>
        <p>Método Sábio de Investir (MSI) &copy; 2025</p>
      </div>
    </div>
  );
};

export default TopStocks;