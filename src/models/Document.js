const mongoose = require('mongoose');
const { DOCUMENT_TYPES } = require('../config/config');

const documentSchema = new mongoose.Schema(
  {
    claimId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
      required: [true, 'Associated claim is required']
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Uploader reference is required']
    },
    originalName: {
      type: String,
      required: [true, 'Original file name is required'],
      trim: true
    },
    storageFileName: {
      type: String,
      required: [true, 'Storage file name is required'],
      unique: true
    },
    filePath: {
      type: String,
      required: [true, 'File path is required']
    },
    mimeType: {
      type: String,
      required: [true, 'MIME type is required']
    },
    fileSize: {
      type: Number,
      required: [true, 'File size is required']
    },
    documentType: {
      type: String,
      enum: Object.values(DOCUMENT_TYPES),
      default: DOCUMENT_TYPES.OTHER
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    verifiedAt: {
      type: Date,
      default: null
    },
    notes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

documentSchema.index({ claimId: 1, createdAt: -1 });

module.exports = mongoose.model('Document', documentSchema);

