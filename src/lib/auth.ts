import jwt from 'jsonwebtoken';

// TODO: Move these to environment variables for production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
}

export const generateToken = (user: AdminUser): string => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username, 
      email: user.email, 
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

export const verifyToken = (token: string): AdminUser | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminUser;
    return decoded;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
};

export const getTokenFromRequest = (request: Request): string | null => {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
};

// Mock admin users - TODO: Replace with database authentication
export const mockAdminUsers: AdminUser[] = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@ipl2026.com',
    role: 'super_admin'
  },
  {
    id: '2',
    username: 'manager',
    email: 'manager@ipl2026.com',
    role: 'admin'
  }
];

// Mock password check - TODO: Replace with proper password hashing
export const validateCredentials = (username: string, password: string): AdminUser | null => {
  // In production, this would check against a database with hashed passwords
  if (username === 'admin' && password === 'admin123') {
    return mockAdminUsers[0];
  }
  if (username === 'manager' && password === 'manager123') {
    return mockAdminUsers[1];
  }
  return null;
};
