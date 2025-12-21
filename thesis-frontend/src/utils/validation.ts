import { z } from 'zod';

export const loginSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
    email: z.string().email('Invalid email address'),
    username: z.string().min(3, 'Username must be at least 3 characters'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
});

export const groupCreateSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(100, 'Name is too long'),
    description: z.string().max(500, 'Description is too long').optional(),
});

export const groupUpdateSchema = z.object({
    name: z.string().min(1, 'Group name is required').max(100, 'Name is too long').optional(),
    description: z.string().max(500, 'Description is too long').optional(),
    regenerateToken: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
    firstName: z.string().max(50, 'First name is too long').optional(),
    lastName: z.string().max(50, 'Last name is too long').optional(),
    username: z.string().min(3, 'Username must be at least 3 characters').max(30, 'Username is too long').optional(),
});

export const passwordChangeSchema = z.object({
    oldPassword: z.string().min(6, 'Old password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export const messageSchema = z.object({
    content: z.string().min(1, 'Message cannot be empty').max(1000, 'Message is too long'),
});