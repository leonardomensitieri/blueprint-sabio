# Blueprint Sábio - Guia Completo

Este guia consolidado contém todas as informações essenciais sobre o Blueprint Sábio, desde a configuração inicial até a implantação e manutenção.

## 1. Visão Geral do Projeto

O Blueprint Sábio é uma aplicação web com dashboard financeiro, sistema de autenticação e pagamentos integrados. A aplicação permite:

- Análise de carteiras de investimentos
- Visualização de dados financeiros
- Acesso a recursos premium mediante assinatura
- Administração de usuários

## 2. Configuração do Ambiente

### 2.1 Configuração do Firebase

1. **Criar Projeto no Firebase**:
   - Acesse [Firebase Console](https://console.firebase.google.com/)
   - Clique em "Adicionar projeto"
   - Nomeie como "blueprint-sabio"

2. **Habilitar Serviços**:
   - **Authentication**: Habilite Email/Password
   - **Firestore Database**: Configure em modo de produção
   - **Firebase Functions**: Ative para processar pagamentos
   - **Hosting**: Para hospedagem web

3. **Adicionar App Web**:
   - Na página inicial do Firebase Console, clique no ícone web "</>"
   - Registre o app com o nome "blueprint-sabio-web"
   - Verifique se as credenciais correspondem às do arquivo `src/firebase/config.js`

### 2.2 Configuração do Stripe (Pagamentos)

1. **Criar Conta**:
   - Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
   - Obtenha as chaves API em "Desenvolvedores > Chaves da API"

2. **Configurar Webhook**:
   - Configure os eventos: `payment_intent.succeeded`, `payment_intent.payment_failed` e `customer.subscription.deleted`
   - URL para produção: `https://us-central1-blueprint-sabio.cloudfunctions.net/stripeWebhook`

### 2.3 Configuração Local

1. **Criar arquivo .env**:
   ```
   # Firebase Configuration
   REACT_APP_FIREBASE_API_KEY=AIzaSyCpZ2Xi69iDNgv9G6lMqYHQSiGmu0E-9Ho
   REACT_APP_FIREBASE_AUTH_DOMAIN=blueprint-sabio.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=blueprint-sabio
   REACT_APP_FIREBASE_STORAGE_BUCKET=blueprint-sabio.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=948198115035
   REACT_APP_FIREBASE_APP_ID=1:948198115035:web:dafc66782289433721eefe

   # Stripe Configuration
   REACT_APP_STRIPE_PUBLIC_KEY=pk_live_51R4sSxHKhPr7Dhx9zKF3jHbDdEXZQKIxwksls4o94UusAM2WpWJlGYyLdWnqoQg07M0DFtzqzJOUgnn6CZQCzN6R00zVKguf9l

   # Development Configuration
   REACT_APP_USE_EMULATORS=false

   # Other Configuration
   REACT_APP_TRIAL_DAYS=7
   ```

2. **Configurar Firebase Functions**:
   ```bash
   firebase functions:config:set stripe.secret="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"
   firebase functions:config:set stripe.webhook_secret="whsec_U3hU2MR1hj0v6GheWMG06jS5e2d6bnm3"
   ```

## 3. Desenvolvimento Local

1. **Instalar Dependências**:
   ```bash
   npm install
   ```

2. **Iniciar Servidor de Desenvolvimento**:
   ```bash
   npm start
   ```

3. **Executar Testes**:
   ```bash
   npm test
   ```

## 4. Funcionalidades Implementadas

### 4.1 Dashboard Financeiro

- **Persistência da carteira no Firestore**
- **Conexão com API Brapi para dados financeiros**
- **Sistema de cache para minimizar requisições**
- **Visualizações e análises de carteira**:
  - Alocação por classe de ativos
  - Rendimentos por tipo de investimento
  - Cálculos de dividend yield
  - Recomendações baseadas na carteira

### 4.2 Sistema de Autenticação

- **Login/Cadastro com email e senha**
- **Rotas protegidas para conteúdo premium**
- **Redirecionamento inteligente baseado no status do usuário**
- **Acesso administrativo para usuários específicos**

### 4.3 Sistema de Pagamento

- **Integração com Stripe para pagamentos**
- **Assinaturas recorrentes**
- **Período de teste gratuito**
- **Verificação de status de assinatura**

## 5. Implantação

### 5.1 Build de Produção

```bash
npm run build
```

### 5.2 Implantação no Firebase

```bash
# Implantar funções
firebase deploy --only functions

# Implantar regras do Firestore
firebase deploy --only firestore

# Implantar aplicação web
firebase deploy --only hosting

# Ou implantar tudo
firebase deploy
```

## 6. Resolução de Problemas

### 6.1 Problemas de Login/Autenticação

1. **Loop de redirecionamento**:
   - Verifique o componente ProtectedRoute
   - Verifique logs no console do navegador

2. **Usuários não conseguem fazer login**:
   - Verifique as regras de segurança do Firestore
   - Teste com usuário criado diretamente no Firebase Console

### 6.2 Problemas com Pagamentos

1. **Pagamentos não processados**:
   - Verifique as chaves do Stripe
   - Confirme configuração do webhook
   - Verifique logs das Functions

2. **Status de assinatura não atualiza**:
   - Verifique a função checkActiveSubscription
   - Confirme atualização dos documentos no Firestore

### 6.3 Problemas com Firebase Functions

1. **Erros de implantação**:
   - Verifique se está logado no Firebase CLI
   - Execute `firebase functions:log` para ver erros

2. **Problemas com variáveis de configuração**:
   - Verifique com `firebase functions:config:get`

### 6.4 Problemas com React e Dependências

1. **Conflitos entre React 19 e Stripe**:
   ```bash
   npm install react@18 react-dom@18 --legacy-peer-deps
   ```

2. **Problemas com execução de scripts no PowerShell**:
   ```powershell
   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
   ```

## 7. Acesso de Administrador

O usuário `leonardomensitierii@gmail.com` está configurado como administrador, com acesso completo a todos os recursos sem necessidade de assinatura.

Para mais detalhes sobre o acesso administrativo, consulte o arquivo `ADMIN-GUIDE.md`.

## 8. Próximos Passos

- **Implementar página de perfil do usuário**
- **Adicionar suporte a múltiplos métodos de pagamento**
- **Implementar sistema de notificações por e-mail**
- **Criar painel administrativo completo para gestão de assinaturas**
- **Implementar análise de conversão e retenção**
- **Adicionar suporte para FIIs e criptomoedas**
- **Implementar exportação para declaração de imposto de renda**
- **Adicionar comparativos com índices de mercado**