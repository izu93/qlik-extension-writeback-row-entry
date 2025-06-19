// ===== 5. SIMPLE MAIN COMPONENT WITH ENHANCED UI =====
// SmartWritebackTable.jsx - Main orchestrator component with inline comments
import React, { useState, useEffect } from "react";
import { parseCSVFile } from "../services/fileParser";
import { getQlikFields } from "../services/modelAnalyzer";
import { generateSmartMappings } from "../services/mappingEngine";
import SimpleColumnMapper from "./ColumnMapper";
import FileUpload from "./FileUpload";
import MappedTable from "./MappedTable";

export default function SmartWritebackTable({
  app,
  layout,
  model,
  selections,
}) {
  // ===== STATE MANAGEMENT =====
  // Tracks which step user is currently on in the 3-step workflow
  const [step, setStep] = useState("upload"); // 'upload' | 'mapping' | 'complete'

  // Stores the uploaded file object for reference
  const [file, setFile] = useState(null);

  // Contains parsed CSV data: {columns: [], rows: [], totalRows: number, totalColumns: number}
  const [parsedData, setParsedData] = useState(null);

  // Qlik field structure: {all: [], dimensions: [], measures: []}
  const [qlikFields, setQlikFields] = useState({
    all: [],
    dimensions: [],
    measures: [],
  });

  // Column mappings: {fileColumnName: {qlikField, confidence, matchType, reason}}
  const [mappings, setMappings] = useState({});

  // Loading state for UI feedback during file processing
  const [isLoading, setIsLoading] = useState(false);

  // ===== QLIK FIELDS INITIALIZATION =====
  // Load available Qlik fields when component mounts or app changes
  useEffect(() => {
    if (app) {
      console.log("🔌 Loading Qlik fields...");
      // Try to get real Qlik fields from the app
      getQlikFields(app)
        .then((fields) => {
          setQlikFields(fields); // Store {all, dimensions, measures} structure
          console.log("Qlik fields loaded:", fields.all.length);
        })
        .catch((error) => {
          console.error("Failed to load Qlik fields:", error);
          // Fallback to mock swimming competition fields for demo
          setQlikFields({
            all: [
              { name: "name", type: "dimension" },
              { name: "competition", type: "dimension" },
              { name: "distance", type: "dimension" },
              { name: "dq", type: "dimension" }, // disqualification
              { name: "event", type: "dimension" },
              { name: "heat", type: "dimension" },
              { name: "lane", type: "dimension" },
              { name: "lap_time", type: "dimension" },
              { name: "place", type: "dimension" },
              { name: "reaction_time", type: "dimension" },
              { name: "team", type: "dimension" },
              { name: "time", type: "dimension" },
            ],
            dimensions: [
              { name: "name", type: "dimension" },
              { name: "competition", type: "dimension" },
              { name: "distance", type: "dimension" },
              { name: "dq", type: "dimension" },
              { name: "event", type: "dimension" },
              { name: "heat", type: "dimension" },
              { name: "lane", type: "dimension" },
              { name: "lap_time", type: "dimension" },
              { name: "place", type: "dimension" },
              { name: "reaction_time", type: "dimension" },
              { name: "team", type: "dimension" },
              { name: "time", type: "dimension" },
            ],
            measures: [], // No measures in this mock data
          });
        });
    } else {
      // No Qlik app provided - use basic mock fields
      console.warn("No Qlik app provided, using mock fields");
      setQlikFields({
        all: [
          { name: "name", type: "dimension" },
          { name: "athlete", type: "dimension" },
          { name: "team", type: "dimension" },
          { name: "event", type: "dimension" },
          { name: "time", type: "measure" },
          { name: "place", type: "measure" },
        ],
        dimensions: [
          { name: "name", type: "dimension" },
          { name: "athlete", type: "dimension" },
          { name: "team", type: "dimension" },
          { name: "event", type: "dimension" },
        ],
        measures: [
          { name: "time", type: "measure" },
          { name: "place", type: "measure" },
        ],
      });
    }
  }, [app]); // Re-run when app object changes

  // ===== FILE UPLOAD HANDLER =====
  // Processes uploaded file through the complete pipeline
  const handleFileUpload = async (uploadedFile) => {
    try {
      setIsLoading(true); // Show loading spinner in UI
      console.log("📁 Processing file:", uploadedFile.name);

      // Step 1: Parse CSV file into structured data
      const parsed = await parseCSVFile(uploadedFile);
      console.log(
        "File parsed:",
        parsed.totalRows,
        "rows,",
        parsed.totalColumns,
        "columns"
      );

      // Step 2: Generate smart column mappings using AI-like matching
      const smartMappings = generateSmartMappings(
        parsed.columns,
        qlikFields.all
      );
      console.log(
        "Smart mappings generated:",
        Object.keys(smartMappings).length
      );

      // Step 3: Update state and move to mapping review step
      setFile(uploadedFile);
      setParsedData(parsed);
      setMappings(smartMappings);
      setStep("mapping"); // Advance workflow to mapping review
    } catch (error) {
      console.error("File processing failed:", error);
      alert("File processing failed: " + error.message); // User-friendly error
    } finally {
      setIsLoading(false); // Hide loading spinner
    }
  };

  // ===== MAPPING CONFIRMATION HANDLER =====
  // User confirms their mapping choices and moves to table generation
  const handleMappingConfirm = (finalMappings) => {
    console.log("Mappings confirmed:", Object.keys(finalMappings).length);
    setMappings(finalMappings); // Store user's final mapping decisions
    setStep("complete"); // Move to table generation step
  };

  // ===== RESET HANDLER =====
  // Clears all state and returns to upload step
  const handleReset = () => {
    setStep("upload");
    setFile(null);
    setParsedData(null);
    setMappings({});
  };

  // ===== PROGRESS BREADCRUMB COMPONENT =====
  // Shows current step and navigation info in header
  const ProgressBreadcrumb = () => (
    <div
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #e5e7eb",
        backgroundColor: "#f9fafb",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Main title */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: "600",
          color: "#374151",
          marginBottom: "4px",
        }}
      >
        Smart Writeback Extension
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "14px",
          color: "#6b7280",
          marginBottom: "12px",
        }}
      >
        Intelligent Column Mapping
      </div>

      {/* Navigation breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          fontSize: "14px",
        }}
      >
        <span style={{ color: "#2563eb", fontWeight: "500" }}>
          Smart Writeback Extension
        </span>
        <span style={{ color: "#9ca3af" }}>→</span>

        {/* Step 1 - Upload (highlighted when active) */}
        <span style={{ color: step === "upload" ? "#2563eb" : "#9ca3af" }}>
          1. Upload
        </span>
        <span style={{ color: "#9ca3af" }}>→</span>

        {/* Step 2 - Map Columns (highlighted when active) */}
        <span style={{ color: step === "mapping" ? "#2563eb" : "#9ca3af" }}>
          2. Map Columns
        </span>
        <span style={{ color: "#9ca3af" }}>→</span>

        {/* Step 3 - Edit Data (highlighted when active) */}
        <span style={{ color: step === "complete" ? "#2563eb" : "#9ca3af" }}>
          3. Edit Data
        </span>

        {/* Show data info when file is loaded */}
        {parsedData && (
          <>
            <span style={{ marginLeft: "16px", color: "#6b7280" }}>
              {qlikFields.dimensions.length} dimensions,{" "}
              {qlikFields.measures.length} measures loaded
            </span>
            {file && (
              <span style={{ color: "#6b7280" }}>File: {file.name}</span>
            )}
          </>
        )}

        {/* Reset button to start over */}
        <button
          onClick={handleReset}
          style={{
            marginLeft: "auto",
            backgroundColor: "#6b7280",
            color: "white",
            padding: "6px 12px",
            borderRadius: "4px",
            border: "none",
            fontSize: "12px",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          Start Over
        </button>
      </div>
    </div>
  );

  // ===== MAIN RENDER =====
  // Conditionally renders different components based on current step
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Always show progress breadcrumb at top */}
      <ProgressBreadcrumb />

      <div style={{ padding: "24px" }}>
        {/* STEP 1: File Upload - Show drag-drop interface */}
        {step === "upload" && (
          <FileUpload
            onFileUpload={handleFileUpload} // Callback when file is selected
            isLoading={isLoading} // Loading state for UI
            qlikFields={qlikFields} // Show available fields to user
          />
        )}

        {/* STEP 2: Column Mapping - Show mapping interface (only when data exists) */}
        {step === "mapping" && parsedData && (
          <SimpleColumnMapper
            fileColumns={parsedData.columns} // Columns from uploaded file
            qlikFields={qlikFields.all} // Available Qlik fields for mapping
            suggestions={mappings} // Smart mappings generated automatically
            onMappingConfirm={handleMappingConfirm} // Callback when user confirms mappings
          />
        )}

        {/* STEP 3: Table Generation - Show final table structure */}
        {step === "complete" && (
          <MappedTable
            columnMappings={mappings} // User's confirmed column mappings
            parsedData={parsedData} // Original file data
            layout={layout} // Qlik layout object
            app={app} // Qlik app object
            model={model} // Qlik model object
            selections={selections} // Qlik selections object
          />
        )}
      </div>
    </div>
  );
}
