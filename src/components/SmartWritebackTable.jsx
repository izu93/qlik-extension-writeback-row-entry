import React, { useState, useEffect } from "react";
import FileUpload from "./FileUpload";
import ColumnMapper from "./ColumnMapper";
import MappedTable from "./MappedTable";
import { analyzeQlikModel } from "../services/modelAnalyzer";
import { parseUploadedFile } from "../services/fileParser";
import { generateMappingSuggestions } from "../services/mappingEngine";

/**
 * SmartWritebackTable: Enhanced with actual file processing
 *
 * Flow:
 * 1. Upload file (Excel/CSV) and trigger parsing
 * 2. Parse and analyze columns with sample data
 * 3. Get Qlik data model fields
 * 4. Generate intelligent mapping suggestions
 * 5. User reviews/adjusts mappings in ColumnMapper
 * 6. Generate dynamic table from confirmed mappings
 * 7. Enable row-level editing and save
 */
export default function SmartWritebackTable({
  layout,
  app,
  model,
  selections,
}) {
  // Application states
  const [currentStep, setCurrentStep] = useState("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // File upload states
  const [uploadedFile, setUploadedFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);

  // Qlik model states
  const [qlikFields, setQlikFields] = useState({
    dimensions: [],
    measures: [],
    all: [],
  });

  // Mapping states
  const [columnMappings, setColumnMappings] = useState({});
  const [mappingSuggestions, setMappingSuggestions] = useState({});

  // Table states
  const [finalHypercube, setFinalHypercube] = useState(null);
  const [tableData, setTableData] = useState([]);

  /**
   * Initialize by analyzing the Qlik data model
   */
  useEffect(() => {
    async function initializeQlikModel() {
      if (!app) return;

      try {
        setIsLoading(true);
        const modelData = await analyzeQlikModel(app);
        setQlikFields(modelData);
        console.log("Qlik model loaded:", modelData);
      } catch (err) {
        console.error("Failed to analyze Qlik model:", err);
        setError("Failed to load Qlik data model");
      } finally {
        setIsLoading(false);
      }
    }

    initializeQlikModel();
  }, [app]);

  /**
   * Handle file upload and processing
   */
  const handleFileUpload = async (file) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Starting file processing:", file.name);

      // Step 1: Parse the uploaded file
      const parsed = await parseUploadedFile(file);
      console.log("File parsed successfully:", parsed);

      // Step 2: Generate intelligent mapping suggestions
      const suggestions = generateMappingSuggestions(
        parsed.columns,
        qlikFields.all
      );
      console.log("Mapping suggestions generated:", suggestions);

      // Step 3: Store results and advance to mapping step
      setUploadedFile(file);
      setParsedData(parsed);
      setMappingSuggestions(suggestions);

      // Step 4: Check if we can auto-advance
      const highConfidenceCount = Object.values(suggestions).filter(
        (s) => s.confidence > 0.8
      ).length;

      console.log(
        `Generated ${highConfidenceCount} high-confidence mappings out of ${parsed.columns.length} columns`
      );

      // Always go to mapping step for user review
      setCurrentStep("mapping");
    } catch (err) {
      console.error("File processing error:", err);
      setError(`Failed to process file: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle mapping confirmation and table generation
   */
  const handleMappingConfirm = async (finalMappings) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Confirming mappings:", finalMappings);
      setColumnMappings(finalMappings);

      // TODO: Generate hypercube definition from mappings
      // This will be implemented in Phase 3
      console.log("Table generation will be implemented in Phase 3");

      setCurrentStep("table");
    } catch (err) {
      console.error("Mapping confirmation error:", err);
      setError(`Failed to generate table: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Reset to start over
   */
  const handleReset = () => {
    setCurrentStep("upload");
    setUploadedFile(null);
    setParsedData(null);
    setColumnMappings({});
    setMappingSuggestions({});
    setFinalHypercube(null);
    setTableData([]);
    setError(null);
  };

  /**
   * Go back to previous step
   */
  const handleGoBack = () => {
    if (currentStep === "mapping") {
      setCurrentStep("upload");
    } else if (currentStep === "table") {
      setCurrentStep("mapping");
    }
  };

  // Loading state during initialization
  if (isLoading && currentStep === "upload" && qlikFields.all.length === 0) {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#666",
          fontSize: 14,
        }}
      >
        <div style={{ marginBottom: 16 }}>Loading Qlik data model...</div>
        <div style={{ fontSize: 12 }}>
          Analyzing available dimensions and measures
        </div>
      </div>
    );
  }

  // Error state
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
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>Error</div>
        <div style={{ marginBottom: 12 }}>{error}</div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handleReset}
            style={{
              padding: "6px 12px",
              backgroundColor: "#007acc",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 12,
            }}
          >
            Start Over
          </button>
          {currentStep !== "upload" && (
            <button
              onClick={handleGoBack}
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
              Go Back
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "white" }}>
      {/* Progress indicator */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid #eee",
          backgroundColor: "#f8f9fa",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ fontSize: 14, fontWeight: "bold", color: "#495057" }}>
            Smart Writeback Extension
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {/* Step indicators */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#6c757d",
              }}
            >
              <span
                style={{
                  color:
                    currentStep === "upload"
                      ? "#007acc"
                      : ["mapping", "table"].includes(currentStep)
                      ? "#28a745"
                      : "#6c757d",
                  fontWeight: currentStep === "upload" ? "bold" : "normal",
                  cursor: ["mapping", "table"].includes(currentStep)
                    ? "pointer"
                    : "default",
                }}
                onClick={
                  ["mapping", "table"].includes(currentStep)
                    ? () => setCurrentStep("upload")
                    : undefined
                }
              >
                1. Upload
              </span>
              <span>→</span>
              <span
                style={{
                  color:
                    currentStep === "mapping"
                      ? "#007acc"
                      : currentStep === "table"
                      ? "#28a745"
                      : "#6c757d",
                  fontWeight: currentStep === "mapping" ? "bold" : "normal",
                  cursor: currentStep === "table" ? "pointer" : "default",
                }}
                onClick={
                  currentStep === "table"
                    ? () => setCurrentStep("mapping")
                    : undefined
                }
              >
                2. Map Columns
              </span>
              <span>→</span>
              <span
                style={{
                  color: currentStep === "table" ? "#007acc" : "#6c757d",
                  fontWeight: currentStep === "table" ? "bold" : "normal",
                }}
              >
                3. Edit Data
              </span>
            </div>

            {/* Status indicators */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                fontSize: 11,
              }}
            >
              {qlikFields.all.length > 0 && (
                <div style={{ color: "#28a745" }}>
                  {qlikFields.dimensions.length} dimensions,{" "}
                  {qlikFields.measures.length} measures loaded
                </div>
              )}

              {uploadedFile && (
                <div style={{ color: "#007acc" }}>
                  File: {uploadedFile.name}
                </div>
              )}

              {Object.keys(columnMappings).length > 0 && (
                <div style={{ color: "#28a745" }}>
                  {Object.keys(columnMappings).length} columns mapped
                </div>
              )}
            </div>
          </div>

          {/* Reset button */}
          {currentStep !== "upload" && (
            <button
              onClick={handleReset}
              style={{
                marginLeft: "auto",
                padding: "4px 8px",
                backgroundColor: "#6c757d",
                color: "white",
                border: "none",
                borderRadius: 3,
                cursor: "pointer",
                fontSize: 11,
              }}
            >
              Start Over
            </button>
          )}
        </div>
      </div>

      {/* Main content */}
      <div
        style={{
          height: "calc(100% - 60px)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {currentStep === "upload" && (
          <FileUpload
            onFileUpload={handleFileUpload}
            isLoading={isLoading}
            qlikFields={qlikFields}
          />
        )}

        {currentStep === "mapping" && (
          <ColumnMapper
            parsedData={parsedData}
            qlikFields={qlikFields}
            suggestions={mappingSuggestions}
            currentMappings={columnMappings}
            onMappingConfirm={handleMappingConfirm}
            isLoading={isLoading}
          />
        )}

        {currentStep === "table" && (
          <MappedTable
            columnMappings={columnMappings}
            parsedData={parsedData}
            layout={layout}
            app={app}
            model={model}
            selections={selections}
          />
        )}
      </div>
    </div>
  );
}
