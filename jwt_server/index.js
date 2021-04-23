const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require("nodemailer");

const { createSecretKey } = require('crypto');
const { readFileSync } = require('fs');

const { SignJWT } = require('jose/jwt/sign')
const { jwtVerify } = require('jose/jwt/verify');

const secretKey = createSecretKey(Buffer.from(readFileSync('./secret_key_info'), 'utf8'));
const secretPasswordOfMyEmail = readFileSync('./secondPassword', 'utf8');

const DESIRED_DATA = readFileSync('./PROTECTED_TEXT_ON_BACKEND', 'utf8');

const transporter = nodemailer.createTransport({
    host: "smtp.mail.ru",
    port: 465,
    secure: true,
    auth: {
        user: "krutoidomen@internet.ru",
        pass: secretPasswordOfMyEmail.trim()
    }
});

const LIST_OF_ALLOWED_PEOPLE = ['alexander.korichev@gmail.com'];

const getEmailMessage = (email, link) => ({
    from: "krutoidomen@internet.ru",
    to: email,
    subject: "Авторизация через E-mail",
    // text: "Plaintext version of the message",
    html: `<h3>Добрый день, ваша авторизация ждет вас</h3> <p>Для авторизации пройдите по <a href='${link}'>ссылке</a></p>`
})

const message = {
};

const app = express();
const port = 8080;

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

const CURRENT_AUTH = {};

// запрос на аутентификацию
app.post('/auth', async (req, res) => {
    const email = req.body.email;
    const jwt = await new SignJWT({ email })
        .setProtectedHeader({ alg: 'HS256', enc: 'A256GCM' })
        .setIssuedAt()
        .setExpirationTime('10m')
        .sign(secretKey)

    const link = new URL(`http://${req.headers.host}/login/${jwt}`);
    await transporter.sendMail(getEmailMessage(email, link));

    CURRENT_AUTH[email] = res;
})

// проверка
app.get('/login/:key', async (req, res) => {
    const jwtToken = req.params.key;

    try {
        const { payload: { email }, protectedHeader } = await jwtVerify(jwtToken, secretKey)

        const jwt = await new SignJWT({ email })
            .setProtectedHeader({ alg: 'HS256', enc: 'A256GCM' })
            .setIssuedAt()
            .setAudience('resource')
            .setExpirationTime('10m')
            .sign(secretKey)

        CURRENT_AUTH[email].send(jwt)

        res.send('Возвращайтесь на оригинальную страницу');
    } catch (e) {
        res.status(405).send('Ошибка авторизации');
    }

})

// проверка
app.get('/getData/:key', async (req, res) => {
    const jwtToken = req.params.key;

    try {
        const { payload: { email }, protectedHeader } = await jwtVerify(jwtToken, secretKey, {
            audience: 'resource'
        })

        if (LIST_OF_ALLOWED_PEOPLE.includes(email)) {
            res.send(DESIRED_DATA);
            return;
        }

        throw new Error();

    } catch (e) {
        res.status(405).send('no');
    }

})

app.listen(port, () => {
    console.log('Started!');
})
