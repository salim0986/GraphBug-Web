/**
 * Secure Logger Utility for GraphBug Frontend
 * 
 * Environment-aware logging that:
 * - Only logs debug info in development
 * - Sanitizes sensitive data
 * - Prevents information leakage in production
 */

const isDev = process.env.NODE_ENV === 'development'
const isTest = process.env.NODE_ENV === 'test'

// Sensitive keys that should never be logged
const SENSITIVE_KEYS = [
  'token',
  'secret',
  'password',
  'api_key',
  'apikey',
  'private_key',
  'privatekey',
  'jwt',
  'bearer',
  'authorization',
  'cookie',
  'session'
]

/**
 * Sanitize data to remove sensitive information
 */
function sanitizeData(data: any): any {
  if (!data) return data
  
  if (typeof data === 'string') {
    // Check if string looks like a token/key
    if (data.length > 20 && /^[A-Za-z0-9+/=_-]{20,}$/.test(data)) {
      return '[REDACTED]'
    }
    return data
  }
  
  if (typeof data === 'object') {
    if (Array.isArray(data)) {
      return data.map(sanitizeData)
    }
    
    const sanitized: any = {}
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      
      // Redact sensitive keys
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]'
      } else {
        sanitized[key] = sanitizeData(value)
      }
    }
    return sanitized
  }
  
  return data
}

/**
 * Format log message with timestamp and context
 */
function formatMessage(level: string, message: string, data?: any): string {
  const timestamp = new Date().toISOString()
  const dataStr = data ? ` | ${JSON.stringify(sanitizeData(data))}` : ''
  return `[${timestamp}] [${level}] ${message}${dataStr}`
}

export const logger = {
  /**
   * Debug logging - only in development
   */
  debug: (message: string, data?: any) => {
    if (isDev && !isTest) {
      console.log(formatMessage('DEBUG', message, data))
    }
  },

  /**
   * Info logging - development only
   */
  info: (message: string, data?: any) => {
    if (isDev && !isTest) {
      console.log(formatMessage('INFO', message, data))
    }
  },

  /**
   * Warning logging - all environments
   */
  warn: (message: string, data?: any) => {
    if (!isTest) {
      console.warn(formatMessage('WARN', message, data))
    }
  },

  /**
   * Error logging - all environments
   * Always logs errors but sanitizes sensitive data
   */
  error: (message: string, error?: any) => {
    if (!isTest) {
      const sanitizedError = error instanceof Error 
        ? { name: error.name, message: error.message }
        : sanitizeData(error)
      
      console.error(formatMessage('ERROR', message, sanitizedError))
      
      // In production, could send to error tracking service
      // if (!isDev) {
      //   sendToSentry(message, sanitizedError)
      // }
    }
  },

  /**
   * Critical error logging - always logs
   */
  critical: (message: string, error?: any) => {
    const sanitizedError = error instanceof Error 
      ? { name: error.name, message: error.message, stack: isDev ? error.stack : undefined }
      : sanitizeData(error)
    
    console.error(formatMessage('CRITICAL', message, sanitizedError))
  }
}

/**
 * Safely stringify objects for logging
 */
export function safeStringify(obj: any, maxDepth = 3): string {
  try {
    const seen = new WeakSet()
    
    return JSON.stringify(obj, (key, value) => {
      // Handle circular references
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular]'
        }
        seen.add(value)
      }
      
      // Sanitize sensitive keys
      const lowerKey = key.toLowerCase()
      if (SENSITIVE_KEYS.some(sensitive => lowerKey.includes(sensitive))) {
        return '[REDACTED]'
      }
      
      return value
    }, 2)
  } catch (e) {
    return '[Unable to stringify]'
  }
}

// Export for backward compatibility (gradual migration)
export default logger
