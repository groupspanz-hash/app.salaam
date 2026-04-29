import React, { useState } from 'react';
import { Plus, Minus, Edit, Trash2, Package, Search, X, RefreshCcw, Check, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { Product, ProductVariant } from '../types';

export default function StockView({ 
  products, 
  setProducts, 
  setExpenses, 
  cashBalance,
  setCashBalance, 
  bankBalance,
  setBankBalance,
  setStockMovements,
  suppliers,
  setSuppliers,
  returnReasons,
  setReturnReasons,
  userRole
}: any) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [showModal, setShowModal] = useState<Partial<Product> | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [modalMode, setModalMode] = useState<'add' | 'reduce' | 'adjust' | 'new' | 'return'>('new');
  const [qtyInput, setQtyInput] = useState<number>(0);
  const [paymentSource, setPaymentSource] = useState<'cash' | 'bank'>('cash');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [selectedReturnReason, setSelectedReturnReason] = useState<string>('');

  const [showSupplierManager, setShowSupplierManager] = useState(false);
  const [showReasonManager, setShowReasonManager] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [editingReason, setEditingReason] = useState<any>(null);

  const filteredProducts = products.filter((p:any) => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase()));

  const sortedProducts = React.useMemo(() => {
    let sortableItems = [...filteredProducts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredProducts, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: string) => {
    if (!sortConfig || sortConfig.key !== key) return <ArrowUpDown className="w-3 h-3 ml-1 inline opacity-0 group-hover:opacity-50 transition-opacity" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-3 h-3 ml-1 inline text-emerald-500" /> : <ArrowDown className="w-3 h-3 ml-1 inline text-emerald-500" />;
  };

  const [variants, setVariants] = useState<ProductVariant[]>([]);

  const addVariant = () => {
    setVariants([...variants, { id: Date.now().toString(), productId: showModal?.id || '', name: '', stock: 0 }]);
  };

  const removeVariant = (id: string) => {
    setVariants(variants.filter(v => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    setVariants(variants.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const [variantAdjustments, setVariantAdjustments] = useState<Record<string, number>>({});

  const handleVariantAdjustment = (id: string, qty: number) => {
    setVariantAdjustments({ ...variantAdjustments, [id]: qty });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showModal) return;
    
    let expenseAmount = 0;
    const hasVariants = showModal.hasVariants;
    
    // Apply adjustments to variants if in add/reduce/return mode
    let updatedVariants = [...variants];
    if (showModal.id && (modalMode === 'add' || modalMode === 'reduce' || modalMode === 'return')) {
      updatedVariants = variants.map(v => {
        const adjust = variantAdjustments[v.id] || 0;
        const isReducing = modalMode === 'reduce' || modalMode === 'return';
        const newStock = isReducing ? Math.max(0, v.stock - adjust) : v.stock + adjust;
        return { ...v, stock: newStock };
      });
    }

    let finalStock = Number(showModal.stock || 0);

    if (hasVariants && updatedVariants.length > 0) {
      finalStock = updatedVariants.reduce((acc, v) => acc + Number(v.stock || 0), 0);
    }

    let movementType: 'in' | 'out' | 'adjustment' | 'return' = 'in';
    let movementQty = 0;

    if (modalMode === 'adjust' && showModal.id) {
      const existing = products.find((p:any) => p.id === showModal.id);
      if (existing && finalStock < existing.stock) {
        if (!window.confirm(`Anda akan mengurangi total stok "${existing.name}" dari ${existing.stock} ke ${finalStock}. Lanjutkan?`)) {
          return;
        }
      }
    }
    
    const productData = { ...showModal, stock: finalStock, variants: hasVariants ? updatedVariants : [] };

    if (showModal.id) {
       const existingProduct = products.find((p:any) => p.id === showModal.id);
       if (existingProduct) {
          if (hasVariants) {
             movementQty = finalStock - existingProduct.stock;
             movementType = movementQty > 0 ? 'in' : movementQty < 0 ? 'out' : 'adjustment';
             
             if (modalMode === 'add') {
               const actualTotalCost = updatedVariants.reduce((acc, v) => {
                 const initial = v.stock - (variantAdjustments[v.id] || 0);
                 const added = (v.stock - initial);
                 return acc + (added > 0 ? (added * (v.buyPrice || showModal.buyPrice || 0)) : 0);
               }, 0);
               
               if (movementQty > 0) {
                 logMovement(showModal.id, showModal.name!, 'in', movementQty, `Restock varian dari supplier`, selectedSupplierId);
                 if (actualTotalCost > 0) processExpense(showModal.name!, actualTotalCost);
               }
             } else if (modalMode === 'return') {
               if (movementQty < 0) {
                 logMovement(showModal.id, showModal.name!, 'return', movementQty, `Retur barang: ${selectedReturnReason}`, undefined, selectedReturnReason);
               }
             } else if (modalMode === 'reduce') {
               if (movementQty < 0) {
                 logMovement(showModal.id, showModal.name!, 'out', movementQty, `Pengurangan stok varian (Rusak/Manual)`);
               }
             } else if (movementQty !== 0) {
               logMovement(showModal.id, showModal.name!, 'adjustment', movementQty, `Penyesuaian stok varian manual`);
             }
          } else {
            if (modalMode === 'adjust') {
               movementQty = finalStock - existingProduct.stock;
               movementType = 'adjustment';
               logMovement(showModal.id, showModal.name!, movementType, movementQty, `Penyesuaian data/stok manual`);
            } else if (modalMode === 'add') {
               movementQty = qtyInput;
               finalStock = existingProduct.stock + qtyInput;
               expenseAmount = qtyInput * (showModal.buyPrice || 0);
               movementType = 'in';
               logMovement(showModal.id, showModal.name!, movementType, movementQty, `Restock penambahan dari supplier`, selectedSupplierId);
               processExpense(showModal.name!, expenseAmount);
            } else if (modalMode === 'return') {
               movementQty = -qtyInput;
               finalStock = Math.max(0, existingProduct.stock - qtyInput);
               movementType = 'return';
               logMovement(showModal.id, showModal.name!, movementType, movementQty, `Retur barang: ${selectedReturnReason}`, undefined, selectedReturnReason);
            } else if (modalMode === 'reduce') {
               movementQty = -qtyInput;
               finalStock = Math.max(0, existingProduct.stock - qtyInput);
               movementType = 'out';
               logMovement(showModal.id, showModal.name!, movementType, movementQty, `Pengurangan stok (Rusak/Manual)`);
            }
          }
       }
       setProducts((prev: any) => prev.map((p:any) => p.id === showModal.id ? { ...productData, stock: finalStock } : p));
    } else {
       movementQty = hasVariants ? finalStock : Number(showModal.stock || 0);
       expenseAmount = hasVariants && updatedVariants.length > 0 
         ? updatedVariants.reduce((acc, v) => acc + (v.stock * (v.buyPrice || showModal.buyPrice || 0)), 0)
         : movementQty * (showModal.buyPrice || 0);
         
       const newId = Date.now().toString();
       
       const finalVariants = hasVariants ? updatedVariants.map(v => ({ ...v, productId: newId })) : [];
       
       setProducts((prev: any) => [...prev, { ...productData, id: newId, stock: finalStock, variants: finalVariants }]);
       logMovement(newId, showModal.name!, 'in', movementQty, `Stok awal barang baru`);
       if (expenseAmount > 0) processExpense(showModal.name!, expenseAmount);
    }

    setShowModal(null);
    setQtyInput(0);
    setVariants([]);
    setVariantAdjustments({});
    setSelectedSupplierId('');
    setSelectedReturnReason('');
  };

  const logMovement = (productId: string, productName: string, type: 'in' | 'out' | 'adjustment' | 'return', quantity: number, description: string, supplierId?: string, returnReason?: string) => {
    if (quantity === 0) return;
    const newMovement = {
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      productId,
      productName,
      type,
      quantity,
      date: new Date().toISOString(),
      description,
      supplierId,
      returnReason
    };
    setStockMovements((prev: any) => [newMovement, ...prev]);
  };

  const processExpense = (name: string, amount: number) => {
    if (amount > 0) {
      const newExpense = {
        id: `EXP-STOCK-${Date.now()}`,
        date: new Date().toISOString(),
        name: `Restok: ${name}`,
        category: 'Belanja barang',
        amount: amount,
        description: `Otomatis dari penambahan stok barang (${paymentSource})`
      };
      setExpenses((prev: any) => [newExpense, ...prev]);
      if (paymentSource === 'cash') {
        setCashBalance((prev: any) => prev - amount);
      } else {
        setBankBalance((prev: any) => prev - amount);
      }
    }
  };

  const handleDelete = (product: Product) => {
    setProducts((prev: any) => prev.filter((item:any) => item.id !== product.id));
    logMovement(product.id, product.name, 'adjustment', -product.stock, `Barang dihapus dari sistem`);
    setConfirmDelete(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
           <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
            <input type="text" placeholder="Cari kode atau nama..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <button onClick={() => setShowSupplierManager(true)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Kelola Supplier">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={() => setShowReasonManager(true)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors" title="Kelola Alasan Retur">
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
        <button onClick={() => {
          setShowModal({ name: '', code: '', category: '', buyPrice: 0, sellPrice: 0, stock: 0, minStock: 5 });
          setModalMode('new');
          setQtyInput(0);
        }} className="w-full sm:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-xl shadow-slate-100 uppercase text-xs tracking-widest transition-transform hover:scale-105 active:scale-95"><Plus className="w-4 h-4" /> Barang Baru</button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 group transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center">Nama Barang {getSortIcon('name')}</div>
                </th>
                <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 group transition-colors" onClick={() => requestSort('category')}>
                  <div className="flex items-center">Kategori {getSortIcon('category')}</div>
                </th>
                <th className="px-6 py-4 text-right cursor-pointer hover:bg-slate-100 group transition-colors" onClick={() => requestSort('sellPrice')}>
                  <div className="flex items-center justify-end">Harga Jual {getSortIcon('sellPrice')}</div>
                </th>
                <th className="px-6 py-4 text-center cursor-pointer hover:bg-slate-100 group transition-colors" onClick={() => requestSort('stock')}>
                  <div className="flex items-center justify-center">Stok {getSortIcon('stock')}</div>
                </th>
                <th className="px-6 py-4 text-right">Aksi Stok / Produk</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sortedProducts.map((p:any) => (
                <tr key={p.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 pb-2 align-top">
                    <div className="flex items-start gap-3">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", p.stock <= p.minStock ? "bg-rose-100 text-rose-500" : "bg-slate-100 text-slate-300")}>
                        <Package className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-800 truncate">{p.name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <div className="text-[10px] font-black text-slate-400 uppercase">{p.code}</div>
                          {p.hasVariants && (
                            <span className="bg-emerald-100 text-emerald-600 text-[8px] font-black px-1.5 py-0.5 rounded uppercase leading-none">Varian</span>
                          )}
                        </div>
                        {p.hasVariants && p.variants && p.variants.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.variants.map((v: any) => (
                              <span key={v.id} className={cn(
                                "text-[9px] font-bold px-2 py-0.5 rounded-lg border",
                                v.stock <= 0 ? "bg-rose-50 text-rose-400 border-rose-100" : "bg-slate-50 text-slate-400 border-slate-100"
                              )}>
                                {v.name}: <span className={v.stock <= 2 ? "text-rose-500" : "text-slate-600"}>{v.stock}</span>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 uppercase font-bold text-slate-400 text-[10px] tracking-widest">{p.category}</td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600 text-sm">{formatCurrency(p.sellPrice)}</td>
                  <td className="px-6 py-4 text-center font-black">
                    <div className={cn("inline-block px-3 py-1 rounded-full text-xs", p.stock <= p.minStock ? "bg-rose-100 text-rose-600" : "bg-slate-100 text-slate-600")}>{p.stock}</div>
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <div className="flex justify-end gap-2 transition-opacity">
                      <button 
                        onClick={() => {
                          setShowModal(p);
                          setVariants(p.variants || []);
                          setModalMode('add');
                          setSelectedSupplierId('');
                        }} 
                        className="px-2.5 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all shadow-sm flex items-center gap-1 font-black uppercase text-[8px]" 
                        title="Tambah Stok"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Restok</span>
                      </button>

                      <button 
                        onClick={() => {
                          setShowModal(p);
                          setVariants(p.variants || []);
                          setModalMode('return');
                          setSelectedReturnReason('');
                        }} 
                        className="px-2.5 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg transition-all shadow-sm flex items-center gap-1 font-black uppercase text-[8px]" 
                        title="Retur Barang"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        <span>Retur</span>
                      </button>

                      <button 
                        onClick={() => {
                          setShowModal(p);
                          setVariants(p.variants || []);
                          setModalMode('reduce');
                        }} 
                        className="px-2.5 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm flex items-center gap-1 font-black uppercase text-[8px]" 
                        title="Kurangi Stok (Rusak/Lainnya)"
                      >
                        <Minus className="w-3 h-3" />
                        <span>Manual</span>
                      </button>
                      
                      <button 
                        onClick={() => {
                          setShowModal(p);
                          setVariants(p.variants || []);
                          setModalMode('adjust');
                        }} 
                        className="px-2.5 py-1.5 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all shadow-sm flex items-center gap-1 font-black uppercase text-[8px]" 
                        title="Sesuaikan / Edit"
                      >
                        <RefreshCcw className="w-3 h-3" />
                        <span>Update</span>
                      </button>
                      
                      <button onClick={() => setConfirmDelete(p)} className="p-1.5 bg-slate-50 text-slate-400 hover:bg-rose-500 hover:text-white rounded-lg transition-all shadow-sm" title="Hapus"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-10 max-w-sm w-full text-center shadow-2xl">
              <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-rose-100">
                <Trash2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2 uppercase tracking-tight">Hapus Barang?</h3>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed font-medium">Apakah Anda yakin ingin menghapus <span className="text-slate-800 font-bold">{confirmDelete.name}</span>? Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex gap-4">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 py-4 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 rounded-2xl transition-colors">Batal</button>
                <button onClick={() => handleDelete(confirmDelete)} className="flex-1 py-4 bg-rose-500 text-white font-black uppercase text-[10px] tracking-widest rounded-2xl shadow-xl shadow-rose-100 hover:scale-105 active:scale-95 transition-all">Hapus Sekarang</button>
              </div>
            </motion.div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
               <div className="p-6 border-b flex justify-between items-center shrink-0">
                 <h3 className="font-black text-slate-800 uppercase tracking-widest">
                   {showModal.id ? (
                     modalMode === 'add' ? `Tambah Stok: ${showModal.name}` :
                     modalMode === 'reduce' ? `Kurangi Stok: ${showModal.name}` :
                     `Penyesuaian: ${showModal.name}`
                   ) : 'Tambah Barang Baru'}
                 </h3>
                 <button onClick={() => setShowModal(null)} className="p-2 hover:bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
               </div>
               <form onSubmit={handleSave} className="p-8 space-y-4 grid grid-cols-2 gap-x-6 overflow-y-auto no-scrollbar">
                 <div className="col-span-2 space-y-1 relative">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nama Barang</label>
                   <input required className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" value={showModal.name} onChange={e => setShowModal({...showModal, name: e.target.value})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                   
                   {modalMode === 'new' && showModal.name && showModal.name.length > 2 && products.some((p:any) => p.name.toLowerCase().includes(showModal.name!.toLowerCase())) && (
                     <div className="absolute top-full left-0 right-0 z-10 bg-white border border-slate-100 rounded-2xl shadow-xl mt-1 overflow-hidden">
                       {products.filter((p:any) => p.name.toLowerCase().includes(showModal.name!.toLowerCase())).slice(0, 3).map((p:any) => (
                         <button key={p.id} type="button" onClick={() => setShowModal(p)} className="w-full px-4 py-3 text-left hover:bg-slate-50 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-800">{p.name}</span>
                            <span className="text-[10px] font-black text-emerald-500 uppercase">Pilih (Sudah Ada)</span>
                         </button>
                       ))}
                     </div>
                   )}
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kode</label>
                   <input required className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" value={showModal.code} onChange={e => setShowModal({...showModal, code: e.target.value})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Kategori</label>
                   <input required className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" value={showModal.category} onChange={e => setShowModal({...showModal, category: e.target.value})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Beli</label>
                   <input required type="number" disabled={showModal.hasVariants} className={cn("w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm", showModal.hasVariants ? "opacity-50 cursor-not-allowed" : "")} value={showModal.buyPrice} onChange={e => setShowModal({...showModal, buyPrice: Number(e.target.value)})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Jual</label>
                   <input required type="number" disabled={showModal.hasVariants} className={cn("w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm", showModal.hasVariants ? "opacity-50 cursor-not-allowed" : "")} value={showModal.sellPrice} onChange={e => setShowModal({...showModal, sellPrice: Number(e.target.value)})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                 </div>

                 <div className="col-span-2 py-2 flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        const newVal = !showModal.hasVariants;
                        setShowModal({ ...showModal, hasVariants: newVal });
                        if (newVal && variants.length === 0) {
                          setVariants([{ id: 'v1', productId: showModal.id || '', name: 'Varian 1', stock: showModal.stock || 0 }]);
                        }
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all",
                        showModal.hasVariants ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                      )}
                    >
                      {showModal.hasVariants ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      Memiliki Varian
                    </button>
                    <span className="text-[10px] font-bold text-slate-400">Aktifkan jika barang memiliki pilihan warna/ukuran/tipe</span>
                 </div>

                 {showModal.hasVariants && (
                   <div className="col-span-2 space-y-4 bg-slate-50 p-6 rounded-3xl border border-slate-100 mb-4">
                     <div className="flex justify-between items-center">
                       <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daftar Varian</h4>
                       {(!showModal.id || modalMode === 'adjust') && (
                         <button type="button" onClick={addVariant} className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase shadow-sm"><Plus className="w-3 h-3" /> Tambah Varian</button>
                       )}
                     </div>
                     <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                        {variants.map((v, idx) => (
                          <div key={v.id} className="flex flex-col gap-2 bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
                            <div className="flex gap-2 items-end">
                               <div className="flex-1 space-y-1">
                                 <label className="text-[8px] font-black text-slate-300 uppercase">Nama Varian</label>
                                 <input disabled={showModal.id !== undefined && modalMode !== 'adjust'} className={cn("w-full bg-slate-50 px-3 py-2 rounded-lg text-xs", showModal.id && modalMode !== 'adjust' ? "opacity-50" : "")} value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)} placeholder="Misal: Merah, Size L" />
                               </div>
                               <div className="w-24 space-y-1">
                                 <label className="text-[8px] font-black text-slate-300 uppercase">Harga Beli</label>
                                 <input disabled={showModal.id !== undefined && modalMode !== 'adjust'} type="number" className={cn("w-full bg-slate-50 px-3 py-2 rounded-lg text-xs", showModal.id && modalMode !== 'adjust' ? "opacity-50" : "")} value={v.buyPrice || ''} onChange={e => updateVariant(v.id, 'buyPrice', Number(e.target.value))} placeholder={showModal.buyPrice?.toString()} />
                               </div>
                               <div className="w-24 space-y-1">
                                 <label className="text-[8px] font-black text-slate-300 uppercase">Harga Jual</label>
                                 <input disabled={showModal.id !== undefined && modalMode !== 'adjust'} type="number" className={cn("w-full bg-slate-50 px-3 py-2 rounded-lg text-xs", showModal.id && modalMode !== 'adjust' ? "opacity-50" : "")} value={v.sellPrice || ''} onChange={e => updateVariant(v.id, 'sellPrice', Number(e.target.value))} placeholder={showModal.sellPrice?.toString()} />
                               </div>
                               {(!showModal.id || modalMode === 'adjust') && (
                                 <button type="button" onClick={() => removeVariant(v.id)} className="p-2.5 text-rose-300 hover:text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                               )}
                            </div>
                            
                            <div className="flex items-center gap-2 mt-1 p-2 bg-slate-50 rounded-xl">
                              {(!showModal.id || modalMode === 'adjust') ? (
                                <div className="flex-1 space-y-1">
                                 <label className="text-[8px] font-black text-slate-400 uppercase">Total Stok Baru</label>
                                 <input type="number" className="w-full bg-white px-3 py-2 rounded-lg text-xs font-bold border border-slate-100" value={v.stock} onChange={e => updateVariant(v.id, 'stock', Number(e.target.value))} />
                                </div>
                              ) : (
                                <>
                                  <div className="flex-1">
                                    <div className="text-[8px] font-black text-slate-400 uppercase">Stok Saat Ini</div>
                                    <div className="text-sm font-black text-slate-700">{v.stock}</div>
                                  </div>
                                  <div className="w-28 space-y-1">
                                    <label className={cn("text-[8px] font-black uppercase", modalMode === 'add' ? "text-emerald-500" : "text-rose-500")}>
                                      {modalMode === 'add' ? '+ Tambah' : '- Kurangi'}
                                    </label>
                                    <input 
                                      type="number" 
                                      min="0"
                                      max={modalMode === 'reduce' ? v.stock : undefined}
                                      className={cn("w-full bg-white px-3 py-2 rounded-lg text-xs font-bold border", modalMode === 'add' ? "border-emerald-200" : "border-rose-200")} 
                                      value={variantAdjustments[v.id] || ''} 
                                      onChange={e => handleVariantAdjustment(v.id, Number(e.target.value))} 
                                      placeholder="0"
                                    />
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                 )}
                 
                  {showModal.id && (modalMode === 'add' || modalMode === 'reduce' || modalMode === 'return') && (
                    <div className={cn(
                      "col-span-2 p-6 rounded-3xl border flex flex-col gap-6",
                      modalMode === 'add' ? "bg-emerald-50 border-emerald-100" : 
                      modalMode === 'return' ? "bg-orange-50 border-orange-100" :
                      "bg-rose-50 border-rose-100"
                    )}>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className={cn("text-[10px] font-black uppercase tracking-widest", modalMode === 'add' ? "text-emerald-600" : modalMode === 'return' ? "text-orange-600" : "text-rose-600")}>Stok Saat Ini</div>
                          <div className={cn("text-2xl font-black", modalMode === 'add' ? "text-emerald-800" : modalMode === 'return' ? "text-orange-800" : "text-rose-800")}>{showModal.stock}</div>
                        </div>
                        <div className="text-right">
                          <label className={cn("text-[10px] font-black uppercase tracking-widest", modalMode === 'add' ? "text-emerald-600" : modalMode === 'return' ? "text-orange-600" : "text-rose-600")}>
                            {modalMode === 'add' ? 'Tambah Jumlah' : 'Kurangi Jumlah'}
                          </label>
                          <input 
                            autoFocus 
                            required 
                            type="number" 
                            className={cn(
                              "w-32 bg-white px-4 py-3 border rounded-2xl text-lg font-black text-center mt-1 outline-none focus:ring-2",
                              modalMode === 'add' ? "border-emerald-200 focus:ring-emerald-500" : 
                              modalMode === 'return' ? "border-orange-200 focus:ring-orange-500" :
                              "border-rose-200 focus:ring-rose-500"
                            )} 
                            value={qtyInput || ''} 
                            onChange={e => setQtyInput(Number(e.target.value))} 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {modalMode === 'add' && (
                    <div className="col-span-2 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pilih Supplier</label>
                        <select required className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm outline-none" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}>
                          <option value="">-- Pilih Supplier --</option>
                          {suppliers.map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="pt-4 border-t border-emerald-100">
                        <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block mb-3 text-center">Sumber Pembelian (Restock)</label>
                        <div className="flex gap-4">
                          <button type="button" onClick={() => setPaymentSource('cash')} className={cn("flex-1 py-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all", paymentSource === 'cash' ? "bg-white border-emerald-500 text-emerald-600 shadow-sm" : "bg-emerald-100/50 border-transparent text-emerald-400 opacity-60")}>Cash ({formatCurrency(cashBalance)})</button>
                          <button type="button" onClick={() => setPaymentSource('bank')} className={cn("flex-1 py-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-widest transition-all", paymentSource === 'bank' ? "bg-white border-emerald-500 text-emerald-600 shadow-sm" : "bg-emerald-100/50 border-transparent text-emerald-400 opacity-60")}>Bank ({formatCurrency(bankBalance)})</button>
                        </div>
                      </div>
                    </div>
                  )}

                  {modalMode === 'return' && (
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest">Alasan Retur</label>
                      <select required className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm outline-none" value={selectedReturnReason} onChange={e => setSelectedReturnReason(e.target.value)}>
                        <option value="">-- Pilih Alasan --</option>
                        {returnReasons.map((r: any) => (
                          <option key={r.id} value={r.label}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                 
                 {(!showModal.id || modalMode === 'adjust') && (
                   <>
                     <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                         {modalMode === 'adjust' ? 'Ubah Total Stok' : 'Stok Awal'}
                       </label>
                       <input required type="number" disabled={showModal.hasVariants} className={cn("w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm font-bold", showModal.hasVariants ? "opacity-50 cursor-not-allowed" : "")} value={showModal.hasVariants ? variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) : showModal.stock} onChange={e => setShowModal({...showModal, stock: Number(e.target.value)})} />
                     </div>
                     <div className="space-y-1">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Minimum Stok</label>
                       <input required type="number" className="w-full bg-slate-50 px-4 py-3 border-none rounded-2xl text-sm" value={showModal.minStock} onChange={e => setShowModal({...showModal, minStock: Number(e.target.value)})} />
                     </div>
                   </>
                 )}
                 
                 <div className="col-span-2 pt-6">
                   <button type="submit" className={cn(
                     "w-full py-4 text-white font-black rounded-2xl shadow-xl uppercase tracking-widest transition-all hover:scale-[1.02]",
                     modalMode === 'add' ? "bg-emerald-500 shadow-emerald-100" : 
                     modalMode === 'reduce' ? "bg-rose-500 shadow-rose-100" :
                     modalMode === 'adjust' ? "bg-blue-500 shadow-blue-100" :
                     "bg-slate-900 shadow-slate-100"
                   )}>
                     {showModal.id ? (
                       modalMode === 'add' ? 'Konfirmasi Penambahan' : 
                       modalMode === 'reduce' ? 'Konfirmasi Pengurangan' :
                       'Update Data & Stok'
                     ) : 'Simpan Barang Baru'}
                   </button>
                 </div>
               </form>
            </motion.div>
          </div>
        )}
        {showSupplierManager && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-8 max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Manajemen Supplier</h3>
                <button onClick={() => setShowSupplierManager(false)} className="p-2 hover:bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (editingSupplier) {
                    if (editingSupplier.id) {
                      setSuppliers(suppliers.map((s: any) => s.id === editingSupplier.id ? editingSupplier : s));
                    } else {
                      setSuppliers([...suppliers, { ...editingSupplier, id: Date.now().toString() }]);
                    }
                    setEditingSupplier(null);
                  }
                }} className="space-y-3 bg-slate-50 p-6 rounded-3xl">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{editingSupplier?.id ? 'Edit Supplier' : 'Tambah Supplier'}</h4>
                  <input required placeholder="Nama Supplier" className="w-full bg-white px-4 py-2.5 rounded-xl text-sm border-none shadow-sm" value={editingSupplier?.name || ''} onChange={e => setEditingSupplier({ ...editingSupplier, name: e.target.value })} />
                  <input required placeholder="Telepon" className="w-full bg-white px-4 py-2.5 rounded-xl text-sm border-none shadow-sm" value={editingSupplier?.phone || ''} onChange={e => setEditingSupplier({ ...editingSupplier, phone: e.target.value })} />
                  <input required placeholder="Alamat" className="w-full bg-white px-4 py-2.5 rounded-xl text-sm border-none shadow-sm" value={editingSupplier?.address || ''} onChange={e => setEditingSupplier({ ...editingSupplier, address: e.target.value })} />
                  <div className="flex gap-2 pt-2">
                    {editingSupplier && (
                      <button type="button" onClick={() => setEditingSupplier(null)} className="flex-1 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Batal</button>
                    )}
                    <button type="submit" className="flex-2 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg">{editingSupplier?.id ? 'Update' : 'Simpan'}</button>
                  </div>
                  {!editingSupplier && (
                    <button type="button" onClick={() => setEditingSupplier({ name: '', phone: '', address: '' })} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">+ Baru</button>
                  )}
                </form>

                <div className="overflow-y-auto pr-2 no-scrollbar">
                   <div className="space-y-2">
                      {suppliers.map((s: any) => (
                        <div key={s.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex justify-between items-center group shadow-sm hover:shadow-md transition-all">
                           <div>
                              <div className="text-sm font-bold text-slate-800">{s.name}</div>
                              <div className="text-[10px] text-slate-400 font-medium">{s.phone} • {s.address}</div>
                           </div>
                           <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => setEditingSupplier(s)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                              <button onClick={() => setSuppliers(suppliers.filter((item: any) => item.id !== s.id))} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showReasonManager && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-6">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Alasan Retur</h3>
                <button onClick={() => setShowReasonManager(false)} className="p-2 hover:bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
              </div>
              
              <div className="space-y-6">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  if (editingReason) {
                    if (editingReason.id) {
                      setReturnReasons(returnReasons.map((r: any) => r.id === editingReason.id ? editingReason : r));
                    } else {
                      setReturnReasons([...returnReasons, { ...editingReason, id: Date.now().toString() }]);
                    }
                    setEditingReason(null);
                  }
                }} className="space-y-3 bg-slate-50 p-6 rounded-3xl">
                  <input required placeholder="Contoh: Barang Rusak" className="w-full bg-white px-4 py-2.5 rounded-xl text-sm border-none shadow-sm" value={editingReason?.label || ''} onChange={e => setEditingReason({ ...editingReason, label: e.target.value })} />
                  <div className="flex gap-2">
                    {editingReason && (
                      <button type="button" onClick={() => setEditingReason(null)} className="flex-1 py-3 text-slate-400 font-bold text-xs uppercase tracking-widest">Batal</button>
                    )}
                    <button type="submit" className="flex-2 py-3 bg-slate-900 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-lg">{editingReason?.id ? 'Update' : 'Simpan'}</button>
                  </div>
                  {!editingReason && (
                    <button type="button" onClick={() => setEditingReason({ label: '' })} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-slate-100 transition-all">+ Baru</button>
                  )}
                </form>

                <div className="space-y-2 overflow-y-auto max-h-60 no-scrollbar">
                  {returnReasons.map((r: any) => (
                    <div key={r.id} className="p-4 bg-white border border-slate-100 rounded-xl flex justify-between items-center group">
                       <div className="text-sm font-bold text-slate-700">{r.label}</div>
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditingReason(r)} className="p-2 text-blue-400 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                          <button onClick={() => setReturnReasons(returnReasons.filter((item: any) => item.id !== r.id))} className="p-2 text-rose-400 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
