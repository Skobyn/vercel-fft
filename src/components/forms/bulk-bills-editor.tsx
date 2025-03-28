"use client";

import { useState, useRef, ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectGroup, SelectItem } from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2, Download, Upload, PlusCircle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { exportToCSV, parseCSV, normalizeAmount, matchCategory, normalizeFrequency } from "@/utils/financial-utils";
import { EXPENSE_CATEGORIES, BILL_CATEGORIES } from "@/types/financial";
import { toast } from "sonner";

// Expense categories
const CATEGORIES = EXPENSE_CATEGORIES.map(category => ({
  id: category.toLowerCase().replace(/\s+/g, '-'),
  name: category,
}));

// Frequency options
const FREQUENCY_OPTIONS = [
  { id: "once", name: "Once" },
  { id: "weekly", name: "Weekly" },
  { id: "biweekly", name: "Bi-weekly" },
  { id: "monthly", name: "Monthly" },
  { id: "quarterly", name: "Quarterly" },
  { id: "annually", name: "Annually" },
];

// Structure for each row of data
interface BulkRowData {
  id?: string;
  name: string;
  amount: string;
  category: string;
  frequency: string;
  dueDate?: string; // For bills
  endDate?: string; // For recurring bills
  date?: string; // For expenses
  isRecurring?: boolean;
  autoPay?: boolean;
  isPaid?: boolean;
  isPlanned?: boolean;
  notes?: string;
}

// Props for the bulk editor component
interface BulkBillsEditorProps {
  type: "bills" | "expenses";
  onSave: (items: any[]) => void;
  onCancel: () => void;
  existingItems?: any[];
}

