import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/db.js'
import { User } from '../models/User.model.js'
import { ROLES } from '../constants/roles.js'

async function run() {
  await connectDB()

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@example.com').toLowerCase()
  const password = process.env.SEED_ADMIN_PASSWORD || 'admin1234'

  const existing = await User.findOne({ email })
  if (existing) {
    console.log(`Admin already exists: ${email}`)
  } else {
    await User.create({ email, password, role: ROLES.ADMIN })
    console.log(`✅ Admin created: ${email} / ${password}`)
  }

  await mongoose.disconnect()
}

run().catch((err) => {
  console.error('❌ Seeding failed:', err.message)
  process.exit(1)
})
