require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const helmet = require('helmet')
const { NODE_ENV } = require('./config')
// const auth = require('./auth')
const err = require('./errorHandle')
const bookmarkRouter = require("./routes/bookmarks");


const app = express()

const morganOption = (NODE_ENV === 'production')
    ? 'tiny'
    : 'common';

app.use(morgan(morganOption))
app.use(helmet())
app.use(cors())
// app.use(express.json())
// app.use(auth)

app.use('/api/bookmarks', bookmarkRouter)

app.get('/', (req, res) => {
    res.send('Hello, boilerplate!')
})


app.use(err)


module.exports = app