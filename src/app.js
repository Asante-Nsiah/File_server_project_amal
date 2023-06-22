require('dotenv').config();

const express = require('express');
const port = process.env.PORT || 8000;
const routes = require('./route/routing');
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');
const pgSession = require('connect-pg-simple')(session);
const passport = require('passport');
const bodyParser = require('body-parser');
const pool = require("./db");



const app = express();

const initializePassport = require('./controller/passport-config');
initializePassport(passport);

app.use(flash())
app.use(session({
    store: new pgSession({
        // conString: 'postgres://postgres:postgres@localhost:5433/fileServerDB',
        conString: 'postgres://projectadmin:Y4M0LaKBqXFCLXwmdYvdn3NOI6jJxoEN@dpg-ci661uunqql3q38ihjvg-a.oregon-postgres.render.com/fileserverdb_2s24',
        tableName: 'session',
    }),
    secret: process.env.SESSION_SECRET || 'defaultSecret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: true, // Set to true for HTTPS-only cookie
        httpOnly: true, // Set to true to prevent client-side access to the cookie
        maxAge: 86400000, // Session expiration time in milliseconds (e.g., 1 day)
      },
}))

app.use('/update-password', routes);
app.use('/uploads', express.static('uploads'));
app.use(passport.initialize())
app.use(passport.session())
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded({ extended: true }));
app.use(routes)

app.get('/', (req, res) => {
    res.send('Hello, World! THIS IS MY SECOND PROJECT');
  });
  
  
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '/views') );
  app.use(express.static(path.join(__dirname, './../public')));
  


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});