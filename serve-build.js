const express = require('express');
const path = require('path');
const app = express();

// Servir arquivos estáticos da pasta build
app.use(express.static(path.join(__dirname, 'build')));

// Responder para qualquer rota com o arquivo index.html
app.get('*', function(req, res) {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Acesse: http://localhost:${PORT}`);
  console.log('Servindo a versão de build que funcionava anteriormente');
  console.log('Pressione Ctrl+C para parar o servidor');
});