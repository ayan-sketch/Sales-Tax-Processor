import { z } from 'zod';

export const documentUploadSchema = z.object({
  client_id: z.string().uuid('Client is required'),
  document_type: z.string().optional(),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 25 * 1024 * 1024, 'File size must be less than 25MB')
    .refine(
      (file) => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['pdf', 'xlsx', 'xls'].includes(ext || '');
      },
      'Only PDF, XLSX, XLS files are allowed'
    ),
});

export type DocumentUploadFormData = z.infer<typeof documentUploadSchema>;