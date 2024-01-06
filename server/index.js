import express from 'express'
import path from 'path'

const app = express()
app.use(express.static('./'))

const PORT = process.env.port || 3000

const HTMLPath = path.join(path.resolve() + path.resolve('/index.html'))

app.get('/', (req, res) => {
  res.sendFile(HTMLPath)
})

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`)
})
