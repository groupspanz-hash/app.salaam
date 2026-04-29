import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Smartphone, 
  ReceiptText, 
  BarChart3, 
  Wallet,
  Menu,
  X,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatCurrency } from './lib/utils';
import { Product, Transaction, Expense, DigitalTopUp, StockMovement, BankTransfer } from './types';
import { INITIAL_PRODUCTS } from './constants';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './lib/firebase';
import { useFirestoreCollection, useFirestoreDocument } from './lib/firestoreHooks';
import AuthView from './components/AuthView';

// --- Components ---
import DashboardView from './components/DashboardView';
import TransactionView from './components/TransactionView';
import StockView from './components/StockView';
import PulseView from './components/PulseView';
import ExpenseView from './components/ExpenseView';
import FinanceView from './components/FinanceView';
import ReportView from './components/ReportView';

type View = 'dashboard' | 'transactions' | 'stock' | 'pulse' | 'expenses' | 'finance' | 'reports';

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [userRole, setUserRole] = useState<'owner' | 'admin'>(() => {
    const saved = localStorage.getItem('userRole');
    return (saved as 'owner' | 'admin') || 'admin';
  });
  
  const [user, loadingUser] = useAuthState(auth);

  const [products, setProducts, initProducts] = useFirestoreCollection<Product>('products', INITIAL_PRODUCTS);
  const [transactions, setTransactions, initTransactions] = useFirestoreCollection<Transaction>('transactions', []);
  const [expenses, setExpenses, initExpenses] = useFirestoreCollection<Expense>('expenses', []);
  const [digitalTopups, setDigitalTopups, initTopups] = useFirestoreCollection<DigitalTopUp>('digitalTopups', []);
  const [transfers, setTransfers, initTransfers] = useFirestoreCollection<BankTransfer>('transfers', []);
  const [stockMovements, setStockMovements, initMovements] = useFirestoreCollection<StockMovement>('stockMovements', []);
  const [cashBankHistory, setCashBankHistory, initHistory] = useFirestoreCollection<any>('cashBankHistory', []);
  const [suppliers, setSuppliers, initSuppliers] = useFirestoreCollection<any>('suppliers', []);
  const [returnReasons, setReturnReasons, initReasons] = useFirestoreCollection<any>('returnReasons', [
    { id: '1', label: 'Barang Rusak' },
    { id: '2', label: 'Salah Kirim' },
    { id: '3', label: 'Expired' },
    { id: '4', label: 'Tidak Layak Jual' }
  ]);

  const [balances, setBalances, initBalances] = useFirestoreDocument<{
    pulseBalance: number,
    transferBalance: number,
    cashBalance: number,
    bankBalance: number,
  }>('storeSettings/balances', {
    pulseBalance: 1250000,
    transferBalance: 500000,
    cashBalance: 5000000,
    bankBalance: 10000000
  });

  const pulseBalance = balances.pulseBalance;
  const setPulseBalance = (val: any) => setBalances(prev => ({...prev, pulseBalance: typeof val === 'function' ? val(prev.pulseBalance) : val}));

  const transferBalance = balances.transferBalance;
  const setTransferBalance = (val: any) => setBalances(prev => ({...prev, transferBalance: typeof val === 'function' ? val(prev.transferBalance) : val}));

  const cashBalance = balances.cashBalance;
  const setCashBalance = (val: any) => setBalances(prev => ({...prev, cashBalance: typeof val === 'function' ? val(prev.cashBalance) : val}));

  const bankBalance = balances.bankBalance;
  const setBankBalance = (val: any) => setBalances(prev => ({...prev, bankBalance: typeof val === 'function' ? val(prev.bankBalance) : val}));

  const [showPassModal, setShowPassModal] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');

  // Initial migration logic can be disabled or integrated, but since it's firestore we let INITIAL_PRODUCTS populate ifempty
  // Removed old localStorage writers
  // ...

  const sidebarItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner'] },
    { id: 'transactions', label: 'Transaksi', icon: ShoppingCart, roles: ['owner', 'admin'] },
    { id: 'stock', label: 'Stok Barang', icon: Package, roles: ['owner', 'admin'] },
    { id: 'pulse', label: 'E-Wallet & Pulsa', icon: Smartphone, roles: ['owner', 'admin'] },
    { id: 'expenses', label: 'Pengeluaran', icon: ReceiptText, roles: ['owner'] },
    { id: 'finance', label: 'Keuangan Kas', icon: Wallet, roles: ['owner'] },
    { id: 'reports', label: 'Laporan', icon: BarChart3, roles: ['owner'] },
  ].filter(item => item.roles.includes(userRole));

  useEffect(() => {
    const currentItem = sidebarItems.find(item => item.id === activeView);
    if (!currentItem && sidebarItems.length > 0) {
      setActiveView(sidebarItems[0].id as View);
    }
  }, [userRole, activeView, sidebarItems]);

  const handleRoleSwitch = (role: 'owner' | 'admin') => {
    if (role === 'owner' && userRole === 'admin') {
      setShowPassModal(true);
      setPasswordInput('');
    } else {
      setUserRole(role);
    }
  };

  const confirmPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === '001122') {
      setUserRole('owner');
      setShowPassModal(false);
    } else {
      alert('Password salah!');
    }
  };

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView 
          products={products} 
          transactions={transactions} 
          expenses={expenses} 
          pulseBalance={pulseBalance} 
          transferBalance={transferBalance} 
          cashBalance={cashBalance}
          bankBalance={bankBalance}
          userRole={userRole}
        />;
      case 'transactions':
        return <TransactionView 
          products={products} 
          setProducts={setProducts} 
          transactions={transactions} 
          setTransactions={setTransactions} 
          pulseBalance={pulseBalance} 
          setPulseBalance={setPulseBalance}
          transferBalance={transferBalance}
          setTransferBalance={setTransferBalance}
          cashBalance={cashBalance}
          setCashBalance={setCashBalance}
          bankBalance={bankBalance}
          setBankBalance={setBankBalance}
          setStockMovements={setStockMovements}
        />;
      case 'stock':
        return <StockView 
          products={products} 
          setProducts={setProducts} 
          setExpenses={setExpenses} 
          cashBalance={cashBalance}
          setCashBalance={setCashBalance}
          bankBalance={bankBalance}
          setBankBalance={setBankBalance}
          setStockMovements={setStockMovements}
          suppliers={suppliers}
          setSuppliers={setSuppliers}
          returnReasons={returnReasons}
          setReturnReasons={setReturnReasons}
          userRole={userRole}
        />;
      case 'pulse':
        return <PulseView 
          pulseBalance={pulseBalance} 
          setPulseBalance={setPulseBalance} 
          transferBalance={transferBalance}
          setTransferBalance={setTransferBalance}
          digitalTopups={digitalTopups} 
          setDigitalTopups={setDigitalTopups} 
          cashBalance={cashBalance}
          setCashBalance={setCashBalance}
          bankBalance={bankBalance}
          setBankBalance={setBankBalance}
          setTransactions={setTransactions}
          userRole={userRole}
        />;
      case 'expenses':
        return <ExpenseView 
          expenses={expenses} 
          setExpenses={setExpenses} 
          cashBalance={cashBalance}
          setCashBalance={setCashBalance}
          bankBalance={bankBalance}
          setBankBalance={setBankBalance}
        />;
      case 'finance':
        return <FinanceView 
          transactions={transactions} 
          expenses={expenses} 
          products={products} 
          cashBalance={cashBalance}
          setCashBalance={setCashBalance}
          bankBalance={bankBalance}
          setBankBalance={setBankBalance}
          transfers={transfers}
          setTransfers={setTransfers}
          cashBankHistory={cashBankHistory}
          setCashBankHistory={setCashBankHistory}
          userRole={userRole}
        />;
      case 'reports':
        return <ReportView 
          transactions={transactions} 
          expenses={expenses} 
          products={products} 
          digitalTopups={digitalTopups} 
          stockMovements={stockMovements}
          transfers={transfers}
          cashBankHistory={cashBankHistory}
        />;
      default:
        return <DashboardView 
          products={products} 
          transactions={transactions} 
          expenses={expenses} 
          pulseBalance={pulseBalance} 
          transferBalance={transferBalance} 
          cashBalance={cashBalance}
          bankBalance={bankBalance}
          userRole={userRole}
        />;
    }
  };

  if (loadingUser) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400">Memuat...</div>;
  }

  if (!user) {
    return <AuthView />;
  }

  if (!initProducts || !initTransactions || !initExpenses || !initTopups || !initTransfers || !initMovements || !initHistory || !initBalances || !initSuppliers || !initReasons) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 font-bold text-slate-400">Sinkronisasi Data...</div>;
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <aside className={cn(
        "bg-slate-900 text-white flex flex-col transition-all duration-300 ease-in-out shrink-0 relative z-20",
        isSidebarOpen ? "w-64" : "w-20"
      )}>
        <div className="p-6 flex items-center gap-3 overflow-hidden whitespace-nowrap">
          <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6 text-white" />
          </div>
          {isSidebarOpen && (
            <span className="font-bold text-xl tracking-tight uppercase">Toko Kas Pro</span>
          )}
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto no-scrollbar">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id as View)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer text-left",
                  isActive 
                    ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/20" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "opacity-100" : "opacity-80")} />
                {isSidebarOpen && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {isSidebarOpen && (
          <div className="p-4 mx-4 mb-2 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <div className="text-[9px] text-slate-500 uppercase font-black tracking-widest mb-2 px-1 text-center">Mode Akses</div>
            <div className="flex bg-slate-900 p-1 rounded-xl gap-1">
              <button 
                onClick={() => handleRoleSwitch('owner')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer",
                  userRole === 'owner' ? "bg-emerald-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >Owner</button>
              <button 
                onClick={() => handleRoleSwitch('admin')}
                className={cn(
                  "flex-1 py-2 rounded-lg text-[8px] font-black uppercase transition-all cursor-pointer",
                  userRole === 'admin' ? "bg-blue-500 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                )}
              >Admin</button>
            </div>
          </div>
        )}

        {isSidebarOpen && (
          <div className="p-4 bg-slate-800 m-4 rounded-2xl shadow-inner">
            <div className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Saldo Toko (Cash)</div>
            <div className="text-lg font-bold text-emerald-400">{formatCurrency(cashBalance)}</div>
            <div className="text-[10px] text-slate-400 mt-2 uppercase">Saldo Pulsa</div>
            <div className="text-sm font-semibold text-blue-400">{formatCurrency(pulseBalance)}</div>
            <div className="text-[10px] text-slate-400 mt-2 uppercase">Saldo Transfer</div>
            <div className="text-sm font-semibold text-purple-400">{formatCurrency(transferBalance)}</div>
          </div>
        )}
        
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-20 bg-emerald-500 rounded-full p-1 text-white shadow-lg"
        >
          {isSidebarOpen ? <X className="w- 4 h-4" /> : <Menu className="w-4 h-4" />}
        </button>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm relative z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-800 capitalize">{activeView.replace('-', ' ')}</h1>
          </div>
          
          <div className="flex items-center gap-6 text-slate-600">
            <div className="hidden sm:flex flex-col text-right text-xs">
              <div className="text-slate-400">Hari ini</div>
              <div className="font-bold">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            </div>
            
            <div className="flex items-center gap-3 border-l border-slate-200 pl-6">
              <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center font-bold text-emerald-600 border border-emerald-100 uppercase">
                {userRole === 'owner' ? 'OW' : 'AD'}
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-bold text-slate-800">{userRole === 'owner' ? 'Owner Akun' : 'Admin Toko'}</div>
                <div className="text-[10px] uppercase font-bold text-slate-400">{userRole}</div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 p-4 lg:p-8 overflow-y-auto no-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {renderView()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <AnimatePresence>
        {showPassModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mx-auto mb-6">
                  <Wallet className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Akses Owner</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">Masukkan password khusus untuk<br />mengakses seluruh fitur sistem</p>
                
                <form onSubmit={confirmPassword} className="mt-8 space-y-4">
                  <input 
                    autoFocus
                    type="password" 
                    placeholder="••••••••" 
                    className="w-full bg-slate-50 px-6 py-4 rounded-2xl border-2 border-transparent focus:border-emerald-500 outline-none text-center font-black tracking-[0.5em] text-lg transition-all"
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                  />
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowPassModal(false)}
                      className="flex-1 py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                    >Batal</button>
                    <button 
                      type="submit" 
                      className="flex-3 py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-95 transition-all"
                    >Konfirmasi</button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
