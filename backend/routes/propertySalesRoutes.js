//AUTHOR: Ethan McDonell
const express = require('express')
const ctrl = require('../controllers/propertySalesController')
const router = express.Router()

router.post('/', ctrl.getPropertySales) //returns all sale history for posted address

module.exports = router