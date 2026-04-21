//AUTHOR: Ethan McDonell
const db = require('../db')

//Post route to return the most recent date-of-sale price prediction for the passed property
//INPUT: PID, model_name
//OUTPUT: predicted property price
exports.getPropertyPrediction = async (req, res, next) => {
    try {
        const pid = req.body.pid
        const model_name = req.body.model_name
        const result = await db.query(
            `SELECT mp.predicted_value FROM public."Model_Predictions"
            AS mp join public."Property_Sale" as ps on mp.sid = ps.sid
            WHERE mp.PID = $1 and mp.model_name = $2
            ORDER BY ps.date_of_sale DESC
            LIMIT 1
        `, [pid, model_name])
        res.json(result.rows)
        
        //Property prediction not found
        //It is possible this property was filtered out by preprocessing,
        // therfore we do not have a prediction for it.
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Property Prediction not found' })
        }

        //if data returns, this is the most recent prediction for the property
        res.json({ status: 'success', data: returnRow})

    } catch (error) {
        next(error)
    }
}
//Post Route Returns model details for passed model name
//INPUT: model_name
//OUTPUT: model details: model_name, range of years modeled, target feature
exports.getModelDetailsByName = async (req, res, next) => {
    try {
        const model_name = req.body.model_name
        const result = await db.query(
            `SELECT model_name, model_coverage, mode_of_prediction, target_feature FROM public."ML_Models"
            WHERE model_name = $1
        `, [model_name])

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Model Details not found' })
        }

        res.json({ status: 'success', data: result.rows[0]})
    } catch (error) {
        next(error)
    }
}

//Post Route Returns model performance metrics for passed model name. 
// Shold return 3 rows, one for each dataset (train, test, validation) 
//OUTPUT: model performance metrics: model_name, rmse, r2_score
exports.getModelMetricsByName = async (req, res, next) => {
    try {
        const model_name = req.body.model_name
        const result = await db.query(
            `SELECT model_name, dataset, r_squared, root_mean_sq_error, mean_avg_percent_err, mean_avg_actual_err FROM public."Model_Performance"
            WHERE model_name = $1
        `, [model_name])

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Model Performance metrics not found' })
        }

        res.json({ status: 'success', data: result.rows})
    } catch (error) {
        next(error)
    }
}

exports.getAveragePredictionsByZipcode = async (req, res, next) => {
    try {
        const model_name = req.body.model_name

        if (!model_name) {
            return res.status(400).json({
                status: 'error',
                message: 'model_name is required'
            })
        }

        const result = await db.query(
            `WITH latest_prediction_per_property AS (
                SELECT DISTINCT ON (mp.pid)
                    mp.pid,
                    mp.sid,
                    mp.model_name,
                    mp.dataset,
                    mp.predicted_value
                FROM public."Model_Predictions" mp
                JOIN public."Property_Sale" ps
                    ON ps.sid = mp.sid
                WHERE mp.model_name = $1
                ORDER BY mp.pid, ps.date_of_sale DESC, mp.updated_at DESC
            )
            SELECT
                LPAD(p.zipcode::text, 5, '0') AS zipcode,
                COUNT(*) AS parcel_count,
                ROUND(AVG(lpp.predicted_value))::integer AS avg_predicted_value
            FROM latest_prediction_per_property lpp
            JOIN public."Property" p
                ON p.pid = lpp.pid
            WHERE p.zipcode IS NOT NULL
            GROUP BY p.zipcode
            ORDER BY p.zipcode;
            `,
            [model_name]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({
                status: 'error',
                message: 'No zipcode averages found for that model'
            })
        }

        res.json({
            status: 'success',
            data: result.rows
        })
    } catch (error) {
        next(error)
    }
}

module.exports = {
    getPropertyPrediction: exports.getPropertyPrediction,
    getModelDetailsByName: exports.getModelDetailsByName,
    getModelMetricsByName: exports.getModelMetricsByName,
    getAveragePredictionsByZipcode: exports.getAveragePredictionsByZipcode
}
