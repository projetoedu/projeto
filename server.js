const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static('public')); // Serve os arquivos estáticos da pasta public

// Simulação de Banco de Dados (Estoque)
let produtos = [
    { id: 1, nome: 'Camiseta Unifeob', preco: 49.90, estoque: 10 },
    { id: 2, nome: 'Caneca do Dev', preco: 25.00, estoque: 5 }
];

// Rota 1: Listar produtos
app.get('/api/produtos', (req, res) => {
    res.json(produtos);
});

// Rota 2: Processar compra e abater estoque
app.post('/api/comprar', (req, res) => {
    const { produtoId, quantidade } = req.body;
    const produto = produtos.find(p => p.id === produtoId);

    if (!produto) {
        return res.status(404).json({ erro: 'Produto não encontrado.' });
    }

    if (produto.estoque < quantidade) {
        return res.status(400).json({ erro: 'Estoque insuficiente!' });
    }

    // Regra de Negócio: Abatimento automático de estoque
    produto.estoque -= quantidade;

    res.json({ 
        mensagem: 'Compra realizada com sucesso!', 
        estoqueAtual: produto.estoque 
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});