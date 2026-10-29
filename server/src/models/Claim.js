const mongoose = require('mongoose');
const { CLAIM_STATUS, CLAIM_CATEGORIES, SETTLEMENT_STATUS } = require('../config/config');

const timelineItemSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    changedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    action: {
      type: String,
      required: true
    },
    comment: {
      type: String,
      default: ''
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const claimSchema = new mongoose.Schema(
  {
    claimReference: {
      type: String,
      required: [true, 'Claim reference is required'],
      unique: true,
      trim: true,
      uppercase: true
    },
    policyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Policy',
      required: [true, 'Associated policy is required']
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
    incidentDate: {
      type: Date,
      required: [true, 'Incident date is required']
    },
    incidentLocation: {
      type: String,
      required: [true, 'Incident location is required'],
      trim: true
    },
    incidentDescription: {
      type: String,
      required: [true, 'Incident description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters']
    },
    claimedAmount: {
      type: Number,
      required: [true, 'Claimed amount is required'],
      min: [1, 'Claimed amount must be greater than zero']
    },
    approvedAmount: {
      type: Number,
      default: null,
      min: [0, 'Approved amount cannot be negative']
    },
    currency: {
      type: String,
      default: 'USD',
      trim: true
    },
    status: {
      type: String,
      enum: Object.values(CLAIM_STATUS),
      default: CLAIM_STATUS.SUBMITTED
    },
    fraudRiskFlag: {
      isFlagged: { type: Boolean, default: false },
      reason: { type: String, default: '' },
      flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      flaggedAt: { type: Date, default: null },
      findings: { type: String, default: '' },
      clearedAt: { type: Date, default: null },
      clearedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    assignedOfficer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    assignedInvestigator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewNotes: {
      type: String,
      default: ''
    },
    missingInfoRequested: {
      type: String,
      default: ''
    },
    decisionReason: {
      type: String,
      default: ''
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    },
    settlementDetails: {
      status: {
        type: String,
        enum: Object.values(SETTLEMENT_STATUS),
        default: SETTLEMENT_STATUS.NOT_APPLICABLE
      },
      transactionReference: {
        type: String,
        trim: true,
        default: ''
      },
      paymentDate: {
        type: Date,
        default: null
      },
      paymentMethod: {
        type: String,
        enum: ['Bank Transfer', 'Electronic Wire', 'Direct Deposit', 'Cheque', 'Simulated Clearinghouse'],
        default: 'Simulated Clearinghouse'
      },
      failureReason: {
        type: String,
        default: ''
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      updatedAt: {
        type: Date,
        default: null
      }
    },
    timeline: [timelineItemSchema],
    isDemo: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes for high-performance claim queries
claimSchema.index({ policyholderId: 1, status: 1 });
claimSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Claim', claimSchema);
