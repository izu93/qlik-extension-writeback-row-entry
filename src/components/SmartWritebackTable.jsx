import React, { useState, useEffect } from "react";
import FileUpload from "./FileUpload";
import ColumnMapper from "./ColumnMapper";
import MappedTable from "./MappedTable";
import { analyzeQlikModel } from "../services/modelAnalyzer";
import { parseUploadedFile } from "../services/fileParser";
import { generateMappingSuggestions } from "../services/mappingEngine";

/**
 * SmartWritebackTable: Intelligent column mapping and writeback functionality
 *
 * Flow:
 * 1. Upload file (Excel/CSV)
 * 2. Parse and analyze columns
 * 3. Get Qlik data model fields
 * 4. Suggest intelligent mappings
 * 5. User reviews/adjusts mappings
 * 6. Generate dynamic table
 * 7. Enable row-level editing and save
 */
export default function SmartWritebackTable({
  layout,
  app,
  model,
  selections,
}) {
  // Application states
  const [currentStep, setCurrentStep] = useState("upload"); // upload -> mapping -> table
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
   * Handle file upload and parsing
   */
  const handleFileUpload = async (file) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log("Parsing uploaded file:", file.name);

      // Parse the uploaded file
      const parsed = await parseUploadedFile(file);

      // Generate intelligent mapping suggestions
      const suggestions = generateMappingSuggestions(
        parsed.columns,
        qlikFields.all
      );

      setUploadedFile(file);
      setParsedData(parsed);
      setMappingSuggestions(suggestions);

      // Auto-advance to mapping step if we have good suggestions
      const autoMappedCount = Object.values(suggestions).filter(
        (s) => s.confidence > 0.8
      ).length;

      if (autoMappedCount >= parsed.columns.length * 0.7) {
        console.log(
          `Auto-mapped ${autoMappedCount}/${parsed.columns.length} columns with high confidence`
        );

        // Pre-populate high-confidence mappings
        const autoMappings = {};
        Object.entries(suggestions).forEach(([col, suggestion]) => {
          if (suggestion.confidence > 0.8) {
            autoMappings[col] = suggestion.qlikField;
          }
        });
        setColumnMappings(autoMappings);
      }

      setCurrentStep("mapping");
    } catch (err) {
      console.error("File upload error:", err);
      setError(`Failed to parse file: ${err.message}`);
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

      setColumnMappings(finalMappings);

      // Generate hypercube definition from mappings
      // This will be implemented in tableGenerator.js
      console.log("Generating table with mappings:", finalMappings);

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

  // Loading state
  if (isLoading && currentStep === "upload") {
    return (
      <div
        style={{
          padding: 40,
          textAlign: "center",
          color: "#666",
          fontSize: 14,
        }}
      >
        <div style={{ marginBottom: 16 }}>🔄 Analyzing Qlik data model...</div>
        <div style={{ fontSize: 12 }}>
          Loading available dimensions and measures
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
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>⚠️ Error</div>
        <div style={{ marginBottom: 12 }}>{error}</div>
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
                      : currentStep !== "upload"
                      ? "#28a745"
                      : "#6c757d",
                  fontWeight: currentStep === "upload" ? "bold" : "normal",
                }}
              >
                1️⃣ Upload
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
                }}
              >
                2️⃣ Map Columns
              </span>
              <span>→</span>
              <span
                style={{
                  color: currentStep === "table" ? "#007acc" : "#6c757d",
                  fontWeight: currentStep === "table" ? "bold" : "normal",
                }}
              >
                3️⃣ Edit Data
              </span>
            </div>

            {qlikFields.all.length > 0 && (
              <div style={{ fontSize: 11, color: "#28a745" }}>
                ✅ {qlikFields.dimensions.length} dimensions,{" "}
                {qlikFields.measures.length} measures loaded
              </div>
            )}
          </div>

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
        style={{ padding: 16, height: "calc(100% - 60px)", overflow: "auto" }}
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
