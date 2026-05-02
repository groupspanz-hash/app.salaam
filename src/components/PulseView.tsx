import React, { useState } from 'react';
import { Smartphone, History, ArrowUpRight, Send, X } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

export default function PulseView({ 
  pulseBalance, 
  setPulseBalance, 
  transferBalance, 
  setTransferBalance, 
  digitalTopups, 
  setDigitalTopups, 
  cashBalance,
  setCashBalance,
  bankBalance,
  setBankBalance,
  setTransactions,
  userRole
}: any) {
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('');
  const [topupType, setTopupType] = useState<'pulsa' | 'transfer'>('pulsa');
  const [paymentSource, setPaymentSource] = useState<'cash' | 'bank'>('cash');
  
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustData, setAdjustData] = useState({ type: 'pulsa' as 'pulsa' | 'transfer', amount: 0, date: new Date().toISOString().split('T')[0], note: '' });

  const handleAdjust = (e: React.FormEvent) => {
    e.preventDefault();
    if (adjustData.amount < 0) return;

    const oldBalance = adjustData.type === 'pulsa' ? pulseBalance : transferBalance;
    const difference = adjustData.amount - oldBalance;
    
    if (difference !== 0) {
      const newTopup = { 
        id: `ADJ-${Date.now()}`, 
        date: new Date(adjustData.date).toISOString(), 
        amount: Math.abs(difference), 
        platform: adjustData.note || 'Penyesuaian Manual',
        type: adjustData.type,
        paymentSource: 'adjustment',
        isSale: difference < 0, // In riwayat, negative difference acts like a sale (red), positive like restock (green)
        isAdjustment: true,
        difference // store original difference
      };
      setDigitalTopups((prev: any) => [newTopup, ...prev]);
      
      if (adjustData.type === 'pulsa') {
         setPulseBalance(adjustData.amount);
      } else {
         setTransferBalance(adjustData.amount);
      }
    }
    
    setShowAdjustModal(false);
  };


  const handleTopup = (e: React.FormEvent) => {
    e.preventDefault();
    const val = Number(amount);
    if (val <= 0 || !provider) return;

    if (paymentSource === 'cash' && cashBalance < val) return alert('Saldo Cash tidak cukup!');
    if (paymentSource === 'bank' && bankBalance < val) return alert('Saldo Bank tidak cukup!');

    const newTopup = { 
      id: `TP-${Date.now()}`, 
      date: new Date().toISOString(), 
      amount: val, 
      platform: provider,
      type: topupType,
      paymentSource,
      isSale: false
    };

    setDigitalTopups((prev: any) => [newTopup, ...prev]);
    
    if (topupType === 'pulsa') {
      setPulseBalance((p: any) => p + val);
    } else {
      setTransferBalance((p: any) => p + val);
    }

    if (paymentSource === 'cash') {
      setCashBalance((c: any) => c - val);
    } else {
      setBankBalance((b: any) => b - val);
    }
    
    setAmount(''); 
    setProvider('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 min-h-0">
      <div className="space-y-4 md:space-y-6 flex flex-col min-h-0">
        <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4">
          <div className="bg-blue-600 p-4 md:p-6 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-500">
               <Smartphone className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Saldo Pulsa</div>
              <div className="text-lg md:text-2xl font-black mb-3 md:mb-4 tabular-nums">{formatCurrency(pulseBalance)}</div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-lg backdrop-blur-md text-[7px] md:text-[8px] font-black uppercase tracking-widest border border-white/10">
                <Smartphone className="w-2.5 h-2.5" /> Digital Asset
              </div>
            </div>
          </div>

          <div className="bg-purple-600 p-4 md:p-6 rounded-3xl text-white shadow-xl shadow-purple-100 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-20 h-20 opacity-10 translate-x-4 -translate-y-4 group-hover:scale-125 transition-transform duration-500">
               <Send className="w-full h-full" />
            </div>
            <div className="relative z-10">
              <div className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Saldo Transfer</div>
              <div className="text-lg md:text-2xl font-black mb-3 md:mb-4 tabular-nums">{formatCurrency(transferBalance)}</div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-white/10 rounded-lg backdrop-blur-md text-[7px] md:text-[8px] font-black uppercase tracking-widest border border-white/10">
                <Send className="w-2.5 h-2.5" /> Transfer Asset
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <h3 className="font-black uppercase tracking-tighter text-sm flex items-center gap-2 text-slate-800">
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              Restock Saldo
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
              <button 
                onClick={() => setTopupType('pulsa')}
                className={cn("flex-1 sm:flex-none px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", topupType === 'pulsa' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
              >Pulsa</button>
              <button 
                onClick={() => setTopupType('transfer')}
                className={cn("flex-1 sm:flex-none px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", topupType === 'transfer' ? "bg-white text-purple-600 shadow-sm" : "text-slate-400")}
              >Transfer</button>
            </div>
          </div>

          <form onSubmit={handleTopup} className="space-y-4">
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nominal Topup</label>
                <div className="relative">
                  <input required type="number" className="w-full bg-slate-50 px-4 py-2.5 border-none rounded-xl text-sm font-black tabular-nums focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="0" value={amount} onChange={e => setAmount(e.target.value)} />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">IDR</div>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Platform / Bukti</label>
                <input required className="w-full bg-slate-50 px-4 py-2.5 border-none rounded-xl text-sm font-black focus:ring-2 focus:ring-emerald-500 transition-all outline-none" placeholder="Contoh: DANA / MITRA" value={provider} onChange={e => setProvider(e.target.value)} />
              </div>
              
              <div className="p-3 bg-slate-50 rounded-2xl">
                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block text-center mb-2">Beli Menggunakan:</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentSource('cash')} className={cn("flex-1 py-2 rounded-xl border-2 font-black uppercase text-[8px] tracking-tight transition-all", paymentSource === 'cash' ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-300 opacity-60")}>Kas Toko</button>
                  <button type="button" onClick={() => setPaymentSource('bank')} className={cn("flex-1 py-2 rounded-xl border-2 font-black uppercase text-[8px] tracking-tight transition-all", paymentSource === 'bank' ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-300 opacity-60")}>Bank Transfer</button>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                className={cn(
                  "w-full py-4 text-white font-black rounded-2xl shadow-xl uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-95 transition-all text-[10px]",
                  topupType === 'pulsa' ? "bg-blue-600 shadow-blue-600/20" : "bg-purple-600 shadow-purple-600/20"
                )}
              >
                KONFIRMASI TOP UP
              </button>
            </div>

            {userRole === 'owner' && (
              <button 
                type="button" 
                onClick={() => setShowAdjustModal(true)} 
                className="w-full py-3 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl text-[8px] font-black uppercase tracking-[0.2em] transition-all border border-transparent hover:border-amber-100"
              >
                PENYESUAIAN SALDO (ADJUSTMENT)
              </button>
            )}
          </form>
        </div>
      </div>
      
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-0">
        <div className="p-4 md:p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h3 className="font-black uppercase tracking-tighter text-sm flex items-center gap-2 text-slate-800">
            <History className="w-4 h-4 text-slate-300" /> 
            Riwayat Digital
          </h3>
          <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full uppercase tabular-nums">{digitalTopups.length} TX</span>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 sticky top-0 z-10">
              <tr className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <th className="px-4 md:px-6 py-4">Informasi Transaksi</th>
                <th className="px-4 md:px-6 py-4 text-center">Tipe</th>
                <th className="px-4 md:px-6 py-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {digitalTopups.map((tp: any) => (
                <tr key={tp.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 md:px-6 py-4">
                    <div className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1 group-hover:text-blue-600 transition-colors">{tp.platform}</div>
                    <div className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">{new Date(tp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-center">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                      tp.type === 'pulsa' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {tp.type}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 text-right">
                    <div className={cn(
                      "text-[11px] font-black tabular-nums",
                      tp.isSale ? "text-rose-500" : "text-emerald-600"
                    )}>
                      {tp.isSale ? '-' : '+'}{formatCurrency(tp.amount)}
                    </div>
                    <div className={cn(
                      "text-[7px] font-black uppercase tracking-widest mt-0.5",
                      tp.isAdjustment ? "text-amber-500" : (tp.isSale ? "text-blue-400" : "text-emerald-400")
                    )}>
                      {tp.isAdjustment ? 'Adjustment' : (tp.isSale ? 'Out/Sale' : 'In/Restock')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {digitalTopups.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center opacity-10 grayscale">
               <History className="w-12 h-12 mb-4" />
               <div className="text-[10px] font-black uppercase tracking-[0.2em]">Belum ada riwayat</div>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showAdjustModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-6 bg-slate-900 flex justify-between items-center text-white shrink-0">
                 <h3 className="font-black uppercase tracking-[0.1em] text-xs">Adjustment Saldo</h3>
                 <button onClick={() => setShowAdjustModal(false)} className="p-1.5 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><X className="w-4 h-4" /></button>
               </div>
               <form onSubmit={handleAdjust} className="p-6 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-3">
                    <div className="flex bg-slate-100 p-1 rounded-xl">
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'pulsa', amount: pulseBalance})} className={cn("flex-1 py-3 rounded-lg font-black uppercase text-[10px] transition-all", adjustData.type === 'pulsa' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}>Pulsa</button>
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'transfer', amount: transferBalance})} className={cn("flex-1 py-3 rounded-lg font-black uppercase text-[10px] transition-all", adjustData.type === 'transfer' ? "bg-white text-purple-600 shadow-sm" : "text-slate-400")}>Transfer</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Saldo Realita (Fisik)</label>
                      <input required type="number" min="0" className="w-full bg-slate-50 px-6 py-4 rounded-2xl text-xl font-black border-none outline-none focus:ring-2 focus:ring-amber-500 text-center tabular-nums" value={adjustData.amount} onChange={e => setAdjustData({...adjustData, amount: e.target.value === '' ? 0 : Number(e.target.value)})} />
                      <div className="text-[9px] text-center font-black text-slate-300 mt-2 uppercase tracking-widest bg-slate-50 py-1 rounded-lg">
                        Sistem: {formatCurrency(adjustData.type === 'pulsa' ? pulseBalance : transferBalance)}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Keterangan Penyesuaian</label>
                      <textarea className="w-full bg-slate-50 px-4 py-3 rounded-xl text-xs font-bold border-none outline-none focus:ring-2 focus:ring-amber-500 h-20 resize-none uppercase" placeholder="MISAL: PENYESUAIAN SALDO MITRA / DANA" value={adjustData.note} onChange={e => setAdjustData({...adjustData, note: e.target.value})} />
                    </div>
                  </div>

                  <button type="submit" className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white font-black rounded-2xl shadow-xl shadow-amber-500/20 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all">SINKRONKAN SALDO</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
