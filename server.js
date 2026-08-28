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
        mensagem: 'Compra realizada com sucesso!'<br>'Muito obrigado por comprar conosco!', 
        estoqueAtual: produto.estoque 
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
const express = require('express');
const axios = require('axios');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
app.use(express.json());

// Configuração da API de Pagamento (Mercado Pago)
// Substitua pelo seu Access Token de Teste do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: 'PROD_CUSTOM_YOUR_ACCESS_TOKEN_HERE' });
const payment = new Payment(client);

// =========================================================================
// 1. INTEGRAÇÃO VIACEP: Buscar Endereço pelo CEP
// =========================================================================
app.get('/api/cep/:cep', async (req, res) => {
    try {
        const { cep } = req.params;
        const cepLimpo = cep.replace(/\D/g, ''); // Remove traços e espaços

        if (cepLimpo.length !== 8) {
            return res.status(400).json({ erro: 'CEP inválido. Deve conter 8 dígitos.' });
        }

        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        
        if (response.data.erro) {
            return res.status(404).json({ erro: 'CEP não encontrado.' });
        }

        res.json({
            logradouro: response.data.logradouro,
            bairro: response.data.bairro,
            cidade: response.data.localidade,
            estado: response.data.uf,
            cep: response.data.cep
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao consultar serviço de CEP.' });
    }
});

// =========================================================================
// 2. INTEGRAÇÃO CÁLCULO DE FRETE (Simulação de Regra de Negócio)
// =========================================================================
app.post('/api/frete', (req, res) => {
    const { cepDestino, pesoKg } = req.body;

    if (!cepDestino) {
        return res.status(400).json({ erro: 'CEP de destino é obrigatório.' });
    }

    // Regra estimativa: R$ 15,00 base + R$ 5,00 por Kg
    const peso = pesoKg || 1;
    const valorFrete = 15.00 + (peso * 5.00);
    
    res.json({
        servico: 'Entrega Padrão (Sedex/Transportadora)',
        prazoDias: 3,
        valor: valorFrete
    });
});

// =========================================================================
// 3. INTEGRAÇÃO PAGAMENTO (Mercado Pago - PIX / Checkout)
// =========================================================================
app.post('/api/checkout/pix', async (req, res) => {
    try {
        const { idPedido, valorTotal, emailCliente, nomeCliente } = req.body;

        const body = {
            transaction_amount: Number(valorTotal),
            description: `Pedido #${idPedido} - E-Commerce`,
            payment_method_id: 'pix',
            payer: {
                email: emailCliente,
                first_name: nomeCliente
            },
            notification_url: 'https://sua-api.com/api/webhooks/mercadopago' // URL pública para receber confirmação
        };

        const result = await payment.create({ body });

        res.json({
            status: result.status,
            idPagamento: result.id,
            qrCodePix: result.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64
        });
    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        res.status(500).json({ erro: 'Erro ao processar pagamento via PIX.' });
    }
});

// =========================================================================
// 4. WEBHOOK: Confirmação Automática e Abatimento de Estoque
// =========================================================================
app.post('/api/webhooks/mercadopago', async (req, res) => {
    const { type, data } = req.body;

    if (type === 'payment') {
        const paymentId = data.id;
        
        // 1. Consulta o status do pagamento atualizado na API
        const paymentInfo = await payment.get({ id: paymentId });
        
        if (paymentInfo.status === 'approved') {
            console.log(`[Pagamento Aprovado] ID: ${paymentId}`);
            
            // 2. EXECUTAR ABATIMENTO DE ESTOQUE NO BANCO DE DADOS
            // Exemplo SQL: 
            // UPDATE PRODUTO SET quantidade_estoque = quantidade_estoque - item.quantidade 
            // WHERE id_produto = item.id_produto;
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});

const express = require('express');
const axios = require('axios');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
app.use(express.json());

// Configuração da API de Pagamento (Mercado Pago)
// Substitua pelo seu Access Token de Teste do Mercado Pago
const client = new MercadoPagoConfig({ accessToken: 'PROD_CUSTOM_YOUR_ACCESS_TOKEN_HERE' });
const payment = new Payment(client);

// =========================================================================
// 1. INTEGRAÇÃO VIACEP: Buscar Endereço pelo CEP
// =========================================================================
app.get('/api/cep/:cep', async (req, res) => {
    try {
        const { cep } = req.params;
        const cepLimpo = cep.replace(/\D/g, ''); // Remove traços e espaços

        if (cepLimpo.length !== 8) {
            return res.status(400).json({ erro: 'CEP inválido. Deve conter 8 dígitos.' });
        }

        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        
        if (response.data.erro) {
            return res.status(404).json({ erro: 'CEP não encontrado.' });
        }

        res.json({
            logradouro: response.data.logradouro,
            bairro: response.data.bairro,
            cidade: response.data.localidade,
            estado: response.data.uf,
            cep: response.data.cep
        });
    } catch (error) {
        res.status(500).json({ erro: 'Erro ao consultar serviço de CEP.' });
    }
});

// =========================================================================
// 2. INTEGRAÇÃO CÁLCULO DE FRETE (Simulação de Regra de Negócio)
// =========================================================================
app.post('/api/frete', (req, res) => {
    const { cepDestino, pesoKg } = req.body;

    if (!cepDestino) {
        return res.status(400).json({ erro: 'CEP de destino é obrigatório.' });
    }

    // Regra estimativa: R$ 15,00 base + R$ 5,00 por Kg
    const peso = pesoKg || 1;
    const valorFrete = 15.00 + (peso * 5.00);
    
    res.json({
        servico: 'Entrega Padrão (Sedex/Transportadora)',
        prazoDias: 3,
        valor: valorFrete
    });
});

// =========================================================================
// 3. INTEGRAÇÃO PAGAMENTO (Mercado Pago - PIX / Checkout)
// =========================================================================
app.post('/api/checkout/pix', async (req, res) => {
    try {
        const { idPedido, valorTotal, emailCliente, nomeCliente } = req.body;

        const body = {
            transaction_amount: Number(valorTotal),
            description: `Pedido #${idPedido} - E-Commerce`,
            payment_method_id: 'pix',
            payer: {
                email: emailCliente,
                first_name: nomeCliente
            },
            notification_url: 'https://sua-api.com/api/webhooks/mercadopago' // URL pública para receber confirmação
        };

        const result = await payment.create({ body });

        res.json({
            status: result.status,
            idPagamento: result.id,
            qrCodePix: result.point_of_interaction.transaction_data.qr_code,
            qrCodeBase64: result.point_of_interaction.transaction_data.qr_code_base64
        });
    } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        res.status(500).json({ erro: 'Erro ao processar pagamento via PIX.' });
    }
});

// =========================================================================
// 4. WEBHOOK: Confirmação Automática e Abatimento de Estoque
// =========================================================================
app.post('/api/webhooks/mercadopago', async (req, res) => {
    const { type, data } = req.body;

    if (type === 'payment') {
        const paymentId = data.id;
        
        // 1. Consulta o status do pagamento atualizado na API
        const paymentInfo = await payment.get({ id: paymentId });
        
        if (paymentInfo.status === 'approved') {
            console.log(`[Pagamento Aprovado] ID: ${paymentId}`);
            
            // 2. EXECUTAR ABATIMENTO DE ESTOQUE NO BANCO DE DADOS
            // Exemplo SQL: 
            // UPDATE PRODUTO SET quantidade_estoque = quantidade_estoque - item.quantidade 
            // WHERE id_produto = item.id_produto;
        }
    }

    res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
const express = require('express');
const pool = require('./database'); // Importa a conexão do banco
const app = express();
app.use(express.json());

// =========================================================================
// ROTA: Processar Pedido e Abater Estoque (PostgreSQL/MySQL)
// =========================================================================
app.post('/api/pedidos/processar', async (req, res) => {
    const { idUsuario, itens } = req.body; 
    // itens = [{ idProduto: 1, quantidade: 2, precoUnitario: 50.00 }]

    if (!itens || itens.length === 0) {
        return res.status(400).json({ erro: 'O carrinho está vazio.' });
    }

    // Caso PostgreSQL (Inicia Transação SQL)
    const client = await pool.connect();

    try {
        await client.query('BEGIN'); // Inicio da transação

        // 1. Calcular o valor total do pedido
        let valorTotal = 0;
        for (const item of itens) {
            valorTotal += item.precoUnitario * item.quantidade;
        }

        // 2. Inserir na tabela PEDIDO
        const resPedido = await client.query(
            `INSERT INTO PEDIDO (id_usuario, data_pedido, valor_total, status_pedido) 
             VALUES ($1, NOW(), $2, 'Pago') RETURNING id_pedido`,
            [idUsuario, valorTotal]
        );
        const idPedido = resPedido.rows[0].id_pedido;

        // 3. Inserir os ITENS e ABATER O ESTOQUE
        for (const item of itens) {
            // Verifica se há estoque suficiente antes de abater
            const resEstoque = await client.query(
                `SELECT quantidade_estoque FROM PRODUTO WHERE id_produto = $1`,
                [item.idProduto]
            );

            if (resEstoque.rows.length === 0 || resEstoque.rows[0].quantidade_estoque < item.quantidade) {
                throw new Error(`Estoque insuficiente para o produto ID ${item.idProduto}`);
            }

            // Inserir registro na tabela ITEM_PEDIDO
            await client.query(
                `INSERT INTO ITEM_PEDIDO (id_pedido, id_produto, quantidade, preco_unitario) 
                 VALUES ($1, $2, $3, $4)`,
                [idPedido, item.idProduto, item.quantidade, item.precoUnitario]
            );

            // ABATIMENTO AUTOMÁTICO DE ESTOQUE
            await client.query(
                `UPDATE PRODUTO 
                 SET quantidade_estoque = quantidade_estoque - $1 
                 WHERE id_produto = $2`,
                [item.quantidade, item.idProduto]
            );
        }

        await client.query('COMMIT'); // Confirma todas as operações com sucesso

        res.json({
            sucesso: true,
            mensagem: 'Compra realizada com sucesso! Estoque atualizado.',
            idPedido: idPedido
        });

    } catch (error) {
        await client.query('ROLLBACK'); // Desfaz alterações em caso de erro
        console.error('Erro na transação de compra:', error.message);
        res.status(400).json({ erro: error.message || 'Erro ao processar compra.' });
    } finally {
        client.release(); // Libera a conexão de volta para o pool
    }
});