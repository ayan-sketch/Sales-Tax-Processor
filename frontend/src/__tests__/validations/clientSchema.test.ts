import { describe, it, expect } from 'vitest'
import { clientCreateSchema, clientUpdateSchema } from '../../features/clients/validations/clientSchema'

describe('clientCreateSchema', () => {
  it('validates minimal client with only client_name', () => {
    const result = clientCreateSchema.safeParse({
      client_name: 'Test Client',
      business_name: '',
      cnic: '',
      ntn: '',
      strn: '',
      contact_number: '',
      email: '',
      address: '',
      client_password: '',
      notes: '',
      contact_person: '',
      contact_person_designation: '',
      contact_person_phone: '',
      contact_person_email: '',
      secondary_phone: '',
      city: '',
      province: '',
      business_type: '',
      client_type: '',
      registration_date: '',
      tax_period: '',
      fbr_office: '',
    });
    expect(result.success).toBe(true);
  });

  it('validates a correct client', () => {
    const valid = {
      client_name: 'Test Client',
      email: 'test@example.com',
      contact_number: '+1234567890123',
      address: '123 Test St',
      ntn: '1234567-1',
      strn: '12-34-567890-12',
      cnic: '1234512345671',
      sales_tax_registered: true,
      sales_tax_material_status: 'MATERIAL',
      withholding_registered: true,
      withholding_236_applied: true,
      withholding_236_prepared_by_us: false,
      withholding_153_applicable: true,
      withholding_153_prepared_by_us: true,
      is_active: true,
    }
    const result = clientCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('validates withholding and sales tax fields when registered', () => {
    const valid = {
      client_name: 'Test Client',
      sales_tax_registered: true,
      sales_tax_material_status: 'NIL',
      withholding_registered: true,
      withholding_236_applied: false,
      withholding_236_prepared_by_us: true,
      withholding_153_applicable: false,
      withholding_153_prepared_by_us: false,
    }
    const result = clientCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('fails when client_name is empty', () => {
    const invalid = {
      client_name: '',
    }
    const result = clientCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid email', () => {
    const invalid = {
      client_name: 'Test Client',
      email: 'not-an-email',
    }
    const result = clientCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid CNIC format', () => {
    const invalid = {
      client_name: 'Test Client',
      cnic: '12345',
    }
    const result = clientCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid NTN format', () => {
    const invalid = {
      client_name: 'Test Client',
      ntn: '123',
    }
    const result = clientCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid STRN format', () => {
    const invalid = {
      client_name: 'Test Client',
      strn: '123',
    }
    const result = clientCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})

describe('clientUpdateSchema', () => {
  it('validates partial update', () => {
    const result = clientUpdateSchema.safeParse({ client_name: 'Updated Name' })
    expect(result.success).toBe(true)
  })

  it('fails on invalid email in update', () => {
    const result = clientUpdateSchema.safeParse({ email: 'bad-email' })
    expect(result.success).toBe(false)
  })
})
