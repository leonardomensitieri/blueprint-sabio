# Blueprint Sábio - Guia de Acesso Administrativo

Este guia consolidado contém todas as informações necessárias sobre o acesso do administrador para o Blueprint Sábio.

## 1. Sobre o Acesso de Administrador

No Blueprint Sábio, o usuário `leonardomensitierii@gmail.com` está configurado como administrador e tem:
- Acesso permanente a todos os recursos
- Não precisa de assinatura ativa
- Não está sujeito a períodos de teste
- Pode acessar recursos premium/restritos

## 2. Como Acessar como Administrador

### 2.1 Acesso Normal (Recomendado)

1. Acesse a página de login do Blueprint Sábio
2. Digite as credenciais:
   - Email: `leonardomensitierii@gmail.com`
   - Senha: (sua senha)
3. Clique em "Entrar"

Você será redirecionado automaticamente para o dashboard, sem passar pela página de pagamento.

### 2.2 Acesso Alternativo

Se o método normal não funcionar, utilize:

1. **Acesso Direto**: Navegue para `/admin-login`
   - Em produção: `https://blueprint-sabio.web.app/admin-login`
   - Em desenvolvimento: `http://localhost:3000/admin-login`

2. **Flag de Sessão**: Outra alternativa é:
   - Abra o console do navegador (F12)
   - Execute: `sessionStorage.setItem('adminAccess', 'true')`
   - Acesse `/dashboard` diretamente

## 3. Verificação do Acesso

Para verificar se o acesso de administrador está funcionando corretamente:

1. Faça login como administrador
2. Observe se é redirecionado para o dashboard (não para a página de pagamento)
3. Tente acessar recursos premium para confirmar acesso total
4. Verifique se não há mensagens solicitando assinatura ou pagamento

## 4. Como o Acesso de Administrador Funciona

Implementamos múltiplas camadas de verificação para garantir que o administrador tenha acesso mesmo se uma camada falhar:

1. **Verificação direta pelo email**: Verificações específicas para `leonardomensitierii@gmail.com` em:
   - Login.js (timeout aumentado para 3000ms)
   - AuthProvider.js
   - ProtectedRoute.js/tsx
   - db.js (função isAdmin)

2. **Role baseada em banco de dados**: Verificação do campo `role: "admin"` no documento do usuário no Firestore

3. **Flag de sessão**: Uso de `sessionStorage` com a chave `adminAccess`

4. **Rota de bypass**: URL específica `/admin-login` com acesso direto

## 5. Resolução de Problemas Comuns

### 5.1 Ainda redirecionando para a página de pagamento

Se o usuário administrador ainda for redirecionado para a página de pagamento:

1. **Verifique os dados no Firestore**:
   - Acesse o [Firebase Console](https://console.firebase.google.com/)
   - Navegue até Firestore Database > coleção `users`
   - Localize o documento do usuário com email `leonardomensitierii@gmail.com`
   - Confirme que `role` = `"admin"` e `hasActiveSubscription` = `true`
   - Se não estiverem corretos, edite manualmente esses campos

2. **Limpe o cache do navegador**:
   - Pressione Ctrl+Shift+Del
   - Selecione "Cookies e dados do site" e "Imagens e arquivos em cache"
   - Clique em "Limpar dados"
   - Tente novamente em uma janela anônima/privada

3. **Use a rota alternativa**:
   - Acesse diretamente `/admin-login`

### 5.2 Problemas de carregamento no dashboard

Se encontrar problemas após acessar o dashboard:

1. Verifique possíveis erros no console do navegador (F12 > Console)
2. Certifique-se de que a conexão com o Firebase está funcionando
3. Verifique se há erros nas funções de API

## 6. Resumo das Alterações Implementadas

Para garantir o acesso do administrador, foram feitas as seguintes modificações no código:

1. **Login.js**:
   - Aumentado o timeout de 1000ms para 3000ms
   - Adicionada verificação direta pelo email `leonardomensitierii@gmail.com`
   - Adicionados logs detalhados para depuração

2. **AuthProvider.js**:
   - Adicionada verificação direta pelo email no useEffect
   - Adicionadas importações necessárias do Firestore
   - Modificada a função checkUserSubscriptionStatus

3. **db.js**:
   - Adicionada verificação direta pelo email na função isAdmin
   - Melhorada a robustez para lidar com dados incompletos

4. **ProtectedRoute.js/tsx**:
   - Adicionada verificação direta pelo email
   - Implementada verificação da flag de sessão
   - Corrigidos problemas com hooks React

5. **Novos componentes**:
   - Criado componente BypassLogin.js para rota alternativa
   - Adicionada rota `/admin-login`

## 7. Testes Locais

Para testar localmente se o acesso de administrador está funcionando:

1. Inicie o servidor de desenvolvimento:
   ```bash
   npm start
   ```

2. Teste o login normal em http://localhost:3000/login

3. Teste a rota alternativa em http://localhost:3000/admin-login

4. Verifique o console do navegador para logs detalhados

## 8. Próximos Passos

- Monitorar a experiência do usuário administrador
- Garantir que o acesso de administrador permanece funcional após atualizações
- Considerar a adição de um painel de administração completo no futuro