import { describe, it, expect } from 'vitest'
import { salesTaxRecordCreateSchema } from '../../features/sales-tax/validations/salesTaxSchema'

describe('salesTaxRecordCreateSchema', () => {
  it('validates a correct sales tax record', () => {
    const valid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      filing_year: 2025,
      filing_month: 1,
      status: 'Filed',
      filing_date: '2025-02-20',
      remarks: 'Filed on time',
    }
    const result = salesTaxRecordCreateSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('fails when filing_year is out of range', () => {
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      filing_year: 2019,
      filing_month: 1,
      status: 'Filed',
    }
    const result = salesTaxRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid month', () => {
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      filing_year: 2025,
      filing_month: 13,
      status: 'Filed',
    }
    const result = salesTaxRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid client_id (not uuid)', () => {
    const invalid = {
      client_id: 'invalid-uuid',
      filing_year: 2025,
      filing_month: 1,
      status: 'Filed',
    }
    const result = salesTaxRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails with empty client_id', () => {
    const result = salesTaxRecordCreateSchema.safeParse({
      filing_year: 2025,
      filing_month: 1,
      status: 'Filed',
    })
    expect(result.success).toBe(false)
  })

  it('fails on invalid status', () => {
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      filing_year: 2025,
      filing_month: 1,
      status: 'InvalidStatus',
    }
    const result = salesTaxRecordCreateSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})
