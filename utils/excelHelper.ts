import ExcelJS from 'exceljs';
import { ColumnMeta, FlatRow } from '../types';

interface ExportOptions {
  fileName: string;
  rows: FlatRow[];
  columns: ColumnMeta[];
  selectedColumns: Set<string>;
  mergeCells: boolean;
}

export const exportToExcel = async ({
  fileName,
  rows,
  columns,
  selectedColumns,
  mergeCells,
}: ExportOptions) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data');

  // 1. Setup Columns
  // Filter columns based on user selection
  const exportCols = columns.filter(col => selectedColumns.has(col.key));
  
  sheet.columns = exportCols.map(col => ({
    header: col.key,
    key: col.key,
    width: 20, // Default width
  }));

  // Style the header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' }, // Indigo-600
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // 2. Add Data Rows
  rows.forEach(row => {
    const rowData: Record<string, any> = {};
    exportCols.forEach(col => {
      // ExcelJS handles null/primitives well
      rowData[col.key] = row[col.key];
    });
    sheet.addRow(rowData);
  });

  // 3. Merge Logic (Optional)
  if (mergeCells) {
    // We iterate column by column to find consecutive identical values
    // Note: This is a simple visual merge based on current sort order
    exportCols.forEach((col, colIndex) => {
      const colLetter = sheet.getColumn(colIndex + 1).letter;
      let startRow = 2; // Row 1 is header
      let previousValue: any = sheet.getCell(`${colLetter}2`).value;

      // Iterate from 3rd row to end + 1 to flush last merge
      for (let i = 3; i <= rows.length + 2; i++) {
        const cell = sheet.getCell(`${colLetter}${i}`);
        const currentValue = i > rows.length + 1 ? '__END__' : cell.value;

        // Compare with previous value
        // Note: strictly comparing values. For safer merging, one might usually check parent IDs,
        // but here we mimic the visual "Excel-like" grouping.
        const isMatch = currentValue === previousValue && currentValue !== null && currentValue !== '';

        if (!isMatch) {
          // If we have a range > 1, merge
          if (i - 1 > startRow) {
            try {
              sheet.mergeCells(`${colLetter}${startRow}:${colLetter}${i - 1}`);
              // Align merged cells to top-left or center
              const mergedCell = sheet.getCell(`${colLetter}${startRow}`);
              mergedCell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
            } catch (e) {
              console.warn('Merge failed for range', `${colLetter}${startRow}:${colLetter}${i - 1}`);
            }
          }
          // Reset
          startRow = i;
          previousValue = currentValue;
        }
      }
    });
  }

  // 4. Final Polish
  sheet.eachRow((row, rowNumber) => {
      if(rowNumber > 1) {
          row.alignment = { vertical: 'middle', horizontal: 'left', wrapText: false };
          row.height = 20;
      }
  });

  // 5. Write and Download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};