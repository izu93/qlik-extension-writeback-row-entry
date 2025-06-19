/**
 * tableGenerator.js - Dynamic Table Builder Service
 *
 * Converts confirmed column mappings into Qlik hypercube definitions
 * and generates the structure for the final editable table.
 */

/**
 * Generate hypercube definition from confirmed mappings
 * @param {Object} mappings - Confirmed column mappings
 * @param {Object} parsedData - Original file data
 * @param {Object} qlikFields - Available Qlik fields
 * @returns {Object} - Hypercube definition for Qlik
 */
export function generateHypercubeFromMappings(
  mappings,
  parsedData,
  qlikFields
) {
  try {
    console.log("Generating hypercube from mappings:", mappings);

    const dimensions = [];
    const measures = [];
    const allColumns = [];

    // Process each mapping
    Object.entries(mappings).forEach(([fileColumn, mapping]) => {
      if (!mapping.qlikField) return;

      const qlikField = mapping.qlikField;
      const fieldName = qlikField.name;

      // Create column definition
      const columnDef = {
        fileColumn: fileColumn,
        qlikField: fieldName,
        qlikFieldObj: qlikField,
        mapping: mapping,
        type: qlikField.category || "field",
      };

      allColumns.push(columnDef);

      // Add to appropriate category
      if (qlikField.category === "dimension") {
        dimensions.push({
          qDef: {
            qFieldDefs: [fieldName],
            qFieldLabels: [fileColumn], // Use file column name as label
          },
          qNullSuppression: false,
          qOtherTotalSpec: {
            qOtherMode: "OTHER_OFF",
            qSuppressOther: true,
          },
        });
      } else if (qlikField.category === "measure") {
        measures.push({
          qDef: {
            qDef: `Sum([${fieldName}])`, // Simple sum aggregation
            qLabel: fileColumn, // Use file column name as label
          },
        });
      } else {
        // Treat unknown fields as dimensions
        dimensions.push({
          qDef: {
            qFieldDefs: [fieldName],
            qFieldLabels: [fileColumn],
          },
          qNullSuppression: false,
        });
      }
    });

    // Create hypercube definition
    const hypercubeDef = {
      qDimensions: dimensions,
      qMeasures: measures,
      qInitialDataFetch: [
        {
          qWidth: dimensions.length + measures.length,
          qHeight: Math.min(1000, parsedData.rows?.length || 100),
        },
      ],
    };

    console.log("Generated hypercube definition:", hypercubeDef);

    return {
      hypercubeDef,
      columnDefinitions: allColumns,
      dimensionCount: dimensions.length,
      measureCount: measures.length,
    };
  } catch (error) {
    console.error("Failed to generate hypercube:", error);
    throw new Error(`Hypercube generation failed: ${error.message}`);
  }
}

/**
 * Generate table structure for display
 * @param {Object} hypercubeResult - Result from generateHypercubeFromMappings
 * @param {Object} parsedData - Original file data
 * @returns {Object} - Table structure with headers and sample data
 */
export function generateTableStructure(hypercubeResult, parsedData) {
  try {
    const { columnDefinitions } = hypercubeResult;

    // Create table headers
    const headers = columnDefinitions.map((colDef) => ({
      fileColumn: colDef.fileColumn,
      qlikField: colDef.qlikField,
      type: colDef.type,
      label: colDef.fileColumn, // Display file column name
    }));

    // Create sample rows using original file data
    const sampleRows = [];
    const maxSampleRows = Math.min(5, parsedData.rows?.length || 0);

    for (let i = 0; i < maxSampleRows; i++) {
      const originalRow = parsedData.rows[i];
      const tableRow = {};

      columnDefinitions.forEach((colDef) => {
        tableRow[colDef.fileColumn] = originalRow[colDef.fileColumn];
      });

      sampleRows.push(tableRow);
    }

    return {
      headers,
      sampleRows,
      totalColumns: columnDefinitions.length,
      originalRowCount: parsedData.rows?.length || 0,
    };
  } catch (error) {
    console.error("Failed to generate table structure:", error);
    throw new Error(`Table structure generation failed: ${error.message}`);
  }
}

/**
 * Validate mappings before table generation
 * @param {Object} mappings - Column mappings to validate
 * @returns {Object} - Validation result
 */
