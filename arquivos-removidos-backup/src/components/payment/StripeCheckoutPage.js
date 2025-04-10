import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getAnalytics, logEvent } from 'firebase/analytics';
import { loadStripe } from '@stripe/stripe-js';
import './Payment.css';

// Stripe public key - mesma utilizada no PaymentPage.js
const stripePromise = loadStripe('pk_live_51R4sSxHKhPr7Dhx9zKF3jHbDdEXZQKIxwksls4o94UusAM2WpWJlGYyLdWnqoQg07M0DFtzqzJOUgnn6CZQCzN6R00zVKguf9l');

const StripeCheckoutPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const functions = getFunctions();

  // Configurações de planos
  const plans = {
    monthly: {
      id: 'monthly',
      name: 'Plano Mensal',
      price: 39.90,
      interval: 'mês',
      discount: 0,
      features: [
        'Acesso a todas as análises de ações',
        'Recomendações atualizadas diariamente',
        'Checklist exclusivo do Método Sábio de Investir',
        'Suporte por email'
      ]
    },
    quarterly: {
      id: 'quarterly',
      name: 'Plano Trimestral',
      price: 109.70,
      originalPrice: 119.70,
      interval: 'trimestre',
      discount: 8,
      features: [
        'Todos os benefícios do plano mensal',
        'Economia de 8%',
        'Webinars exclusivos sobre estratégias de investimento',
        'Suporte prioritário'
      ]
    },
    yearly: {
      id: 'yearly',
      name: 'Plano Anual',
      price: 359.00,
      originalPrice: 478.80,
      interval: 'ano',
      discount: 25,
      features: [
        'Todos os benefícios do plano trimestral',
        'Economia de 25%',
        'Acesso a relatórios especiais',
        'Consulta individual com especialista',
        'Suporte VIP por WhatsApp'
      ]
    }
  };

  // Redirecionar para o Checkout do Stripe
  const handleCheckout = async (planId) => {
    const plan = plans[planId];
    
    if (!plan) {
      setError('Plano inválido selecionado');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Registrar evento no Analytics
      const analytics = getAnalytics();
      logEvent(analytics, 'begin_checkout', {
        currency: 'BRL',
        value: plan.price,
        items: [{
          item_id: plan.id,
          item_name: plan.name,
          price: plan.price
        }]
      });
      
      // Chamar função do Firebase para criar sessão do Stripe
      const createCheckoutSessionFn = httpsCallable(functions, 'createCheckoutSession');
      const result = await createCheckoutSessionFn({
        planId: plan.id,
        amount: plan.price
      });
      
      // Redirecionar para o Checkout usando o Stripe.js
      if (result.data && result.data.sessionId) {
        const stripe = await stripePromise;
        const { error } = await stripe.redirectToCheckout({
          sessionId: result.data.sessionId
        });
        
        if (error) {
          console.error('Erro ao redirecionar para o Checkout:', error);
          setError(error.message);
        }
      } else if (result.data && result.data.url) {
        // Fallback: usar a URL retornada diretamente
        window.location.href = result.data.url;
      } else {
        setError('Não foi possível criar a sessão de checkout');
      }
    } catch (error) {
      console.error('Erro ao criar sessão de checkout:', error);
      setError('Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Blueprint Sábio Premium</h1>
        <p>Escolha seu plano e desbloqueie todos os recursos</p>
      </div>
      
      {error && <div className="payment-error">{error}</div>}
      
      <div className="plans-container">
        <h2>Selecione seu plano</h2>
        
        <div className="plan-options">
          {Object.entries(plans).map(([planId, plan]) => (
            <div 
              key={planId}
              className="plan-card"
            >
              <div className="plan-header">
                <h3>{plan.name}</h3>
                {plan.discount > 0 && (
                  <span className="discount-badge">-{plan.discount}%</span>
                )}
              </div>
              
              <div className="plan-price">
                <span className="currency">R$</span>
                <span className="amount">{plan.price.toFixed(2).replace('.', ',')}</span>
                <span className="interval">/{plan.interval}</span>
              </div>
              
              {plan.originalPrice && (
                <div className="original-price">
                  <span>De R$ {plan.originalPrice.toFixed(2).replace('.', ',')}</span>
                </div>
              )}
              
              <ul className="plan-features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>{feature}</li>
                ))}
              </ul>
              
              <button 
                className="select-plan-btn"
                onClick={() => handleCheckout(planId)}
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Assinar Agora'}
              </button>
            </div>
          ))}
        </div>
      </div>
      
      <div className="payment-footer">
        <div className="guarantee">
          <h3>Garantia de 7 dias</h3>
          <p>Se não estiver satisfeito, devolvemos seu dinheiro sem perguntas.</p>
        </div>
        
        <div className="testimonials">
          <h3>O que dizem nossos assinantes</h3>
          <div className="testimonial">
            <p>"O Blueprint Sábio transformou minha maneira de investir em dividendos. Recomendo!"</p>
            <span>— Maria S., assinante há 8 meses</span>
          </div>
        </div>
        
        <div className="faq">
          <h3>Perguntas Frequentes</h3>
          <div className="faq-item">
            <h4>Posso cancelar quando quiser?</h4>
            <p>Sim, você pode cancelar sua assinatura a qualquer momento, sem taxas adicionais.</p>
          </div>
          <div className="faq-item">
            <h4>Como funciona a cobrança?</h4>
            <p>Sua assinatura será renovada automaticamente ao final do período, mas você receberá um aviso por email antes.</p>
          </div>
          <div className="faq-item">
            <h4>É seguro fornecer meus dados de cartão?</h4>
            <p>Sim! Usamos o Stripe, uma das plataformas de pagamento mais seguras do mundo. Seus dados de cartão nunca são armazenados em nossos servidores.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StripeCheckoutPage;