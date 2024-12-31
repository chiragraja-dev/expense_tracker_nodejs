const express = require('express')
const app = express();
const PORT = 5000;
const authRouter = require('./routes/auth');
app.use(express.json())


app.use('/', authRouter)
app.get('/', function (req, res) {
    res.send("getting api")
})
app.listen(PORT)