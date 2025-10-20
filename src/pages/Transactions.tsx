import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types/finance';

export default function Transactions() {
  const { data, addTransaction, updateTransaction, deleteTransaction } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
    type: 'income' as 'income' | 'expense',
    category: '',
    recurring: false,
    accountId: '',
    accountType: '' as 'asset' | 'liability' | '',
    dayOfMonth: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const transactionData = {
      name: formData.name,
      amount: parseFloat(formData.amount),
      type: formData.type,
      category: formData.category,
      recurring: formData.recurring,
      status: 'estimated' as const,
      accountId: formData.accountId || undefined,
      accountType: formData.accountType || undefined,
      dayOfMonth: formData.dayOfMonth ? parseInt(formData.dayOfMonth) : undefined,
    };

    if (editingTransaction) {
      updateTransaction(editingTransaction.id, transactionData);
    } else {
      addTransaction(transactionData);
    }
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      amount: '', 
      type: 'income', 
      category: '', 
      recurring: false,
      accountId: '',
      accountType: '',
      dayOfMonth: '',
    });
    setEditingTransaction(null);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      name: transaction.name,
      amount: transaction.amount.toString(),
      type: transaction.type,
      category: transaction.category,
      recurring: transaction.recurring,
      accountId: transaction.accountId || '',
      accountType: transaction.accountType || '',
      dayOfMonth: transaction.dayOfMonth?.toString() || '',
    });
    setIsOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency,
    }).format(value);
  };

  const allAccounts = [
    ...data.assets.map(a => ({ id: a.id, name: a.name, type: 'asset' as const })),
    ...data.liabilities.map(l => ({ id: l.id, name: l.name, type: 'liability' as const })),
  ];

  const getAccountName = (id: string) => {
    const account = allAccounts.find(a => a.id === id);
    return account?.name || 'Unlinked';
  };

  const income = data.transactions.filter(t => t.type === 'income');
  const expenses = data.transactions.filter(t => t.type === 'expense');
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const confirmedIncome = income.filter(t => t.status === 'confirmed').reduce((sum, t) => sum + (t.lastConfirmedAmount || t.amount), 0);
  const confirmedExpenses = expenses.filter(t => t.status === 'confirmed').reduce((sum, t) => sum + (t.lastConfirmedAmount || t.amount), 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground">Track income and expenses</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Add Transaction
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Monthly Salary"
                  required
                />
              </div>
              <div>
                <Label htmlFor="amount">Amount (Estimated)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Salary, Rent, Groceries"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account">Link to Account (Optional)</Label>
                <Select 
                  value={formData.accountId} 
                  onValueChange={(value) => {
                    const account = allAccounts.find(a => a.id === value);
                    setFormData({ 
                      ...formData, 
                      accountId: value,
                      accountType: account?.type || ''
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No account</SelectItem>
                    {allAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="recurring">Recurring (Monthly)</Label>
                <Switch
                  id="recurring"
                  checked={formData.recurring}
                  onCheckedChange={(checked) => setFormData({ ...formData, recurring: checked })}
                />
              </div>
              {formData.recurring && (
                <div>
                  <Label htmlFor="dayOfMonth">Day of Month (1-31)</Label>
                  <Input
                    id="dayOfMonth"
                    type="number"
                    min="1"
                    max="31"
                    value={formData.dayOfMonth}
                    onChange={(e) => setFormData({ ...formData, dayOfMonth: e.target.value })}
                    placeholder="e.g., 1 for first of month"
                  />
                </div>
              )}
              <Button type="submit" className="w-full">
                {editingTransaction ? 'Update' : 'Add'} Transaction
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-success/10 border-success/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success">Estimated Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Estimated Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-success/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success">Confirmed Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(confirmedIncome)}</div>
          </CardContent>
        </Card>
        <Card className="bg-destructive/5 border-destructive/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Confirmed Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(confirmedExpenses)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-success">
            <TrendingUp className="h-5 w-5" />
            Income
          </h2>
          {income.length > 0 ? (
            income.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{transaction.name}</h3>
                        {transaction.recurring && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Day {transaction.dayOfMonth}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          transaction.status === 'confirmed' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{transaction.category}</p>
                      {transaction.accountId && (
                        <p className="text-xs text-muted-foreground">→ {getAccountName(transaction.accountId)}</p>
                      )}
                      <p className="text-lg font-bold text-success mt-1">{formatCurrency(transaction.amount)}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(transaction)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTransaction(transaction.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No income transactions yet.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-destructive">
            <TrendingDown className="h-5 w-5" />
            Expenses
          </h2>
          {expenses.length > 0 ? (
            expenses.map((transaction) => (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-sm">{transaction.name}</h3>
                        {transaction.recurring && (
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                            Day {transaction.dayOfMonth}
                          </span>
                        )}
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          transaction.status === 'confirmed' 
                            ? 'bg-success/10 text-success' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {transaction.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{transaction.category}</p>
                      {transaction.accountId && (
                        <p className="text-xs text-muted-foreground">→ {getAccountName(transaction.accountId)}</p>
                      )}
                      <p className="text-lg font-bold text-destructive mt-1">{formatCurrency(transaction.amount)}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(transaction)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteTransaction(transaction.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground text-sm">
                No expense transactions yet.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
