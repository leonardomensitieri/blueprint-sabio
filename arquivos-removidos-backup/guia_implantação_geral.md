Análise Quantitativa de Ações

Observação inicial: Quero que tenha a possibilidade de pesquisar na nossa lista de empresas um filtro, cuja seleção poderá ser: small caps, dividendos, bancos. Nós que colocamos e definimos quais são esses tipos de empresa, e somente nós administradores que podemos colocar

Dados Fundamentais

- Buscaremos automaticamente: quantidade de ações e valor de mercado
- Entrada manual: lucro líquido estimado (Nós que colocamos, e somente nós administradores que podemos colocar)

Cálculos de Valuation

- P/L = Valor de mercado ÷ Lucro líquido estimado
- Desvio do P/L = (P/L atual ÷ P/L médio histórico) - 1
- P/L médio histórico (nós somente administradores do sistema forneceremos, e depois de fornecer vai ser armazenado em banco de dados, mas pode ser modificado)
- Crescimento do lucro (5 anos) usando fórmula do CAGR: Nós que colocamos, e somente nós administradores que podemos colocar. Essa fórmula é calculada assim: (Valor final/valor inicial)^1/tempo em anos - 1

Métricas de Dívida e Rentabilidade

- Dívida líquida/EBITDA (exceto para bancos)
- Lucro por ação estimado = Lucro líquido estimado ÷ Quantidade total de ações

Análise de Dividendos

- Payout esperado (Nós que colocamos, e somente nós administradores que podemos colocar.  percentual específico por empresa)
- Dividendo por ação estimado = Lucro por ação × Payout esperado (Nós que colocamos, e somente nós administradores que podemos colocar)
- Dividend yield estimado = Dividendo por ação estimado ÷ Cotação atual

Definição de Preço-Teto

- Método padrão: Dividendo por ação estimado ÷ 0,08 (renda de 8%)
- Método para bancos: fórmula personalizada baseada no ROE e crescimento projetado (Nós que colocamos, e somente nós administradores que podemos colocar. (VPA * ROE médio * payout)/cotação atual
- Margem de segurança = (Preço-teto ÷ Cotação atual) - 1

Frequência de Dividendos

- Registro dos meses típicos de anúncio e pagamento
- Integração com estratégia de "dividendo inteligente" (um mapa de "calor" dos meses prováveis de anúncios de dividendos das empresas da carteira do assinante)
- Sistema de alertas para proximidade de anúncios de dividendos

Gestão da Carteira Individual: nessa parte de carteira individual vão existir também dois segmentos: ações da carteira e renda fixa. Além de tudo o que eu vou ainda descrever para você e que conter em cada uma dessas partes, é necessário que haja um botão para a pessoa adicionar esses ativos em sua carteira. Quando ela fizer isso, ficará armazenado no seu banco de dados. E ela poderá alterar esse valor.

Abordagem de Registro

- Inputs mínimos: ticker e quantidade de ações (sem preço médio)
- Interface focada em quantidade de ações, não em valor investido
- Opções para atualizar e excluir ativos e salvar (quando salvar, salvar todas as informações que o cliente coloca de input na nossa base de dados. Além disso, Destaque para nós esses dados deles na base de dados, para utilizarmos no nosso CRM: Como o Poder de aporte dele, a Soma do patrimonio total, o patrimonio em ações, o patrimonio em renda fixa, custo de vida mensal.)

Cálculos da Carteira

- Cotação via API (atualização a cada 15 minutos atualizar sem precisar ficar mostrando isso na página principal de forma bugada, você apenas mostrará quando a última atualização for feita → Google Finance)
- Dividendo por ação projetado importado da minha análise
- Renda esperada anual = Dividendo por ação × Quantidade
- Capital alocado = Quantidade × Cotação atual
- Dividend yield da Carteira = Dividendo esperado ÷ Capital alocado (Colocar filtros de avaliação - 6% Bom 8% Muito bom 9% mais ainda 10% Avemaria 12% nao essas qualificacoes foi so pra vc entender que a partir de 6 é muito bom e quanto mais melhor. Abaixo de 6% ja é ruim, ruim mesmo. sempre trazer observações para o cliente.

Projeções de Renda

- Total projetado: soma das rendas esperadas
- Média mensal = Total projetado ÷ 12
- Patrimônio total = soma do capital alocado
- Dividend yield médio = Dividendo Total projetado ÷ Patrimônio total

Visualizações que serão *implementadas* no dashboard do assinante

- Tabela com todos as ações do assinante e soma do total do patrimônio em acoes e total da renda prevista anual e mensal em acoes (=anual/12) [de modo que, a gente foque mais em visualização de renda do que patrimônio]
- Retangulo com Patrimonio Total em Renda Fixa e Renda Líquida da renda fixa considerando 100% do CDI.
- Gráfico de Projeção de crescimento dos dividendos nos próximos 15 anos  formula:
    - It=I0×(1,15^t)+{[0,08×A×1,15×((1,15^t)−1)]/0,15}
    - Descrição da formula: Essa forma deve ser usada de uma forma que o cliente nao seja capaz de colocar os dados nela, nem de saber qual formula foi utilizada. ela vai ser calculada automaticamente puxando os dados da renda anual dele que serão decorrentes da carteira Consolidada e ela sera projetada em graficos de barra verticais.
        - Sendo:
        - t = Tempo em anos
        - A = Poder de Aporte anual = Poder de Aporte Mensal*12
        - I0 = Renda Inicial de acordo com o total da renda anual da carteira do cliente.

Análise de Renda Fixa

Dados Básicos

- Input: patrimônio total em renda fixa
- Taxa CDI: busca automática atualizada (14,15% atualmente 100% do cdi)
- Seleção do tempo de investimento para cálculo do IR

Cálculo de Imposto de Renda

- Alíquota determinada pelo prazo selecionado:
    - Até 6 meses: 22,5%
    - 6 meses a 1 ano: 20%
    - 1 a 2 anos: 17,5%
    - Mais de 2 anos: 15%

Rendimento Líquido

- CDI líquido = CDI × (1 - alíquota de IR)
- Renda anual = Patrimônio × CDI líquido
- Renda mensal = Renda anual ÷ 12

Reserva de Emergência

Dados Básicos

- Inputs: valor atual, custo mensal, tipo de profissão

Recomendações Personalizadas

- Concursado/Estável: 3-6 meses de custo
- Autônomo/PJ: 6-12 meses de custo

Análise

- Duração = Valor reserva ÷ Custo mensal
- Status visual comparando com recomendação
- Alertas visuais de acordo com o status

Visão Consolidada

Patrimônio Total

- Patrimônio em ações
- Patrimônio em renda fixa
- Soma total (excluindo reserva de emergência)

Renda Total

- Renda anual de dividendos
- Renda anual de renda fixa
- Renda anual total
- Média mensal = Renda anual ÷ 12

Projeção de Crescimento

- Baseada na quantidade de ações e poder de aporte
- Foco no crescimento da renda, não do patrimônio
- Visualização da evolução da renda ao longo do tempo

Visualizações

- Gráfico de alocação entre classes de ativos
- Gráfico comparativo de rendimentos por tipo

Funcionalidades Adicionais

Persistência de Dados

- Salvamento da carteira do usuário no Firebase
- Funções para atualizar/excluir ativos

Exportação de Dados

- Opção para exportar em CSV/Excel

Integração com Sistema Existente

- Conexão com o sistema de autenticação existente
- Acesso exclusivo para assinantes
- Design consistente com o resto da plataforma Blueprint Sábio