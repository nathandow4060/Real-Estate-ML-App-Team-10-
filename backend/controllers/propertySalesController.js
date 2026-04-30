//AUTHOR: Ethan McDonell and Nathan Dow
const db = require('../db')

exports.getPropertySales = async (req, res, next) => {
    try {
        const street_addr = req.body.address
        const city = req.body.city
        const zipcode = req.body.zipcode
        const state = req.body.state

        const result = await db.query(`
            SELECT ps.date_of_sale, ps.sale_amount 
            FROM public."Property" AS p 
            JOIN public."Property_Sale" AS ps ON p.pid = ps.property_id
            WHERE p.street_address = $1 AND p.zipcode = $2 AND p.city = $3 AND p.state = $4
            ORDER BY TO_DATE(ps.date_of_sale, 'MM/DD/YYYY') ASC
        `, [street_addr, zipcode, city, state])
        res.json({ status: 'success', count: result.rowCount, data: result.rows})
    } catch (err) {
        next(err)
    }
}

//Sales Price Averages
exports.getZipPriceHistory = async (req, res, next) => {
    try {
        const zipcode = req.body.zipcode
        const state = req.body.state
        const result = await db.query(`
            SELECT 
                RIGHT(ps.date_of_sale, 4) AS year,
                ROUND(AVG(ps.sale_amount)) AS avg_price
            FROM public."Property" AS p
            JOIN public."Property_Sale" AS ps ON p.pid = ps.property_id
            WHERE p.zipcode = $1 AND p.state ILIKE $2
            GROUP BY year
            ORDER BY year ASC
        `, [zipcode, state])
        res.json({ status: 'success', data: result.rows })
    } catch (err) { next(err) }
}


exports.getCityPriceHistory = async (req, res, next) => {
    try {
        const city = req.body.city
        const state = req.body.state
        const result = await db.query(`
            SELECT 
                RIGHT(ps.date_of_sale, 4) AS year,
                ROUND(AVG(ps.sale_amount)) AS avg_price
            FROM public."Property" AS p
            JOIN public."Property_Sale" AS ps ON p.pid = ps.property_id
            WHERE p.city ILIKE $1 AND p.state ILIKE $2
            GROUP BY year
            ORDER BY year ASC
        `, [city, state])
        res.json({ status: 'success', data: result.rows })
    } catch (err) { next(err) }
}

// Not possible for Conneticut
/*
exports.getCountyPriceHistory = async (req, res, next) => {
    try {
        
    } catch (err) { next(err) }
}
*/
exports.getStatePriceHistory = async (req, res, next) => {
    try {
        const state = req.body.state
        const result = await db.query(`
            SELECT 
                RIGHT(ps.date_of_sale, 4) AS year,
                ROUND(AVG(ps.sale_amount)) AS avg_price
            FROM public."Property" AS p
            JOIN public."Property_Sale" AS ps ON p.pid = ps.property_id
            WHERE p.state ILIKE $1
            GROUP BY year
            ORDER BY year ASC
        `, [state])
        res.json({ status: 'success', data: result.rows })
    } catch (err) { next(err) }
}

module.exports = {
    getPropertySales:         exports.getPropertySales,
    getZipPriceHistory:       exports.getZipPriceHistory,
    getCityPriceHistory:      exports.getCityPriceHistory,
    //getCountyPriceHistory:  exports.getCountyPriceHistory,
    getStatePriceHistory:     exports.getStatePriceHistory
}