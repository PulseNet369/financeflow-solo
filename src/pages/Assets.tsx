import { useState } from 'react';
import { useFinance } from '@/contexts/FinanceContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Asset, ASSET_CATEGORIES, AssetCategory } from '@/types/finance';

export default function Assets() {
  const { data, addAsset, updateAsset, deleteAsset } = useFinance();
  const [isOpen, setIsOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    value: string;
    category: AssetCategory | '';
    description: string;
    createdAt: string;
  }>({
    name: '',
    value: '',
    category: '',
    description: '',
    createdAt: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.category) return;
    
    const assetData = {
      name: formData.name,
      value: parseFloat(formData.value),
      category: formData.category,
      description: formData.description,
      ...(formData.createdAt && { createdAt: new Date(formData.createdAt).toISOString() }),
    };

    if (editingAsset) {
      updateAsset(editingAsset.id, assetData);
    } else {
      addAsset(assetData);
    }
    setIsOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({ name: '', value: '', category: '', description: '', createdAt: new Date().toISOString().split('T')[0] });
    setEditingAsset(null);
  };

  const openEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      value: asset.value.toString(),
      category: asset.category,
      description: asset.description || '',
      createdAt: asset.createdAt.split('T')[0],
    });
    setIsOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency,
    }).format(value);
  };

  const totalValue = data.assets.reduce((sum, asset) => sum + asset.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Assets</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage your assets and investments</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2 w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              <span className="sm:inline">Add Asset</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add New Asset'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as AssetCategory })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSET_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="name">Asset Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="value">Value</Label>
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
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="createdAt">Date Added</Label>
                <Input
                  id="createdAt"
                  type="date"
                  value={formData.createdAt}
                  onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                {editingAsset ? 'Update' : 'Add'} Asset
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="bg-success/10 border-success/20">
        <CardHeader>
          <CardTitle className="text-success">Total Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-success">{formatCurrency(totalValue)}</div>
        </CardContent>
      </Card>

      {ASSET_CATEGORIES.map((category) => {
        const categoryAssets = data.assets.filter((a) => a.category === category);
        if (categoryAssets.length === 0) return null;
        
        const categoryTotal = categoryAssets.reduce((sum, a) => sum + a.value, 0);
        
        return (
          <div key={category} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">{category}</h2>
              <span className="text-sm font-medium text-success">{formatCurrency(categoryTotal)}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {categoryAssets.map((asset) => (
          <Card key={asset.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{asset.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">{asset.category}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(asset)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteAsset(asset.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-success">{formatCurrency(asset.value)}</div>
              {asset.description && (
                <p className="text-sm text-muted-foreground mt-2">{asset.description}</p>
              )}
            </CardContent>
              </Card>
              ))}
            </div>
          </div>
        );
      })}

      {data.assets.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No assets yet. Click "Add Asset" to get started!
          </CardContent>
        </Card>
      )}
    </div>
  );
}
