// Regular expressions for validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// Maximum lengths for inputs
const MAX_EMAIL_LENGTH = 100;
const MAX_PASSWORD_LENGTH = 50;

// Sanitize email input
export const sanitizeEmail = (email: string): string => {
  // Remove any HTML tags
  let sanitized = email.replace(/<[^>]*>/g, '');
  
  // Remove any script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any potential SQL injection attempts
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > MAX_EMAIL_LENGTH) {
    sanitized = sanitized.substring(0, MAX_EMAIL_LENGTH);
  }
  
  return sanitized;
};

// Sanitize password input
export const sanitizePassword = (password: string): string => {
  // Remove any HTML tags
  let sanitized = password.replace(/<[^>]*>/g, '');
  
  // Remove any script tags and their content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove any potential SQL injection attempts
  sanitized = sanitized.replace(/['";\\]/g, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  // Limit length
  if (sanitized.length > MAX_PASSWORD_LENGTH) {
    sanitized = sanitized.substring(0, MAX_PASSWORD_LENGTH);
  }
  
  return sanitized;
};

// Validate email format
export const validateEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

// Validate password strength
export const validatePasswordStrength = (password: string): boolean => {
  return PASSWORD_REGEX.test(password);
};

// Get password requirements message
export const getPasswordRequirements = (): string => {
  return 'Password must contain at least 8 characters, one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)';
}; 