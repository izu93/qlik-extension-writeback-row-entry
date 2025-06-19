import React, { useState, useRef } from "react";

/**
 * FileUpload: Enhanced drag-and-drop file upload component with inline comments
 * Handles file selection, validation, and shows Qlik field information
 */
export default function FileUpload({ onFileUpload, isLoading, qlikFields }) {
  // ===== STATE MANAGEMENT =====
  // Track drag-over state for visual feedback
  const [isDragOver, setIsDragOver] = useState(false);

  // Store file preview information after selection
  const [previewData, setPreviewData] = useState(null);

  // Reference to hidden file input element
  const fileInputRef = useRef(null);

  // ===== FILE TYPE VALIDATION =====
  // Accepted MIME types for file validation
  const supportedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
    "application/csv", // Alternative CSV MIME type
  ];

  // Accepted file extensions as fallback validation
  const supportedExtensions = [".xlsx", ".xls", ".csv"];

  // ===== DRAG AND DROP HANDLERS =====
  /**
   * Handle file drop event from drag-and-drop
   */
  const handleDrop = (e) => {
    e.preventDefault(); // Prevent browser default file handling
    setIsDragOver(false); // Remove drag-over visual state

    const files = Array.from(e.dataTransfer.files); // Get dropped files
    const file = files[0]; // Take only first file

    if (file && isValidFile(file)) {
      handleFileSelect(file); // Process valid file
    } else {
      alert("Please upload a valid Excel (.xlsx, .xls) or CSV file"); // User feedback
    }
  };

  /**
   * Handle file selection via file input
   */
  const handleFileInputChange = (e) => {
    const file = e.target.files[0]; // Get selected file
    if (file && isValidFile(file)) {
      handleFileSelect(file); // Process valid file
    }
  };

  /**
   * Validate file type and extension
   */
  const isValidFile = (file) => {
    // Check MIME type first
    const hasValidType = supportedTypes.includes(file.type);

    // Check file extension as fallback (some browsers don't set MIME type correctly)
    const hasValidExtension = supportedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    return hasValidType || hasValidExtension; // Valid if either check passes
  };

  /**
   * Process selected file and trigger upload
   */
  const handleFileSelect = async (file) => {
    console.log("File selected:", file.name, file.type, file.size);

    // Create preview data object for UI display
    setPreviewData({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB", // Convert bytes to KB
      type: file.type || "Unknown", // MIME type or fallback
      lastModified: new Date(file.lastModified).toLocaleDateString(), // Format date
    });

    // Call parent component's upload handler
    await onFileUpload(file);
  };

  // ===== DRAG EVENT HANDLERS =====
  const handleDragOver = (e) => {
    e.preventDefault(); // Allow drop
    setIsDragOver(true); // Show visual feedback
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false); // Remove visual feedback
  };

  /**
   * Trigger hidden file input click
   */
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* ===== HEADER SECTION ===== */}
      <div style={{ textAlign: "center", marginBottom: "32px" }}>
        <h2
          style={{
            margin: "0 0 8px 0",
            fontSize: "24px",
            color: "#374151",
            fontWeight: "600",
          }}
        >
          Upload Your Data File
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            color: "#6b7280",
          }}
        >
          Upload an Excel or CSV file and we'll automatically map columns to
          your Qlik data model
        </p>
      </div>

      {/* ===== DRAG-AND-DROP UPLOAD AREA ===== */}
      <div
        style={{
          // Dynamic border color based on drag state
          border: `2px dashed ${isDragOver ? "#2563eb" : "#d1d5db"}`,
          borderRadius: "8px",
          padding: "48px",
          textAlign: "center",
          // Dynamic background color based on drag state
          backgroundColor: isDragOver ? "#eff6ff" : "#fafbfc",
          cursor: "pointer",
          transition: "all 0.2s ease", // Smooth visual transitions
          marginBottom: "24px",
        }}
        // Drag and drop event handlers
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog} // Click to open file dialog
      >
        {/* Hidden file input element */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv" // Limit file picker to supported types
          onChange={handleFileInputChange}
          style={{ display: "none" }} // Hide from view
        />

        {/* Large emoji icon */}
        <div style={{ fontSize: "48px", marginBottom: "16px" }}>
          {isDragOver ? "⬇️" : "📊"} {/* Change icon based on drag state */}
        </div>

        {/* Main instruction text */}
        <div
          style={{
            fontSize: "18px",
            fontWeight: "500",
            color: "#374151",
            marginBottom: "8px",
          }}
        >
          {isDragOver ? "Drop your file here" : "Drag and drop your file here"}
        </div>

        {/* Alternative action text */}
        <div
          style={{ fontSize: "16px", color: "#6b7280", marginBottom: "16px" }}
        >
          or click to browse and select a file
        </div>

        {/* Supported formats reminder */}
        <div style={{ fontSize: "14px", color: "#6b7280" }}>
          Supported formats: Excel (.xlsx, .xls) and CSV files
        </div>

        {/* Loading indicator (shown during file processing) */}
        {isLoading && (
          <div
            style={{
              marginTop: "16px",
              fontSize: "16px",
              color: "#2563eb",
              fontWeight: "500",
            }}
          >
            🔄 Processing file...
          </div>
        )}
      </div>

      {/* ===== FILE PREVIEW SECTION ===== */}
      {/* Only shown after successful file selection and not during loading */}
      {previewData && !isLoading && (
        <div
          style={{
            backgroundColor: "#dcfce7", // Light green background
            border: "1px solid #bbf7d0",
            borderRadius: "8px",
            padding: "16px",
            marginBottom: "24px",
          }}
        >
          {/* Success message */}
          <div
            style={{
              fontSize: "16px",
              fontWeight: "bold",
              color: "#166534", // Dark green
              marginBottom: "12px",
            }}
          >
            ✅ File Uploaded Successfully
          </div>

          {/* File details grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr", // Two columns
              gap: "12px",
              fontSize: "14px",
              color: "#166534",
            }}
          >
            <div>
              <strong>Name:</strong> {previewData.name}
            </div>
            <div>
              <strong>Size:</strong> {previewData.size}
            </div>
            <div>
              <strong>Type:</strong> {previewData.type}
            </div>
            <div>
              <strong>Modified:</strong> {previewData.lastModified}
            </div>
          </div>
        </div>
      )}

      {/* ===== AVAILABLE QLIK FIELDS SECTION ===== */}
      {/* Shows user what fields are available for mapping */}
      <div
        style={{
          backgroundColor: "#f9fafb",
          border: "1px solid #e5e7eb",
          borderRadius: "8px",
          padding: "16px",
        }}
      >
        {/* Section header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "16px",
            fontWeight: "bold",
            color: "#374151",
            marginBottom: "16px",
          }}
        >
          📊 Available Qlik Fields
        </div>

        {/* Check if Qlik fields are loaded */}
        {qlikFields.all && qlikFields.all.length > 0 ? (
          <div>
            {/* Two-column layout for dimensions and measures */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "24px",
                marginBottom: "16px",
              }}
            >
              {/* ===== DIMENSIONS COLUMN ===== */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  {/* Blue dot indicator */}
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#60a5fa",
                      borderRadius: "50%",
                    }}
                  ></span>
                  📏 Dimensions (
                  {qlikFields.dimensions ? qlikFields.dimensions.length : 0})
                </div>

                {/* Scrollable list of dimension fields */}
                <div
                  style={{
                    maxHeight: "120px",
                    overflow: "auto",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {qlikFields.dimensions &&
                    qlikFields.dimensions.slice(0, 10).map((dim, i) => (
                      <div key={i} style={{ marginBottom: "4px" }}>
                        • {dim.name}
                      </div>
                    ))}
                  {/* Show "and X more" if there are more than 10 */}
                  {qlikFields.dimensions &&
                    qlikFields.dimensions.length > 10 && (
                      <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
                        ... and {qlikFields.dimensions.length - 10} more
                      </div>
                    )}
                </div>
              </div>

              {/* ===== MEASURES COLUMN ===== */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    fontWeight: "500",
                    color: "#374151",
                    marginBottom: "8px",
                  }}
                >
                  {/* Purple dot indicator */}
                  <span
                    style={{
                      width: "8px",
                      height: "8px",
                      backgroundColor: "#a78bfa",
                      borderRadius: "50%",
                    }}
                  ></span>
                  📊 Measures (
                  {qlikFields.measures ? qlikFields.measures.length : 0})
                </div>

                {/* Scrollable list of measure fields or empty message */}
                <div
                  style={{
                    maxHeight: "120px",
                    overflow: "auto",
                    fontSize: "12px",
                    color: "#6b7280",
                  }}
                >
                  {qlikFields.measures && qlikFields.measures.length > 0 ? (
                    <>
                      {qlikFields.measures.slice(0, 10).map((measure, i) => (
                        <div key={i} style={{ marginBottom: "4px" }}>
                          • {measure.name}
                        </div>
                      ))}
                      {/* Show "and X more" if there are more than 10 */}
                      {qlikFields.measures.length > 10 && (
                        <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
                          ... and {qlikFields.measures.length - 10} more
                        </div>
                      )}
                    </>
                  ) : (
                    // Empty state for measures
                    <div style={{ fontStyle: "italic", color: "#9ca3af" }}>
                      No measures available
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ===== SMART MAPPING READY INDICATOR ===== */}
            <div
              style={{
                fontSize: "12px",
                color: "#065f46",
                padding: "8px",
                backgroundColor: "#d1fae5", // Light green
                borderRadius: "4px",
              }}
            >
              💡 <strong>Smart Mapping Ready:</strong> We'll automatically
              suggest the best field matches for your uploaded columns
            </div>
          </div>
        ) : (
          // Loading state when Qlik fields haven't loaded yet
          <div style={{ fontSize: "14px", color: "#6b7280" }}>
            Loading Qlik data model...
          </div>
        )}
      </div>

      {/* ===== EXAMPLE DATA HINT ===== */}
      {/* Helps users understand expected data format */}
      <div
        style={{
          marginTop: "16px",
          padding: "12px",
          backgroundColor: "#fef3c7", // Light yellow
          border: "1px solid #fbbf24",
          borderRadius: "4px",
          fontSize: "14px",
          color: "#92400e", // Dark yellow/brown
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
          💡 Example: Swimming Competition Data
        </div>
        <div>
          Upload files with columns like:{" "}
          <strong>
            place, heat, lane, name, team, reaction_time, time, event,
            competition, distance
          </strong>
        </div>
      </div>
    </div>
  );
}
