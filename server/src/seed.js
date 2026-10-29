const mongoose = require('mongoose');
const { connectDB, disconnectDB } = require('./config/db');
const User = require('./models/User');
const Policy = require('./models/Policy');
const Claim = require('./models/Claim');
const Document = require('./models/Document');
const Notification = require('./models/Notification');
const AuditLog = require('./models/AuditLog');
const { ROLES, CLAIM_STATUS, SETTLEMENT_STATUS, CLAIM_CATEGORIES, DOCUMENT_TYPES } = require('./config/config');

const seedDatabase = async () => {
  try {
    console.log('[Seed] Connecting to database...');
    await connectDB();

    console.log('[Seed] Clearing existing demonstration collections...');
    await Promise.all([
      User.deleteMany({}),
      Policy.deleteMany({}),
      Claim.deleteMany({}),
      Document.deleteMany({}),
      Notification.deleteMany({}),
      AuditLog.deleteMany({})
    ]);

    console.log('[Seed] Creating demo users for all 6 roles...');
    const defaultPassword = 'Password123!';

    // 1. Administrator
    const adminUser = await User.create({
      fullName: 'System Administrator (Demo)',
      email: 'admin@insurance.demo',
      password: defaultPassword,
      role: ROLES.ADMINISTRATOR,
      phone: '+1 (555) 019-2831',
      address: 'Corporate Headquarters, Financial District, New York, NY',
      status: 'Active'
    });

    // 2. Claims Officer
    const claimsOfficer = await User.create({
      fullName: 'Sarah Jenkins (Claims Officer)',
      email: 'officer@insurance.demo',
      password: defaultPassword,
      role: ROLES.CLAIMS_OFFICER,
      phone: '+1 (555) 019-3344',
      address: 'Claims Operations Center, Boston, MA',
      status: 'Active'
    });

    // 3. Fraud Investigator
    const investigator = await User.create({
      fullName: 'Marcus Vance (Special Investigator)',
      email: 'investigator@insurance.demo',
      password: defaultPassword,
      role: ROLES.INVESTIGATOR,
      phone: '+1 (555) 019-4455',
      address: 'Special Investigations Unit, Chicago, IL',
      status: 'Active'
    });

    // 4. Approver
    const approver = await User.create({
      fullName: 'Eleanor Vance (Senior Approver)',
      email: 'approver@insurance.demo',
      password: defaultPassword,
      role: ROLES.APPROVER,
      phone: '+1 (555) 019-5566',
      address: 'Underwriting & Decisions Desk, Philadelphia, PA',
      status: 'Active'
    });

    // 5. Finance Staff
    const financeStaff = await User.create({
      fullName: 'David Sterling (Disbursements Officer)',
      email: 'finance@insurance.demo',
      password: defaultPassword,
      role: ROLES.FINANCE_STAFF,
      phone: '+1 (555) 019-6677',
      address: 'Treasury & Settlements Department, Charlotte, NC',
      status: 'Active'
    });

    // 6. Policyholder 1
    const policyholder1 = await User.create({
      fullName: 'Alex Morgan (Policyholder)',
      email: 'policyholder@insurance.demo',
      password: defaultPassword,
      role: ROLES.POLICYHOLDER,
      phone: '+1 (555) 019-7788',
      address: '742 Evergreen Terrace, Springfield, OR',
      status: 'Active'
    });

    // Policyholder 2 (to verify privacy isolation tests)
    const policyholder2 = await User.create({
      fullName: 'Jordan Taylor (Policyholder 2)',
      email: 'jordan@insurance.demo',
      password: defaultPassword,
      role: ROLES.POLICYHOLDER,
      phone: '+1 (555) 019-8899',
      address: '10880 Wilshire Blvd, Los Angeles, CA',
      status: 'Active'
    });

    console.log('[Seed] Creating demo policies...');
    const policy1 = await Policy.create({
      policyNumber: 'POL-MOT-2026-001',
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      planName: 'Comprehensive Motor Protection Gold',
      vehicleDetails: {
        make: 'Tesla',
        model: 'Model 3 Long Range',
        year: 2023,
        registrationNumber: '7XYZ890',
        vinNumber: '5YJ3E1EB7NF123456'
      },
      coverageDetails: {
        deductible: 500,
        maxCoverageLimit: 65000,
        currency: 'USD'
      },
      status: 'Active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2027-01-01'),
      isDemo: true
    });

    const policy2 = await Policy.create({
      policyNumber: 'POL-MOT-2026-002',
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      planName: 'Standard Vehicle Collision Coverage',
      vehicleDetails: {
        make: 'Toyota',
        model: 'RAV4 Hybrid',
        year: 2022,
        registrationNumber: '6ABC123',
        vinNumber: '2T3P1RFV5NW654321'
      },
      coverageDetails: {
        deductible: 250,
        maxCoverageLimit: 38000,
        currency: 'USD'
      },
      status: 'Active',
      startDate: new Date('2026-02-15'),
      endDate: new Date('2027-02-15'),
      isDemo: true
    });

    const policy3 = await Policy.create({
      policyNumber: 'POL-HOM-2026-003',
      policyholderId: policyholder2._id,
      category: CLAIM_CATEGORIES.HOME,
      planName: 'Premium Homeowners All-Risk Protection',
      propertyDetails: {
        address: '10880 Wilshire Blvd, Los Angeles, CA',
        propertyType: 'Single Family Residence'
      },
      coverageDetails: {
        deductible: 1000,
        maxCoverageLimit: 450000,
        currency: 'USD'
      },
      status: 'Active',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2027-03-01'),
      isDemo: true
    });

    console.log('[Seed] Creating demo claims across varied workflow stages...');

    // Claim 1: Submitted (Fresh claim by Alex Morgan)
    const claimSubmitted = await Claim.create({
      claimReference: 'CLM-2026-100001',
      policyId: policy1._id,
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      incidentDate: new Date('2026-10-20T14:30:00Z'),
      incidentLocation: 'Interstate 80 East, Exit 42, Sacramento, CA',
      incidentDescription:
        'Rear bumper damaged while stationary in stop-and-go traffic when the vehicle behind failed to brake in time. Tail lights cracked and trunk panel misaligned.',
      claimedAmount: 3450.0,
      currency: 'USD',
      status: CLAIM_STATUS.SUBMITTED,
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: policyholder1._id,
          action: 'Claim Submitted',
          comment: 'Submitted initial claim with photos of rear bumper damage.',
          timestamp: new Date('2026-10-20T16:00:00Z')
        }
      ]
    });

    // Claim 2: Under Review (Assigned to Sarah Jenkins)
    const claimUnderReview = await Claim.create({
      claimReference: 'CLM-2026-100002',
      policyId: policy2._id,
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      incidentDate: new Date('2026-10-14T09:15:00Z'),
      incidentLocation: 'Downtown Commercial Parking Garage, San Francisco, CA',
      incidentDescription:
        'Front left quarter panel dented and driver side mirror sheared off by an unknown parking vehicle while driver was away from vehicle.',
      claimedAmount: 1850.0,
      currency: 'USD',
      status: CLAIM_STATUS.UNDER_REVIEW,
      assignedOfficer: claimsOfficer._id,
      reviewNotes: 'Policy active, coverage limit verified. Reviewing photos and security parking ticket.',
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: policyholder1._id,
          action: 'Claim Submitted',
          comment: 'Parked car collision report submitted.',
          timestamp: new Date('2026-10-14T11:00:00Z')
        },
        {
          status: CLAIM_STATUS.UNDER_REVIEW,
          changedBy: claimsOfficer._id,
          action: 'Under Review',
          comment: 'Claims officer assigned. Reviewing policy limits and damage assessment.',
          timestamp: new Date('2026-10-15T09:30:00Z')
        }
      ]
    });

    // Claim 3: Needs Correction
    const claimNeedsCorrection = await Claim.create({
      claimReference: 'CLM-2026-100003',
      policyId: policy1._id,
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      incidentDate: new Date('2026-10-10T18:45:00Z'),
      incidentLocation: 'Oak Street & 5th Ave Intersection, Portland, OR',
      incidentDescription:
        'Side-swipe incident causing deep scratch down passenger side doors and wheel rim scrape.',
      claimedAmount: 4200.0,
      currency: 'USD',
      status: CLAIM_STATUS.NEEDS_CORRECTION,
      assignedOfficer: claimsOfficer._id,
      missingInfoRequested:
        'Please upload a certified body shop repair estimate and a clear photograph of the police incident blotter number.',
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: policyholder1._id,
          action: 'Claim Submitted',
          comment: 'Side scrape collision submitted.',
          timestamp: new Date('2026-10-10T19:00:00Z')
        },
        {
          status: CLAIM_STATUS.UNDER_REVIEW,
          changedBy: claimsOfficer._id,
          action: 'Under Review',
          comment: 'Assessment in progress.',
          timestamp: new Date('2026-10-11T10:00:00Z')
        },
        {
          status: CLAIM_STATUS.NEEDS_CORRECTION,
          changedBy: claimsOfficer._id,
          action: 'Missing Information Requested',
          comment: 'Official body shop repair itemized estimate required for claim processing.',
          timestamp: new Date('2026-10-11T14:30:00Z')
        }
      ]
    });

    // Claim 4: Under Investigation (Flagged for fraud risk check)
    const claimInvestigating = await Claim.create({
      claimReference: 'CLM-2026-100004',
      policyId: policy3._id,
      policyholderId: policyholder2._id,
      category: CLAIM_CATEGORIES.HOME,
      incidentDate: new Date('2026-10-05T22:00:00Z'),
      incidentLocation: '10880 Wilshire Blvd, Los Angeles, CA',
      incidentDescription:
        'Basement water pipe burst resulting in damage to stored electronics and vintage furniture.',
      claimedAmount: 28500.0,
      currency: 'USD',
      status: CLAIM_STATUS.UNDER_INVESTIGATION,
      assignedOfficer: claimsOfficer._id,
      assignedInvestigator: investigator._id,
      fraudRiskFlag: {
        isFlagged: true,
        reason: 'Claim amount is unusually close to maximum single-item category limit and submitted shortly after policy inception date. Routine verification required.',
        flaggedBy: claimsOfficer._id,
        flaggedAt: new Date('2026-10-06T11:00:00Z'),
        findings: 'Preliminary site inspection scheduled. Plumber invoices under verification with contractor licensing board.'
      },
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: policyholder2._id,
          action: 'Claim Submitted',
          comment: 'Water damage claim submitted.',
          timestamp: new Date('2026-10-05T23:00:00Z')
        },
        {
          status: CLAIM_STATUS.UNDER_REVIEW,
          changedBy: claimsOfficer._id,
          action: 'Under Review',
          comment: 'High-value property claim reviewed.',
          timestamp: new Date('2026-10-06T09:00:00Z')
        },
        {
          status: CLAIM_STATUS.UNDER_INVESTIGATION,
          changedBy: claimsOfficer._id,
          action: 'Flagged for Investigation',
          comment: 'Dispatched to Special Investigations Unit for independent adjuster verification.',
          timestamp: new Date('2026-10-06T11:00:00Z')
        }
      ]
    });

    // Claim 5: Approved / Settlement Pending
    const claimSettlementPending = await Claim.create({
      claimReference: 'CLM-2026-100005',
      policyId: policy1._id,
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      incidentDate: new Date('2026-09-28T12:00:00Z'),
      incidentLocation: 'Route 101 Northbound, Palo Alto, CA',
      incidentDescription:
        'Windshield cracked by flying gravel from an uncovered gravel hauler. Requires complete OEM replacement and sensor recalibration.',
      claimedAmount: 1450.0,
      approvedAmount: 1200.0,
      currency: 'USD',
      status: CLAIM_STATUS.SETTLEMENT_PENDING,
      assignedOfficer: claimsOfficer._id,
      decidedBy: approver._id,
      decidedAt: new Date('2026-10-01T15:00:00Z'),
      decisionReason:
        'Approved in accordance with Glass & Sensor Recalibration schedule minus applicable $250 deductible.',
      settlementDetails: {
        status: SETTLEMENT_STATUS.PENDING,
        transactionReference: '',
        paymentMethod: 'Simulated Clearinghouse'
      },
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: policyholder1._id,
          action: 'Claim Submitted',
          comment: 'Windshield repair claim submitted.',
          timestamp: new Date('2026-09-28T13:00:00Z')
        },
        {
          status: CLAIM_STATUS.UNDER_REVIEW,
          changedBy: claimsOfficer._id,
          action: 'Under Review',
          comment: 'OEM glass quote validated.',
          timestamp: new Date('2026-09-29T10:00:00Z')
        },
        {
          status: CLAIM_STATUS.APPROVED,
          changedBy: approver._id,
          action: 'Claim Approved',
          comment: 'Approved for $1,200.00 after deductible.',
          timestamp: new Date('2026-10-01T15:00:00Z')
        },
        {
          status: CLAIM_STATUS.SETTLEMENT_PENDING,
          changedBy: approver._id,
          action: 'Sent to Finance',
          comment: 'Queued for electronic disbursement.',
          timestamp: new Date('2026-10-01T15:05:00Z')
        }
      ]
    });

    // Claim 6: Settled (Fully paid)
    const claimSettled = await Claim.create({
      claimReference: 'CLM-2026-100006',
      policyId: policy2._id,
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      incidentDate: new Date('2026-09-10T08:30:00Z'),
      incidentLocation: 'Highway 99, Fresno, CA',
      incidentDescription:
        'Pothole impact damaged front right alloy wheel and tire sidewall.',
      claimedAmount: 950.0,
      approvedAmount: 700.0,
      currency: 'USD',
      status: CLAIM_STATUS.SETTLED,
      assignedOfficer: claimsOfficer._id,
      decidedBy: approver._id,
      decidedAt: new Date('2026-09-14T11:00:00Z'),
      decisionReason: 'Replacement rim and tire costs approved per policy terms.',
      settlementDetails: {
        status: SETTLEMENT_STATUS.PAID,
        transactionReference: 'SIM-WIRE-20260915-99812',
        paymentDate: new Date('2026-09-15T14:30:00Z'),
        paymentMethod: 'Direct Deposit',
        updatedBy: financeStaff._id,
        updatedAt: new Date('2026-09-15T14:30:00Z')
      },
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: policyholder1._id,
          action: 'Claim Submitted',
          comment: 'Tire damage claim.',
          timestamp: new Date('2026-09-10T10:00:00Z')
        },
        {
          status: CLAIM_STATUS.APPROVED,
          changedBy: approver._id,
          action: 'Claim Approved',
          comment: 'Approved $700.00.',
          timestamp: new Date('2026-09-14T11:00:00Z')
        },
        {
          status: CLAIM_STATUS.SETTLED,
          changedBy: financeStaff._id,
          action: 'Settlement Disbursed',
          comment: 'Simulated payment processed via Direct Deposit. Ref: SIM-WIRE-20260915-99812',
          timestamp: new Date('2026-09-15T14:30:00Z')
        }
      ]
    });

    // Claim 7: Rejected
    const claimRejected = await Claim.create({
      claimReference: 'CLM-2026-100007',
      policyId: policy2._id,
      policyholderId: policyholder1._id,
      category: CLAIM_CATEGORIES.MOTOR,
      incidentDate: new Date('2026-08-20T17:00:00Z'),
      incidentLocation: 'Private Off-Road Track, Reno, NV',
      incidentDescription:
        'Transmission overheating and clutch wear sustained while participating in off-road competition.',
      claimedAmount: 6200.0,
      currency: 'USD',
      status: CLAIM_STATUS.REJECTED,
      assignedOfficer: claimsOfficer._id,
      decidedBy: approver._id,
      decidedAt: new Date('2026-08-25T16:00:00Z'),
      decisionReason:
        'Excluded under Section 4.2 of Policy Terms: Commercial racing, off-road trials, and speed competitions are strictly not covered under standard motor policy.',
      isDemo: true,
      timeline: [
        {
          status: CLAIM_STATUS.SUBMITTED,
          changedBy: policyholder1._id,
          action: 'Claim Submitted',
          comment: 'Mechanical failure claim.',
          timestamp: new Date('2026-08-21T09:00:00Z')
        },
        {
          status: CLAIM_STATUS.REJECTED,
          changedBy: approver._id,
          action: 'Claim Rejected',
          comment: 'Off-road events excluded from policy coverage.',
          timestamp: new Date('2026-08-25T16:00:00Z')
        }
      ]
    });

    console.log('[Seed] Creating demo notifications...');
    await Notification.create([
      {
        recipient: policyholder1._id,
        title: 'Action Required: Additional Information Requested',
        message: `Your claim ${claimNeedsCorrection.claimReference} requires additional details: ${claimNeedsCorrection.missingInfoRequested}`,
        type: 'DOCUMENT_REQUEST',
        relatedClaimId: claimNeedsCorrection._id,
        isRead: false
      },
      {
        recipient: policyholder1._id,
        title: 'Claim Approved!',
        message: `Your claim ${claimSettlementPending.claimReference} has been approved for USD 1,200.00. Settlement is in progress.`,
        type: 'APPROVAL',
        relatedClaimId: claimSettlementPending._id,
        isRead: true,
        readAt: new Date('2026-10-02T10:00:00Z')
      },
      {
        recipient: claimsOfficer._id,
        title: 'New Claim Submitted',
        message: `New claim ${claimSubmitted.claimReference} submitted by Alex Morgan is ready for review.`,
        type: 'CLAIM_STATUS',
        relatedClaimId: claimSubmitted._id,
        isRead: false
      }
    ]);

    console.log('[Seed] Creating initial audit entries...');
    await AuditLog.create([
      {
        userEmail: adminUser.email,
        userRole: adminUser.role,
        action: 'SYSTEM_INITIALIZATION',
        resourceType: 'System',
        resourceId: 'INIT-2026',
        details: { message: 'Demonstration environment seeded with default roles and policies.' }
      },
      {
        userEmail: policyholder1.email,
        userRole: policyholder1.role,
        action: 'CLAIM_SUBMISSION',
        resourceType: 'Claim',
        resourceId: String(claimSubmitted._id),
        details: { claimReference: claimSubmitted.claimReference, amount: claimSubmitted.claimedAmount }
      }
    ]);

    console.log('\n========================================================');
    console.log('  Database Seeding Completed Successfully!  ');
    console.log('========================================================');
    console.log('DEMONSTRATION USER ACCOUNTS (Password: Password123!):');
    console.log('--------------------------------------------------------');
    console.log('1. Policyholder:     policyholder@insurance.demo');
    console.log('2. Policyholder 2:   jordan@insurance.demo');
    console.log('3. Claims Officer:   officer@insurance.demo');
    console.log('4. Investigator:     investigator@insurance.demo');
    console.log('5. Approver:         approver@insurance.demo');
    console.log('6. Finance Staff:    finance@insurance.demo');
    console.log('7. Administrator:    admin@insurance.demo');
    console.log('========================================================\n');

    await disconnectDB();
    return true;
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    await disconnectDB();
    process.exit(1);
  }
};

// Execute if run directly from command line
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };

