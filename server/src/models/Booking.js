import mongoose from 'mongoose'

// A small copy of the service details, frozen at booking time
const serviceSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Service name is required'], trim: true },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [15, 'Duration must be at least 15 minutes'],
    },
    priceCents: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
  },
  { _id: false } // no separate id needed for the snapshot
)

const bookingSchema = new mongoose.Schema(
  {
    // Set by the server from the login token, never from the request body
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service is required'],
    },
    serviceSnapshot: {
      type: serviceSnapshotSchema,
      required: [true, 'Service snapshot is required'],
    },
    // Stored as UTC dates. The API sends and receives ISO 8601 strings.
    startTime: {
      type: Date,
      required: [true, 'Start time is required'],
    },
    // Computed by the server: startTime plus the service duration
    endTime: {
      type: Date,
      required: [true, 'End time is required'],
      validate: {
        validator: function (value) {
          return !this.startTime || value > this.startTime
        },
        message: 'End time must be after start time',
      },
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'completed', 'cancelled'],
        message: 'Status must be confirmed, completed or cancelled',
      },
      default: 'confirmed',
    },
    customerNote: {
      type: String,
      trim: true,
      maxlength: [300, 'Note must be at most 300 characters'],
    },
    cancelledAt: {
      type: Date,
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

// Customer dashboard: "my bookings, sorted by time"
bookingSchema.index({ user: 1, startTime: 1 })

// Admin list sorted by time, and the overlap check on the single calendar
bookingSchema.index({ startTime: 1 })

const Booking = mongoose.model('Booking', bookingSchema)

export default Booking