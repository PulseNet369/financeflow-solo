import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Download, Upload, Trash2, Sun, Moon } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const currencies = [
  { code: 'USD', name: 'US Dollar' },
  { code: 'EUR', name: 'Euro' },
  { code: 'GBP', name: 'British Pound' },
  { code: 'JPY', name: 'Japanese Yen' },
  { code: 'CAD', name: 'Canadian Dollar' },
  { code: 'AUD', name: 'Australian Dollar' },
  { code: 'CHF', name: 'Swiss Franc' },
  { code: 'CNY', name: 'Chinese Yuan' },
  { code: 'INR', name: 'Indian Rupee' },
];

export default function Settings() {
  const { data, updateSettings, exportData, importData, resetData } = useFinance();
  const [fileInputKey, setFileInputKey] = useState(Date.now());

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        importData(content);
        setFileInputKey(Date.now());
      };
      reader.readAsText(file);
    }
  };

  const handleReset = () => {
    resetData();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your preferences and data</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Currency</CardTitle>
          <CardDescription>Select your preferred currency for display</CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={data.settings.currency}
            onValueChange={(value) => updateSettings({ currency: value })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.code} - {currency.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose between light and dark mode</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {data.settings.theme === 'light' ? (
                <Sun className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Moon className="h-5 w-5 text-muted-foreground" />
              )}
              <Label htmlFor="theme-toggle">
                {data.settings.theme === 'light' ? 'Light Mode' : 'Dark Mode'}
              </Label>
            </div>
            <Switch
              id="theme-toggle"
              checked={data.settings.theme === 'dark'}
              onCheckedChange={(checked) => updateSettings({ theme: checked ? 'dark' : 'light' })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Net Worth Calculation</CardTitle>
          <CardDescription>
            Include available credit in your net worth calculation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="credit-toggle">Include Credit in Net Worth</Label>
            <Switch
              id="credit-toggle"
              checked={data.settings.includeCreditInNetWorth}
              onCheckedChange={(checked) => updateSettings({ includeCreditInNetWorth: checked })}
            />
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            When enabled, your available credit will be added to your net worth calculation
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Export, import, or reset your financial data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Button onClick={exportData} className="w-full gap-2">
              <Download className="h-4 w-4" />
              Export Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Download all your data as a JSON file for backup
            </p>
          </div>

          <div>
            <input
              key={fileInputKey}
              type="file"
              accept=".json"
              onChange={handleFileImport}
              className="hidden"
              id="import-file"
            />
            <Button
              onClick={() => document.getElementById('import-file')?.click()}
              variant="outline"
              className="w-full gap-2"
            >
              <Upload className="h-4 w-4" />
              Import Data
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Restore your data from a previously exported JSON file
            </p>
          </div>

          <div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="w-full gap-2">
                  <Trash2 className="h-4 w-4" />
                  Reset All Data
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete all your
                    assets, liabilities, credit cards, and transactions.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Reset Everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <p className="text-sm text-muted-foreground mt-2">
              Permanently delete all data and start fresh
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
