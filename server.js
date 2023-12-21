const express = require('express');
const app = express();
const server = require("http").Server(app);
const io = require("socket.io")(server);
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
const hbsHelper = require('./helpers/handlebars.helper');
const os = require('os-utils');
const gameController = require('./controllers/admin/game.controller');
const minifyHbs = require('express-hbsmin');

db.connectDB();

global.socket = io;

let userCount = 0;

app.engine('hbs', handlebars.engine({
    extname: '.hbs',
    partialsDir: path.join(__dirname, 'views/partials'),
    defaultLayout: false,
    helpers: hbsHelper
}));

// app.use(minifyHbs({
//     override: true,
//     exception_url: false,
//     htmlMinifier: {
//         removeComments: true,
//         collapseWhitespace: true,
//         collapseBooleanAttributes: true,
//         removeAttributeQuotes: true,
//         removeEmptyAttributes: true,
//         minifyJS: true
//     }
// }))

const allowedOrigins = ['https://sky86.me'];

const corsOptions = {
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Enable credentials (cookies, authorization headers) for cross-origin requests
  };

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.set('trust proxy', true)

app.use(cors())
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')))

process.env.NODE_ENV == 'development' && app.use(morgan('dev'))

// SET TOKEN SETUP
process.env.TOKEN_SETUP = uuidv4().toUpperCase();
console.log(`TOKEN SETUP: ${process.env.TOKEN_SETUP.toUpperCase()}`)

app.use(homeRoute);
app.use('/admin', adminRoute);

io.on('connection', (socket) => {  
  
    // Handle events when the table data is updated
    socket.on('updateTable', (updatedData) => {
      // Broadcast the updated data to all connected clients
      io.emit('tableUpdated', updatedData);
    });
  
    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });
  


// Error Handler
server.listen(process.env.PORT || 80, () => console.log(`Server đang hoạt động port: ${process.env.PORT || 80}`));

// Chạy game
function runGame() {
    gameController.run()
}

// gameController.run();
setInterval(runGame, 15000);

