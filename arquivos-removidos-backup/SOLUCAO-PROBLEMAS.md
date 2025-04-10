# Guia de Resolução de Problemas do Blueprint Sábio

Este guia oferece soluções para problemas comuns que podem ocorrer durante a configuração, uso e manutenção do Blueprint Sábio.

## 1. Problemas de Acesso de Administrador

### 1.1 Administrador redirecionado para página de pagamento

**Sintoma:** O usuário administrador (leonardomensitierii@gmail.com) é redirecionado para a página de pagamento após o login, em vez do dashboard.

**Possíveis causas e soluções:**

1. **Verificação de Role no Firebase**
   - Abra o Firebase Console > Firestore Database > coleção `users`
   - Localize o documento do usuário leonardomensitierii@gmail.com
   - Verifique se `role` = `"admin"` e `hasActiveSubscription` = `true`
   - Se não, edite manualmente esses campos no console

2. **Timeout insuficiente no Login.js**
   - O tempo configurado pode não ser suficiente para carregar os dados do usuário
   - Aumente o timeout no arquivo `src/components/auth/Login.js`:
   ```javascript
   setTimeout(() => {
     // Verificação e redirecionamento
   }, 2000); // Aumente de 1000ms para 2000ms ou mais
   ```

3. **Cache do navegador**
   - Limpe o cache do navegador
   - Tente em uma janela anônima/privada
   - Tente em outro navegador

4. **Erro no processo de login**
   - Adicione logs temporários para debug:
   ```javascript
   // Em AuthProvider.js
   console.log("Dados do usuário:", userDataFromDb);
   console.log("Status de admin:", isAdminUser);
   console.log("Status de assinatura:", hasActiveSubscription);
   ```

### 1.2 Problemas com a função isAdmin

**Sintoma:** A função isAdmin não está retornando true para usuários administradores.

**Soluções:**

1. Verifique se a função isAdmin em db.js está funcionando corretamente:
```javascript
export const isAdmin = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    console.log("isAdmin check for uid:", uid);
    console.log("User data:", docSnap.exists() ? docSnap.data() : "Document does not exist");
    
    if (!docSnap.exists()) {
      return false;
    }
    
    const userData = docSnap.data();
    return userData.role === 'admin';
  } catch (error) {
    console.error("Erro ao verificar status de administrador:", error);
    return false;
  }
};
```

2. Se a função ainda falhar, tente uma abordagem alternativa:
```javascript
// Adicione esta função em db.js
export const isAdminByEmail = async (email) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email), where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);
    
    return !querySnapshot.empty;
  } catch (error) {
    console.error("Erro ao verificar status de administrador por email:", error);
    return false;
  }
};
```

## 2. Problemas de Implantação (Deployment)

### 2.1 Erros no Firebase Login

**Sintoma:** Mensagem de erro `Failed to authenticate, have you run firebase login?` ao tentar implantar.

**Soluções:**

1. Execute o login no Firebase CLI:
```bash
firebase login
```

2. Se o login falhar, tente:
```bash
firebase logout
firebase login --reauth
```

3. Verifique se as permissões do projeto estão corretas no console do Firebase

### 2.2 Erros de build

**Sintoma:** Falhas ao criar o build de produção com `npm run build`.

**Soluções:**

1. **Problemas de versão do React:**
   - Certifique-se de que todas as dependências do React são compatíveis:
   ```bash
   npm install react@18 react-dom@18 --legacy-peer-deps
   ```

2. **Problemas de TypeScript:**
   - Verifique o arquivo tsconfig.json
   - Temporariamente ignore erros de TypeScript:
   ```bash
   # No package.json, altere:
   "build": "DISABLE_ESLINT_PLUGIN=true react-scripts build",
   ```

### 2.3 Problemas com Firebase Functions

**Sintoma:** Erro ao implantar ou executar Firebase Functions.

**Soluções:**

1. Verifique se as variáveis de configuração do Firebase estão definidas:
```bash
firebase functions:config:get
```

2. Se necessário, redefina as variáveis:
```bash
firebase functions:config:set stripe.secret="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"
firebase functions:config:set stripe.webhook_secret="whsec_U3hU2MR1hj0v6GheWMG06jS5e2d6bnm3"
```

3. Resolva dependências dentro da pasta functions:
```bash
cd functions
npm install
cd ..
```

## 3. Problemas de Autenticação e Redirecionamento

### 3.1 Loop de redirecionamento

**Sintoma:** O aplicativo está em um loop infinito de redirecionamento.

**Soluções:**

1. Verifique o componente ProtectedRoute.tsx
2. Assegure-se de que a condição de redirecionamento não cria loops:
```javascript
// Exemplo correto em ProtectedRoute.tsx
if (requireAuth && !currentUser) {
  return <Navigate to={redirectTo} />;
}
```

3. Verifique a lógica de redirecionamento em Login.js e AuthProvider.js

### 3.2 Usuários não conseguem fazer login

**Sintoma:** Usuários não conseguem fazer login ou recebem mensagens de erro genéricas.

**Soluções:**

1. Verifique as regras de segurança do Firestore
2. Teste com um usuário de teste criado diretamente no Firebase Console
3. Adicione logs detalhados na função de login:
```javascript
const login = async (email, password) => {
  try {
    console.log("Tentando login para:", email);
    setError('');
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log("Login bem-sucedido:", userCredential);
    return userCredential.user;
  } catch (error) {
    console.error("Erro no login detalhado:", error.code, error.message);
    // Lógica de tratamento de erros...
    throw error;
  }
};
```

## 4. Problemas com Pagamentos (se aplicável)

### 4.1 Falha no processamento de pagamentos

**Sintoma:** Os pagamentos não são processados corretamente ou não atualizam o status da assinatura.

**Soluções:**

1. Verifique as chaves do Stripe nos arquivos de configuração
2. Confirme se o webhook do Stripe está configurado corretamente
3. Verifique os logs das Firebase Functions relacionadas a pagamentos

### 4.2 Status de assinatura não atualiza

**Sintoma:** O pagamento é bem-sucedido, mas o usuário continua sendo tratado como não assinante.

**Soluções:**

1. Verifique a função `checkActiveSubscription` em db.js
2. Confirme se o webhook do Stripe está atualizando o Firestore corretamente
3. Verifique se o documento do usuário no Firestore está sendo atualizado após o pagamento

## 5. Problemas de Carregamento de Dados

### 5.1 Dados não aparecem no dashboard

**Sintoma:** As informações não aparecem ou aparecem parcialmente no dashboard.

**Soluções:**

1. Verifique o console do navegador para erros
2. Confirme que as consultas ao Firestore estão corretas
3. Adicione logs para depurar:
```javascript
useEffect(() => {
  const fetchData = async () => {
    try {
      console.log("Buscando dados...");
      // Código de busca
      console.log("Dados recebidos:", data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };
  
  fetchData();
}, []);
```

## 6. Contato para Suporte Adicional

Se os problemas persistirem após tentar as soluções deste guia, considere:

1. Verificar os logs no Firebase Console (Functions, Hosting, Authentication)
2. Revisar a documentação oficial do Firebase e React
3. Entrar em contato com o desenvolvedor que implementou a solução de administrador

---

Este guia de resolução de problemas será atualizado conforme novos problemas e soluções forem identificados durante o uso do Blueprint Sábio.