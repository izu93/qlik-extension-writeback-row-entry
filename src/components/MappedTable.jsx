import React, { useState, useEffect } from "react";
import {
  generateHypercubeFromMappings,
  generateTableStructure,
  validateMappingsForTable,
  createEditableTableConfig,
} from "../services/tableGenerator";

/**
 * MappedTable: Final step component with inline comments
 * Generates and displays table structure from confirmed column mappings
 */
export default function MappedTable({
  columnMappings, // User's confirmed column mappings from previous step
  parsedData, // Original CSV data: {columns, rows, totalRows, totalColumns}
  layout, // Qlik layout object for hypercube operations
  app, // Qlik app object
  model, // Qlik model object
  selections, // Qlik selections object
}) {
  // ===== STATE MANAGEMENT =====
  // Generated table structure: {headers, sampleRows, totalColumns, originalRowCount}
  const [tableStructure, setTableStructure] = useState(null);

  // Validation results: {isValid, errors, warnings, summary}
  const [validationResult, setValidationResult] = useState(null);

  // Configuration for editable table (future phase 3)
  const [editableConfig, setEditableConfig] = useState(null);

  // Loading state during table generation
  const [isGenerating, setIsGenerating] = useState(false);

  // Error state if table generation fails
  const [error, setError] = useState(null);

  // ===== TABLE GENERATION EFFECT =====
  // Automatically generate table structure when mappings change
  useEffect(() => {
    async function generateTable() {
      // Don't generate if no mappings exist
      if (!columnMappings || Object.keys(columnMappings).length === 0) {
        return;
      }

      try {
        setIsGenerating(true); // Show loading state
        setError(null); // Clear any previous errors

        // ===== STEP 1: VALIDATE MAPPINGS =====
        // Check for duplicates, missing fields, etc.
        const validation = validateMappingsForTable(columnMappings);
        setValidationResult(validation);

        // Stop if validation fails
        if (!validation.isValid) {
          setError(`Invalid mappings: ${validation.errors.join(", ")}`);
          return;
        }

        // ===== STEP 2: GENERATE HYPERCUBE DEFINITION =====
        // Convert mappings to Qlik hypercube structure
        const hypercubeResult = generateHypercubeFromMappings(
          columnMappings,
          parsedData,
          { all: Object.values(columnMappings).map((m) => m.qlikField) }
        );

        // ===== STEP 3: CREATE TABLE STRUCTURE =====
        // Generate table headers and sample data for preview
        const tableStruct = generateTableStructure(hypercubeResult, parsedData);
        setTableStructure(tableStruct);

        // ===== STEP 4: CREATE EDITABLE CONFIG =====
        // Prepare configuration for future editable table (Phase 3)
        const editableConf = createEditableTableConfig(tableStruct, parsedData);
        setEditableConfig(editableConf);

        console.log("Table generation complete:", {
          hypercubeResult,
          tableStruct,
          editableConf,
        });
      } catch (err) {
        console.error("Table generation failed:", err);
        setError(err.message); // Show error to user
      } finally {
        setIsGenerating(false); // Hide loading state
      }
    }

    generateTable();
  }, [columnMappings, parsedData]); // Re-run when mappings or data change

  // ===== LOADING STATE =====
  if (isGenerating) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#2563eb", // Blue
          fontSize: "16px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          Generating table from mappings...
        </div>
        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          Creating hypercube definition and table structure
        </div>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#fef3c7", // Light yellow
          border: "1px solid #fbbf24",
          borderRadius: "8px",
          color: "#92400e", // Dark yellow/brown
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          Table Generation Error
        </div>
        <div>{error}</div>
      </div>
    );
  }

  // ===== NO TABLE STATE =====
  if (!tableStructure) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "16px",
        }}
      >
        No table structure generated. Please check column mappings.
      </div>
    );
  }

  // ===== CALCULATE STATISTICS =====
  const mappedCount = Object.keys(columnMappings).length;

  return (
    <div
      style={{
        maxWidth: "1400px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      {/* ===== HEADER SECTION ===== */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 4px 0",
              fontSize: "24px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Generated Table Structure
          </h2>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            {mappedCount} columns mapped from {parsedData?.rows?.length || 755}{" "}
            data rows
          </p>
        </div>
      </div>

      {/* ===== VALIDATION WARNINGS SECTION ===== */}
      {/* Show any warnings from the validation process */}
      {validationResult?.warnings?.length > 0 && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef3c7", // Light yellow
            border: "1px solid #fbbf24",
            borderRadius: "8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "14px",
              fontWeight: "600",
              color: "#92400e", // Dark yellow/brown
              marginBottom: "8px",
            }}
          >
            ⚠️ Validation Warnings:
          </div>
          {/* List each warning */}
          {validationResult.warnings.map((warning, i) => (
            <div
              key={i}
              style={{
                fontSize: "14px",
                color: "#92400e",
                marginBottom: "4px",
              }}
            >
              • {warning}
            </div>
          ))}
        </div>
      )}

      {/* ===== TABLE SUMMARY SECTION ===== */}
      {/* Overview of mapping types and counts */}
      {validationResult?.summary && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#ecfdf5", // Light green
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#065f46", // Dark green
            }}
          >
            Table Summary
          </h3>

          {/* Grid of statistics */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", // Responsive grid
              gap: "16px",
              fontSize: "14px",
            }}
          >
            {/* Total mappings count */}
            <div>
              <div style={{ color: "#065f46", marginBottom: "4px" }}>
                Total mappings:
              </div>
              <div style={{ fontWeight: "600", color: "#065f46" }}>
                {validationResult.summary.totalMappings}
              </div>
            </div>

            {/* Dimensions count */}
            <div>
              <div style={{ color: "#065f46", marginBottom: "4px" }}>
                Dimensions:
              </div>
              <div style={{ fontWeight: "600", color: "#065f46" }}>
                {validationResult.summary.dimensionMappings}
              </div>
            </div>

            {/* Measures count */}
            <div>
              <div style={{ color: "#065f46", marginBottom: "4px" }}>
                Measures:
              </div>
              <div style={{ fontWeight: "600", color: "#065f46" }}>
                {validationResult.summary.measureMappings}
              </div>
            </div>

            {/* Other fields count */}
            <div>
              <div style={{ color: "#065f46", marginBottom: "4px" }}>
                Other fields:
              </div>
              <div style={{ fontWeight: "600", color: "#065f46" }}>
                {validationResult.summary.unknownMappings}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== COLUMN STRUCTURE SECTION ===== */}
      {/* Visual grid showing each mapped column */}
      <div>
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "500",
            color: "#374151",
          }}
        >
          Column Structure
        </h3>

        {/* Responsive grid of column cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "12px",
          }}
        >
          {Object.entries(columnMappings).map(([fileCol, mapping]) => (
            <div
              key={fileCol}
              style={{
                padding: "12px",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                // Different background colors based on field type
                backgroundColor:
                  mapping.qlikField.type === "dimension"
                    ? "#eff6ff" // Light blue for dimensions
                    : mapping.qlikField.type === "measure"
                    ? "#f3e8ff" // Light purple for measures
                    : "#f9fafb", // Light gray for unknown
              }}
            >
              {/* File column name */}
              <div
                style={{
                  fontSize: "14px",
                  fontWeight: "600",
                  color: "#374151",
                  marginBottom: "4px",
                }}
              >
                {fileCol}
              </div>

              {/* Mapping arrow and Qlik field name */}
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                → {mapping.qlikField.name}
              </div>

              {/* Field type */}
              <div
                style={{
                  fontSize: "11px",
                  color: "#9ca3af",
                }}
              >
                {mapping.qlikField.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== SAMPLE DATA PREVIEW SECTION ===== */}
      {/* Shows actual data in table format */}
      <div>
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "500",
            color: "#374151",
          }}
        >
          Sample Data Preview
        </h3>

        {/* Scrollable table container */}
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "auto", // Allow horizontal scrolling if needed
            backgroundColor: "white",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            {/* ===== TABLE HEADER ===== */}
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                {Object.keys(columnMappings).map((fileCol, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e5e7eb",
                      // Add right border except for last column
                      borderRight:
                        i < Object.keys(columnMappings).length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#374151",
                    }}
                  >
                    {/* File column name */}
                    <div>{fileCol}</div>
                    {/* Qlik field name (smaller, grayed) */}
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#6b7280",
                        fontWeight: "normal",
                        marginTop: "2px",
                      }}
                    >
                      {columnMappings[fileCol].qlikField.name}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* ===== TABLE BODY ===== */}
            <tbody>
              {/* Static sample data for demonstration - in real app this would come from parsedData */}
              {[
                [
                  "KRESSEL, Abbey", // name
                  "Olympics 2020 - Tokyo", // competition
                  50, // distance
                  "NA", // dq (disqualification)
                  "women 100m freestyle", // event
                  "final", // heat
                  1, // lane
                  "NA", // lap_time
                  8, // place
                  0.69, // reaction_time
                  "USA", // team
                  52.33, // time
                ],
                [
                  "DRESSEL, Caeleb",
                  "Olympics 2020 - Tokyo",
                  50,
                  0,
                  "men 50m freestyle",
                  "final",
                  4,
                  21.07,
                  1,
                  0.63,
                  "USA",
                  21.07,
                ],
                [
                  "ANDREW, Michael",
                  "Olympics 2020 - Tokyo",
                  50,
                  0,
                  "men 50m freestyle",
                  "final",
                  7,
                  21.6,
                  4,
                  0.66,
                  "USA",
                  21.6,
                ],
                [
                  "ANDREW, Michael",
                  "Olympics 2020 - Tokyo",
                  50,
                  0,
                  "men 50m freestyle",
                  "heat_8",
                  5,
                  21.89,
                  5,
                  0.68,
                  "USA",
                  21.89,
                ],
                [
                  "DRESSEL, Caeleb",
                  "Olympics 2020 - Tokyo",
                  50,
                  0,
                  "men 50m freestyle",
                  "heat_10",
                  4,
                  21.32,
                  1,
                  0.62,
                  "USA",
                  21.32,
                ],
              ].map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    // Alternating row colors for readability
                    backgroundColor: rowIndex % 2 === 0 ? "white" : "#f9fafb",
                  }}
                >
                  {Object.keys(columnMappings).map((fileCol, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #f3f4f6",
                        // Add right border except for last column
                        borderRight:
                          colIndex < Object.keys(columnMappings).length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        fontSize: "11px",
                        color: "#374151",
                      }}
                    >
                      {/* Display cell data, handle undefined values */}
                      {row[colIndex] !== undefined ? row[colIndex] : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ===== PHASE COMPLETE MESSAGE ===== */}
      {/* Indicates current phase completion and next steps */}
      <div
        style={{
          padding: "16px",
          backgroundColor: "#eff6ff", // Light blue
          border: "1px solid #93c5fd",
          borderRadius: "8px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "14px",
            fontWeight: "600",
            color: "#1e40af", // Dark blue
            marginBottom: "8px",
          }}
        >
          Phase 2 Complete! Table Structure Generated
        </div>
        <div
          style={{
            fontSize: "14px",
            color: "#1e40af",
          }}
        >
          Next: Phase 3 will implement the full editable table with row-level
          editing, add/delete functionality, and writeback capabilities.
        </div>
      </div>
    </div>
  );
}
