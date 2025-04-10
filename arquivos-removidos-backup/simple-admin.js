// Script simples para definir um usuário como administrador
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, doc, updateDoc, serverTimestamp } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');
const readline = require('readline');

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCpZ2Xi69iDNgv9G6lMqYHQSiGmu0E-9Ho",
  authDomain: "blueprint-sabio.firebaseapp.com", 
  projectId: "blueprint-sabio",
  storageBucket: "blueprint-sabio.firebasestorage.app",
  messagingSenderId: "948198115035",
  appId: "1:948198115035:web:dafc66782289433721eefe"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Interface para entrada do usuário
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Função para fazer login
async function loginUser(email, password) {
  try {
    console.log(`\nFazendo login como ${email}...`);
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    console.log(`✅ Login bem sucedido como ${userCredential.user.email}`);
    return userCredential.user;
  } catch (error) {
    console.error(`❌ Erro ao fazer login: ${error.message}`);
    process.exit(1);
  }
}

// Função para definir usuário como administrador
async function setUserAsAdmin(adminEmail) {
  try {
    console.log(`\n🔍 Buscando usuário com email: ${adminEmail}`);
    
    // Buscar usuário pelo email
    const q = query(collection(db, "users"), where("email", "==", adminEmail));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      console.log(`❌ Nenhum usuário encontrado com o email ${adminEmail}`);
      console.log('👉 Certifique-se de que este usuário já foi registrado no aplicativo.');
      return false;
    }
    
    // Deve haver apenas um usuário com este email
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    console.log(`✅ Usuário encontrado: ${userId}`);
    
    // Atualizar como administrador
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      role: "admin",
      hasActiveSubscription: true,
      updatedAt: serverTimestamp()
    });
    
    console.log(`✅ Usuário ${userId} (${adminEmail}) agora é um administrador com acesso permanente`);
    return true;
  } catch (error) {
    console.error(`❌ Erro ao definir administrador: ${error.message}`);
    return false;
  }
}

// Função principal
async function main() {
  console.log("==================================================");
  console.log("    BLUEPRINT SÁBIO - CONFIGURAÇÃO DE ADMIN");
  console.log("==================================================");
  console.log("\nEste script vai definir um usuário como administrador no Blueprint Sábio.");
  console.log("\nPrimeiro, você precisa fazer login com uma conta existente:");
  
  // Solicitar credenciais de login
  rl.question("\nEmail para login: ", (loginEmail) => {
    rl.question("Senha: ", async (password) => {
      try {
        // Fazer login
        await loginUser(loginEmail, password);
        
        // Email do admin a ser configurado
        const adminEmail = "leonardomensitierii@gmail.com";
        console.log(`\nVamos definir "${adminEmail}" como administrador.`);
        
        // Definir como administrador
        const success = await setUserAsAdmin(adminEmail);
        
        if (success) {
          console.log(`\n✨ ${adminEmail} agora é um administrador com acesso permanente no Blueprint Sábio.`);
        } else {
          console.log('\n❌ Não foi possível completar a operação.');
        }
      } catch (error) {
        console.error('\n❌ Erro fatal:', error);
      } finally {
        rl.close();
        // Dar tempo para completar operações pendentes
        setTimeout(() => process.exit(0), 2000);
      }
    });
  });
}

// Executar o script
main();