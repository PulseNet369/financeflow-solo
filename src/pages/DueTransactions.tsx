import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Transaction } from '@/types/finance';

export default function DueTransactions() {
  const { data, updateTransaction, updateAsset, updateLiability } = useFinance();
  const [confirmDialog, setConfirmDialog] = useState<Transaction | null>(null);
  const [confirmedAmount, setConfirmedAmount] = useState('');

  const today = new Date();
  const currentDay = today.getDate();

  const dueTransactions = data.transactions.filter(t => {
    if (!t.recurring || !t.dayOfMonth) return false;
    
    const lastConfirmed = t.lastConfirmedDate ? new Date(t.lastConfirmedDate) : null;
    const isThisMonth = !lastConfirmed || 
      (lastConfirmed.getMonth() !== today.getMonth() || 
       lastConfirmed.getFullYear() !== today.getFullYear());
    
    return t.dayOfMonth <= currentDay && isThisMonth;
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
    return asset?.name || liability?.name || null;
  };

  const handleConfirm = (transaction: Transaction) => {
    setConfirmDialog(transaction);
    setConfirmedAmount(transaction.amount.toString());
  };

  const submitConfirmation = () => {
    if (!confirmDialog) return;

    const amount = parseFloat(confirmedAmount);
    updateTransaction(confirmDialog.id, {
      status: 'confirmed',
      lastConfirmedDate: new Date().toISOString(),
      lastConfirmedAmount: amount,
    });

    // Update linked account
    if (confirmDialog.accountId && confirmDialog.accountType) {
      if (confirmDialog.accountType === 'asset') {
        const asset = data.assets.find(a => a.id === confirmDialog.accountId);
        if (asset) {
          const newValue = confirmDialog.type === 'income' 
            ? asset.value + amount 
            : asset.value - amount;
          updateAsset(asset.id, { value: newValue });
        }
      } else if (confirmDialog.accountType === 'liability') {
        const liability = data.liabilities.find(l => l.id === confirmDialog.accountId);
        if (liability) {
          const newValue = confirmDialog.type === 'expense'
            ? liability.value + amount
            : liability.value - amount;
          updateLiability(liability.id, { value: newValue });
        }
      }
    }

    setConfirmDialog(null);
    setConfirmedAmount('');
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
                          Day {transaction.dayOfMonth}
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
                    <Button
                      onClick={() => handleConfirm(transaction)}
                      className="gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" />
                      Confirm
                    </Button>
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
              {confirmDialog.accountId && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-1">Account Update</p>
                  <p className="text-xs text-muted-foreground">
                    {getAccountName(confirmDialog.accountId)} will be {
                      confirmDialog.type === 'income' ? 'increased' : 'decreased'
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
