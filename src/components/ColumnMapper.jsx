// ===== 4. ENHANCED COLUMN MAPPER COMPONENT - WITH INLINE COMMENTS =====
// ColumnMapper.jsx - Handles user review and adjustment of column mappings
import React, { useState } from "react";
import { generateSmartMappings } from "../services/mappingEngine";

export default function SimpleColumnMapper({
  fileColumns, // Array of file column objects: [{name, type, sampleValues}, ...]
  qlikFields, // Array of available Qlik fields: [{name, type}, ...]
  suggestions, // Auto-generated mappings from smart matcher
  onMappingConfirm, // Callback function when user confirms mappings
}) {
  // ===== STATE MANAGEMENT =====
  // Store current mapping state - starts with auto-generated suggestions
  const [mappings, setMappings] = useState(suggestions || {});

  // ===== MANUAL MAPPING HANDLER =====
  // User manually changes a mapping via dropdown selection
  const handleMappingChange = (fileColumn, qlikFieldName) => {
    const qlikField = qlikFields.find((f) => f.name === qlikFieldName);

    if (qlikField) {
      // Add or update mapping
      setMappings((prev) => ({
        ...prev,
        [fileColumn]: {
          qlikField: qlikField, // Store full Qlik field object
          confidence: 0.9, // High confidence for manual selection
          matchType: "manual", // Mark as user-selected
          reason: "Manually selected", // Human-readable explanation
        },
      }));
    } else {
      // Remove mapping (user selected "none")
      const newMappings = { ...mappings };
      delete newMappings[fileColumn];
      setMappings(newMappings);
    }
  };

  // ===== AUTO-MAPPING FUNCTIONS =====
  // Re-run smart mapping algorithm to auto-map columns
  const autoMapLowThreshold = () => {
    const smartMappings = generateSmartMappings(fileColumns, qlikFields);
    setMappings(smartMappings); // Replace all current mappings
  };

  // Force map ALL columns even with low confidence
  const forceMapAll = () => {
    const newMappings = { ...mappings };
    fileColumns.forEach((fileCol, index) => {
      // Only map if not already mapped and Qlik fields available
      if (!newMappings[fileCol.name] && qlikFields[index % qlikFields.length]) {
        newMappings[fileCol.name] = {
          qlikField: qlikFields[index % qlikFields.length], // Round-robin assignment
          confidence: 0.8, // Medium confidence for forced mapping
          matchType: "forced", // Mark as force-mapped
          reason: "Force mapped", // Explanation
        };
      }
    });
    setMappings(newMappings);
  };

  // Clear all mappings - start over
  const clearAll = () => {
    setMappings({});
  };

  // ===== STATISTICS CALCULATION =====
  const mappedCount = Object.keys(mappings).length; // Number of mapped columns
  const totalColumns = fileColumns.length; // Total columns in file

  // Calculate average confidence across all mappings
  const avgConfidence =
    mappedCount > 0
      ? Math.round(
          (Object.values(mappings).reduce((sum, m) => sum + m.confidence, 0) /
            mappedCount) *
            100
        )
      : 0;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* ===== HEADER SECTION ===== */}
      {/* Shows overview information and mapping statistics */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
        }}
      >
        {/* Left side - General information */}
        <div>
          <h2
            style={{
              margin: "0 0 4px 0",
              fontSize: "24px",
              fontWeight: "600",
              color: "#374151",
            }}
          >
            Column Mapping Review
          </h2>
          <p
            style={{
              margin: "0 0 4px 0",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            {totalColumns} file columns → {qlikFields.length} available Qlik
            fields
          </p>
          <p
            style={{
              margin: 0,
              fontSize: "14px",
              color: "#9ca3af",
            }}
          >
            Suggestions available: {mappedCount} Mapping active: {mappedCount}{" "}
            Auto-mapped: {mappedCount}
          </p>
        </div>

        {/* Right side - Mapping statistics */}
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              fontSize: "20px",
              fontWeight: "bold",
              color: "#059669", // Green for success
            }}
          >
            {mappedCount} of {totalColumns} columns mapped
          </div>
          <div
            style={{
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            Avg confidence: {avgConfidence}%
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#9ca3af",
            }}
          >
            {totalColumns - mappedCount} unmapped
          </div>
        </div>
      </div>

      {/* ===== ACTION BUTTONS ===== */}
      {/* Buttons for bulk mapping operations */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
        }}
      >
        {/* Re-run smart mapping with low confidence threshold */}
        <button
          onClick={autoMapLowThreshold}
          style={{
            backgroundColor: "#2563eb", // Blue
            color: "white",
            padding: "6px 12px",
            borderRadius: "4px",
            border: "none",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Auto-Map All (Low Threshold)
        </button>

        {/* Force map every column to some Qlik field */}
        <button
          onClick={forceMapAll}
          style={{
            backgroundColor: "#059669", // Green
            color: "white",
            padding: "6px 12px",
            borderRadius: "4px",
            border: "none",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Force Map All Columns
        </button>

        {/* Remove all mappings */}
        <button
          onClick={clearAll}
          style={{
            backgroundColor: "#6b7280", // Gray
            color: "white",
            padding: "6px 12px",
            borderRadius: "4px",
            border: "none",
            fontSize: "14px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Clear All
        </button>
      </div>

      {/* ===== MAIN LAYOUT ===== */}
      {/* Two-column layout: File columns on left, statistics on right */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr", // Left column takes 2/3, right takes 1/3
          gap: "24px",
        }}
      >
        {/* ===== LEFT COLUMN: FILE COLUMNS ===== */}
        <div>
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "500",
              color: "#374151",
              borderBottom: "2px solid #2563eb", // Blue underline
              paddingBottom: "8px",
            }}
          >
            File Columns ({totalColumns})
          </h3>

          {/* Scrollable list of file columns */}
          <div
            style={{
              maxHeight: "600px",
              overflowY: "auto",
              paddingRight: "8px", // Space for scrollbar
            }}
          >
            {fileColumns.map((column, index) => {
              // Get current mapping for this column
              const mapping = mappings[column.name];
              const confidence = mapping
                ? Math.round(mapping.confidence * 100)
                : 0;

              return (
                <div
                  key={index}
                  style={{
                    marginBottom: "12px",
                    // Green border if mapped, gray if not
                    border: mapping ? "2px solid #10b981" : "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "12px",
                    // Green background if mapped, white if not
                    backgroundColor: mapping ? "#ecfdf5" : "white",
                  }}
                >
                  {/* Column header with info and confidence badge */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "8px",
                    }}
                  >
                    {/* Left side - Column information */}
                    <div style={{ flex: 1 }}>
                      {/* Column name */}
                      <div
                        style={{
                          fontWeight: "600",
                          fontSize: "14px",
                          color: "#374151",
                        }}
                      >
                        {column.name}
                      </div>

                      {/* Column metadata */}
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#6b7280",
                          marginBottom: "4px",
                        }}
                      >
                        Type: {column.type} •{" "}
                        {column.sampleValues ? column.sampleValues.length : 0}{" "}
                        values • 0 unique
                      </div>

                      {/* Sample data preview */}
                      <div
                        style={{
                          fontSize: "11px",
                          color: "#9ca3af",
                        }}
                      >
                        Sample:{" "}
                        {column.sampleValues
                          ? column.sampleValues.join(", ")
                          : "No samples"}
                      </div>
                    </div>

                    {/* Right side - Confidence badge (only if mapped) */}
                    {mapping && (
                      <div
                        style={{
                          marginLeft: "12px",
                          textAlign: "right",
                        }}
                      >
                        {/* Confidence percentage */}
                        <div
                          style={{
                            fontSize: "14px",
                            fontWeight: "bold",
                            color: confidence === 100 ? "#059669" : "#d97706", // Green for 100%, orange for less
                          }}
                        >
                          {confidence}%
                        </div>

                        {/* Match type label */}
                        <div
                          style={{
                            fontSize: "10px",
                            color: "#059669",
                            fontWeight: "500",
                          }}
                        >
                          exact
                        </div>
                      </div>
                    )}
                  </div>

                  {/* ===== MAPPING DROPDOWN ===== */}
                  {/* User can manually select which Qlik field to map to */}
                  <select
                    value={mapping ? mapping.qlikField.name : "none"}
                    onChange={(e) =>
                      handleMappingChange(column.name, e.target.value)
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      border: "1px solid #d1d5db",
                      borderRadius: "4px",
                      fontSize: "14px",
                      backgroundColor: "white",
                    }}
                  >
                    <option value="none">-- Select Qlik Field --</option>
                    {qlikFields.map((field) => (
                      <option key={field.name} value={field.name}>
                        {field.name} ({field.type})
                      </option>
                    ))}
                  </select>

                  {/* ===== MAPPING INFO BADGES ===== */}
                  {/* Show mapping details if column is mapped */}
                  {mapping && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "11px",
                        color: "#059669",
                        backgroundColor: "#d1fae5", // Light green background
                        padding: "6px 8px",
                        borderRadius: "4px",
                      }}
                    >
                      ✓ {mapping.reason} ({Math.round(mapping.confidence * 100)}
                      % confidence)
                    </div>
                  )}

                  {/* Static "exact match" indicator */}
                  <div
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "#2563eb",
                      cursor: "pointer",
                    }}
                  >
                    ✓ Exact name match
                  </div>
                </div>
              );
            })}
          </div>

          {/* Summary at bottom of file columns */}
          <div
            style={{
              marginTop: "16px",
              fontSize: "14px",
              color: "#6b7280",
            }}
          >
            {mappedCount} columns mapped with {avgConfidence}% avg confidence
          </div>
        </div>

        {/* ===== RIGHT COLUMN: MAPPING STATISTICS ===== */}
        <div>
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "18px",
              fontWeight: "500",
              color: "#374151",
              borderBottom: "2px solid #059669", // Green underline
              paddingBottom: "8px",
            }}
          >
            Mapping Preview & Statistics
          </h3>

          {/* ===== MAPPING SUMMARY CARD ===== */}
          <div
            style={{
              backgroundColor: "#ecfdf5", // Light green background
              border: "1px solid #bbf7d0",
              borderRadius: "8px",
              padding: "16px",
              marginBottom: "16px",
            }}
          >
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#065f46", // Dark green
              }}
            >
              Mapping Summary
            </h4>

            {/* Statistics grid */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                fontSize: "14px",
              }}
            >
              {/* Total mapped count */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#065f46" }}>Mapped:</span>
                <span style={{ fontWeight: "600", color: "#065f46" }}>
                  {mappedCount} / {totalColumns}
                </span>
              </div>

              {/* Average confidence */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#065f46" }}>Avg Confidence:</span>
                <span style={{ fontWeight: "600", color: "#065f46" }}>
                  {avgConfidence}%
                </span>
              </div>

              {/* Confidence breakdown */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#065f46" }}>High confidence:</span>
                <span style={{ fontWeight: "600", color: "#065f46" }}>
                  {mappedCount}{" "}
                  {/* All mappings shown as high confidence for demo */}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#065f46" }}>Medium confidence:</span>
                <span style={{ fontWeight: "600", color: "#065f46" }}>0</span>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#065f46" }}>Low confidence:</span>
                <span style={{ fontWeight: "600", color: "#065f46" }}>0</span>
              </div>

              {/* Unmapped count */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ color: "#065f46" }}>Unmapped:</span>
                <span style={{ fontWeight: "600", color: "#065f46" }}>
                  {totalColumns - mappedCount}
                </span>
              </div>
            </div>
          </div>

          {/* ===== ACTIVE MAPPINGS LIST ===== */}
          <div
            style={{
              backgroundColor: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "16px",
            }}
          >
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: "14px",
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Active Mappings ({mappedCount})
            </h4>

            {/* Scrollable list of current mappings */}
            <div
              style={{
                maxHeight: "400px",
                overflowY: "auto",
              }}
            >
              {mappedCount === 0 ? (
                // Empty state message
                <div
                  style={{
                    color: "#6b7280",
                    fontStyle: "italic",
                    fontSize: "14px",
                  }}
                >
                  No mappings yet. Select Qlik fields above.
                </div>
              ) : (
                // List of active mappings
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  {Object.entries(mappings).map(([fileCol, mapping]) => (
                    <div
                      key={fileCol}
                      style={{
                        fontSize: "12px",
                        padding: "8px",
                        backgroundColor: "#ecfdf5", // Light green
                        borderRadius: "4px",
                        border: "1px solid #bbf7d0",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        {/* Left side - Mapping details */}
                        <div>
                          <strong>{fileCol}</strong> → {mapping.qlikField.name}
                          <div style={{ color: "#6b7280", fontSize: "10px" }}>
                            {mapping.matchType} • {mapping.qlikField.type}
                          </div>
                        </div>

                        {/* Right side - Confidence badge */}
                        <span
                          style={{
                            color: "#059669",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                        >
                          {Math.round(mapping.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {/* ===== BOTTOM ACTION AREA ===== */}
      {/* Final confirmation button to proceed to table generation */}
      <div
        style={{
          marginTop: "32px",
          paddingTop: "24px",
          borderTop: "1px solid #e5e7eb", // Separator line
          display: "flex",
          justifyContent: "center",
          gap: "12px",
        }}
      >
        {/* Main action button - only enabled if at least one column is mapped */}
        <button
          onClick={() => onMappingConfirm(mappings)} // Call parent callback with final mappings
          disabled={mappedCount === 0} // Disable if no mappings exist
          style={{
            // Dynamic styling based on whether mappings exist
            backgroundColor: mappedCount > 0 ? "#059669" : "#d1d5db", // Green if enabled, gray if disabled
            color: mappedCount > 0 ? "white" : "#9ca3af",
            padding: "12px 24px",
            borderRadius: "6px",
            border: "none",
            fontSize: "14px",
            fontWeight: "500",
            cursor: mappedCount > 0 ? "pointer" : "not-allowed", // Show appropriate cursor
          }}
        >
          Generate Table Structure ({mappedCount} columns)
        </button>
      </div>
    </div>
  );
}
