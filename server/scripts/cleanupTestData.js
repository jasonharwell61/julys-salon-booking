import { env } from '../src/config/env.js'
import { connectDB, disconnectDB, getSafeErrorMessage } from '../src/config/db.js'
import User from '../src/models/User.js'
import Service from '../src/models/Service.js'
import Booking from '../src/models/Booking.js'

// Only data created by the Postman collection matches these patterns
const TEST_EMAIL = /^qa\..+@example\.com$/
const TEST_SERVICE_NAME = /^QA Test Service/

// Safety check 1: never run against production
if (env.nodeEnv === 'production') {
  console.error('Refusing to clean up: NODE_ENV is "production".')
  process.exit(1)
}

// Safety check 2: do nothing unless the person running it says so
if (!process.argv.includes('--confirm')) {
  console.log('WARNING: this script will DELETE test data from the database MONGODB_URI points to:')
  console.log('  - users whose email looks like qa.<something>@example.com')
  console.log('  - ALL bookings made by those users')
  console.log('  - services whose name starts with "QA Test Service"')
  console.log('Nothing was changed. To continue, run:  npm run cleanup:test-data -- --confirm')
  process.exit(0)
}

try {
  await connectDB()

  const includeAdmin = process.argv.includes('--include-admin')
  const matchedUsers = await User.find({ email: TEST_EMAIL }).select('_id email')
  const testUsers = matchedUsers.filter(
    (user) => includeAdmin || user.email !== 'qa.admin@example.com'
  )
  const testUserIds = testUsers.map((user) => user._id)

  const bookings = await Booking.deleteMany({ user: { $in: testUserIds } })
  const users = await User.deleteMany({ _id: { $in: testUserIds } })
  const services = await Service.deleteMany({ name: TEST_SERVICE_NAME })

  console.log(`Deleted bookings: ${bookings.deletedCount}`)
  console.log(`Deleted users: ${users.deletedCount}`)
  console.log(`Deleted services: ${services.deletedCount}`)
} catch (err) {
  console.error('Cleanup failed:', err.name, getSafeErrorMessage(err))
  process.exitCode = 1
} finally {
  await disconnectDB()
}