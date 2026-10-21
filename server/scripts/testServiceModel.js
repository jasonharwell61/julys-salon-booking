import { connectDB, disconnectDB, getSafeErrorMessage } from '../src/config/db.js'
import Service from '../src/models/Service.js'

// Only records with this fake name are ever created or deleted by this script
const TEST_NAME = 'Model Test Service'
let failures = 0

function check(label, condition) {
  console.log(`${condition ? 'PASS' : 'FAIL'} - ${label}`)
  if (!condition) failures += 1
}

// A valid service we can change one field of at a time
const valid = (overrides = {}) => ({
  name: TEST_NAME,
  category: 'fill',
  description: 'A fake service used only for model tests.',
  durationMinutes: 60,
  priceCents: 6500,
  ...overrides,
})

const errorsOf = (data) => new Service(data).validateSync()?.errors || {}

try {
  await connectDB()
  // Makes sure the compound index exists before we check for it
  await Service.init()

  // ---- Validation tests (nothing is saved) ----
  const empty = errorsOf({})
  check(
    'missing required fields are rejected',
    Boolean(empty.name && empty.category && empty.description && empty.durationMinutes && empty.priceCents)
  )
  check('unknown category is rejected', Boolean(errorsOf(valid({ category: 'nails' })).category))
  check('duration under 15 is rejected', Boolean(errorsOf(valid({ durationMinutes: 10 })).durationMinutes))
  check('duration over 240 is rejected', Boolean(errorsOf(valid({ durationMinutes: 300 })).durationMinutes))
  check('non-whole duration is rejected', Boolean(errorsOf(valid({ durationMinutes: 90.5 })).durationMinutes))
  check('negative price is rejected', Boolean(errorsOf(valid({ priceCents: -100 })).priceCents))
  check('non-whole price is rejected', Boolean(errorsOf(valid({ priceCents: 12.5 })).priceCents))
  check('more than 8 tags is rejected', Boolean(errorsOf(valid({ tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'] })).tags))
  check('description over 500 characters is rejected', Boolean(errorsOf(valid({ description: 'x'.repeat(501) })).description))

  const defaults = new Service(valid())
  check('isActive defaults to true and tags to empty', defaults.isActive === true && defaults.tags.length === 0)

  const tagged = new Service(valid({ tags: ['  Natural ', 'EVERYDAY'] }))
  check('tags are trimmed and lowercased', tagged.tags.join(',') === 'natural,everyday')

  // ---- Database tests (one fake service, removed at the end) ----
  await Service.deleteMany({ name: TEST_NAME }) // clears leftovers from an earlier failed run

  const created = await Service.create(valid())
  check('service saved with timestamps', Boolean(created.createdAt && created.updatedAt))

  const activeFills = await Service.find({ name: TEST_NAME, isActive: true, category: 'fill' })
  check('active service is found by category', activeFills.length === 1)

  await Service.updateOne({ _id: created._id }, { isActive: false })
  const stillActive = await Service.find({ name: TEST_NAME, isActive: true })
  check('inactive service is hidden from active queries', stillActive.length === 0)

  check('toJSON hides __v', created.toJSON().__v === undefined)

  const indexes = await Service.collection.indexes()
  check(
    'compound index on isActive and category exists',
    indexes.some((index) => index.key.isActive === 1 && index.key.category === 1)
  )
} catch (err) {
  console.error('Test script error:', err.name, getSafeErrorMessage(err))
  failures += 1
} finally {
  try {
    await Service.deleteMany({ name: TEST_NAME })
  } catch {
    // ignore cleanup errors if the connection failed
  }
  await disconnectDB()
  console.log(failures === 0 ? 'All service model checks passed' : `${failures} check(s) failed`)
  process.exitCode = failures === 0 ? 0 : 1
}