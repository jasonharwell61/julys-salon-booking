import mongoose from 'mongoose'

const isWholeNumber = {
  validator: Number.isInteger,
  message: '{PATH} must be a whole number',
}

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name must be at most 80 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['full-set', 'fill', 'lash-lift', 'removal'],
        message: 'Category must be full-set, fill, lash-lift or removal',
      },
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description must be at most 500 characters'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
      max: [240, 'Duration must be at most 240 minutes'],
      validate: isWholeNumber,
    },
    // Price in cents: 12000 means $120.00. Whole numbers avoid rounding errors.
    priceCents: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
      validate: isWholeNumber,
    },
    // Short keywords the AI recommender can match against, like "natural"
    tags: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }],
      default: [],
      validate: {
        validator: (value) => value.length <= 8,
        message: 'A service can have at most 8 tags',
      },
    },
    // false hides the service from customers without deleting it
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret.__v
        return ret
      },
    },
  }
)

// Supports the public menu query: active services, optionally by category
serviceSchema.index({ isActive: 1, category: 1 })

const Service = mongoose.model('Service', serviceSchema)

export default Service