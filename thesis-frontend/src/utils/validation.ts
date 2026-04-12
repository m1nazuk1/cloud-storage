import { z } from 'zod';

const trim = (s: string) => s.trim();

export const loginSchema = z.object({
    emailOrUsername: z
        .string()
        .min(1, 'Укажите email или имя пользователя')
        .transform(trim)
        .pipe(
            z.string().min(1, 'Укажите email или имя пользователя')
        ),
    password: z.string().min(6, 'Пароль не короче 6 символов'),
});

export const registerSchema = z.object({
    email: z
        .string()
        .min(1, 'Укажите email')
        .transform(trim)
        .pipe(z.string().email('Некорректный email'))
        .transform((e) => e.toLowerCase()),
    username: z
        .string()
        .min(1, 'Укажите имя пользователя')
        .transform(trim)
        .pipe(
            z.string().min(3, 'Имя пользователя не короче 3 символов').max(50)
        ),
    password: z.string().min(6, 'Пароль не короче 6 символов'),
    firstName: z.string().optional().transform((s) => (s != null ? trim(s) : s)),
    lastName: z.string().optional().transform((s) => (s != null ? trim(s) : s)),
});

export const groupCreateSchema = z.object({
    name: z.string().min(1, 'Укажите название группы').max(100, 'Слишком длинное название'),
    description: z.string().max(500, 'Описание слишком длинное').optional(),
});

export const groupUpdateSchema = z.object({
    name: z.string().min(1, 'Укажите название группы').max(100, 'Слишком длинное название').optional(),
    description: z.string().max(500, 'Описание слишком длинное').optional(),
    regenerateToken: z.boolean().optional(),
});

export const userUpdateSchema = z.object({
    firstName: z.string().max(50, 'Слишком длинное имя').optional(),
    lastName: z.string().max(50, 'Слишком длинная фамилия').optional(),
    username: z.string().min(3, 'Имя пользователя не короче 3 символов').max(30, 'Слишком длинное имя').optional(),
});

export const passwordChangeSchema = z.object({
    oldPassword: z.string().min(6, 'Введите текущий пароль'),
    newPassword: z.string().min(6, 'Новый пароль не короче 6 символов'),
});

export const messageSchema = z.object({
    content: z.string().min(1, 'Сообщение не может быть пустым').max(1000, 'Сообщение слишком длинное'),
});
