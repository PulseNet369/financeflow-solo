import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { CheckCircle2, Clock, TrendingUp, TrendingDown, Edit, X } from 'lucide-react';
import { Transaction, ASSET_CATEGORIES, LIABILITY_CATEGORIES } from '@/types/finance';

export default function DueTransactions() {
  const { data, updateTransaction, updateAsset, updateLiability, updateCreditCard, deleteTransaction } = useFinance();
  const [confirmDialog, setConfirmDialog] = useState<Transaction | null>(null);
  const [confirmedAmount, setConfirmedAmount] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedAccountType, setSelectedAccountType] = useState<'asset' | 'liability' | 'creditCard' | ''>('');

  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const dueTransactions = data.transactions.filter(t => {
    if (!t.recurring || !t.dayOfMonth) return false;
    
    const lastConfirmed = t.lastConfirmedDate ? new Date(t.lastConfirmedDate) : null;
    
    // Check if already confirmed this month
    if (lastConfirmed && 
        lastConfirmed.getMonth() === currentMonth && 
        lastConfirmed.getFullYear() === currentYear) {
      return false;
    }
    
    // Calculate days until due
    const dueDate = new Date(currentYear, currentMonth, t.dayOfMonth);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Only show if within 7 days before or on/after the due date
    return daysUntilDue <= 7 && daysUntilDue >= -30;
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency,
    }).format(value);
  };

  const getAccountName = (id?: string) => {
    if (!id) return null;
    const asset = data.assets.find(a => a.id === id);
    const liability = data.liabilities.find(l => l.id === id);
    const creditCard = data.creditCards.find(c => c.id === id);
    return asset?.name || liability?.name || creditCard?.name || null;
  };

  const getDaysUntilDue = (dayOfMonth: number) => {
    const dueDate = new Date(currentYear, currentMonth, dayOfMonth);
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue < 0) return 'Overdue';
    if (daysUntilDue === 0) return 'Due today';
    if (daysUntilDue === 1) return 'Due tomorrow';
    return `Due in ${daysUntilDue} days`;
  };

  const handleQuickConfirm = (transaction: Transaction) => {
    const amount = transaction.amount;
    updateTransaction(transaction.id, {
      status: 'confirmed',
      lastConfirmedDate: new Date().toISOString(),
      lastConfirmedAmount: amount,
    });

    // Update linked account
    if (transaction.accountId && transaction.accountType) {
      updateAccountValue(transaction, amount);
    }
  };

  const handleAmend = (transaction: Transaction) => {
    setConfirmDialog(transaction);
    setConfirmedAmount(transaction.amount.toString());
    setSelectedAccountId(transaction.accountId || 'none');
    setSelectedAccountType(transaction.accountType || '');
  };

  const handleCancel = (transaction: Transaction) => {
    deleteTransaction(transaction.id);
  };

  const allAccounts = [
    ...data.assets.map(a => ({ id: a.id, name: a.name, type: 'asset' as const, category: a.category })),
    ...data.liabilities.map(l => ({ id: l.id, name: l.name, type: 'liability' as const, category: l.category })),
    ...data.creditCards.map(c => ({ id: c.id, name: c.name, type: 'creditCard' as const, category: 'Credit Card' })),
  ];

  const updateAccountValue = (transaction: Transaction, amount: number) => {
    if (!transaction.accountId || !transaction.accountType) return;

    if (transaction.accountType === 'asset') {
      const asset = data.assets.find(a => a.id === transaction.accountId);
      if (asset) {
        const newValue = transaction.type === 'income' 
          ? asset.value + amount 
          : asset.value - amount;
        updateAsset(asset.id, { value: newValue });
      }
    } else if (transaction.accountType === 'liability') {
      const liability = data.liabilities.find(l => l.id === transaction.accountId);
      if (liability) {
        const newValue = transaction.type === 'expense'
          ? liability.value + amount
          : liability.value - amount;
        updateLiability(liability.id, { value: newValue });
      }
    } else if (transaction.accountType === 'creditCard') {
      const creditCard = data.creditCards.find(c => c.id === transaction.accountId);
      if (creditCard) {
        const newDebt = transaction.type === 'expense'
          ? creditCard.outstandingDebt + amount
          : creditCard.outstandingDebt - amount;
        updateCreditCard(creditCard.id, { outstandingDebt: Math.max(0, newDebt) });
      }
    }
  };

  const submitConfirmation = () => {
    if (!confirmDialog) return;

    const amount = parseFloat(confirmedAmount);
    const accountId = selectedAccountId && selectedAccountId !== 'none' ? selectedAccountId : undefined;
    
    updateTransaction(confirmDialog.id, {
      status: 'confirmed',
      lastConfirmedDate: new Date().toISOString(),
      lastConfirmedAmount: amount,
      accountId,
      accountType: selectedAccountType || undefined,
    });

    // Update linked account
    if (accountId && selectedAccountType) {
      const updatedTransaction = { 
        ...confirmDialog, 
        accountId, 
        accountType: selectedAccountType as 'asset' | 'liability' | 'creditCard'
      };
      updateAccountValue(updatedTransaction, amount);
    }

    setConfirmDialog(null);
    setConfirmedAmount('');
    setSelectedAccountId('');
    setSelectedAccountType('');
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Due Transactions</h1>
        <p className="text-sm text-muted-foreground">
          Confirm recurring transactions for {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>

      {dueTransactions.length > 0 ? (
        <div className="grid gap-3">
          {dueTransactions.map((transaction) => {
            const accountName = getAccountName(transaction.accountId);
            return (
              <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="h-5 w-5 text-success" />
                        ) : (
                          <TrendingDown className="h-5 w-5 text-destructive" />
                        )}
                        <h3 className="font-semibold text-lg">{transaction.name}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {getDaysUntilDue(transaction.dayOfMonth!)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">{transaction.category}</p>
                      {accountName && (
                        <p className="text-sm text-muted-foreground mb-2">
                          Account: <span className="font-medium">{accountName}</span>
                        </p>
                      )}
                      <p className={`text-2xl font-bold ${
                        transaction.type === 'income' ? 'text-success' : 'text-destructive'
                      }`}>
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Estimated amount</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={() => handleQuickConfirm(transaction)}
                        className="gap-2"
                        size="sm"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Confirm
                      </Button>
                      <Button
                        onClick={() => handleAmend(transaction)}
                        variant="outline"
                        className="gap-2"
                        size="sm"
                      >
                        <Edit className="h-4 w-4" />
                        Amend
                      </Button>
                      <Button
                        onClick={() => handleCancel(transaction)}
                        variant="destructive"
                        className="gap-2"
                        size="sm"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              All caught up!
            </p>
            <p className="text-sm text-muted-foreground">
              No transactions due for confirmation this month.
            </p>
          </CardContent>
        </Card>
      )}

      <Dialog open={!!confirmDialog} onOpenChange={(open) => !open && setConfirmDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Transaction</DialogTitle>
          </DialogHeader>
          {confirmDialog && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Transaction</p>
                <p className="font-semibold">{confirmDialog.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estimated Amount</p>
                <p className="text-lg font-bold">{formatCurrency(confirmDialog.amount)}</p>
              </div>
              <div>
                <Label htmlFor="confirmedAmount">Actual Amount</Label>
                <Input
                  id="confirmedAmount"
                  type="number"
                  step="0.01"
                  value={confirmedAmount}
                  onChange={(e) => setConfirmedAmount(e.target.value)}
                  placeholder="Enter actual amount"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account">Account</Label>
                <Select 
                  value={selectedAccountId} 
                  onValueChange={(value) => {
                    const account = allAccounts.find(a => a.id === value);
                    setSelectedAccountId(value);
                    setSelectedAccountType(account?.type || '');
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    <SelectItem value="none">No account</SelectItem>
                    {ASSET_CATEGORIES.map((category) => {
                      const categoryAccounts = allAccounts.filter(a => a.type === 'asset' && a.category === category);
                      if (categoryAccounts.length === 0) return null;
                      return (
                        <SelectGroup key={category}>
                          <SelectLabel>{category}</SelectLabel>
                          {categoryAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                    {LIABILITY_CATEGORIES.map((category) => {
                      const categoryAccounts = allAccounts.filter(a => a.type === 'liability' && a.category === category);
                      if (categoryAccounts.length === 0) return null;
                      return (
                        <SelectGroup key={category}>
                          <SelectLabel>{category}</SelectLabel>
                          {categoryAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>{account.name}</SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                    {data.creditCards.length > 0 && (
                      <SelectGroup>
                        <SelectLabel>Credit Cards</SelectLabel>
                        {data.creditCards.map((card) => (
                          <SelectItem key={card.id} value={card.id}>{card.name}</SelectItem>
                        ))}
                      </SelectGroup>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {selectedAccountId && selectedAccountId !== 'none' && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Account Update</p>
                  <p className="text-xs text-muted-foreground">
                    {allAccounts.find(a => a.id === selectedAccountId)?.name} will be {
                      confirmDialog?.type === 'income' ? 'increased' : 'decreased'
                    } by the confirmed amount.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <Button onClick={submitConfirmation} className="flex-1">
                  Confirm & Update
                </Button>
                <Button variant="outline" onClick={() => setConfirmDialog(null)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
