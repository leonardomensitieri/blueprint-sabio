const { onCall, onRequest } = require("firebase-functions/v2/https");
const { defineString } = require("firebase-functions/params");
const admin = require("firebase-admin");

// Definindo parâmetros de configuração
const stripeSecret = defineString("STRIPE_SECRET");
const stripeWebhookSecret = defineString("STRIPE_WEBHOOK_SECRET");

admin.initializeApp();
const db = admin.firestore();

// Inicializando Stripe com a chave secreta
const stripe = require("stripe")(stripeSecret.value());

// Função para criar um PaymentIntent (Stripe)
exports.createPaymentIntent = onCall({
  memory: "256MiB",
  region: "us-central1",
}, async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new Error("Requer autenticação");
  }
  
  try {
    // Obter informações do plano selecionado
    const { planId, amount } = request.data;
    
    if (!planId || !amount) {
      throw new Error("Dados incompletos: planId e amount são obrigatórios");
    }
    
    // Criar PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertendo para centavos
      currency: "brl",
      metadata: { 
        userId: request.auth.uid,
        planId: planId
      }
    });
    
    return { 
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id 
    };
  } catch (error) {
    console.error("Erro ao criar PaymentIntent:", error);
    throw new Error(`Erro ao processar pagamento: ${error.message}`);
  }
});

// Função para criar uma sessão de checkout do Stripe (alternativa mais fácil)
exports.createCheckoutSession = onCall({
  memory: "256MiB",
  region: "us-central1",
}, async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new Error("Requer autenticação");
  }
  
  try {
    // Obter informações do plano selecionado
    const { planId, amount } = request.data;
    
    if (!planId || !amount) {
      throw new Error("Dados incompletos: planId e amount são obrigatórios");
    }
    
    // URL de sucesso e cancelamento
    const successUrl = `${request.rawRequest.headers.origin}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${request.rawRequest.headers.origin}/payment?canceled=true`;
    
    // Criar Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: `Blueprint Sábio - Plano ${planId}`,
              description: 'Assinatura do Blueprint Sábio',
            },
            unit_amount: Math.round(amount * 100), // Convertendo para centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment', // ou 'subscription' para assinaturas recorrentes
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: request.auth.uid,
        planId: planId
      },
      client_reference_id: request.auth.uid,
    });
    
    return { 
      sessionId: session.id,
      url: session.url
    };
  } catch (error) {
    console.error("Erro ao criar sessão de checkout:", error);
    throw new Error(`Erro ao criar checkout: ${error.message}`);
  }
});

