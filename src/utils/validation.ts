import { z } from 'zod';

// Common validation schemas
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const usernameSchema = z
  .string()
  .min(3, 'Username must be at least 3 characters')
  .max(20, 'Username must be at most 20 characters')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

// Form schemas
export const loginSchema = z.object({
  username: usernameSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

// Type inference
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Validation helpers
export const validateEmail = (email: string): boolean => {
  try {
    emailSchema.parse(email);
    return true;
  } catch {
    return false;
  }
};

export const validatePassword = (password: string): boolean => {
  try {
    passwordSchema.parse(password);
    return true;
  } catch {
    return false;
  }
};

export const validateUsername = (username: string): boolean => {
  try {
    usernameSchema.parse(username);
    return true;
  } catch {
    return false;
  }
}; 