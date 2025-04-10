# Guia para Testar o Acesso de Administrador Localmente

Este guia explica como testar localmente as alterações implementadas para garantir o acesso do administrador.

## 1. Inicie o Servidor de Desenvolvimento

```bash
cd "/mnt/c/Users/drmar/OneDrive/Área de Trabalho/site planilha leo/blueprint-sabio"
npm start
```

## 2. Opções de Teste

### 2.1 Login Normal

1. Acesse http://localhost:3000/login
2. Digite as credenciais:
   - Email: `leonardomensitierii@gmail.com`
   - Senha: (sua senha)
3. Clique em "Entrar"
4. Observe os logs no console do navegador (F12)
5. Confirme que você é redirecionado para o dashboard, não para a página de pagamento

### 2.2 Acesso Direto de Administrador

1. Acesse http://localhost:3000/admin-login
2. Você deve ser automaticamente redirecionado para o dashboard
3. Se não for redirecionado automaticamente, clique no botão "Acessar Dashboard"

### 2.3 Acesso ao Dashboard com Flag de Sessão

1. Abra o console do navegador (F12)
2. Execute o comando: `sessionStorage.setItem('adminAccess', 'true')`
3. Acesse http://localhost:3000/dashboard
4. Confirme que você tem acesso mesmo sem fazer login

## 3. Depuração

### 3.1 Verificar Logs

1. Abra as Ferramentas de Desenvolvedor do navegador (F12)
2. Vá para a aba "Console"
3. Procure pelos logs que adicionamos:
   - "Verificando status de assinatura para uid:"
   - "Email do admin específico detectado"
   - "ProtectedRoute - usuário é admin, permitindo acesso"

### 3.2 Verificar Estado da Autenticação

1. No console do navegador, adicione este código para verificar o estado após login:
   ```javascript
   setTimeout(() => {
     console.log("Admin Check:", sessionStorage.getItem('adminAccess'));
     console.log("Verificando localStorage:", Object.keys(localStorage));
   }, 5000);
   ```

### 3.3 Verificar Rotas

1. Tente acessar várias rotas protegidas após o login:
   - http://localhost:3000/dashboard
   - http://localhost:3000/dashboard/checklist
   - http://localhost:3000/dashboard/top-stocks

## 4. Correções Rápidas Se Necessário

### 4.1 Se os logs não aparecerem:

Provavelmente o navegador está filtrando os logs. Ajuste os níveis de log:
1. No console do Chrome, clique na engrenagem (⚙️)
2. Marque "Verbose" ou "All levels"

### 4.2 Se o redirecionamento ainda não funcionar:

Use o método direto:
1. No console do navegador, execute:
   ```javascript
   sessionStorage.setItem('adminAccess', 'true');
   window.location.href = '/dashboard';
   ```

## 5. Preparação para Produção

Após testar com sucesso localmente:

1. Construa o projeto para produção:
   ```bash
   npm run build
   ```

2. Para implantar (requer login no Firebase):
   ```bash
   firebase login
   firebase deploy
   ```

Lembre-se de verificar o RESUMO-MUDANCAS.md para entender todas as alterações que foram feitas para garantir o acesso de administrador.