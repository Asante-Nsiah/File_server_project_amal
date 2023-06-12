require('dotenv').config();

const express = require('express');
const port = process.env.PORT || 8000;
const pool = require('./db');
const routes = require('./route/routing');
const path = require('path');


const app = express();

app.use(express.json()); // Used to parse JSON bodies
app.use(express.urlencoded()); //Parse URL-encoded bodies
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