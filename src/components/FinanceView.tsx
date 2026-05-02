import React, { useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, DollarSign, ArrowRightLeft, CreditCard, Banknote, Trash2, Edit } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function FinanceView({ 
  transactions, 
  expenses, 
  products, 
  cashBalance, 
  bankBalance, 
  setBalances,
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
      
      setBalances((prev: any) => ({
        ...prev,
        [adjustData.type === 'cash' ? 'cashBalance' : 'bankBalance']: adjustData.amount
      }));
    }
    
    setShowAdjustModal(false);
  };

  const handleTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (transferData.amount <= 0) return;
    
    if (transferData.from === 'cash' && cashBalance < transferData.amount) return alert('Saldo Cash tidak cukup!');
    if (transferData.from === 'bank' && bankBalance < transferData.amount) return alert('Saldo Bank tidak cukup!');

    setBalances((prev: any) => {
      const next = { ...prev };
      if (transferData.from === 'cash') {
        next.cashBalance -= transferData.amount;
        next.bankBalance += transferData.amount;
      } else {
        next.bankBalance -= transferData.amount;
        next.cashBalance += transferData.amount;
      }
      return next;
    });

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
    <div className="space-y-4 md:space-y-6">
      <div className="bg-white p-5 md:p-6 rounded-[32px] border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tighter flex items-center gap-3">
            <Wallet className="w-5 h-5 text-emerald-500" /> Kas & Perbankan
          </h2>
          <p className="text-[10px] font-bold text-slate-400 mt-0.5 uppercase tracking-widest leading-none">Manajemen Arus Kas Digital & Fisik</p>
        </div>
        <div className="flex gap-2.5">
          {userRole === 'owner' && (
            <button 
              onClick={() => setShowAdjustModal(true)}
              className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-emerald-100 transition-all active:scale-95 hover:bg-emerald-100"
            >
              Adjust
            </button>
          )}
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex-1 md:flex-none bg-slate-900 text-white px-5 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 active:scale-95 transition-all shadow-xl shadow-slate-200"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" /> Transfer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {stats.map((s, idx) => (
          <div key={idx} className="bg-white p-4 md:p-5 rounded-3xl border border-slate-200 shadow-sm group">
             <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center mb-3 md:mb-4 border shadow-sm", 
               s.color === 'emerald' ? 'bg-emerald-50 border-emerald-100 text-emerald-500' : 
               s.color === 'rose' ? 'bg-rose-50 border-rose-100 text-rose-500' :
               s.color === 'blue' ? 'bg-blue-50 border-blue-100 text-blue-500' : 'bg-slate-50 border-slate-200 text-slate-400'
             )}>
               <s.icon className="w-5 h-5" />
             </div>
             <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">{s.label}</div>
             <div className="text-sm md:text-lg font-black text-slate-800 tabular-nums">{formatCurrency(s.value)}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
        <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
           <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px] border-b border-slate-100 pb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" /> Analisa Laba Rugi
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                 <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-center">
                    <div className="font-black uppercase text-[9px] tracking-widest text-slate-400 mb-2 leading-none">Total Omzet</div>
                    <div className="text-xl font-black text-slate-600 tabular-nums">{formatCurrency(totalRevenue)}</div>
                 </div>
                 <div className="p-5 bg-rose-50 rounded-2xl border border-rose-100 flex flex-col justify-center">
                    <div className="font-black uppercase text-[9px] tracking-widest text-rose-400 mb-2 leading-none">Beban (HPP+BIAYA)</div>
                    <div className="text-xl font-black text-rose-500 tabular-nums">{formatCurrency(totalExpense + totalCost)}</div>
                 </div>
                 <div className="p-5 bg-emerald-500 rounded-2xl border border-emerald-600 flex flex-col justify-center shadow-lg shadow-emerald-100">
                    <div className="font-black uppercase text-[9px] tracking-widest text-white/70 mb-2 leading-none">Profit Bersih</div>
                    <div className="text-2xl font-black text-white tabular-nums">{formatCurrency(netProfit)}</div>
                 </div>
              </div>
           </div>

           <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
                <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px]">Log Transfer Rekening</h3>
                <ArrowRightLeft className="w-4 h-4 text-slate-300" />
              </div>
              
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
                    <tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Mutasi</th><th className="px-6 py-4 text-right">Nominal</th><th className="px-6 py-4">Catatan</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 font-bold">
                    {transfers.map((t: any) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 text-[10px] font-black uppercase tabular-nums">
                          {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase text-white", t.from === 'cash' ? "bg-emerald-500 shadow-sm shadow-emerald-100" : "bg-blue-500 shadow-sm shadow-blue-100")}>{t.from}</span>
                            <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                            <span className={cn("px-2 py-0.5 rounded text-[9px] font-black uppercase text-white", t.to === 'cash' ? "bg-emerald-500 shadow-sm shadow-emerald-100" : "bg-blue-500 shadow-sm shadow-blue-100")}>{t.to}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-black text-slate-800 text-sm tabular-nums">{formatCurrency(t.amount)}</td>
                        <td className="px-6 py-4 text-slate-400 uppercase text-[9px] font-bold tracking-tight">{t.note || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View for Transfers */}
              <div className="md:hidden divide-y divide-slate-50">
                {transfers.map((t: any) => (
                  <div key={t.id} className="p-4 active:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-[9px] text-slate-400 font-black uppercase tabular-nums">
                        {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="font-black text-slate-800 text-xs tabular-nums">{formatCurrency(t.amount)}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={cn("px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase text-white", t.from === 'cash' ? "bg-emerald-500" : "bg-blue-500")}>{t.from}</span>
                        <ArrowRightLeft className="w-3 h-3 text-slate-300" />
                        <span className={cn("px-2 py-0.5 rounded-[6px] text-[8px] font-black uppercase text-white", t.to === 'cash' ? "bg-emerald-500" : "bg-blue-500")}>{t.to}</span>
                      </div>
                      <div className="text-[9px] text-slate-400 font-bold uppercase truncate max-w-[150px] italic">{t.note || '-'}</div>
                    </div>
                  </div>
                ))}
              </div>

              {transfers.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center opacity-10">
                  <ArrowRightLeft className="w-16 h-16 mb-4" />
                  <div className="text-[10px] font-black uppercase tracking-[0.2em]">Tidak Ada Mutasi Transfer</div>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 space-y-4 md:space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
              <h3 className="font-black text-slate-800 uppercase tracking-widest text-[11px] mb-6">Chart Flow Dana</h3>
              <div className="w-full h-48 md:h-64 relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie 
                          data={[ 
                            { name: 'Modal', value: totalCost }, 
                            { name: 'Profit', value: netProfit > 0 ? netProfit : 0 }, 
                            { name: 'Expense', value: totalExpense } 
                          ]} 
                          innerRadius={45} 
                          outerRadius={75} 
                          paddingAngle={8} 
                          dataKey="value"
                        >
                          <Cell fill="#3b82f6" strokeWidth={0} />
                          <Cell fill="#10b981" strokeWidth={0} />
                          <Cell fill="#f43f5e" strokeWidth={0} />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            borderRadius: '16px', 
                            border: 'none', 
                            boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
                            fontSize: '10px',
                            fontWeight: '900',
                            textTransform: 'uppercase'
                          }} 
                        />
                    </PieChart>
                </ResponsiveContainer>
                {/* Center text for Pie Chart */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none translate-y-1">
                  <div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter leading-none mb-1">Profit %</div>
                  <div className="text-lg font-black text-slate-800 leading-none">
                    {totalRevenue > 0 ? Math.round((netProfit / totalRevenue) * 100) : 0}%
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap justify-center gap-3 mt-4 text-[9px] font-black uppercase tracking-widest">
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span> Modal</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full"></span> Laba</span>
                <span className="flex items-center gap-2"><span className="w-2.5 h-2.5 bg-rose-500 rounded-full"></span> Beban</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
               <h3 className="font-black text-slate-800 uppercase tracking-widest text-[10px] mb-4">Tips Cashflow</h3>
               <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <p className="text-[10px] font-bold text-emerald-800 uppercase leading-snug">Pastikan uang kas fisik sama dengan angka di dashboard setiap closing.</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                    <p className="text-[10px] font-bold text-blue-800 uppercase leading-snug">Gunakan fitur Transfer jika ingin menyetor uang kas ke bank.</p>
                  </div>
               </div>
            </div>
        </div>
      </div>

      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-8 bg-slate-900 flex justify-between items-center text-white">
                 <h3 className="font-black uppercase tracking-[0.1em] text-xs">Pindah Saldo</h3>
                 <button onClick={() => setShowTransferModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors"><Trash2 className="w-4 h-4 hidden" />X</button>
               </div>
               <form onSubmit={handleTransfer} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center mb-1">Sumber Dana Mutasi:</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setTransferData({...transferData, from: 'cash'})} className={cn("flex-1 py-4 rounded-[20px] border-4 font-black uppercase text-[10px] tracking-tight transition-all", transferData.from === 'cash' ? "bg-white border-blue-500 text-blue-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-40")}>Tunai (Cash)</button>
                      <button type="button" onClick={() => setTransferData({...transferData, from: 'bank'})} className={cn("flex-1 py-4 rounded-[20px] border-4 font-black uppercase text-[10px] tracking-tight transition-all", transferData.from === 'bank' ? "bg-white border-blue-500 text-blue-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-40")}>Transfer (Bank)</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Nilai Mutasi</label>
                    <input required autoFocus type="number" className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-2xl font-black border-none outline-none focus:ring-2 focus:ring-blue-500 text-center tabular-nums" placeholder="0" value={transferData.amount || ''} onChange={e => setTransferData({...transferData, amount: Number(e.target.value)})} />
                    <p className="text-[8px] text-center font-bold text-slate-400 mt-2 uppercase tracking-widest tabular-nums">
                      Tersedia: {formatCurrency(transferData.from === 'cash' ? cashBalance : bankBalance)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Catatan Mutasi (Optional)</label>
                    <textarea className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-blue-500 h-24 uppercase resize-none" placeholder="MISAL: SETOR TUNAI KE BANK" value={transferData.note} onChange={e => setTransferData({...transferData, note: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-3xl shadow-xl shadow-blue-100 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all">KONFIRMASI PINDAH SALDO</button>
               </form>
            </motion.div>
          </div>
        )}

        {showAdjustModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[40px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-8 bg-emerald-600 flex justify-between items-center text-white shrink-0">
                 <h3 className="font-black uppercase tracking-[0.1em] text-xs">Penyesuaian Saldo</h3>
                 <button onClick={() => setShowAdjustModal(false)} className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors">X</button>
               </div>
               <form onSubmit={handleAdjust} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-3">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block text-center mb-2">Akun Yang Disesuaikan:</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'cash', amount: cashBalance})} className={cn("flex-1 py-4 rounded-[20px] border-4 font-black uppercase text-[10px] tracking-tight transition-all", adjustData.type === 'cash' ? "bg-white border-emerald-500 text-emerald-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-40")}>Tunai</button>
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'bank', amount: bankBalance})} className={cn("flex-1 py-4 rounded-[20px] border-4 font-black uppercase text-[10px] tracking-tight transition-all", adjustData.type === 'bank' ? "bg-white border-emerald-500 text-emerald-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-40")}>Bank</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Saldo Fisik Terbaru</label>
                    <input required autoFocus type="number" min="0" className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-2xl font-black border-none outline-none focus:ring-2 focus:ring-emerald-500 text-center tabular-nums" placeholder="0" value={adjustData.amount} onChange={e => setAdjustData({...adjustData, amount: e.target.value === '' ? 0 : Number(e.target.value)})} />
                    <p className="text-[8px] text-center font-bold text-slate-400 mt-2 uppercase tracking-widest tabular-nums leading-none">
                      Nilai di Dashboard: {formatCurrency(adjustData.type === 'cash' ? cashBalance : bankBalance)}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tanggal Koreksi</label>
                    <input required type="date" className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-[11px] font-black border-none outline-none focus:ring-2 focus:ring-emerald-500" value={adjustData.date} onChange={e => setAdjustData({...adjustData, date: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Alasan Penyesuaian</label>
                    <textarea className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-emerald-500 h-24 uppercase resize-none" placeholder="MISAL: TIKET PARKIR BELUM DICATAT, SELISIH SALDO" value={adjustData.note} onChange={e => setAdjustData({...adjustData, note: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-3xl shadow-xl shadow-emerald-100 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all">EKSEKUSI ADJUSMENT</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
