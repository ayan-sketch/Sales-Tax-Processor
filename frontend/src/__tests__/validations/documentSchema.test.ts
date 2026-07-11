import { describe, it, expect, vi } from 'vitest'
import { documentUploadSchema } from '../../features/documents/validations/documentSchema'

describe('documentUploadSchema', () => {
  it('validates a correct document upload', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })
    const valid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      file,
    }
    const result = documentUploadSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('fails on file larger than 10MB', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 })
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      file,
    }
    const result = documentUploadSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid file extension', () => {
    const file = new File(['test'], 'test.exe', { type: 'application/x-msdownload' })
    Object.defineProperty(file, 'size', { value: 1024 })
    const invalid = {
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      file,
    }
    const result = documentUploadSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid client_id', () => {
    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' })
    Object.defineProperty(file, 'size', { value: 1024 })
    const invalid = {
      client_id: 'not-a-uuid',
      file,
    }
    const result = documentUploadSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })
})