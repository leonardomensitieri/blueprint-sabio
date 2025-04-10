import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../components/auth/AuthProvider';
import '../styles/Auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const navigate = useNavigate();
  const { register, error: authError } = useAuth();

  // Formatador de telefone
  const formatPhone = (value) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Formata conforme a quantidade de números
    if (numbers.length <= 2) {
      return `(${numbers}`;
    } else if (numbers.length <= 6) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 6)}-${numbers.slice(6)}`;
    } else {
      return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    }
  };

  const handlePhoneChange = (e) => {
    const formattedPhone = formatPhone(e.target.value);
    setPhone(formattedPhone);
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return re.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações
    if (!email || !password || !confirmPassword || !name) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    if (!validateEmail(email)) {
      setError('Por favor, insira um email válido.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      console.log('[DEBUG] Tentando criar conta para:', email);
      
      // Registrar com AuthProvider
      await register(email, password, {
        name,
        phone: phone.replace(/\D/g, '') // Remove formatação
      });
      
      console.log('[DEBUG] Conta criada com sucesso, redirecionando...');
      setSuccess(true);
      
      // Redirecionar após um breve delay
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
      
    } catch (err) {
      console.error('[ERROR] Erro ao criar conta:', err);
      
      // Usar erro do AuthProvider ou criar mensagem personalizada
      setError(
        err.code === 'auth/email-already-in-use' || 
        err.message.includes('já está em uso') ||
        err.message.includes('already in use')
          ? 'Este email já está sendo usado por outra conta.'
          : err.code === 'auth/weak-password'
          ? 'A senha é muito fraca. Use pelo menos 6 caracteres.'
          : err.code === 'auth/invalid-email'
          ? 'O formato do email é inválido.'
          : authError || 'Falha ao criar conta. Por favor, tente novamente.'
      );
      
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Criar Conta</h2>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">Conta criada com sucesso! Redirecionando...</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nome Completo*</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email*</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              required
              disabled={loading || success}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="phone">Telefone</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(99) 99999-9999"
              disabled={loading || success}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha*</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading || success}
            />
            <small>Mínimo de 6 caracteres</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha*</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading || success}
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={loading || success}
          >
            {loading ? 'Criando Conta...' : success ? 'Conta Criada!' : 'Registrar'}
          </button>
        </form>
        
        <div className="auth-links">
          <p>Já tem uma conta? <Link to="/login">Faça login</Link></p>
        </div>
        
        {/* Informações de Debug */}
        <div className="debug-info" style={{ marginTop: '20px', fontSize: '12px', color: '#888' }}>
          <p>Versão: 1.0.2 (Debug ativado)</p>
          <p>Status: {loading ? 'Processando...' : success ? 'Sucesso!' : error ? 'Erro' : 'Pronto'}</p>
        </div>
      </div>
    </div>
  );
};

export default Register; 