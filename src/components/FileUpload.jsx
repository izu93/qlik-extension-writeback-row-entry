import React, { useState, useRef } from "react";

/**
 * FileUpload: Drag-and-drop file upload component
 * Supports Excel (.xlsx, .xls) and CSV files
 * Shows preview of uploaded data and Qlik model info
 */
export default function FileUpload({ onFileUpload, isLoading, qlikFields }) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
    "application/vnd.ms-excel", // .xls
    "text/csv", // .csv
    "application/csv"
  ];

  const supportedExtensions = [".xlsx", ".xls", ".csv"];

  /**
   * Handle file drop
   */
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const file = files[0];

    if (file && isValidFile(file)) {
      handleFileSelect(file);
    } else {
      alert("Please upload a valid Excel (.xlsx, .xls) or CSV file");
    }
  };

  /**
   * Handle file input change
   */
  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file && isValidFile(file)) {
      handleFileSelect(file);
    }
  };

  /**
   * Validate file type
   */
  const isValidFile = (file) => {
    const hasValidType = supportedTypes.includes(file.type);
    const hasValidExtension = supportedExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    return hasValidType || hasValidExtension;
  };

  /**
   * Process selected file
   */
  const handleFileSelect = async (file) => {
    console.log("File selected:", file.name, file.type, file.size);
    
    // Show basic file info as preview
    setPreviewData({
      name: file.name,
      size: (file.size / 1024).toFixed(1) + " KB",
      type: file.type || "Unknown",
      lastModified: new Date(file.lastModified).toLocaleDateString()
    });

    // Pass to parent for processing
    await onFileUpload(file);
  };

  /**
   * Handle drag events
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  /**
   * Open file dialog
   */
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div style={{ width: "100%", height: "100%" }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ 
          margin: 0, 
          fontSize: 18, 
          color: "#495057",
          fontWeight: "600"
        }}>
          🚀 Upload Your Data File
        </h2>
        <p style={{ 
          margin: "8px 0 0 0", 
          fontSize: 14, 
          color: "#6c757d" 
        }}>
          Upload an Excel or CSV file and we'll automatically map columns to your Qlik data model
        </p>
      </div>

      {/* Upload Area */}
      <div
        style={{
          border: `2px dashed ${isDragOver ? "#007acc" : "#dee2e6"}`,
          borderRadius: 8,
          padding: 40,
          textAlign: "center",
          backgroundColor: isDragOver ? "#f0f8ff" : "#fafbfc",
          cursor: "pointer",
          transition: "all 0.2s ease",
          marginBottom: 24
        }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          style={{ display: "none" }}
        />

        <div style={{ fontSize: 48, marginBottom: 16 }}>
          {isDragOver ? "⬇️" : "📊"}
        </div>

        <div style={{ fontSize: 16, fontWeight: "500", color: "#495057", marginBottom: 8 }}>
          {isDragOver ? "Drop your file here" : "Drag and drop your file here"}
        </div>

        <div style={{ fontSize: 14, color: "#6c757d", marginBottom: 16 }}>
          or click to browse and select a file
        </div>

        <div style={{ fontSize: 12, color: "#6c757d" }}>
          Supported formats: Excel (.xlsx, .xls) and CSV files
        </div>

        {isLoading && (
          <div style={{ 
            marginTop: 16, 
            fontSize: 14, 
            color: "#007acc",
            fontWeight: "500"
          }}>
            🔄 Processing file...
          </div>
        )}
      </div>

      {/* File Preview */}
      {previewData && !isLoading && (
        <div style={{
          backgroundColor: "#e8f5e8",
          border: "1px solid #d4edda",
          borderRadius: 6,
          padding: 16,
          marginBottom: 24
        }}>
          <div style={{ 
            fontSize: 14, 
            fontWeight: "bold", 
            color: "#155724",
            marginBottom: 12 
          }}>
            ✅ File Uploaded Successfully
          </div>
          
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr", 
            gap: 12,
            fontSize: 13,
            color: "#155724"
          }}>
            <div><strong>Name:</strong> {previewData.name}</div>
            <div><strong>Size:</strong> {previewData.size}</div>
            <div><strong>Type:</strong> {previewData.type}</div>
            <div><strong>Modified:</strong> {previewData.lastModified}</div>
          </div>
        </div>
      )}

      {/* Qlik Model Info */}
      <div style={{
        backgroundColor: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: 6,
        padding: 16
      }}>
        <div style={{ 
          fontSize: 14, 
          fontWeight: "bold", 
          color: "#495057",
          marginBottom: 12 
        }}>
          📊 Available Qlik Fields
        </div>

        {qlikFields.all.length > 0 ? (
          <div>
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "1fr 1fr", 
              gap: 16,
              marginBottom: 16
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: "500", color: "#495057", marginBottom: 8 }}>
                  📏 Dimensions ({qlikFields.dimensions.length})
                </div>
                <div style={{ 
                  maxHeight: 120, 
                  overflow: "auto",
                  fontSize: 12,
                  color: "#6c757d"
                }}>
                  {qlikFields.dimensions.slice(0, 10).map((dim, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      • {dim.name}
                    </div>
                  ))}
                  {qlikFields.dimensions.length > 10 && (
                    <div style={{ fontStyle: "italic", color: "#999" }}>
                      ... and {qlikFields.dimensions.length - 10} more
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 13, fontWeight: "500", color: "#495057", marginBottom: 8 }}>
                  📊 Measures ({qlikFields.measures.length})
                </div>
                <div style={{ 
                  maxHeight: 120, 
                  overflow: "auto",
                  fontSize: 12,
                  color: "#6c757d"
                }}>
                  {qlikFields.measures.slice(0, 10).map((measure, i) => (
                    <div key={i} style={{ marginBottom: 4 }}>
                      • {measure.name}
                    </div>
                  ))}
                  {qlikFields.measures.length > 10 && (
                    <div style={{ fontStyle: "italic", color: "#999" }}>
                      ... and {qlikFields.measures.length - 10} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ 
              fontSize: 11, 
              color: "#28a745",
              padding: 8,
              backgroundColor: "#d4edda",
              borderRadius: 4
            }}>
              💡 <strong>Smart Mapping Ready:</strong> We'll automatically suggest the best field matches for your uploaded columns
            </div>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: "#6c757d" }}>
            Loading Qlik data model...
          </div>
        )}
      </div>

      {/* Example Data Hint */}
      <div style={{
        marginTop: 16,
        padding: 12,
        backgroundColor: "#fff3cd",
        border: "1px solid #ffeaa7",
        borderRadius: 4,
        fontSize: 12,
        color: "#856404"
      }}>
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>
          💡 Example: Swimming Competition Data
        </div>
        <div>
          Upload files with columns like: <strong>place, heat, lane, name, team, reaction_time, time, event, competition, distance</strong>
        </div>
      </div>
    </div>
  );
}