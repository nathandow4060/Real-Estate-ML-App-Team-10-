//AUTHOR: Ethan McDonell
const express = require('express')
const ctrl = require('../controllers/propertyController')
const router = express.Router()

router.post('/state', ctrl.getAllPropertiesByState) //returns all properties within state
router.post('/full_addr', ctrl.getPropertyByAddr)  //returns single property by addr (to get specific prope characteristics)
router.post('/city-state', ctrl.getPropertiesByCityState) //returns all properties within city and state
router.post('/attributes', ctrl.getPropertyAttributes)

module.exports = router