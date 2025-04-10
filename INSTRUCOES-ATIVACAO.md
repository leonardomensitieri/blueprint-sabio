# Instruções para Ativação do Blueprint Sábio - Nova Versão

Este documento contém instruções para ativar e testar a nova versão do Blueprint Sábio com o Dashboard Financeiro renovado.

## 1. Preparando o Ambiente

Antes de começar, certifique-se de ter:

- Node.js instalado (v14 ou superior)
- Firebase CLI instalado (`npm install -g firebase-tools`)
- Acesso ao projeto Firebase (blueprint-sabio)

## 2. Configuração Inicial

1. **Login no Firebase**

```bash
firebase login
```

2. **Instalar Dependências**

```bash
npm install
```

3. **Implantação das Funções do Firebase**

```bash
firebase deploy --only functions
```

4. **Implantação das Regras de Segurança**

```bash
firebase deploy --only firestore:rules
```

## 3. Executando o Projeto Localmente

1. **Iniciar o servidor Express**

```bash
npm run serve-build
```

2. **Acessar a Aplicação**

Abra seu navegador e acesse:
http://localhost:3000

## 4. Login no Sistema

Use as credenciais de teste:
- Email: teste@exemplo.com
- Senha: senha123

## 5. Recursos Disponíveis

### 5.1. Carteira de Ações

O componente de Carteira de Ações permite:

- Adicionar novas ações (ticker, quantidade, preço médio, dividendos)
- Visualizar a carteira atual
- Remover ações da carteira
- Visualizar sumário de investimentos e dividendos projetados

### 5.2. Dados Financeiros

A nova estrutura de dados organiza as informações em:

- Patrimônio em ações
- Patrimônio em renda fixa
- Reserva de emergência

## 6. Próximos Passos

Esta implementação é a base para o desenvolvimento dos demais módulos:

1. **Projeção de Dividendos**: Com base nos dividendos informados por ação
2. **Gestão de Renda Fixa**: Interface para cadastro e acompanhamento
3. **Reserva de Emergência**: Cálculo e recomendações
4. **Carteira Consolidada**: Visão integrada de todos os investimentos

## 7. Resolução de Problemas

### 7.1. Problema com login

Se ocorrer algum problema com o login:
- Verifique se as funções foram implantadas corretamente
- Tente limpar o cache do navegador
- Use a credencial de teste para garantir acesso

### 7.2. Erro ao adicionar ações

Se ocorrer erro ao adicionar ações à carteira:
- Verifique a conexão com o Firebase
- Reinicie o servidor local
- Tente fazer logout e login novamente

## 8. Contato para Suporte

Para qualquer problema ou dúvida, entre em contato com:
suporte@blueprintsabio.com

---

**Observação**: Esta nova versão está em fase final de implementação. Todos os módulos foram projetados para trabalhar em conjunto, proporcionando uma experiência completa de gestão financeira.