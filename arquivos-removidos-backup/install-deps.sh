#!/bin/bash

# Script para instalar dependências do Blueprint Sábio com compatibilidade para React 19

echo "Instalando dependências do Blueprint Sábio..."

# Limpar o cache do npm para evitar problemas de dependências
echo "Limpando cache do npm..."
npm cache clean --force

# Instalar todas as dependências usando legacy-peer-deps
echo "Instalando todas as dependências..."
npm install --legacy-peer-deps

# Caso ainda tenha problemas, instalar bibliotecas críticas individualmente
echo "Verificando bibliotecas críticas..."

# React Router
echo "Instalando React Router..."
npm install react-router-dom@6 --legacy-peer-deps

# Firebase
echo "Instalando Firebase..."
npm install firebase --legacy-peer-deps

# Stripe
echo "Instalando Stripe..."
npm install @stripe/stripe-js @stripe/react-stripe-js --legacy-peer-deps

# Tipos para TypeScript
echo "Instalando tipos para TypeScript..."
npm install --save-dev @types/react-router-dom @types/react @types/react-dom --legacy-peer-deps

echo "======================================"
echo "Instalação concluída!"
echo ""
echo "Se você ainda encontrar problemas de compatibilidade, considere:"
echo "1. Fazer downgrade do React para a versão 18:"
echo "   npm install react@18 react-dom@18 --legacy-peer-deps"
echo ""
echo "2. Ou forçar a instalação das dependências:"
echo "   npm install --force"
echo ""
echo "Para iniciar o projeto, execute: npm start"
echo "======================================"