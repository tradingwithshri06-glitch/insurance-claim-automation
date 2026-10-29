const request = require('supertest');
const app = require('../app');
const { setupTestDB, createTestUser } = require('./testHelper');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const AuditLog = require('../models/AuditLog');
const { ROLES, CLAIM_STATUS } = require('../config/config');

setupTestDB();

describe('Dashboard Statistics & Audit History Tests', () => {
  let adminUser, adminToken;
  let policyholder, holderToken;
  let policy;

  beforeEach(async () => {
    const adminRes = await createTestUser({ role: ROLES.ADMINISTRATOR, email: 'admin@test.com' });
    adminUser = adminRes.user;
    adminToken = adminRes.token;

    const holderRes = await createTestUser({ role: ROLES.POLICYHOLDER, email: 'alex@test.com' });
    policyholder = holderRes.user;
    holderToken = holderRes.token;

    policy = await Policy.create({
      policyNumber: 'POL-DASH-01',
      policyholderId: policyholder._id,
      category: 'Motor Insurance',
      planName: 'Standard Policy'
    });

    // Create 3 distinct claims with known values
    await Claim.create([
      {
        claimReference: 'CLM-STAT-01',
        policyId: policy._id,
        policyholderId: policyholder._id,
        category: 'Motor Insurance',
        incidentDate: new Date(),
        incidentLocation: 'Street A',
        incidentDescription: 'Collision on highway A',
        claimedAmount: 1000,
        status: CLAIM_STATUS.SUBMITTED
      },
      {
        claimReference: 'CLM-STAT-02',
        policyId: policy._id,
        policyholderId: policyholder._id,
        category: 'Motor Insurance',
        incidentDate: new Date(),
        incidentLocation: 'Street B',
        incidentDescription: 'Parking scrape B',
        claimedAmount: 2000,
        status: CLAIM_STATUS.UNDER_REVIEW
      },
      {
        claimReference: 'CLM-STAT-03',
        policyId: policy._id,
        policyholderId: policyholder._id,
        category: 'Motor Insurance',
        incidentDate: new Date(),
        incidentLocation: 'Street C',
        incidentDescription: 'Fender damage C',
        claimedAmount: 1500,
        approvedAmount: 1500,
        status: CLAIM_STATUS.SETTLED
      }
    ]);
  });

  it('should return real dashboard statistics dynamically calculated from database records', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.stats.totalClaims).toBe(3);
    expect(res.body.stats.submitted).toBe(1);
    expect(res.body.stats.underReview).toBe(1);
    expect(res.body.stats.settled).toBe(1);
    expect(res.body.stats.totalClaimedAmount).toBe(4500);
    expect(res.body.stats.totalSettledAmount).toBe(1500);
    expect(res.body.stats.recentActivity.length).toBe(3);
  });

  it('should verify audit history records are created when sensitive actions occur', async () => {
    // 1. Submit a claim through API
    const submitRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${holderToken}`)
      .send({
        policyId: policy._id,
        incidentDate: '2026-10-10',
        incidentLocation: 'Audit St',
        incidentDescription: 'Incident to trigger audit recording',
        claimedAmount: 750
      });

    expect(submitRes.status).toBe(201);

    // 2. Query audit logs as Administrator
    const auditRes = await request(app)
      .get('/api/audit')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(auditRes.status).toBe(200);
    expect(auditRes.body.success).toBe(true);
    expect(auditRes.body.logs.length).toBeGreaterThan(0);

    const submissionAudit = auditRes.body.logs.find(
      (log) => log.action === 'CLAIM_SUBMISSION'
    );
    expect(submissionAudit).toBeDefined();
    expect(submissionAudit.resourceType).toBe('Claim');
  });
});

