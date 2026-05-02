import React, { useState } from 'react';
import { ReceiptText, Trash2, Plus, PieChart as PieIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { EXPENSE_CATEGORIES } from '../constants';

export default function ExpenseView({ 
  expenses, 
  setExpenses, 
  cashBalance,
  setCashBalance,
  bankBalance,
  setBankBalance 
}: any) {
  const [showModal, setShowModal] = useState<any>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [paymentSource, setPaymentSource] = useState<'cash' | 'bank'>('cash');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showModal.name || !showModal.amount) return;
    const amount = Number(showModal.amount);
    setExpenses([{ id: Date.now().toString(), date: new Date().toISOString(), ...showModal, amount, paymentSource }, ...expenses]);
    
    if (paymentSource === 'cash') {
      setCashBalance((c:any) => c - amount);
    } else {
      setBankBalance((c:any) => c - amount);
    }
    
    setShowModal(null);
  };

  const filteredExpenses = expenses.filter((exp: any) => {
    const expDate = exp.date.split('T')[0];
    if (startDate && expDate < startDate) return false;
    if (endDate && expDate > endDate) return false;
    return true;
  });

  const total = filteredExpenses.reduce((acc:any, curr:any) => acc + curr.amount, 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-[20px] flex items-center justify-center shrink-0 border border-rose-100 shadow-sm shadow-rose-50">
            <ReceiptText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Total Pengeluaran</div>
            <div className="text-xl font-black text-slate-800 tabular-nums">{formatCurrency(total)}</div>
          </div>
        </div>
        
        <div className="sm:col-span-2 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-3">
          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Periode Awal</label>
              <input type="date" className="w-full bg-slate-50 border-none rounded-xl text-[10px] font-black px-3 py-2 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1 ml-1">Periode Akhir</label>
              <input type="date" className="w-full bg-slate-50 border-none rounded-xl text-[10px] font-black px-3 py-2 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="hidden sm:flex p-2.5 bg-slate-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all active:scale-90 border border-transparent hover:border-rose-100"><Trash2 className="w-4 h-4" /></button>
        </div>

        <button 
          onClick={() => setShowModal({ name: '', amount: '', category: 'Operasional', description: '' })} 
          className="bg-slate-900 text-white px-6 py-4 rounded-[24px] font-black shadow-xl shadow-slate-200 flex items-center justify-center gap-3 uppercase tracking-[0.2em] text-[10px] hover:bg-slate-800 active:scale-95 transition-all"
        >
          <Plus className="w-4 h-4" /> 
          Input Biaya
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 md:p-6 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
          <h3 className="font-black uppercase tracking-tighter text-sm flex items-center gap-2 text-slate-800">
            <PieIcon className="w-4 h-4 text-rose-500" /> 
            Riwayat Beban Biaya
          </h3>
          <span className="text-[9px] font-black bg-slate-100 text-slate-400 px-2.5 py-1 rounded-full uppercase tabular-nums">{filteredExpenses.length} ENTRY</span>
        </div>
        
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Waktu & Kategori</th>
                <th className="px-6 py-4">Deskripsi Biaya</th>
                <th className="px-6 py-4 text-right">Nominal</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {filteredExpenses.map((exp:any) => (
                <tr key={exp.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="text-[8px] text-slate-400 uppercase tracking-widest font-black leading-none mb-1">{new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                    <span className="px-2 py-0.5 bg-slate-100 text-[8px] font-black text-slate-500 uppercase rounded-md tracking-tighter border border-slate-200">{exp.category}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-[12px] text-slate-800 uppercase font-black mb-0.5">{exp.name}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-xs">{exp.description}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="text-sm font-black text-rose-500 tabular-nums">{formatCurrency(exp.amount)}</div>
                    <div className="text-[8px] font-black text-slate-300 uppercase tracking-widest">{exp.paymentSource || 'CASH'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => { setExpenses(expenses.filter((e:any) => e.id !== exp.id)); setCashBalance((c:any) => c + exp.amount); }} className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all active:scale-90"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-50">
          {filteredExpenses.map((exp: any) => (
            <motion.div layout key={exp.id} className="p-5 active:bg-slate-50 transition-colors">
              <div className="flex justify-between items-start mb-3">
                <div className="space-y-1">
                  <div className="text-[8px] text-slate-400 font-black uppercase tracking-widest mb-1">
                    {new Date(exp.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-[14px] font-black text-slate-800 uppercase leading-tight">{exp.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-[14px] font-black text-rose-500 tabular-nums leading-none mb-1">{formatCurrency(exp.amount)}</div>
                  <span className="text-[8px] font-black text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">{exp.category}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight truncate flex-1 pr-4 italic">
                  {exp.description || 'Tanpa catatan tambahan'}
                </div>
                <button onClick={() => { setExpenses(expenses.filter((e:any) => e.id !== exp.id)); setCashBalance((c:any) => c + exp.amount); }} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredExpenses.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-10">
            <PieIcon className="w-16 h-16 mb-4" />
            <div className="text-[10px] font-black uppercase tracking-[0.2em]">Belum Ada Pengeluaran</div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
               <div className="p-6 bg-slate-900 flex justify-between items-center text-white">
                 <h3 className="font-black uppercase tracking-[0.1em] text-xs">Catat Biaya</h3>
                 <button onClick={() => setShowModal(null)} className="p-2 hover:bg-white/10 rounded-full text-white/50 transition-colors"><Trash2 className="w-4 h-4" /></button>
               </div>
               <form onSubmit={handleSave} className="p-6 space-y-5 overflow-y-auto no-scrollbar flex-1">
                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Deskripsi Item</label>
                   <input required autoFocus className="w-full bg-slate-50 px-4 py-3 rounded-2xl text-[13px] font-black uppercase border-none outline-none focus:ring-2 focus:ring-slate-900 transition-all" placeholder="MISAL: BAYAR LISTRIK" value={showModal.name} onChange={e => setShowModal({...showModal, name: e.target.value})} />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Nominal</label>
                     <input required type="number" className="w-full bg-slate-50 px-4 py-3 rounded-2xl text-[13px] font-black border-none outline-none focus:ring-2 focus:ring-slate-900 transition-all tabular-nums" placeholder="0" value={showModal.amount} onChange={e => setShowModal({...showModal, amount: e.target.value})} />
                   </div>
                   <div className="space-y-1">
                     <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Kategori</label>
                     <select className="w-full bg-slate-50 px-4 py-3 rounded-2xl text-[13px] font-black border-none outline-none focus:ring-2 focus:ring-slate-900 transition-all uppercase" value={showModal.category} onChange={e => setShowModal({...showModal, category: e.target.value})}>
                       {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                     </select>
                   </div>
                 </div>

                 <div className="space-y-1">
                   <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Catatan Tambahan</label>
                   <textarea className="w-full bg-slate-50 px-4 py-3 rounded-2xl text-[12px] font-bold border-none outline-none focus:ring-2 focus:ring-slate-900 h-24 resize-none uppercase" placeholder="KETERANGAN OPSIONAL..." value={showModal.description} onChange={e => setShowModal({...showModal, description: e.target.value})} />
                 </div>

                 <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block text-center mb-1">Kurangi Dari Saldo:</label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setPaymentSource('cash')} className={cn("flex-1 py-3 rounded-[14px] border-2 font-black uppercase text-[9px] tracking-tight transition-all", paymentSource === 'cash' ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-300")}>Kas Toko</button>
                      <button type="button" onClick={() => setPaymentSource('bank')} className={cn("flex-1 py-3 rounded-[14px] border-2 font-black uppercase text-[9px] tracking-tight transition-all", paymentSource === 'bank' ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-300")}>Bank Transfer</button>
                    </div>
                  </div>

                 <button type="submit" className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-black rounded-2xl shadow-xl shadow-rose-200 uppercase tracking-[0.2em] text-[10px] active:scale-95 transition-all">SIMPAN PENGELUARAN</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
