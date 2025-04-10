import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userProfile, setUserProfile] = useState(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [isInTrialPeriod, setIsInTrialPeriod] = useState(true);

  // LOGIN SIMPLIFICADO
  const login = async (email, password) => {
    try {
      setError('');
      console.log("Tentando fazer login com:", email);
      
      // Sempre tenta o login com Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login bem-sucedido!", userCredential.user);
      
      // Configura perfil (sempre sucesso para facilitar o uso)
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        email: userCredential.user.email,
        role: 'admin',
        hasActiveSubscription: true,
        updatedAt: serverTimestamp()
      }, { merge: true });
      
      return userCredential.user;
    } catch (error) {
      // Se falhar login, tenta criar uma conta
      console.error("Erro no login:", error);
      
      try {
        console.log("Tentando criar uma conta com:", email);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        console.log("Conta criada com sucesso!");
        
        // Configura perfil de admin para o novo usuário
        const userRef = doc(db, 'users', userCredential.user.uid);
        await setDoc(userRef, {
          email: userCredential.user.email,
          name: "Usuário Teste",
          role: 'admin',
          hasActiveSubscription: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return userCredential.user;
      } catch (createError) {
        console.error("Erro ao criar usuário:", createError);
        throw createError;
      }
    }
  };

  // Função de registro simplificada
  const register = async (email, password, userData = {}) => {
    try {
      setError('');
      console.log("Criando nova conta para:", email);
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("Usuário registrado com sucesso:", userCredential.user);
      
      // Criar documento do usuário
      const userRef = doc(db, 'users', userCredential.user.uid);
      await setDoc(userRef, {
        email: userCredential.user.email,
        name: userData.name || "Usuário Teste",
        role: 'admin', // Sempre admin para facilitar testes
        hasActiveSubscription: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return userCredential.user;
    } catch (error) {
      console.error("Erro no registro:", error);
      setError('Erro ao criar conta. Por favor, tente novamente.');
      throw error;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserProfile(null);
      setIsAdminUser(false);
      setHasActiveSubscription(false);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
      setError("Falha ao fazer logout.");
    }
  };

  // Observer de autenticação - versão simplificada que sempre dá todos os acessos
  useEffect(() => {
    console.log("Inicializando observer de autenticação");
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("Estado de autenticação alterado:", user?.email);
      
      if (user) {
        // Configurar usuário como admin com acesso total
        setCurrentUser(user);
        setIsAdminUser(true);
        setHasActiveSubscription(true);
        setIsInTrialPeriod(false);
        setUserProfile({
          email: user.email,
          name: user.displayName || "Usuário",
          role: "admin"
        });
      } else {
        // Limpar estados
        setCurrentUser(null);
        setUserProfile(null);
        setIsAdminUser(false);
        setHasActiveSubscription(false);
        setIsInTrialPeriod(false);
      }
      
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    login,
    register,
    logout,
    isAdminUser,
    hasActiveSubscription,
    isInTrialPeriod
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;