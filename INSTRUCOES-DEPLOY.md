# Instruções para Deploy do Blueprint Sábio - Nova Versão

Este documento contém instruções detalhadas para completar o deploy da nova versão do Blueprint Sábio com o Dashboard Financeiro renovado.

## 1. Instalar Dependências das Funções Firebase

Abra um terminal e navegue até a pasta do projeto:

```powershell
cd "C:\Users\drmar\OneDrive\Área de Trabalho\site planilha leo\blueprint-sabio"
```

Instale as dependências na pasta `functions`:

```powershell
cd functions
npm install
cd ..
```

## 2. Deploy das Funções Firebase

Com as dependências instaladas, agora podemos fazer o deploy das funções:

```powershell
firebase deploy --only functions
```

## 3. Deploy das Regras do Firestore

Em seguida, vamos implantar as regras de segurança do Firestore:

```powershell
firebase deploy --only firestore:rules
```

## 4. Verificação da Implantação

Após o deploy, verifique no Console do Firebase se:

1. As funções foram implantadas corretamente:
   - Acesse https://console.firebase.google.com/project/blueprint-sabio/functions
   - Verifique se as funções `initializeUserData` e `updateFinancialTotals` estão listadas

2. As regras do Firestore foram atualizadas:
   - Acesse https://console.firebase.google.com/project/blueprint-sabio/firestore/rules

## 5. Teste Local da Aplicação

Para testar a aplicação localmente:

```powershell
npm run serve-build
```

Este comando iniciará um servidor Express que servirá a aplicação compilada.

Abra o navegador e acesse:
http://localhost:3000

Use as credenciais de teste:
- Email: teste@exemplo.com
- Senha: senha123

## 6. Solução de Problemas

### 6.1. Erro no Deploy das Funções

Se ocorrer algum erro durante o deploy das funções:

1. Verifique se você está logado no Firebase:
   ```powershell
   firebase login
   ```

2. Se o problema persistir, tente:
   ```powershell
   cd functions
   npm install firebase-admin firebase-functions --save
   cd ..
   firebase deploy --only functions
   ```

### 6.2. Erro nas Regras do Firestore

Se ocorrer erro ao implantar as regras do Firestore:

1. Verifique a sintaxe do arquivo `firestore.rules`
2. Tente usar o emulador para testar localmente:
   ```powershell
   firebase emulators:start --only firestore
   ```

### 6.3. Problemas com o Servidor Express

Se o servidor Express não iniciar corretamente:

1. Verifique se o Express está instalado:
   ```powershell
   npm install express --save
   ```

2. Tente executar o servidor diretamente:
   ```powershell
   node serve-build.js
   ```

## 7. Próximos Passos

Após a implantação bem-sucedida:

1. Teste todas as funcionalidades da Carteira de Ações:
   - Adicione algumas ações
   - Verifique os cálculos totais
   - Remova ações

2. Planeje o desenvolvimento dos próximos módulos:
   - Projeção de Dividendos
   - Gestão de Renda Fixa
   - Reserva de Emergência

## 8. Contato para Suporte

Para qualquer problema ou dúvida durante a implantação, entre em contato com:
suporte@blueprintsabio.com