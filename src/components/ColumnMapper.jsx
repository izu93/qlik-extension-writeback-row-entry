import React, { useState, useEffect, useCallback } from "react";
import {
  validateMappingSuggestions,
  generateMappingSummary,
} from "../services/mappingEngine";

/**
 * ColumnMapper: ENHANCED with much more aggressive auto-mapping
 */
export default function ColumnMapper({
  parsedData,
  qlikFields,
  suggestions,
  currentMappings,
  onMappingConfirm,
  isLoading,
}) {
  const [mappings, setMappings] = useState(currentMappings || {});
  const [validatedMappings, setValidatedMappings] = useState({});
  const [mappingSummary, setMappingSummary] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Memoize validation to prevent infinite loops
  const validateAndSummarize = useCallback(() => {
    if (
      Object.keys(mappings).length > 0 &&
      parsedData?.columns &&
      qlikFields?.all
    ) {
      try {
        const validated = validateMappingSuggestions(
          mappings,
          parsedData.columns,
          qlikFields.all
        );
        const summary = generateMappingSummary(validated);

        setValidatedMappings(validated);
        setMappingSummary(summary);
      } catch (error) {
        console.error("Validation error:", error);
      }
    }
  }, [mappings, parsedData?.columns, qlikFields?.all]);

  // Run validation when mappings change
  useEffect(() => {
    validateAndSummarize();
  }, [validateAndSummarize]);

  // ENHANCED: Initialize mappings from suggestions with MUCH lower threshold
  useEffect(() => {
    if (suggestions && Object.keys(mappings).length === 0) {
      console.log(
        "ENHANCED: Initializing mappings from suggestions:",
        suggestions
      );

      const initialMappings = {};
      Object.entries(suggestions).forEach(([fileCol, suggestion]) => {
        // MUCH LOWER threshold for auto-mapping: 0.15 instead of 0.3
        if (suggestion.qlikField && suggestion.confidence > 0.15) {
          initialMappings[fileCol] = suggestion;
          console.log(
            `ENHANCED Auto-mapped: ${fileCol} → ${
              suggestion.qlikField.name
            } (${Math.round(suggestion.confidence * 100)}%)`
          );
        }
      });

      console.log(
        `ENHANCED: Auto-mapped ${
          Object.keys(initialMappings).length
        } columns out of ${Object.keys(suggestions).length}`
      );

      if (Object.keys(initialMappings).length > 0) {
        setMappings(initialMappings);
      }
    }
  }, [suggestions]); // Remove mappings from dependency to prevent loops

  /**
   * Handle manual mapping change
   */
  const handleMappingChange = (fileColumn, selectedQlikField) => {
    console.log(`Manual mapping change: ${fileColumn} → ${selectedQlikField}`);

    const newMappings = { ...mappings };

    if (selectedQlikField && selectedQlikField !== "none") {
      // Find the full field object
      const qlikField = qlikFields.all.find(
        (f) => f.name === selectedQlikField
      );

      if (qlikField) {
        newMappings[fileColumn] = {
          qlikField: qlikField,
          confidence: 0.95, // High confidence for manual selection
          matchType: "manual",
          reason: "Manually selected by user",
        };
      }
    } else {
      // Remove mapping
      delete newMappings[fileColumn];
    }

    setMappings(newMappings);
  };

  /**
   * ENHANCED: Auto-map all suggestions with VERY low threshold
   */
  const handleAutoMapAll = () => {
    console.log("ENHANCED: Auto-mapping ALL suggestions:", suggestions);

    const autoMappings = {};
    Object.entries(suggestions || {}).forEach(([fileCol, suggestion]) => {
      // Use VERY low threshold of 0.05 for auto-map button
      if (suggestion.qlikField && suggestion.confidence > 0.05) {
        autoMappings[fileCol] = suggestion;
        console.log(
          `ENHANCED Auto-mapped: ${fileCol} → ${
            suggestion.qlikField.name
          } (${Math.round(suggestion.confidence * 100)}%)`
        );
      }
    });

    console.log(
      `ENHANCED: Created ${
        Object.keys(autoMappings).length
      } auto-mappings out of ${Object.keys(suggestions || {}).length} possible`
    );
    setMappings(autoMappings);
  };

  /**
   * NEW: Force map all columns (even with low confidence)
   */
  const handleForceMapAll = () => {
    console.log("FORCE MAPPING: Attempting to map ALL columns");

    const forceMappings = {};
    Object.entries(suggestions || {}).forEach(([fileCol, suggestion]) => {
      if (suggestion.qlikField) {
        // Force map everything with a qlik field, regardless of confidence
        forceMappings[fileCol] = {
          ...suggestion,
          confidence: Math.max(suggestion.confidence, 0.3), // Boost to at least 30%
          reason: suggestion.reason + " (Force mapped)",
        };
        console.log(
          `FORCE mapped: ${fileCol} → ${
            suggestion.qlikField.name
          } (boosted to ${Math.round(
            forceMappings[fileCol].confidence * 100
          )}%)`
        );
      }
    });

    console.log(
      `FORCE MAPPING: Created ${
        Object.keys(forceMappings).length
      } force mappings`
    );
    setMappings(forceMappings);
  };

  /**
   * Clear all mappings
   */
  const handleClearAll = () => {
    console.log("Clearing all mappings");
    setMappings({});
  };

  /**
   * Confirm mappings and proceed to table generation
   */
  const handleConfirmMappings = () => {
    console.log("Confirming mappings:", validatedMappings);
    if (mappingSummary && mappingSummary.mappedColumns > 0) {
      onMappingConfirm(validatedMappings);
    } else {
      console.warn("No mappings to confirm");
    }
  };

  /**
   * Get confidence color coding - ENHANCED with more colors
   */
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return "#28a745"; // Green - Excellent
    if (confidence >= 0.6) return "#17a2b8"; // Blue - Good
    if (confidence >= 0.4) return "#ffc107"; // Yellow - Medium
    if (confidence >= 0.2) return "#fd7e14"; // Orange - Low
    return "#dc3545"; // Red - Very Low
  };

  if (!parsedData || !qlikFields || !suggestions) {
    return (
      <div style={{ padding: 20, textAlign: "center" }}>
        Loading enhanced mapping interface...
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
      }}
    >
      {/* Header with summary */}
      <div
        style={{
          padding: 16,
          borderBottom: "1px solid #eee",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: 16, color: "#495057" }}>
              ENHANCED Column Mapping Review
            </h3>
            <div style={{ fontSize: 13, color: "#6c757d" }}>
              {parsedData.columns?.length || 0} file columns →{" "}
              {qlikFields.all?.length || 0} available Qlik fields
            </div>
            {/* Enhanced debug info */}
            <div style={{ fontSize: 11, color: "#007acc", marginTop: 4 }}>
              Suggestions available: {Object.keys(suggestions).length} •
              Mappings active: {Object.keys(mappings).length} • Auto-mapped:{" "}
              {
                Object.values(mappings).filter((m) => m.matchType !== "manual")
                  .length
              }
            </div>
          </div>

          {mappingSummary && (
            <div style={{ textAlign: "right" }}>
              <div
                style={{ fontSize: 14, fontWeight: "bold", color: "#495057" }}
              >
                {mappingSummary.mappedColumns} of {mappingSummary.totalColumns}{" "}
                columns mapped
              </div>
              <div style={{ fontSize: 12, color: "#6c757d" }}>
                Avg confidence:{" "}
                {Math.round(mappingSummary.averageConfidence * 100)}%
              </div>
            </div>
          )}
        </div>

        {/* ENHANCED Action buttons */}
        <div
          style={{
            marginTop: 12,
            display: "flex",
            gap: 8,
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <button
            onClick={handleAutoMapAll}
            style={{
              padding: "6px 12px",
              backgroundColor: "#007acc",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            Auto-Map All (Low Threshold)
          </button>

          <button
            onClick={handleForceMapAll}
            style={{
              padding: "6px 12px",
              backgroundColor: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            Force Map All Columns
          </button>

          <button
            onClick={handleClearAll}
            style={{
              padding: "6px 12px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Clear All
          </button>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            style={{
              padding: "6px 12px",
              backgroundColor: showAdvanced ? "#ffc107" : "#e9ecef",
              color: showAdvanced ? "#000" : "#6c757d",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {showAdvanced ? "Hide" : "Show"} Debug
          </button>

          <button
            onClick={() => setPreviewMode(!previewMode)}
            style={{
              padding: "6px 12px",
              backgroundColor: previewMode ? "#17a2b8" : "#e9ecef",
              color: previewMode ? "white" : "#6c757d",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            {previewMode ? "Hide" : "Show"} Preview
          </button>

          {/* Mapping statistics */}
          <div style={{ fontSize: 11, color: "#6c757d", marginLeft: "auto" }}>
            {Object.keys(suggestions).length - Object.keys(mappings).length}{" "}
            unmapped
          </div>
        </div>
      </div>

      {/* Enhanced debug info when advanced is shown */}
      {showAdvanced && (
        <div
          style={{
            padding: 12,
            backgroundColor: "#fff3cd",
            border: "1px solid #ffeaa7",
            fontSize: 11,
            color: "#856404",
          }}
        >
          <div>
            <strong>ENHANCED Debug Info:</strong>
          </div>
          <div>
            File columns:{" "}
            {JSON.stringify(parsedData.columns?.map((c) => c.name))}
          </div>
          <div>Qlik fields: {qlikFields.all?.length} total</div>
          <div>
            Suggestions confidence range:{" "}
            {Object.values(suggestions).length > 0
              ? `${Math.round(
                  Math.min(
                    ...Object.values(suggestions).map((s) => s.confidence)
                  ) * 100
                )}% - ${Math.round(
                  Math.max(
                    ...Object.values(suggestions).map((s) => s.confidence)
                  ) * 100
                )}%`
              : "None"}
          </div>
          <div>Current mappings: {JSON.stringify(Object.keys(mappings))}</div>
          <div>
            Mapping types:{" "}
            {JSON.stringify(
              Object.values(mappings).reduce((acc, m) => {
                acc[m.matchType] = (acc[m.matchType] || 0) + 1;
                return acc;
              }, {})
            )}
          </div>
        </div>
      )}

      {/* Main mapping interface */}
      <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 20,
          }}
        >
          {/* File columns section */}
          <div>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: 14,
                color: "#495057",
                borderBottom: "2px solid #007acc",
                paddingBottom: 4,
              }}
            >
              File Columns ({parsedData.columns?.length || 0})
            </h4>

            <div style={{ space: 8 }}>
              {parsedData.columns?.map((column, index) => {
                const mapping = mappings[column.name];
                const suggestion = suggestions[column.name];
                const confidence =
                  mapping?.confidence || suggestion?.confidence || 0;

                return (
                  <div
                    key={index}
                    style={{
                      marginBottom: 12,
                      padding: 12,
                      border: `2px solid ${
                        mapping ? getConfidenceColor(confidence) : "#dee2e6"
                      }`,
                      borderRadius: 6,
                      backgroundColor: mapping ? "#f8f9fa" : "white",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: "bold",
                            color: "#495057",
                            marginBottom: 4,
                          }}
                        >
                          {column.name}
                        </div>

                        <div
                          style={{
                            fontSize: 12,
                            color: "#6c757d",
                            marginBottom: 8,
                          }}
                        >
                          Type: {column.type} • {column.totalValues} values •{" "}
                          {column.uniqueValues} unique
                        </div>

                        {/* Sample values */}
                        <div style={{ fontSize: 11, color: "#868e96" }}>
                          Sample: {column.sampleValues?.slice(0, 3).join(", ")}
                          {column.sampleValues?.length > 3 && "..."}
                        </div>
                      </div>

                      {/* ENHANCED Confidence indicator */}
                      {confidence > 0 && (
                        <div
                          style={{
                            marginLeft: 12,
                            padding: "4px 8px",
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: "bold",
                            color: "white",
                            backgroundColor: getConfidenceColor(confidence),
                            minWidth: "50px",
                            textAlign: "center",
                          }}
                        >
                          {Math.round(confidence * 100)}%
                          <div style={{ fontSize: 9, opacity: 0.9 }}>
                            {mapping?.matchType || suggestion?.matchType || ""}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Mapping selection */}
                    <div style={{ marginTop: 8 }}>
                      <select
                        value={mapping?.qlikField?.name || "none"}
                        onChange={(e) =>
                          handleMappingChange(column.name, e.target.value)
                        }
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          border: "1px solid #ccc",
                          borderRadius: 3,
                          fontSize: 12,
                          backgroundColor: mapping ? "#e8f5e8" : "white",
                        }}
                      >
                        <option value="none">-- No mapping --</option>
                        <optgroup label="Dimensions">
                          {qlikFields.dimensions?.map((dim) => (
                            <option key={dim.name} value={dim.name}>
                              {dim.name} ({dim.category})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Measures">
                          {qlikFields.measures?.map((measure) => (
                            <option key={measure.name} value={measure.name}>
                              {measure.name} ({measure.category})
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="Other Fields">
                          {qlikFields.all
                            ?.filter(
                              (f) =>
                                !f.category ||
                                (f.category !== "dimension" &&
                                  f.category !== "measure")
                            )
                            .map((field) => (
                              <option key={field.name} value={field.name}>
                                {field.name}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                    </div>

                    {/* Mapping reason */}
                    {mapping && (
                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 11,
                          color: "#28a745",
                          fontStyle: "italic",
                        }}
                      >
                        ✓ {mapping.reason}
                      </div>
                    )}

                    {/* Show suggestion details in debug mode */}
                    {showAdvanced && suggestion && (
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 10,
                          color: "#6c757d",
                          backgroundColor: "#f8f9fa",
                          padding: 6,
                          borderRadius: 3,
                          border: "1px solid #e9ecef",
                        }}
                      >
                        <div>
                          <strong>Best Suggestion:</strong>{" "}
                          {suggestion.qlikField?.name || "none"}
                        </div>
                        <div>
                          <strong>Confidence:</strong>{" "}
                          {Math.round((suggestion.confidence || 0) * 100)}%
                        </div>
                        <div>
                          <strong>Match Type:</strong> {suggestion.matchType}
                        </div>
                        <div>
                          <strong>Reason:</strong> {suggestion.reason}
                        </div>
                        {suggestion.alternatives &&
                          suggestion.alternatives.length > 0 && (
                            <div>
                              <strong>Alternatives:</strong>{" "}
                              {suggestion.alternatives
                                .slice(0, 2)
                                .map(
                                  (alt) =>
                                    `${alt.field.name} (${Math.round(
                                      alt.confidence * 100
                                    )}%)`
                                )
                                .join(", ")}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Preview section */}
          <div>
            <h4
              style={{
                margin: "0 0 12px 0",
                fontSize: 14,
                color: "#495057",
                borderBottom: "2px solid #28a745",
                paddingBottom: 4,
              }}
            >
              Mapping Preview & Statistics
            </h4>

            {/* ENHANCED Mapping summary */}
            {mappingSummary && (
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
                  Mapping Summary
                </div>
                <div style={{ fontSize: 12, color: "#155724" }}>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 8,
                    }}
                  >
                    <div>
                      Mapped: {mappingSummary.mappedColumns} /{" "}
                      {mappingSummary.totalColumns}
                    </div>
                    <div>
                      Avg Confidence:{" "}
                      {Math.round(mappingSummary.averageConfidence * 100)}%
                    </div>
                    <div>
                      High confidence: {mappingSummary.highConfidenceColumns}
                    </div>
                    <div>
                      Medium confidence:{" "}
                      {mappingSummary.mediumConfidenceColumns}
                    </div>
                    <div>
                      Low confidence: {mappingSummary.lowConfidenceColumns}
                    </div>
                    <div>Unmapped: {mappingSummary.unmappedColumns}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Active mappings list */}
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                backgroundColor: "#f8f9fa",
                border: "1px solid #dee2e6",
                borderRadius: 6,
                maxHeight: "300px",
                overflow: "auto",
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: "bold",
                  color: "#495057",
                  marginBottom: 8,
                }}
              >
                Active Mappings ({Object.keys(mappings).length})
              </div>
              {Object.keys(mappings).length === 0 ? (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6c757d",
                    fontStyle: "italic",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  No mappings configured yet.
                  <br />
                  Click "Auto-Map All" or "Force Map All" above.
                </div>
              ) : (
                Object.entries(mappings).map(([fileCol, mapping]) => (
                  <div
                    key={fileCol}
                    style={{
                      fontSize: 11,
                      marginBottom: 6,
                      color: "#495057",
                      padding: "4px 8px",
                      backgroundColor: "white",
                      borderRadius: 3,
                      border: `1px solid ${getConfidenceColor(
                        mapping.confidence
                      )}`,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <strong>{fileCol}</strong> →{" "}
                        {mapping.qlikField?.name || "unknown"}
                      </div>
                      <div
                        style={{
                          color: getConfidenceColor(mapping.confidence),
                          fontWeight: "bold",
                          fontSize: 10,
                        }}
                      >
                        {Math.round(mapping.confidence * 100)}%
                      </div>
                    </div>
                    <div
                      style={{ fontSize: 9, color: "#6c757d", marginTop: 2 }}
                    >
                      {mapping.matchType} •{" "}
                      {mapping.qlikField?.category || "unknown"}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Validation warnings */}
            {mappingSummary && mappingSummary.lowConfidenceColumns > 0 && (
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
                  ⚠️ Review Recommended
                </div>
                <div style={{ fontSize: 12, color: "#856404" }}>
                  {mappingSummary.lowConfidenceColumns} mappings have low
                  confidence. You can proceed anyway or review manually.
                </div>
              </div>
            )}

            {/* Unmapped columns warning */}
            {mappingSummary && mappingSummary.unmappedColumns > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: 12,
                  backgroundColor: "#f8d7da",
                  border: "1px solid #f5c6cb",
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: "bold",
                    color: "#721c24",
                    marginBottom: 4,
                  }}
                >
                  🔍 Unmapped Columns
                </div>
                <div style={{ fontSize: 12, color: "#721c24" }}>
                  {mappingSummary.unmappedColumns} columns remain unmapped. Try
                  "Force Map All" to map them anyway.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer with action buttons */}
      <div
        style={{
          padding: 16,
          borderTop: "1px solid #eee",
          backgroundColor: "#f8f9fa",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div style={{ fontSize: 12, color: "#6c757d" }}>
          {mappingSummary
            ? `${mappingSummary.mappedColumns} columns mapped with ${Math.round(
                mappingSummary.averageConfidence * 100
              )}% avg confidence`
            : "Configure column mappings above"}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onMappingConfirm({})}
            style={{
              padding: "8px 16px",
              backgroundColor: "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Skip Mapping
          </button>

          <button
            onClick={handleConfirmMappings}
            disabled={
              !mappingSummary || mappingSummary.mappedColumns === 0 || isLoading
            }
            style={{
              padding: "8px 16px",
              backgroundColor:
                mappingSummary && mappingSummary.mappedColumns > 0
                  ? "#28a745"
                  : "#6c757d",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor:
                mappingSummary && mappingSummary.mappedColumns > 0
                  ? "pointer"
                  : "not-allowed",
              fontSize: 12,
              fontWeight: "bold",
            }}
          >
            {isLoading
              ? "Generating Table..."
              : `Generate Table (${
                  mappingSummary?.mappedColumns || 0
                } columns)`}
          </button>
        </div>
      </div>
    </div>
  );
}
