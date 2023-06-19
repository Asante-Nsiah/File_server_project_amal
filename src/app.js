require('dotenv').config();

const express = require('express');
const port = process.env.PORT || 8000;
const routes = require('./route/routing');
const path = require('path');
const flash = require('express-flash');
const session = require('express-session');
const passport = require('passport');
const bodyParser = require('body-parser');



const app = express();

const initializePassport = require('./controller/passport-config');
initializePassport(passport);

app.use(flash())
app.use(session({
    secret: process.env.SESSION_SECRET || 'defaultSecret',
    resave: false,
    saveUninitialized: false
}))

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