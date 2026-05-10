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

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);
  const categories = React.useMemo(() => Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean).sort(), [products]);

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
               const restockItems: any[] = [];
               const addedDetails: string[] = [];
               
               const actualTotalCost = updatedVariants.reduce((acc, v) => {
                 const initial = v.stock - (variantAdjustments[v.id] || 0);
                 const added = (v.stock - initial);
                 if (added > 0) {
                    restockItems.push({ variantId: v.id, qty: added });
                    addedDetails.push(`${v.name} (${added} Unit)`);
                 }
                 return acc + (added > 0 ? (added * (v.buyPrice || showModal.buyPrice || 0)) : 0);
               }, 0);
               
               if (movementQty > 0) {
                 logMovement(showModal.id, showModal.name!, 'in', movementQty, `Restock varian dari supplier`, selectedSupplierId);
                 if (actualTotalCost > 0) {
                   const detailStr = addedDetails.join(', ');
                   processExpense(
                     showModal.name!, 
                     actualTotalCost, 
                     `RESTOK VARIAN: ${detailStr}`, 
                     { productId: showModal.id, isRestock: true, items: restockItems }
                   );
                 }
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
               processExpense(
                 showModal.name!, 
                 expenseAmount, 
                 `RESTOK: ${movementQty} UNIT`,
                 { productId: showModal.id, isRestock: true, items: [{ qty: movementQty }] }
               );
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
       
       let restockDetail = '';
       let restockMetadataItems: any[] = [];
       
       if (hasVariants) {
         const details = updatedVariants.filter(v => v.stock > 0).map(v => {
           restockMetadataItems.push({ variantId: v.id, qty: v.stock });
           return `${v.name} (${v.stock} Unit)`;
         });
         restockDetail = `STOK AWAL VARIAN: ${details.join(', ')}`;
       } else {
         restockDetail = `STOK AWAL: ${movementQty} UNIT`;
         restockMetadataItems = [{ qty: movementQty }];
       }

       expenseAmount = hasVariants && updatedVariants.length > 0 
         ? updatedVariants.reduce((acc, v) => acc + (v.stock * (v.buyPrice || showModal.buyPrice || 0)), 0)
         : movementQty * (showModal.buyPrice || 0);
         
       const newId = Date.now().toString();
       
       const finalVariants = hasVariants ? updatedVariants.map(v => ({ ...v, productId: newId })) : [];
       
       setProducts((prev: any) => [...prev, { ...productData, id: newId, stock: finalStock, variants: finalVariants }]);
       logMovement(newId, showModal.name!, 'in', movementQty, `Stok awal barang baru`);
       if (expenseAmount > 0) {
         processExpense(
           showModal.name!, 
           expenseAmount, 
           restockDetail, 
           { productId: newId, isRestock: true, items: restockMetadataItems }
         );
       }
    }

    setShowModal(null);
    setQtyInput(0);
    setVariants([]);
    setVariantAdjustments({});
    setSelectedSupplierId('');
    setSelectedReturnReason('');
  };

  const logMovement = (productId: string, productName: string, type: 'in' | 'out' | 'adjustment' | 'return', quantity: number, description: string, supplierId?: string, returnReason?: string, variantId?: string, variantName?: string) => {
    if (quantity === 0) return;
    const newMovement: any = {
      id: `MOV-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
      productId,
      productName,
      type,
      quantity,
      date: new Date().toISOString(),
      description
    };

    if (supplierId) newMovement.supplierId = supplierId;
    if (returnReason) newMovement.returnReason = returnReason;
    if (variantId) newMovement.variantId = variantId;
    if (variantName) newMovement.variantName = variantName;

    setStockMovements((prev: any) => [newMovement, ...prev]);
  };

  const processExpense = (name: string, amount: number, customDesc?: string, metadata?: any) => {
    if (amount > 0) {
      const newExpense = {
        id: `EXP-STOCK-${Date.now()}`,
        date: new Date().toISOString(),
        name: `Restok: ${name}`,
        category: 'Belanja barang',
        amount: amount,
        description: customDesc || `Otomatis dari penambahan stok barang (${paymentSource})`,
        paymentSource,
        ...metadata
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
    <div className="space-y-4 md:space-y-6">
      {/* Search and Action Bar */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="CARI BARANG / KODE..." 
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-black uppercase tracking-widest focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all" 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowSupplierManager(true)} 
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-600 transition-all shadow-sm active:scale-95" 
              title="Kelola Supplier"
            >
              <Package className="w-5 h-5" />
            </button>
            <button 
              onClick={() => setShowReasonManager(true)} 
              className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-500 hover:bg-slate-50 hover:border-orange-200 hover:text-orange-600 transition-all shadow-sm active:scale-95" 
              title="Kelola Alasan Retur"
            >
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <button 
            onClick={() => {
              setShowModal({ name: '', code: '', category: '', buyPrice: 0, sellPrice: 0, stock: undefined, minStock: undefined });
              setModalMode('new');
              setQtyInput(0);
              setIsAddingNewCategory(false);
            }} 
          className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black flex items-center justify-center gap-3 shadow-xl shadow-slate-200 uppercase text-[10px] tracking-[0.2em] transition-all hover:bg-slate-800 active:scale-95 mb-1"
        >
          <Plus className="w-4 h-4" /> 
          Input Barang Baru
        </button>
      </div>

      {/* Main List Container */}
      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] border-b border-slate-100">
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
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold">
              {sortedProducts.map((p:any) => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 align-top">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border shadow-sm",
                        p.stock <= p.minStock ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-slate-50 border-slate-100 text-slate-300"
                      )}>
                        <Package className="w-6 h-6" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[13px] font-black text-slate-800 uppercase tabular-nums truncate leading-none mb-1.5">{p.name}</div>
                        <div className="flex items-center gap-2">
                           <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none translate-y-[1px]">{p.code}</div>
                           {p.hasVariants && (
                             <span className="bg-emerald-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-full uppercase leading-none scale-90">VARIAN</span>
                           )}
                        </div>
                        {p.hasVariants && p.variants && p.variants.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {p.variants.map((v: any) => (
                              <div key={v.id} className={cn(
                                "text-[8px] font-black px-2 py-1 rounded-lg border flex items-center gap-1.5 uppercase tracking-tighter",
                                v.stock <= 0 ? "bg-rose-50 text-rose-400 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-200"
                              )}>
                                <span className="opacity-50">{v.name}</span>
                                <span className={cn("px-1.5 py-0.5 rounded-md", v.stock <= 2 ? "bg-rose-500 text-white shadow-sm" : "bg-slate-200 text-slate-700")}>{v.stock}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-1 rounded-lg">{p.category}</span>
                  </td>
                  <td className="px-6 py-4 text-right font-black text-emerald-600 text-[13px] tabular-nums">{formatCurrency(p.sellPrice)}</td>
                  <td className="px-6 py-4 text-center">
                    <div className={cn(
                      "inline-flex items-center justify-center min-w-[32px] h-8 px-3 rounded-xl text-[11px] font-black tabular-nums border",
                      p.stock <= p.minStock ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-200" : "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {p.stock}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end items-center gap-1.5">
                      <button onClick={() => { setShowModal(p); setVariants(p.variants || []); setModalMode('add'); setSelectedSupplierId(''); }} className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"><Plus className="w-4 h-4" /></button>
                      <button onClick={() => { setShowModal(p); setVariants(p.variants || []); setModalMode('return'); setSelectedReturnReason(''); }} className="p-2 bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"><RefreshCcw className="w-4 h-4" /></button>
                      <button onClick={() => { setShowModal(p); setVariants(p.variants || []); setModalMode('adjust'); }} className="p-2 bg-blue-50 text-blue-500 hover:bg-blue-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => setConfirmDelete(p)} className="p-2 bg-slate-50 text-slate-300 hover:bg-rose-500 hover:text-white rounded-xl transition-all shadow-sm active:scale-90"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View */}
        <div className="md:hidden divide-y divide-slate-50">
          {sortedProducts.map((p: any) => (
            <motion.div 
              layout
              key={p.id} 
              className="p-5 active:bg-slate-50 transition-colors"
            >
              <div className="flex gap-4 items-start mb-4">
                <div className={cn(
                  "w-14 h-14 rounded-[20px] flex items-center justify-center shrink-0 border-2 shadow-sm",
                  p.stock <= p.minStock ? "bg-rose-50 border-rose-100 text-rose-500" : "bg-slate-50 border-slate-100 text-slate-300"
                )}>
                  <Package className="w-7 h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <div className="text-[13px] font-black text-slate-800 uppercase truncate leading-tight">{p.name}</div>
                    <div className={cn(
                      "px-2.5 py-1 rounded-xl text-[10px] font-black tabular-nums border",
                      p.stock <= p.minStock ? "bg-rose-500 text-white border-rose-600 shadow-lg shadow-rose-100" : "bg-slate-100 text-slate-600 border-slate-200"
                    )}>
                      {p.stock}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-2 py-0.5 rounded-lg">{p.category}</span>
                    <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest border border-emerald-100 px-2 py-0.5 rounded-lg">{formatCurrency(p.sellPrice)}</span>
                  </div>
                  {p.hasVariants && p.variants && p.variants.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.variants.map((v: any) => (
                        <div key={v.id} className={cn(
                          "text-[7px] font-black px-2 py-0.5 rounded-lg border flex items-center gap-1 uppercase tracking-tighter",
                          v.stock <= 0 ? "bg-rose-50 text-rose-400 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-200"
                        )}>
                          {v.name}: {v.stock}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <button onClick={() => { setShowModal(p); setVariants(p.variants || []); setModalMode('add'); setSelectedSupplierId(''); }} className="flex flex-col items-center justify-center gap-1 py-3 bg-emerald-50 text-emerald-600 rounded-2xl active:bg-emerald-500 active:text-white transition-all">
                  <Plus className="w-4 h-4" />
                  <span className="text-[7px] font-black uppercase">Restock</span>
                </button>
                <button onClick={() => { setShowModal(p); setVariants(p.variants || []); setModalMode('return'); setSelectedReturnReason(''); }} className="flex flex-col items-center justify-center gap-1 py-3 bg-orange-50 text-orange-600 rounded-2xl active:bg-orange-500 active:text-white transition-all">
                  <RefreshCcw className="w-4 h-4" />
                  <span className="text-[7px] font-black uppercase">Retur</span>
                </button>
                <button onClick={() => { setShowModal(p); setVariants(p.variants || []); setModalMode('adjust'); }} className="flex flex-col items-center justify-center gap-1 py-3 bg-blue-50 text-blue-500 rounded-2xl active:bg-blue-500 active:text-white transition-all">
                  <Edit className="w-4 h-4" />
                  <span className="text-[7px] font-black uppercase">Edit</span>
                </button>
                <button onClick={() => setConfirmDelete(p)} className="flex flex-col items-center justify-center gap-1 py-3 bg-slate-50 text-slate-400 rounded-2xl active:bg-rose-500 active:text-white transition-all">
                  <Trash2 className="w-4 h-4" />
                  <span className="text-[7px] font-black uppercase">Hapus</span>
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {sortedProducts.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center justify-center opacity-10 grayscale">
            <Package className="w-16 h-16 mb-4" />
            <div className="text-[10px] font-black uppercase tracking-[0.2em]">Tidak Ada Data Barang</div>
          </div>
        )}
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
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] relative">
               <div className="p-5 sm:p-7 border-b flex justify-between items-center shrink-0 bg-white z-10">
                 <div>
                   <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 uppercase tracking-tight leading-tight">
                     {showModal.id ? (
                       modalMode === 'add' ? `Restok: ${showModal.name}` :
                       modalMode === 'reduce' ? `Kurangi: ${showModal.name}` :
                       `Edit: ${showModal.name}`
                     ) : 'Tambah Barang Baru'}
                   </h3>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">Konfigurasi Inventori Unit</p>
                 </div>
                 <button onClick={() => setShowModal(null)} className="p-2.5 hover:bg-slate-50 rounded-full transition-all active:scale-90 shadow-sm border border-slate-100"><X className="w-5 h-5 text-slate-400" /></button>
               </div>
                <form onSubmit={handleSave} className="p-6 sm:p-9 flex-1 overflow-y-auto no-scrollbar scroll-smooth">
                  <div className="col-span-1 md:col-span-2 space-y-1.5 relative">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Barang</label>
                    <input required className="w-full bg-slate-50 px-5 py-4 border-2 border-transparent focus:border-slate-100 rounded-2xl text-base font-bold outline-none transition-all shadow-sm" value={showModal.name} onChange={e => setShowModal({...showModal, name: e.target.value})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} placeholder="Contoh: Kopi Kapal Api" />
                    
                    {modalMode === 'new' && showModal.name && showModal.name.length > 2 && products.some((p:any) => p.name.toLowerCase().includes(showModal.name!.toLowerCase())) && (
                      <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-20 bg-white border border-slate-100 rounded-2xl shadow-2xl overflow-hidden">
                        {products.filter((p:any) => p.name.toLowerCase().includes(showModal.name!.toLowerCase())).slice(0, 3).map((p:any) => (
                          <button key={p.id} type="button" onClick={() => setShowModal(p)} className="w-full px-5 py-4 text-left hover:bg-slate-50 flex items-center justify-between border-b border-slate-50 last:border-0 transition-colors">
                             <div>
                               <div className="text-[11px] font-black text-slate-800 uppercase leading-none mb-1">{p.name}</div>
                               <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{p.code}</div>
                             </div>
                             <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-lg">Gunakan Data</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kode Barang</label>
                    <input required className="w-full bg-slate-50 px-4 py-3.5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none transition-all" value={showModal.code} onChange={e => setShowModal({...showModal, code: e.target.value})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kategori</label>
                    {isAddingNewCategory ? (
                      <div className="flex gap-2">
                        <input 
                          required 
                          className="flex-1 bg-slate-50 px-4 py-3.5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none transition-all" 
                          value={showModal.category || ''} 
                          onChange={e => setShowModal({...showModal, category: e.target.value})} 
                          placeholder="Ketik Kategori Baru..."
                          autoFocus
                        />
                        <button 
                          type="button" 
                          onClick={() => setIsAddingNewCategory(false)}
                          className="px-4 bg-slate-100 rounded-2xl hover:bg-slate-200 text-slate-400 font-bold transition-all"
                          title="Kembali ke Dropdown"
                        >
                          Batal
                        </button>
                      </div>
                    ) : (
                      <select 
                        required
                        className="w-full bg-slate-50 px-4 py-3.5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none transition-all appearance-none cursor-pointer" 
                        value={showModal.category || ''} 
                        onChange={e => {
                          if (e.target.value === 'NEW_CATEGORY') {
                            setIsAddingNewCategory(true);
                            setShowModal({...showModal, category: ''});
                          } else {
                            setShowModal({...showModal, category: e.target.value});
                          }
                        }}
                        disabled={showModal.id !== undefined && modalMode !== 'adjust'}
                      >
                        <option value="">Pilih Kategori</option>
                        {categories.map((cat: any) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="NEW_CATEGORY" className="font-bold text-emerald-600">+ TAMBAH KATEGORI BARU</option>
                      </select>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Harga Beli</label>
                    <input required type="number" disabled={showModal.hasVariants} className={cn("w-full bg-slate-50 px-4 py-3.5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none transition-all", showModal.hasVariants ? "opacity-40 cursor-not-allowed" : "")} value={showModal.buyPrice || ''} onChange={e => setShowModal({...showModal, buyPrice: Number(e.target.value)})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Harga Jual</label>
                    <input required type="number" disabled={showModal.hasVariants} className={cn("w-full bg-slate-50 px-4 py-3.5 border-none rounded-2xl text-sm font-bold focus:ring-2 focus:ring-slate-200 outline-none transition-all", showModal.hasVariants ? "opacity-40 cursor-not-allowed" : "")} value={showModal.sellPrice || ''} onChange={e => setShowModal({...showModal, sellPrice: Number(e.target.value)})} readOnly={showModal.id !== undefined && modalMode !== 'adjust'} />
                  </div>

                  <div className="col-span-1 md:col-span-2 py-4 flex flex-col sm:flex-row items-center gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
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
                         "flex items-center gap-3 px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all shadow-sm active:scale-95 shrink-0",
                         showModal.hasVariants ? "bg-slate-900 text-white" : "bg-white text-slate-400 border border-slate-200"
                       )}
                     >
                       {showModal.hasVariants ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
                       Barang Memiliki Varian
                     </button>
                     <p className="text-[9px] font-bold text-slate-400 leading-relaxed max-w-xs">Pilih jika barang memiliki ukuran, warna, atau jenis yang berbeda namun satu kesatuan produk.</p>
                  </div>

                  {showModal.hasVariants && (
                    <div className="col-span-1 md:col-span-2 space-y-4 bg-slate-100/50 p-4 sm:p-5 rounded-[28px] border border-slate-200/50">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-2 px-1">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Konfigurasi Varian</h4>
                        {(!showModal.id || modalMode === 'adjust') && (
                          <button type="button" onClick={addVariant} className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase shadow-lg active:scale-95 transition-all w-full sm:w-auto justify-center"><Plus className="w-3.5 h-3.5" />Tambah Varian</button>
                        )}
                      </div>
                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1 no-scrollbar pb-2">
                         {variants.map((v, idx) => (
                           <div key={v.id} className="bg-white p-4 rounded-[24px] shadow-sm border border-slate-200/60 transition-all hover:border-slate-300">
                             <div className="flex justify-between items-center mb-3">
                               <span className="text-[10px] font-black text-slate-400 uppercase">Varian #{idx + 1}</span>
                                {(!showModal.id || modalMode === 'adjust') && variants.length > 1 && (
                                  <button type="button" onClick={() => removeVariant(v.id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                                )}
                             </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Nama Varian</label>
                                  <input required disabled={showModal.id !== undefined && modalMode !== 'adjust'} className={cn("w-full bg-slate-50 px-3.5 py-3 rounded-xl text-xs font-bold outline-none", showModal.id && modalMode !== 'adjust' ? "opacity-50" : "focus:ring-2 focus:ring-slate-100 border border-slate-100")} value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)} placeholder="Contoh: XL, Hitam, dsb" />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Harga Beli</label>
                                  <input required disabled={showModal.id !== undefined && modalMode !== 'adjust'} type="number" className={cn("w-full bg-slate-50 px-3.5 py-3 rounded-xl text-xs font-bold outline-none", showModal.id && modalMode !== 'adjust' ? "opacity-50" : "focus:ring-2 focus:ring-slate-100 border border-slate-100")} value={v.buyPrice || ''} onChange={e => updateVariant(v.id, 'buyPrice', Number(e.target.value))} placeholder={showModal.buyPrice?.toString() || '0'} />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Harga Jual</label>
                                  <input required disabled={showModal.id !== undefined && modalMode !== 'adjust'} type="number" className={cn("w-full bg-slate-50 px-3.5 py-3 rounded-xl text-xs font-bold outline-none", showModal.id && modalMode !== 'adjust' ? "opacity-50" : "focus:ring-2 focus:ring-slate-100 border border-slate-100")} value={v.sellPrice || ''} onChange={e => updateVariant(v.id, 'sellPrice', Number(e.target.value))} placeholder={showModal.sellPrice?.toString() || '0'} />
                                </div>
                             </div>
                             
                             <div className="bg-slate-50 px-4 py-3 sm:py-4 rounded-[22px] border border-slate-100">
                               {(!showModal.id || modalMode === 'adjust') ? (
                                 <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                   <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-center sm:text-left">Stok Unit Tersedia</label>
                                   <input type="number" className="w-full sm:w-28 bg-white px-3 py-2.5 rounded-xl text-sm font-black text-center border border-slate-200 outline-none focus:ring-4 focus:ring-slate-100" value={v.stock} onChange={e => updateVariant(v.id, 'stock', Number(e.target.value))} />
                                 </div>
                               ) : (
                                 <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                                   <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                                     <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Stok Aktif</div>
                                     <div className="bg-white px-3 py-1.5 rounded-lg text-xs font-black border border-slate-100 text-slate-600 shadow-sm">{v.stock}</div>
                                   </div>
                                   <div className="flex items-center gap-3 w-full sm:w-auto">
                                     <label className={cn("text-[8px] font-black uppercase tracking-widest whitespace-nowrap", modalMode === 'add' ? "text-emerald-500" : "text-rose-500")}>
                                       {modalMode === 'add' ? 'Tambah' : 'Kurangi'}
                                     </label>
                                     <input 
                                       type="number" 
                                       min="0"
                                       max={modalMode === 'reduce' ? v.stock : undefined}
                                       className={cn("flex-1 sm:w-24 bg-white px-3 py-2.5 rounded-xl text-xs font-black text-center border outline-none transition-all", modalMode === 'add' ? "border-emerald-200 focus:ring-4 focus:ring-emerald-50" : "border-rose-200 focus:ring-4 focus:ring-rose-50")} 
                                       value={variantAdjustments[v.id] || ''} 
                                       onChange={e => handleVariantAdjustment(v.id, Number(e.target.value))} 
                                       placeholder="0"
                                     />
                                   </div>
                                 </div>
                               )}
                             </div>
                           </div>
                         ))}
                      </div>
                    </div>
                  )}
                  
                    {showModal.id && (modalMode === 'add' || modalMode === 'reduce' || modalMode === 'return') && !showModal.hasVariants && (
                      <div className={cn(
                        "col-span-1 md:col-span-2 p-4 sm:p-6 rounded-[32px] border-2 border-dashed flex flex-col gap-6",
                        modalMode === 'add' ? "bg-emerald-50/50 border-emerald-200" : 
                        modalMode === 'return' ? "bg-orange-50/50 border-orange-200" :
                        "bg-rose-50/50 border-rose-200"
                      )}>
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="shrink-0 text-center sm:text-left">
                            <div className={cn("text-[9px] font-black uppercase tracking-[0.2em] mb-1.5", modalMode === 'add' ? "text-emerald-600" : modalMode === 'return' ? "text-orange-600" : "text-rose-600")}>Stok System Saat Ini</div>
                            <div className="text-[14px] font-black bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl border border-white inline-block shadow-sm">{showModal.stock} Unit</div>
                          </div>
                          <div className="w-full sm:w-auto text-center sm:text-right">
                            <label className={cn("text-[10px] font-black uppercase tracking-[0.2em] block mb-2", modalMode === 'add' ? "text-emerald-700" : modalMode === 'return' ? "text-orange-700" : "text-rose-700")}>
                              {modalMode === 'add' ? 'Jumlah Restock Baru' : 'Jumlah Keluar / Retur'}
                            </label>
                            <input 
                              autoFocus 
                              required 
                              type="number" 
                              className={cn(
                                "w-full sm:w-40 bg-white px-5 py-4 border-2 rounded-[24px] text-2xl font-black text-center outline-none transition-all focus:ring-4 shadow-xl",
                                modalMode === 'add' ? "border-emerald-500 focus:ring-emerald-500/10" : 
                                modalMode === 'return' ? "border-orange-500 focus:ring-orange-500/10" :
                                "border-rose-500 focus:ring-rose-500/10"
                              )} 
                              value={qtyInput || ''} 
                              onChange={e => setQtyInput(Number(e.target.value))} 
                              placeholder="0"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                   {modalMode === 'add' && (
                     <div className="col-span-1 md:col-span-2 space-y-5 pt-2">
                       <div className="space-y-2">
                         <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pilih Supplier</label>
                         <select required className="w-full bg-slate-50 px-5 py-4 border-2 border-transparent focus:border-slate-200 rounded-[24px] text-xs font-black uppercase tracking-wider outline-none appearance-none cursor-pointer" value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)}>
                           <option value="">-- PILIH SUMBER SUPPLIER --</option>
                           {suppliers.map((s: any) => (
                             <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>
                           ))}
                         </select>
                       </div>
                       <div className="p-6 bg-slate-900 rounded-[32px] border border-slate-800 shadow-2xl">
                         <label className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] block mb-4 text-center">Metode Pembayaran Restock</label>
                         <div className="flex gap-3">
                           <button type="button" onClick={() => setPaymentSource('cash')} className={cn("flex-1 py-4 rounded-2xl border-2 font-black uppercase text-[9px] tracking-widest transition-all active:scale-95", paymentSource === 'cash' ? "bg-white border-white text-slate-900 shadow-xl" : "bg-white/5 border-transparent text-white/40")}>Cash</button>
                           <button type="button" onClick={() => setPaymentSource('bank')} className={cn("flex-1 py-4 rounded-2xl border-2 font-black uppercase text-[9px] tracking-widest transition-all active:scale-95", paymentSource === 'bank' ? "bg-white border-white text-slate-900 shadow-xl" : "bg-white/5 border-transparent text-white/40")}>M-Bank</button>
                         </div>
                       </div>
                     </div>
                   )}

                   {modalMode === 'return' && (
                     <div className="col-span-1 md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Alasan Penarikan / Retur</label>
                       <select required className="w-full bg-slate-50 px-5 py-4 border-2 border-transparent focus:border-slate-200 rounded-[23px] text-xs font-black uppercase outline-none cursor-pointer" value={selectedReturnReason} onChange={e => setSelectedReturnReason(e.target.value)}>
                         <option value="">-- PILIH ALASAN PENARIKAN --</option>
                         {returnReasons.map((r: any) => (
                           <option key={r.id} value={r.label}>{r.label.toUpperCase()}</option>
                         ))}
                       </select>
                     </div>
                   )}
                  
                  {(!showModal.id || modalMode === 'adjust') && (
                    <>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                          {modalMode === 'adjust' ? 'Total Stok Baru' : 'Stok Awal'}
                        </label>
                        <input required type="number" disabled={showModal.hasVariants} className={cn("w-full bg-slate-50 px-4 py-3.5 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-slate-200 outline-none transition-all", showModal.hasVariants ? "opacity-40 cursor-not-allowed" : "")} value={showModal.hasVariants ? variants.reduce((acc, v) => acc + (Number(v.stock) || 0), 0) : (showModal.stock ?? '')} onChange={e => setShowModal({...showModal, stock: Number(e.target.value)})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Limit Stok Menipis</label>
                        <input required type="number" className="w-full bg-slate-50 px-4 py-3.5 border-none rounded-2xl text-sm font-black focus:ring-2 focus:ring-slate-200 outline-none transition-all" value={showModal.minStock ?? ''} onChange={e => setShowModal({...showModal, minStock: Number(e.target.value)})} />
                      </div>
                    </>
                  )}
                  
                  <div className="col-span-1 md:col-span-2 pt-8 pb-10">
                    <button type="submit" className={cn(
                      "w-full py-5 text-white font-black rounded-[28px] shadow-2xl uppercase tracking-[0.2em] text-[11px] transition-all hover:scale-[1.01] active:scale-[0.98]",
                      modalMode === 'add' ? "bg-emerald-500 shadow-emerald-100" : 
                      modalMode === 'reduce' ? "bg-rose-500 shadow-rose-100" :
                      modalMode === 'adjust' ? "bg-blue-600 shadow-blue-100" :
                      "bg-slate-900 shadow-slate-200"
                    )}>
                      {showModal.id ? (
                        modalMode === 'add' ? 'Eksekusi Restok' : 
                        modalMode === 'reduce' ? 'Eksekusi Pengurangan' :
                        'Update Basis Data'
                      ) : 'Input Barang ke System'}
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
