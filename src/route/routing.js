const express = require('express');
const auth = require('../controller/authCtrl');



const router = express.Router();

router.get('/signup', auth.register) 
router.post('/signup', auth.signup) 
router.get('/login', auth.login) 
router.get('/verify', auth.verify) 




module.exports = router;