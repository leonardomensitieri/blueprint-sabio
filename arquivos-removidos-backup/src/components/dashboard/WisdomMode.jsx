import React from 'react';
import './WisdomMode.css';

const WisdomMode = () => {
  return (
    <div className="wisdom-mode">
      <h2>MSI - Modo Sábio de Investir</h2>
      <p className="wisdom-intro">
        O Modo Sábio de Investir (MSI) reúne dicas, estratégias e recomendações para otimizar seus investimentos 
        e maximizar seus rendimentos de forma sustentável.
      </p>
      
      <div className="wisdom-grid">
        {/* Estratégias para Otimizar Dividendos */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">📊</span>
            <h3>Estratégias para Otimizar Dividendos</h3>
          </div>
          
          <div className="wisdom-content">
            <h4>Distribuição Mensal</h4>
            <p>
              Seus pagamentos estão concentrados em alguns meses. Considere diversificar para 
              obter receita mais consistente ao longo do ano.
            </p>
            
            <h4>Diversificação</h4>
            <p>
              Sua carteira tem poucos ativos pagadores de dividendos. Considere adicionar mais 
              empresas para diversificar seu risco.
            </p>
            
            <h4>Reinvestimento</h4>
            <p>
              Reinvestir todos os seus dividendos mensais (R$ 108.65) pode gerar aproximadamente 
              R$ 80.59 a mais por ano no próximo ciclo.
            </p>
          </div>
        </div>
        
        {/* Dicas para Maximizar seus Dividendos */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">💰</span>
            <h3>Dicas para Maximizar seus Dividendos</h3>
          </div>
          
          <div className="wisdom-content">
            <ul className="tips-list">
              <li>
                <strong>Diversifique entre setores</strong> para reduzir riscos e garantir pagamentos em diferentes ciclos econômicos.
              </li>
              <li>
                <strong>Avalie o ROE</strong> para bancos - instituições com ROE acima de 15% geralmente sustentam melhores dividendos.
              </li>
              <li>
                <strong>Priorize empresas com histórico</strong> consistente de pagamentos e aumentos graduais de dividendos.
              </li>
              <li>
                <strong>Verifique o payout ratio</strong> - empresas com payout muito alto podem não conseguir manter os dividendos no longo prazo.
              </li>
              <li>
                <strong>Reinvista seus dividendos</strong> para acelerar o crescimento patrimonial e sua renda passiva futura.
              </li>
            </ul>
          </div>
        </div>
        
        {/* Recomendações para Otimização */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">📈</span>
            <h3>Recomendações para Otimização</h3>
          </div>
          
          <div className="wisdom-content">
            <h4>Avaliação da Alocação</h4>
            <p>
              Sua carteira está bastante concentrada em renda fixa (70.3%). Considere aumentar 
              a alocação em ações para potencializar retornos no longo prazo.
            </p>
            
            <h4>Rendimentos</h4>
            <p>
              Sua carteira apresenta um rendimento moderado. Avalie oportunidades de melhorar 
              o rendimento sem aumentar significativamente o risco.
            </p>
            
            <h4>Próximos Passos</h4>
            <ul>
              <li>Revise sua carteira trimestralmente</li>
              <li>Rebalanceie quando a alocação desviar mais de 5% do alvo</li>
              <li>Reinvista os rendimentos para acelerar o crescimento patrimonial</li>
              <li>Utilize a ferramenta Blueprint Sábio para identificar novas oportunidades de investimento</li>
            </ul>
          </div>
        </div>
        
        {/* Entendendo a Reserva de Emergência */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">🛡️</span>
            <h3>Entendendo a Reserva de Emergência</h3>
          </div>
          
          <div className="wisdom-content">
            <p>
              A reserva de emergência é um fundo destinado a cobrir despesas inesperadas ou períodos sem renda. 
              O tamanho ideal varia conforme sua situação profissional, familiar e perfil de risco.
            </p>
            
            <h4>Como Usar a Reserva</h4>
            <p>
              Use apenas para verdadeiras emergências, como desemprego, problemas de saúde ou consertos urgentes. 
              Reponha os valores utilizados assim que possível.
            </p>
            
            <h4>Onde Investir</h4>
            <p>
              Priorize segurança e liquidez: Tesouro Selic, CDBs com liquidez diária, e fundos DI são opções adequadas. 
              Evite investimentos de risco ou baixa liquidez.
            </p>
            
            <h4>Quando Revisar</h4>
            <p>
              Reavalie sua reserva ao mudar de emprego, ter alterações na renda ou despesas, ou ao ter mudanças 
              familiares, como o nascimento de um filho.
            </p>
          </div>
        </div>
        
        {/* Investimentos Isentos de IR */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">📑</span>
            <h3>Investimentos Isentos de IR</h3>
          </div>
          
          <div className="wisdom-content">
            <p>
              Alguns investimentos são isentos de Imposto de Renda, como LCI (Letra de Crédito Imobiliário), 
              LCA (Letra de Crédito do Agronegócio) e Debêntures Incentivadas. 
              Considere-os em seu planejamento financeiro.
            </p>
            <div className="highlighted-tip">
              <p>
                <strong>Dica:</strong> Ao planejar seus investimentos em renda fixa, leve em consideração o prazo que 
                pretende deixar o dinheiro aplicado para otimizar o rendimento líquido.
              </p>
            </div>
          </div>
        </div>
        
        {/* Proteção de patrimônio com moeda forte */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">💱</span>
            <h3>Proteção de patrimônio com moeda forte</h3>
          </div>
          
          <div className="wisdom-content">
            <p>
              Para proteção patrimonial, considere exposição a moedas fortes como dólar, euro ou 
              investimentos no exterior. Bitcoin pode ser uma opção como reserva de valor em criptomoedas, 
              mas com alocação cuidadosa devido à volatilidade.
            </p>
            <div className="warning-tip">
              <p>
                <strong>Atenção:</strong> Entre as criptomoedas, o Bitcoin é a única que recomendamos como 
                reserva de valor digital. Evite exposição excessiva a criptoativos de menor capitalização.
              </p>
            </div>
          </div>
        </div>
        
        {/* Outros tipos de renda */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">💼</span>
            <h3>Outros tipos de renda</h3>
          </div>
          
          <div className="wisdom-content">
            <p>
              Além de ações e renda fixa tradicional, considere diversificar com outras fontes de renda passiva:
            </p>
            <ul>
              <li>Debêntures</li>
              <li>CRI e CRA (Certificados de Recebíveis Imobiliários e do Agronegócio)</li>
              <li>Fiagros (Fundo de Investimento do Agronegócio)</li>
              <li>BDRs de empresas que pagam dividendos</li>
              <li>Renda Passiva com Empresas e Empreendimentos</li>
              <li>Finanças Descentralizadas (DeFi) - com cautela e estudo</li>
            </ul>
          </div>
        </div>
        
        {/* Renda extra vs. renda passiva */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">📱</span>
            <h3>Renda extra vs. renda passiva</h3>
          </div>
          
          <div className="wisdom-content">
            <p>
              Além dos investimentos tradicionais, considere estas fontes de renda digital:
            </p>
            <ul>
              <li>Royalties de livros, músicas ou cursos online</li>
              <li>Programas de afiliados (Amazon, Hotmart, Monetizze, Eduzz, etc.)</li>
              <li>Criação de conteúdo monetizado (YouTube, Substack, etc.)</li>
              <li>Venda de infoprodutos (e-books, cursos, planilhas, templates, etc.)</li>
              <li>Publicidade online (Google AdSense, banners, blogs monetizados)</li>
            </ul>
          </div>
        </div>
        
        {/* Renda Passiva vs. Equity */}
        <div className="wisdom-card">
          <div className="wisdom-header">
            <span className="wisdom-icon">⚖️</span>
            <h3>Renda Passiva vs. Equity</h3>
          </div>
          
          <div className="wisdom-content">
            <p>
              Para quem busca maior participação em negócios, considere estas alternativas:
            </p>
            <ul>
              <li>Participação em startups via equity crowdfunding</li>
              <li>Sociedade em empresas que geram lucros recorrentes</li>
              <li>Venda de uma empresa com recebimento de pagamento parcelado</li>
            </ul>
            <div className="highlighted-tip">
              <p>
                <strong>Importante:</strong> A combinação de renda passiva com participação acionária (equity) 
                pode criar uma estrutura robusta de geração de riqueza ao longo do tempo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WisdomMode;