// Webhook para processar eventos do Stripe
exports.stripeWebhook = onRequest({
  memory: "256MiB",
  region: "us-central1",
}, async (req, res) => {
  const signature = req.headers["stripe-signature"];
  
  if (!signature) {
    console.error("Assinatura do webhook não encontrada");
    return res.status(400).send("Assinatura do webhook não fornecida");
  }
  
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      stripeWebhookSecret.value()
    );
  } catch (error) {
    console.error("Erro na assinatura do webhook:", error);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }
  
  // Processar eventos específicos
  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const { userId, planId } = paymentIntent.metadata;
      
      if (!userId || !planId) {
        console.error("Metadados incompletos no PaymentIntent");
        return res.status(400).send("Metadados incompletos");
      }
      
      try {
        // Atualizar status do pagamento
        await db.collection("users").doc(userId).collection("payments").add({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100, // Convertendo de centavos para reais
          status: "succeeded",
          planId: planId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Calcular data de expiração da assinatura com base no plano
        let expiresAt = new Date();
        if (planId.includes("monthly")) {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else if (planId.includes("quarterly")) {
          expiresAt.setMonth(expiresAt.getMonth() + 3);
        } else if (planId.includes("yearly")) {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }
        
        // Criar ou atualizar assinatura
        const subscriptionRef = await db.collection("subscriptions").add({
          userId: userId,
          planId: planId,
          status: "active",
          currentPeriodStart: admin.firestore.FieldValue.serverTimestamp(),
          currentPeriodEnd: admin.firestore.Timestamp.fromDate(expiresAt),
          expiresAt: admin.firestore.Timestamp.fromDate(expiresAt),
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // Atualizar referência da assinatura no documento do usuário
        await db.collection("users").doc(userId).update({
          subscriptionId: subscriptionRef.id,
          hasActiveSubscription: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Assinatura ativada para usuário ${userId}`);
      } catch (error) {
        console.error("Erro ao processar pagamento bem-sucedido:", error);
        return res.status(500).send("Erro ao processar pagamento");
      }
      break;
    }
    
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      const { userId } = paymentIntent.metadata;
      
      if (!userId) {
        console.error("userId não encontrado nos metadados");
        return res.status(400).send("Metadados incompletos");
      }
      
      try {
        // Registrar falha no pagamento
        await db.collection("users").doc(userId).collection("payments").add({
          paymentIntentId: paymentIntent.id,
          amount: paymentIntent.amount / 100,
          status: "failed",
          errorMessage: paymentIntent.last_payment_error?.message || "Falha no pagamento",
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Falha no pagamento para usuário ${userId}`);
      } catch (error) {
        console.error("Erro ao registrar falha no pagamento:", error);
        return res.status(500).send("Erro ao processar falha no pagamento");
      }
      break;
    }
    
    default:
      console.log(`Evento não tratado: ${event.type}`);
  }
  
  // Retornar sucesso
  res.status(200).send({ received: true });
});

// Endpoint para cancelamento de assinatura
exports.cancelSubscription = onCall({
  memory: "256MiB",
  region: "us-central1",
}, async (request) => {
  // Verificar autenticação
  if (!request.auth) {
    throw new Error("Requer autenticação");
  }
  
  const userId = request.auth.uid;
  
  try {
    // Buscar documento do usuário
    const userDoc = await db.collection("users").doc(userId).get();
    
    if (!userDoc.exists) {
      throw new Error("Usuário não encontrado");
    }
    
    const userData = userDoc.data();
    
    // Verificar se o usuário tem uma assinatura ativa
    if (!userData.subscriptionId) {
      throw new Error("Nenhuma assinatura ativa encontrada");
    }
    
    // Buscar documento da assinatura
    const subscriptionDoc = await db.collection("subscriptions").doc(userData.subscriptionId).get();
    
    if (!subscriptionDoc.exists) {
      throw new Error("Assinatura não encontrada");
    }
    
    // Atualizar status da assinatura
    await subscriptionDoc.ref.update({
      status: "canceled",
      canceledAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Atualizar documento do usuário
    await userDoc.ref.update({
      hasActiveSubscription: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    return { success: true, message: "Assinatura cancelada com sucesso" };
  } catch (error) {
    console.error("Erro ao cancelar assinatura:", error);
    throw new Error(`Erro ao processar solicitação: ${error.message}`);
  }
});

// Função para definir um usuário como administrador
exports.setAdminUser = onCall({
  memory: "256MiB",
  region: "us-central1",
}, async (request) => {
  // Verificar se o usuário que está realizando a operação tem autorização
  // Nesse caso, estamos permitindo a operação sem autenticação para facilitar
  // a configuração inicial do administrador
  
  try {
    const { email } = request.data;
    
    if (!email) {
      throw new Error("Email não fornecido");
    }
    
    // Buscar usuário pelo email
    const usersSnapshot = await db.collection("users")
      .where("email", "==", email)
      .get();
    
    if (usersSnapshot.empty) {
      throw new Error(`Nenhum usuário encontrado com o email ${email}`);
    }
    
    // Deve haver apenas um usuário com este email
    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    
    // Atualizar o documento do usuário como administrador
    await db.collection("users").doc(userId).update({
      role: "admin",
      hasActiveSubscription: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Usuário ${userId} (${email}) agora é um administrador com acesso permanente`);
    
    return { 
      success: true, 
      message: `Usuário ${email} agora é um administrador com acesso permanente`,
      userId: userId
    };
  } catch (error) {
    console.error("Erro ao definir administrador:", error);
    throw new Error(`Erro ao processar solicitação: ${error.message}`);
  }
});