const express = require('express');
const session = require('express-session');
const app = express();
const PORT = 3000;

app.use(express.static('public'));
app.use(express.json());

app.use(session({
    secret: 'senhadoadmin',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false,
        maxAge: 60 * 1000 // 1 minuto
    }
}));

// Middleware para checar expiração de sessão (timer de 1 minuto)
app.use((req, res, next) => {
    if(req.session.usuario){
        const now = Date.now();
        const maxIdle = 60 * 1000; // 1 minuto
        if(!req.session.lastActive) req.session.lastActive = now;

        if(now - req.session.lastActive > maxIdle){
            req.session.destroy(err => {
                if(err) console.log("Erro ao destruir sessão:", err);
                return res.redirect('/');
            });
        } else {
            req.session.lastActive = now; // atualizar tempo da última ação
            next();
        }
    } else {
        next();
    }
});

// Página inicial
app.get('/', (req, res) => {
    if(req.session.usuario){
        return res.redirect('/home');
    }
    res.sendFile(__dirname + '/public/index.html');
});

// Rota para login
app.post('/login', (req,res) => {
    const { username, password } = req.body;

    if(username === 'lucas' && password === '123'){
        req.session.usuario = username;
        req.session.lastActive = Date.now(); // inicia timer
        return res.redirect('/home');
    } else {
        res.send('Credenciais inválidas');
    }
});

// Home protegido
app.get('/home', (req,res) => {
    if(req.session.usuario) {
        res.sendFile(__dirname + '/public/home.html');
    } else {
        res.redirect('/');
    }
});

// Logout
app.get('/logout', (req,res) => {
    req.session.destroy((err) => {
        if (err){
            return res.send('Erro ao sair.');
        }
        res.redirect('/');
    });
});

// Rota para retornar usuário logado
app.get('/usuario', (req, res) => {
    if(req.session.usuario){
        res.json({ username: req.session.usuario });
    } else {
        res.status(401).json({ username: null });
    }
});

// Rotas de status HTTP
app.get('/status200', (req, res) => res.status(200).send('Status 200: OK'));
app.get('/status400', (req, res) => res.status(400).send('Status 400: Bad Request'));
app.get('/status401', (req, res) => res.status(401).send('Status 401: Unauthorized'));
app.get('/status404', (req, res) => res.status(404).send('Status 404: Not Found'));
app.get('/status500', (req, res) => res.status(500).send('Status 500: Internal Server Error'));

// Tratamento de erros
app.use((req, res) => res.status(404).send('Erro 404: Página não encontrada'));
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Erro 500: Ocorreu um problema no servidor.');
});

// Iniciar servidor
app.listen(PORT, () => {
     console.log(`Servidor rodando em http://localhost:${PORT}`);
});
