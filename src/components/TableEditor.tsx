import { useState, useEffect } from 'react';
import { Edit2, Check, X, Download, Send, Plus, Trash2 } from 'lucide-react';
import Papa from 'papaparse';

interface TableEditorProps {
  initialHeaders: string[];
  initialRows: string[][];
  onSendToAI?: (markdown: string) => void;
  onClose?: () => void;
}

export function TableEditor({ initialHeaders, initialRows, onSendToAI, onClose }: TableEditorProps) {
  const [headers, setHeaders] = useState<string[]>(initialHeaders);
  const [rows, setRows] = useState<string[][]>(initialRows);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    setHeaders(initialHeaders);
    setRows(initialRows);
    setHasChanges(false);
  }, [initialHeaders, initialRows]);

  const handleCellEdit = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex] = [...newRows[rowIndex]];
    newRows[rowIndex][colIndex] = value;
    setRows(newRows);
    setHasChanges(true);
  };

  const handleHeaderEdit = (colIndex: number, value: string) => {
    const newHeaders = [...headers];
    newHeaders[colIndex] = value;
    setHeaders(newHeaders);
    setHasChanges(true);
  };

  const startEdit = (row: number, col: number, currentValue: string) => {
    setEditingCell({ row, col });
    setEditValue(currentValue);
  };

  const saveEdit = () => {
    if (editingCell) {
      if (editingCell.row === -1) {
        handleHeaderEdit(editingCell.col, editValue);
      } else {
        handleCellEdit(editingCell.row, editingCell.col, editValue);
      }
    }
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
  };

  const addRow = () => {
    const newRow = headers.map(() => '');
    setRows([...rows, newRow]);
    setHasChanges(true);
  };

  const deleteRow = (rowIndex: number) => {
    if (window.confirm('Delete this row?')) {
      const newRows = rows.filter((_, i) => i !== rowIndex);
      setRows(newRows);
      setHasChanges(true);
    }
  };

  const addColumn = () => {
    const newHeader = `Column ${headers.length + 1}`;
    setHeaders([...headers, newHeader]);
    setRows(rows.map(row => [...row, '']));
    setHasChanges(true);
  };

  const deleteColumn = (colIndex: number) => {
    if (window.confirm('Delete this column?')) {
      setHeaders(headers.filter((_, i) => i !== colIndex));
      setRows(rows.map(row => row.filter((_, i) => i !== colIndex)));
      setHasChanges(true);
    }
  };

  const convertToMarkdown = (): string => {
    const headerRow = '| ' + headers.join(' | ') + ' |';
    const separatorRow = '| ' + headers.map(() => '---').join(' | ') + ' |';
    const dataRows = rows.map(row => {
      const paddedRow = [...row];
      while (paddedRow.length < headers.length) {
        paddedRow.push('');
      }
      return '| ' + paddedRow.slice(0, headers.length).join(' | ') + ' |';
    });
    return [headerRow, separatorRow, ...dataRows].join('\n');
  };

  const handleSendToAI = () => {
    if (onSendToAI) {
      const markdown = convertToMarkdown();
      onSendToAI(`📊 **Edited Table Data** (${rows.length} rows × ${headers.length} columns)\n\n${markdown}`);
    }
  };

  const handleExportCSV = () => {
    const csv = Papa.unparse({
      fields: headers,
      data: rows,
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `table_${Date.now()}.csv`;
    link.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4 max-h-[80vh] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
            <Edit2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
              Table Editor
            </h3>
            <p className="text-sm text-slate-600">
              {rows.length} rows × {headers.length} columns
              {hasChanges && <span className="text-orange-600 ml-2">• Modified</span>}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Close editor"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={addRow}
          className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Row
        </button>
        <button
          onClick={addColumn}
          className="px-3 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Column
        </button>
        <button
          onClick={handleExportCSV}
          className="px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
        {onSendToAI && (
          <button
            onClick={handleSendToAI}
            className="px-3 py-2 bg-gradient-to-r from-slate-600 to-blue-600 hover:from-slate-700 hover:to-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send to AI
          </button>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-gradient-to-r from-slate-100 to-blue-50 sticky top-0">
            <tr>
              <th className="w-12 px-2 py-2 text-center text-xs font-medium text-slate-500">#</th>
              {headers.map((header, colIndex) => (
                <th key={colIndex} className="px-4 py-3 text-left font-bold text-slate-800 relative group">
                  {editingCell?.row === -1 && editingCell?.col === colIndex ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <button onClick={saveEdit} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                        <Check className="w-3 h-3" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-2">
                      <span>{header}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => startEdit(-1, colIndex, header)}
                          className="p-1 hover:bg-blue-100 rounded"
                          title="Edit header"
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                        </button>
                        <button
                          onClick={() => deleteColumn(colIndex)}
                          className="p-1 hover:bg-red-100 rounded"
                          title="Delete column"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th className="w-12"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-slate-200">
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-slate-50 group">
                <td className="px-2 py-2 text-center text-xs text-slate-500 font-medium">{rowIndex + 1}</td>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="px-4 py-3 text-slate-700">
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          className="flex-1 px-2 py-1 border border-blue-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button onClick={saveEdit} className="p-1 bg-green-500 text-white rounded hover:bg-green-600">
                          <Check className="w-3 h-3" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 bg-red-500 text-white rounded hover:bg-red-600">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => startEdit(rowIndex, colIndex, cell)}
                        className="cursor-pointer hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                        title="Click to edit"
                      >
                        {cell || <span className="text-slate-400 italic">empty</span>}
                      </div>
                    )}
                  </td>
                ))}
                <td className="px-2 py-2">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-red-100 rounded transition-opacity"
                    title="Delete row"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
        💡 <strong>Tip:</strong> Click any cell to edit. Press Enter to save, Escape to cancel.
        {hasChanges && <span className="text-orange-600 ml-2">You have unsaved changes.</span>}
      </div>
    </div>
  );
}
