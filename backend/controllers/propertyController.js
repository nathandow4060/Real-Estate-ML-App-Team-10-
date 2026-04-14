//AUTHOR: Ethan McDonell and Nathan Dow
const db = require('../db')

//Display Gets
exports.getPropertyAttributes = async (req, res, next) => {
    try {
        const street_addr = req.body.address
        const city = req.body.city
        const zipcode = req.body.zipcode
        const state = req.body.state
        const result = await db.query(
            `SELECT 
                pid,
                street_address,
                city,
                state,
                zipcode,
                year_built,
                house_style,
                num_bedrooms,
                num_bathrooms,
                living_area_sqft,
                stories,
                current_price,
                market_status,
                longitude,
                latitude
            FROM public."Property" WHERE 
            street_address = $1 AND city = $2 AND state = $3 AND zipcode = $4`,
            [street_addr, city, state, zipcode]
        )

        //console.log('raw row:', result.rows[0])
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Property not found' })
        }
        const prop = result.rows[0]
        const attributes = [
            { label: "Address",     value: `${prop.street_address}, ${prop.city}, ${prop.state} ${prop.zipcode}` },
            { label: "Year Built",  value: prop.year_built },
            { label: "Style",       value: prop.house_style },
            { label: "Bedrooms",    value: prop.num_bedrooms },
            { label: "Bathrooms",   value: prop.num_bathrooms },
            { label: "Sq Ft",       value: prop.living_area_sqft },
            { label: "Stories",     value: prop.stories }, 
            { label: "Current Price", value: prop.current_price },
            { label: "On the Market", value: prop.market_status },
            { label: "Longitude", value: prop.longitude },
            { label: "Latitude", value: prop.latitude }
        ]

        nonNull = attributes.filter(attr => 
            attr.value !== null && 
            attr.value !== undefined && 
            attr.value !== '' && 
            String(attr.value) !== 'NaN'
        )

        console.log('raw row:', result.rows[0])
        
        res.json({ status: 'success', data: nonNull })
    } catch (err) {
        next(err)
    }
}

exports.getPropertyCoordinates = async (req, res, next) => {
    try {
        const street_addr = req.body.address
        const city = req.body.city
        const zipcode = req.body.zipcode
        const state = req.body.state
        const result = await db.query(
            `SELECT 
                latitiude,
                longitude,
            FROM public."Property" WHERE 
            street_address = $1 AND city = $2 AND state = $3 AND zipcode = $4`,
            [street_addr, city, state, zipcode]
        )

        //console.log('raw row:', result.rows[0])
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Property not found' })
        }
        const prop = result.rows[0]
        const attributes = [
            { label: "Longitude",  value: prop.longitude },
            { label: "Latitude",       value: prop.latitude }
        ]

        nonNull = attributes.filter(attr => 
            attr.value !== null && 
            attr.value !== undefined && 
            attr.value !== '' && 
            String(attr.value) !== 'NaN'
        )

        console.log('raw row:', result.rows[0])
        
        res.json({ status: 'success', data: nonNull })
    } catch (err) {
        next(err)
    }
}

exports.getPropertiesByCity = async (req, res, next) => {
  try {
        const city = req.body.city
        //add error checks here
        const result = await db.query(
            `SELECT *
            FROM public."Property"
            WHERE city = $1`,
            [city]
        )
        res.json({ status: 'success', count: result.rowCount, data: result.rows })
  } catch (err) {
    next(err)
  }
}


//Search Gets
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
            `
                SELECT * FROM public."Property"
                WHERE 
                    similarity(street_address, $1) > 0.3
                    AND p.city ILIKE $2
                    AND p.zipcode = $3
                    AND p.state ILIKE $4
                ORDER BY similarity(street_address, $1) DESC
                LIMIT 1
            `, [street_addr, city, zipcode, state]
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
            `SELECT * FROM public."Property" WHERE 
             city = $1 AND state = $2`,
            [city, state]
        )
        res.json({ status: 'success', count: result.rowCount, data: result.rows})
    } catch (err) {
        next(err)
    }
}

exports.getPropertiesForMap = async (req, res, next) => {
    try {
        //const street_addr = req.body.address
        //const city = req.body.city
        //const zipcode = req.body.zipcode
        //const state = req.body.state
        const result = await db.query(
            `SELECT 
                pid,
                street_address,
                city,
                state,
                zipcode,
                longitude,
                latitude,
                current_price
            FROM public."Property"`
        )

        //console.log('raw row:', result.rows[0])
        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'Property not found' })
        }

        var prop = []
        var attrArray = []
        var k = 0; //counter for json reply array
        for(var i =  0; i < result.rowCount; i++ ){

            prop = result.rows[i]

            const attributes = [
                { label: "Display Address",     value: `${prop.street_address}, ${prop.city}, ${prop.state} ${prop.zipcode}` },
                { label: "Address", value: prop.street_address},
                { label: "City",  value: prop.city },
                { label: "Zip",       value: prop.zipcode },
                { label: "State",    value: prop.state },
                { label: "Longitude",   value: prop.longitude },
                { label: "Latitude",       value: prop.latitude },
                {label: "Current Price", value: prop.current_price},
            ]

            nonNull = attributes.filter(attr => 
            attr.value !== null && 
            attr.value !== undefined && 
            attr.value !== '' && 
            String(attr.value) !== 'NaN'
            )

            if(nonNull.length === 8 || (attributes.find(a =>a.label === "Current Price")?.value === null && nonNull.length === 7)){
                attrArray[k] = attributes
                k++
            }
        }
        console.log(attrArray)

        //console.log('raw row:', result.rows[0])
        
        res.json({ status: 'success', data: attrArray })
    } catch (err) {
        next(err)
    }
}
module.exports = {
    getAllPropertiesByState: exports.getAllPropertiesByState,
    getPropertiesByCity: exports.getPropertiesByCity,
    getPropertyByAddr: exports.getPropertyByAddr,
    getPropertiesByCityState: exports.getPropertiesByCityState,
    getPropertyAttributes:    exports.getPropertyAttributes,
    getPropertiesForMap: exports.getPropertiesForMap,
    getPropertyCoordinates: exports.getPropertyCoordinates
}