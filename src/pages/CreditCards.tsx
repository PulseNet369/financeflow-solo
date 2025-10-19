import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Plus, Pencil, Trash2, CreditCard as CreditCardIcon } from 'lucide-react';
import { CreditCard } from '@/types/finance';

export default function CreditCards() {
  const { data, addCreditCard, updateCreditCard, deleteCreditCard } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    creditLimit: '',
    outstandingDebt: '',
    apr: '',
    paymentDay: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCard) {
      updateCreditCard(editingCard.id, {
        name: formData.name,
        creditLimit: parseFloat(formData.creditLimit),
        outstandingDebt: parseFloat(formData.outstandingDebt),
        apr: parseFloat(formData.apr),
        paymentDay: parseInt(formData.paymentDay),
      });
    } else {
      addCreditCard({
        name: formData.name,
        creditLimit: parseFloat(formData.creditLimit),
        outstandingDebt: parseFloat(formData.outstandingDebt),
        apr: parseFloat(formData.apr),
        paymentDay: parseInt(formData.paymentDay),
      });
    }
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', creditLimit: '', outstandingDebt: '', apr: '', paymentDay: '' });
    setEditingCard(null);
  };

  const openEdit = (card: CreditCard) => {
    setEditingCard(card);
    setFormData({
      name: card.name,
      creditLimit: card.creditLimit.toString(),
      outstandingDebt: card.outstandingDebt.toString(),
      apr: card.apr.toString(),
      paymentDay: card.paymentDay.toString(),
    });
    setIsOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency,
    }).format(value);
  };

  const totalCreditLimit = data.creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalDebt = data.creditCards.reduce((sum, card) => sum + card.outstandingDebt, 0);
  const totalAvailable = totalCreditLimit - totalDebt;
  const utilizationRate = totalCreditLimit > 0 ? (totalDebt / totalCreditLimit) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Credit Cards</h1>
          <p className="text-muted-foreground mt-1">Manage your credit cards and utilization</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Add Credit Card
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCard ? 'Edit Credit Card' : 'Add New Credit Card'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Card Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Chase Sapphire"
                  required
                />
              </div>
              <div>
                <Label htmlFor="creditLimit">Credit Limit</Label>
                <Input
                  id="creditLimit"
                  type="number"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="outstandingDebt">Outstanding Debt</Label>
                <Input
                  id="outstandingDebt"
                  type="number"
                  step="0.01"
                  value={formData.outstandingDebt}
                  onChange={(e) => setFormData({ ...formData, outstandingDebt: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="apr">APR (%)</Label>
                <Input
                  id="apr"
                  type="number"
                  step="0.01"
                  value={formData.apr}
                  onChange={(e) => setFormData({ ...formData, apr: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="paymentDay">Payment Day of Month</Label>
                <Input
                  id="paymentDay"
                  type="number"
                  min="1"
                  max="31"
                  value={formData.paymentDay}
                  onChange={(e) => setFormData({ ...formData, paymentDay: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingCard ? 'Update' : 'Add'} Credit Card
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Credit Limit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatCurrency(totalCreditLimit)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Outstanding Debt</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalDebt)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Available Credit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalAvailable)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Credit Utilization</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress value={utilizationRate} className="h-3" />
          <p className="text-sm text-muted-foreground">
            {utilizationRate.toFixed(1)}% of total credit used
            {utilizationRate < 30 && " - Excellent!"}
            {utilizationRate >= 30 && utilizationRate < 50 && " - Good"}
            {utilizationRate >= 50 && utilizationRate < 70 && " - Fair"}
            {utilizationRate >= 70 && " - Consider paying down"}
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {data.creditCards.map((card) => {
          const utilization = (card.outstandingDebt / card.creditLimit) * 100;
          const available = card.creditLimit - card.outstandingDebt;
          
          return (
            <Card key={card.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCardIcon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg">{card.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(card)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteCreditCard(card.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Credit Limit</p>
                  <p className="text-lg font-semibold">{formatCurrency(card.creditLimit)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding Debt</p>
                  <p className="text-lg font-semibold text-destructive">{formatCurrency(card.outstandingDebt)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-lg font-semibold text-success">{formatCurrency(available)}</p>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Utilization</span>
                    <span className="font-medium">{utilization.toFixed(1)}%</span>
                  </div>
                  <Progress value={utilization} className="h-2" />
                </div>
                <div className="pt-2 border-t border-border flex justify-between text-sm">
                  <span className="text-muted-foreground">APR: {card.apr}%</span>
                  <span className="text-muted-foreground">Due: Day {card.paymentDay}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data.creditCards.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No credit cards tracked. Click "Add Credit Card" to start managing your credit.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
