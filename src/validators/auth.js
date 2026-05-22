import { z } from 'zod';

const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

export const signupSchema = z.object({
  body: z
    .object({
      fullName: z.string().min(2, 'Full name must be at least 2 characters'),
      email: z.string().email('Invalid email address'),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(
          passwordRegex,
          'Password must contain uppercase, lowercase, number, and special character'
        ),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const addAccountSchema = z.object({
  body: z.object({
    accountName: z.string().min(1, 'Account name is required'),
    amount: z.number().min(0, 'Amount must be zero or greater'),
  }),
});

export const transferSchema = z.object({
  body: z.object({
    senderAccountId: z.string().min(1),
    recipientAccountNumber: z.string().length(9, 'Recipient account number must be 9 characters'),
    recipientUserId: z.string().min(1),
    amount: z.number().positive('Amount must be greater than zero'),
    memo: z.string().optional().default(''),
  }),
});

export const userIdParamSchema = z.object({
  params: z.object({
    userId: z.string().min(1),
  }),
});

export const accountNumberParamSchema = z.object({
  params: z.object({
    accountNumber: z.string().length(9),
  }),
});

export const transactionsQuerySchema = z.object({
  query: z.object({
    accountId: z.string().optional(),
  }),
});
