import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import './Auth.css';
import authBgImage from '../../assets/images/auth-bg.jpg';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { register, login } = useAuth();
  const navigate = useNavigate();

  // Preencher com dados de teste em desenvolvimento
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      setName('Usuário Teste');
      setEmail('teste@exemplo.com');
      setPassword('senha123');
      setConfirmPassword('senha123');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação básica
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }
    
    try {
      setError('');
      setLoading(true);
      
      // Para fins de desenvolvimento, use email e senha fixos
      const testCredentials = {
        email: 'teste@exemplo.com',
        password: 'senha123',
        name: 'Usuário Teste'
      };
      
      // Em desenvolvimento, sempre usar credenciais de teste
      if (process.env.NODE_ENV === 'development') {
        console.log('Modo de desenvolvimento: usando credenciais de teste para registro');
        try {
          const user = await register(testCredentials.email, testCredentials.password, testCredentials.name);
          console.log("Usuário de teste registrado com sucesso:", user);
        } catch (registerError) {
          // Erro de usuário já existente é esperado
          if (registerError.code !== 'auth/email-already-in-use') {
            console.error("Erro no registro do usuário de teste:", registerError);
          } else {
            console.log("Usuário de teste já existe, continuando com login");
          }
        }
        
        // Tentar login com usuário de teste
        try {
          await login(testCredentials.email, testCredentials.password);
          console.log("Login com usuário de teste realizado com sucesso");
        } catch (loginError) {
          console.error("Erro no login do usuário de teste:", loginError);
          throw loginError;
        }
      } else {
        // Em produção, usar credenciais fornecidas
        const user = await register(email, password, name);
        console.log("Usuário registrado com sucesso:", user);
      }
      
      // Redirecionar para dashboard
      navigate('/dashboard');
    } catch (error) {
      console.error("Erro final no processo de registro:", error);
      
      // Mensagens de erro personalizadas
      if (error.code === 'auth/email-already-in-use') {
        setError('Este email já está sendo usado por outra conta.');
      } else if (error.code === 'auth/weak-password') {
        setError('A senha é muito fraca. Use pelo menos 6 caracteres.');
      } else if (error.code === 'auth/invalid-email') {
        setError('O formato do email é inválido.');
      } else {
        setError('Erro ao criar conta. Por favor, tente novamente.');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>Cadastre-se</h2>
          <p>Crie sua conta no Blueprint Sábio</p>
        </div>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Nome Completo</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              required
              minLength={6}
            />
            <small>A senha deve ter pelo menos 6 caracteres</small>
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={loading}
          >
            {loading ? 'Processando...' : 'Criar Conta'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Já tem uma conta? <Link to="/login">Faça login</Link></p>
          
          {process.env.NODE_ENV === 'development' && (
            <div className="debug-info" style={{ marginTop: '15px', fontSize: '12px', color: '#888', textAlign: 'center' }}>
              <p>Modo de desenvolvimento ativo</p>
              <p>Credenciais pré-preenchidas para testes</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="auth-branding" style={{ backgroundImage: `url(${authBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
        <h3>Blueprint Sábio</h3>
        <p>A Planilha dos Bilionários</p>
        <div className="auth-features">
          <h4>Com sua assinatura você terá acesso a:</h4>
          <ul>
            <li>Análises detalhadas de 80+ ações brasileiras</li>
            <li>Recomendações atualizadas diariamente</li>
            <li>Checklist exclusivo do Método Sábio de Investir</li>
            <li>Simulador de carteira de dividendos</li>
            <li>Acesso ilimitado à nossa plataforma</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Register;