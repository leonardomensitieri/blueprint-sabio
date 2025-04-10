import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthProvider';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from 'firebase/auth';

// Mock das funções do Firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null); // inicialmente não autenticado
    return jest.fn(); // função de unsubscribe
  }),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  signOut: jest.fn()
}));

jest.mock('../../firebase/db', () => ({
  saveUser: jest.fn(),
  getUser: jest.fn(),
  checkActiveSubscription: jest.fn(),
  checkActiveTrial: jest.fn()
}));

// Componente de teste para acessar o contexto de autenticação
const TestComponent = () => {
  const { 
    currentUser, 
    loading, 
    error, 
    hasActiveSubscription, 
    isInTrialPeriod,
    login,
    register,
    logout,
    resetPassword
  } = useAuth();

  return (
    <div>
      <div data-testid="loading">{loading ? 'Loading' : 'Not Loading'}</div>
      <div data-testid="error">{error || 'No Error'}</div>
      <div data-testid="auth-status">
        {currentUser ? 'Authenticated' : 'Not Authenticated'}
      </div>
      <div data-testid="subscription-status">
        {hasActiveSubscription ? 'Subscribed' : 'Not Subscribed'}
      </div>
      <div data-testid="trial-status">
        {isInTrialPeriod ? 'In Trial' : 'Not In Trial'}
      </div>
      <button 
        data-testid="login-button" 
        onClick={() => login('test@example.com', 'password')}
      >
        Login
      </button>
      <button 
        data-testid="register-button" 
        onClick={() => register('test@example.com', 'password', 'Test User')}
      >
        Register
      </button>
      <button 
        data-testid="logout-button" 
        onClick={() => logout()}
      >
        Logout
      </button>
      <button 
        data-testid="reset-button" 
        onClick={() => resetPassword('test@example.com')}
      >
        Reset Password
      </button>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('provides authentication context', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Verificar estado inicial
    expect(screen.getByTestId('loading')).toHaveTextContent('Not Loading');
    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('subscription-status')).toHaveTextContent('Not Subscribed');
    expect(screen.getByTestId('trial-status')).toHaveTextContent('Not In Trial');
  });

  it('handles login correctly', async () => {
    // Configurar o mock para retornar um usuário após login
    signInWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Executar login
    fireEvent.click(screen.getByTestId('login-button'));

    // Verificar que signInWithEmailAndPassword foi chamado com os parâmetros corretos
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(), 
      'test@example.com', 
      'password'
    );
  });

  it('handles registration correctly', async () => {
    // Configurar o mock para retornar um usuário após registro
    createUserWithEmailAndPassword.mockResolvedValueOnce({
      user: { uid: 'test-uid', email: 'test@example.com' }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Executar registro
    fireEvent.click(screen.getByTestId('register-button'));

    // Verificar que createUserWithEmailAndPassword foi chamado com os parâmetros corretos
    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(), 
      'test@example.com', 
      'password'
    );
  });

  it('handles password reset correctly', async () => {
    // Configurar o mock para retornar sucesso
    sendPasswordResetEmail.mockResolvedValueOnce();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Executar reset de senha
    fireEvent.click(screen.getByTestId('reset-button'));

    // Verificar que sendPasswordResetEmail foi chamado com os parâmetros corretos
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.anything(), 
      'test@example.com'
    );
  });

  it('handles logout correctly', async () => {
    // Configurar o mock para retornar sucesso
    signOut.mockResolvedValueOnce();

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Executar logout
    fireEvent.click(screen.getByTestId('logout-button'));

    // Verificar que signOut foi chamado
    expect(signOut).toHaveBeenCalled();
  });
});