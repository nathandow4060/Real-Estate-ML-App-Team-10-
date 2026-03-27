//AUTHOR: Ethan McDonell
const express = require('express')
const ctrl = require('../controllers/propertySalesController')
const router = express.Router()

router.post('/', ctrl.getPropertySales) //returns all sale history for posted address

router.post('/city-history',   ctrl.getCityPriceHistory)
router.post('/zipcode-history', ctrl.getZipPriceHistory)
router.post('/state-history',  ctrl.getStatePriceHistory)

module.exports = router