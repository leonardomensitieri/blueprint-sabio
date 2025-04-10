import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { 
  saveFundamentalStockData, 
  getAvailableStocks
} from '../../firebase/db';
import './DadosFundamentais.css';

/**
 * Componente administrativo para gestão dos dados fundamentais das ações
 * Permite adicionar e editar dados fundamentais que serão utilizados na plataforma
 */
const DadosFundamentais = () => {
  const { currentUser } = useAuth();
  const [stocks, setStocks] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [formData, setFormData] = useState({
    ticker: '',
    nome: '',
    setor: '',
    categoria: [],
    quantidadeAcoes: '',
    valorMercado: '',
    lucroLiquidoEstimado: '',
    payoutEsperado: '',
    dividendoPorAcaoEstimado: '',
    plMedioHistorico: '',
    crescimentoLucro5Anos: '',
    mesesPagamentoDividendos: []
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Categorias disponíveis
  const categorias = [
    'smallcap', 
    'midcap', 
    'bluechip',
    'dividendos', 
    'crescimento',
    'valor',
    'bancos',
    'energia',
    'commodities',
    'tecnologia'
  ];

  // Meses para seleção
  const meses = [
    { value: 'jan', label: 'Janeiro' },
    { value: 'fev', label: 'Fevereiro' },
    { value: 'mar', label: 'Março' },
    { value: 'abr', label: 'Abril' },
    { value: 'mai', label: 'Maio' },
    { value: 'jun', label: 'Junho' },
    { value: 'jul', label: 'Julho' },
    { value: 'ago', label: 'Agosto' },
    { value: 'set', label: 'Setembro' },
    { value: 'out', label: 'Outubro' },
    { value: 'nov', label: 'Novembro' },
    { value: 'dez', label: 'Dezembro' }
  ];

  // Setores disponíveis
  const setores = [
    'Financeiro',
    'Energia',
    'Telecomunicações',
    'Consumo',
    'Saúde',
    'Materiais Básicos',
    'Tecnologia',
    'Serviços Públicos',
    'Industrial',
    'Imobiliário',
    'Transporte',
    'Petróleo e Gás',
    'Outros'
  ];

  // Carregar dados iniciais quando o componente montar
  useEffect(() => {
    if (currentUser) {
      loadStocks();
    }
  }, [currentUser]);

  // Carregar ações disponíveis
  const loadStocks = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log("Carregando ações disponíveis para o administrador");
      const stocksList = await getAvailableStocks();
      setStocks(stocksList || []);
      
      if (stocksList && stocksList.length > 0) {
        console.log(`${stocksList.length} ações carregadas com sucesso!`);
        setMessage({
          type: 'success',
          text: 'Dados carregados com sucesso!'
        });
      } else {
        console.log("Nenhuma ação encontrada");
        setMessage({
          type: 'info',
          text: 'Nenhuma ação cadastrada. Adicione sua primeira ação!'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar lista de ações:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao carregar lista de ações. Tente novamente mais tarde.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar formulário
  const resetForm = () => {
    setFormData({
      ticker: '',
      nome: '',
      setor: '',
      categoria: [],
      quantidadeAcoes: '',
      valorMercado: '',
      lucroLiquidoEstimado: '',
      payoutEsperado: '',
      dividendoPorAcaoEstimado: '',
      plMedioHistorico: '',
      crescimentoLucro5Anos: '',
      mesesPagamentoDividendos: []
    });
    setSelectedStock(null);
    setMessage({ type: '', text: '' });
  };

  // Selecionar uma ação para edição
  const handleSelectStock = (ticker) => {
    const stock = stocks.find(s => s.ticker === ticker);
    if (stock) {
      console.log(`Selecionando ação ${ticker} para edição:`, stock);
      setSelectedStock(stock);
      setFormData({
        ticker: stock.ticker || '',
        nome: stock.nome || '',
        setor: stock.setor || '',
        categoria: stock.categoria || [],
        quantidadeAcoes: stock.quantidadeAcoes || '',
        valorMercado: stock.valorMercado || '',
        lucroLiquidoEstimado: stock.lucroLiquidoEstimado || '',
        payoutEsperado: stock.payoutEsperado || '',
        dividendoPorAcaoEstimado: stock.dividendoPorAcaoEstimado || '',
        plMedioHistorico: stock.plMedioHistorico || '',
        crescimentoLucro5Anos: stock.crescimentoLucro5Anos || '',
        mesesPagamentoDividendos: stock.mesesPagamentoDividendos || []
      });
    }
  };

  // Lidar com mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Lidar com seleção de categorias (múltipla)
  const handleCategoriaChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        categoria: [...formData.categoria, value]
      });
    } else {
      setFormData({
        ...formData,
        categoria: formData.categoria.filter(cat => cat !== value)
      });
    }
  };

  // Lidar com seleção de meses (múltipla)
  const handleMesChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setFormData({
        ...formData,
        mesesPagamentoDividendos: [...formData.mesesPagamentoDividendos, value]
      });
    } else {
      setFormData({
        ...formData,
        mesesPagamentoDividendos: formData.mesesPagamentoDividendos.filter(mes => mes !== value)
      });
    }
  };

  // Salvar os dados da ação
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.ticker || !formData.nome) {
      setMessage({
        type: 'error',
        text: 'Ticker e Nome são campos obrigatórios.'
      });
      return;
    }
    
    setIsSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      console.log(`Salvando dados fundamentais para ${formData.ticker}`);
      
      // Converter valores numéricos
      const stockData = {
        ...formData,
        ticker: formData.ticker.toUpperCase(), // Garantir que ticker esteja em maiúsculas
        quantidadeAcoes: formData.quantidadeAcoes ? parseFloat(formData.quantidadeAcoes) : 0,
        valorMercado: formData.valorMercado ? parseFloat(formData.valorMercado) : 0,
        lucroLiquidoEstimado: formData.lucroLiquidoEstimado ? parseFloat(formData.lucroLiquidoEstimado) : 0,
        payoutEsperado: formData.payoutEsperado ? parseFloat(formData.payoutEsperado) : 0,
        dividendoPorAcaoEstimado: formData.dividendoPorAcaoEstimado ? parseFloat(formData.dividendoPorAcaoEstimado) : 0,
        plMedioHistorico: formData.plMedioHistorico ? parseFloat(formData.plMedioHistorico) : 0,
        crescimentoLucro5Anos: formData.crescimentoLucro5Anos ? parseFloat(formData.crescimentoLucro5Anos) : 0
      };
      
      console.log("Dados a serem salvos:", stockData);
      
      await saveFundamentalStockData(stockData);
      
      console.log(`Dados fundamentais para ${formData.ticker} salvos com sucesso!`);
      setMessage({
        type: 'success',
        text: `Dados da ação ${formData.ticker} salvos com sucesso.`
      });
      
      // Recarregar a lista de ações
      await loadStocks();
      
      // Limpar formulário se não estava editando uma ação existente
      if (!selectedStock) {
        resetForm();
      }
    } catch (error) {
      console.error('Erro ao salvar dados fundamentais:', error);
      setMessage({
        type: 'error',
        text: 'Erro ao salvar dados. Tente novamente mais tarde.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="dados-fundamentais admin-panel">
      <h2>Dados Fundamentais - Administração</h2>
      
      {message.type && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="admin-content">
        <div className="stocks-list-panel">
          <h3>Ações Cadastradas</h3>
          
          {isLoading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Carregando ações...</p>
            </div>
          ) : (
            <>
              <button 
                className="new-button" 
                onClick={resetForm}
              >
                + Nova Ação
              </button>
              
              {stocks.length === 0 ? (
                <p className="empty-text">Nenhuma ação cadastrada.</p>
              ) : (
                <ul className="stocks-list">
                  {stocks.map(stock => (
                    <li 
                      key={stock.ticker} 
                      className={selectedStock?.ticker === stock.ticker ? 'active' : ''}
                      onClick={() => handleSelectStock(stock.ticker)}
                    >
                      <span className="ticker">{stock.ticker}</span>
                      <span className="name">{stock.nome}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
        
        <div className="stock-form-panel">
          <h3>{selectedStock ? `Editar ${selectedStock.ticker}` : 'Nova Ação'}</h3>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="ticker">Ticker*</label>
                <input
                  type="text"
                  id="ticker"
                  name="ticker"
                  value={formData.ticker}
                  onChange={handleChange}
                  placeholder="Ex: PETR4"
                  required
                  disabled={selectedStock !== null}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="nome">Nome da Empresa*</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleChange}
                  placeholder="Ex: Petrobras PN"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="setor">Setor</label>
                <select
                  id="setor"
                  name="setor"
                  value={formData.setor}
                  onChange={handleChange}
                >
                  <option value="">Selecione um setor</option>
                  {setores.map(setor => (
                    <option key={setor} value={setor}>
                      {setor}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="quantidadeAcoes">Quantidade de Ações</label>
                <input
                  type="number"
                  id="quantidadeAcoes"
                  name="quantidadeAcoes"
                  value={formData.quantidadeAcoes}
                  onChange={handleChange}
                  placeholder="Ex: 1000000000"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="valorMercado">Valor de Mercado (R$)</label>
                <input
                  type="number"
                  id="valorMercado"
                  name="valorMercado"
                  value={formData.valorMercado}
                  onChange={handleChange}
                  placeholder="Ex: 450000000000"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="lucroLiquidoEstimado">Lucro Líquido Estimado (R$)</label>
                <input
                  type="number"
                  id="lucroLiquidoEstimado"
                  name="lucroLiquidoEstimado"
                  value={formData.lucroLiquidoEstimado}
                  onChange={handleChange}
                  placeholder="Ex: 40000000000"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="payoutEsperado">Payout Esperado (%)</label>
                <input
                  type="number"
                  id="payoutEsperado"
                  name="payoutEsperado"
                  value={formData.payoutEsperado}
                  onChange={handleChange}
                  placeholder="Ex: 60"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dividendoPorAcaoEstimado">Dividendo por Ação Estimado (R$)</label>
                <input
                  type="number"
                  id="dividendoPorAcaoEstimado"
                  name="dividendoPorAcaoEstimado"
                  value={formData.dividendoPorAcaoEstimado}
                  onChange={handleChange}
                  placeholder="Ex: 2.5"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="plMedioHistorico">P/L Médio Histórico</label>
                <input
                  type="number"
                  id="plMedioHistorico"
                  name="plMedioHistorico"
                  value={formData.plMedioHistorico}
                  onChange={handleChange}
                  placeholder="Ex: 8.5"
                  step="0.01"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="crescimentoLucro5Anos">Crescimento do Lucro 5 Anos (%)</label>
                <input
                  type="number"
                  id="crescimentoLucro5Anos"
                  name="crescimentoLucro5Anos"
                  value={formData.crescimentoLucro5Anos}
                  onChange={handleChange}
                  placeholder="Ex: 12.5"
                  step="0.01"
                />
              </div>
            </div>
            
            <div className="form-section">
              <h4>Categorias</h4>
              <div className="checkbox-group">
                {categorias.map(cat => (
                  <div key={cat} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`categoria-${cat}`}
                      value={cat}
                      checked={formData.categoria.includes(cat)}
                      onChange={handleCategoriaChange}
                    />
                    <label htmlFor={`categoria-${cat}`}>{cat}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-section">
              <h4>Meses de Pagamento de Dividendos</h4>
              <div className="checkbox-group">
                {meses.map(mes => (
                  <div key={mes.value} className="checkbox-item">
                    <input
                      type="checkbox"
                      id={`mes-${mes.value}`}
                      value={mes.value}
                      checked={formData.mesesPagamentoDividendos.includes(mes.value)}
                      onChange={handleMesChange}
                    />
                    <label htmlFor={`mes-${mes.value}`}>{mes.label}</label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                className="secondary-button" 
                onClick={resetForm}
              >
                Cancelar
              </button>
              <button 
                type="submit" 
                className="primary-button" 
                disabled={isSaving}
              >
                {isSaving ? 'Salvando...' : 'Salvar Dados'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DadosFundamentais; 