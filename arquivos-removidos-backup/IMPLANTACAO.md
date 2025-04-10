# Guia de Implantação do Blueprint Sábio

Este guia contém instruções para implantar o Blueprint Sábio com sucesso, garantindo que todas as funcionalidades, incluindo a administração do usuário, funcionem corretamente.

## 1. Preparação para Implantação

### 1.1 Verifique as Credenciais do Firebase

Confirme que as credenciais do Firebase em `src/firebase/config.js` estão corretas:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyCpZ2Xi69iDNgv9G6lMqYHQSiGmu0E-9Ho",
  authDomain: "blueprint-sabio.firebaseapp.com",
  projectId: "blueprint-sabio",
  storageBucket: "blueprint-sabio.firebasestorage.app",
  messagingSenderId: "948198115035",
  appId: "1:948198115035:web:dafc66782289433721eefe"
};
```

### 1.2 Verifique as Variáveis de Ambiente (se existirem)

Se você estiver usando um arquivo `.env` para variáveis de ambiente, assegure-se de que ele contém as configurações corretas:

```
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCpZ2Xi69iDNgv9G6lMqYHQSiGmu0E-9Ho
REACT_APP_FIREBASE_AUTH_DOMAIN=blueprint-sabio.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=blueprint-sabio
REACT_APP_FIREBASE_STORAGE_BUCKET=blueprint-sabio.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=948198115035
REACT_APP_FIREBASE_APP_ID=1:948198115035:web:dafc66782289433721eefe

# Stripe Configuration (se aplicável)
REACT_APP_STRIPE_PUBLIC_KEY=pk_live_51R4sSxHKhPr7Dhx9zKF3jHbDdEXZQKIxwksls4o94UusAM2WpWJlGYyLdWnqoQg07M0DFtzqzJOUgnn6CZQCzN6R00zVKguf9l

# Development Configuration
REACT_APP_USE_EMULATORS=false

# Other Configuration
REACT_APP_TRIAL_DAYS=7
```

## 2. Processo de Build

### 2.1 Instalar Dependências

```bash
npm install
```

### 2.2 Criar Build de Produção

```bash
npm run build
```

Este comando criará uma pasta `build` com os arquivos otimizados para produção.

## 3. Implantação no Firebase

### 3.1 Login no Firebase CLI

Se você ainda não está logado no Firebase CLI, execute:

```bash
firebase login
```

### 3.2 Implantação das Funções do Firebase (se aplicável)

```bash
npm run deploy:functions
```

ou

```bash
firebase deploy --only functions
```

### 3.3 Implantação das Regras do Firestore

```bash
npm run deploy:firestore
```

ou

```bash
firebase deploy --only firestore
```

### 3.4 Implantação do Frontend

```bash
npm run deploy
```

ou para implantar somente o hosting:

```bash
firebase deploy --only hosting
```

## 4. Verificação Pós-Implantação

### 4.1 Teste de Acesso Administrativo

1. Acesse o aplicativo implantado usando o navegador
2. Faça login como administrador (leonardomensitierii@gmail.com)
3. Verifique se você é redirecionado diretamente para o dashboard (e não para a página de pagamento)
4. Confira se todas as funcionalidades do administrador estão acessíveis

### 4.2 Teste do Fluxo de Pagamento (se aplicável)

1. Crie uma nova conta de usuário
2. Verifique se um usuário sem assinatura é redirecionado para a página de pagamento
3. Teste o processo de pagamento usando os cartões de teste do Stripe

### 4.3 Resolução de Problemas Comuns

**Problema: Usuário administrador ainda redirecionado para a página de pagamento**

Verifique se:
- O usuário tem o campo `role` definido como `admin` no Firestore
- O campo `hasActiveSubscription` está definido como `true` no Firestore
- A lógica de redirecionamento no Login.js está permitindo um pequeno atraso (timeout) para garantir que o estado de autenticação seja carregado

**Problema: Erros de implantação do Firebase**

- Verifique se você está logado na conta correta do Firebase
- Assegure-se de que o arquivo `firebase.json` está configurado corretamente
- Verifique se não há erros no console do Firebase após a implantação

## 5. Scripts de Implantação Disponíveis

```bash
# Inicia o app em modo de desenvolvimento
npm run start

# Cria um build de produção
npm run build

# Executa testes
npm run test

# Implanta tudo (hosting, functions, firestore)
npm run deploy

# Implanta apenas as Firebase Functions
npm run deploy:functions

# Implanta apenas as regras do Firestore
npm run deploy:firestore
```

## 6. Atualização e Manutenção

Para implantar atualizações futuras:

1. Faça as alterações necessárias no código
2. Execute `npm run build` para criar um novo build
3. Execute `npm run deploy` ou `firebase deploy` para implantar as alterações

---

Se precisar de mais assistência com a implantação, entre em contato com o desenvolvedor original ou consulte a documentação do Firebase em https://firebase.google.com/docs/hosting.