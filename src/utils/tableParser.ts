import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export interface ParsedTable {
  headers: string[];
  rows: string[][];
  markdown: string;
  rowCount: number;
  columnCount: number;
}

/**
 * Parse CSV file and convert to table data
 */
export async function parseCSV(file: File): Promise<ParsedTable> {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const data = results.data as string[][];
          
          if (data.length === 0) {
            reject(new Error('CSV file is empty'));
            return;
          }
          
          const headers = data[0];
          const rows = data.slice(1);
          const markdown = convertToMarkdownTable(headers, rows);
          
          resolve({
            headers,
            rows,
            markdown,
            rowCount: rows.length,
            columnCount: headers.length,
          });
        } catch (error) {
          reject(error);
        }
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse Excel file and convert to table data
 */
export async function parseExcel(file: File): Promise<ParsedTable> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get the first sheet
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Convert to 2D array
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
        
        if (jsonData.length === 0) {
          reject(new Error('Excel file is empty'));
          return;
        }
        
        const headers = jsonData[0].map(h => String(h || ''));
        const rows = jsonData.slice(1).map(row => 
          row.map(cell => String(cell ?? ''))
        );
        const markdown = convertToMarkdownTable(headers, rows);
        
        resolve({
          headers,
          rows,
          markdown,
          rowCount: rows.length,
          columnCount: headers.length,
        });
      } catch (error) {
        reject(new Error(`Excel parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read Excel file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Convert table data to markdown format
 */
function convertToMarkdownTable(headers: string[], rows: string[][]): string {
  // Build header row
  const headerRow = '| ' + headers.join(' | ') + ' |';
  
  // Build separator row
  const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |';
  
  // Build data rows
  const dataRows = rows.map(row => {
    // Ensure row has same number of columns as headers
    const paddedRow = [...row];
    while (paddedRow.length < headers.length) {
      paddedRow.push('');
    }
    return '| ' + paddedRow.slice(0, headers.length).join(' | ') + ' |';
  });
  
  return [headerRow, separatorRow, ...dataRows].join('\n');
}

/**
 * Parse file based on extension
 */
export async function parseTableFile(file: File): Promise<ParsedTable> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return parseCSV(file);
    case 'xlsx':
    case 'xls':
      return parseExcel(file);
    default:
      throw new Error(`Unsupported file type: ${extension}. Only CSV and Excel files are supported.`);
  }
}

/**
 * Format table data as a readable summary
 */
export function formatTableSummary(table: ParsedTable): string {
  const hasMore = table.rows.length > 3;
  
  let summary = `📊 **Table Data** (${table.rowCount} rows × ${table.columnCount} columns)\n\n`;
  summary += table.markdown;
  
  if (hasMore) {
    summary += `\n\n_... and ${table.rowCount - 3} more rows_`;
  }
  
  return summary;
}
