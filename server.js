const express = require('express');
const app = express();
const server = require("http").Server(app);
const handlebars = require('express-handlebars');
const homeRoute = require('./routes/client/home.route');
const adminRoute = require('./routes/admin/home.route');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const { v4: uuidv4 } = require("uuid");
const dotenv = require('dotenv').config({ path: path.join(__dirname, 'configs/config.env') });
const db = require('./configs/database');

db.connectDB();


let userCount = 0;

app.use(cors())
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))

process.env.NODE_ENV == 'development' && app.use(morgan('dev'))

// SET TOKEN SETUP
process.env.TOKEN_SETUP = uuidv4().toUpperCase();
console.log(`TOKEN SETUP: ${process.env.TOKEN_SETUP.toUpperCase()}`)

app.use(homeRoute);
app.use('/admin', adminRoute);

// Error Handler
server.listen(process.env.PORT || 80, () => console.log(`Server đang hoạt động port: ${process.env.PORT || 80}`));