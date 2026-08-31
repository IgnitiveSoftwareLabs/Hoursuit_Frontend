import React, { useState } from "react";
import { Add as AddIcon, Clear as ClearIcon, Delete as DeleteIcon, Edit as EditIcon, Check as CheckIcon } from "@mui/icons-material";
import toast from "react-hot-toast";

export interface SublistColumn {
  key: string;
  label: string;
  type?: "text" | "number" | "select" | "checkbox";
  options?: { label: string; value: string | number }[];
  placeholder?: string;
  required?: boolean;
  width?: string;
}

export interface SublistTableProps {
  columns: SublistColumn[];
  data: Record<string, any>[];
  onAddRow?: (newRow: Record<string, any>) => void;
  onUpdateRow?: (index: number, updatedRow: Record<string, any>) => void;
  onRemoveRow?: (index: number) => void;
  onDraftChange?: (draft: Record<string, any>) => void;
  emptyRowState?: Record<string, any>;
  title?: string;
}

export default function SublistTable({
  columns,
  data,
  onAddRow,
  onUpdateRow,
  onRemoveRow,
  onDraftChange,
  emptyRowState = {},
  title,
}: SublistTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [draftRow, setDraftRow] = useState<Record<string, any>>(emptyRowState);
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null);

  React.useEffect(() => {
    if (onDraftChange) {
      onDraftChange(draftRow);
    }
  }, [draftRow, onDraftChange]);

  const handleDraftChange = (key: string, value: any) => {
    setDraftRow((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveDraft = () => {
    const missingRequired = columns.find(
      (col) =>
        col.required &&
        (draftRow[col.key] === undefined ||
          draftRow[col.key] === null ||
          String(draftRow[col.key]).trim() === "")
    );

    if (missingRequired) {
      toast.error(`Please select/enter ${missingRequired.label} before adding line.`);
      return;
    }

    if (editingIndex !== null) {
      if (onUpdateRow) onUpdateRow(editingIndex, draftRow);
      setEditingIndex(null);
    } else {
      if (onAddRow) onAddRow(draftRow);
    }
    setDraftRow(emptyRowState);
  };

  const handleCancelDraft = () => {
    setEditingIndex(null);
    setDraftRow(emptyRowState);
  };

  const handleEditRowClick = (index: number) => {
    setEditingIndex(index);
    setDraftRow({ ...data[index] });
  };

  const handleRemoveRowClick = (index: number) => {
    if (onRemoveRow) onRemoveRow(index);
    if (selectedRowIndex === index) setSelectedRowIndex(null);
    if (editingIndex === index) handleCancelDraft();
  };

  return (
    <div className="space-y-3 font-sans">
      {title && (
        <div className="text-xs font-bold text-[#244b5a] uppercase tracking-wider">
          {title}
        </div>
      )}

      {/* Inline Sublist Data Grid Table */}
      <div className="overflow-x-auto border border-slate-300 rounded-xs shadow-2xs">
        <table className="w-full text-left border-collapse text-xs">
          {/* Table Headers */}
          <thead>
            <tr className="bg-[#e5eff5] text-slate-800 border-b border-slate-300 font-semibold text-[11px] uppercase tracking-wider">
              <th className="w-10 px-2 py-1.5 border-r border-slate-300 text-center">
                #
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className="px-3 py-1.5 border-r border-slate-300 font-bold"
                >
                  {col.label} {col.required && <span className="text-red-500">*</span>}
                </th>
              ))}
              <th className="w-24 px-3 py-1.5 text-center font-bold">Actions</th>
            </tr>
          </thead>

          {/* Table Rows Body */}
          <tbody className="divide-y divide-slate-200 bg-white">
            {/* Active Data Rows */}
            {data.map((row, rIdx) => {
              const isEditing = editingIndex === rIdx;
              const isSelected = selectedRowIndex === rIdx;

              if (isEditing) {
                return (
                  <tr key={rIdx} className="bg-sky-50/80 border-b border-sky-200">
                    <td className="px-2 py-1 text-center font-bold text-sky-800 border-r border-slate-300">
                      {rIdx + 1}
                    </td>
                    {columns.map((col) => (
                      <td key={col.key} className="px-2 py-1 border-r border-slate-300">
                        {col.type === "select" ? (
                          <select
                            value={draftRow[col.key] || ""}
                            onChange={(e) => handleDraftChange(col.key, e.target.value)}
                            className="w-full h-7 text-xs bg-white border border-sky-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          >
                            <option value="">-- Select --</option>
                            {col.options?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : col.type === "checkbox" ? (
                          <input
                            type="checkbox"
                            checked={Boolean(draftRow[col.key])}
                            onChange={(e) => handleDraftChange(col.key, e.target.checked)}
                            className="h-4 w-4 text-sky-600 rounded border-slate-300"
                          />
                        ) : (
                          <input
                            type={col.type || "text"}
                            value={draftRow[col.key] ?? ""}
                            onChange={(e) => handleDraftChange(col.key, e.target.value)}
                            placeholder={col.placeholder}
                            className="w-full h-7 text-xs bg-white border border-sky-400 rounded px-2 py-0.5 focus:outline-none focus:ring-1 focus:ring-sky-500"
                          />
                        )}
                      </td>
                    ))}
                    <td className="px-2 py-1 text-center space-x-1">
                      <button
                        type="button"
                        onClick={handleSaveDraft}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold px-2 py-0.5 rounded shadow-2xs"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelDraft}
                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-[11px] px-2 py-0.5 rounded"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                );
              }

              return (
                <tr
                  key={rIdx}
                  onClick={() => setSelectedRowIndex(rIdx)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-sky-50 font-medium" : "hover:bg-slate-50"
                  }`}
                >
                  <td className="px-2 py-1 text-center text-slate-500 border-r border-slate-300 text-[11px]">
                    {rIdx + 1}
                  </td>
                  {columns.map((col) => {
                    let cellVal = row[col.key];
                    if (col.type === "select" && col.options) {
                      const found = col.options.find((o) => String(o.value) === String(cellVal));
                      if (found) cellVal = found.label;
                    }
                    if (col.type === "checkbox") {
                      cellVal = cellVal ? "Yes" : "No";
                    }

                    return (
                      <td
                        key={col.key}
                        className="px-3 py-1.5 border-r border-slate-300 text-slate-800 truncate max-w-xs"
                      >
                        {cellVal ?? "-"}
                      </td>
                    );
                  })}
                  <td className="px-2 py-1 text-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleEditRowClick(rIdx)}
                      className="text-sky-700 hover:text-sky-900 p-0.5 rounded hover:bg-sky-100"
                      title="Edit Row"
                    >
                      <EditIcon className="!w-3.5 !h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRowClick(rIdx)}
                      className="text-red-600 hover:text-red-800 p-0.5 rounded hover:bg-red-50"
                      title="Remove Row"
                    >
                      <DeleteIcon className="!w-3.5 !h-3.5" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {/* Empty Input Row for Inline Entry */}
            {editingIndex === null && (
              <tr className="bg-slate-50/80 border-t border-slate-300">
                <td className="px-2 py-1 text-center font-semibold text-slate-400 border-r border-slate-300 text-[11px]">
                  +
                </td>
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1 border-r border-slate-300">
                    {col.type === "select" ? (
                      <select
                        value={draftRow[col.key] || ""}
                        onChange={(e) => handleDraftChange(col.key, e.target.value)}
                        className="w-full h-7 text-xs bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-none focus:border-sky-500"
                      >
                        <option value="">-- Select {col.label} --</option>
                        {col.options?.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    ) : col.type === "checkbox" ? (
                      <input
                        type="checkbox"
                        checked={Boolean(draftRow[col.key])}
                        onChange={(e) => handleDraftChange(col.key, e.target.checked)}
                        className="h-4 w-4 text-sky-600 rounded border-slate-300"
                      />
                    ) : (
                      <input
                        type={col.type || "text"}
                        value={draftRow[col.key] ?? ""}
                        onChange={(e) => handleDraftChange(col.key, e.target.value)}
                        placeholder={col.placeholder || `Enter ${col.label}...`}
                        className="w-full h-7 text-xs bg-white border border-slate-300 rounded px-2 py-0.5 focus:outline-none focus:border-sky-500"
                      />
                    )}
                  </td>
                ))}
                <td className="px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    className="bg-[#0070d2] hover:bg-blue-700 text-white text-[11px] font-semibold px-2.5 py-0.5 rounded shadow-2xs flex items-center justify-center space-x-0.5 mx-auto"
                  >
                    <AddIcon className="!w-3 !h-3" />
                    <span>Add</span>
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {data.length === 0 && (
          <div className="py-4 text-center text-slate-400 italic text-xs bg-white">
            No rows added yet. Fill in the row inputs above and click "Add".
          </div>
        )}
      </div>

      {/* Sublist Control Actions Bar */}
      <div className="flex items-center space-x-2 pt-1">
        <button
          type="button"
          onClick={handleSaveDraft}
          className="bg-[#0070d2] hover:bg-blue-700 text-white text-xs font-semibold px-3 py-1 rounded-xs border border-blue-800 shadow-2xs flex items-center space-x-1 transition-colors"
        >
          <AddIcon className="!w-3.5 !h-3.5" />
          <span>Add Line</span>
        </button>
        <button
          type="button"
          onClick={handleCancelDraft}
          className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1 rounded-xs border border-slate-300 shadow-2xs flex items-center space-x-1 transition-colors"
        >
          <ClearIcon className="!w-3.5 !h-3.5 text-slate-500" />
          <span>Cancel</span>
        </button>
        {selectedRowIndex !== null && (
          <button
            type="button"
            onClick={() => handleRemoveRowClick(selectedRowIndex)}
            className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700 text-xs font-medium px-3 py-1 rounded-xs border border-red-300 shadow-2xs flex items-center space-x-1 transition-colors"
          >
            <DeleteIcon className="!w-3.5 !h-3.5" />
            <span>Remove</span>
          </button>
        )}
      </div>
    </div>
  );
}
