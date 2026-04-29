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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {userRole === 'owner' ? (
          <StatCard title="Saldo Cash + Bank" value={formatCurrency(totalCashBank)} subValue={`Cash: ${formatCurrency(cashBalance)} / Bank: ${formatCurrency(bankBalance)}`} icon={Wallet} color="blue" trend="Balance Total" />
        ) : (
          <StatCard title="Saldo Cash (Toko)" value={formatCurrency(cashBalance)} subValue="Saldo Fisik di Toko" icon={Wallet} color="blue" trend="Cash Only" />
        )}
        <StatCard title="Keuntungan Hari Ini" value={formatCurrency(todayProfit)} subValue="Estimasi Laba Bersih" icon={TrendingUp} color="emerald" trend="Profit" />
        <StatCard title="Total Aset Digital" value={formatCurrency(totalDigitalAsset)} subValue="Saldo Pulsa & Transfer" icon={Smartphone} color="amber" trend="Ready" />
        <StatCard title="Beban Hari Ini" value={formatCurrency(todayExpenses)} subValue="Operasional" icon={TrendingDown} color="rose" trend="Cost" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800">Performa 7 Hari</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
               <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-blue-500 rounded-full"></span> Penjualan</span>
               <span className="flex items-center gap-1.5"><span className="w-2 h-2 bg-rose-500 rounded-full"></span> Beban</span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#64748b'}} />
                <YAxis hide />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" strokeWidth={2} strokeDasharray="5 5" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><AlertTriangle className="w-4 h-4 text-rose-500" /> Stok Menipis</h3>
          <div className="flex-1 space-y-3 overflow-y-auto no-scrollbar">
            {allLowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="min-w-0 flex-1"><div className="text-sm font-bold text-slate-800 truncate">{p.name}</div><div className="text-[10px] text-slate-400 uppercase font-black">{p.category}</div></div>
                <div className="text-right ml-4 font-black text-rose-500">{p.stock}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Top 5 Produk Terlaris (Kuantitas)
            </h3>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topProducts} layout="vertical" margin={{ left: 20, right: 30, top: 0, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  width={120}
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: '#64748b' }}
                />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={20}>
                  {topProducts.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            Ringkasan Penjualan
          </h3>
          <div className="space-y-4">
             {topProducts.map((p, i) => (
               <div key={i} className="flex items-center justify-between">
                 <div className="flex items-center gap-3">
                   <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black text-white" style={{ backgroundColor: COLORS[i % COLORS.length] }}>{i+1}</div>
                   <div className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{p.name}</div>
                 </div>
                 <div className="text-xs font-black text-slate-400">{p.count} <span className="text-[10px] uppercase">Terjual</span></div>
               </div>
             ))}
             {topProducts.length === 0 && <div className="text-center py-10 text-slate-300 text-xs font-bold uppercase tracking-widest">Belum ada data</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon: Icon, color, trend }: any) {
  const styles = {
    blue: 'bg-blue-600 text-white shadow-blue-100',
    rose: 'bg-rose-500 text-white shadow-rose-100',
    emerald: 'bg-emerald-500 text-white shadow-emerald-100',
    amber: 'bg-amber-500 text-white shadow-amber-100',
  };

  return (
    <div className={cn("p-5 rounded-2xl shadow-xl", styles[color as keyof typeof styles])}>
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-white/20 rounded-lg"><Icon className="w-5 h-5" /></div>
        <div className="text-[10px] font-black uppercase bg-black/10 px-2 py-0.5 rounded-full">{trend}</div>
      </div>
      <div>
        <div className="text-[10px] font-bold uppercase opacity-80 mb-1">{title}</div>
        <div className="text-2xl font-black">{value}</div>
        <div className="mt-2 text-[10px] font-medium opacity-60 uppercase">{subValue}</div>
      </div>
    </div>
  );
}
