/**
 * Test file for cross-domain authentication fix
 * 
 * This test verifies that the storage key API works correctly
 * both for same-domain (cookie-based) and cross-domain (header-based) authentication.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { NextRequest, NextResponse } from 'next/server';

// Create proper mock functions with correct typing
const mockCheckUserAuth = jest.fn() as jest.MockedFunction<any>;
const mockGetUserStorageKey = jest.fn() as jest.MockedFunction<any>;

// Mock the auth module with proper typing
jest.mock('../app/api/auth', () => ({
  checkUserAuth: mockCheckUserAuth,
  getUserStorageKey: mockGetUserStorageKey,
}));

// Import after mocking
import { GET } from '../app/api/auth/storage-key/route';

describe('Cross-Domain Authentication Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('Storage Key API - Same Domain (Cookie Auth)', () => {
    it('should return authenticated user storage key when cookie is present', async () => {
      // Setup mock responses
      const mockUser = { id: 'user123', email: 'test@example.com' };
      mockCheckUserAuth.mockResolvedValue({
        authenticated: true,
        user: mockUser,
      });
      mockGetUserStorageKey.mockResolvedValue('user-test@example.com');

      // Create mock request with cookie
      const request = new NextRequest('http://localhost:3000/api/auth/storage-key');
      
      // Mock the cookies.get method to return a token
      const mockCookieGet = jest.fn().mockReturnValue({ value: 'mock-token' });
      Object.defineProperty(request, 'cookies', {
        value: { get: mockCookieGet },
        writable: true,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authenticated).toBe(true);
      expect(data.userEmail).toBe('test@example.com');
      expect(data.storageKey).toBe('user-test@example.com');
    });
  });

  describe('Storage Key API - Cross Domain (Header Auth)', () => {
    it('should return authenticated user storage key when Authorization header is present', async () => {
      // Setup mock responses
      const mockUser = { id: 'user123', email: 'cross-domain@example.com' };
      mockCheckUserAuth.mockResolvedValue({
        authenticated: true,
        user: mockUser,
      });
      mockGetUserStorageKey.mockResolvedValue('user-cross-domain@example.com');

      // Create mock request with Authorization header
      const request = new NextRequest('http://localhost:3000/api/auth/storage-key', {
        headers: {
          'Authorization': 'Bearer cross-domain-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authenticated).toBe(true);
      expect(data.userEmail).toBe('cross-domain@example.com');
      expect(data.storageKey).toBe('user-cross-domain@example.com');
    });
  });

  describe('Storage Key API - Not Authenticated', () => {
    it('should return default storage key when not authenticated', async () => {
      // Setup mock responses for unauthenticated user
      mockCheckUserAuth.mockResolvedValue({
        authenticated: false,
        user: null,
      });
      mockGetUserStorageKey.mockResolvedValue('chebichat-backup');

      const request = new NextRequest('http://localhost:3000/api/auth/storage-key');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authenticated).toBe(false);
      expect(data.userEmail).toBe(null);
      expect(data.storageKey).toBe('chebichat-backup');
    });
  });

  describe('Storage Key API - Error Handling', () => {
    it('should handle authentication errors gracefully', async () => {
      // Setup mock to throw an error
      mockCheckUserAuth.mockRejectedValue(new Error('Authentication failed'));

      const request = new NextRequest('http://localhost:3000/api/auth/storage-key');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to get storage key');
      expect(data.storageKey).toBe('chebichat-backup'); // Fallback
      expect(data.authenticated).toBe(false);
    });
  });

  describe('Real-world Cross-Domain Scenarios', () => {
    it('should handle chebichat.ai to chebichat.com.vn domain switch', async () => {
      // Simulate: User logs in on chebichat.ai, then visits chebichat.com.vn
      const mockUser = { id: 'user123', email: 'user@chebichat.ai' };
      mockCheckUserAuth.mockResolvedValue({
        authenticated: true,
        user: mockUser,
      });
      mockGetUserStorageKey.mockResolvedValue('user-user@chebichat.ai');

      // Create request with Authorization header (no cookies due to cross-domain)
      const request = new NextRequest('http://chebichat.com.vn/api/auth/storage-key', {
        headers: {
          'Authorization': 'Bearer cross-domain-token-from-chebichat-ai',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.authenticated).toBe(true);
      expect(data.userEmail).toBe('user@chebichat.ai');
      expect(data.storageKey).toBe('user-user@chebichat.ai');
    });

    it('should validate storage key format for sync system', async () => {
      const mockUser = { id: 'user123', email: 'sync@example.com' };
      mockCheckUserAuth.mockResolvedValue({
        authenticated: true,
        user: mockUser,
      });
      mockGetUserStorageKey.mockResolvedValue('user-sync@example.com');

      const request = new NextRequest('http://localhost:3000/api/auth/storage-key', {
        headers: {
          'Authorization': 'Bearer sync-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      // Verify the storage key format is correct for UpStash
      expect(data.storageKey).toMatch(/^user-[\w@.-]+$/);
      expect(data.storageKey).toBe('user-sync@example.com');
      expect(data.authenticated).toBe(true);
    });
  });
});
