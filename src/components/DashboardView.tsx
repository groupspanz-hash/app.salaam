import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  ShoppingCart, 
  AlertTriangle, 
  Smartphone,
  Package,
  ArrowUpRight,
  Wallet,
  BarChart3
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { Product, Transaction, Expense } from '../types';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  expenses: Expense[];
  pulseBalance: number;
  transferBalance: number;
  cashBalance: number;
  bankBalance: number;
  userRole?: 'owner' | 'admin';
}

export default function DashboardView({ 
  products, 
  transactions, 
  expenses, 
  pulseBalance, 
  transferBalance, 
  cashBalance, 
  bankBalance,
  userRole 
}: DashboardViewProps) {
  const today = new Date().toISOString().split('T')[0];
  const todayTransactions = transactions.filter(t => t.date.startsWith(today));
  const todaySales = todayTransactions.reduce((acc, curr) => acc + curr.total, 0);
  const todayExpenses = expenses.filter(e => e.date.startsWith(today)).reduce((acc, curr) => acc + curr.amount, 0);
  
  const todayProfit = todayTransactions.reduce((acc, t) => {
    const itemsProfit = t.items.reduce((itemAcc, item) => {
      if (item.isPulse) {
        return itemAcc + 2000 * item.quantity;
      }
      const product = products.find(p => p.id === item.productId);
      if (product) {
        return itemAcc + (item.price - product.buyPrice) * item.quantity;
      }
      return itemAcc;
    }, 0);
    return acc + (itemsProfit - (t.discount || 0));
  }, 0) - todayExpenses;

  const totalDigitalAsset = pulseBalance + transferBalance;

  const lowStockProducts = products.filter(p => !p.hasVariants && p.stock <= p.minStock);
  const lowStockVariants = products.flatMap(p => 
    (p.variants || []).filter(v => v.stock <= 5).map(v => ({ 
      id: v.id, 
      name: `${p.name} (${v.name})`, 
      category: p.category, 
      stock: v.stock 
    }))
  );
  
  const allLowStock = [...lowStockProducts, ...lowStockVariants].sort((a, b) => a.stock - b.stock);

  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });

  const chartData = last7Days.map(date => {
    const dayTransactions = transactions.filter(t => t.date.startsWith(date));
    const daySales = dayTransactions.reduce((acc, curr) => acc + curr.total, 0);
    const dayExpenses = expenses.filter(e => e.date.startsWith(date)).reduce((acc, curr) => acc + curr.amount, 0);
    return {
      name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }),
      sales: daySales,
      expenses: dayExpenses,
      profit: daySales - dayExpenses
    };
  });

  const productSalesMap: Record<string, number> = {};
  transactions.forEach(t => {
    t.items.forEach(item => {
      productSalesMap[item.name] = (productSalesMap[item.name] || 0) + item.quantity;
    });
  });

  const topProducts = Object.entries(productSalesMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

  const totalCashBank = cashBalance + bankBalance;

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {userRole === 'owner' ? (
          <StatCard title="Saldo Kas" value={formatCurrency(totalCashBank)} icon={Wallet} color="blue" trend="Total" />
        ) : (
          <StatCard title="Saldo Kas" value={formatCurrency(cashBalance)} icon={Wallet} color="blue" trend="Lokal" />
        )}
        <StatCard title="Laba" value={formatCurrency(todayProfit)} icon={TrendingUp} color="emerald" trend="Hari Ini" />
        <StatCard title="E-Asset" value={formatCurrency(totalDigitalAsset)} icon={Smartphone} color="amber" trend="Digital" />
        <StatCard title="Biaya" value={formatCurrency(todayExpenses)} icon={TrendingDown} color="rose" trend="Hari Ini" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-4 md:mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs md:text-sm">Performa 7 Hari</h3>
            <div className="flex gap-2 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">
               <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> Jual</span>
               <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full"></span> Biaya</span>
            </div>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fontWeight: 'bold', fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col max-h-[400px]">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs md:text-sm flex items-center gap-2 mb-4"><AlertTriangle className="w-3 h-3 text-rose-500" /> Stok Kritis</h3>
          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar pr-1">
            {allLowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between p-2.5 bg-slate-50 border-l-4 border-rose-500 rounded-r-xl transition-all hover:bg-slate-100">
                <div className="min-w-0 flex-1">
                  <div className="text-[11px] font-black text-slate-800 truncate uppercase leading-tight">{p.name}</div>
                  <div className="text-[8px] text-slate-400 uppercase font-black tracking-widest">{p.category}</div>
                </div>
                <div className="text-right ml-4 font-black text-rose-600 tabular-nums bg-rose-50 px-2 py-0.5 rounded text-[11px]">{p.stock}</div>
              </div>
            ))}
            {allLowStock.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 opacity-30 grayscale">
                 <Package className="w-8 h-8 mb-2" />
                 <span className="text-[10px] font-black uppercase tracking-widest">Aman Terkendali</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs md:text-sm flex items-center gap-2">
              <BarChart3 className="w-3 h-3 text-blue-500" />
              Produk Terlaris
            </h3>
          </div>
          <div className="h-48 md:h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: -10, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={100}
                  tick={{ fontSize: 9, fontWeight: 'bold', fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontSize: '10px' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                  {topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-black text-slate-800 uppercase tracking-tight text-xs md:text-sm mb-6 flex items-center gap-2">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            Rank Penjualan
          </h3>
          <div className="space-y-3">
             {topProducts.map((p, i) => (
               <div key={i} className="flex items-center justify-between group cursor-default">
                 <div className="flex items-center gap-3">
                   <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-sm ring-2 ring-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i+1}</div>
                   <div className="text-[11px] font-black text-slate-800 uppercase truncate max-w-[150px] group-hover:text-emerald-500 transition-colors">{p.name}</div>
                 </div>
                 <div className="text-[10px] font-black text-slate-400 flex items-center gap-1.5 tabular-nums">
                   <span className="text-slate-800">{p.count}</span>
                   <span className="uppercase tracking-tighter opacity-70">Unit</span>
                 </div>
               </div>
             ))}
             {topProducts.length === 0 && <div className="text-center py-10 text-slate-300 text-[10px] font-black uppercase tracking-widest leading-loose">Data penjualan<br/>belum tersedia</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, trend }: any) {
  const styles = {
    blue: 'border-blue-100 text-blue-700 bg-blue-50/30',
    rose: 'border-rose-100 text-rose-700 bg-rose-50/30',
    emerald: 'border-emerald-100 text-emerald-700 bg-emerald-50/30',
    amber: 'border-amber-100 text-amber-700 bg-amber-50/30',
  };

  const ringColors = {
    blue: 'ring-blue-500',
    rose: 'ring-rose-500',
    emerald: 'ring-emerald-500',
    amber: 'ring-amber-500',
  };

  return (
    <div className={cn(
      "p-3 md:p-5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95 cursor-default group overflow-hidden relative", 
      styles[color as keyof typeof styles]
    )}>
      <div className="absolute top-0 right-0 w-16 h-16 opacity-[0.03] translate-x-4 -translate-y-4 group-hover:scale-150 transition-transform">
        <Icon className="w-full h-full" />
      </div>
      <div className="flex justify-between items-start mb-2 md:mb-4 relative z-10">
        <div className={cn("p-1.5 md:p-2 bg-white rounded-lg shadow-sm ring-1", ringColors[color as keyof typeof ringColors])}>
          <Icon className="w-3.5 h-3.5 md:w-5 md:h-5" />
        </div>
        <div className="text-[7px] md:text-[9px] font-black uppercase bg-white/50 px-2 py-0.5 rounded-full border border-current opacity-70">{trend}</div>
      </div>
      <div className="relative z-10">
        <div className="text-[7px] md:text-[9px] font-black uppercase opacity-60 mb-0.5 tracking-widest">{title}</div>
        <div className="text-sm md:text-xl font-black truncate tabular-nums">{value}</div>
      </div>
    </div>
  );
}
