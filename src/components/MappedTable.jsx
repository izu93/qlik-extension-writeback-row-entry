import React, { useState, useEffect } from "react";
import {
  generateHypercubeFromMappings,
  generateTableStructure,
  validateMappingsForTable,
  createEditableTableConfig,
} from "../services/tableGenerator";

export default function MappedTable({
  columnMappings,
  parsedData,
  layout,
  app,
  model,
  selections,
}) {
  const [tableStructure, setTableStructure] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [editableConfig, setEditableConfig] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // Generate table when mappings change
  useEffect(() => {
    async function generateTable() {
      if (!columnMappings || Object.keys(columnMappings).length === 0) {
        return;
      }

      try {
        setIsGenerating(true);
        setError(null);

        // Validate mappings
        const validation = validateMappingsForTable(columnMappings);
        setValidationResult(validation);

        if (!validation.isValid) {
          setError(`Invalid mappings: ${validation.errors.join(", ")}`);
          return;
        }

        // Generate hypercube and table structure
        const hypercubeResult = generateHypercubeFromMappings(
          columnMappings,
          parsedData,
          { all: Object.values(columnMappings).map((m) => m.qlikField) }
        );

        const tableStruct = generateTableStructure(hypercubeResult, parsedData);
        setTableStructure(tableStruct);

        // Create editable configuration
        const editableConf = createEditableTableConfig(tableStruct, parsedData);
        setEditableConfig(editableConf);

        console.log("Table generation complete:", {
          hypercubeResult,
          tableStruct,
          editableConf,
        });
      } catch (err) {
        console.error("Table generation failed:", err);
        setError(err.message);
      } finally {
        setIsGenerating(false);
      }
    }

    generateTable();
  }, [columnMappings, parsedData]);

  if (isGenerating) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#007acc",
          fontSize: 14,
        }}
      >
        <div style={{ marginBottom: 16 }}>
          Generating table from mappings...
        </div>
        <div style={{ fontSize: 12 }}>
          Creating hypercube definition and table structure
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: 24,
          backgroundColor: "#fff3cd",
          border: "1px solid #ffeaa7",
          borderRadius: 4,
          color: "#856404",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>
          Table Generation Error
        </div>
        <div>{error}</div>
      </div>
    );
  }

  if (!tableStructure) {
    return (
      <div style={{ padding: 20, textAlign: "center", color: "#6c757d" }}>
        No table structure generated. Please check column mappings.
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 16,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: "#495057" }}>
          Generated Table Structure
        </h3>
        <div style={{ fontSize: 13, color: "#6c757d" }}>
          {tableStructure.totalColumns} columns mapped from{" "}
          {parsedData?.rows?.length || 0} data rows
        </div>
      </div>

      {/* Validation warnings */}
      {validationResult?.warnings?.length > 0 && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: "bold",
              color: "#856404",
              marginBottom: 4,
            }}
          >
            Validation Warnings:
          </div>
          {validationResult.warnings.map((warning, i) => (
            <div key={i} style={{ fontSize: 12, color: "#856404" }}>
              • {warning}
            </div>
          ))}
        </div>
      )}

      {/* Mapping summary */}
      {validationResult?.summary && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            backgroundColor: "#e8f5e8",
            border: "1px solid #d4edda",
            borderRadius: 6,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: "bold",
              color: "#155724",
              marginBottom: 8,
            }}
          >
            Table Summary
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 8,
              fontSize: 12,
              color: "#155724",
            }}
          >
            <div>Total mappings: {validationResult.summary.totalMappings}</div>
            <div>Dimensions: {validationResult.summary.dimensionMappings}</div>
            <div>Measures: {validationResult.summary.measureMappings}</div>
            <div>Other fields: {validationResult.summary.unknownMappings}</div>
          </div>
        </div>
      )}

      {/* Column headers preview */}
      <div style={{ marginBottom: 16 }}>
        <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#495057" }}>
          Column Structure
        </h4>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 8,
          }}
        >
          {tableStructure.headers.map((header, i) => (
            <div
              key={i}
              style={{
                padding: 8,
                border: "1px solid #dee2e6",
                borderRadius: 4,
                backgroundColor:
                  header.type === "dimension"
                    ? "#e3f2fd"
                    : header.type === "measure"
                    ? "#f3e5f5"
                    : "#f8f9fa",
              }}
            >
              <div
                style={{ fontSize: 12, fontWeight: "bold", color: "#495057" }}
              >
                {header.label}
              </div>
              <div style={{ fontSize: 11, color: "#6c757d" }}>
                → {header.qlikField}
              </div>
              <div style={{ fontSize: 10, color: "#868e96" }}>
                {header.type}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sample data preview */}
      {tableStructure.sampleRows.length > 0 && (
        <div style={{ flex: 1, overflow: "auto" }}>
          <h4 style={{ margin: "0 0 8px 0", fontSize: 14, color: "#495057" }}>
            Sample Data Preview
          </h4>
          <div
            style={{
              border: "1px solid #dee2e6",
              borderRadius: 4,
              overflow: "auto",
              backgroundColor: "white",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 12,
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  {tableStructure.headers.map((header, i) => (
                    <th
                      key={i}
                      style={{
                        padding: 8,
                        borderBottom: "2px solid #dee2e6",
                        borderRight:
                          i < tableStructure.headers.length - 1
                            ? "1px solid #dee2e6"
                            : "none",
                        textAlign: "left",
                        fontSize: 11,
                        fontWeight: "bold",
                        color: "#495057",
                      }}
                    >
                      <div>{header.label}</div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "#6c757d",
                          fontWeight: "normal",
                        }}
                      >
                        {header.qlikField}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableStructure.sampleRows.map((row, i) => (
                  <tr
                    key={i}
                    style={{
                      backgroundColor: i % 2 === 0 ? "white" : "#f9f9f9",
                    }}
                  >
                    {tableStructure.headers.map((header, j) => (
                      <td
                        key={j}
                        style={{
                          padding: 8,
                          borderBottom: "1px solid #dee2e6",
                          borderRight:
                            j < tableStructure.headers.length - 1
                              ? "1px solid #dee2e6"
                              : "none",
                        }}
                      >
                        {row[header.fileColumn]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Next steps info */}
      <div
        style={{
          marginTop: 16,
          padding: 12,
          backgroundColor: "#f0f8ff",
          border: "1px solid #b3d9ff",
          borderRadius: 4,
          fontSize: 12,
          color: "#0066cc",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>
          Phase 2 Complete! Table Structure Generated
        </div>
        <div>
          Next: Phase 3 will implement the full editable table with row-level
          editing, add/delete functionality, and writeback capabilities.
        </div>
      </div>
    </div>
  );
}
