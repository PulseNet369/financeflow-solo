import { useFinance } from '@/contexts/FinanceContext';
import { StatCard } from '@/components/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, CreditCard, DollarSign } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data } = useFinance();

  const totalAssets = data.assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = data.liabilities.reduce((sum, liability) => sum + liability.value, 0);
  const totalCreditLimit = data.creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalCreditDebt = data.creditCards.reduce((sum, card) => sum + card.outstandingDebt, 0);
  const availableCredit = totalCreditLimit - totalCreditDebt;
  
  const netWorth = data.settings.includeCreditInNetWorth 
    ? totalAssets - totalLiabilities + availableCredit
    : totalAssets - totalLiabilities;

  const monthlyIncome = data.transactions
    .filter(t => t.type === 'income' && t.recurring)
    .reduce((sum, t) => sum + t.amount, 0);
  
  const monthlyExpenses = data.transactions
    .filter(t => t.type === 'expense' && t.recurring)
    .reduce((sum, t) => sum + t.amount, 0);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.settings.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const assetsByCategory = data.assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + asset.value;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(assetsByCategory).map(([name, value]) => ({ name, value }));

  const cashFlowData = [
    { name: 'Income', value: monthlyIncome },
    { name: 'Expenses', value: monthlyExpenses },
    { name: 'Net', value: monthlyIncome - monthlyExpenses },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">Overview of your financial position</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Net Worth"
          value={formatCurrency(netWorth)}
          icon={<Wallet className="h-5 w-5" />}
          variant={netWorth >= 0 ? 'success' : 'destructive'}
        />
        <StatCard
          title="Total Assets"
          value={formatCurrency(totalAssets)}
          icon={<TrendingUp className="h-5 w-5" />}
          variant="success"
        />
        <StatCard
          title="Total Liabilities"
          value={formatCurrency(totalLiabilities)}
          icon={<TrendingDown className="h-5 w-5" />}
          variant="destructive"
        />
        <StatCard
          title="Available Credit"
          value={formatCurrency(availableCredit)}
          icon={<CreditCard className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No assets yet. Add some to see the breakdown.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyIncome > 0 || monthlyExpenses > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No recurring transactions yet. Add some to see your cash flow.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-success" />
              Monthly Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">{formatCurrency(monthlyIncome)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              From {data.transactions.filter(t => t.type === 'income' && t.recurring).length} recurring source(s)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-destructive" />
              Monthly Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-destructive">{formatCurrency(monthlyExpenses)}</div>
            <p className="text-sm text-muted-foreground mt-2">
              From {data.transactions.filter(t => t.type === 'expense' && t.recurring).length} recurring expense(s)
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
