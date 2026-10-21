import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [60, 'Name must be at most 60 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Email format is invalid'],
    },
    // Stores the bcrypt hash only, never the real password.
    // select: false hides it from normal queries.
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false,
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'admin'],
        message: 'Role must be customer or admin',
      },
      default: 'customer',
    },
  },
  {
    // Adds createdAt and updatedAt automatically
    timestamps: true,
    toJSON: {
      // Runs whenever a user is converted to JSON for a response
      transform(doc, ret) {
        delete ret.passwordHash
        delete ret.__v
        return ret
      },
    },
  }
)

const User = mongoose.model('User', userSchema)

export default User