//AUTHOR: Ethan McDonell
const express = require('express')
const ctrl = require('../controllers/predictionsController')
const router = express.Router()

router.post('/property-predictions', ctrl.getPropertyPrediction) //return most recent date-of-sale price prediction 
router.post('/model-details', ctrl.getModelDetailsByName) //return model details for passed model name
router.post('/model-perf', ctrl.getModelMetricsByName) //return model performance metrics for passed model name
module.exports = router