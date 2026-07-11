import { z } from 'zod';

export const salesTaxRecordCreateSchema = z.object({
  client_id: z.string().uuid('Invalid client ID'),
  filing_year: z.number().int().min(2020).max(2030, 'Year must be between 2020 and 2030'),
  filing_month: z.number().int().min(1).max(12, 'Month must be between 1 and 12'),
  status: z.enum(['Filed', 'Pending', 'Not Filed', 'Overdue']),
  filing_date: z.string().optional().nullable(),
  remarks: z.string().max(1000, 'Remarks too long').optional().nullable(),
});

export const salesTaxRecordUpdateSchema = z.object({
  status: z.enum(['Filed', 'Pending', 'Not Filed', 'Overdue']).optional(),
  filing_date: z.string().optional().nullable(),
  remarks: z.string().max(1000, 'Remarks too long').optional().nullable(),
});

export const salesTaxFiltersSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(25),
  client_id: z.string().uuid().optional(),
  year: z.number().int().min(2020).max(2030).optional(),
  month: z.number().int().min(1).max(12).optional(),
  status: z.enum(['Filed', 'Pending', 'Not Filed', 'Overdue']).optional(),
});

export type SalesTaxRecordCreateFormData = z.infer<typeof salesTaxRecordCreateSchema>;
export type SalesTaxRecordUpdateFormData = z.infer<typeof salesTaxRecordUpdateSchema>;
export type SalesTaxFiltersFormData = z.infer<typeof salesTaxFiltersSchema>;