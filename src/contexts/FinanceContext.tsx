import React, { createContext, useContext, useState, useEffect } from 'react';
import { FinanceData, Asset, Liability, CreditCard, Transaction, Settings, NetWorthSnapshot } from '@/types/finance';
import { toast } from '@/hooks/use-toast';

interface FinanceContextType {
  data: FinanceData;
  addAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addLiability: (liability: Omit<Liability, 'id' | 'createdAt'>) => void;
  updateLiability: (id: string, liability: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;
  addCreditCard: (card: Omit<CreditCard, 'id' | 'createdAt'>) => void;
  updateCreditCard: (id: string, card: Partial<CreditCard>) => void;
  deleteCreditCard: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt'>) => void;
  updateTransaction: (id: string, transaction: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  exportData: () => void;
  importData: (data: string) => void;
  resetData: () => void;
}

const defaultSettings: Settings = {
  currency: 'USD',
  theme: 'light',
  includeCreditInNetWorth: false,
};

const defaultData: FinanceData = {
  assets: [],
  liabilities: [],
  creditCards: [],
  transactions: [],
  settings: defaultSettings,
  netWorthHistory: [],
};

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<FinanceData>(defaultData);

  const createNetWorthSnapshot = (updatedData: FinanceData): NetWorthSnapshot => {
    const totalAssets = updatedData.assets.reduce((sum, asset) => sum + asset.value, 0);
    const totalLiabilities = updatedData.liabilities.reduce((sum, liability) => sum + liability.value, 0);
    const totalCreditLimit = updatedData.creditCards.reduce((sum, card) => sum + card.creditLimit, 0);
    const totalCreditDebt = updatedData.creditCards.reduce((sum, card) => sum + card.outstandingDebt, 0);
    const availableCredit = totalCreditLimit - totalCreditDebt;
    
    const netWorth = updatedData.settings.includeCreditInNetWorth 
      ? totalAssets + availableCredit - totalLiabilities - totalCreditDebt
      : totalAssets - totalLiabilities - totalCreditDebt;

    return {
      date: new Date().toISOString(),
      netWorth,
      totalAssets,
      totalLiabilities,
      totalCreditDebt,
      availableCredit,
    };
  };

  const addNetWorthSnapshot = (updatedData: FinanceData) => {
    const snapshot = createNetWorthSnapshot(updatedData);
    const history = updatedData.netWorthHistory || [];
    
    // Only add if there's been a meaningful change or it's been more than an hour
    const lastSnapshot = history[history.length - 1];
    if (!lastSnapshot || 
        Math.abs(lastSnapshot.netWorth - snapshot.netWorth) > 0.01 ||
        new Date(snapshot.date).getTime() - new Date(lastSnapshot.date).getTime() > 3600000) {
      return [...history, snapshot];
    }
    return history;
  };

  useEffect(() => {
    const stored = localStorage.getItem('financeData');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure backward compatibility - add netWorthHistory if it doesn't exist
        if (!parsed.netWorthHistory) {
          parsed.netWorthHistory = [];
        }
        setData(parsed);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('financeData', JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', data.settings.theme === 'dark');
  }, [data.settings.theme]);

  const addAsset = (asset: Omit<Asset, 'id' | 'createdAt'>) => {
    const newAsset: Asset = {
      ...asset,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => {
      const updated = { ...prev, assets: [...prev.assets, newAsset] };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Asset added', description: `${asset.name} has been added.` });
  };

  const updateAsset = (id: string, updates: Partial<Asset>) => {
    setData(prev => {
      const updated = {
        ...prev,
        assets: prev.assets.map(a => a.id === id ? { ...a, ...updates } : a),
      };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Asset updated' });
  };

  const deleteAsset = (id: string) => {
    setData(prev => {
      const updated = { ...prev, assets: prev.assets.filter(a => a.id !== id) };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Asset deleted' });
  };

  const addLiability = (liability: Omit<Liability, 'id' | 'createdAt'>) => {
    const newLiability: Liability = {
      ...liability,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => {
      const updated = { ...prev, liabilities: [...prev.liabilities, newLiability] };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Liability added', description: `${liability.name} has been added.` });
  };

  const updateLiability = (id: string, updates: Partial<Liability>) => {
    setData(prev => {
      const updated = {
        ...prev,
        liabilities: prev.liabilities.map(l => l.id === id ? { ...l, ...updates } : l),
      };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Liability updated' });
  };

  const deleteLiability = (id: string) => {
    setData(prev => {
      const updated = { ...prev, liabilities: prev.liabilities.filter(l => l.id !== id) };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Liability deleted' });
  };

  const addCreditCard = (card: Omit<CreditCard, 'id' | 'createdAt'>) => {
    const newCard: CreditCard = {
      ...card,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => {
      const updated = { ...prev, creditCards: [...prev.creditCards, newCard] };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Credit card added', description: `${card.name} has been added.` });
  };

  const updateCreditCard = (id: string, updates: Partial<CreditCard>) => {
    setData(prev => {
      const updated = {
        ...prev,
        creditCards: prev.creditCards.map(c => c.id === id ? { ...c, ...updates } : c),
      };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Credit card updated' });
  };

  const deleteCreditCard = (id: string) => {
    setData(prev => {
      const updated = { ...prev, creditCards: prev.creditCards.filter(c => c.id !== id) };
      updated.netWorthHistory = addNetWorthSnapshot(updated);
      return updated;
    });
    toast({ title: 'Credit card deleted' });
  };

  const addTransaction = (transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      status: 'estimated',
      ...transaction,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setData(prev => ({ ...prev, transactions: [...prev.transactions, newTransaction] }));
    toast({ title: 'Transaction added', description: `${transaction.name} has been added.` });
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setData(prev => ({
      ...prev,
      transactions: prev.transactions.map(t => t.id === id ? { ...t, ...updates } : t),
    }));
    toast({ title: 'Transaction updated' });
  };

  const deleteTransaction = (id: string) => {
    setData(prev => ({ ...prev, transactions: prev.transactions.filter(t => t.id !== id) }));
    toast({ title: 'Transaction deleted' });
  };

  const updateSettings = (updates: Partial<Settings>) => {
    setData(prev => ({ ...prev, settings: { ...prev.settings, ...updates } }));
    toast({ title: 'Settings updated' });
  };

  const exportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `finance-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: 'Data exported', description: 'Your data has been downloaded.' });
  };

  const importData = (dataStr: string) => {
    try {
      const imported = JSON.parse(dataStr);
      // Ensure backward compatibility - add netWorthHistory if it doesn't exist
      if (!imported.netWorthHistory) {
        imported.netWorthHistory = [];
      }
      setData(imported);
      toast({ title: 'Data imported', description: 'Your data has been restored.' });
    } catch (error) {
      toast({ title: 'Import failed', description: 'Invalid data format.', variant: 'destructive' });
    }
  };

  const resetData = () => {
    setData(defaultData);
    toast({ title: 'Data reset', description: 'All data has been cleared.' });
  };

  return (
    <FinanceContext.Provider
      value={{
        data,
        addAsset,
        updateAsset,
        deleteAsset,
        addLiability,
        updateLiability,
        deleteLiability,
        addCreditCard,
        updateCreditCard,
        deleteCreditCard,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateSettings,
        exportData,
        importData,
        resetData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within FinanceProvider');
  }
  return context;
};
