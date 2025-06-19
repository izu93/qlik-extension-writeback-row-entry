// ===== 1. SIMPLE FILE PARSER =====
// fileParser.js - Only handles clean CSV files (no Excel corruption handling)
import Papa from "papaparse";

export async function parseCSVFile(file) {
  try {
    console.log("Parsing clean CSV file:", file.name);

    // Use PapaParse library to convert CSV to JavaScript objects
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true, // First row becomes column names
        skipEmptyLines: true, // Ignore blank rows
        dynamicTyping: true, // Auto-convert "123" to number 123
        complete: (results) => {
          console.log("CSV parsed:", results.data.length, "rows");

          // Analyze each column to understand its data type and content
          const columns = results.meta.fields.map((fieldName) => ({
            name: fieldName, // Column name from CSV header
            type: guessColumnType(results.data, fieldName), // text/numeric/swim_time
            sampleValues: results.data.slice(0, 3).map((row) => row[fieldName]), // First 3 values for preview
          }));

          // Return structured data for the Smart Matcher
          resolve({
            columns: columns, // Array of column info objects
            rows: results.data, // Array of data rows
            totalRows: results.data.length, // Count for display
            totalColumns: columns.length, // Count for display
          });
        },
        error: reject, // Pass any errors up to calling function
      });
    });
  } catch (error) {
    // Wrap any unexpected errors with context
    throw new Error(`CSV parsing failed: ${error.message}`);
  }
}

// Simple type detection - looks at first 10 values to guess column type
function guessColumnType(data, columnName) {
  // Extract first 10 non-empty values from this column
  const values = data
    .slice(0, 10)
    .map((row) => row[columnName])
    .filter((v) => v);

  // If all values are numbers, it's a numeric column
  if (values.every((v) => typeof v === "number")) return "numeric";

  // If any value looks like swimming time (e.g., "1:23.45"), it's swim time
  if (values.some((v) => /^\d+:\d{2}\.\d{2}$/.test(v))) return "swim_time";

  // Everything else is text
  return "text";
}