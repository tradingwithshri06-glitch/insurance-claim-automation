const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/config');
const User = require('../models/User');

let mongoServer;

const setupTestDB = () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  afterEach(async () => {
    // Clear collections after each test suite
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  });
};

const createTestUser = async (overrides = {}) => {
  const defaultUser = {
    fullName: 'Test User',
    email: `test-${Date.now()}-${Math.random()}@example.com`,
    password: 'Password123!',
    role: 'Policyholder',
    status: 'Active'
  };

  const user = await User.create({ ...defaultUser, ...overrides });
  const token = jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  return { user, token };
};

module.exports = {
  setupTestDB,
  createTestUser
};

