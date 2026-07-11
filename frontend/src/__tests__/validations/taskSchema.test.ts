import { describe, it, expect } from 'vitest'
import { taskSchema } from '../../features/tasks/validations/taskSchema'

describe('taskSchema', () => {
  it('validates a correct task', () => {
    const valid = {
      title: 'File sales tax return',
      description: 'Monthly filing for January',
      client_id: '550e8400-e29b-41d4-a716-446655440000',
      task_type: 'SALES_TAX_FILING',
      priority: 'HIGH',
      due_date: '2025-02-20',
    }
    const result = taskSchema.safeParse(valid)
    expect(result.success).toBe(true)
  })

  it('fails when title is empty', () => {
    const invalid = {
      title: '',
    }
    const result = taskSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid task_type', () => {
    const invalid = {
      title: 'Test task',
      task_type: 'INVALID_TYPE',
    }
    const result = taskSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('fails on invalid priority', () => {
    const invalid = {
      title: 'Test task',
      priority: 'INVALID',
    }
    const result = taskSchema.safeParse(invalid)
    expect(result.success).toBe(false)
  })

  it('uses defaults for optional fields', () => {
    const minimal = {
      title: 'Test task',
    }
    const result = taskSchema.safeParse(minimal)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.task_type).toBe('GENERAL')
      expect(result.data.priority).toBe('MEDIUM')
    }
  })
})