import express from 'express'
const app = express()
const port = 3000

app.get('/', (req, res) => {
    return res.send('hello')
})


app.listen(port, () => {
    return console.log(`Listening on port ${port}!`)
})
