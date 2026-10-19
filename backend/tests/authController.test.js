
import { jest } from '@jest/globals';

const mockDbGet = jest.fn();
const mockDbRun = jest.fn();
const mockHash = jest.fn();
const mockCompare = jest.fn();
const mockSign = jest.fn();

jest.unstable_mockModule('../config/db.js', () => ({
  dbGet: mockDbGet,
  dbRun: mockDbRun,
  dbAll: jest.fn(),
  initDatabase: jest.fn(),
  default: {}
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    hash: mockHash,
    compare: mockCompare
  }
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: mockSign
  }
}));

const { register, login, getMe } =
  await import('../controllers/authController.js');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
}

describe('Authentication Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSign.mockReturnValue('test-jwt-token');
  });

  describe('register', () => {
    test('returns 400 when required fields are missing', async () => {
      const res = createResponse();

      await register(
        { body: { name: '', email: '', password: '' } },
        res
      );

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe(
        'Name, email, and password are required'
      );
      expect(mockDbGet).not.toHaveBeenCalled();
    });

    test('returns 400 when the email already exists', async () => {
      mockDbGet.mockResolvedValueOnce({ id: 1, email: 'test@example.com' });

      const res = createResponse();

      await register(
        {
          body: {
            name: 'Test Student',
            email: 'test@example.com',
            password: 'password123'
          }
        },
        res
      );

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe(
        'User with this email already exists'
      );
      expect(mockDbRun).not.toHaveBeenCalled();
    });

    test('registers a student successfully', async () => {
      mockDbGet.mockResolvedValueOnce(null);
      mockHash.mockResolvedValueOnce('hashed-password');
      mockDbRun
        .mockResolvedValueOnce({ lastID: 10 })
        .mockResolvedValueOnce({ lastID: 20 });

      const res = createResponse();

      await register(
        {
          body: {
            name: 'Test Student',
            email: 'student@example.com',
            password: 'password123',
            role: 'student',
            department: 'CSE',
            cgpa: 8.5
          }
        },
        res
      );

      expect(res.statusCode).toBe(201);
      expect(res.body.message).toBe('Account created successfully');
      expect(res.body.token).toBe('test-jwt-token');
      expect(res.body.user).toMatchObject({
        id: 10,
        name: 'Test Student',
        email: 'student@example.com',
        role: 'student',
        studentId: 20,
        companyId: null
      });
      expect(mockHash).toHaveBeenCalledWith('password123', 10);
      expect(mockDbRun).toHaveBeenCalledTimes(2);
      expect(mockSign).toHaveBeenCalledTimes(1);
    });

    test('returns 500 when registration database operation fails', async () => {
      mockDbGet.mockRejectedValueOnce(new Error('Database unavailable'));

      const res = createResponse();

      await register(
        {
          body: {
            name: 'Test Student',
            email: 'student@example.com',
            password: 'password123'
          }
        },
        res
      );

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Server error registering user');
      expect(res.body.error).toBe('Database unavailable');
    });
  });

  describe('login', () => {
    test('returns 400 when email or password is missing', async () => {
      const res = createResponse();

      await login({ body: { email: '' } }, res);

      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe(
        'Email and password are required'
      );
    });

    test('returns 401 when the user does not exist', async () => {
      mockDbGet.mockResolvedValueOnce(null);

      const res = createResponse();

      await login(
        {
          body: {
            email: 'missing@example.com',
            password: 'password123'
          }
        },
        res
      );

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    test('returns 401 when the password is incorrect', async () => {
      mockDbGet.mockResolvedValueOnce({
        id: 1,
        email: 'student@example.com',
        password: 'hashed-password',
        role: 'student'
      });
      mockCompare.mockResolvedValueOnce(false);

      const res = createResponse();

      await login(
        {
          body: {
            email: 'student@example.com',
            password: 'wrong-password'
          }
        },
        res
      );

      expect(res.statusCode).toBe(401);
      expect(res.body.message).toBe('Invalid credentials');
    });

    test('logs in a student successfully', async () => {
      mockDbGet
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test Student',
          email: 'student@example.com',
          password: 'hashed-password',
          role: 'student'
        })
        .mockResolvedValueOnce({ student_id: 20 });

      mockCompare.mockResolvedValueOnce(true);

      const res = createResponse();

      await login(
        {
          body: {
            email: 'student@example.com',
            password: 'password123'
          }
        },
        res
      );

      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('Login successful');
      expect(res.body.token).toBe('test-jwt-token');
      expect(res.body.user).toMatchObject({
        id: 1,
        email: 'student@example.com',
        role: 'student',
        studentId: 20,
        companyId: null
      });
    });

    test('returns 500 when login database operation fails', async () => {
      mockDbGet.mockRejectedValueOnce(new Error('Database unavailable'));

      const res = createResponse();

      await login(
        {
          body: {
            email: 'student@example.com',
            password: 'password123'
          }
        },
        res
      );

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe('Server error logging in');
    });
  });

  describe('getMe', () => {
    test('returns 404 when the user does not exist', async () => {
      mockDbGet.mockResolvedValueOnce(null);

      const res = createResponse();

      await getMe({ user: { id: 999 } }, res);

      expect(res.statusCode).toBe(404);
      expect(res.body.message).toBe('User not found');
    });

    test('returns a student profile with student details', async () => {
      mockDbGet
        .mockResolvedValueOnce({
          id: 1,
          name: 'Test Student',
          email: 'student@example.com',
          role: 'student',
          created_at: '2026-01-01'
        })
        .mockResolvedValueOnce({
          student_id: 20,
          department: 'CSE'
        });

      const res = createResponse();

      await getMe({ user: { id: 1 } }, res);

      expect(res.statusCode).toBe(200);
      expect(res.body.user.id).toBe(1);
      expect(res.body.user.details).toMatchObject({
        student_id: 20,
        department: 'CSE'
      });
    });

    test('returns 500 when profile retrieval fails', async () => {
      mockDbGet.mockRejectedValueOnce(new Error('Database unavailable'));

      const res = createResponse();

      await getMe({ user: { id: 1 } }, res);

      expect(res.statusCode).toBe(500);
      expect(res.body.message).toBe(
        'Server error fetching user profile'
      );
    });
  });
});
