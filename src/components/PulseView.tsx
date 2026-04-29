import React, { useState } from 'react';
import { Smartphone, History, ArrowUpRight, Send } from 'lucide-react';
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
      setDigitalTopups([newTopup, ...digitalTopups]);
      
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

    setDigitalTopups([newTopup, ...digitalTopups]);
    
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
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-blue-600 p-6 rounded-3xl text-white shadow-xl shadow-blue-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Saldo Pulsa Digital</div>
              <div className="text-2xl font-black mb-4">{formatCurrency(pulseBalance)}</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-xl backdrop-blur-md text-[8px] font-black uppercase tracking-widest"><Smartphone className="w-3 h-3" /> Digital Asset</div>
            </div>
          </div>

          <div className="bg-purple-600 p-6 rounded-3xl text-white shadow-xl shadow-purple-100 relative overflow-hidden">
            <div className="relative z-10">
              <div className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Saldo Transfer Digital</div>
              <div className="text-2xl font-black mb-4">{formatCurrency(transferBalance)}</div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-xl backdrop-blur-md text-[8px] font-black uppercase tracking-widest"><Send className="w-3 h-3" /> Transfer Asset</div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2 text-slate-800"><ArrowUpRight className="text-blue-600" /> Transaksi Digital</h3>
            <div className="flex bg-slate-50 p-1 rounded-xl">
              <button 
                onClick={() => setTopupType('pulsa')}
                className={cn("px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", topupType === 'pulsa' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
              >
                Pulsa
              </button>
              <button 
                onClick={() => setTopupType('transfer')}
                className={cn("px-4 py-1.5 text-[9px] font-black uppercase rounded-lg transition-all", topupType === 'transfer' ? "bg-white text-purple-600 shadow-sm" : "text-slate-400")}
              >
                Transfer
              </button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Atur / Restock Saldo</h4>
              {userRole === 'owner' && (
                <button type="button" onClick={() => setShowAdjustModal(true)} className="px-3 py-1 bg-amber-50 text-amber-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-100 transition-colors">
                  Adjustment
                </button>
              )}
            </div>
            <form onSubmit={handleTopup} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nominal Saldo</label>
                <input required type="number" className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" placeholder="Contoh: 100000" value={amount} onChange={e => setAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metode / Provider</label>
                <input required className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" placeholder="Contoh: Telkomsel / DANA" value={provider} onChange={e => setProvider(e.target.value)} />
              </div>
              
              <div className="space-y-2 p-3 bg-slate-50 rounded-2xl mb-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center uppercase tracking-tighter">Beli Menggunakan:</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setPaymentSource('cash')} className={cn("flex-1 py-2 rounded-xl border-2 font-black uppercase text-[8px] tracking-tight transition-all", paymentSource === 'cash' ? "bg-white border-blue-500 text-blue-600 shadow-sm" : "bg-transparent border-transparent text-slate-300 opacity-60")}>Cash</button>
                  <button type="button" onClick={() => setPaymentSource('bank')} className={cn("flex-1 py-2 rounded-xl border-2 font-black uppercase text-[8px] tracking-tight transition-all", paymentSource === 'bank' ? "bg-white border-blue-500 text-blue-600 shadow-sm" : "bg-transparent border-transparent text-slate-300 opacity-60")}>Bank</button>
                </div>
              </div>

              <button 
                type="submit" 
                className={cn(
                  "w-full py-4 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest hover:scale-[1.02] transition-all text-xs",
                  topupType === 'pulsa' ? "bg-blue-600 shadow-blue-100" : "bg-purple-600 shadow-purple-100"
                )}
              >
                Top Up Restock
              </button>
            </form>
          </div>
        </div>
      </div>
      
      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2 text-slate-800"><History className="text-slate-300" /> Riwayat Digital</h3>
          <span className="text-[10px] font-black text-slate-300 uppercase">{digitalTopups.length} RIWAYAT</span>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-6 py-4">Waktu</th>
                <th className="px-6 py-4">Tipe</th>
                <th className="px-6 py-4">Nominal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y font-bold">
              {digitalTopups.map((tp: any) => (
                <tr key={tp.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-800">{tp.platform}</div>
                    <div className="text-[10px] text-slate-400 uppercase">{new Date(tp.date).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter",
                      tp.type === 'pulsa' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                    )}>
                      {tp.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={tp.isSale ? "text-rose-500" : "text-emerald-600"}>
                      {tp.isSale ? '-' : '+'}{formatCurrency(tp.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={cn(
                      "px-3 py-1 text-[10px] font-black uppercase rounded-full tracking-widest",
                      tp.isAdjustment ? "bg-amber-50 text-amber-600" : (tp.isSale ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600")
                    )}>
                      {tp.isAdjustment ? 'Adjust' : (tp.isSale ? 'Sale' : 'Restock')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {digitalTopups.length === 0 && <div className="py-20 text-center text-slate-200 uppercase font-black tracking-widest text-xs">Belum ada riwayat</div>}
        </div>
      </div>

      <AnimatePresence>
        {showAdjustModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 bg-amber-500 border-b flex justify-between items-center text-white shrink-0">
                 <h3 className="font-black uppercase tracking-widest text-sm">Adjustment Saldo Digital</h3>
                 <button onClick={() => setShowAdjustModal(false)} className="text-white/40 hover:text-white">X</button>
               </div>
               <form onSubmit={handleAdjust} className="p-8 space-y-6 overflow-y-auto no-scrollbar flex-1">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Pilih Saldo:</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'pulsa', amount: pulseBalance})} className={cn("flex-1 py-4 rounded-3xl border-4 font-black uppercase text-xs transition-all", adjustData.type === 'pulsa' ? "bg-white border-amber-500 text-amber-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-50")}>Pulsa</button>
                      <button type="button" onClick={() => setAdjustData({...adjustData, type: 'transfer', amount: transferBalance})} className={cn("flex-1 py-4 rounded-3xl border-4 font-black uppercase text-xs transition-all", adjustData.type === 'transfer' ? "bg-white border-amber-500 text-amber-600 shadow-xl" : "bg-transparent border-transparent text-slate-300 opacity-50")}>Transfer</button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo Fisik / Realita</label>
                    <input required type="number" min="0" className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-xl font-black border-none outline-none focus:ring-2 focus:ring-amber-500 text-center" value={adjustData.amount} onChange={e => setAdjustData({...adjustData, amount: e.target.value === '' ? 0 : Number(e.target.value)})} />
                    <p className="text-[10px] text-center font-bold text-slate-400 mt-2 uppercase tracking-widest">
                      Saldo Sistem: {formatCurrency(adjustData.type === 'pulsa' ? pulseBalance : transferBalance)}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</label>
                    <input required type="date" className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-sm font-black border-none outline-none focus:ring-2 focus:ring-amber-500" value={adjustData.date} onChange={e => setAdjustData({...adjustData, date: e.target.value})} />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan / Platform</label>
                    <textarea className="w-full bg-slate-50 px-6 py-4 rounded-3xl text-sm border-none outline-none focus:ring-2 focus:ring-amber-500 h-24" placeholder="Misal: DANA, Telkomsel, Penyesuaian minus" value={adjustData.note} onChange={e => setAdjustData({...adjustData, note: e.target.value})} />
                  </div>

                  <button type="submit" className="w-full py-5 bg-amber-500 text-white font-black rounded-3xl shadow-2xl shadow-amber-100 uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-95 transition-all">Update Saldo</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
