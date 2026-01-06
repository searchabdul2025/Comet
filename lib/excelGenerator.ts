/**
 * Enhanced Excel generation utilities for admin exports
 * Includes professional formatting, summary sheets, and proper data structure
 */

import * as XLSX from 'xlsx';

export interface ExcelExportOptions {
  submissions: any[];
  agentNames?: Map<string, string>; // Map of user IDs to agent names
  formTitles?: Map<string, string>; // Map of form IDs to form titles
  includeSummary?: boolean;
  sheetName?: string;
}

/**
 * Converts submissions to Excel rows with all form fields expanded
 */
export function submissionsToExcelRows(
  submissions: any[],
  agentNames?: Map<string, string>,
  formTitles?: Map<string, string>
): any[] {
  if (!submissions || submissions.length === 0) {
    return [];
  }

  // Collect all unique form field IDs across all submissions
  const allFieldIds = new Set<string>();
  submissions.forEach((submission) => {
    if (submission.formData) {
      Object.keys(submission.formData).forEach((fieldId) => {
        allFieldIds.add(fieldId);
      });
    }
  });

  // Create field ID to name mapping from first submission that has form fields
  const fieldIdToName = new Map<string, string>();
  submissions.forEach((submission) => {
    if (submission.formId?.fields && Array.isArray(submission.formId.fields)) {
      submission.formId.fields.forEach((field: any) => {
        if (!fieldIdToName.has(field.id)) {
          fieldIdToName.set(field.id, field.name || field.id);
        }
      });
    }
  });

  // Convert submissions to rows
  return submissions.map((submission) => {
    const row: any = {
      'Submission ID': submission._id?.toString() || '',
      'Date': submission.createdAt ? formatDateForExcel(submission.createdAt) : '',
      'Time': submission.createdAt ? formatTimeForExcel(submission.createdAt) : '',
    };

    // Add agent name if available
    if (agentNames && submission.submittedBy) {
      const agentId = submission.submittedBy.toString();
      row['Agent Name'] = agentNames.get(agentId) || agentId;
    }

    // Add form title
    if (formTitles && submission.formId) {
      const formId = typeof submission.formId === 'string' 
        ? submission.formId 
        : submission.formId._id?.toString() || '';
      row['Form Name'] = formTitles.get(formId) || formId;
    }

    // Add phone number
    if (submission.phoneNumber) {
      row['Phone Number'] = submission.phoneNumber;
    }

    // Add all form fields as separate columns
    if (submission.formData) {
      allFieldIds.forEach((fieldId) => {
        const fieldName = fieldIdToName.get(fieldId) || fieldId;
        row[fieldName] = submission.formData[fieldId] || '';
      });
    }

    // Add IP address (optional, for admin)
    if (submission.ipAddress) {
      row['IP Address'] = submission.ipAddress;
    }

    return row;
  });
}

/**
 * Creates a summary sheet with statistics
 */
