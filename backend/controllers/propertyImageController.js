// AUTHOR: Nathan Dow
const db = require('../db')

exports.getImagesByPid = async (req, res, next) => {
    try {
        const { pid } = req.query

        if (!pid) {
            return res.status(400).json({ error: 'pid query param is required' })
        }

        const result = await db.query(
            `SELECT pid, img_url
             FROM public."Property_Images"
             WHERE pid = $1`,
            [pid]
        )

        if (result.rowCount === 0) {
            return res.status(404).json({ status: 'error', message: 'No images found for this property' })
        }

        res.json({ status: 'success', count: result.rowCount, data: result.rows })
    } catch (err) {
        next(err)
    }
}