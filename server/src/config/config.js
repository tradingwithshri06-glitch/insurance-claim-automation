const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const ROLES = {
  POLICYHOLDER: 'Policyholder',
  CLAIMS_OFFICER: 'Claims Officer',
  INVESTIGATOR: 'Investigator',
  APPROVER: 'Approver',
  FINANCE_STAFF: 'Finance Staff',
  ADMINISTRATOR: 'Administrator'
};

const CLAIM_STATUS = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  NEEDS_CORRECTION: 'Needs Correction',
  UNDER_INVESTIGATION: 'Under Investigation',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SETTLEMENT_PENDING: 'Settlement Pending',
  SETTLED: 'Settled',
  CLOSED: 'Closed'
};

const SETTLEMENT_STATUS = {
  NOT_APPLICABLE: 'Not Applicable',
  PENDING: 'Pending',
  PROCESSING: 'Processing',
  PAID: 'Paid',
  FAILED: 'Failed'
};

const CLAIM_CATEGORIES = {
  MOTOR: 'Motor Insurance',
  HOME: 'Home & Property Insurance',
  HEALTH: 'Health & Medical Insurance',
  TRAVEL: 'Travel Insurance',
  COMMERCIAL: 'Commercial Insurance'
};

const DOCUMENT_TYPES = {
  POLICE_REPORT: 'Police Report',
  DAMAGE_PHOTO: 'Damage Photograph',
  REPAIR_ESTIMATE: 'Repair Estimate',
  MEDICAL_REPORT: 'Medical Report',
  ID_PROOF: 'Identity Proof',
  INVOICE: 'Payment Receipt / Invoice',
  OTHER: 'Other Supporting Document'
};

module.exports = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017/insurance_claims_db',
  USE_MEMORY_DB_FALLBACK: process.env.USE_MEMORY_DB_FALLBACK === 'true',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret_for_insurance_claim_system_2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  UPLOAD_DIR: path.resolve(__dirname, '../../uploads'),
  MAX_FILE_SIZE_BYTES: (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 5) * 1024 * 1024,
  ROLES,
  CLAIM_STATUS,
  SETTLEMENT_STATUS,
  CLAIM_CATEGORIES,
  DOCUMENT_TYPES
};

