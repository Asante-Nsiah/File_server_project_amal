const express = require('express');
const auth = require('../controller/authCtrl');
const authFile = require('../middlewave/fileserver') 



const router = express.Router();

router.get('/signup', auth.register) 
router.post('/signup', auth.signup) 
router.get('/login', auth.login) 
router.post('/login', auth.loginAccount) 
router.get('/verify', auth.verify) 
router.get('/user-dashboard', auth.dashboardUser) 
router.get('/admin-dashboard', auth.dashboardAdmin) 
router.post('/request-resetPd', auth.requestPd) 
router.get('/request-resetPd', auth.requestPd) 
router.get('/reset-password/:token', auth.forgetPassword)
router.get('/reset-password', auth.resetPassword)
router.post('/upload', authFile.uploadFile)
router.get('/upload',  authFile.uploadFile)
router.get('/admin-dashboard', authFile.displayAdminFiles)



module.exports = router;