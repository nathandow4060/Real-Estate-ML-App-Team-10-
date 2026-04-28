//AUTHOR: Ethan McDonell
const express = require('express')
const ctrl = require('../controllers/predictionsController')
const router = express.Router()

router.post('/property-predictions', ctrl.getPropertyPrediction)
router.post('/model-details', ctrl.getModelDetailsByName)
router.post('/model-perf', ctrl.getModelMetricsByName)
router.post('/zipcode-averages', ctrl.getAveragePredictionsByZipcode)
router.post('/city-averages', ctrl.getAveragePredictionsByCity)
router.post('/state-averages', ctrl.getAveragePredictionsByState)

module.exports = router