export function BulkBillsEditor({ type, onSave, onCancel, existingItems = [] }: BulkBillsEditorProps) {
  // State for rows of data
  const [rows, setRows] = useState<BulkRowData[]>([
    createEmptyRow()
  ]);
  
  // Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Create an empty row based on type
  function createEmptyRow(): BulkRowData {
    if (type === "bills") {
      return {
        name: "",
        amount: "",
        category: "housing",
        frequency: "monthly",
        dueDate: format(new Date(), "yyyy-MM-dd"),
        endDate: "",
        isRecurring: true,
        autoPay: false,
        isPaid: false,
        notes: ""
      };
    } else {
      return {
        name: "",
        amount: "",
        category: "housing",
        frequency: "once",
        date: format(new Date(), "yyyy-MM-dd"),
        isPlanned: true,
        notes: ""
      };
    }
  }
  
  // Add a new row
  const addRow = () => {
    setRows([...rows, createEmptyRow()]);
  };
  
  // Remove a row
  const removeRow = (index: number) => {
    if (rows.length > 1) {
      const newRows = [...rows];
      newRows.splice(index, 1);
      setRows(newRows);
    } else {
      toast.error("You must have at least one row");
    }
  };
  
  // Update a cell value
  const updateCell = (index: number, field: keyof BulkRowData, value: any) => {
    const newRows = [...rows];
    newRows[index] = { ...newRows[index], [field]: value };
    
    // Handle special cases
    if (field === "frequency" && type === "bills") {
      newRows[index].isRecurring = value !== "once";
    }
    
    setRows(newRows);
  };
  
  // Validate all rows and convert to proper format
  const validateAndFormatRows = (): any[] | false => {
    const formattedRows = [];
    let hasErrors = false;
    
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      
      // Check required fields
      if (!row.name.trim()) {
        toast.error(`Row ${i + 1}: Name is required`);
        hasErrors = true;
        continue;
      }
      
      // Validate amount is a number
      const amount = parseFloat(row.amount);
      if (isNaN(amount) || amount <= 0) {
        toast.error(`Row ${i + 1}: Amount must be a positive number`);
        hasErrors = true;
        continue;
      }
      
      // Validate end date is after due date for recurring bills
      if (type === "bills" && row.frequency !== "once" && row.endDate) {
        const dueDate = new Date(row.dueDate!);
        const endDate = new Date(row.endDate);
        if (endDate <= dueDate) {
          toast.error(`Row ${i + 1}: End date must be after due date`);
          hasErrors = true;
          continue;
        }
      }
      
      // Format the row based on type
      const formattedRow: any = {
        name: row.name.trim(),
        amount,
        category: row.category,
        notes: row.notes || ""
      };
      
      if (type === "bills") {
        formattedRow.dueDate = row.dueDate;
        formattedRow.frequency = row.frequency;
        formattedRow.isRecurring = row.frequency !== "once";
        formattedRow.autoPay = Boolean(row.autoPay);
        formattedRow.isPaid = Boolean(row.isPaid);
        if (row.frequency !== "once" && row.endDate) {
          formattedRow.endDate = row.endDate;
        }
        
        // Keep ID if it exists
        if (row.id) {
          formattedRow.id = row.id;
        }
      } else {
        formattedRow.date = row.date;
        formattedRow.isPlanned = true;
        
        // Keep ID if it exists
        if (row.id) {
          formattedRow.id = row.id;
        }
      }
      
      formattedRows.push(formattedRow);
    }
    
    return hasErrors ? false : formattedRows;
  };
  
  // Handle save button
  const handleSave = () => {
    const formattedRows = validateAndFormatRows();
    if (formattedRows) {
      onSave(formattedRows);
    }
  };
  
  // Export to CSV
  const handleExport = () => {
    const formattedRows = rows.map(row => {
      // Format dates
      if (type === "bills" && row.dueDate) {
        return { ...row, dueDate: format(new Date(row.dueDate), "yyyy-MM-dd") };
      } else if (type === "expenses" && row.date) {
        return { ...row, date: format(new Date(row.date), "yyyy-MM-dd") };
      }
      return row;
    });
    
    exportToCSV(formattedRows, `${type}-export-${format(new Date(), "yyyy-MM-dd")}.csv`);
  };
  
  // Import from CSV
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Process imported CSV file
  const handleFileImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        try {
          const csvData = parseCSV(evt.target.result as string);
          
          // Validate the imported data
          if (csvData.length === 0) {
            toast.error("The CSV file is empty");
            return;
          }
          
          // Ensure required fields are present
          const requiredFields = ["name", "amount", "category"];
          if (type === "bills") {
            requiredFields.push("dueDate", "frequency");
          } else {
            requiredFields.push("date");
          }
          
          const firstRow = csvData[0];
          const missingFields = requiredFields.filter(field => !(field in firstRow));
          
          if (missingFields.length > 0) {
            toast.error(`Missing required fields: ${missingFields.join(", ")}`);
            return;
          }
          
          // Get valid categories based on type
          const validCategories = type === "bills" ? BILL_CATEGORIES : EXPENSE_CATEGORIES;
          
          // Process and normalize the imported data
          const normalizedData = csvData.map(row => {
            // Normalize amount (handle currency symbols, commas, etc.)
            const normalizedAmount = normalizeAmount(row.amount);
            
            // Match category to valid categories
            const normalizedCategory = matchCategory(row.category, validCategories);
            
            // Normalize frequency (handle case variations)
            const normalizedFrequency = normalizeFrequency(row.frequency);
            
            // Convert string boolean values to actual booleans
            const autoPay = typeof row.autoPay === 'string' 
              ? row.autoPay.toLowerCase() === 'true' || row.autoPay.toLowerCase() === 'yes'
              : Boolean(row.autoPay);
              
            const isPaid = typeof row.isPaid === 'string'
              ? row.isPaid.toLowerCase() === 'true' || row.isPaid.toLowerCase() === 'yes'
              : Boolean(row.isPaid);
            
            // Create normalized row with default empty values for missing fields
            return {
              ...createEmptyRow(),
              ...row,
              amount: isNaN(normalizedAmount) ? "" : normalizedAmount.toString(),
              category: normalizedCategory.toLowerCase().replace(/\s+/g, '-'),
              frequency: normalizedFrequency,
              autoPay,
              isPaid,
              // Ensure date formats are valid or default to today
              dueDate: type === "bills" && row.dueDate ? 
                // Fix for date import - ensure we preserve the exact date without timezone adjustment
                new Date(new Date(row.dueDate).getTime() + (new Date(row.dueDate).getTimezoneOffset() * 60000))
                  .toISOString().split('T')[0] 
                : format(new Date(), "yyyy-MM-dd"),
              date: type === "expenses" && row.date ? 
                // Apply same fix for expense dates
                new Date(new Date(row.date).getTime() + (new Date(row.date).getTimezoneOffset() * 60000))
                  .toISOString().split('T')[0]
                : format(new Date(), "yyyy-MM-dd"),
            };
          });
          
          // Set the normalized data as rows
          setRows(normalizedData);
          
          toast.success(`Imported ${normalizedData.length} ${type}`);
        } catch (error) {
          console.error("Error parsing CSV:", error);
          toast.error("Failed to parse CSV file. Please check the format.");
        }
      }
    };
    reader.readAsText(file);
    
    // Reset the file input
    e.target.value = "";
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Bulk {type === "bills" ? "Bills" : "Expenses"} Editor</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={handleImportClick}>
            <Upload className="h-4 w-4 mr-2" />
            Import CSV
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept=".csv"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>
      
      <div className="relative overflow-x-auto border rounded-md">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
            <tr>
              <th className="px-4 py-3 w-[200px]">Name</th>
              <th className="px-4 py-3 w-[120px]">Amount</th>
              <th className="px-4 py-3 w-[150px]">Category</th>
              <th className="px-4 py-3 w-[150px]">
                {type === "bills" ? "Due Date" : "Date"}
              </th>
              <th className="px-4 py-3 w-[150px]">Frequency</th>
              {type === "bills" && (
                <>
                  <th className="px-4 py-3 w-[150px]">End Date</th>
                  <th className="px-4 py-3 w-[100px]">Auto Pay</th>
                  <th className="px-4 py-3 w-[100px]">Paid</th>
                </>
              )}
              <th className="px-4 py-3 w-[200px]">Notes</th>
              <th className="px-4 py-3 w-[80px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr 
                key={index} 
                className="bg-white border-b dark:bg-gray-800 dark:border-gray-700"
              >
                {/* Name */}
                <td className="px-4 py-2">
                  <Input
                    value={row.name}
                    onChange={(e) => updateCell(index, "name", e.target.value)}
                    placeholder="Name"
                  />
                </td>
                
                {/* Amount */}
                <td className="px-4 py-2">
                  <Input
                    value={row.amount}
                    onChange={(e) => updateCell(index, "amount", e.target.value)}
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </td>
                
                {/* Category */}
                <td className="px-4 py-2">
                  <Select
                    value={row.category}
                    onValueChange={(value) => updateCell(index, "category", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {CATEGORIES.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </td>
                
                {/* Due Date / Date */}
                <td className="px-4 py-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {type === "bills" && row.dueDate
                          ? format(new Date(row.dueDate), "PPP")
                          : type === "expenses" && row.date
                          ? format(new Date(row.date), "PPP")
                          : "Select date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={
                          type === "bills" && row.dueDate
                            ? new Date(row.dueDate)
                            : type === "expenses" && row.date
                            ? new Date(row.date)
                            : undefined
                        }
                        onSelect={(date) => {
                          if (date) {
                            // Ensure we're using the local date without timezone offset
                            const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                            if (type === "bills") {
                              updateCell(index, "dueDate", localDate.toISOString().split('T')[0]);
                            } else {
                              updateCell(index, "date", localDate.toISOString().split('T')[0]);
                            }
                          }
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </td>
                
                {/* Frequency */}
                <td className="px-4 py-2">
                  <Select
                    value={row.frequency}
                    onValueChange={(value) => updateCell(index, "frequency", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {FREQUENCY_OPTIONS.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </td>
                
                {/* End Date (Bills only and when recurring) */}
                {type === "bills" && row.frequency !== "once" && (
                  <td className="px-4 py-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {row.endDate ? (
                            format(new Date(row.endDate), "PPP")
                          ) : (
                            <span>No end date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={row.endDate ? new Date(row.endDate) : undefined}
                          onSelect={(date) => {
                            if (date) {
                              // Ensure we're using the local date without timezone offset
                              const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
                              updateCell(index, "endDate", localDate.toISOString().split('T')[0]);
                            }
                          }}
                          disabled={(date) =>
                            date <= new Date(row.dueDate!) // Can't be before or equal to due date
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </td>
                )}
                
                {/* Auto Pay (Bills only) */}
                {type === "bills" && (
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={row.autoPay}
                        onChange={(e) => updateCell(index, "autoPay", e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </td>
                )}
                
                {/* Paid (Bills only) */}
                {type === "bills" && (
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        checked={row.isPaid}
                        onChange={(e) => updateCell(index, "isPaid", e.target.checked)}
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  </td>
                )}
                
                {/* Notes */}
                <td className="px-4 py-2">
                  <Input
                    value={row.notes || ""}
                    onChange={(e) => updateCell(index, "notes", e.target.value)}
                    placeholder="Notes (optional)"
                  />
                </td>
                
                {/* Actions */}
                <td className="px-4 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeRow(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={addRow}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Row
        </Button>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save All</Button>
        </div>
      </div>
    </div>
  );
} 