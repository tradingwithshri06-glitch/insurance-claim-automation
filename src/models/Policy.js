const mongoose = require('mongoose');
const { CLAIM_CATEGORIES } = require('../config/config');

const policySchema = new mongoose.Schema(
  {
    policyNumber: {
      type: String,
      required: [true, 'Policy number is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    policyholderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Policyholder reference is required']
    },
    category: {
      type: String,
      enum: Object.values(CLAIM_CATEGORIES),
      default: CLAIM_CATEGORIES.MOTOR
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required'],
      default: 'Comprehensive Motor Protection Plan'
    },
    vehicleDetails: {
      make: { type: String, trim: true, default: '' },
      model: { type: String, trim: true, default: '' },
      year: { type: Number, default: 2023 },
      registrationNumber: { type: String, trim: true, uppercase: true, default: '' },
      vinNumber: { type: String, trim: true, uppercase: true, default: '' }
    },
    propertyDetails: {
      address: { type: String, trim: true, default: '' },
      propertyType: { type: String, trim: true, default: '' }
    },
    coverageDetails: {
      deductible: { type: Number, default: 250 },
      maxCoverageLimit: { type: Number, default: 50000 },
      currency: { type: String, default: 'USD' }
    },
    status: {
      type: String,
      enum: ['Active', 'Expired', 'Cancelled', 'Suspended'],
      default: 'Active'
    },
    startDate: {
      type: Date,
      default: () => new Date()
    },
    endDate: {
      type: Date,
      default: () => {
        const d = new Date();
        d.setFullYear(d.getFullYear() + 1);
        return d;
      }
    },
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Policy', policySchema);

