const request = require('supertest');
const express = require('express');
const router = require('./auth'); // The router we are testing
const authController = require('../controllers/authController');

// Mock the controller methods
jest.mock('../controllers/authController', () => ({
  studentLogin: jest.fn((req, res) => res.status(200).send('studentLogin called')),
  facultyLogin: jest.fn((req, res) => res.status(200).send('facultyLogin called')),
  securityLogin: jest.fn((req, res) => res.status(200).send('securityLogin called')),
  refreshToken: jest.fn((req, res) => res.status(200).send('refreshToken called')),
  forgotPassword: jest.fn((req, res) => res.status(200).send('forgotPassword called')),
  resetPassword: jest.fn((req, res) => res.status(200).send('resetPassword called')),
  unifiedLogin: jest.fn((req, res) => res.status(200).send('unifiedLogin called')),
}));

const app = express();
app.use(express.json());
app.use('/', router);

describe('Auth Routes', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /signin should call authController.studentLogin', async () => {
    const response = await request(app).post('/signin').send({});
    expect(response.status).toBe(200);
    expect(authController.studentLogin).toHaveBeenCalledTimes(1);
  });

  test('POST /faculty-login should call authController.facultyLogin', async () => {
    const response = await request(app).post('/faculty-login').send({});
    expect(response.status).toBe(200);
    expect(authController.facultyLogin).toHaveBeenCalledTimes(1);
  });

  test('POST /security-login should call authController.securityLogin', async () => {
    const response = await request(app).post('/security-login').send({});
    expect(response.status).toBe(200);
    expect(authController.securityLogin).toHaveBeenCalledTimes(1);
  });

  test('POST /refresh should call authController.refreshToken', async () => {
    const response = await request(app).post('/refresh').send({});
    expect(response.status).toBe(200);
    expect(authController.refreshToken).toHaveBeenCalledTimes(1);
  });

  test('POST /send-reset should call authController.forgotPassword', async () => {
    const response = await request(app).post('/send-reset').send({});
    expect(response.status).toBe(200);
    expect(authController.forgotPassword).toHaveBeenCalledTimes(1);
  });

  test('POST /forget should call authController.resetPassword', async () => {
    const response = await request(app).post('/forget').send({});
    expect(response.status).toBe(200);
    expect(authController.resetPassword).toHaveBeenCalledTimes(1);
  });

  test('POST /login should call authController.unifiedLogin', async () => {
    const response = await request(app).post('/login').send({});
    expect(response.status).toBe(200);
    expect(authController.unifiedLogin).toHaveBeenCalledTimes(1);
  });
});
