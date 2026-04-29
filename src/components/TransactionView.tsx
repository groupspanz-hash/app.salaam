import React, { useState } from 'react';
import { Search, Trash2, Check, Smartphone, Package, ShoppingCart, Send, X, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { Product, Transaction, TransactionItem } from '../types';
import { PULSA_NOMINALS } from '../constants';

export default function TransactionView({ 
  products, 
  setProducts, 
  transactions, 
  setTransactions, 
  pulseBalance, 
  setPulseBalance, 
  transferBalance,
  setTransferBalance,
  cashBalance, 
  setCashBalance,
  bankBalance,
  setBankBalance,
  setStockMovements
}: any) {
  const [cart, setCart] = useState<TransactionItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState(0);
  const [applyTax, setApplyTax] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [showReceipt, setShowReceipt] = useState<any>(null);
  const [digitalTab, setDigitalTab] = useState<'pulsa' | 'transfer'>('pulsa');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [digitalPending, setDigitalPending] = useState<{nominal: number, type: 'pulsa' | 'transfer'} | null>(null);

  const [variantModal, setVariantModal] = useState<Product | null>(null);

  const categories = ['All', 'Digital', ...Array.from(new Set(products.map((p:any) => p.category)))];

  const filteredProducts = products.filter((p:any) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const updateCartItemQuantity = (productId: string, variantId: string | undefined, newQty: number) => {
    const itemIndex = cart.findIndex(i => i.productId === productId && i.variantId === variantId);
    if (itemIndex === -1) return;
    
    const item = cart[itemIndex];
    if (newQty <= 0) {
       setCart(cart.filter((_, idx) => idx !== itemIndex));
       return;
    }

    if (!item.isPulse) {
       const product = products.find((p: any) => p.id === item.productId);
       if (product) {
          if (item.variantId) {
             const variant = product.variants?.find((v: any) => v.id === item.variantId);
             if (variant && newQty > variant.stock) {
                alert(`Stok varian ${variant.name} tidak cukup! (Maks: ${variant.stock})`);
                return;
             }
          } else {
             if (newQty > product.stock) {
                alert(`Stok ${product.name} tidak cukup! (Maks: ${product.stock})`);
                return;
             }
          }
       }
    } else {
       if (item.digitalType === 'pulsa') {
          const costPerItem = parseInt(item.productId.split('-')[1]);
          const totalCostOtherPulsa = cart.filter(i => i.isPulse && i.digitalType === 'pulsa' && i.productId !== item.productId).reduce((acc, curr) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);
          if ((totalCostOtherPulsa + costPerItem * newQty) > pulseBalance) {
             alert(`Saldo Pulsa Kurang!`);
             return;
          }
       } else if (item.digitalType === 'transfer') {
          const costPerItem = parseInt(item.productId.split('-')[1]);
          const totalCostOtherTx = cart.filter(i => i.isPulse && i.digitalType === 'transfer' && i.productId !== item.productId).reduce((acc, curr) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);
          if ((totalCostOtherTx + costPerItem * newQty) > transferBalance) {
             alert(`Saldo Transfer Kurang!`);
             return;
          }
       }
    }

    const newCart = [...cart];
    newCart[itemIndex] = { ...item, quantity: newQty, subtotal: newQty * item.price };
    setCart(newCart);
  };

  const addToCart = (product: Product) => {
    if (product.hasVariants && product.variants && product.variants.length > 0) {
      setVariantModal(product);
      return;
    }

    const existing = cart.find(item => item.productId === product.id && !item.variantId);
    if (existing) {
       updateCartItemQuantity(product.id, undefined, existing.quantity + 1);
    } else {
      if (product.stock <= 0) {
        alert(`Stok ${product.name} habis!`);
        return;
      }
      setCart([...cart, { productId: product.id, name: product.name, quantity: 1, price: product.sellPrice, subtotal: product.sellPrice, isPulse: false }]);
    }
  };

  const addVariantToCart = (product: Product, variant: any) => {
    const existing = cart.find(item => item.productId === product.id && item.variantId === variant.id);
    const price = variant.sellPrice || product.sellPrice;
    
    if (existing) {
       updateCartItemQuantity(product.id, variant.id, existing.quantity + 1);
    } else {
      if (variant.stock <= 0) {
        alert(`Stok varian ${variant.name} habis!`);
        return;
      }
      setCart([...cart, { 
        productId: product.id, 
        variantId: variant.id, 
        name: `${product.name} - ${variant.name}`, 
        variantName: variant.name,
        quantity: 1, 
        price: price, 
        subtotal: price, 
        isPulse: false 
      }]);
    }
    setVariantModal(null);
  };

  const addDigitalToCart = (nominal: number, type: 'pulsa' | 'transfer', adminFee: number) => {
    const digitalId = `${type.toUpperCase()}-${nominal}-${adminFee}`;
    const name = type === 'pulsa' ? `Pulsa ${nominal >= 1000 ? nominal/1000 : nominal}${nominal >= 1000 ? 'K' : ''}` : `Trf ${nominal >= 1000 ? nominal/1000 : nominal}${nominal >= 1000 ? 'K' : ''}`;
    
    const existing = cart.find(item => item.productId === digitalId);
    if (existing) {
       updateCartItemQuantity(digitalId, undefined, existing.quantity + 1);
    } else {
      // Check balances manually for new item since it's not handled by updateCartItemQuantity yet
      if (type === 'pulsa') {
          const totalCostOtherPulsa = cart.filter(i => i.isPulse && i.digitalType === 'pulsa').reduce((acc, curr) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);
          if ((totalCostOtherPulsa + nominal) > pulseBalance) {
             alert(`Saldo Pulsa Kurang!`); return;
          }
      } else if (type === 'transfer') {
          const totalCostOtherTx = cart.filter(i => i.isPulse && i.digitalType === 'transfer').reduce((acc, curr) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);
          if ((totalCostOtherTx + nominal) > transferBalance) {
             alert(`Saldo Transfer Kurang!`); return;
          }
      }
      
      setCart([...cart, { 
        productId: digitalId, 
        name: `${name} (+${adminFee/1000}K)`, 
        quantity: 1, 
        price: nominal + adminFee, 
        subtotal: nominal + adminFee, 
        isPulse: true,
        digitalType: type
      }]);
    }
    setDigitalPending(null);
  };

  const cartSubtotal = cart.reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalAfterDiscount = cartSubtotal - discount;
  const taxAmount = applyTax ? totalAfterDiscount * 0.11 : 0;
  const total = totalAfterDiscount + taxAmount;

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    const totalPulseCost = cart
      .filter(i => i.isPulse && i.digitalType === 'pulsa')
      .reduce((acc, curr) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);
    
    const totalTransferCost = cart
      .filter(i => i.isPulse && i.digitalType === 'transfer')
      .reduce((acc, curr) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);

    if (totalPulseCost > pulseBalance) return alert('Saldo Pulsa Kurang!');
    if (totalTransferCost > transferBalance) return alert('Saldo Transfer Kurang!');

    const now = Date.now();
    const newTrx = {
      id: `TRX-${now}`,
      date: new Date().toISOString(),
      customerName: customerName || 'Umum',
      items: [...cart],
      subtotal: cartSubtotal,
      discount: discount,
      tax: taxAmount,
      total,
      paymentMethod,
    };

    const newMovements: any[] = [];

    setProducts((prev: any) => prev.map((p:any) => {
      const itemsForThisProduct = cart.filter(i => i.productId === p.id);
      if (itemsForThisProduct.length > 0) {
        let updatedProduct = { ...p };
        let totalQtyReduced = 0;

        itemsForThisProduct.forEach(item => {
          totalQtyReduced += item.quantity;
          if (item.variantId && updatedProduct.variants) {
            updatedProduct.variants = updatedProduct.variants.map((v: any) => 
              v.id === item.variantId ? { ...v, stock: v.stock - item.quantity } : v
            );
          }
        });

        updatedProduct.stock = updatedProduct.stock - totalQtyReduced;
        return updatedProduct;
      }
      return p;
    }));

    cart.forEach((item, index) => {
      if (item.isPulse) return;
      newMovements.push({
        id: `MOV-${now}-${item.productId}-${index}`,
        productId: item.productId,
        productName: item.variantName ? `${item.name}` : item.name,
        type: 'out' as const,
        quantity: -item.quantity,
        date: new Date().toISOString(),
        description: `Penjualan (TRX-${now})`
      });
    });

    if (newMovements.length > 0) {
      setStockMovements((prevMov: any) => [...newMovements, ...prevMov]);
    }
    
    setPulseBalance((p:any) => p - totalPulseCost);
    setTransferBalance((p:any) => p - totalTransferCost);
    
    if (paymentMethod === 'Cash') {
      setCashBalance((p:any) => p + total);
    } else {
      setBankBalance((p:any) => p + total);
    }

    setTransactions([newTrx, ...transactions]);
    setShowReceipt(newTrx);
    setCart([]); setCustomerName(''); setDiscount(0); setApplyTax(false);
  };

  return (
    <div className="relative h-full">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
        <div className="lg:col-span-8 flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-3xl border border-slate-200">
          <div className="flex-1">
            <input type="text" placeholder="Cari barang..." className="w-full px-4 py-2 bg-slate-50 border-none rounded-xl text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat:any) => (
              <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase", selectedCategory === cat ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400 transition-colors")}>{cat}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 md:grid-cols-4 gap-4 pb-20">
          {(selectedCategory === 'Digital' || selectedCategory === 'All') && (
            <div className="col-span-2 md:col-span-4 space-y-4">
              <div className="flex bg-white p-1 rounded-2xl border border-slate-100 shadow-sm w-fit">
                <button 
                  onClick={() => setDigitalTab('pulsa')} 
                  className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", digitalTab === 'pulsa' ? "bg-blue-600 text-white shadow-lg shadow-blue-100" : "text-slate-400 hover:text-blue-500")}
                >
                  <Smartphone className="w-3 h-3" /> Pulsa
                </button>
                <button 
                  onClick={() => setDigitalTab('transfer')} 
                  className={cn("px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2", digitalTab === 'transfer' ? "bg-purple-600 text-white shadow-lg shadow-purple-100" : "text-slate-400 hover:text-purple-500")}
                >
                  <Send className="w-3 h-3" /> Transfer
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {PULSA_NOMINALS.map(nom => (
                  <button 
                    key={nom} 
                    onClick={() => {
                      const currentBalance = digitalTab === 'pulsa' ? pulseBalance : transferBalance;
                      if (currentBalance < nom) {
                        alert(`Saldo ${digitalTab === 'pulsa' ? 'Pulsa' : 'Transfer'} tidak cukup!`);
                        return;
                      }
                      setDigitalPending({ nominal: nom, type: digitalTab });
                    }} 
                    className={cn(
                      "p-4 rounded-3xl text-white text-left shadow-lg hover:scale-105 transition-transform",
                      digitalTab === 'pulsa' ? "bg-blue-600 shadow-blue-50" : "bg-purple-600 shadow-purple-50"
                    )}
                  >
                    {digitalTab === 'pulsa' ? <Smartphone className="opacity-50 mb-2 w-4 h-4" /> : <Send className="opacity-50 mb-2 w-4 h-4" />}
                    <div className="text-2xl font-black">{nom >= 1000 ? nom/1000 : nom}K</div>
                    <div className="text-[10px] font-bold opacity-80">Pilih Biaya Admin</div>
                  </button>
                ))}
              </div>
            </div>
          )}
          {filteredProducts.map((p:any) => (
            <button key={p.id} onClick={() => addToCart(p)} disabled={p.stock <= 0} className={cn("bg-white p-3 rounded-2xl border border-slate-200 text-left hover:border-emerald-500 transition-all relative", p.stock <= 0 && "opacity-50")}>
              <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center mb-2 text-slate-300"><Package className="w-4 h-4" /></div>
              <div className="text-[8px] font-black text-slate-400 uppercase mb-0.5">{p.category}</div>
              <div className="text-xs font-bold text-slate-800 line-clamp-2 h-8 mb-1 leading-tight">{p.name}</div>
              <div className="text-sm font-black text-emerald-600">{formatCurrency(p.sellPrice)}</div>
              <div className="absolute top-3 right-3 text-[8px] font-black text-slate-300">S: {p.stock}</div>
            </button>
          ))}
        </div>
      </div>
        {/* Cart Overlay for Mobile */}
        <div className={cn(
          "fixed inset-0 z-40 lg:relative lg:inset-auto lg:col-span-4 transition-transform duration-300 transform",
          isMobileCartOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0",
          !isMobileCartOpen && "pointer-events-none lg:pointer-events-auto"
        )}>
          {/* Backdrop for mobile */}
          <div 
            className={cn("absolute inset-0 bg-black/40 lg:hidden transition-opacity", isMobileCartOpen ? "opacity-100" : "opacity-0")}
            onClick={() => setIsMobileCartOpen(false)}
          />
          
          <div className="absolute right-0 top-0 bottom-0 w-[90%] lg:w-full bg-white rounded-l-3xl lg:rounded-3xl border-l lg:border border-slate-200 shadow-2xl flex flex-col overflow-hidden h-full">
            <div className="p-6 border-b flex justify-between items-center">
              <h3 className="font-bold flex items-center gap-2 text-slate-800">
                <ShoppingCart className="text-emerald-500" /> 
                Keranjang
              </h3>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 uppercase">{cart.length} ITEMS</span>
                <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-2 bg-slate-100 rounded-full">
                  <Check className="w-4 h-4 text-emerald-500" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
              {cart.map(item => (
                 <div key={`${item.productId}-${item.variantId || ''}`} className="flex flex-col gap-3 p-3 border border-slate-100 rounded-2xl bg-white shadow-sm">
                   <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                         <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", 
                           item.isPulse ? (item.digitalType === 'pulsa' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600") : "bg-slate-50 text-slate-400"
                         )}>
                           {item.isPulse ? (item.digitalType === 'pulsa' ? <Smartphone className="w-5 h-5" /> : <Send className="w-5 h-5" />) : <Package className="w-5 h-5" />}
                         </div>
                         <div className="font-bold">
                            <div className="text-sm text-slate-800 line-clamp-2 leading-tight">{item.name}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{formatCurrency(item.price)} x {item.quantity}</div>
                         </div>
                      </div>
                      <button onClick={() => updateCartItemQuantity(item.productId, item.variantId, 0)} className="text-slate-200 hover:text-rose-500 transition-colors p-1 shrink-0">
                         <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                   <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                      <div className="flex flex-col">
                         <span className="text-[8px] uppercase tracking-widest text-slate-400 font-black">Subtotal</span>
                         <span className="text-sm font-black text-slate-800">{formatCurrency(item.subtotal)}</span>
                      </div>
                      <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-100">
                         <button onClick={() => updateCartItemQuantity(item.productId, item.variantId, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-colors">
                            <Minus className="w-3 h-3" />
                         </button>
                         <input 
                           type="number" 
                           value={item.quantity} 
                           onChange={(e) => updateCartItemQuantity(item.productId, item.variantId, Number(e.target.value))} 
                           className="w-10 text-center text-xs font-black bg-transparent border-none p-0 focus:ring-0" 
                           min="0"
                         />
                         <button onClick={() => updateCartItemQuantity(item.productId, item.variantId, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-colors">
                            <Plus className="w-3 h-3" />
                         </button>
                      </div>
                   </div>
                 </div>
              ))}
              {cart.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center opacity-20">
                  <ShoppingCart className="w-12 h-12 mb-4" />
                  <div className="text-xs font-black uppercase tracking-widest">Kosong</div>
                </div>
              )}
            </div>

            <div className="p-6 bg-slate-50 border-t space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <input 
                  type="text" 
                  placeholder="Nama Customer" 
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full" 
                  value={customerName} 
                  onChange={e => setCustomerName(e.target.value)} 
                />
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-300">+/-</span>
                  <input 
                    type="number" 
                    placeholder="Diskon" 
                    className="bg-white border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full" 
                    value={discount || ''} 
                    onChange={e => setDiscount(Number(e.target.value))} 
                  />
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-slate-800">{formatCurrency(cartSubtotal)}</span>
                </div>
                {discount !== 0 && (
                  <div className={cn(
                    "flex justify-between items-center text-[10px] font-black uppercase",
                    discount > 0 ? "text-emerald-500" : "text-blue-500"
                  )}>
                    <span>{discount > 0 ? "Diskon" : "Biaya Tambahan"}</span>
                    <span>{discount > 0 ? "-" : "+"}{formatCurrency(Math.abs(discount))}</span>
                  </div>
                )}
                {applyTax && (
                  <div className="flex justify-between items-center text-[10px] font-black uppercase text-blue-500">
                    <span>PPN 11%</span>
                    <span>+{formatCurrency(taxAmount)}</span>
                  </div>
                )}
                <div 
                  className="flex justify-between items-center bg-slate-50 rounded-lg px-2 py-1 cursor-pointer transition-colors hover:bg-slate-100" 
                  onClick={() => setApplyTax(!applyTax)}
                >
                  <span className="text-[8px] font-black text-slate-400 uppercase">Aktifkan PPN</span>
                  <div className={cn("w-6 h-3 rounded-full relative transition-colors", applyTax ? "bg-emerald-500" : "bg-slate-300")}>
                    <div className={cn("absolute top-0.5 w-2 h-2 bg-white rounded-full transition-all", applyTax ? "right-0.5" : "left-0.5")}></div>
                  </div>
                </div>
                
                <div className="pt-2 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Bayar</div>
                    <div className="text-2xl font-black text-emerald-600">{formatCurrency(total)}</div>
                  </div>
                  <select 
                    className="w-full text-xs font-black uppercase border-2 border-slate-100 rounded-2xl px-4 py-4 outline-none bg-white mb-2 focus:border-emerald-500 transition-all shadow-sm" 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">💵 CASH (MASUK KAS)</option>
                    <option value="Transfer">🏦 TRANSFER (MASUK BANK)</option>
                    <option value="QRIS">📱 QRIS (MASUK BANK)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCheckout} 
                className="w-full bg-slate-900 text-white font-black py-4 rounded-2xl shadow-xl shadow-slate-200 disabled:opacity-50 transition-all uppercase tracking-widest" 
                disabled={cart.length === 0}
              >
                Bayar Sekarang
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile Cart */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="relative bg-emerald-500 text-white p-4 rounded-full shadow-2xl shadow-emerald-200 hover:scale-110 active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white">
              {cart.length}
            </span>
          )}
        </button>
      </div>
      <AnimatePresence>
        {variantModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-1">Pilih Varian</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed">{variantModal.name}</p>
                  </div>
                  <button onClick={() => setVariantModal(null)} className="p-2 hover:bg-slate-50 rounded-full"><X className="w-5 h-5 text-slate-400" /></button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pr-2">
                  {variantModal.variants?.map(v => (
                    <button 
                      key={v.id}
                      disabled={v.stock <= 0}
                      onClick={() => addVariantToCart(variantModal, v)}
                      className={cn(
                        "p-4 rounded-2xl border-2 text-left transition-all group flex flex-col justify-between h-32",
                        v.stock > 0 ? "border-slate-100 hover:border-emerald-500 bg-white" : "border-slate-50 bg-slate-50 opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div>
                        <div className="text-xs font-black text-slate-800 uppercase group-hover:text-emerald-500 transition-colors">{v.name}</div>
                        <div className="text-[10px] font-bold text-slate-400 mt-1 uppercase">Stok: {v.stock}</div>
                      </div>
                      <div className="text-lg font-black text-emerald-600">
                        {formatCurrency(v.sellPrice || variantModal.sellPrice!)}
                      </div>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setVariantModal(null)}
                  className="mt-8 w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {digitalPending && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[32px] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-8 text-center">
                <div className={cn(
                  "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6",
                  digitalPending.type === 'pulsa' ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"
                )}>
                  {digitalPending.type === 'pulsa' ? <Smartphone className="w-8 h-8" /> : <Send className="w-8 h-8" />}
                </div>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Pilih Biaya Admin</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-8">
                  {digitalPending.type.toUpperCase()} {formatCurrency(digitalPending.nominal)}
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  {[2000, 3000, 4000, 5000].map(fee => (
                    <button 
                      key={fee}
                      onClick={() => addDigitalToCart(digitalPending.nominal, digitalPending.type, fee)}
                      className="p-4 bg-slate-50 hover:bg-slate-100 rounded-2xl border-2 border-transparent hover:border-emerald-500 transition-all group text-center"
                    >
                      <div className="text-[10px] font-black text-slate-400 group-hover:text-emerald-500 mb-1 tracking-widest uppercase">Admin</div>
                      <div className="text-xl font-black text-slate-800">{fee/1000}rb</div>
                    </button>
                  ))}
                </div>

                <button 
                  onClick={() => setDigitalPending(null)}
                  className="mt-8 w-full py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>{showReceipt && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6"><motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl overflow-hidden"><div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6"><Check className="w-8 h-8" /></div><h4 className="text-2xl font-black text-slate-800 mb-2 uppercase tracking-wide">Transaksi OK</h4><p className="text-xs text-slate-400 mb-8 font-bold">Struk belanja siap dicetak!</p><button onClick={() => setShowReceipt(null)} className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest">Selesai</button></motion.div></div>}</AnimatePresence>
    </div>
  );
}
