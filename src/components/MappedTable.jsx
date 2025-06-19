// src/components/MappedTable.jsx
import React from "react";

export default function MappedTable({
  columnMappings,
  parsedData,
  layout,
  app,
  model,
  selections,
}) {
  return (
    <div style={{ padding: 20, textAlign: "center" }}>
      <h3>Mapped Table Component</h3>
      <p>This will show the final editable table</p>
      <p>Mappings: {Object.keys(columnMappings).length}</p>
      <p>Data rows: {parsedData?.rows?.length || 0}</p>

      <div
        style={{
          marginTop: 20,
          padding: 16,
          backgroundColor: "#f8f9fa",
          borderRadius: 4,
          border: "1px solid #dee2e6",
        }}
      >
        <strong>Phase 1 Complete!</strong>
        <br />
        File upload and parsing is working.
        <br />
        Next: Build the mapping interface and table generator.
      </div>
    </div>
  );
}
