const admin = require('firebase-admin');
const serviceAccount = require('./service-account-key.json'); // Você precisa baixar este arquivo do Firebase Console

// Inicializar o app
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Função para criar dados de um usuário específico
async function setupUserStructure(userId) {
  console.log(`Configurando estrutura para usuário: ${userId}`);
  
  try {
    // 1. Obter/criar documento de usuário
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.log('Usuário não existe, criando...');
      await userRef.set({
        email: 'leonardomensitierii@gmail.com', // Substitua pelo email real
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log('Documento de usuário criado');
    } else {
      console.log('Usuário já existe, atualizando timestamp...');
      await userRef.update({
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    // 2. Configurar a estrutura financialData com subcoleção
    const financialDataRef = userRef.collection('financialData').doc('main');
    
    await financialDataRef.set({
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
      patrimonioTotal: 55000,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Estrutura financialData configurada com sucesso!');
    
    // 3. Adicionar algumas ações de exemplo
    const updatedFinancialData = await financialDataRef.get();
    const currentData = updatedFinancialData.data();
    
    // Adicionar PETR4
    const tickersPETR4 = {
      ...currentData.patrimonioAcoes.tickers,
      'PETR4': {
        quantidadeAcoes: 200,
        cotacao: 28.75,
        ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp()
      }
    };
    
    await financialDataRef.update({
      'patrimonioAcoes.tickers': tickersPETR4,
      'patrimonioAcoes.total': 200 * 28.75,
      'patrimonioTotal': 55000 + (200 * 28.75),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Ação PETR4 adicionada com sucesso!');
    
    // Adicionar VALE3
    const tickersVALE3 = {
      ...tickersPETR4,
      'VALE3': {
        quantidadeAcoes: 150,
        cotacao: 74.50,
        ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp()
      }
    };
    
    await financialDataRef.update({
      'patrimonioAcoes.tickers': tickersVALE3,
      'patrimonioAcoes.total': (200 * 28.75) + (150 * 74.50),
      'patrimonioTotal': 55000 + (200 * 28.75) + (150 * 74.50),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Ação VALE3 adicionada com sucesso!');
    
    // 4. Configurar dados fundamentais de ações
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
        dataAtualizacao: admin.firestore.FieldValue.serverTimestamp()
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
        dataAtualizacao: admin.firestore.FieldValue.serverTimestamp()
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
        dataAtualizacao: admin.firestore.FieldValue.serverTimestamp()
      }
    ];
    
    for (const stock of stocks) {
      await db.collection('stocksFundamentals').doc(stock.ticker).set(stock);
      console.log(`Dados fundamentais de ${stock.ticker} configurados com sucesso!`);
    }
    
    console.log('Configuração completa realizada com sucesso!');
    return true;
  } catch (error) {
    console.error('Erro durante a configuração:', error);
    return false;
  }
}

// ID do usuário que você quer configurar
const USER_ID = 'ut6lFkeqwqQnaO7Siybm5IBZ3Al1'; // Substitua pelo ID do seu usuário

// Executar a configuração
setupUserStructure(USER_ID)
  .then(success => {
    if (success) {
      console.log('Script executado com sucesso!');
    } else {
      console.log('Falha na execução do script');
    }
    // Encerrar o script após a conclusão
    process.exit();
  })
  .catch(error => {
    console.error('Erro na execução do script:', error);
    process.exit(1);
  });

/**
 * INSTRUÇÕES PARA USO:
 * 
 * 1. Você precisa baixar sua chave de conta de serviço do Firebase:
 *    - Acesse o Firebase Console: https://console.firebase.google.com/project/blueprint-sabio/settings/serviceaccounts/adminsdk
 *    - Clique em "Gerar nova chave privada"
 *    - Salve o arquivo JSON na mesma pasta deste script e renomeie para "service-account-key.json"
 * 
 * 2. Instale as dependências necessárias:
 *    $ npm install firebase-admin
 * 
 * 3. Execute o script:
 *    $ node admin-setup-firebase.js
 * 
 * O script vai configurar:
 * - O documento do usuário
 * - A subcoleção financialData com a estrutura solicitada
 * - Adicionar duas ações (PETR4 e VALE3) à carteira
 * - Configurar dados fundamentais de ações
 */ 