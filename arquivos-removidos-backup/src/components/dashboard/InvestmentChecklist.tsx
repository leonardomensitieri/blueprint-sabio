import React, { useState } from 'react';
import './InvestmentChecklist.css';

interface ChecklistItem {
  id: number;
  category: string;
  question: string;
  explanation: string;
  isChecked: boolean;
}

const InvestmentChecklist: React.FC = () => {
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([
    // Análise Fundamentalista
    {
      id: 1,
      category: 'Análise Fundamentalista',
      question: 'A empresa possui dívida líquida/EBITDA menor que 2.5x?',
      explanation: 'Empresas com baixo endividamento têm mais flexibilidade durante crises e maior capacidade de distribuir dividendos.',
      isChecked: false
    },
    {
      id: 2,
      category: 'Análise Fundamentalista',
      question: 'O ROE médio dos últimos 5 anos é superior a 15%?',
      explanation: 'Return on Equity (ROE) é um indicador da eficiência com que a empresa gera lucro a partir do capital dos acionistas.',
      isChecked: false
    },
    {
      id: 3,
      category: 'Análise Fundamentalista',
      question: 'A margem líquida é consistente ou crescente nos últimos 3 anos?',
      explanation: 'Margens estáveis ou crescentes indicam vantagem competitiva e capacidade de precificação.',
      isChecked: false
    },
    {
      id: 4,
      category: 'Análise Fundamentalista',
      question: 'O CAGR de lucros dos últimos 5 anos é positivo?',
      explanation: 'Crescimento Anual Composto (CAGR) positivo nos lucros indica que a empresa está expandindo de forma consistente.',
      isChecked: false
    },
    {
      id: 5,
      category: 'Análise Fundamentalista',
      question: 'A empresa converteu lucro contábil em caixa operacional nos últimos 3 anos?',
      explanation: 'A conversão de lucro em caixa é essencial para verificar a qualidade dos resultados reportados.',
      isChecked: false
    },
    
    // Valuation
    {
      id: 6,
      category: 'Valuation',
      question: 'O P/L atual está abaixo da média histórica da empresa?',
      explanation: 'Comprar quando o P/L está abaixo da média histórica pode oferecer uma margem de segurança adicional.',
      isChecked: false
    },
    {
      id: 7,
      category: 'Valuation',
      question: 'O dividend yield atual é superior à média histórica?',
      explanation: 'Dividend yield acima da média histórica pode indicar subvalorização ou aumento na distribuição de lucros.',
      isChecked: false
    },
    {
      id: 8,
      category: 'Valuation',
      question: 'O P/VP está abaixo de 2.0 ou abaixo da média do setor?',
      explanation: 'Preço sobre Valor Patrimonial baixo pode indicar que a empresa está sendo negociada por um valor próximo aos seus ativos líquidos.',
      isChecked: false
    },
    {
      id: 9,
      category: 'Valuation',
      question: 'O EV/EBITDA está abaixo da média do setor?',
      explanation: 'Enterprise Value sobre EBITDA é um múltiplo que considera o endividamento e ajuda a comparar empresas do mesmo setor.',
      isChecked: false
    },
    {
      id: 10,
      category: 'Valuation',
      question: 'A ação está sendo negociada com margem de segurança positiva (abaixo do preço-teto)?',
      explanation: 'Margem de segurança positiva significa que a ação está sendo negociada abaixo do valor intrínseco estimado.',
      isChecked: false
    },
    
    // Dividendos e Retorno
    {
      id: 11,
      category: 'Dividendos e Retorno',
      question: 'A empresa possui histórico de pagamento de dividendos por pelo menos 5 anos?',
      explanation: 'Histórico longo de pagamentos indica compromisso com a remuneração dos acionistas.',
      isChecked: false
    },
    {
      id: 12,
      category: 'Dividendos e Retorno',
      question: 'O payout ratio é sustentável (abaixo de 80% para a maioria dos setores)?',
      explanation: 'Payout ratio sustentável indica que a empresa retém capital suficiente para crescimento futuro.',
      isChecked: false
    },
    {
      id: 13,
      category: 'Dividendos e Retorno',
      question: 'Os dividendos têm crescido acima da inflação nos últimos anos?',
      explanation: 'Crescimento real dos dividendos protege o poder de compra do investidor ao longo do tempo.',
      isChecked: false
    },
    {
      id: 14,
      category: 'Dividendos e Retorno',
      question: 'O dividend yield projetado está acima de 6%?',
      explanation: 'Alto dividend yield pode proporcionar fluxo de caixa significativo para reinvestimento ou despesas.',
      isChecked: false
    },
    {
      id: 15,
      category: 'Dividendos e Retorno',
      question: 'A frequência de pagamento de dividendos é mensal ou trimestral?',
      explanation: 'Pagamentos mais frequentes ajudam a compor juros mais rapidamente e proporcionam fluxo de caixa regular.',
      isChecked: false
    },
    
    // Qualidade e Governança
    {
      id: 16,
      category: 'Qualidade e Governança',
      question: 'A empresa possui vantagens competitivas duráveis (moat)?',
      explanation: 'Vantagens competitivas protegem a empresa da concorrência e sustentam rentabilidade a longo prazo.',
      isChecked: false
    },
    {
      id: 17,
      category: 'Qualidade e Governança',
      question: 'A gestão tem histórico de alocação eficiente de capital?',
      explanation: 'Boa alocação de capital resulta em projetos rentáveis, aquisições com sinergia e retorno para acionistas.',
      isChecked: false
    },
    {
      id: 18,
      category: 'Qualidade e Governança',
      question: 'A empresa adota boas práticas de governança corporativa?',
      explanation: 'Boa governança reduz riscos de fraudes, conflitos de interesse e decisões que prejudicam acionistas minoritários.',
      isChecked: false
    },
    {
      id: 19,
      category: 'Qualidade e Governança',
      question: 'O negócio é simples de entender e acompanhar?',
      explanation: 'Negócios compreensíveis permitem melhor avaliação de riscos e oportunidades por investidores individuais.',
      isChecked: false
    },
    {
      id: 20,
      category: 'Qualidade e Governança',
      question: 'A empresa está em um setor com perspectivas favoráveis a longo prazo?',
      explanation: 'Setores em crescimento ou com barreiras de entrada proporcionam vento favorável para resultados futuros.',
      isChecked: false
    }
  ]);

  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<ChecklistItem | null>(null);

  // Obter categorias únicas
  const categories = Array.from(new Set(checklistItems.map(item => item.category)));

  const handleCheckboxChange = (id: number) => {
    setChecklistItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, isChecked: !item.isChecked } : item
      )
    );
  };

  const handleItemClick = (item: ChecklistItem) => {
    setSelectedItem(item);
  };

  const handleCategoryClick = (category: string) => {
    setActiveCategory(activeCategory === category ? null : category);
  };

  const renderChecklistItems = () => {
    return categories.map(category => (
      <div key={category} className="checklist-category">
        <h3 
          className="category-title" 
          onClick={() => handleCategoryClick(category)}
        >
          {category}
          <span className={`category-arrow ${activeCategory === category ? 'open' : ''}`}>
            ▼
          </span>
        </h3>
        
        <div className={`category-items ${activeCategory === category ? 'visible' : 'hidden'}`}>
          {checklistItems
            .filter(item => item.category === category)
            .map(item => (
              <div key={item.id} className="checklist-item">
                <div className="item-header">
                  <label className="checkbox-container">
                    <input 
                      type="checkbox"
                      checked={item.isChecked}
                      onChange={() => handleCheckboxChange(item.id)}
                    />
                    <span className="checkmark"></span>
                  </label>
                  <span 
                    className="item-question"
                    onClick={() => handleItemClick(item)}
                  >
                    {item.question}
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    ));
  };

  // Calcular progresso
  const checkedCount = checklistItems.filter(item => item.isChecked).length;
  const totalItems = checklistItems.length;
  const progressPercentage = Math.round((checkedCount / totalItems) * 100);

  return (
    <div className="investment-checklist">
      <div className="checklist-header">
        <h2>Checklist do Método Sábio de Investir</h2>
        <p>Use este checklist para analisar investimentos seguindo a metodologia MSI</p>
        
        <div className="progress-container">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{width: `${progressPercentage}%`}}
            ></div>
          </div>
          <p className="progress-text">{progressPercentage}% Completo ({checkedCount}/{totalItems})</p>
        </div>
      </div>
      
      <div className="checklist-content">
        <div className="checklist-items">
          {renderChecklistItems()}
        </div>
        
        <div className="item-details">
          {selectedItem ? (
            <>
              <h3>{selectedItem.question}</h3>
              <p className="item-explanation">{selectedItem.explanation}</p>
              <div className={`item-status ${selectedItem.isChecked ? 'checked' : 'unchecked'}`}>
                {selectedItem.isChecked ? 'Critério Atendido ✓' : 'Critério Não Atendido ✗'}
              </div>
              <button 
                className={`toggle-status-btn ${selectedItem.isChecked ? 'checked' : 'unchecked'}`}
                onClick={() => handleCheckboxChange(selectedItem.id)}
              >
                {selectedItem.isChecked ? 'Marcar como Não Atendido' : 'Marcar como Atendido'}
              </button>
            </>
          ) : (
            <div className="no-selection">
              <p>Selecione um item do checklist para ver mais detalhes</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="checklist-footer">
        <p>Método Sábio de Investir - 20 pontos essenciais para avaliar ações com dividendos</p>
      </div>
    </div>
  );
};

export default InvestmentChecklist;