# Blueprint Sábio - Guia de Implementação

Este guia contém instruções detalhadas para configuração e implementação do Blueprint Sábio com autenticação e sistema de pagamentos.

## 1. Configuração do Firebase

### 1.1 Criar Projeto no Firebase Console

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Nomeie como "blueprint-sabio" (para corresponder à configuração)
4. Siga as etapas de configuração (ative o Google Analytics se desejar)

### 1.2 Habilitar Serviços do Firebase

#### Autenticação
1. No menu lateral, clique em "Authentication"
2. Em "Sign-in method", habilite o provedor "Email/Password"

#### Firestore Database
1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha o modo de produção
4. Selecione a região mais próxima do Brasil
5. Clique em "Próximo" e depois "Habilitar"

#### Regras do Firestore
1. Na seção Firestore, vá para a aba "Regras"
2. Cole o conteúdo do arquivo `firestore.rules` do projeto

#### Functions
1. No menu lateral, clique em "Functions"
2. Clique em "Começar"
3. Siga as instruções para instalar o Firebase CLI (se ainda não tiver feito)

### 1.3 Adicionar App Web

1. Na página inicial do Firebase Console, clique no ícone da web "</>"
2. Registre o app com o nome "blueprint-sabio-web"
3. Verifique se as credenciais correspondem às que estão no arquivo `src/firebase/config.js`

## 2. Configuração do Stripe

### 2.1 Criar Conta Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/)
2. Crie uma conta ou faça login
3. Obtenha as chaves API na seção "Desenvolvedores > Chaves da API"
   - Chave publicável `pk_live_...`
   - Chave secreta `sk_live_...`

### 2.2 Configurar Webhook

1. No Stripe Dashboard, vá para "Desenvolvedores > Webhooks"
2. Clique em "Adicionar endpoint"
3. Para teste local use: `https://localhost:5001/blueprint-sabio/us-central1/stripeWebhook`
4. Para produção, depois de implantar as Functions, use: `https://us-central1-blueprint-sabio.cloudfunctions.net/stripeWebhook`
5. Selecione os eventos:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `customer.subscription.deleted`
6. Copie o "Signing secret" (`whsec_...`)

## 3. Configuração do Ambiente Local

### 3.1 Arquivo .env

No diretório raiz do projeto, crie um arquivo `.env` com o seguinte conteúdo (usando suas credenciais):

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

### 3.2 Configuração das Functions Firebase

Configure as variáveis de ambiente para as Firebase Functions:

```bash
firebase functions:config:set stripe.secret="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"
firebase functions:config:set stripe.webhook_secret="whsec_U3hU2MR1hj0v6GheWMG06jS5e2d6bnm3"
```

## 4. Implantação

### 4.1 Implantação das Functions

1. Resolva problemas de linting nas Firebase Functions (se houver)
2. No diretório do projeto, execute:
```bash
cd functions
npm install
firebase deploy --only functions
```

### 4.2 Implantação da Aplicação Web (opcional)

```bash
npm run build
firebase deploy --only hosting
```

## 5. Resolução de Problemas Comuns

### 5.1 Problemas com React 19 e Stripe

Se encontrar conflitos entre React 19 e as bibliotecas Stripe:

1. Faça downgrade para React 18:
```bash
npm install react@18 react-dom@18 --legacy-peer-deps
```

2. Ou force a instalação:
```bash
npm install --force
```

### 5.2 Problemas com Firebase Functions

- Verifique se as variáveis de configuração estão corretas:
```bash
firebase functions:config:get
```

- Verifique os logs das funções:
```bash
firebase functions:log
```

### 5.3 Configuração do PowerShell

Se tiver problemas com a execução de scripts no PowerShell:

1. Abra o PowerShell como administrador
2. Execute:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

3. Execute o script de instalação:
```powershell
.\install-deps.ps1
```

## 6. Testes

### 6.1 Teste de Autenticação

1. Acesse a aplicação
2. Crie uma nova conta de usuário
3. Faça logout e login novamente
4. Teste a recuperação de senha

### 6.2 Teste de Pagamento

Para testar pagamentos no Stripe em modo de teste:

1. Use os cartões de teste do Stripe:
   - Pagamento bem-sucedido: `4242 4242 4242 4242`
   - Pagamento que requer autenticação: `4000 0025 0000 3155`
   - Pagamento recusado: `4000 0000 0000 0002`
2. Data de validade futura (qualquer)
3. Qualquer CVC de 3 dígitos
4. Qualquer CEP

### 6.3 Webhook Local (Opcional)

Para testar webhooks localmente:

1. Instale o Stripe CLI: https://stripe.com/docs/stripe-cli
2. Execute:
```bash
stripe listen --forward-to http://localhost:5001/blueprint-sabio/us-central1/stripeWebhook
```

## 7. Próximos Passos

Após a configuração inicial:

1. Implementar página de perfil do usuário
2. Adicionar suporte a múltiplos métodos de pagamento
3. Implementar sistema de notificações por e-mail
4. Criar painel administrativo para gestão de assinaturas
5. Implementar análise de conversão e retenção