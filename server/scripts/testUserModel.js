import { connectDB, disconnectDB, getSafeErrorMessage } from '../src/config/db.js'
import User from '../src/models/User.js'

// Only this fake record is ever created or deleted by this script
const TEST_EMAIL = 'model-test@example.com'
let failures = 0

function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}`)
  if (!condition) failures += 1
}

try {
  await connectDB()
  // Makes sure the unique email index exists before we test duplicates
  await User.init()

  // ---- Validation tests (nothing is saved) ----
  const empty = new User({}).validateSync()
  check(
    'missing name, email and passwordHash are rejected',
    Boolean(empty.errors.name && empty.errors.email && empty.errors.passwordHash)
  )

  const badEmail = new User({ name: 'Jane Doe', email: 'not-an-email', passwordHash: 'x' }).validateSync()
  check('invalid email is rejected', Boolean(badEmail.errors.email))

  const shortName = new User({ name: 'J', email: 'a@b.co', passwordHash: 'x' }).validateSync()
  check('one-letter name is rejected', Boolean(shortName.errors.name))

  const badRole = new User({
    name: 'Jane Doe',
    email: 'jane@example.com',
    passwordHash: 'x',
    role: 'superuser',
  }).validateSync()
  check('unknown role is rejected', Boolean(badRole.errors.role))

  const normalized = new User({ name: '  Jane Doe  ', email: '  JANE@Example.COM ', passwordHash: 'x' })
  check('email is trimmed and lowercased', normalized.email === 'jane@example.com')
  check('name is trimmed', normalized.name === 'Jane Doe')
  check('role defaults to customer', normalized.role === 'customer')

  // ---- Database tests (one fake user, removed at the end) ----
  await User.deleteMany({ email: TEST_EMAIL }) // clears leftovers from an earlier failed run

  const created = await User.create({
    name: 'Model Test',
    email: TEST_EMAIL.toUpperCase(),
    passwordHash: 'not-a-real-hash',
  })
  check('user saved with a lowercase email', created.email === TEST_EMAIL)
  check('timestamps were added', Boolean(created.createdAt && created.updatedAt))

  const json = created.toJSON()
  check('toJSON hides passwordHash and __v', json.passwordHash === undefined && json.__v === undefined)

  const found = await User.findOne({ email: TEST_EMAIL })
  check('passwordHash is hidden from normal queries', found.passwordHash === undefined)

  const withHash = await User.findOne({ email: TEST_EMAIL }).select('+passwordHash')
  check('passwordHash can be requested on purpose', withHash.passwordHash === 'not-a-real-hash')

  let duplicateCode = null
  try {
    await User.create({ name: 'Copy', email: TEST_EMAIL, passwordHash: 'x' })
  } catch (err) {
    duplicateCode = err.code
  }
  check('duplicate email is rejected (code 11000)', duplicateCode === 11000)
} catch (err) {
  console.error('Test script error:', err.name, getSafeErrorMessage(err))
  failures += 1
} finally {
  try {
    await User.deleteMany({ email: TEST_EMAIL })
  } catch {
    // ignore cleanup errors if the connection failed
  }
  await disconnectDB()
  console.log(failures === 0 ? 'All user model checks passed' : `${failures} check(s) failed`)
  process.exitCode = failures === 0 ? 0 : 1
}