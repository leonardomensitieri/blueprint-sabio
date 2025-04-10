import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const AuthContext = createContext();

// Função para inicializar estrutura de dados do usuário
async function initializeUserData(userId, userData = {}) {
  try {
    // Verificar se o documento do usuário já existe
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    // Se não existir, criar o documento do usuário
    if (!userDoc.exists()) {
      console.log(`Inicializando dados para novo usuário: ${userId}`);
      const now = serverTimestamp();
      
      // Documento principal do usuário com nova estrutura
      const userDocData = {
        name: userData.name || '',
        email: userData.email || '',
        phone: '',
        lives_abroad: false,
        how_found: '',
        age: 0,
        created_at: now,
        occupation: '',
        income: 0,
        patrimony: 0,
        message: '',
        life_insurance: false,
        patrimony_priority: '',
        income_priority: '',
        email_sent: false,
        hasActiveSubscription: false, // Inicia como false - sem assinatura ativa
        role: 'user', // Inicia como usuário comum
        updatedAt: now
      };
      
      await setDoc(userRef, userDocData);
      
      // Documento de dados financeiros com valores padrão
      const financialDataDoc = {
        updatedAt: now,
        poderDeAporte: 0,
        custoDeVidaMensal: 0,
        patrimonioAcoes: {
          total: 0,
          tickers: {}
        },
        patrimonioRendaFixa: {
          total: 0,
          tempoInvestido: ''
        },
        patrimonioReservaDeEmergencia: {
          total: 0
        }
      };
      
      // Criar documento de dados financeiros
      const financialDataRef = doc(db, 'users', userId, 'financialData', 'main');
      await setDoc(financialDataRef, financialDataDoc);
      
      console.log(`Dados do usuário ${userId} inicializados com sucesso`);
      return true;
    } else {
      console.log(`Usuário ${userId} já existe, não é necessário inicializar`);
      return true;
    }
  } catch (error) {
    console.error('Erro ao inicializar dados do usuário:', error);
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Monitorar alterações no estado de autenticação
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          // Buscar perfil do usuário no Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));

          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
            
            // Verificar status da assinatura usando a Cloud Function
            try {
              // Importar funções apenas quando necessário para evitar erros
              const { getFunctions, httpsCallable } = await import('firebase/functions');
              const functions = getFunctions();
              const checkSubscription = httpsCallable(functions, 'checkSubscriptionStatus');
              
              // Chamar a função para verificar status
              const result = await checkSubscription();
              const subscriptionData = result.data;
              
              // Se houver diferença entre o status atual e o armazenado, atualizar
              if (subscriptionData.hasActiveSubscription !== userDoc.data().hasActiveSubscription) {
                // Atualizar o perfil localmente
                setUserProfile(prev => ({
                  ...prev,
                  hasActiveSubscription: subscriptionData.hasActiveSubscription
                }));
                
                // Atualizar no Firestore
                await updateDoc(doc(db, 'users', user.uid), {
                  hasActiveSubscription: subscriptionData.hasActiveSubscription,
                  updatedAt: serverTimestamp()
                });
              }
            } catch (subscriptionError) {
              console.error('Erro ao verificar status da assinatura:', subscriptionError);
              // Continuar mesmo com erro na verificação
            }
          }
          
          // Atualizar o timestamp de último acesso
          await updateDoc(doc(db, 'users', user.uid), {
            updatedAt: serverTimestamp()
          });
        } else {
          // Limpar dados do usuário quando deslogar
          setUserProfile(null);
        }
        
        setCurrentUser(user);
      } catch (err) {
        console.error('Erro ao carregar perfil do usuário:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);
  
  // Login com email e senha
  const login = async (email, password) => {
    try {
      setError(null);
      const auth = getAuth();
      let user;
      
      try {
        // Tenta login normal
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      } catch (loginError) {
        // Se for o usuário de teste e não existe, vamos criar
        if (email === 'teste@exemplo.com' && loginError.code === 'auth/user-not-found') {
          const newResult = await createUserWithEmailAndPassword(auth, email, password);
          user = newResult.user;
        } else {
          throw loginError;
        }
      }
      
      // Garantir que o usuário tem dados básicos
      await initializeUserData(user.uid, { email: user.email });
      
      return user;
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Falha no login. Tente com teste@exemplo.com / senha123');
      throw err;
    }
  };
  
  // Registro com email e senha
  const register = async (email, password, userData = {}) => {
    try {
      setError(null);
      const auth = getAuth();
      
      // Verificar primeiro se o email já está registrado
      try {
        // Tentamos verificar métodos de login disponíveis para este email
        const methods = await fetchSignInMethodsForEmail(auth, email);
        
        // Se existirem métodos, significa que o email já está registrado
        if (methods && methods.length > 0) {
          setError('Este e-mail já está registrado. Tente fazer login ou use outro e-mail.');
          throw new Error('Email já registrado');
        }
      } catch (checkError) {
        // Se for um erro específico de "email não encontrado", podemos prosseguir
        // Caso contrário, temos um erro diferente
        if (checkError.code !== 'auth/user-not-found') {
          console.error('Erro ao verificar e-mail:', checkError);
          // Se não for o erro de usuário não encontrado (o que seria normal),
          // vamos prosseguir com o registro mesmo assim
        }
      }
      
      // Criar conta de usuário
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Inicializar dados do usuário
      const initSuccess = await initializeUserData(result.user.uid, { 
        email: result.user.email,
        ...userData 
      });
      
      if (!initSuccess) {
        console.warn('Usuário criado, mas houve falha ao inicializar os dados.');
      }
      
      return result.user;
    } catch (err) {
      console.error('Erro no registro:', err);
      
      // Mensagens de erro mais descritivas baseadas no código de erro
      if (err.code === 'auth/email-already-in-use') {
        // Tentar fazer login com esses dados e criar o documento do usuário se não existir
        try {
          const auth = getAuth();
          const result = await signInWithEmailAndPassword(auth, email, password);
          
          // O usuário existe na autenticação, mas vamos verificar se tem dados no Firestore
          const userRef = doc(db, 'users', result.user.uid);
          const userDoc = await getDoc(userRef);
          
          if (!userDoc.exists()) {
            // Usuário existe na autenticação, mas não no Firestore
            console.log('Usuário existe na autenticação, mas não no Firestore. Criando dados...');
            
            // Inicializar dados do usuário
            await initializeUserData(result.user.uid, { 
              email: result.user.email,
              ...userData 
            });
            
            // Defina uma mensagem de sucesso
            setError(null);
            return result.user;
          } else {
            // Usuário já existe completamente
            setError('Este e-mail já está registrado. Tente fazer login.');
          }
        } catch (loginErr) {
          // Não conseguiu fazer login, provavelmente senha incorreta
          setError('Este e-mail já está registrado, mas a senha fornecida está incorreta.');
        }
      } else if (err.code === 'auth/invalid-email') {
        setError('E-mail inválido. Verifique e tente novamente.');
      } else if (err.code === 'auth/weak-password') {
        setError('Senha muito fraca. Use uma senha mais forte.');
      } else if (err.message === 'Email já registrado') {
        // Já definimos a mensagem de erro acima
      } else {
        setError('Falha ao criar conta. Por favor, tente novamente mais tarde.');
      }
      
      throw err;
    }
  };
  
  // Logout
  const logout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (err) {
      console.error('Erro no logout:', err);
      setError('Falha ao fazer logout.');
      throw err;
    }
  };
  
  // Reset de senha
  const resetPassword = async (email) => {
    try {
      const auth = getAuth();
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      console.error('Erro ao enviar email de reset de senha:', err);
      setError('Falha ao enviar email de recuperação.');
      throw err;
    }
  };

  // Função para atualizar perfil do usuário
  const updateProfile = async (data) => {
    if (!currentUser) throw new Error('Nenhum usuário logado');
    
    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        ...data,
        updatedAt: serverTimestamp()
      });
      
      // Atualizar estado local
      setUserProfile(prevProfile => ({
        ...prevProfile,
        ...data
      }));
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  };
  
  // Valores do contexto
  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    resetPassword,
    updateProfile,
    isAdmin: userProfile?.role === 'admin',
    // Se o usuário é admin ou tem assinatura ativa, ele tem acesso
    hasActiveSubscription: userProfile?.role === 'admin' || userProfile?.hasActiveSubscription === true,
    isInTrialPeriod: false
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);