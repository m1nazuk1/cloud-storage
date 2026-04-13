import { z } from 'zod';
import type { TFunction } from 'i18next';

const trim = (s: string) => s.trim();

export function createLoginSchema(t: TFunction) {
    return z.object({
        emailOrUsername: z
            .string()
            .min(1, t('validation.login.emailOrUsernameRequired'))
            .transform(trim)
            .pipe(z.string().min(1, t('validation.login.emailOrUsernameRequired'))),
        password: z.string().min(6, t('validation.login.passwordMin')),
    });
}

export function createRegisterSchema(t: TFunction) {
    return z.object({
        email: z
            .string()
            .min(1, t('validation.register.emailRequired'))
            .transform(trim)
            .pipe(z.string().email(t('validation.register.emailInvalid')))
            .transform((e) => e.toLowerCase()),
        username: z
            .string()
            .min(1, t('validation.register.usernameRequired'))
            .transform(trim)
            .pipe(z.string().min(3, t('validation.register.usernameMin')).max(50)),
        password: z.string().min(6, t('validation.register.passwordMin')),
        firstName: z.string().optional().transform((s) => (s != null ? trim(s) : s)),
        lastName: z.string().optional().transform((s) => (s != null ? trim(s) : s)),
    });
}

export function createGroupCreateSchema(t: TFunction) {
    return z.object({
        name: z.string().min(1, t('validation.group.nameRequired')).max(100, t('validation.group.nameTooLong')),
        description: z.string().max(500, t('validation.group.descTooLong')).optional(),
    });
}

export function createGroupUpdateSchema(t: TFunction) {
    return z.object({
        name: z.string().min(1, t('validation.group.nameRequired')).max(100, t('validation.group.nameTooLong')).optional(),
        description: z.string().max(500, t('validation.group.descTooLong')).optional(),
        regenerateToken: z.boolean().optional(),
    });
}

export function createUserUpdateSchema(t: TFunction) {
    return z.object({
        firstName: z.string().max(50, t('validation.user.firstTooLong')).optional(),
        lastName: z.string().max(50, t('validation.user.lastTooLong')).optional(),
        username: z.string().min(3, t('validation.user.usernameMin')).max(30, t('validation.user.usernameTooLong')).optional(),
    });
}

export function createPasswordChangeSchema(t: TFunction) {
    return z.object({
        oldPassword: z.string().min(6, t('validation.password.oldRequired')),
        newPassword: z.string().min(6, t('validation.password.newMin')),
    });
}

export function createProfilePasswordFormSchema(t: TFunction) {
    return createPasswordChangeSchema(t)
        .extend({
            confirmPassword: z.string().min(6, t('validation.passwordConfirm.min')),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
            message: t('validation.passwordConfirm.mismatch'),
            path: ['confirmPassword'],
        });
}

export function createMessageSchema(t: TFunction) {
    return z.object({
        content: z.string().min(1, t('validation.message.empty')).max(1000, t('validation.message.tooLong')),
    });
}

export function createForgotPasswordSchema(t: TFunction) {
    return z.object({
        email: z.string().min(1, t('validation.register.emailRequired')).email(t('validation.register.emailInvalid')),
    });
}

export function createResetPasswordSchema(t: TFunction) {
    return z
        .object({
            password: z.string().min(6, t('validation.login.passwordMin')),
            confirmPassword: z.string().min(6, t('validation.passwordConfirm.min')),
        })
        .refine((data) => data.password === data.confirmPassword, {
            message: t('validation.passwordConfirm.mismatch'),
            path: ['confirmPassword'],
        });
}
