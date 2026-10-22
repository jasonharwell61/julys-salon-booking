import { env } from '../src/config/env.js'
import { connectDB, disconnectDB, getSafeErrorMessage } from '../src/config/db.js'
import Service from '../src/models/Service.js'

// Fake starter menu. Prices are in cents (12000 = $120.00).
// Edit names, prices and durations later to match the real menu.
const services = [
  {
    name: 'Classic Full Set',
    category: 'full-set',
    description:
      'One extension applied to each natural lash for a soft, natural look. A great choice for first-time clients.',
    durationMinutes: 120,
    priceCents: 12000,
    tags: ['natural', 'everyday'],
  },
  {
    name: 'Hybrid Full Set',
    category: 'full-set',
    description:
      'A mix of classic and volume lashes for a textured, wispy look with a little extra fullness.',
    durationMinutes: 135,
    priceCents: 14000,
    tags: ['textured', 'soft glam'],
  },
  {
    name: 'Volume Full Set',
    category: 'full-set',
    description:
      'Several ultra-fine lashes applied to each natural lash for a full, fluffy, dramatic look.',
    durationMinutes: 150,
    priceCents: 16000,
    tags: ['full', 'dramatic'],
  },
  {
    name: 'Classic Fill',
    category: 'fill',
    description:
      'Refresh a classic set by replacing lashes that have shed. Best booked a few weeks after your last appointment.',
    durationMinutes: 60,
    priceCents: 6500,
    tags: ['maintenance', 'natural'],
  },
  {
    name: 'Volume Fill',
    category: 'fill',
    description:
      'Refresh a hybrid or volume set by filling in lashes that have shed, keeping your look full.',
    durationMinutes: 75,
    priceCents: 8000,
    tags: ['maintenance', 'full'],
  },
  {
    name: 'Lash Lift and Tint',
    category: 'lash-lift',
    description:
      'Lifts and curls your natural lashes and adds a darker tint. No extensions and very little upkeep.',
    durationMinutes: 60,
    priceCents: 7500,
    tags: ['no extensions', 'low maintenance'],
  },
  {
    name: 'Lash Removal',
    category: 'removal',
    description: 'Gentle professional removal of lash extensions.',
    durationMinutes: 30,
    priceCents: 3000,
    tags: ['removal', 'gentle'],
  },
]

// Safety check 1: never run against production
if (env.nodeEnv === 'production') {
  console.error('Refusing to seed: NODE_ENV is "production".')
  process.exit(1)
}

// Safety check 2: do nothing unless the person running it says so
if (!process.argv.includes('--confirm')) {
  console.log('WARNING: this script will ADD or OVERWRITE the following services')
  console.log('in the database that MONGODB_URI points to (matched by name):')
  services.forEach((service) => console.log(`  - ${service.name}`))
  console.log('Other services are left untouched. Users and bookings are never touched.')
  console.log('Nothing was changed. To continue, run:  npm run seed -- --confirm')
  process.exit(0)
}

let created = 0
let updated = 0

try {
  await connectDB()
  console.log(`Services in database before: ${await Service.countDocuments()}`)

  for (const data of services) {
    const existing = await Service.findOne({ name: data.name })
    if (existing) {
      existing.set({ ...data, isActive: true })
      await existing.save() // runs the same validation as the model tests
      updated += 1
    } else {
      await Service.create(data)
      created += 1
    }
  }

  console.log(`Created: ${created}, Updated: ${updated}`)
  console.log(`Services in database after: ${await Service.countDocuments()}`)
} catch (err) {
  console.error('Seeding failed:', err.name, getSafeErrorMessage(err))
  process.exitCode = 1
} finally {
  await disconnectDB()
}