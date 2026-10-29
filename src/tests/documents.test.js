const request = require('supertest');
const app = require('../app');
const { setupTestDB, createTestUser } = require('./testHelper');
const Policy = require('../models/Policy');
const Claim = require('../models/Claim');
const Document = require('../models/Document');
const { ROLES, CLAIM_STATUS } = require('../config/config');
const fs = require('fs');
const path = require('path');

setupTestDB();

describe('Document Upload & Security Tests', () => {
  let policyholderA, tokenA;
  let policyholderB, tokenB;
  let policyA, claimA;
  const dummyPdfPath = path.join(__dirname, 'test-sample.pdf');
  const dummyTextPath = path.join(__dirname, 'test-bad.sh');

  beforeAll(() => {
    // Create dummy files for testing
    fs.writeFileSync(dummyPdfPath, '%PDF-1.4 test dummy content for unit test');
    fs.writeFileSync(dummyTextPath, '#!/bin/sh echo bad file');
  });

  afterAll(() => {
    if (fs.existsSync(dummyPdfPath)) fs.unlinkSync(dummyPdfPath);
    if (fs.existsSync(dummyTextPath)) fs.unlinkSync(dummyTextPath);
  });

  beforeEach(async () => {
    const resA = await createTestUser({ role: ROLES.POLICYHOLDER, email: 'alice.doc@test.com' });
    policyholderA = resA.user;
    tokenA = resA.token;

    const resB = await createTestUser({ role: ROLES.POLICYHOLDER, email: 'bob.doc@test.com' });
    policyholderB = resB.user;
    tokenB = resB.token;

    policyA = await Policy.create({
      policyNumber: 'POL-DOC-001',
      policyholderId: policyholderA._id,
      category: 'Motor Insurance',
      planName: 'Sample Policy'
    });

    claimA = await Claim.create({
      claimReference: 'CLM-DOC-001',
      policyId: policyA._id,
      policyholderId: policyholderA._id,
      category: 'Motor Insurance',
      incidentDate: new Date('2026-10-01'),
      incidentLocation: 'Test Location',
      incidentDescription: 'Test Description of damage',
      claimedAmount: 1000,
      status: CLAIM_STATUS.SUBMITTED
    });
  });

  it('should reject upload request when no file is provided', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('claimId', String(claimA._id))
      .field('documentType', 'Repair Estimate');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/No file was uploaded/i);
  });

  it('should reject invalid file types (e.g. .sh or unapproved executables)', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('claimId', String(claimA._id))
      .attach('file', dummyTextPath);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid file type/i);
  });

  it('should successfully upload a valid document (e.g. PDF)', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${tokenA}`)
      .field('claimId', String(claimA._id))
      .field('documentType', 'Repair Estimate')
      .field('notes', 'Official repair estimate from mechanic')
      .attach('file', dummyPdfPath);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.document.originalName).toBe('test-sample.pdf');
    expect(res.body.document.storageFileName).toBeDefined();

    // Clean up uploaded file
    if (res.body.document.filePath && fs.existsSync(res.body.document.filePath)) {
      fs.unlinkSync(res.body.document.filePath);
    }
  });

  it('should prevent user from downloading documents from another user’s claim', async () => {
    // Create a document belonging to Alice's claim
    const doc = await Document.create({
      claimId: claimA._id,
      uploadedBy: policyholderA._id,
      originalName: 'confidential-police-report.pdf',
      storageFileName: 'fake-stored-file.pdf',
      filePath: dummyPdfPath,
      mimeType: 'application/pdf',
      fileSize: 1024,
      documentType: 'Police Report'
    });

    // Bob tries to download Alice's document
    const res = await request(app)
      .get(`/api/documents/${doc._id}/download`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Access denied/i);
  });
});

