const express = require('express');
const auth = require('../controller/authCtrl');
const authFile = require('../middleware/fileserver') 



const router = express.Router();

router.get('/signup', auth.register) 
router.post('/signup', auth.signup) 
router.get('/login', auth.login) 
router.post('/login', auth.loginAccount) 
router.get('/verify', auth.verify) 

router.get('/user-dashboard', auth.dashboardUser) 
router.get('/admin-dashboard', auth.dashboardAdmin) 

router.post('/request-resetPd', auth.forgetPassword) 
router.get('/request-resetPd', auth.requestPd) 
router.get('/request-resetPd', auth.forgetPassword)
router.get('/update-password/:token', auth.resetPassword)
router.post('/update-password', auth.updatePassword)

router.post('/upload', authFile.uploadFile)
router.get('/upload',  authFile.uploadFile)
router.get('/download/:filename',  authFile.downloadFile)
router.get('/search', authFile.searchFiles)
router.post('/send-email/:filename', authFile.emailFiles)
router.get('/email-success', authFile.emailSuccess)







module.exports = router;