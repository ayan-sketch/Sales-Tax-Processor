import type { SalesTaxRecord } from '../types/salesTax';

export interface SalesTaxMasterSheetRow {
  clientId: string;
  clientName: string;
  year: number;
  month: number;
  status: 'Filed' | 'Pending' | 'Not Filed' | 'Overdue';
  filingDate: string;
  remarks: string;
  hasExistingRecord: boolean;
  recordId?: string;
}

export function buildSalesTaxMasterSheetRows(
  clients: Array<{ id: string; client_name: string }>,
  records: SalesTaxRecord[],
  year: number,
  month: number,
): SalesTaxMasterSheetRow[] {
  return clients.map((client) => {
    const existingRecord = records.find(
      (record) => record.client_id === client.id && record.filing_year === year && record.filing_month === month,
    );

    return {
      clientId: client.id,
      clientName: client.client_name,
      year,
      month,
      status: existingRecord?.status || 'Not Filed',
      filingDate: existingRecord?.filing_date || '',
      remarks: existingRecord?.remarks || '',
      hasExistingRecord: Boolean(existingRecord),
      recordId: existingRecord?.id,
    };
  });
}
