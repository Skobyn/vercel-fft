"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Camera,
  Upload,
  File,
  X,
  Check,
  Edit,
  Trash2,
  RefreshCw,
  Calendar,
  Tag
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type ReceiptData = {
  id: string;
  merchant: string;
  total: number;
  date: Date;
  category: string;
  items?: {
    description: string;
    amount: number;
  }[];
  imageUrl?: string;
  notes?: string;
  status: 'processing' | 'processed' | 'error' | 'manual';
};

export function ReceiptScanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [receipts, setReceipts] = useState<ReceiptData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentReceipt, setCurrentReceipt] = useState<ReceiptData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock categories that would come from the budget categories in a real app
  const categories = [
    { value: "groceries", label: "Groceries" },
    { value: "dining", label: "Dining Out" },
    { value: "transportation", label: "Transportation" },
    { value: "utilities", label: "Utilities" },
    { value: "entertainment", label: "Entertainment" },
    { value: "shopping", label: "Shopping" },
    { value: "healthcare", label: "Healthcare" },
    { value: "personal", label: "Personal Care" },
    { value: "travel", label: "Travel" },
    { value: "other", label: "Other" },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    const imageUrl = URL.createObjectURL(file);
    setPreviewUrl(imageUrl);

    // Reset the current receipt data
    setCurrentReceipt(null);
    setIsEditing(false);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const processReceipt = () => {
    if (!selectedFile) return;

    setIsProcessing(true);

    // This would be an API call in a real application
    // For demo purposes, simulate OCR processing
    setTimeout(() => {
      // Mock OCR result
      const newReceipt: ReceiptData = {
        id: `receipt-${Date.now()}`,
        merchant: "Grocery Store",
        total: 78.45,
        date: new Date(),
        category: "groceries",
        items: [
          { description: "Milk", amount: 4.99 },
          { description: "Bread", amount: 3.49 },
          { description: "Eggs", amount: 5.99 },
          { description: "Fruits", amount: 15.67 },
          { description: "Vegetables", amount: 12.45 },
          { description: "Snacks", amount: 8.99 },
          { description: "Meat", amount: 26.87 },
        ],
        imageUrl: previewUrl || undefined,
        status: 'processed'
      };

      setCurrentReceipt(newReceipt);
      setIsProcessing(false);
    }, 2000);
  };

  const handleManualEntry = () => {
    setCurrentReceipt({
      id: `receipt-${Date.now()}`,
      merchant: "",
      total: 0,
      date: new Date(),
      category: "other",
      imageUrl: previewUrl || undefined,
      status: 'manual'
    });
    setIsEditing(true);
  };

  const saveReceipt = () => {
    if (!currentReceipt) return;

    // Add receipt to the list
    setReceipts([currentReceipt, ...receipts]);

    // Reset state
    clearSelectedFile();
    setCurrentReceipt(null);
    setIsOpen(false);
  };

  const updateReceiptField = (field: keyof ReceiptData, value: any) => {
    if (!currentReceipt) return;

    setCurrentReceipt({
      ...currentReceipt,
      [field]: value
    });
  };

  const deleteReceipt = (id: string) => {
    setReceipts(receipts.filter(receipt => receipt.id !== id));
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="gap-2">
            <Camera className="h-4 w-4" />
            Scan Receipt
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Scan & Process Receipt</DialogTitle>
            <DialogDescription>
              Upload a receipt image to automatically extract transaction details
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-4">
            <div className="space-y-4">
              {!previewUrl ? (
                <div
                  className="border-2 border-dashed rounded-lg h-64 flex flex-col items-center justify-center cursor-pointer"
                  onClick={triggerFileInput}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload a receipt image</p>
                  <p className="text-xs text-muted-foreground">or drag and drop</p>
                  <Button variant="outline" size="sm" className="mt-4">
                    Select Image
                  </Button>
                </div>
              ) : (
                <div className="relative border rounded-lg overflow-hidden">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-full object-contain max-h-[400px]"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={clearSelectedFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {previewUrl && !currentReceipt && (
                <div className="flex gap-2">
                  <Button
                    className="flex-1"
                    onClick={processReceipt}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Camera className="h-4 w-4 mr-2" />
                        Process Receipt
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={handleManualEntry}>
                    <Edit className="h-4 w-4 mr-2" />
                    Manual Entry
                  </Button>
                </div>
              )}
            </div>

            <div>
              {currentReceipt && (
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="merchant">Merchant</Label>
                    <Input
                      id="merchant"
                      value={currentReceipt.merchant}
                      onChange={(e) => updateReceiptField('merchant', e.target.value)}
                      readOnly={!isEditing}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="total">Total Amount</Label>
                      <Input
                        id="total"
                        type="number"
                        step="0.01"
                        value={currentReceipt.total}
                        onChange={(e) => updateReceiptField('total', parseFloat(e.target.value))}
                        readOnly={!isEditing}
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !currentReceipt.date && "text-muted-foreground"
                            )}
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {currentReceipt.date ? format(currentReceipt.date, "PPP") : <span>Pick a date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={currentReceipt.date}
                            onSelect={(date) => date && updateReceiptField('date', date)}
                            disabled={!isEditing}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={currentReceipt.category}
                      onValueChange={(value) => updateReceiptField('category', value)}
                      disabled={!isEditing}
                    >
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.value} value={category.value}>
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {currentReceipt.items && currentReceipt.items.length > 0 && (
                    <div className="grid gap-2">
                      <Label>Items</Label>
                      <div className="border rounded-md max-h-40 overflow-y-auto">
                        <div className="p-2 divide-y divide-border">
                          {currentReceipt.items.map((item, index) => (
                            <div key={index} className="flex justify-between py-1">
                              <span className="text-sm">{item.description}</span>
                              <span className="text-sm font-medium">${item.amount.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Input
                      id="notes"
                      value={currentReceipt.notes || ''}
                      onChange={(e) => updateReceiptField('notes', e.target.value)}
                      placeholder="Add notes (optional)"
                    />
                  </div>

                  <div className="flex justify-between">
                    {!isEditing && (
                      <Button variant="outline" onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Details
                      </Button>
                    )}
                    <Button className="ml-auto" onClick={saveReceipt}>
                      <Check className="h-4 w-4 mr-2" />
                      Save Receipt
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {receipts.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-medium">Recent Receipts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {receipts.slice(0, 6).map((receipt) => (
              <Card key={receipt.id} className="overflow-hidden">
                <div className="h-36 overflow-hidden bg-muted relative">
                  {receipt.imageUrl ? (
                    <img
                      src={receipt.imageUrl}
                      alt={receipt.merchant}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <File className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <CardHeader className="p-3 pb-0">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-base truncate">{receipt.merchant}</CardTitle>
                    <span className="text-sm font-bold">${receipt.total.toFixed(2)}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pb-0">
                  <div className="flex items-center text-xs text-muted-foreground gap-2">
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      {format(new Date(receipt.date), "MMM d, yyyy")}
                    </div>
                    <div className="flex items-center">
                      <Tag className="h-3 w-3 mr-1" />
                      {categories.find(c => c.value === receipt.category)?.label || receipt.category}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-3 flex justify-end gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteReceipt(receipt.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {receipts.length > 6 && (
            <div className="flex justify-center">
              <Button variant="outline">View All Receipts</Button>
            </div>
          )}
        </div>
      )}
    </>
  );
}
