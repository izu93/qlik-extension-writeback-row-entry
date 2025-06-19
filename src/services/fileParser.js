/**
 * fileParser.js - File Parsing Service
 *
 * Handles parsing of Excel and CSV files uploaded by users.
 * Extracts column headers and sample data for intelligent mapping.
 */

import Papa from "papaparse";

/**
 * Parse uploaded file (Excel or CSV) and extract structured data
 * @param {File} file - The uploaded file object
 * @returns {Object} - Parsed data with columns, rows, and metadata
 */
export async function parseUploadedFile(file) {
  try {
    console.log(
      "Parsing file:",
      file.name,
      file.type,
      `${(file.size / 1024).toFixed(1)}KB`
    );

    // Determine file type and parse accordingly
    const fileExtension = file.name.toLowerCase().split(".").pop();

    let parsedData;

    if (fileExtension === "csv") {
      parsedData = await parseCSVFile(file);
    } else if (["xlsx", "xls"].includes(fileExtension)) {
      parsedData = await parseExcelFile(file);
    } else {
      throw new Error(`Unsupported file format: ${fileExtension}`);
    }

    // Analyze and enhance the parsed data
    const enhancedData = enhanceDataStructure(parsedData, file);

    console.log("File parsing complete:", {
      columns: enhancedData.columns.length,
      rows: enhancedData.rows.length,
      fileType: enhancedData.metadata.fileType,
    });

    return enhancedData;
  } catch (error) {
    console.error("File parsing failed:", error);
    throw new Error(`Failed to parse file: ${error.message}`);
  }
}

/**
 * Parse CSV file using PapaParse
 */
async function parseCSVFile(file) {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim(), // Clean up headers
      complete: (results) => {
        if (results.errors.length > 0) {
          console.warn("CSV parsing warnings:", results.errors);
        }

        resolve({
          columns: results.meta.fields,
          rows: results.data,
          metadata: {
            fileType: "csv",
            delimiter: results.meta.delimiter,
            linebreak: results.meta.linebreak,
            parseErrors: results.errors,
          },
        });
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      },
    });
  });
}

/**
 * Parse Excel file using browser-compatible method
 * Note: This is a simplified version - full SheetJS integration would require additional setup
 */
async function parseExcelFile(file) {
  try {
    // For now, we'll try to read Excel as CSV (many Excel files can be parsed this way)
    // In a full implementation, you'd use SheetJS/xlsx library

    const text = await file.text();

    // Try to parse as tab-delimited (common Excel export format)
    return new Promise((resolve, reject) => {
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        delimiter: "\t", // Try tab delimiter first
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          // If tab parsing failed, try comma delimiter
          if (results.data.length === 0 || results.meta.fields.length <= 1) {
            Papa.parse(text, {
              header: true,
              skipEmptyLines: true,
              dynamicTyping: true,
              delimiter: ",",
              transformHeader: (header) => header.trim(),
              complete: (retryResults) => {
                resolve({
                  columns: retryResults.meta.fields,
                  rows: retryResults.data,
                  metadata: {
                    fileType: "excel",
                    delimiter: retryResults.meta.delimiter,
                    parseMethod: "text-based",
                  },
                });
              },
              error: reject,
            });
          } else {
            resolve({
              columns: results.meta.fields,
              rows: results.data,
              metadata: {
                fileType: "excel",
                delimiter: results.meta.delimiter,
                parseMethod: "text-based",
              },
            });
          }
        },
        error: reject,
      });
    });
  } catch (error) {
    throw new Error(`Excel parsing error: ${error.message}`);
  }
}

/**
 * Enhance parsed data with additional analysis and structure
 */
function enhanceDataStructure(parsedData, originalFile) {
  const { columns, rows, metadata } = parsedData;

  // Analyze column types and patterns
  const analyzedColumns = columns.map((col) => analyzeColumn(col, rows));

  // Get sample data for preview (first 5 rows)
  const sampleRows = rows.slice(0, 5);

  // Generate column statistics
  const columnStats = generateColumnStatistics(analyzedColumns, rows);

  // Detect swimming-specific patterns
  const swimmingContext = detectSwimmingPatterns(analyzedColumns, rows);

  return {
    columns: analyzedColumns,
    rows: rows,
    sampleRows: sampleRows,
    metadata: {
      ...metadata,
      fileName: originalFile.name,
      fileSize: originalFile.size,
      lastModified: originalFile.lastModified,
      totalRows: rows.length,
      totalColumns: columns.length,
      parseTimestamp: new Date().toISOString(),
    },
    statistics: columnStats,
    swimmingContext: swimmingContext,
  };
}

/**
 * Analyze individual column to determine data type and characteristics
 */
