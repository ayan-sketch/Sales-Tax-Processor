import { z } from 'zod';

const emptyToUndefined = (val: unknown) =>
  val === '' || val === null || val === undefined ? undefined : val;

const optionalString = (schema: z.ZodTypeAny) =>
  z.preprocess(emptyToUndefined, schema.optional());

const optionalEmail = optionalString(z.string().email('Invalid email address'));
const optionalPhone = optionalString(
  z.string().regex(/^[\d\s\-\+\(\)]{7,20}$/, 'Invalid phone number')
);

export const clientCreateSchema = z.object({
  client_name: z.string().min(1, 'Client name is required').max(255),
  business_name: optionalString(z.string().max(255)),
  cnic: optionalString(
    z.string().refine((val) => cleanCNIC(val).length === 13, 'CNIC must be 13 digits')
  ),
  ntn: optionalString(
    z.string().refine((val) => /^\d{7}-\d{1}$/.test(cleanNTN(val)), 'NTN format: 1234567-1')
  ),
  strn: optionalString(
    z.string().refine(
      (val) => /^\d{2}-\d{2}-\d{6}-\d{2}$/.test(cleanSTRN(val)),
      'STRN format: 12-34-567890-12'
    )
  ),
  contact_number: optionalPhone,
  email: optionalEmail,
  address: optionalString(z.string().max(500)),
  client_password: optionalString(z.string().min(6, 'Password must be at least 6 characters')),
  sales_tax_registered: z.boolean().default(false),
  withholding_registered: z.boolean().default(false),
  kpra_registered: z.boolean().default(false),
  is_active: z.boolean().default(true),
  notes: optionalString(z.string().max(1000)),
  contact_person: optionalString(z.string().max(255)),
  contact_person_designation: optionalString(z.string().max(255)),
  contact_person_phone: optionalPhone,
  contact_person_email: optionalEmail,
  secondary_phone: optionalPhone,
  city: optionalString(z.string().max(100)),
  province: optionalString(z.string().max(100)),
  business_type: optionalString(z.string().max(255)),
  client_type: optionalString(z.string().max(50)),
  registration_date: optionalString(z.string()),
  tax_period: optionalString(z.string().max(20)),
  fbr_office: optionalString(z.string().max(255)),
  sales_tax_material_status: z.enum(['MATERIAL', 'NIL']).default('NIL'),
  withholding_236_applied: z.boolean().default(false),
  withholding_236_prepared_by_us: z.boolean().default(false),
  withholding_153_applicable: z.boolean().default(false),
  withholding_153_prepared_by_us: z.boolean().default(false),
});

export const clientUpdateSchema = clientCreateSchema.partial();

export type ClientCreateFormData = z.infer<typeof clientCreateSchema>;
export type ClientUpdateFormData = z.infer<typeof clientUpdateSchema>;

// Input mask helpers for display formatting
export const formatCNIC = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 13);
  if (digits.length > 5) {
    return `${digits.slice(0, 5)}-${digits.slice(5, 12)}-${digits.slice(12)}`;
  }
  return digits;
};

export const formatNTN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 7) {
    return `${digits.slice(0, 7)}-${digits.slice(7)}`;
  }
  return digits;
};

export const formatSTRN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 10)}-${digits.slice(10)}`;
};

export const formatContactNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.startsWith('92')) {
    if (digits.length > 3) {
      return `+${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`;
    }
    return `+${digits}`;
  }
  if (digits.startsWith('0')) {
    if (digits.length > 4) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
    return digits;
  }
  return digits;
};

// Clean formatted values back to raw for submission
export const cleanCNIC = (value: string): string => value.replace(/\D/g, '');
export const cleanNTN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length > 7) {
    return `${digits.slice(0, 7)}-${digits.slice(7)}`;
  }
  return digits;
};
export const cleanSTRN = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 12);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
  }
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 10)}-${digits.slice(10)}`;
};
export const cleanContactNumber = (value: string): string => value.replace(/\D/g, '');

/** Strip empty strings and normalize tax ID fields before API submission */
export function sanitizeClientPayload<T extends Record<string, unknown>>(data: T): T {
  const result = { ...data } as Record<string, unknown>;

  for (const key of Object.keys(result)) {
    if (result[key] === '') {
      delete result[key];
    }
  }

  if (typeof result.cnic === 'string') {
    const cleaned = cleanCNIC(result.cnic);
    if (cleaned) result.cnic = cleaned;
    else delete result.cnic;
  }
  if (typeof result.ntn === 'string') {
    const cleaned = cleanNTN(result.ntn);
    if (/^\d{7}-\d{1}$/.test(cleaned)) result.ntn = cleaned;
    else delete result.ntn;
  }
  if (typeof result.strn === 'string') {
    const cleaned = cleanSTRN(result.strn);
    if (/^\d{2}-\d{2}-\d{6}-\d{2}$/.test(cleaned)) result.strn = cleaned;
    else delete result.strn;
  }

  return result as T;
}
