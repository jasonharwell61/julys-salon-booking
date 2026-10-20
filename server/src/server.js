// Load variables from the .env file BEFORE anything else reads them
import 'dotenv/config'
import app from './app.js'

const PORT = process.env.PORT || 5000

app.listen(PORT, () => {
  console.log(`July's Salon API listening on port ${PORT}`)
})