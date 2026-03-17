//AUTHOR: Ethan McDonell
const db = require('../db')

//returns all properties stored in db; get route
exports.getAllPropertiesByState = async (req, res, next) => {
  try {
        const state = req.body.state
        //add error checks here
        const result = await db.query(
            `SELECT *
            FROM public."Property"
            WHERE state = $1`,
            [state]
        )
        res.json({ status: 'success', count: result.rowCount, data: result.rows })
  } catch (err) {
    next(err)
  }
}

//post address variables to get the prop characterisitcs
exports.getPropertyByAddr = async (req, res, next) => {
    try {
        const street_addr = req.body.address
        const city = req.body.city
        const zipcode = req.body.zipcode
        const state = req.body.state

        const result = await db.query(
            `SELECT * FROM property WHERE 
            street_address = $1 AND city = $2 AND state = $3 AND zipcode = $4`,
            [street_addr, city, state, zipcode]
        )
        if (result.rowCount === 0) throw new Error('Multiple records found for address')
        res.json({ status: 'success', data: result.rows[0]})
    } catch (err) {
        next(err)
    }
}

exports.getPropertiesByCityState = async (req, res, next) => {
    try {
        const city = req.body.city
        const state = req.body.state


        const result = await db.query(
            `SELECT * FROM property WHERE 
             city = $1 AND state = $2`,
            [city, state]
        )
        res.json({ status: 'success', count: result.rowCount, data: result.rows})
    } catch (err) {
        next(err)
    }
}
module.exports = {
    getAllPropertiesByState: exports.getAllPropertiesByState,
    getPropertyByAddr: exports.getPropertyByAddr,
    getPropertiesByCityState: exports.getPropertiesByCityState
}