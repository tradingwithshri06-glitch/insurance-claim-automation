const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const Claim = require('../models/Claim');
const { ROLES } = require('../config/config');
const { recordAudit } = require('../services/auditService');

/**
 * Upload a document for a claim
 */
const uploadDocument = async (req, res, next) => {
  try {
    const { claimId, documentType, notes } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded or file type is not supported.'
      });
    }

    const claim = await Claim.findById(claimId);
    if (!claim) {
      // Remove uploaded file from disk if claim not found
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(404).json({
        success: false,
        message: 'Associated claim was not found.'
      });
    }

    // Role privacy check: policyholder can only upload to their own claim
    if (
      req.user.role === ROLES.POLICYHOLDER &&
      claim.policyholderId.toString() !== req.user._id.toString()
    ) {
      if (req.file.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You cannot upload documents to another user’s claim.'
      });
    }

    const doc = new Document({
      claimId: claim._id,
      uploadedBy: req.user._id,
      originalName: req.file.originalname,
      storageFileName: req.file.filename,
      filePath: req.file.path,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
      documentType: documentType || 'Other Supporting Document',
      notes: notes || ''
    });

    await doc.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'DOCUMENT_UPLOAD',
      resourceType: 'Document',
      resourceId: doc._id,
      details: {
        claimReference: claim.claimReference,
        originalName: doc.originalName,
        documentType: doc.documentType,
        fileSize: doc.fileSize
      }
    });

    return res.status(201).json({
      success: true,
      message: 'Document uploaded securely.',
      document: doc
    });
  } catch (error) {
    if (req.file?.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        // ignore unlink error
      }
    }
    next(error);
  }
};

/**
 * Get all documents for a claim
 */
const getClaimDocuments = async (req, res, next) => {
  try {
    const { claimId } = req.params;
    const claim = await Claim.findById(claimId);

    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found.'
      });
    }

    // Policyholder privacy check
    if (
      req.user.role === ROLES.POLICYHOLDER &&
      claim.policyholderId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot view documents from another user’s claim.'
      });
    }

    const documents = await Document.find({ claimId })
      .populate('uploadedBy', 'fullName email role')
      .populate('verifiedBy', 'fullName email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: documents.length,
      documents
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Stream/download a document securely
 */
const downloadDocument = async (req, res, next) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document record not found.'
      });
    }

    const claim = await Claim.findById(doc.claimId);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Associated claim record not found.'
      });
    }

    // Access authorization check
    if (
      req.user.role === ROLES.POLICYHOLDER &&
      claim.policyholderId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot download documents belonging to another user’s claim.'
      });
    }

    if (!fs.existsSync(doc.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File could not be found on storage system.'
      });
    }

    await recordAudit({
      user: req.user,
      req,
      action: 'DOCUMENT_ACCESS',
      resourceType: 'Document',
      resourceId: doc._id,
      details: { originalName: doc.originalName }
    });

    res.setHeader('Content-Type', doc.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(doc.originalName)}"`
    );

    const fileStream = fs.createReadStream(doc.filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
};

/**
 * Verify a document (Claims Officer / Administrator)
 */
const verifyDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isVerified, notes } = req.body;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.'
      });
    }

    doc.isVerified = isVerified === undefined ? true : Boolean(isVerified);
    doc.verifiedBy = req.user._id;
    doc.verifiedAt = new Date();
    if (notes) doc.notes = notes;

    await doc.save();

    await recordAudit({
      user: req.user,
      req,
      action: 'DOCUMENT_VERIFIED',
      resourceType: 'Document',
      resourceId: doc._id,
      details: { isVerified: doc.isVerified, notes }
    });

    return res.status(200).json({
      success: true,
      message: `Document marked as ${doc.isVerified ? 'Verified' : 'Unverified'}.`,
      document: doc
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadDocument,
  getClaimDocuments,
  downloadDocument,
  verifyDocument
};

