import { useFinance } from '@/contexts/FinanceContext';
import { StatCard } from '@/components/StatCard';
import { NetWorthChart } from '@/components/NetWorthChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, TrendingUp, TrendingDown, CreditCard } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { data } = useFinance();

  const totalAssets = data.assets.reduce((sum, asset) => sum + asset.value, 0);
  const totalLiabilities = data.liabilities.reduce((sum, liability) => sum + liability.value, 0);
  const totalCreditLimit = data.creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
  const totalCreditDebt = data.creditCards.reduce((sum, card) => sum + card.outstandingDebt, 0);
  const availableCredit = totalCreditLimit - totalCreditDebt;
  
  // Credit card debt always reduces net worth
  // Available credit only adds if setting is enabled
  const netWorth = data.settings.includeCreditInNetWorth 
    ? totalAssets + availableCredit - totalLiabilities - totalCreditDebt
    : totalAssets - totalLiabilities - totalCreditDebt;

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

  // Assets by category
  const assetsByCategory = data.assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + asset.value;
    return acc;
  }, {} as Record<string, number>);

  const assetsPieData = Object.entries(assetsByCategory).map(([name, value]) => ({ name, value }));

  // Net worth breakdown by category
  const netWorthDetailedBreakdown: { name: string; value: number; color: string }[] = [];

  // Add assets by category
  const assetsByCategoryForPie = data.assets.reduce((acc, asset) => {
    acc[asset.category] = (acc[asset.category] || 0) + asset.value;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(assetsByCategoryForPie).forEach(([category, value], index) => {
    if (value > 0) {
      netWorthDetailedBreakdown.push({
        name: category,
        value,
        color: COLORS[index % COLORS.length],
      });
    }
  });

  // Add liabilities by category (as negative for display purposes)
  const liabilitiesByCategoryForPie = data.liabilities.reduce((acc, liability) => {
    acc[liability.category] = (acc[liability.category] || 0) + liability.value;
    return acc;
  }, {} as Record<string, number>);

  let liabilityColorIndex = Object.keys(assetsByCategoryForPie).length;
  Object.entries(liabilitiesByCategoryForPie).forEach(([category, value]) => {
    if (value > 0) {
      netWorthDetailedBreakdown.push({
        name: `${category} (Debt)`,
        value,
        color: COLORS[liabilityColorIndex % COLORS.length],
      });
      liabilityColorIndex++;
    }
  });

  // Add credit card debt (always shown)
  if (totalCreditDebt > 0) {
    netWorthDetailedBreakdown.push({
      name: 'Credit Card Debt',
      value: totalCreditDebt,
      color: 'hsl(var(--destructive))',
    });
  }

  // Add available credit (only if setting is enabled)
  if (data.settings.includeCreditInNetWorth && availableCredit > 0) {
    netWorthDetailedBreakdown.push({
      name: 'Available Credit',
      value: availableCredit,
      color: 'hsl(var(--primary))',
    });
  }

  const today = new Date();
  const currentDay = today.getDate();
  const dueCount = data.transactions.filter(t => {
    if (!t.recurring || !t.dayOfMonth) return false;
    const lastConfirmed = t.lastConfirmedDate ? new Date(t.lastConfirmedDate) : null;
    const isThisMonth = !lastConfirmed || 
      (lastConfirmed.getMonth() !== today.getMonth() || 
       lastConfirmed.getFullYear() !== today.getFullYear());
    return t.dayOfMonth <= currentDay && isThisMonth;
  }).length;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Financial overview</p>
      </div>

      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Net Worth"
          value={formatCurrency(netWorth)}
          icon={<Wallet className="h-4 w-4" />}
          variant={netWorth >= 0 ? 'success' : 'destructive'}
        />
        <StatCard
          title="Assets"
          value={formatCurrency(totalAssets)}
          icon={<TrendingUp className="h-4 w-4" />}
          variant="success"
        />
        <StatCard
          title="Liabilities"
          value={formatCurrency(totalLiabilities)}
          icon={<TrendingDown className="h-4 w-4" />}
          variant="destructive"
        />
        <StatCard
          title="Available Credit"
          value={formatCurrency(availableCredit)}
          icon={<CreditCard className="h-4 w-4" />}
        />
      </div>

      {dueCount > 0 && (
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-4">
            <p className="text-sm font-medium">
              {dueCount} transaction{dueCount !== 1 ? 's' : ''} pending confirmation
            </p>
          </CardContent>
        </Card>
      )}

      <NetWorthChart history={data.netWorthHistory} formatCurrency={formatCurrency} />

      <div className="grid gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Net Worth by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {netWorthDetailedBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={netWorthDetailedBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {netWorthDetailedBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', maxHeight: '100px', overflowY: 'auto' }}
                    formatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">No data available</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Assets by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {assetsPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetsPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {assetsPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', maxHeight: '100px', overflowY: 'auto' }}
                    formatter={(value) => value.length > 15 ? value.substring(0, 15) + '...' : value}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8 text-sm">No assets yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-success">Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-success">{formatCurrency(monthlyIncome)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-destructive">Monthly Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-destructive">{formatCurrency(monthlyExpenses)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Net Cash Flow</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${monthlyIncome - monthlyExpenses >= 0 ? 'text-success' : 'text-destructive'}`}>
              {formatCurrency(monthlyIncome - monthlyExpenses)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Credit Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              {totalCreditLimit > 0 ? `${((totalCreditDebt / totalCreditLimit) * 100).toFixed(0)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.assets.length + data.liabilities.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.assets.length} assets, {data.liabilities.length} liabilities
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Credit Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.creditCards.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(totalCreditDebt)} debt
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.transactions.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.transactions.filter(t => t.recurring).length} recurring
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
