const request = require('supertest');
const app = require('../app');
const { setupTestDB, createTestUser } = require('./testHelper');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const { ROLES, CLAIM_STATUS } = require('../config/config');

setupTestDB();

describe('Claim Submission & Access Control Tests', () => {
  let policyholderA, tokenA;
  let policyholderB, tokenB;
  let claimsOfficer, officerToken;
  let policyA;

  beforeEach(async () => {
    const resA = await createTestUser({ role: ROLES.POLICYHOLDER, email: 'alice@example.com' });
    policyholderA = resA.user;
    tokenA = resA.token;

    const resB = await createTestUser({ role: ROLES.POLICYHOLDER, email: 'bob@example.com' });
    policyholderB = resB.user;
    tokenB = resB.token;

    const resOfficer = await createTestUser({ role: ROLES.CLAIMS_OFFICER, email: 'officer@example.com' });
    claimsOfficer = resOfficer.user;
    officerToken = resOfficer.token;

    policyA = await Policy.create({
      policyNumber: 'POL-TEST-001',
      policyholderId: policyholderA._id,
      category: 'Motor Insurance',
      planName: 'Comprehensive Test Policy',
      status: 'Active',
      vehicleDetails: { make: 'Honda', model: 'Civic', year: 2021 }
    });
  });

  it('should successfully submit a claim with valid data', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        policyId: policyA._id,
        category: 'Motor Insurance',
        incidentDate: '2026-10-15',
        incidentLocation: 'Main St & 4th Ave, Seattle',
        incidentDescription: 'Front bumper collided with stationary pole while parking.',
        claimedAmount: 1250.0
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.claimReference).toMatch(/^CLM-\d{4}-\d+/);
    expect(res.body.claim.status).toBe(CLAIM_STATUS.SUBMITTED);
    expect(res.body.claim.claimedAmount).toBe(1250.0);
    expect(res.body.claim.timeline).toHaveLength(1);
  });

  it('should reject claim submission with invalid/missing data', async () => {
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        policyId: policyA._id,
        // missing incidentDate, incidentLocation, description, claimedAmount
        claimedAmount: -50 // invalid negative amount
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should reject claim submission if incident date is in the future', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        policyId: policyA._id,
        incidentDate: futureDate.toISOString(),
        incidentLocation: 'Test Location',
        incidentDescription: 'Incident that has not occurred yet.',
        claimedAmount: 500.0
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should forbid policyholder from claiming against another user’s policy', async () => {
    // Bob attempts to claim against Alice's policy
    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({
        policyId: policyA._id,
        incidentDate: '2026-10-10',
        incidentLocation: 'Bob Location',
        incidentDescription: 'Bob claiming on Alice policy description text.',
        claimedAmount: 800.0
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/cannot submit a claim against a policy that does not belong to you/i);
  });

  it('should prevent Policyholder B from viewing Policyholder A’s claim (Strict Privacy Isolation)', async () => {
    // Alice creates a claim
    const claim = await Claim.create({
      claimReference: 'CLM-2026-999001',
      policyId: policyA._id,
      policyholderId: policyholderA._id,
      category: 'Motor Insurance',
      incidentDate: new Date('2026-10-01'),
      incidentLocation: 'Alice Secret Location',
      incidentDescription: 'Private confidential damage details.',
      claimedAmount: 2000.0,
      status: CLAIM_STATUS.SUBMITTED
    });

    // Bob tries to access Alice's claim directly by ID
    const res = await request(app)
      .get(`/api/claims/${claim._id}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/permission to view another user’s claim/i);
  });

  it('should allow authorized staff (Claims Officer) to view any claim', async () => {
    const claim = await Claim.create({
      claimReference: 'CLM-2026-999002',
      policyId: policyA._id,
      policyholderId: policyholderA._id,
      category: 'Motor Insurance',
      incidentDate: new Date('2026-10-01'),
      incidentLocation: 'Alice Location',
      incidentDescription: 'Alice valid incident details.',
      claimedAmount: 2000.0,
      status: CLAIM_STATUS.SUBMITTED
    });

    const res = await request(app)
      .get(`/api/claims/${claim._id}`)
      .set('Authorization', `Bearer ${officerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.claim.claimReference).toBe('CLM-2026-999002');
  });
});

