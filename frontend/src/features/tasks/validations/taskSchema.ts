import { z } from 'zod';

export const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().max(500, 'Description too long').optional(),
  client_id: z.string().uuid('Invalid client').optional().or(z.literal('')),
  task_type: z.enum(['GENERAL', 'SALES_TAX_FILING', 'WITHHOLDING_PAYMENT', 'DOCUMENT_UPLOAD', 'CLIENT_REVIEW']).default('GENERAL'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  due_date: z.string().optional(),
  assigned_to: z.string().optional(),
});

export type TaskFormData = z.infer<typeof taskSchema>;