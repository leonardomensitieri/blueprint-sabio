# Blueprint Sábio - Dashboard Financeiro

Bem-vindo ao Blueprint Sábio, uma plataforma para análise de investimentos e gestão financeira.

## Arquivos de Documentação

Este projeto possui vários arquivos de documentação para ajudá-lo:

- **INSTRUCOES-BUILD.md**: Como executar a versão compilada (build)
- **INSTRUCOES-DEPLOY.md**: Como implantar as funções Firebase e regras Firestore
- **INSTRUCOES-ATIVACAO.md**: Como ativar e testar a nova versão
- **IMPLEMENTACAO-DASHBOARD.md**: Detalhes técnicos da implementação
- **BACKUP-PASTA-BUILD.md**: Informações sobre o backup da versão compilada

## Estrutura do Projeto

- **/src**: Código-fonte da aplicação React
  - **/components**: Componentes React
  - **/firebase**: Configuração do Firebase
  - **/services**: Serviços para comunicação com o backend
- **/build**: Versão compilada da aplicação
- **/functions**: Funções Cloud do Firebase
- **/arquivos-removidos-backup**: Backup de arquivos não essenciais

## Componentes Principais

1. **Dashboard**: Interface principal da aplicação
2. **Carteira de Ações**: Gerenciamento da carteira de investimentos
3. **AuthProvider**: Sistema de autenticação e autorização

## Instruções Rápidas

### Executar Versão Compilada

```
npm run serve-build
```
ou clique em `serve-build.bat`

### Deploy das Funções Firebase

```
cd functions
npm install
cd ..
firebase deploy --only functions
```

### Credenciais de Teste

- Email: teste@exemplo.com
- Senha: senha123

## Criado Com

- React.js
- Firebase (Auth, Firestore, Functions)
- Express (servidor para a versão compilada)

## Notas Importantes

- Esta versão implementa a nova estrutura de dados para o Dashboard Financeiro
- Todas as modificações são compatíveis com o build existente
- Para dúvidas, consulte os arquivos de documentação específicos