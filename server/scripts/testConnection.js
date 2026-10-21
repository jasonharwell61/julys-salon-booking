import mongoose from 'mongoose'
import { connectDB, disconnectDB, getSafeErrorMessage } from '../src/config/db.js'

try {
  await connectDB()

  // Lists the collections that exist so we can see we reached the right database
  const collections = await mongoose.connection.db.listCollections().toArray()
  console.log('Collections found:', collections.map((c) => c.name))

  await disconnectDB()
  console.log('Connection test passed')
} catch (err) {
  console.error('Connection test failed:', err.name, getSafeErrorMessage(err))
  process.exitCode = 1
}