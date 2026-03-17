//AUTHOR: Ethan McDonell
const db = require('../db')

exports.getPropertySales = async (req, res, next) => {
    try {
        const street_addr = req.body.address
        const city = req.body.city
        const zipcode = req.body.zipcode
        const state = req.body.state

        const result = await db.query(`
                SELECT ps.date_of_sale, ps.sale_amount FROM public."Property" AS p JOIN
                public."Property_Sale" AS ps on p.pid = ps.property_id
                WHERE p.street_address = $1 AND p.zipcode = $2 AND p.city = $3 AND P.state = $4
            `, [street_addr, zipcode, city, state])
        res.json({ status: 'success', count: result.rowCount, data: result.rows})
    } catch (err) {
        next(err)
    }
}

module.exports = {
    getPropertySales: exports.getPropertySales
}