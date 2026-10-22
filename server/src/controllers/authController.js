import User from '../models/User.js'
import ApiError from '../utils/ApiError.js'
import asyncHandler from '../utils/asyncHandler.js'
import { hashPassword, comparePassword, DUMMY_HASH } from '../utils/passwords.js'
import { signToken } from '../utils/token.js'

// Exactly the fields the API contract promises, nothing more
function toPublicUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  }
}

// POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.validated
  const passwordHash = await hashPassword(password)

  let user
  try {
    // role is NOT passed, so the schema default ("customer") always applies
    user = await User.create({ name, email, passwordHash })
  } catch (err) {
    if (err.code === 11000) {
      throw new ApiError(409, 'An account with that email already exists')
    }
    throw err
  }

  res.status(201).json({ token: signToken(user._id), user: toPublicUser(user) })
})

// POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.validated

  // passwordHash is hidden by default, so we ask for it on purpose here
  const user = await User.findOne({ email }).select('+passwordHash')

  const passwordMatches = await comparePassword(
    password,
    user ? user.passwordHash : DUMMY_HASH
  )

  // Same message whether the email or the password was wrong
  if (!user || !passwordMatches) {
    throw new ApiError(401, 'Invalid email or password')
  }

  res.status(200).json({ token: signToken(user._id), user: toPublicUser(user) })
})

// GET /api/auth/me  (requireAuth has already loaded req.user)
export const me = (req, res) => {
  res.status(200).json(toPublicUser(req.user))
}