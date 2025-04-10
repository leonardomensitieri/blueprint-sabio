# Fase 1: Fundação do Sistema e Carteira Básica

## Objetivo
Criar a base do sistema de investimentos com foco na gestão de carteira individual de ações, implementando as funcionalidades essenciais que servirão como fundação para as próximas fases.

## Estrutura de Dados

### Modelo de Usuário
```json
{
  "uid": "string",
  "email": "string",
  "nome": "string",
  "dataCadastro": "timestamp",
  "ultimoAcesso": "timestamp",
  "assinante": "boolean",
  "poderAporteMensal": "number",
  "custoVidaMensal": "number"
}
```

### Modelo de Ação na Carteira
```json
{
  "usuarioId": "string",
  "ticker": "string",
  "quantidade": "number",
  "ultimaAtualizacao": "timestamp",
  "dividendoPorAcaoProjetado": "number"
}
```

### Modelo de Dados Fundamentais das Ações (Admin)
```json
{
  "ticker": "string",
  "nome": "string",
  "setor": "string",
  "categoria": ["smallcap", "dividendos", "bancos"], // Lista de categorias
  "quantidadeAcoes": "number",
  "valorMercado": "number",
  "lucroLiquidoEstimado": "number",
  "payoutEsperado": "number",
  "dividendoPorAcaoEstimado": "number",
  "plMedioHistorico": "number",
  "crescimentoLucro5Anos": "number",
  "mesesPagamentoDividendos": ["string"] // Lista de meses: "jan", "fev", etc.
}
```

## Funcionalidades Principais

### 1. Gestão da Carteira Individual (Ações)
- Adicionar ações à carteira (ticker e quantidade)
- Visualizar carteira atual
- Atualizar quantidade de ações
- Excluir ações da carteira
- Salvar alterações na base de dados

### 2. Cálculos Fundamentais da Carteira
- Cotação atual via API (Google Finance, atualização a cada 15 minutos)
- Capital alocado = Quantidade × Cotação atual
- Importação do dividendo por ação projetado da análise
- Renda esperada anual = Dividendo por ação × Quantidade
- Dividend yield da carteira = Dividendo esperado ÷ Capital alocado

### 3. Visualização Básica do Dashboard
- Tabela com todas as ações do assinante
- Soma do patrimônio total em ações
- Total da renda prevista anual e mensal em ações
- Indicadores visuais para dividend yield (cores conforme faixas)

### 4. Sistema de Administração (Dados Fundamentais)
- Interface para administradores adicionarem/editarem dados fundamentais
- Controle de acesso restrito
- Formulário para atualização dos dados das ações

## Interface do Usuário

### Tela de Carteira Individual
- Seção superior:
  - Resumo do patrimônio total em ações
  - Renda anual projetada
  - Renda mensal média (anual ÷ 12)
  - Dividend yield médio da carteira

- Tabela de ações:
  | Ticker | Quantidade | Cotação | Capital | Div/Ação | Renda Anual | Yield |
  |--------|------------|---------|---------|----------|-------------|-------|
  | ABCD3  | 100        | R$20,00 | R$2.000 | R$1,60   | R$160,00    | 8,0%  |

- Botões de ação:
  - Adicionar ação
  - Salvar alterações
  - Atualizar cotações

### Modal de Adição/Edição de Ação
- Campo para ticker (com sugestões da lista disponível)
- Campo para quantidade de ações
- Botões de salvar/cancelar

## Requisitos Técnicos

### Frontend
- React.js para construção da interface
- Context API ou Redux para gerenciamento de estado
- Styled Components ou Tailwind CSS para estilização
- Biblioteca de gráficos (Chart.js ou Recharts)
- Formulários com validação

### Backend
- Firebase Authentication para autenticação
- Firebase Firestore para armazenamento de dados
- Funções Cloud para processamento de dados e cálculos complexos
- API para obtenção de cotações (Google Finance ou alternativa)

### Segurança
- Regras de segurança do Firestore para proteger dados
- Autenticação de usuários requerida para acesso
- Verificação de status de assinante para funcionalidades premium

## Fluxo do Usuário

1. Usuário faz login na plataforma
2. Sistema verifica se é assinante e redireciona para dashboard
3. Usuário visualiza sua carteira atual ou inicia uma nova
4. Ao adicionar uma ação, sistema sugere tickers disponíveis
5. Após inserir quantidade, sistema calcula automaticamente valores
6. Usuário pode editar ou excluir ativos existentes
7. Ao salvar, dados são persistidos no banco de dados
8. Dashboard atualiza com novos totais e visualizações

## Coleta de Dados do Usuário

Durante esta fase, coletar os seguintes dados para uso no CRM:
- Poder de aporte mensal (salvar explicitamente)
- Soma do patrimônio total (calcular automaticamente)
- Patrimônio em ações (calcular automaticamente)
- Custo de vida mensal (salvar explicitamente)

## Testes Recomendados

1. **Testes de Unidade**:
   - Cálculos de valores da carteira
   - Formatação de valores monetários
   - Validação de inputs

2. **Testes de Integração**:
   - Persistência de dados no Firestore
   - Atualização de cotações via API
   - Fluxo completo de CRUD da carteira

3. **Testes de Aceitação**:
   - Fluxo completo do usuário
   - Responsividade em diferentes dispositivos
   - Tratamento de erros e exceções

## Métricas de Sucesso

- Implementação completa das funcionalidades básicas de CRUD da carteira
- Dados salvos corretamente no banco de dados
- Cálculos precisos de patrimônio e renda
- Dashboard funcional com visualização dos dados principais
- Interface responsiva e amigável

## Próximos Passos após Conclusão da Fase 1

1. Validar a implementação com testes reais
2. Coletar feedback inicial dos usuários
3. Identificar possíveis melhorias ou correções
4. Iniciar o planejamento detalhado da Fase 2 (Projeção de Dividendos)