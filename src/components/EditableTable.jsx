// ===== PHASE 3: EDITABLE TABLE COMPONENT =====
// EditableTable.jsx - Core interactive table with cell editing functionality
import React, { useState, useEffect, useRef } from "react";

/**
 * EditableTable: Main interactive data table component
 * Handles cell editing, row management, and change tracking
 */
export default function EditableTable({
  columnMappings, // Confirmed column mappings from Phase 2
  parsedData, // Original CSV data
  onDataChange, // Callback when data changes
  onSave, // Callback to save changes (future OneDrive integration)
}) {
  // ===== STATE MANAGEMENT =====
  // Current editable data with change tracking
  const [tableData, setTableData] = useState([]);

  // Track changes vs original data
  const [changes, setChanges] = useState({
    added: [], // New rows that don't exist in original data
    modified: [], // Existing rows that have been changed
    deleted: [], // Row IDs that have been deleted
  });

  // Track which cell is currently being edited
  const [editingCell, setEditingCell] = useState(null); // {rowId, column}

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10); // Show 10 records per page

  // Loading and error states
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Reference for auto-focusing input cells
  const inputRefs = useRef({});

  // ===== INITIALIZE TABLE DATA =====
  // Convert parsed CSV data into editable table format
  useEffect(() => {
    if (parsedData && parsedData.rows && columnMappings) {
      console.log("Initializing editable table data...");

      // Transform original data into editable format
      const editableRows = parsedData.rows.map((row, index) => ({
        id: `original_${index}`, // Unique row identifier
        originalIndex: index, // Reference to original data
        status: "saved", // saved | modified | new
        isNew: false, // Track if this is a newly added row
        data: extractMappedData(row, columnMappings), // Only mapped columns
        originalData: extractMappedData(row, columnMappings), // Backup for change detection
      }));

      setTableData(editableRows);
      console.log(`Initialized ${editableRows.length} editable rows`);
    }
  }, [parsedData, columnMappings]);

  // ===== FILTER AND SEARCH =====
  // Apply search filter to table data
  useEffect(() => {
    if (!tableData.length) {
      setFilteredData([]);
      return;
    }

    if (!searchTerm.trim()) {
      setFilteredData(tableData);
      return;
    }

    // Search across all visible columns
    const filtered = tableData.filter((row) => {
      return Object.values(row.data).some((value) =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      );
    });

    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when searching
  }, [tableData, searchTerm]);

  // ===== HELPER FUNCTIONS =====

  /**
   * Extract only mapped columns from a data row
   */
  function extractMappedData(row, mappings) {
    const mappedData = {};
    Object.keys(mappings).forEach((fileColumn) => {
      mappedData[fileColumn] = row[fileColumn] || "";
    });
    return mappedData;
  }

  /**
   * Get column configuration for rendering
   */
  function getColumnConfig() {
    return Object.entries(columnMappings).map(([fileColumn, mapping]) => ({
      key: fileColumn,
      label: fileColumn,
      qlikField: mapping.qlikField.name,
      type: mapping.qlikField.type,
      fieldType: getFieldType(fileColumn, mapping.qlikField),
    }));
  }

  /**
   * Determine input type based on field name and Qlik field type
   */
  function getFieldType(fileColumn, qlikField) {
    const columnLower = fileColumn.toLowerCase();

    // Swimming-specific field type detection
    if (columnLower.includes("time") && !columnLower.includes("reaction")) {
      return "time"; // Swimming time format (MM:SS.ss)
    }
    if (columnLower.includes("reaction_time")) {
      return "number"; // Reaction time in seconds
    }
    if (columnLower.includes("place") || columnLower.includes("lane")) {
      return "number";
    }
    if (
      ["competition", "event", "team", "heat"].some((term) =>
        columnLower.includes(term)
      )
    ) {
      return "dropdown";
    }

    // Default based on Qlik field type
    return qlikField.type === "measure" ? "number" : "text";
  }

  /**
   * Get unique values for dropdown fields
   */
  function getDropdownOptions(columnKey) {
    const uniqueValues = new Set();

    // Get values from original data
    if (parsedData && parsedData.rows) {
      parsedData.rows.forEach((row) => {
        if (row[columnKey] && row[columnKey] !== "") {
          uniqueValues.add(row[columnKey]);
        }
      });
    }

    // Add values from current table data
    tableData.forEach((row) => {
      if (row.data[columnKey] && row.data[columnKey] !== "") {
        uniqueValues.add(row.data[columnKey]);
      }
    });

    return Array.from(uniqueValues).sort();
  }

  // ===== ROW MANAGEMENT =====

  /**
   * Add a new empty row to the table
   */
  function addNewRow() {
    const newRowId = `new_${Date.now()}`;
    const emptyData = {};

    // Initialize empty data for all columns
    Object.keys(columnMappings).forEach((column) => {
      emptyData[column] = "";
    });

    const newRow = {
      id: newRowId,
      originalIndex: null, // No original index for new rows
      status: "new",
      isNew: true,
      data: emptyData,
      originalData: {}, // No original data for new rows
    };

    setTableData((prev) => [newRow, ...prev]); // Add to top for visibility
    setChanges((prev) => ({
      ...prev,
      added: [...prev.added, newRowId],
    }));

    // Auto-focus first cell of new row
    setEditingCell({ rowId: newRowId, column: Object.keys(columnMappings)[0] });

    console.log("Added new row:", newRowId);
  }

  /**
   * Delete a row from the table
   */
  function deleteRow(rowId) {
    if (!confirm("Are you sure you want to delete this row?")) {
      return;
    }

    const row = tableData.find((r) => r.id === rowId);
    if (!row) return;

    // Remove from table data
    setTableData((prev) => prev.filter((r) => r.id !== rowId));

    // Update changes tracking
    setChanges((prev) => {
      const newChanges = { ...prev };

      if (row.isNew) {
        // Remove from added list if it was a new row
        newChanges.added = newChanges.added.filter((id) => id !== rowId);
      } else {
        // Add to deleted list if it was an original row
        newChanges.deleted = [...newChanges.deleted, rowId];
        // Remove from modified list if it was there
        newChanges.modified = newChanges.modified.filter((id) => id !== rowId);
      }

      return newChanges;
    });

    console.log("Deleted row:", rowId);
  }

  // ===== CELL EDITING =====

  /**
   * Start editing a specific cell
   */
  function startEditing(rowId, column) {
    setEditingCell({ rowId, column });

    // Focus input after state update
    setTimeout(() => {
      const inputKey = `${rowId}_${column}`;
      if (inputRefs.current[inputKey]) {
        inputRefs.current[inputKey].focus();
      }
    }, 0);
  }

  /**
   * Stop editing current cell
   */
  function stopEditing() {
    setEditingCell(null);
  }

  /**
   * Update cell value and track changes
   */
  function updateCellValue(rowId, column, newValue) {
    setTableData((prev) => {
      return prev.map((row) => {
        if (row.id !== rowId) return row;

        // Create updated row
        const updatedRow = {
          ...row,
          data: {
            ...row.data,
            [column]: newValue,
          },
        };

        // Update status if not already new
        if (!row.isNew) {
          // Check if any field differs from original
          const hasChanges = Object.keys(updatedRow.data).some((key) => {
            return updatedRow.data[key] !== row.originalData[key];
          });

          updatedRow.status = hasChanges ? "modified" : "saved";
        }

        return updatedRow;
      });
    });

    // Update changes tracking
    setChanges((prev) => {
      const row = tableData.find((r) => r.id === rowId);
      if (!row || row.isNew) return prev; // Don't track new rows in modified list

      const newChanges = { ...prev };

      // Add to modified list if not already there
      if (!newChanges.modified.includes(rowId)) {
        newChanges.modified = [...newChanges.modified, rowId];
      }

      return newChanges;
    });
  }

  /**
   * Handle keyboard navigation in cells
   */
  function handleKeyPress(e, rowId, column) {
    if (e.key === "Enter") {
      e.preventDefault();
      stopEditing();

      // Move to next row, same column
      const currentRowIndex = filteredData.findIndex((row) => row.id === rowId);
      const nextRowIndex = currentRowIndex + 1;

      if (nextRowIndex < filteredData.length) {
        const nextRowId = filteredData[nextRowIndex].id;
        startEditing(nextRowId, column);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      stopEditing();
    } else if (e.key === "Tab") {
      e.preventDefault();

      // Move to next column
      const columns = Object.keys(columnMappings);
      const currentColumnIndex = columns.indexOf(column);
      const nextColumnIndex = e.shiftKey
        ? currentColumnIndex - 1
        : currentColumnIndex + 1;

      if (nextColumnIndex >= 0 && nextColumnIndex < columns.length) {
        startEditing(rowId, columns[nextColumnIndex]);
      } else {
        stopEditing();
      }
    }
  }

  // ===== SAVE OPERATIONS =====

  /**
   * Save changes for a specific row
   */
  function saveRow(rowId) {
    const row = tableData.find((r) => r.id === rowId);
    if (!row) return;

    // Validate row data
    const validation = validateRowData(row.data);
    if (!validation.isValid) {
      setErrors((prev) => ({
        ...prev,
        [rowId]: validation.errors,
      }));
      return;
    }

    // Clear any existing errors
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[rowId];
      return newErrors;
    });

    // Update row status to saved and create backup
    setTableData((prev) => {
      return prev.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          status: "saved",
          originalData: { ...r.data }, // Create new backup
        };
      });
    });

    // Remove from changes tracking
    setChanges((prev) => ({
      ...prev,
      modified: prev.modified.filter((id) => id !== rowId),
      added: prev.added.filter((id) => id !== rowId), // Remove from added if it was new
    }));

    console.log("Saved row:", rowId);

    // Call parent callback if provided
    if (onDataChange) {
      onDataChange(getChangedData());
    }
  }

  /**
   * Save all pending changes
   */
  function saveAllChanges() {
    const rowsWithChanges = tableData.filter(
      (row) => row.status === "new" || row.status === "modified"
    );

    if (rowsWithChanges.length === 0) {
      alert("No changes to save.");
      return;
    }

    // Validate all rows
    const allValid = rowsWithChanges.every((row) => {
      const validation = validateRowData(row.data);
      return validation.isValid;
    });

    if (!allValid) {
      alert("Please fix validation errors before saving all changes.");
      return;
    }

    // Save each row
    rowsWithChanges.forEach((row) => {
      saveRow(row.id);
    });

    console.log(`Saved ${rowsWithChanges.length} rows`);
  }

  /**
   * Basic row data validation
   */
  function validateRowData(data) {
    const errors = [];

    // Check required fields (basic example)
    if (!data.name || data.name.trim() === "") {
      errors.push("Name is required");
    }

    // Validate numeric fields
    if (data.time && isNaN(parseFloat(data.time))) {
      errors.push("Time must be a valid number");
    }

    if (
      data.place &&
      (isNaN(parseInt(data.place)) || parseInt(data.place) < 1)
    ) {
      errors.push("Place must be a positive number");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get current data with changes for external use
   */
  function getChangedData() {
    return {
      allData: tableData.map((row) => row.data),
      changes: changes,
      stats: {
        total: tableData.length,
        new: changes.added.length,
        modified: changes.modified.length,
        deleted: changes.deleted.length,
      },
    };
  }

  // ===== PAGINATION =====
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = filteredData.slice(startIndex, startIndex + pageSize);

  // ===== RENDER CELL CONTENT =====

  /**
   * Render editable cell based on field type
   */
  function renderEditableCell(row, column, fieldType) {
    const isEditing =
      editingCell?.rowId === row.id && editingCell?.column === column;
    const cellValue = row.data[column] || "";
    const inputKey = `${row.id}_${column}`;

    // Common input props
    const inputProps = {
      ref: (el) => {
        inputRefs.current[inputKey] = el;
      },
      value: cellValue,
      onChange: (e) => updateCellValue(row.id, column, e.target.value),
      onKeyDown: (e) => handleKeyPress(e, row.id, column),
      onBlur: stopEditing,
      style: {
        width: "100%",
        border: "1px solid transparent",
        padding: "6px 8px",
        borderRadius: "4px",
        background: isEditing ? "white" : "transparent",
        fontSize: "13px",
        transition: "all 0.2s",
        borderColor: isEditing ? "#3b82f6" : "transparent",
        boxShadow: isEditing ? "0 0 0 2px rgba(59, 130, 246, 0.1)" : "none",
      },
    };

    if (isEditing) {
      // Render appropriate input type when editing
      switch (fieldType) {
        case "number":
          return (
            <input
              {...inputProps}
              type="number"
              step="0.01"
              placeholder="Enter number"
            />
          );

        case "time":
          return (
            <input
              {...inputProps}
              type="text"
              placeholder="MM:SS.ss"
              pattern="[0-9]+:[0-5][0-9]\.[0-9]{2}"
            />
          );

        case "dropdown":
          const options = getDropdownOptions(column);
          return (
            <select
              {...inputProps}
              style={{
                ...inputProps.style,
                cursor: "pointer",
              }}
            >
              <option value="">Select {column}</option>
              {options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          );

        default:
          return (
            <input
              {...inputProps}
              type="text"
              placeholder={`Enter ${column}`}
            />
          );
      }
    } else {
      // Render as clickable cell when not editing
      return (
        <div
          onClick={() => startEditing(row.id, column)}
          style={{
            width: "100%",
            minHeight: "32px",
            padding: "6px 8px",
            cursor: "pointer",
            borderRadius: "4px",
            display: "flex",
            alignItems: "center",
            transition: "background-color 0.2s",
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = "#f8fafc")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
        >
          {cellValue || (
            <span style={{ color: "#9ca3af", fontStyle: "italic" }}>
              Click to edit
            </span>
          )}
        </div>
      );
    }
  }

  // ===== COMPONENT RENDER =====
  if (!columnMappings || Object.keys(columnMappings).length === 0) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
        No column mappings available. Please complete Phase 2 first.
      </div>
    );
  }

  const columns = getColumnConfig();
  const stats = {
    total: tableData.length,
    new: changes.added.length,
    modified: changes.modified.length,
    pending: changes.added.length + changes.modified.length,
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          paddingBottom: "16px",
          borderBottom: "2px solid #e2e8f0",
        }}
      >
        <div>
          <h2
            style={{
              margin: "0 0 4px 0",
              fontSize: "24px",
              fontWeight: "600",
              color: "#1e293b",
            }}
          >
            Writeback Table
          </h2>
          <div style={{ color: "#64748b", fontSize: "14px" }}>
            {columns.length} columns • {stats.total} rows • {stats.pending}{" "}
            pending changes
          </div>
        </div>
      </div>

      {/* Table Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "16px",
          background: "white",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <button
            onClick={addNewRow}
            style={{
              background: "linear-gradient(135deg, #10b981, #059669)",
              color: "white",
              border: "none",
              padding: "10px 20px",
              borderRadius: "6px",
              fontWeight: "500",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = "translateY(-1px)";
              e.target.style.boxShadow = "0 4px 12px rgba(16, 185, 129, 0.3)";
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "none";
            }}
          >
            ➕ Add New Entry
          </button>

          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search athletes, events, teams..."
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "6px",
              fontSize: "14px",
              width: "250px",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <span style={{ color: "#64748b", fontSize: "14px" }}>
            {paginatedData.length} of {filteredData.length} rows shown
          </span>
          <button
            onClick={saveAllChanges}
            disabled={stats.pending === 0}
            style={{
              background:
                stats.pending > 0
                  ? "linear-gradient(135deg, #f59e0b, #d97706)"
                  : "#d1d5db",
              color: stats.pending > 0 ? "white" : "#9ca3af",
              border: "none",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: stats.pending > 0 ? "pointer" : "not-allowed",
            }}
          >
            💾 Save All Changes ({stats.pending})
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div
        style={{
          background: "white",
          borderRadius: "8px",
          overflow: "hidden",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            fontSize: "13px",
          }}
        >
          <thead>
            <tr
              style={{
                background: "linear-gradient(135deg, #f1f5f9, #e2e8f0)",
              }}
            >
              <th
                style={{
                  padding: "12px 8px",
                  textAlign: "left",
                  fontWeight: "600",
                  color: "#374151",
                  borderBottom: "2px solid #cbd5e1",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                Status
              </th>
              {columns.map((column) => (
                <th
                  key={column.key}
                  style={{
                    padding: "12px 8px",
                    textAlign: "left",
                    fontWeight: "600",
                    color: "#374151",
                    borderBottom: "2px solid #cbd5e1",
                    position: "sticky",
                    top: 0,
                    zIndex: 10,
                  }}
                >
                  <div>{column.label}</div>
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#6b7280",
                      fontWeight: "normal",
                      marginTop: "2px",
                    }}
                  >
                    {column.qlikField} ({column.fieldType})
                  </div>
                </th>
              ))}
              <th
                style={{
                  width: "100px",
                  textAlign: "center",
                  padding: "12px 8px",
                  fontWeight: "600",
                  color: "#374151",
                  borderBottom: "2px solid #cbd5e1",
                  position: "sticky",
                  top: 0,
                  zIndex: 10,
                }}
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row) => (
              <tr
                key={row.id}
                style={{
                  background:
                    row.status === "new"
                      ? "#ecfdf5"
                      : row.status === "modified"
                      ? "#fefce8"
                      : "white",
                  borderLeft:
                    row.status === "new"
                      ? "4px solid #10b981"
                      : row.status === "modified"
                      ? "4px solid #f59e0b"
                      : "none",
                }}
                onMouseEnter={(e) => {
                  if (row.status === "saved") {
                    e.currentTarget.style.background = "#f8fafc";
                  }
                }}
                onMouseLeave={(e) => {
                  if (row.status === "saved") {
                    e.currentTarget.style.background = "white";
                  }
                }}
              >
                <td
                  style={{ padding: "8px", borderBottom: "1px solid #f1f5f9" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        display: "inline-block",
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background:
                          row.status === "new"
                            ? "#10b981"
                            : row.status === "modified"
                            ? "#f59e0b"
                            : "#6b7280",
                      }}
                    ></span>
                    <span
                      style={{
                        fontSize: "12px",
                        color:
                          row.status === "new"
                            ? "#065f46"
                            : row.status === "modified"
                            ? "#92400e"
                            : "#374151",
                        textTransform: "capitalize",
                      }}
                    >
                      {row.status}
                    </span>
                  </div>
                </td>

                {columns.map((column) => (
                  <td
                    key={`${row.id}_${column.key}`}
                    style={{
                      padding: "8px",
                      borderBottom: "1px solid #f1f5f9",
                      verticalAlign: "middle",
                    }}
                  >
                    {renderEditableCell(row, column.key, column.fieldType)}
                    {errors[row.id] &&
                      errors[row.id].some((err) =>
                        err.includes(column.key)
                      ) && (
                        <div
                          style={{
                            fontSize: "11px",
                            color: "#dc2626",
                            marginTop: "2px",
                          }}
                        >
                          {errors[row.id].find((err) =>
                            err.includes(column.key)
                          )}
                        </div>
                      )}
                  </td>
                ))}

                <td
                  style={{
                    padding: "8px",
                    borderBottom: "1px solid #f1f5f9",
                    textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      gap: "6px",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <button
                      onClick={() => saveRow(row.id)}
                      disabled={row.status === "saved"}
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "none",
                        borderRadius: "4px",
                        cursor:
                          row.status === "saved" ? "not-allowed" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        background:
                          row.status === "saved" ? "#f3f4f6" : "#dcfce7",
                        color: row.status === "saved" ? "#9ca3af" : "#166534",
                        transition: "all 0.2s",
                      }}
                      title="Save Row"
                      onMouseEnter={(e) => {
                        if (row.status !== "saved") {
                          e.target.style.transform = "scale(1.1)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      💾
                    </button>

                    <button
                      onClick={() => deleteRow(row.id)}
                      style={{
                        width: "28px",
                        height: "28px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        background: "#fee2e2",
                        color: "#dc2626",
                        transition: "all 0.2s",
                      }}
                      title="Delete Row"
                      onMouseEnter={(e) => {
                        e.target.style.transform = "scale(1.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.transform = "scale(1)";
                      }}
                    >
                      X
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Table Footer */}
        <div
          style={{
            padding: "16px",
            background: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          <div>
            Showing {startIndex + 1}-
            {Math.min(startIndex + pageSize, filteredData.length)} of{" "}
            {filteredData.length} entries • {stats.pending} unsaved changes
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                background: currentPage === 1 ? "#f9fafb" : "white",
                borderRadius: "4px",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
                fontSize: "13px",
                color: currentPage === 1 ? "#9ca3af" : "#374151",
              }}
            >
              ← Prev
            </button>

            {/* Show page numbers with proper logic - max 10 visible */}
            {(() => {
              const maxVisiblePages = 10; // Show maximum 10 page numbers
              const totalPages = Math.ceil(filteredData.length / pageSize);

              // Calculate which pages to show
              let startPage = Math.max(
                1,
                currentPage - Math.floor(maxVisiblePages / 2)
              );
              let endPage = Math.min(
                totalPages,
                startPage + maxVisiblePages - 1
              );

              // Adjust startPage if we're near the end
              if (endPage - startPage + 1 < maxVisiblePages) {
                startPage = Math.max(1, endPage - maxVisiblePages + 1);
              }

              const pages = [];

              // Add "First" button if we're not showing page 1
              if (startPage > 1) {
                pages.push(
                  <button
                    key="first"
                    onClick={() => setCurrentPage(1)}
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      background: "white",
                      color: "#374151",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    1
                  </button>
                );

                if (startPage > 2) {
                  pages.push(
                    <span
                      key="ellipsis1"
                      style={{ color: "#9ca3af", padding: "0 4px" }}
                    >
                      ...
                    </span>
                  );
                }
              }

              // Add the visible page range
              for (let i = startPage; i <= endPage; i++) {
                const isActive = i === currentPage;
                pages.push(
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      background: isActive ? "#3b82f6" : "white",
                      color: isActive ? "white" : "#374151",
                      borderColor: isActive ? "#3b82f6" : "#d1d5db",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: isActive ? "600" : "normal",
                      minWidth: "28px",
                    }}
                  >
                    {i}
                  </button>
                );
              }

              // Add "Last" button if we're not showing the last page
              if (endPage < totalPages) {
                if (endPage < totalPages - 1) {
                  pages.push(
                    <span
                      key="ellipsis2"
                      style={{ color: "#9ca3af", padding: "0 4px" }}
                    >
                      ...
                    </span>
                  );
                }

                pages.push(
                  <button
                    key="last"
                    onClick={() => setCurrentPage(totalPages)}
                    style={{
                      padding: "6px 8px",
                      border: "1px solid #d1d5db",
                      background: "white",
                      color: "#374151",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }}
                  >
                    {totalPages}
                  </button>
                );
              }

              return pages;
            })()}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
              style={{
                padding: "6px 12px",
                border: "1px solid #d1d5db",
                background: currentPage === totalPages ? "#f9fafb" : "white",
                borderRadius: "4px",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
                fontSize: "13px",
                color: currentPage === totalPages ? "#9ca3af" : "#374151",
              }}
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Panel */}
      <div
        style={{
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          padding: "16px",
          marginTop: "16px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "16px",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            {stats.total}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            Total Records
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#1e293b",
            }}
          >
            {columns.length}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            Mapped Columns
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#10b981",
            }}
          >
            {stats.new}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            New Records
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#f59e0b",
            }}
          >
            {stats.modified}
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            Modified Records
          </div>
        </div>

        <div style={{ textAlign: "center" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "#3b82f6",
            }}
          >
            {((filteredData.length / stats.total) * 100).toFixed(1)}%
          </div>
          <div
            style={{
              fontSize: "12px",
              color: "#64748b",
              marginTop: "4px",
            }}
          >
            Data Visible
          </div>
        </div>
      </div>
    </div>
  );
}
