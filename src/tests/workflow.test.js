const request = require('supertest');
const app = require('../app');
const { setupTestDB, createTestUser } = require('./testHelper');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const { ROLES, CLAIM_STATUS, SETTLEMENT_STATUS } = require('../config/config');

setupTestDB();

describe('Claim Workflow & Role-Based Decision Tests', () => {
  let policyholder, holderToken;
  let claimsOfficer, officerToken;
  let approver, approverToken;
  let financeStaff, financeToken;
  let policy, testClaim;

  beforeEach(async () => {
    const holderRes = await createTestUser({ role: ROLES.POLICYHOLDER, email: 'holder@test.com' });
    policyholder = holderRes.user;
    holderToken = holderRes.token;

    const officerRes = await createTestUser({ role: ROLES.CLAIMS_OFFICER, email: 'officer@test.com' });
    claimsOfficer = officerRes.user;
    officerToken = officerRes.token;

    const approverRes = await createTestUser({ role: ROLES.APPROVER, email: 'approver@test.com' });
    approver = approverRes.user;
    approverToken = approverRes.token;

    const financeRes = await createTestUser({ role: ROLES.FINANCE_STAFF, email: 'finance@test.com' });
    financeStaff = financeRes.user;
    financeToken = financeRes.token;

    policy = await Policy.create({
      policyNumber: 'POL-WORKFLOW-01',
      policyholderId: policyholder._id,
      category: 'Motor Insurance',
      planName: 'Comprehensive Test Policy',
      status: 'Active'
    });

    testClaim = await Claim.create({
      claimReference: 'CLM-2026-WF001',
      policyId: policy._id,
      policyholderId: policyholder._id,
      category: 'Motor Insurance',
      incidentDate: new Date('2026-10-01'),
      incidentLocation: 'Downtown Highway',
      incidentDescription: 'Front fender dented in parking lot.',
      claimedAmount: 2500.0,
      status: CLAIM_STATUS.SUBMITTED
    });
  });

  it('should allow Claims Officer to move claim from Submitted to Under Review', async () => {
    const res = await request(app)
      .patch(`/api/claims/${testClaim._id}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        status: CLAIM_STATUS.UNDER_REVIEW,
        comment: 'Assigned to officer desk for document inspection.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.status).toBe(CLAIM_STATUS.UNDER_REVIEW);
    expect(res.body.claim.timeline.length).toBeGreaterThan(0);
  });

  it('should block Policyholder from attempting an approval action with 403 Forbidden', async () => {
    testClaim.status = CLAIM_STATUS.UNDER_REVIEW;
    await testClaim.save();

    const res = await request(app)
      .post(`/api/claims/${testClaim._id}/decision`)
      .set('Authorization', `Bearer ${holderToken}`)
      .send({
        decision: 'APPROVE',
        decisionReason: 'Self-approving my claim',
        approvedAmount: 2500.0
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should reject invalid workflow transitions (e.g. Submitted -> Settled) with 400 Bad Request', async () => {
    // Attempting an illegal skip directly from Submitted to Settled
    const res = await request(app)
      .patch(`/api/claims/${testClaim._id}/status`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        status: CLAIM_STATUS.SETTLED,
        comment: 'Attempting invalid skip'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid transition/i);
  });

  it('should allow Claims Officer to request missing info and set status to Needs Correction', async () => {
    testClaim.status = CLAIM_STATUS.UNDER_REVIEW;
    await testClaim.save();

    const res = await request(app)
      .post(`/api/claims/${testClaim._id}/request-info`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({
        missingInfoRequested: 'Please provide certified body shop repair estimate.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.status).toBe(CLAIM_STATUS.NEEDS_CORRECTION);
    expect(res.body.claim.missingInfoRequested).toBe('Please provide certified body shop repair estimate.');
  });

  it('should allow Approver to approve an Under Review claim and advance to Settlement Pending', async () => {
    testClaim.status = CLAIM_STATUS.UNDER_REVIEW;
    await testClaim.save();

    const res = await request(app)
      .post(`/api/claims/${testClaim._id}/decision`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({
        decision: 'APPROVE',
        decisionReason: 'Eligible damage verified against policy coverage.',
        approvedAmount: 2200.0
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.status).toBe(CLAIM_STATUS.SETTLEMENT_PENDING);
    expect(res.body.claim.approvedAmount).toBe(2200.0);
    expect(res.body.claim.decidedBy).toBeDefined();
  });

  it('should allow Approver to reject an Under Review claim with reason', async () => {
    testClaim.status = CLAIM_STATUS.UNDER_REVIEW;
    await testClaim.save();

    const res = await request(app)
      .post(`/api/claims/${testClaim._id}/decision`)
      .set('Authorization', `Bearer ${approverToken}`)
      .send({
        decision: 'REJECT',
        decisionReason: 'Incident excluded by policy clause 3.1.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.status).toBe(CLAIM_STATUS.REJECTED);
    expect(res.body.claim.decisionReason).toMatch(/clause 3.1/i);
  });

  it('should forbid settlement before approval with 400 Bad Request', async () => {
    // testClaim is currently in 'Submitted' status (not approved)
    const res = await request(app)
      .patch(`/api/claims/${testClaim._id}/settlement`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        status: SETTLEMENT_STATUS.PAID,
        transactionReference: 'TX-EARLY-FAIL',
        paymentMethod: 'Direct Deposit'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot be settled before approval/i);
  });

  it('should allow Finance Staff to settle an approved claim to Paid', async () => {
    // Set claim to Settlement Pending
    testClaim.status = CLAIM_STATUS.SETTLEMENT_PENDING;
    testClaim.approvedAmount = 2000.0;
    await testClaim.save();

    const res = await request(app)
      .patch(`/api/claims/${testClaim._id}/settlement`)
      .set('Authorization', `Bearer ${financeToken}`)
      .send({
        status: SETTLEMENT_STATUS.PAID,
        transactionReference: 'SIM-WIRE-2026-99999',
        paymentMethod: 'Bank Transfer'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.status).toBe(CLAIM_STATUS.SETTLED);
    expect(res.body.claim.settlementDetails.status).toBe(SETTLEMENT_STATUS.PAID);
    expect(res.body.claim.settlementDetails.transactionReference).toBe('SIM-WIRE-2026-99999');
  });
});

