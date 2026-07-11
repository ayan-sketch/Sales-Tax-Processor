import { describe, it, expect } from 'vitest'
import { withholdingRecordCreateSchema } from '../../features/withholding/validations/withholdingSchema'

describe('withholdingRecordCreateSchema', () => {
  it('validates a correct withholding record', () => {
    const valid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      tax_year: 2025,
      tax_month: 1,
      status: 'Submitted',
      submission_date: '2025-02-20',
      amount: 12500,
      remarks: 'Submitted on time',
    }
    const result = withholdingRecordCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('fails on invalid tax_year range', () => {
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      tax_year: 1999,
      tax_month: 1,
      status: 'Submitted',
    }
    const result = withholdingRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid month', () => {
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      tax_year: 2025,
      tax_month: 13,
      status: 'Submitted',
    }
    const result = withholdingRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid status', () => {
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      tax_year: 2025,
      tax_month: 1,
      status: 'InvalidStatus',
    }
    const result = withholdingRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid client_id', () => {
    const invalid = {
      client_id: 'not-a-uuid',
      tax_year: 2025,
      tax_month: 1,
      status: 'Submitted',
    }
    const result = withholdingRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails when amount is negative', () => {
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      tax_year: 2025,
      tax_month: 1,
      status: 'Submitted',
      amount: -100,
    }
    const result = withholdingRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