function analyzeColumn(columnName, rows) {
  const values = rows
    .map((row) => row[columnName])
    .filter((val) => val !== null && val !== undefined && val !== "");

  if (values.length === 0) {
    return {
      name: columnName,
      type: "empty",
      uniqueValues: 0,
      sampleValues: [],
    };
  }

  // Determine data type
  const type = inferDataType(values);

  // Get unique values (limited for performance)
  const uniqueValues = [...new Set(values)].slice(0, 50);

  // Get sample values
  const sampleValues = values.slice(0, 10);

  return {
    name: columnName,
    type: type,
    uniqueValues: uniqueValues.length,
    sampleValues: sampleValues,
    totalValues: values.length,
    hasNulls: rows.length > values.length,
    cardinality: uniqueValues.length / values.length, // Ratio of unique to total values
  };
}

/**
 * Infer data type from sample values
 */
function inferDataType(values) {
  const sampleSize = Math.min(values.length, 100);
  const sample = values.slice(0, sampleSize);

  let numericCount = 0;
  let dateCount = 0;
  let timeCount = 0;

  for (const value of sample) {
    if (typeof value === "number" || !isNaN(Number(value))) {
      numericCount++;
    }

    if (isDateLike(value)) {
      dateCount++;
    }

    if (isTimeLike(value)) {
      timeCount++;
    }
  }

  const numericRatio = numericCount / sampleSize;
  const dateRatio = dateCount / sampleSize;
  const timeRatio = timeCount / sampleSize;

  // Determine primary type based on ratios
  if (timeRatio > 0.8) return "time";
  if (dateRatio > 0.8) return "date";
  if (numericRatio > 0.8) return "numeric";
  if (numericRatio > 0.5) return "mixed_numeric";

  return "text";
}

/**
 * Check if value looks like a date
 */
function isDateLike(value) {
  if (!value) return false;

  const str = String(value);

  // Common date patterns
  const datePatterns = [
    /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
    /^\d{2}\/\d{2}\/\d{4}$/, // MM/DD/YYYY
    /^\d{2}-\d{2}-\d{4}$/, // MM-DD-YYYY
  ];

  return (
    datePatterns.some((pattern) => pattern.test(str)) || !isNaN(Date.parse(str))
  );
}

/**
 * Check if value looks like a time
 */
function isTimeLike(value) {
  if (!value) return false;

  const str = String(value);

  // Time patterns (swimming times, timestamps, etc.)
  const timePatterns = [
    /^\d{1,2}:\d{2}:\d{2}$/, // HH:MM:SS
    /^\d{1,2}:\d{2}\.\d{2}$/, // MM:SS.MS (swimming time)
    /^\d{2,3}\.\d{2}$/, // SS.MS (short swimming time)
  ];

  return timePatterns.some((pattern) => pattern.test(str));
}

/**
 * Generate statistics for all columns
 */
function generateColumnStatistics(columns, rows) {
  return {
    totalColumns: columns.length,
    columnTypes: columns.reduce((acc, col) => {
      acc[col.type] = (acc[col.type] || 0) + 1;
      return acc;
    }, {}),
    averageCardinality:
      columns.reduce((sum, col) => sum + col.cardinality, 0) / columns.length,
    emptyColumns: columns.filter((col) => col.type === "empty").length,
    numericColumns: columns.filter(
      (col) => col.type === "numeric" || col.type === "mixed_numeric"
    ).length,
    textColumns: columns.filter((col) => col.type === "text").length,
  };
}

/**
 * Detect swimming-specific patterns in the data
 */
function detectSwimmingPatterns(columns, rows) {
  const swimmingKeywords = {
    athlete: ["name", "athlete", "swimmer", "participant"],
    performance: ["time", "duration", "reaction_time", "split", "lap_time"],
    event: [
      "event",
      "stroke",
      "distance",
      "style",
      "freestyle",
      "backstroke",
      "butterfly",
      "breaststroke",
    ],
    competition: [
      "heat",
      "lane",
      "place",
      "rank",
      "position",
      "competition",
      "meet",
    ],
    team: ["team", "club", "country", "nation"],
  };

  const detectedPatterns = {};

  columns.forEach((col) => {
    const colNameLower = col.name.toLowerCase();

    Object.entries(swimmingKeywords).forEach(([category, keywords]) => {
      keywords.forEach((keyword) => {
        if (colNameLower.includes(keyword)) {
          if (!detectedPatterns[category]) {
            detectedPatterns[category] = [];
          }
          detectedPatterns[category].push(col.name);
        }
      });
    });
  });

  const isSwimmingData = Object.keys(detectedPatterns).length >= 2; // At least 2 categories detected

  return {
    isSwimmingData,
    detectedPatterns,
    confidence:
      Object.keys(detectedPatterns).length /
      Object.keys(swimmingKeywords).length,
  };
}
