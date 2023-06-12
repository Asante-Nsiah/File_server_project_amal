require('dotenv').config();

const express = require('express');
const port = process.env.PORT || 8000;
const pool = require('./db');

const app = express();


app.get('/', (req, res) => {
    res.send('Hello, World! THIS IS MY SECOND PROJECT');
  });
  

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});