export function createSummarySheet(
  submissions: any[],
  agentNames?: Map<string, string>,
  formTitles?: Map<string, string>
): any[] {
  const summary: any[] = [];

  // Basic statistics
  summary.push({ Metric: 'Total Submissions', Value: submissions.length });
  summary.push({ Metric: '', Value: '' }); // Empty row

  // Date range
  if (submissions.length > 0) {
    const dates = submissions
      .map((s) => (s.createdAt ? new Date(s.createdAt) : null))
      .filter((d): d is Date => d !== null)
      .sort((a, b) => a.getTime() - b.getTime());

    if (dates.length > 0) {
      summary.push({ Metric: 'Date Range', Value: '' });
      summary.push({ Metric: '  From', Value: formatDateForExcel(dates[0]) });
      summary.push({ Metric: '  To', Value: formatDateForExcel(dates[dates.length - 1]) });
      summary.push({ Metric: '', Value: '' }); // Empty row
    }
  }

  // Submissions by agent
  if (agentNames && agentNames.size > 0) {
    const agentCounts = new Map<string, number>();
    submissions.forEach((submission) => {
      if (submission.submittedBy) {
        const agentId = submission.submittedBy.toString();
        agentCounts.set(agentId, (agentCounts.get(agentId) || 0) + 1);
      }
    });

    if (agentCounts.size > 0) {
      summary.push({ Metric: 'Submissions by Agent', Value: '' });
      agentCounts.forEach((count, agentId) => {
        const agentName = agentNames.get(agentId) || agentId;
        summary.push({ Metric: `  ${agentName}`, Value: count });
      });
      summary.push({ Metric: '', Value: '' }); // Empty row
    }
  }

  // Submissions by form
  if (formTitles && formTitles.size > 0) {
    const formCounts = new Map<string, number>();
    submissions.forEach((submission) => {
      if (submission.formId) {
        const formId = typeof submission.formId === 'string'
          ? submission.formId
          : submission.formId._id?.toString() || '';
        formCounts.set(formId, (formCounts.get(formId) || 0) + 1);
      }
    });

    if (formCounts.size > 0) {
      summary.push({ Metric: 'Submissions by Form', Value: '' });
      formCounts.forEach((count, formId) => {
        const formName = formTitles.get(formId) || formId;
        summary.push({ Metric: `  ${formName}`, Value: count });
      });
    }
  }

  // Export date
  summary.push({ Metric: '', Value: '' }); // Empty row
  summary.push({ Metric: 'Export Date', Value: formatDateForExcel(new Date()) });
  summary.push({ Metric: 'Export Time', Value: formatTimeForExcel(new Date()) });

  return summary;
}

/**
 * Generates a professional Excel workbook with formatted sheets
 */
export function generateExcelWorkbook(options: ExcelExportOptions): XLSX.WorkBook {
  const {
    submissions,
    agentNames,
    formTitles,
    includeSummary = true,
    sheetName = 'Submissions',
  } = options;

  const workbook = XLSX.utils.book_new();

  // Create main submissions sheet
  const rows = submissionsToExcelRows(submissions, agentNames, formTitles);
  const worksheet = XLSX.utils.json_to_sheet(rows);

  // Apply formatting
  applyWorksheetFormatting(worksheet, rows);

  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Add summary sheet if requested
  if (includeSummary && submissions.length > 0) {
    const summaryRows = createSummarySheet(submissions, agentNames, formTitles);
    const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');
  }

  return workbook;
}

/**
 * Applies professional formatting to worksheet
 */
function applyWorksheetFormatting(worksheet: XLSX.WorkSheet, rows: any[]) {
  if (!rows || rows.length === 0) return;

  // Set column widths (auto-width based on content)
  const maxWidth = 50;
  const minWidth = 12;
  const colWidths: number[] = [];

  // Get all column names
  const columnNames = Object.keys(rows[0] || {});

  columnNames.forEach((colName, index) => {
    // Calculate max width for this column
    let maxLen = colName.length;
    rows.forEach((row) => {
      const value = String(row[colName] || '');
      if (value.length > maxLen) {
        maxLen = value.length;
      }
    });

    // Set width with min/max constraints
    const width = Math.min(Math.max(maxLen + 3, minWidth), maxWidth);
    colWidths.push(width);
  });

  worksheet['!cols'] = colWidths.map((width) => ({ wch: width }));

  // Freeze first row (header) for better navigation
  worksheet['!freeze'] = { xSplit: 0, ySplit: 1, topLeftCell: 'A2', activePane: 'bottomLeft' };

  // Apply header formatting (bold, background color)
  const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
  if (headerRange.s.r >= 0) {
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      
      // Make header bold and add background color
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } }, // Professional blue background
        alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
    }
  }

  // Format date columns
  const dateColumns = ['Date', 'Submitted', 'Submission Date'];
  columnNames.forEach((colName, colIndex) => {
    if (dateColumns.some(dc => colName.includes(dc))) {
      for (let rowIndex = 1; rowIndex <= rows.length; rowIndex++) {
        const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].z = 'mm/dd/yyyy'; // US date format
        }
      }
    }
  });
}

/**
 * Formats date for Excel (MM/DD/YYYY)
 */
function formatDateForExcel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();

  return `${month}/${day}/${year}`;
}

/**
 * Formats time for Excel (HH:MM AM/PM)
 */
function formatTimeForExcel(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '';

  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12

  const minutesStr = String(minutes).padStart(2, '0');
  return `${hours}:${minutesStr} ${ampm}`;
}

