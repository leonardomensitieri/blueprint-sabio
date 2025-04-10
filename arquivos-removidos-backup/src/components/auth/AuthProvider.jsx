import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

const AuthContext = createContext();

// Função para inicializar estrutura de dados do usuário - versão extremamente simples
async function initializeUserData(userId, userData = {}) {
  try {
    // Verificar se o documento do usuário já existe
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    // Se não existir, criar o documento do usuário
    if (!userDoc.exists()) {
      await setDoc(userRef, {
        email: userData.email || '',
        hasActiveSubscription: true, // Acesso garantido para todos
        role: 'admin', // Todos são admin para testes
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar dados do usuário:', error);
    return false;
  }
}

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Login com email e senha - versão mais simples possível
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
  
  // Registro com email e senha - versão minimalista
  const register = async (email, password, userData = {}) => {
    try {
      setError(null);
      const auth = getAuth();
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Inicializar dados do usuário
      await initializeUserData(result.user.uid, { 
        email: result.user.email,
        ...userData 
      });
      
      return result.user;
    } catch (err) {
      console.error('Erro no registro:', err);
      setError('Falha ao criar conta. Por favor, tente novamente.');
      throw err;
    }
  };
  
  // Logout simplificado
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
  
  // Monitorar estado de autenticação - forma mais simples
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Valores do contexto
  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    isAdminUser: true, // Sempre admin para testes
    hasActiveSubscription: true, // Sempre assinante para testes
    isInTrialPeriod: false
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);