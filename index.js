const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const rateLimiter = require('express-rate-limit');
const compression = require('compression');
const path = require('path');

app.use(compression({
    level: 5,
    threshold: 0,
    filter: (req, res) => {
        if (req.headers['x-no-compression']) {
            return false;
        }
        return compression.filter(req, res);
    }
}));

// Set the views directory and view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.set('trust proxy', 1);
app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header(
        'Access-Control-Allow-Headers',
        'Origin, X-Requested-With, Content-Type, Accept',
    );
    console.log(`[${new Date().toLocaleString()}] ${req.method} ${req.url} - ${res.statusCode}`);
    next();
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(rateLimiter({ windowMs: 15 * 60 * 1000, max: 100, headers: true }));

// Register/Login page
app.all('/player/login/dashboard', function (req, res) {
    /*
    if (req.method === 'POST') {
        console.log('Dashboard POST Request Body:', req.body);
    }
    else {
        console.log('Dashboard ' + req.method + ' Request Body:', req.body);
    } */
    res.render('landing');
});

// Login dashboard page
app.all('/player/login/login_dashboard', function (req, res) {
    res.render('dashboard', { title: 'GTPS Account' });
});

// Register route
app.all('/player/register', function(req, res) {
    res.redirect('/player/growid/login/validate?isRegister=1');
});

app.all('/player/growid/login/validate', (req, res) => {
    //console.log("Request Body (Server):", req.body); // DEBUG ONLY
    const isRegister = req.query.isRegister === '1';
    
    let token;
    if (isRegister) {
        token = 'X3Rva2VuPSZncm93SWQ9JnBhc3N3b3JkPQ==';
    } else {
        const _token = req.body._token;
        const growId = req.body.growId;
        const password = req.body.password;
        token = Buffer.from(
            `_token=${token}&growId=${growId}&password=${password}`,
        ).toString('base64');
    }
   
    res.send(
        `{"status":"success","message":"Account Validated.","token":"${token}","url":"","accountType":"growtopia", "accountAge": 2}`,
    );
});

app.all('/player/growid/checktoken', (req, res) => {
    /*
    const encodedToken = req.body._token;
    // Dekripsi token jika diperlukan
    // const decodedToken = Buffer.from(encodedToken, 'base64').toString('utf-8');
    // console.log('Decoded Token:', decodedToken);

    res.json({
        status: 'success',
        message: 'Account Validated.',
        token: encodedToken,
        url: '',
        accountType: 'growtopia',
        accountAge: 2
    }); */
    const { refreshToken } = req.body;
    try {
    const decoded = Buffer.from(refreshToken, 'base64').toString('utf-8');
    if (typeof decoded !== 'string' && !decoded.startsWith('growId=') && !decoded.includes('passwords=')) return res.render(__dirname + '/public/html/dashboard.ejs');
    res.json({
        status: 'success',
        message: 'Account Validated.',
        token: refreshToken,
        url: '',
        accountType: 'growtopia',
        accountAge: 2
    });
    } catch (error) {
        console.log("Redirecting to player login dashboard");
        res.render('landing');
    }
});

app.get('/', function (req, res) {
    res.send('Made by Xaaryn');
});

app.listen(5000, function () {
    console.log('Listening on port 5000');
});
