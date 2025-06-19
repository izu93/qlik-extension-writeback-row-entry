import React, { useState, useEffect } from "react";
import {
  generateHypercubeFromMappings,
  generateTableStructure,
  validateMappingsForTable,
  createEditableTableConfig,
} from "../services/tableGenerator";
import EditableTable from "./EditableTable";

/**
 * MappedTable: FIXED VERSION - Always shows table structure first
 */
export default function MappedTable({
  columnMappings,
  parsedData,
  layout,
  app,
  model,
  selections,
}) {
  // ===== STATE MANAGEMENT =====
  const [tableStructure, setTableStructure] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [editableConfig, setEditableConfig] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  // ===== CRITICAL: THIS MUST ALWAYS START AS FALSE =====
  const [showEditableTable, setShowEditableTable] = useState(false);

  // ===== DEBUG: Log when this component mounts =====
  useEffect(() => {
    console.log(
      "🔍 MappedTable mounted with showEditableTable:",
      showEditableTable
    );
    console.log("🔍 Column mappings:", columnMappings);
    console.log("🔍 Parsed data:", parsedData);
  }, []);

  // ===== DEBUG: Log when showEditableTable changes =====
  useEffect(() => {
    console.log("🔍 showEditableTable changed to:", showEditableTable);
  }, [showEditableTable]);

  // ===== TABLE GENERATION EFFECT =====
  useEffect(() => {
    async function generateTable() {
      if (!columnMappings || Object.keys(columnMappings).length === 0) {
        console.log("🔍 No column mappings, skipping table generation");
        return;
      }

      try {
        console.log("🔍 Starting table generation...");
        setIsGenerating(true);
        setError(null);

        const validation = validateMappingsForTable(columnMappings);
        setValidationResult(validation);

        if (!validation.isValid) {
          setError(`Invalid mappings: ${validation.errors.join(", ")}`);
          return;
        }

        const hypercubeResult = generateHypercubeFromMappings(
          columnMappings,
          parsedData,
          { all: Object.values(columnMappings).map((m) => m.qlikField) }
        );

        const tableStruct = generateTableStructure(hypercubeResult, parsedData);
        setTableStructure(tableStruct);

        const editableConf = createEditableTableConfig(tableStruct, parsedData);
        setEditableConfig(editableConf);

        console.log("🔍 Table generation complete - staying on structure view");
      } catch (err) {
        console.error("🔍 Table generation failed:", err);
        setError(err.message);
      } finally {
        setIsGenerating(false);
      }
    }

    generateTable();
  }, [columnMappings, parsedData]);

  // ===== PHASE 3 CALLBACK FUNCTIONS =====
  const handleDataChange = (changedData) => {
    console.log("Data changed in editable table:", changedData);
  };

  const handleSaveToOneDrive = async (data) => {
    console.log("Saving to OneDrive:", data);
    alert("Save to OneDrive functionality coming in Phase 4!");
  };

  // ===== BUTTON HANDLER WITH DEBUG =====
  const handleLaunchPhase3 = () => {
    console.log("🚀 Launch Phase 3 button clicked!");
    setShowEditableTable(true);
  };

  const handleBackToPhase2 = () => {
    console.log("⬅️ Back to Phase 2 button clicked!");
    setShowEditableTable(false);
  };

  // ===== LOADING STATE =====
  if (isGenerating) {
    console.log("🔍 Showing loading state");
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#2563eb",
          fontSize: "16px",
        }}
      >
        <div style={{ marginBottom: "16px" }}>
          Generating table structure...
        </div>
        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          Please wait while we create the table structure
        </div>
      </div>
    );
  }

  // ===== ERROR STATE =====
  if (error) {
    console.log("🔍 Showing error state:", error);
    return (
      <div
        style={{
          padding: "24px",
          backgroundColor: "#fef3c7",
          border: "1px solid #fbbf24",
          borderRadius: "8px",
          color: "#92400e",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
          Table Generation Error
        </div>
        <div>{error}</div>
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: "12px",
            padding: "8px 16px",
            backgroundColor: "#f59e0b",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Restart
        </button>
      </div>
    );
  }

  // ===== NO TABLE STATE =====
  if (!tableStructure) {
    console.log("🔍 No table structure available");
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "#6b7280",
          fontSize: "16px",
        }}
      >
        <div>No table structure generated.</div>
        <div style={{ fontSize: "14px", marginTop: "8px" }}>
          Please check column mappings and try again.
        </div>
      </div>
    );
  }

  const mappedCount = Object.keys(columnMappings).length;

  // ===== CRITICAL CHECK =====
  console.log("🔍 About to render - showEditableTable:", showEditableTable);

  // ===== PHASE 3 VIEW (EDITABLE TABLE) =====
  if (showEditableTable) {
    console.log("🔍 Rendering Phase 3 - Editable Table");
    return (
      <div
        style={{
          width: "100%",
          height: "100vh",
          backgroundColor: "white",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Fixed Header */}
        <div
          style={{
            padding: "16px 24px",
            borderBottom: "1px solid #e2e8f0",
            backgroundColor: "#f8fafc",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <button
                onClick={handleBackToPhase2}
                style={{
                  fontSize: "14px",
                  color: "#374151",
                  padding: "8px 16px",
                  backgroundColor: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "500",
                }}
              >
                ← Back to Table Structure
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "24px",
          }}
        >
          <EditableTable
            columnMappings={columnMappings}
            parsedData={parsedData}
            onDataChange={handleDataChange}
            onSave={handleSaveToOneDrive}
          />
        </div>
      </div>
    );
  }

  // ===== PHASE 2 VIEW (TABLE STRUCTURE) =====
  console.log("🔍 Rendering Phase 2 - Table Structure");
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
      {/* Header */}
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
            Table Structure
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

      {/* Validation Warnings */}
      {validationResult?.warnings?.length > 0 && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fef3c7",
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
              color: "#92400e",
              marginBottom: "8px",
            }}
          >
            ⚠️ Validation Warnings:
          </div>
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

      {/* Table Summary */}
      {validationResult?.summary && (
        <div
          style={{
            padding: "16px",
            backgroundColor: "#ecfdf5",
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "16px",
              fontWeight: "600",
              color: "#065f46",
            }}
          >
            Table Summary
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              fontSize: "14px",
            }}
          >
            <div>
              <div style={{ color: "#065f46", marginBottom: "4px" }}>
                Total mappings:
              </div>
              <div style={{ fontWeight: "600", color: "#065f46" }}>
                {validationResult.summary.totalMappings}
              </div>
            </div>
            <div>
              <div style={{ color: "#065f46", marginBottom: "4px" }}>
                Dimensions:
              </div>
              <div style={{ fontWeight: "600", color: "#065f46" }}>
                {validationResult.summary.dimensionMappings}
              </div>
            </div>
            <div>
              <div style={{ color: "#065f46", marginBottom: "4px" }}>
                Measures:
              </div>
              <div style={{ fontWeight: "600", color: "#065f46" }}>
                {validationResult.summary.measureMappings}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Column Structure */}
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
                backgroundColor:
                  mapping.qlikField.type === "dimension"
                    ? "#eff6ff"
                    : mapping.qlikField.type === "measure"
                    ? "#f3e8ff"
                    : "#f9fafb",
              }}
            >
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
              <div
                style={{
                  fontSize: "12px",
                  color: "#6b7280",
                  marginBottom: "4px",
                }}
              >
                → {mapping.qlikField.name}
              </div>
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

      {/* Sample Data Preview */}
      <div>
        <h3
          style={{
            margin: "0 0 16px 0",
            fontSize: "18px",
            fontWeight: "500",
            color: "#374151",
          }}
        >
          Sample Data Preview (Read-Only)
        </h3>
        <div
          style={{
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
            overflow: "auto",
            backgroundColor: "white",
            maxHeight: "300px",
          }}
        >
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "12px",
            }}
          >
            <thead style={{ backgroundColor: "#f9fafb" }}>
              <tr>
                {Object.keys(columnMappings).map((fileCol, i) => (
                  <th
                    key={i}
                    style={{
                      padding: "12px 8px",
                      borderBottom: "2px solid #e5e7eb",
                      borderRight:
                        i < Object.keys(columnMappings).length - 1
                          ? "1px solid #e5e7eb"
                          : "none",
                      textAlign: "left",
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#374151",
                      position: "sticky",
                      top: 0,
                      backgroundColor: "#f9fafb",
                    }}
                  >
                    <div>{fileCol}</div>
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
            <tbody>
              {[
                [
                  "KRESSEL, Abbey",
                  "Olympics 2020 - Tokyo",
                  50,
                  "NA",
                  "women 100m freestyle",
                  "final",
                  1,
                  "NA",
                  8,
                  0.69,
                  "USA",
                  52.33,
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
              ].map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  style={{
                    backgroundColor: rowIndex % 2 === 0 ? "white" : "#f9fafb",
                  }}
                >
                  {Object.keys(columnMappings).map((fileCol, colIndex) => (
                    <td
                      key={colIndex}
                      style={{
                        padding: "8px",
                        borderBottom: "1px solid #f3f4f6",
                        borderRight:
                          colIndex < Object.keys(columnMappings).length - 1
                            ? "1px solid #f3f4f6"
                            : "none",
                        fontSize: "11px",
                        color: "#374151",
                      }}
                    >
                      {row[colIndex] !== undefined ? row[colIndex] : ""}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PHASE 2 COMPLETE + LAUNCH PHASE 3 BUTTON */}
      <div
        style={{
          padding: "24px",
          backgroundColor: "#eff6ff",
          border: "2px solid #3b82f6",
          borderRadius: "12px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            color: "#1e40af",
            marginBottom: "20px",
            lineHeight: "1.5",
          }}
        >
          Your table structure is ready! Now you can proceed to generate a
          interactive table:
          <br />• Edit existing records with smart input validation
          <br />• Add new entries with dropdown selections
          <br />• Save changes for Writeback integration
        </div>

        <button
          onClick={handleLaunchPhase3}
          style={{
            background: "linear-gradient(135deg, #10b981, #059669)",
            color: "white",
            border: "none",
            padding: "14px 28px",
            borderRadius: "8px",
            fontSize: "16px",
            fontWeight: "600",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "12px",
            transition: "all 0.2s",
            boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "translateY(-2px)";
            e.target.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
          }}
        >
          Generate Editable Table
        </button>
      </div>
    </div>
  );
}
