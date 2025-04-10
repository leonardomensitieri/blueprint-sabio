import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { recordPayment } from '../../firebase/db';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { loadStripe } from '@stripe/stripe-js';
import { getAnalytics, logEvent } from 'firebase/analytics';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import './Payment.css';

// Stripe public key from environment variables
const stripePromise = loadStripe('pk_live_51R4sSxHKhPr7Dhx9zKF3jHbDdEXZQKIxwksls4o94UusAM2WpWJlGYyLdWnqoQg07M0DFtzqzJOUgnn6CZQCzN6R00zVKguf9l');

// Componente para processar o pagamento
const CheckoutForm = ({ selectedPlan, onSuccess, onError }) => {
  const [processing, setProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [cardHolderName, setCardHolderName] = useState('');
  
  const stripe = useStripe();
  const elements = useElements();
  const { currentUser } = useAuth();
  const functions = getFunctions();
  
  // Criar PaymentIntent quando o plano é selecionado
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (!selectedPlan) return;
      
      setProcessing(true);
      
      try {
        const createPaymentIntentFn = httpsCallable(functions, 'createPaymentIntent');
        const result = await createPaymentIntentFn({
          planId: selectedPlan.id,
          amount: selectedPlan.price
        });
        
        setClientSecret(result.data.clientSecret);
      } catch (error) {
        console.error('Erro ao criar PaymentIntent:', error);
        onError('Não foi possível iniciar o processamento do pagamento. Tente novamente mais tarde.');
      } finally {
        setProcessing(false);
      }
    };
    
    createPaymentIntent();
  }, [selectedPlan, functions, onError]);
  
  const handleCardChange = (event) => {
    setCardComplete(event.complete);
    setCardError(event.error ? event.error.message : '');
  };
  
  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !cardComplete || !clientSecret) {
      return;
    }
    
    setProcessing(true);
    
    try {
      // Confirmar o pagamento com o Stripe
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: cardHolderName
          }
        }
      });
      
      if (result.error) {
        setCardError(result.error.message);
        onError(result.error.message);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Registrar o pagamento no Firestore (para backup/redundância)
        await recordPayment(currentUser.uid, {
          planId: selectedPlan.id,
          planName: selectedPlan.name,
          amount: selectedPlan.price,
          status: 'succeeded',
          paymentMethod: 'card',
          createdAt: new Date()
        });
        
        // Registrar evento de compra no Analytics
        const analytics = getAnalytics();
        logEvent(analytics, 'subscription_purchased', { 
          subscription_type: selectedPlan.id,
          subscription_name: selectedPlan.name,
          currency: 'BRL',
          value: selectedPlan.price
        });
        
        onSuccess();
      }
    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      onError('Ocorreu um erro ao processar seu pagamento. Tente novamente mais tarde.');
    } finally {
      setProcessing(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="form-group">
        <label htmlFor="cardHolderName">Nome no Cartão</label>
        <input
          id="cardHolderName"
          type="text"
          required
          value={cardHolderName}
          onChange={(e) => setCardHolderName(e.target.value)}
          placeholder="NOME COMO APARECE NO CARTÃO"
          disabled={processing}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="card-element">Dados do Cartão</label>
        <div className="card-element-container">
          <CardElement
            id="card-element"
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#FFFFFF',
                  '::placeholder': {
                    color: '#AAAAAA',
                  },
                },
                invalid: {
                  color: '#F44336',
                },
              },
            }}
            onChange={handleCardChange}
          />
        </div>
        {cardError && <div className="card-error">{cardError}</div>}
      </div>
      
      <div className="payment-summary">
        <h3>Resumo do Pedido</h3>
        <div className="summary-row">
          <span>Plano</span>
          <span>{selectedPlan.name}</span>
        </div>
        <div className="summary-row">
          <span>Valor</span>
          <span>R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</span>
        </div>
        {selectedPlan.discount > 0 && (
          <div className="summary-row discount">
            <span>Economia</span>
            <span>{selectedPlan.discount}%</span>
          </div>
        )}
        <div className="summary-row total">
          <span>Total a Pagar</span>
          <span>R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</span>
        </div>
      </div>
      
      <button 
        type="submit" 
        className="payment-button"
        disabled={processing || !cardComplete || !stripe}
      >
        {processing ? 'Processando...' : `Pagar R$ ${selectedPlan.price.toFixed(2).replace('.', ',')}`}
      </button>
      
      <div className="payment-security">
        <p>
          <i className="security-icon">🔒</i>
          Pagamento seguro processado via Stripe. Seus dados estão protegidos.
        </p>
      </div>
    </form>
  );
};

const PaymentPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { currentUser, userData, checkUserSubscriptionStatus } = useAuth();
  const navigate = useNavigate();

  // Configurações de planos
  const plans = {
    monthly: {
      id: 'price_monthly',
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
      id: 'price_quarterly',
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
      id: 'price_yearly',
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

  // Selecionar plano e avançar para o checkout
  const handleSelectPlan = (planId) => {
    setSelectedPlan(plans[planId]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Manipulador de sucesso no pagamento
  const handlePaymentSuccess = async () => {
    try {
      // Verificar o status da assinatura
      await checkUserSubscriptionStatus(currentUser.uid);
      
      // Mostrar mensagem de sucesso e redirecionar para o dashboard
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Erro ao atualizar status da assinatura:', error);
      setError('O pagamento foi processado, mas houve um erro ao ativar sua assinatura. Contate o suporte.');
    }
  };

  // Manipulador de erro no pagamento
  const handlePaymentError = (errorMessage) => {
    setError(errorMessage || 'Ocorreu um erro ao processar o pagamento. Tente novamente.');
  };

  useEffect(() => {
    // Preencher o nome do titular do cartão se tivermos os dados do usuário
    if (userData && userData.name) {
      // O nome será usado no componente CheckoutForm
    }
  }, [userData]);

  if (success) {
    return (
      <div className="payment-success">
        <div className="success-icon">✓</div>
        <h2>Pagamento Realizado com Sucesso!</h2>
        <p>Sua assinatura está ativa. Redirecionando para o dashboard...</p>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Blueprint Sábio Premium</h1>
        <p>Escolha seu plano e desbloqueie todos os recursos</p>
      </div>
      
      {error && <div className="payment-error">{error}</div>}
      
      <div className="payment-content">
        {selectedPlan ? (
          <div className="checkout-container">
            <h2>Finalizar Assinatura</h2>
            <div className="selected-plan-summary">
              <h3>{selectedPlan.name}</h3>
              <p>R$ {selectedPlan.price.toFixed(2).replace('.', ',')} / {selectedPlan.interval}</p>
            </div>
            
            <Elements stripe={stripePromise}>
              <CheckoutForm 
                selectedPlan={selectedPlan} 
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </Elements>
            
            <button 
              className="back-to-plans-btn"
              onClick={() => setSelectedPlan(null)}
            >
              ← Voltar para seleção de planos
            </button>
          </div>
        ) : (
          <div className="plans-container">
            <h2>Selecione seu plano</h2>
            
            <div className="payment-options-toggle">
              <p>Escolha como deseja fazer o pagamento:</p>
              <div className="toggle-buttons">
                <button 
                  className="toggle-button active"
                  onClick={() => {}}
                >
                  Pagamento no site
                </button>
                <button 
                  className="toggle-button"
                  onClick={() => window.location.href = '/checkout'}
                >
                  Checkout com Stripe
                </button>
              </div>
              <p className="recommendation-note">Recomendamos o Checkout com Stripe para maior segurança e facilidade.</p>
            </div>
            
            <div className="plan-options">
              {Object.entries(plans).map(([planId, plan]) => (
                <div 
                  key={planId}
                  className="plan-card"
                  onClick={() => handleSelectPlan(planId)}
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
                    onClick={() => handleSelectPlan(planId)}
                  >
                    Selecionar Plano
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
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
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;