import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { 
  collection, 
  addDoc, 
  doc, 
  setDoc, 
  getDocs,
  getDoc,
  query, 
  where, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import '../../styles/SetupDatabase.css';

// Função para configurar a estrutura financeira de um usuário
const setupUserFinancialData = async (userId) => {
  if (!userId) {
    console.error('ID de usuário não fornecido');
    return false;
  }

  try {
    console.log(`Configurando estrutura financeira para usuário ${userId}`);
    
    // Atualizar documento principal do usuário se necessário
    const userRef = doc(db, 'users', userId);
    
    // Verificar se o usuário existe
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) {
      console.log(`Usuário ${userId} não existe, criando documento básico`);
      // Criar documento de usuário se não existir
      await setDoc(userRef, {
        email: "usuário temporário",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      // Atualizar timestamp se o usuário existir
      await updateDoc(userRef, {
        updatedAt: serverTimestamp()
      });
    }
    
    // Criar documento de dados financeiros
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    
    // Verificar se já existe para não sobrescrever
    const docSnap = await getDoc(financialDataRef);
    if (docSnap.exists()) {
      console.log(`Documento financeiro já existe para ${userId}, atualizando...`);
    }
    
    // Configurar estrutura financeira padrão
    await setDoc(financialDataRef, {
      poderDeAporte: 2000,
      custoDeVidaMensal: 5000,
      patrimonioAcoes: {
        total: 0,
        tickers: {}
      },
      patrimonioRendaFixa: {
        total: 30000,
        tempoInvestido: '12-24'
      },
      patrimonioReservaDeEmergencia: {
        total: 25000,
        empregoEstavelConcursado: true,
        pjAutonomo: false
      },
      patrimonioTotal: 55000, // Soma inicial sem ações
      updatedAt: serverTimestamp()
    });
    
    console.log(`Estrutura financeira configurada com sucesso para usuário ${userId}`);
    return true;
  } catch (error) {
    console.error('Erro ao configurar estrutura financeira:', error);
    return false;
  }
};

// Função para adicionar uma ação à carteira do usuário
const addStockToUserPortfolio = async (userId, stockData) => {
  if (!userId) {
    console.error('ID de usuário não fornecido');
    return false;
  }

  try {
    console.log(`Adicionando ação ${stockData.ticker} ao usuário ${userId}`);
    
    // Buscar documento de dados financeiros
    const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
    
    // Verificar se o documento financeiro existe
    const financialDoc = await getDoc(financialDataRef);
    if (!financialDoc.exists()) {
      console.error(`Documento financeiro não existe para usuário ${userId}. Configure primeiro a estrutura financeira.`);
      return false;
    }
    
    // Preparar dados da ação
    const quantidade = stockData.quantidade || 100;
    const cotacao = stockData.cotacao || 25.0;
    const valor = quantidade * cotacao;
    
    // Obter dados atuais
    const currentData = financialDoc.data();
    
    // Calcular novo total
    let totalAcoes = currentData.patrimonioAcoes?.total || 0;
    totalAcoes += valor;
    
    // Calcular patrimônio total
    const rendaFixaTotal = currentData.patrimonioRendaFixa?.total || 0;
    const emergenciaTotal = currentData.patrimonioReservaDeEmergencia?.total || 0;
    const patrimonioTotal = totalAcoes + rendaFixaTotal + emergenciaTotal;
    
    // Atualizar documento
    await updateDoc(financialDataRef, {
      [`patrimonioAcoes.tickers.${stockData.ticker}`]: {
        quantidadeAcoes: quantidade,
        cotacao: cotacao,
        ultimaAtualizacao: serverTimestamp()
      },
      'patrimonioAcoes.total': totalAcoes,
      'patrimonioTotal': patrimonioTotal,
      updatedAt: serverTimestamp()
    });
    
    console.log(`Ação ${stockData.ticker} adicionada com sucesso à carteira do usuário ${userId}`);
    return true;
  } catch (error) {
    console.error(`Erro ao adicionar ação ${stockData.ticker}:`, error);
    return false;
  }
};

// Função para configurar dados fundamentais de ações
const setupStocksFundamentals = async () => {
  try {
    console.log('Configurando dados fundamentais de ações...');
    
    // Lista de ações para configurar
    const stocks = [
      {
        ticker: 'PETR4',
        nome: 'Petrobras PN',
        setor: 'Petróleo e Gás',
        precoTeto: 42.50,
        dividendYield: 15.8,
        lucroProjetado: 125.6,
        patrimonioLiquido: 390.5,
        dividendoPorAcao: 4.32,
        roe: 32.2,
        payout: 80,
        cotacaoAtual: 28.75,
        dataAtualizacao: serverTimestamp()
      },
      {
        ticker: 'VALE3',
        nome: 'Vale ON',
        setor: 'Mineração',
        precoTeto: 94.20,
        dividendYield: 9.2,
        lucroProjetado: 56.3,
        patrimonioLiquido: 248.7,
        dividendoPorAcao: 6.85,
        roe: 22.6,
        payout: 65,
        cotacaoAtual: 74.50,
        dataAtualizacao: serverTimestamp()
      },
      {
        ticker: 'ITUB4',
        nome: 'Itaú Unibanco PN',
        setor: 'Bancos',
        precoTeto: 36.80,
        dividendYield: 6.5,
        lucroProjetado: 32.8,
        patrimonioLiquido: 175.2,
        dividendoPorAcao: 1.95,
        roe: 18.7,
        payout: 50,
        cotacaoAtual: 30.90,
        dataAtualizacao: serverTimestamp()
      },
      {
        ticker: 'BBDC4',
        nome: 'Bradesco PN',
        setor: 'Bancos',
        precoTeto: 22.50,
        dividendYield: 7.8,
        lucroProjetado: 19.5,
        patrimonioLiquido: 150.6,
        dividendoPorAcao: 1.42,
        roe: 13.0,
        payout: 60,
        cotacaoAtual: 18.25,
        dataAtualizacao: serverTimestamp()
      },
      {
        ticker: 'WEGE3',
        nome: 'WEG ON',
        setor: 'Bens Industriais',
        precoTeto: 56.75,
        dividendYield: 2.1,
        lucroProjetado: 4.8,
        patrimonioLiquido: 25.3,
        dividendoPorAcao: 0.92,
        roe: 19.0,
        payout: 30,
        cotacaoAtual: 43.80,
        dataAtualizacao: serverTimestamp()
      }
    ];
    
    // Adicionar cada ação à coleção stocksFundamentals
    for (const stock of stocks) {
      const stockRef = doc(db, 'stocksFundamentals', stock.ticker);
      await setDoc(stockRef, stock);
      console.log(`Dados fundamentais configurados para ${stock.ticker}`);
    }
    
    console.log('Configuração de dados fundamentais concluída com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao configurar dados fundamentais:', error);
    return false;
  }
};

// Função para testar escrita básica no Firestore
const testFirestoreWrite = async (userId) => {
  try {
    console.log('Iniciando teste de escrita no Firestore...');
    
    // Tentar criar um documento de teste na raiz
    const testCollection = collection(db, 'teste');
    const docRef = await addDoc(testCollection, {
      texto: 'Teste de escrita no Firestore',
      timestamp: serverTimestamp(),
      usuarioId: userId
    });
    
    console.log(`Documento de teste criado com ID: ${docRef.id}`);
    
    // Tentar criar um documento em uma subcoleção do usuário
    const userTestRef = doc(db, 'users', userId, 'teste', 'documento1');
    await setDoc(userTestRef, {
      texto: 'Teste de escrita em subcoleção',
      timestamp: serverTimestamp()
    });
    
    console.log('Documento de teste em subcoleção criado com sucesso');
    return true;
  } catch (error) {
    console.error('ERRO NO TESTE DE ESCRITA:', error);
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
};

// Componente principal
const SetupDatabase = () => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [setupSuccess, setSetupSuccess] = useState(false);
  const [userId, setUserId] = useState('');
  const [errorDetails, setErrorDetails] = useState(null);
  
  // Atualizar userId quando o usuário for carregado
  useEffect(() => {
    if (currentUser) {
      setUserId(currentUser.uid);
      addLog(`Usuário autenticado: ${currentUser.uid} (${currentUser.email})`);
    } else {
      addLog('Nenhum usuário autenticado. Por favor, faça login primeiro.');
    }
  }, [currentUser]);
  
  // Função para adicionar logs
  const addLog = (message) => {
    console.log(message); // Também mostrar no console para debug
    setLogs((prevLogs) => [...prevLogs, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Teste de escrita no Firestore
  const handleTestFirestoreWrite = async () => {
    if (!currentUser) {
      addLog('Erro: Usuário não está logado');
      return;
    }
    
    setIsLoading(true);
    addLog('Iniciando teste básico de escrita no Firestore...');
    
    try {
      const result = await testFirestoreWrite(currentUser.uid);
      
      if (result === true) {
        addLog('✅ Teste de escrita concluído com sucesso! O Firebase está funcionando corretamente.');
      } else {
        addLog(`❌ Falha no teste de escrita. Erro: ${result.code} - ${result.error}`);
        setErrorDetails(result);
      }
    } catch (error) {
      addLog(`❌ Erro durante o teste: ${error.message}`);
      setErrorDetails({
        message: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Configurar estrutura financeira
  const handleSetupFinancialStructure = async () => {
    if (!currentUser) {
      addLog('Erro: Usuário não está logado');
      return;
    }
    
    setIsLoading(true);
    addLog('Iniciando configuração da estrutura financeira...');
    
    try {
      // Configurar estrutura de dados financeiros
      const success = await setupUserFinancialData(currentUser.uid);
      
      if (success) {
        addLog('✅ Estrutura financeira configurada com sucesso');
      } else {
        addLog('❌ Falha ao configurar estrutura financeira');
      }
    } catch (error) {
      addLog(`❌ Erro ao configurar estrutura financeira: ${error.message}`);
      setErrorDetails({
        message: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Configurar ações fundamentais
  const handleSetupStocksFundamentals = async () => {
    setIsLoading(true);
    addLog('Iniciando configuração dos dados fundamentais de ações...');
    
    try {
      const success = await setupStocksFundamentals();
      
      if (success) {
        addLog('✅ Dados fundamentais de ações configurados com sucesso');
      } else {
        addLog('❌ Falha ao configurar dados fundamentais de ações');
      }
    } catch (error) {
      addLog(`❌ Erro ao configurar dados fundamentais: ${error.message}`);
      setErrorDetails({
        message: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Configurar ações na carteira do usuário
  const handleSetupUserPortfolio = async () => {
    if (!currentUser) {
      addLog('Erro: Usuário não está logado');
      return;
    }
    
    setIsLoading(true);
    addLog('Iniciando configuração da carteira de ações...');
    
    try {
      // Adicionar ações de exemplo
      const stocksPetr4 = await addStockToUserPortfolio(currentUser.uid, {
        ticker: 'PETR4',
        quantidade: 200,
        cotacao: 28.75
      });
      
      const stocksVale3 = await addStockToUserPortfolio(currentUser.uid, {
        ticker: 'VALE3',
        quantidade: 150,
        cotacao: 74.50
      });
      
      if (stocksPetr4 && stocksVale3) {
        addLog('✅ Carteira de ações configurada com sucesso');
      } else {
        addLog('❌ Falha ao configurar carteira de ações');
      }
    } catch (error) {
      addLog(`❌ Erro ao configurar carteira de ações: ${error.message}`);
      setErrorDetails({
        message: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Configuração completa
  const handleFullSetup = async () => {
    if (!currentUser) {
      addLog('Erro: Usuário não está logado');
      return;
    }
    
    setIsLoading(true);
    addLog('Iniciando configuração completa do banco de dados...');
    
    try {
      // 0. Testar escrita primeiro
      addLog('Etapa 0: Testando escrita no Firestore...');
      const testResult = await testFirestoreWrite(currentUser.uid);
      if (testResult !== true) {
        addLog(`❌ Teste de escrita falhou: ${testResult.error}`);
        setErrorDetails(testResult);
        setIsLoading(false);
        return;
      }
      addLog('✅ Teste de escrita bem-sucedido');
      
      // 1. Configurar dados fundamentais
      addLog('Etapa 1: Configurando dados fundamentais de ações...');
      await setupStocksFundamentals();
      addLog('✅ Dados fundamentais configurados com sucesso');
      
      // 2. Configurar estrutura financeira
      addLog('Etapa 2: Configurando estrutura financeira do usuário...');
      await setupUserFinancialData(currentUser.uid);
      addLog('✅ Estrutura financeira configurada com sucesso');
      
      // 3. Adicionar ações à carteira
      addLog('Etapa 3: Configurando carteira de ações do usuário...');
      await addStockToUserPortfolio(currentUser.uid, {
        ticker: 'PETR4',
        quantidade: 200,
        cotacao: 28.75
      });
      
      await addStockToUserPortfolio(currentUser.uid, {
        ticker: 'VALE3',
        quantidade: 150,
        cotacao: 74.50
      });
      
      addLog('✅ Carteira de ações configurada com sucesso');
      addLog('✅ Configuração completa finalizada com sucesso!');
      setSetupSuccess(true);
    } catch (error) {
      addLog(`❌ Erro durante a configuração completa: ${error.message}`);
      setErrorDetails({
        message: error.message,
        stack: error.stack
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="setup-database-container">
      <h1>Configuração do Banco de Dados</h1>
      
      <div className="setup-warning">
        <h2>Importante:</h2>
        <p>Esta página deve ser usada apenas uma vez para configurar o banco de dados. 
        Executar novamente pode duplicar dados.</p>
        <p>A configuração criará:</p>
        <ul>
          <li>Dados fundamentais para 5 ações</li>
          <li>Estrutura financeira para seu usuário</li>
          <li>2 ações (PETR4 e VALE3) na sua carteira pessoal</li>
        </ul>
      </div>
      
      {!currentUser && (
        <div className="error-message">
          <h3>Você não está autenticado!</h3>
          <p>É necessário fazer login antes de configurar o banco de dados.</p>
          <a href="/login" className="login-link">Ir para a página de login</a>
        </div>
      )}
      
      <div className="setup-options">
        <button 
          className="test-button"
          onClick={handleTestFirestoreWrite}
          disabled={isLoading || !currentUser}
        >
          {isLoading ? 'Testando...' : 'TESTE: Verificar Conexão com Firebase'}
        </button>
        
        <button 
          className="setup-button"
          onClick={handleFullSetup}
          disabled={isLoading || !currentUser || setupSuccess}
        >
          {isLoading ? 'Configurando...' : 'Configurar Banco de Dados'}
        </button>
        
        <div className="advanced-options">
          <h3>Opções Avançadas:</h3>
          <button 
            onClick={handleSetupStocksFundamentals}
            disabled={isLoading || !currentUser}
          >
            Configurar Apenas Dados Fundamentais
          </button>
          <button 
            onClick={handleSetupFinancialStructure}
            disabled={isLoading || !currentUser}
          >
            Configurar Apenas Estrutura Financeira
          </button>
          <button 
            onClick={handleSetupUserPortfolio}
            disabled={isLoading || !currentUser}
          >
            Configurar Apenas Carteira de Ações
          </button>
        </div>
      </div>
      
      {logs.length > 0 && (
        <div className="setup-logs">
          <h3>Logs:</h3>
          <div className="logs-container">
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {errorDetails && (
        <div className="error-details">
          <h3>Detalhes do Erro:</h3>
          <pre>{JSON.stringify(errorDetails, null, 2)}</pre>
          <div className="troubleshooting">
            <h4>Possíveis soluções:</h4>
            <ul>
              <li>Verifique se as regras do Firestore permitem escrita (pode ser necessário atualizar no Firebase Console)</li>
              <li>Confirme se você está conectado à internet</li>
              <li>Verifique se sua configuração do Firebase está correta em firebase/config.js</li>
              <li>Certifique-se de que sua conta tem permissões adequadas no projeto do Firebase</li>
            </ul>
          </div>
        </div>
      )}
      
      {setupSuccess && (
        <div className="setup-success">
          <h2>Configuração Concluída com Sucesso!</h2>
          <p>Você pode agora acessar o dashboard e visualizar sua carteira de ações.</p>
          <a href="/dashboard" className="dashboard-link">Ir para o Dashboard</a>
        </div>
      )}
    </div>
  );
};

export default SetupDatabase; 