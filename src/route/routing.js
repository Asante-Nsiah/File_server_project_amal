const express = require('express');
const auth = require('../controller/authCtrl');



const router = express.Router();

router.get('/register', auth.register) 
router.post('/signup', auth.signup) 




module.exports = router;