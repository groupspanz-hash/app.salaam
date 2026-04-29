import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, CreditCard, Banknote } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FinanceView({ 
  transactions, 
  expenses, 
  products, 
  cashBalance, 
  setCashBalance, 
  bankBalance, 
  setBankBalance,
  transfers,
  setTransfers,
  cashBankHistory,
  setCashBankHistory,
  userRole
}: any) {
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({ from: 'cash' as 'cash' | 'bank', amount: 0, note: '' });
  
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({ type: 'cash' as 'cash' | 'bank', amount: 0, date: new Date().toISOString().split('T')[0], note: '' });

  const totalRevenue = transactions.reduce((acc: any, curr: any) => acc + curr.total, 0);
  const totalExpense = expenses.reduce((acc: any, curr: any) => acc + (curr.amount || 0), 0);
  
  const totalCost = transactions.reduce((acc: any, t: any) => {
    return acc + t.items.reduce((itemAcc: any, item: any) => {
      if (item.isPulse) {
        return itemAcc + parseInt(item.productId.split('-')[1]);
      }
      const prod = products.find((p: any) => p.id === item.productId);
      return itemAcc + (prod ? prod.buyPrice * item.quantity : 0);
    }, 0);
  }, 0);

  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpense;

  const stats = [
    { label: 'Uang Masuk', value: totalRevenue, icon: TrendingUp, color: 'emerald' },
    { label: 'Uang Keluar', value: totalExpense + totalCost, icon: TrendingDown, color: 'rose' },
    { label: 'Saldo Cash', value: cashBalance, icon: Banknote, color: 'blue' },
    { label: 'Saldo Bank', value: bankBalance, icon: CreditCard, color: 'slate' },
  ];

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustData.amount < 0) return;
    
    const oldBalance = adjustData.type === 'cash' ? cashBalance : bankBalance;
    const difference = adjustData.amount - oldBalance;
    
    if (difference !== 0) {
      const newHistory = {
        id: `ADJ-${Date.now()}`,
        type: adjustData.type,
        oldBalance,
        newBalance: adjustData.amount,
        difference,
        date: adjustData.date,
        note: adjustData.note || `Penyesuaian saldo manual oleh Owner`,
      };
      
      setCashBankHistory([newHistory, ...cashBankHistory]);
      
      if (adjustData.type === 'cash') {
         setCashBalance(adjustData.amount);
      } else {
         setBankBalance(adjustData.amount);
      }
    }
    
    setShowAdjustModal(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferData.amount <= 0) return;
    
    if (transferData.from === 'cash') {
      if (cashBalance < transferData.amount) return alert('Saldo Cash tidak cukup!');
      setCashBalance((p: any) => p - transferData.amount);
      setBankBalance((p: any) => p + transferData.amount);
    } else {
      if (bankBalance < transferData.amount) return alert('Saldo Bank tidak cukup!');
      setBankBalance((p: any) => p - transferData.amount);
      setCashBalance((p: any) => p + transferData.amount);
    }

    const newTransfer = {
      id: `TRF-${Date.now()}`,
      date: new Date().toISOString(),
      from: transferData.from,
      to: transferData.from === 'cash' ? 'bank' : 'cash',
      amount: transferData.amount,
      note: transferData.note
    };

    setTransfers([newTransfer, ...transfers]);
    setShowTransferModal(false);
    setTransferData({ from: 'cash', amount: 0, note: '' });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl border border-slate-200">
        <div>
          <h2 className="text-xl font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
            <Wallet className="text-emerald-500" /> Manajemen Kas & Bank
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Digital Asset & Real Cash Management</p>
        </div>
        <div className="flex gap-3 mt-4 lg:mt-0">
          {userRole === 'owner' && (
            <button 
              onClick={() => setShowAdjustModal(true)}
              className="bg-emerald-100 text-emerald-700 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-all outline-none"
            >
              Adjustment
            </button>
          )}
          <button 
            onClick={() => setShowTransferModal(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-xl shadow-slate-200"
          >
            <ArrowRightLeft className="w-4 h-4" /> Transfer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-all hover:shadow-lg group">
             <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xl", 
               s.color === 'emerald' ? 'bg-emerald-500 text-white shadow-emerald-50' : 
               s.color === 'rose' ? 'bg-rose-500 text-white shadow-rose-50' :
               s.color === 'blue' ? 'bg-emerald-600 text-white shadow-emerald-50' : 'bg-blue-600 text-white shadow-blue-50'
             )}><s.icon className="w-5 h-5 group-hover:scale-110 transition-transform" /></div>
             <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</div>
             <div className="text-xl font-black text-slate-800">{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 flex flex-col gap-8">
           <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm space-y-8">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm border-b pb-4">Analisis Laba Rugi</h3>
              <div className="space-y-6">
                 <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex justify-between items-center text-slate-500">
                    <div className="font-bold uppercase text-[10px] tracking-widest">Omzet Penjualan</div>
                    <div className="text-2xl font-black">{formatCurrency(totalRevenue)}</div>
                 </div>
                 <div className="p-6 bg-emerald-500 rounded-2xl border border-emerald-400 flex justify-between items-center text-white shadow-xl shadow-emerald-200">
                    <div className="font-bold uppercase text-[10px] tracking-widest opacity-80">Laba Bersih</div>
                    <div className="text-3xl font-black">{formatCurrency(netProfit)}</div>
                 </div>
                 <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex justify-between items-center text-rose-500 font-bold">
                    <div className="uppercase text-[10px] tracking-widest opacity-60">Total Beban (Biaya + Modal)</div>
                    <div className="text-2xl font-black">{formatCurrency(totalExpense + totalCost)}</div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b"><h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px]">Riwayat Transfer Rekening</h3></div>
              <div className="overflow-auto max-h-96">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Alur</th><th className="px-6 py-4 text-right">Jumlah</th><th className="px-6 py-4">Catatan</th></tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {transfers.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase">{new Date(t.date).toLocaleString()}</td>
                        <td className="px-6 py-4 font-bold flex items-center gap-2">
                          <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase", t.from === 'cash' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600")}>{t.from}</span>
                          <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                          <span className={cn("px-2 py-0.5 rounded text-[10px] uppercase", t.to === 'cash' ? "bg-emerald-100 text-emerald-600" : "bg-blue-100 text-blue-600")}>{t.to}</span>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800">{formatCurrency(t.amount)}</td>
                        <td className="px-6 py-4 text-slate-400 italic text-[10px]">{t.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {transfers.length === 0 && <div className="py-20 text-center text-slate-200 font-black uppercase tracking-widest text-xs">Tidak ada riwayat transfer</div>}
              </div>
           </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Distribusi Arus Dana</h3>
              <div className="w-full h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                          data={[ 
                            { name: 'Modal', value: totalCost }, 
                            { name: 'Profit', value: netProfit > 0 ? netProfit : 0 }, 
                            { name: 'Expense', value: totalExpense } 
                          ]} 
                          innerRadius={60} 
                          outerRadius={100} 
                          paddingAngle={8} 
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                          <Cell fill="#f43f5e" />
                        </Pie>
                        <Tooltip />
                    </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-4 text-[10px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> Modal</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-emerald-500 rounded-full"></span> Laba</span>
                <span className="flex items-center gap-2"><span className="w-3 h-3 bg-rose-500 rounded-full"></span> Beban</span>
              </div>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden">
               <div className="p-8 bg-slate-900 border-b flex justify-between items-center text-white">
                 <h3 className="font-black uppercase tracking-widest text-sm">Transfer Antar Rekening</h3>
                 <button onClick={() => setShowTransferModal(false)} className="text-white/40 hover:text-white">X</button>
               </div>
               <form onSubmit={handleTransfer} className="p-10 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Pindah Dari:</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setTransferData({...transferData, from: 'cash'})} className={cn("flex-1 py-4 rounded-3xl border-4 font-black uppercase text-xs transition-all", transferData.from === 'cash' ? "bg-white border-blue-500 text-blue-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-50")}>Cash</button>
                      <button type="button" onClick={() => setTransferData({...transferData, from: 'bank'})} className={cn("flex-1 py-4 rounded-3xl border-4 font-black uppercase text-xs transition-all", transferData.from === 'bank' ? "bg-white border-blue-500 text-blue-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-50")}>Bank</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Transfer</label>
                    <input required type="number" className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-xl font-black border-none outline-none focus:ring-2 focus:ring-blue-500 text-center" value={transferData.amount || ''} onChange={e => setTransferData({...transferData, amount: Number(e.target.value)})} />
                    <p className="text-[10px] text-center font-bold text-slate-400 mt-2 uppercase tracking-widest">
                      Saldo {transferData.from}: {formatCurrency(transferData.from === 'cash' ? cashBalance : bankBalance)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan (Optional)</label>
                    <textarea className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-sm border-none outline-none focus:ring-2 focus:ring-blue-500 h-24" value={transferData.note} onChange={e => setTransferData({...transferData, note: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-3xl shadow-2xl shadow-blue-100 uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all">Konfirmasi Transfer</button>
               </form>
            </motion.div>
          </div>
        )}

        {showAdjustModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 bg-emerald-600 border-b flex justify-between items-center text-white shrink-0">
                 <h3 className="font-black uppercase tracking-widest text-sm">Adjustment Saldo</h3>
                 <button onClick={() => setShowAdjustModal(false)} className="text-white/40 hover:text-white">X</button>
               </div>
               <form onSubmit={handleAdjust} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Pilih Akun:</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'cash', amount: cashBalance})} className={cn("flex-1 py-4 rounded-3xl border-4 font-black uppercase text-xs transition-all", adjustData.type === 'cash' ? "bg-white border-emerald-500 text-emerald-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-50")}>Cash</button>
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'bank', amount: bankBalance})} className={cn("flex-1 py-4 rounded-3xl border-4 font-black uppercase text-xs transition-all", adjustData.type === 'bank' ? "bg-white border-emerald-500 text-emerald-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-50")}>Bank</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Fisik Terbaru</label>
                    <input required type="number" min="0" className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-xl font-black border-none outline-none focus:ring-2 focus:ring-emerald-500 text-center" value={adjustData.amount} onChange={e => setAdjustData({...adjustData, amount: e.target.value === '' ? 0 : Number(e.target.value)})} />
                    <p className="text-[10px] text-center font-bold text-slate-400 mt-2 uppercase tracking-widest">
                      Saldo Sistem Saat Ini: {formatCurrency(adjustData.type === 'cash' ? cashBalance : bankBalance)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Penyesuaian</label>
                    <input required type="date" className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-sm font-black border-none outline-none focus:ring-2 focus:ring-emerald-500" value={adjustData.date} onChange={e => setAdjustData({...adjustData, date: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan (Optional)</label>
                    <textarea className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-sm border-none outline-none focus:ring-2 focus:ring-emerald-500 h-24" placeholder="Misal: Selisih salah input, uang hilang" value={adjustData.note} onChange={e => setAdjustData({...adjustData, note: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-5 bg-emerald-600 text-white font-black rounded-3xl shadow-2xl shadow-emerald-100 uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all">Update Saldo</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
