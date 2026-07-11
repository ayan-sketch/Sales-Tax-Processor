import { describe, expect, it } from 'vitest';
import { buildMasterSheetData } from './masterSheet';

describe('buildMasterSheetData', () => {
  it('marks received challans as completed and overdue missing months as pending', () => {
    const clients = [{ id: 'client-1', client_name: 'Alpha Corp' }];
    const records = [
      {
        client_id: 'client-1',
        section_type: '236H' as const,
        period: '2024-07',
        challan_number: 'CH-1001',
        payment_date: '2024-07-15',
      },
    ];

    const data = buildMasterSheetData(clients, records, new Date('2024-09-15'));

    expect(data[0].months[0].status).toBe('completed');
    expect(data[0].months[0].label).toBe('✓');
    expect(data[0].months[1].status).toBe('pending');
    expect(data[0].months[1].label).toBe('Pending');
  });

  it('marks statement-only records as completed without a challan number', () => {
    const clients = [{ id: 'client-1', client_name: 'Alpha Corp' }];
    const records = [
      {
        client_id: 'client-1',
        section_type: '236H' as const,
        period: '2024-08',
        challan_number: null,
        payment_date: '2024-08-12',
      },
    ];

    const data = buildMasterSheetData(clients, records, new Date('2024-09-15'));

    expect(data[0].months[1].status).toBe('completed');
    expect(data[0].months[1].label).toBe('✓');
  });
});
