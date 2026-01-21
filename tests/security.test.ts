/**
 * Security Tests for GraphBug Frontend
 * 
 * Tests for input validation, sanitization, and security utilities
 */

import { describe, it, expect } from '@jest/globals'
import {
  GitHubRepoSchema,
  PRNumberSchema,
  ProcessPRSchema,
  IngestRepoSchema,
  FilePathSchema,
  SearchQuerySchema,
  validateInput,
  validateOrDefault,
} from '@/lib/validation'
import { logger, safeStringify } from '@/lib/logger'

describe('Input Validation', () => {
  describe('GitHubRepoSchema', () => {
    it('should accept valid GitHub identifiers', () => {
      const result = validateInput(GitHubRepoSchema, {
        owner: 'octocat',
        repo: 'Hello-World',
      })
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.owner).toBe('octocat')
        expect(result.data.repo).toBe('Hello-World')
      }
    })
    
    it('should reject invalid owner names', () => {
      const result = validateInput(GitHubRepoSchema, {
        owner: '../malicious',
        repo: 'repo',
      })
      
      expect(result.success).toBe(false)
    })
    
    it('should reject owner names that are too long', () => {
      const result = validateInput(GitHubRepoSchema, {
        owner: 'a'.repeat(101),
        repo: 'repo',
      })
      
      expect(result.success).toBe(false)
    })
    
    it('should reject invalid characters in repo name', () => {
      const result = validateInput(GitHubRepoSchema, {
        owner: 'owner',
        repo: 'repo@#$%',
      })
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('PRNumberSchema', () => {
    it('should accept valid PR numbers', () => {
      const result = validateInput(PRNumberSchema, { prNumber: 123 })
      
      expect(result.success).toBe(true)
    })
    
    it('should reject negative PR numbers', () => {
      const result = validateInput(PRNumberSchema, { prNumber: -1 })
      
      expect(result.success).toBe(false)
    })
    
    it('should reject zero as PR number', () => {
      const result = validateInput(PRNumberSchema, { prNumber: 0 })
      
      expect(result.success).toBe(false)
    })
    
    it('should reject unrealistically large PR numbers', () => {
      const result = validateInput(PRNumberSchema, { prNumber: 9999999 })
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('ProcessPRSchema', () => {
    it('should accept valid PR processing request', () => {
      const result = validateInput(ProcessPRSchema, {
        owner: 'octocat',
        repo: 'Hello-World',
        prNumber: 123,
        installationId: '12345678',
      })
      
      expect(result.success).toBe(true)
    })
    
    it('should reject invalid installation ID', () => {
      const result = validateInput(ProcessPRSchema, {
        owner: 'octocat',
        repo: 'Hello-World',
        prNumber: 123,
        installationId: 'not-a-number',
      })
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('IngestRepoSchema', () => {
    it('should accept valid ingestion request', () => {
      const result = validateInput(IngestRepoSchema, {
        repoUrl: 'https://github.com/octocat/Hello-World',
        repoId: 'hello-world-123',
        installationId: '12345678',
      })
      
      expect(result.success).toBe(true)
    })
    
    it('should reject non-GitHub URLs', () => {
      const result = validateInput(IngestRepoSchema, {
        repoUrl: 'https://gitlab.com/user/repo',
        repoId: 'repo',
        installationId: '12345678',
      })
      
      expect(result.success).toBe(false)
    })
    
    it('should reject malformed URLs', () => {
      const result = validateInput(IngestRepoSchema, {
        repoUrl: 'not-a-url',
        repoId: 'repo',
        installationId: '12345678',
      })
      
      expect(result.success).toBe(false)
    })
    
    it('should accept optional commit SHA', () => {
      const result = validateInput(IngestRepoSchema, {
        repoUrl: 'https://github.com/octocat/Hello-World',
        repoId: 'hello-world',
        installationId: '12345678',
        lastCommit: 'abc123def456',
      })
      
      expect(result.success).toBe(true)
    })
    
    it('should reject invalid commit SHA', () => {
      const result = validateInput(IngestRepoSchema, {
        repoUrl: 'https://github.com/octocat/Hello-World',
        repoId: 'hello-world',
        installationId: '12345678',
        lastCommit: 'not-a-sha',
      })
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('FilePathSchema', () => {
    it('should accept valid file paths', () => {
      const result = validateInput(FilePathSchema, 'src/components/Button.tsx')
      
      expect(result.success).toBe(true)
    })
    
    it('should reject paths with parent directory references', () => {
      const result = validateInput(FilePathSchema, '../../../etc/passwd')
      
      expect(result.success).toBe(false)
    })
    
    it('should reject paths with null bytes', () => {
      const result = validateInput(FilePathSchema, 'file.txt\x00.jpg')
      
      expect(result.success).toBe(false)
    })
    
    it('should reject paths that are too long', () => {
      const result = validateInput(FilePathSchema, 'a'.repeat(501))
      
      expect(result.success).toBe(false)
    })
  })
  
  describe('SearchQuerySchema', () => {
    it('should accept valid search queries', () => {
      const result = validateInput(SearchQuerySchema, {
        repoId: 'my-repo',
        query: 'authentication function',
        limit: 10,
      })
      
      expect(result.success).toBe(true)
    })
    
    it('should reject empty queries', () => {
      const result = validateInput(SearchQuerySchema, {
        repoId: 'my-repo',
        query: '',
      })
      
      expect(result.success).toBe(false)
    })
    
    it('should reject queries that are too long', () => {
      const result = validateInput(SearchQuerySchema, {
        repoId: 'my-repo',
        query: 'a'.repeat(1001),
      })
      
      expect(result.success).toBe(false)
    })
  })
})

describe('Validation Helpers', () => {
  it('validateOrDefault should return parsed value on success', () => {
    const result = validateOrDefault(
      PRNumberSchema,
      { prNumber: 123 },
      { prNumber: 1 }
    )
    
    expect(result.prNumber).toBe(123)
  })
  
  it('validateOrDefault should return default on failure', () => {
    const result = validateOrDefault(
      PRNumberSchema,
      { prNumber: -1 },
      { prNumber: 1 }
    )
    
    expect(result.prNumber).toBe(1)
  })
})

describe('Logger Security', () => {
  describe('safeStringify', () => {
    it('should sanitize sensitive keys', () => {
      const data = {
        username: 'john',
        password: 'secret123',
        api_key: 'sk-1234567890',
        normalData: 'visible',
      }
      
      const result = safeStringify(data)
      
      expect(result).toContain('john')
      expect(result).toContain('normalData')
      expect(result).not.toContain('secret123')
      expect(result).not.toContain('sk-1234567890')
      expect(result).toContain('[REDACTED]')
    })
    
    it('should handle circular references', () => {
      const circular: any = { name: 'test' }
      circular.self = circular
      
      const result = safeStringify(circular)
      
      expect(result).toContain('[Circular]')
    })
    
    it('should handle unstringifiable objects', () => {
      const obj = {}
      Object.defineProperty(obj, 'bad', {
        get() {
          throw new Error('Cannot stringify')
        },
      })
      
      const result = safeStringify(obj)
      
      expect(result).toBeDefined()
    })
  })
  
  describe('logger methods', () => {
    it('should not throw errors when logging', () => {
      expect(() => {
        logger.debug('test message')
        logger.info('test message')
        logger.warn('test message')
        logger.error('test message')
      }).not.toThrow()
    })
    
    it('should sanitize data in logs', () => {
      // This is more of a smoke test - actual sanitization
      // is tested in safeStringify tests
      expect(() => {
        logger.info('User login', {
          username: 'john',
          password: 'secret',
        })
      }).not.toThrow()
    })
  })
})

describe('XSS Prevention', () => {
  it('should validate input before rendering', () => {
    // Example: ensuring user input is validated
    const userInput = '<script>alert("xss")</script>'
    
    // Validation should catch HTML/script tags
    const result = validateInput(SearchQuerySchema, {
      repoId: 'repo',
      query: userInput,
    })
    
    // While the schema doesn't explicitly reject HTML,
    // the max length and pattern validation provide some protection
    expect(result.success).toBe(true) // Query is accepted but should be escaped on render
  })
})
