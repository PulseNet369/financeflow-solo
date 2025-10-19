import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Liability } from '@/types/finance';

export default function Liabilities() {
  const { data, addLiability, updateLiability, deleteLiability } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    value: '',
    category: '',
    interestRate: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLiability) {
      updateLiability(editingLiability.id, {
        ...formData,
        value: parseFloat(formData.value),
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      });
    } else {
      addLiability({
        ...formData,
        value: parseFloat(formData.value),
        interestRate: formData.interestRate ? parseFloat(formData.interestRate) : undefined,
      });
    }
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', value: '', category: '', interestRate: '', description: '' });
    setEditingLiability(null);
  };

  const openEdit = (liability: Liability) => {
    setEditingLiability(liability);
    setFormData({
      name: liability.name,
      value: liability.value.toString(),
      category: liability.category,
      interestRate: liability.interestRate?.toString() || '',
      description: liability.description || '',
    });
    setIsOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency,
    }).format(value);
  };

  const totalValue = data.liabilities.reduce((sum, liability) => sum + liability.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Liabilities</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Track your debts and obligations</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Add Liability</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLiability ? 'Edit Liability' : 'Add New Liability'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Liability Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="value">Amount</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Mortgage, Student Loan, Car Loan"
                  required
                />
              </div>
              <div>
                <Label htmlFor="interestRate">Interest Rate (%) (Optional)</Label>
                <Input
                  id="interestRate"
                  type="number"
                  step="0.01"
                  value={formData.interestRate}
                  onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingLiability ? 'Update' : 'Add'} Liability
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-destructive/10 border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Total Liabilities</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-destructive">{formatCurrency(totalValue)}</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.liabilities.map((liability) => (
          <Card key={liability.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{liability.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{liability.category}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(liability)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteLiability(liability.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{formatCurrency(liability.value)}</div>
              {liability.interestRate && (
                <p className="text-sm text-muted-foreground mt-1">
                  Interest: {liability.interestRate}% APR
                </p>
              )}
              {liability.description && (
                <p className="text-sm text-muted-foreground mt-2">{liability.description}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {data.liabilities.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No liabilities tracked. Click "Add Liability" to start tracking your debts.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
