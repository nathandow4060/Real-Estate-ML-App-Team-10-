//AUTHOR: Ethan McDonell
const express = require('express')
const app = express()

app.use(express.static('../frontend/public')) //displays index.html file in public folder to base url of site '/'
app.use(express.json())

const cors = require('cors')
app.use(cors())  // add this right after app.use(express.json())

// property routes
const propRoutes = require('./routes/propertyRoutes')
app.use('/property',propRoutes)

// property sales routes
const propSalesRoutes = require('./routes/propertySalesRoutes')
app.use('/property-sales',propSalesRoutes)

// predictions routes
const predictionsRoutes = require('./routes/predictionsRoutes')
app.use('/predictions', predictionsRoutes)

app.listen(5000, () => {console.log("Server started on port 5000")}) //This should be last after routes