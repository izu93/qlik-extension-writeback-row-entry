// src/components/ColumnMapper.jsx
import React from "react";

export default function ColumnMapper({ 
  parsedData, 
  qlikFields, 
  suggestions, 
  currentMappings, 
  onMappingConfirm, 
  isLoading 
}) {
  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h3>Column Mapper Component</h3>
      <p>This will show the intelligent mapping interface</p>
      <p>File has {parsedData?.columns?.length || 0} columns</p>
      <p>Qlik has {qlikFields?.all?.length || 0} fields available</p>
      
      <button 
        onClick={() => onMappingConfirm({})}
        style={{
          padding: "8px 16px",
          backgroundColor: "#007acc",
          color: "white",
          border: "none",
          borderRadius: 4,
          cursor: "pointer"
        }}
      >
        Continue to Table (Demo)
      </button>
    </div>
  );
}