export function validateMappingsForTable(mappings) {
  const validation = {
    isValid: true,
    errors: [],
    warnings: [],
    summary: {
      totalMappings: Object.keys(mappings).length,
      dimensionMappings: 0,
      measureMappings: 0,
      unknownMappings: 0,
    },
  };

  // Check if we have any mappings
  if (validation.summary.totalMappings === 0) {
    validation.isValid = false;
    validation.errors.push("No column mappings defined");
    return validation;
  }

  // Analyze mapping types
  Object.values(mappings).forEach((mapping) => {
    if (!mapping.qlikField) {
      validation.warnings.push(`Mapping missing Qlik field`);
      return;
    }

    const category = mapping.qlikField.category;
    if (category === "dimension") {
      validation.summary.dimensionMappings++;
    } else if (category === "measure") {
      validation.summary.measureMappings++;
    } else {
      validation.summary.unknownMappings++;
    }
  });

  // Validation rules
  if (
    validation.summary.dimensionMappings === 0 &&
    validation.summary.unknownMappings === 0
  ) {
    validation.warnings.push(
      "No dimension fields mapped - table may not display properly"
    );
  }

  if (validation.summary.measureMappings === 0) {
    validation.warnings.push(
      "No measure fields mapped - consider adding measures for calculations"
    );
  }

  // Check for duplicate Qlik fields
  const usedFields = new Set();
  const duplicates = [];

  Object.entries(mappings).forEach(([fileCol, mapping]) => {
    if (mapping.qlikField) {
      const fieldName = mapping.qlikField.name;
      if (usedFields.has(fieldName)) {
        duplicates.push(fieldName);
      }
      usedFields.add(fieldName);
    }
  });

  if (duplicates.length > 0) {
    validation.errors.push(
      `Duplicate Qlik field mappings: ${duplicates.join(", ")}`
    );
    validation.isValid = false;
  }

  return validation;
}

/**
 * Generate property panel updates for the extension
 * @param {Object} hypercubeResult - Generated hypercube result
 * @returns {Object} - Property updates
 */
export function generatePropertyUpdates(hypercubeResult) {
  const { hypercubeDef } = hypercubeResult;

  return {
    qHyperCubeDef: hypercubeDef,
    // Add any additional property updates needed
    lastUpdated: new Date().toISOString(),
    mappingSource: "smart-writeback-extension",
  };
}

/**
 * Create editable table configuration
 * @param {Object} tableStructure - Generated table structure
 * @param {Object} originalData - Original file data
 * @returns {Object} - Editable table configuration
 */
export function createEditableTableConfig(tableStructure, originalData) {
  const { headers } = tableStructure;

  // Generate editable columns configuration
  const editableColumns = headers.map((header) => ({
    id: header.fileColumn,
    label: header.label,
    qlikField: header.qlikField,
    type: header.type,
    editable: true, // All columns editable for writeback
    validation: getColumnValidation(header.type),
    inputType: getInputType(header.type),
  }));

  // Create initial data rows
  const editableRows =
    originalData.rows?.map((row, index) => ({
      id: `row_${index}`,
      originalIndex: index,
      data: headers.reduce((acc, header) => {
        acc[header.fileColumn] = row[header.fileColumn];
        return acc;
      }, {}),
      isNew: false,
      isModified: false,
    })) || [];

  return {
    columns: editableColumns,
    rows: editableRows,
    config: {
      allowAdd: true,
      allowDelete: true,
      allowEdit: true,
      pageSize: 25,
      enableSearch: true,
      enableSort: true,
    },
  };
}

/**
 * Get validation rules for column type
 */
function getColumnValidation(type) {
  switch (type) {
    case "numeric":
      return {
        required: false,
        type: "number",
        min: null,
        max: null,
      };
    case "date":
      return {
        required: false,
        type: "date",
        format: "YYYY-MM-DD",
      };
    case "time":
      return {
        required: false,
        type: "time",
        format: "HH:mm:ss",
      };
    default:
      return {
        required: false,
        type: "text",
        maxLength: 255,
      };
  }
}

/**
 * Get input type for column
 */
function getInputType(type) {
  switch (type) {
    case "numeric":
      return "number";
    case "date":
      return "date";
    case "time":
      return "time";
    default:
      return "text";
  }
}
