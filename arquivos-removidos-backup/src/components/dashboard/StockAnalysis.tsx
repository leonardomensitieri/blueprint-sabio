import React, { useState, useEffect } from 'react';
import './StockAnalysis.css';
import { stockData, Stock } from '../../stockData';

function StockAnalysis() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSector, setFilterSector] = useState('');
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Stock | null,
    direction: 'ascending' | 'descending'
  }>({
    key: null,
    direction: 'ascending'
  });
  
  // Carregar dados
  useEffect(() => {
    // Usar os dados reais do stockData.ts
    setStocks(stockData);
    setFilteredStocks(stockData);
  }, []);
  
  // Filtrar e ordenar
  useEffect(() => {
    let result = [...stocks];
    
    // Aplicar filtro de pesquisa
    if (searchTerm) {
      result = result.filter(
        stock => 
          stock.Empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.Código.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Aplicar filtro de setor
    if (filterSector) {
      result = result.filter(stock => stock.Atuação === filterSector);
    }
    
    // Aplicar ordenação
    if (sortConfig.key) {
      result.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Stock];
        const bValue = b[sortConfig.key as keyof Stock];
        
        // Verificar se os valores são undefined
        if (aValue === undefined && bValue === undefined) return 0;
        if (aValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;
        if (bValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        
        // Comparação para valores string
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'ascending' 
            ? aValue.localeCompare(bValue) 
            : bValue.localeCompare(aValue);
        }
        
        // Comparação para valores numéricos e outros
        if (aValue < bValue) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    
    setFilteredStocks(result);
  }, [stocks, searchTerm, filterSector, sortConfig]);
  
  // Função para ordenar colunas
  const requestSort = (key: keyof Stock) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  // Lista de setores únicos para o filtro
  const sectorsSet = new Set(stocks.map(stock => stock.Atuação));
  const sectors = Array.from(sectorsSet);
  
  // Para exportar em Excel (simulado)
  const handleExport = () => {
    alert('Função de exportação será implementada em breve!');
  };
  
  return (
    <div className="stock-analysis">
      <h2>Planilha dos Bilionários</h2>
      <p className="description">
        Análise de {stocks.length} empresas com métricas avançadas para investimentos inteligentes.
        Atualizada trimestralmente com projeções para 2025.
      </p>
      
      <div className="filters">
        <div className="search">
          <input
            type="text"
            placeholder="Buscar por empresa ou código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="sector-filter">
          <select 
            value={filterSector} 
            onChange={(e) => setFilterSector(e.target.value)}
          >
            <option value="">Todos os setores</option>
            {sectors.map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="table-container">
        <table className="stock-table">
          <thead>
            <tr>
              <th onClick={() => requestSort('Empresa')}>Empresa</th>
              <th onClick={() => requestSort('Código')}>Código</th>
              <th onClick={() => requestSort('Atuação')}>Setor</th>
              <th onClick={() => requestSort('Cotação_atual')}>Cotação</th>
              <th onClick={() => requestSort('P/L_projetado')}>P/L 2025</th>
              <th onClick={() => requestSort('Dividend_Yield_bruto_estimado')}>Div. Yield</th>
              <th onClick={() => requestSort('Margem_de_segurança')}>Margem Seg.</th>
              <th onClick={() => requestSort('Frequência')}>Periodicidade</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.map((stock, index) => (
              <tr key={index}>
                <td>{stock.Empresa}</td>
                <td>{stock.Código}</td>
                <td>{stock.Atuação}</td>
                <td>R$ {stock.Cotação_atual.toFixed(2)}</td>
                <td>{stock["P/L_projetado"]}</td>
                <td>{stock.Dividend_Yield_bruto_estimado}%</td>
                <td className={stock.Margem_de_segurança > 15 ? 'positive' : stock.Margem_de_segurança < 0 ? 'negative' : 'neutral'}>
                  {stock.Margem_de_segurança}%
                </td>
                <td>{stock.Frequência}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="excel-export">
        <button className="btn-export" onClick={handleExport}>
          <span className="material-icons">download</span>
          Exportar para Excel
        </button>
      </div>
    </div>
  );
}

export default StockAnalysis;