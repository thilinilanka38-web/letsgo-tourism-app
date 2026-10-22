const mongoose = require('mongoose');

const DestinationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Destination name is required'],
      trim: true,
    },
    categoryId: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Religious / Heritage',
        'Cultural / Museum',
        'Restaurant / Cafe',
        'Waterfall / Natural',
        'Beach',
      ],
    },
    latitude: {
      type: Number,
      required: true,
      min: 5.8,
      max: 6.6,
    },
    longitude: {
      type: Number,
      required: true,
      min: 79.9,
      max: 80.4,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
      },
    },
    operatingHours: {
      type: String,
      required: true,
      default: '08:00 AM - 06:00 PM',
    },
    description: {
      type: String,
      required: true,
      minlength: 20,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    recommendedStayMinutes: {
      type: Number,
      default: 60,
    },
    distanceFromMadakumburaKm: {
      type: Number,
      default: 0,
    },
    address: {
      type: String,
      default: '',
    },
    contactNumber: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

DestinationSchema.pre('validate', function (next) {
  if (this.longitude != null && this.latitude != null) {
    this.location = {
      type: 'Point',
      coordinates: [this.longitude, this.latitude],
    };
  }
  next();
});

DestinationSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Destination', DestinationSchema);
