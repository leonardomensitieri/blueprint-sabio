# Acesso Rápido ao Blueprint Sábio

Se você estiver tendo problemas para fazer login no sistema, utilize as seguintes alternativas:

## Opção 1: Login com credenciais de teste

- Email: `teste@exemplo.com`
- Senha: `senha123`

## Opção 2: Acesso automático

1. Acesse a URL: [http://localhost:3000/admin-login](http://localhost:3000/admin-login)
2. O sistema tentará criar uma conta de teste automaticamente ou usará uma existente
3. Você será redirecionado para o dashboard após a autenticação

## Opção 3: Limpar dados de autenticação

Se as opções acima não funcionarem, pode ser necessário limpar os dados de autenticação do navegador:

1. Abra o console do navegador (F12)
2. Digite o seguinte comando:
   ```javascript
   sessionStorage.clear(); localStorage.clear(); indexedDB.deleteDatabase('firebaseLocalStorageDb');
   ```
3. Recarregue a página e tente novamente o login com as credenciais de teste

## Resolução de problemas

Se você continua enfrentando problemas:

1. Verifique o console do navegador para mensagens de erro
2. Certifique-se de que o Firebase está corretamente configurado no arquivo `src/firebase/config.js`
3. Verifique se o projeto está corretamente inicializado com `npm start`
4. Utilize a URL de acesso direto: [http://localhost:3000/admin-login](http://localhost:3000/admin-login)

## Notas

- Em ambiente de desenvolvimento, todos os usuários são automaticamente configurados como administradores para facilitar os testes
- As operações sensíveis estão desabilitadas em ambiente de desenvolvimento