import { buildSalesTaxMasterSheetRows } from './salesTaxMasterSheet';

describe('buildSalesTaxMasterSheetRows', () => {
  it('creates a row for each client and preserves matching record details', () => {
    const clients = [
      { id: 'client-1', client_name: 'Alpha Traders' },
      { id: 'client-2', client_name: 'Beta Logistics' },
    ];

    const records = [
      {
        id: 'record-1',
        client_id: 'client-1',
        filing_year: 2025,
        filing_month: 3,
        status: 'Filed',
        filing_date: '2025-03-20',
        remarks: 'Filed on time',
      },
    ];

    const rows = buildSalesTaxMasterSheetRows(clients as any, records as any, 2025, 3);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      clientId: 'client-1',
      clientName: 'Alpha Traders',
      hasExistingRecord: true,
      status: 'Filed',
      filingDate: '2025-03-20',
      remarks: 'Filed on time',
    });
    expect(rows[1]).toMatchObject({
      clientId: 'client-2',
      clientName: 'Beta Logistics',
      hasExistingRecord: false,
      status: 'Not Filed',
      filingDate: '',
      remarks: '',
    });
  });
});
