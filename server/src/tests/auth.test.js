const request = require('supertest');
const app = require('../app');
const { setupTestDB, createTestUser } = require('./testHelper');
const User = require('../models/User');

setupTestDB();

describe('Authentication & User Registration Tests', () => {
  it('should successfully register a new policyholder with valid data', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Jane Doe',
        email: 'jane.doe@example.com',
        password: 'Password123!',
        phone: '1234567890'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('jane.doe@example.com');
    expect(res.body.user.role).toBe('Policyholder');

    // Confirm stored in DB with hashed password
    const userInDb = await User.findOne({ email: 'jane.doe@example.com' });
    expect(userInDb).toBeDefined();
    expect(userInDb.password).not.toBe('Password123!');
  });

  it('should reject registration with invalid email or short password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Jane Doe',
        email: 'not-an-email',
        password: '123'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toBeDefined();
  });

  it('should prevent privilege escalation: public registration role parameter is strictly Policyholder', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Hacker User',
        email: 'hacker@example.com',
        password: 'Password123!',
        role: 'Administrator' // Attempting to escalate role
      });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('Policyholder');

    const savedUser = await User.findOne({ email: 'hacker@example.com' });
    expect(savedUser.role).toBe('Policyholder');
  });

  it('should reject duplicate email registration with 409 Conflict', async () => {
    await createTestUser({ email: 'duplicate@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        fullName: 'Duplicate Person',
        email: 'duplicate@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('should successfully log in with valid credentials', async () => {
    await createTestUser({ email: 'loginuser@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'loginuser@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('loginuser@example.com');
  });

  it('should reject login with invalid password', async () => {
    await createTestUser({ email: 'wrongpass@example.com', password: 'Password123!' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrongpass@example.com',
        password: 'WrongPassword999!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/Invalid email or password/i);
  });

  it('should reject login with non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'nobody@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return authenticated user profile at /api/auth/me', async () => {
    const { token, user } = await createTestUser();

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(user.email);
  });

  it('should reject /api/auth/me request without token with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

