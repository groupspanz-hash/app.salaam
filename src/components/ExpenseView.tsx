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
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-rose-100"><ReceiptText className="w-6 h-6" /></div>
          <div><div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Biaya</div><div className="text-2xl font-black text-slate-800">{formatCurrency(total)}</div></div>
        </div>
        
        <div className="md:col-span-2 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 w-full">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Mulai</label>
            <input type="date" className="w-full bg-slate-50 border-none rounded-xl text-xs px-3 py-2 outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="flex-1 w-full">
            <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sampai</label>
            <input type="date" className="w-full bg-slate-50 border-none rounded-xl text-xs px-3 py-2 outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-3 bg-slate-50 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>

        <div className="flex items-center justify-end">
           <button onClick={() => setShowModal({ name: '', amount: '', category: 'Operasional', description: '' })} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black shadow-xl shadow-slate-200 flex items-center gap-2 uppercase tracking-widest text-[10px] hover:scale-[1.02] transition-all"><Plus className="w-4 h-4" /> Catat Biaya</button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="p-6 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2 text-slate-800"><PieIcon className="text-slate-300" /> Riwayat Transaksi Keluar</h3></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b"><tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Nama Pengeluaran</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4 text-right">Jumlah</th><th className="px-6 py-4 text-right">Aksi</th></tr></thead>
            <tbody className="divide-y font-bold">
              {filteredExpenses.map((exp:any) => (
                <tr key={exp.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 text-[10px] text-slate-400 uppercase">{new Date(exp.date).toLocaleString()}</td>
                  <td className="px-6 py-4"><div className="text-sm text-slate-800">{exp.name}</div><div className="text-[10px] text-slate-300 italic">{exp.description}</div></td>
                  <td className="px-6 py-4"><span className="px-3 py-1 bg-slate-100 text-[10px] font-black text-slate-400 uppercase rounded-full tracking-widest">{exp.category}</span></td>
                  <td className="px-6 py-4 text-right font-black text-rose-500">{formatCurrency(exp.amount)}</td>
                  <td className="px-6 py-4 text-right whitespace-nowrap"><button onClick={() => { setExpenses(expenses.filter((e:any) => e.id !== exp.id)); setCashBalance((c:any) => c + exp.amount); }} className="p-2 bg-slate-50 text-slate-200 hover:text-rose-500 rounded-lg group-hover:opacity-100 opacity-0 transition-opacity"><Trash2 className="w-4 h-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredExpenses.length === 0 && <div className="py-32 text-center text-slate-200 font-black uppercase text-sm tracking-widest">Belum ada pengeluaran</div>}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden">
               <div className="p-6 bg-slate-900 border-b flex justify-between items-center text-white"><h3 className="font-black uppercase tracking-widest">Catat Biaya Baru</h3><button onClick={() => setShowModal(null)} className="p-2 hover:bg-white/10 rounded-full text-white/50"><Trash2 className="w-5 h-5" /></button></div>
               <form onSubmit={handleSave} className="p-8 space-y-6">
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Deskripsi Biaya</label><input required className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" value={showModal.name} onChange={e => setShowModal({...showModal, name: e.target.value})} /></div>
                 <div className="grid grid-cols-2 gap-6">
                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Jumlah Rupiah</label><input required type="number" className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" value={showModal.amount} onChange={e => setShowModal({...showModal, amount: e.target.value})} /></div>
                   <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kateogri</label><select className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm outline-none" value={showModal.category} onChange={e => setShowModal({...showModal, category: e.target.value})}>{EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                 </div>
                 <div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catatan (Optional)</label><textarea className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm h-24" value={showModal.description} onChange={e => setShowModal({...showModal, description: e.target.value})} /></div>
                 <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Kurangi Dari:</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setPaymentSource('cash')} className={cn("flex-1 py-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all", paymentSource === 'cash' ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-300")}>Cash</button>
                      <button type="button" onClick={() => setPaymentSource('bank')} className={cn("flex-1 py-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all", paymentSource === 'bank' ? "bg-white border-slate-900 text-slate-900 shadow-sm" : "bg-transparent border-transparent text-slate-300")}>Bank</button>
                    </div>
                  </div>
                 <button type="submit" className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest hover:scale-[1.02] transition-all">Simpan Pengeluaran</button>
               </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
