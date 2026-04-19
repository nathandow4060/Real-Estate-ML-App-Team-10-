// AUTHOR: [Your Name]
const express = require('express')
const ctrl = require('../controllers/propertyImageController')
const router = express.Router()

router.get('/images', ctrl.getImagesByPid)

module.exports = router