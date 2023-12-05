const express = require('express');
const app = express();
const server = require("http").Server(app);
const handlebars = require('express-handlebars');
const homeRoute = require('./routes/client/home.route');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { v4: uuidv4 } = require("uuid");
const dotenv = require('dotenv').config({ path: path.join(__dirname, 'configs/config.env') });

let userCount = 0;

app.use(cors())
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))
    // app.use(session({
    //     secret: process.env.SESSION_SECRET,
    //     resave: false,
    //     saveUninitialized: true,
    //     cookie: { maxAge: 24 * 60 * 60 * 1000 }
    // }))

process.env.NODE_ENV == 'development' && app.use(morgan('dev'))

// SET TOKEN SETUP
process.env.TOKEN_SETUP = uuidv4().toUpperCase();
console.log(`TOKEN SETUP: ${process.env.TOKEN_SETUP.toUpperCase()}`)

app.use(homeRoute);

// Error Handler
server.listen(process.env.PORT || 80, () => console.log(`Server đang hoạt động port: ${process.env.PORT || 80}`));