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

    setTransactions((prev: any) => [newTrx, ...prev]);
    setShowReceipt(newTrx);
    setCart([]); setCustomerName(''); setDiscount(0); setApplyTax(false);
  };

  return (
    <div className="relative h-full flex flex-col">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-8 h-full min-h-0">
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0 pb-20 lg:pb-0">
          <div className="flex flex-col sm:flex-row gap-3 bg-white p-3 md:p-4 rounded-3xl border border-slate-200 sticky top-0 z-10 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
              <input 
                type="text" 
                placeholder="Cari ID/Nama Barang..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl text-xs md:text-sm focus:ring-2 focus:ring-emerald-500 outline-none" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar scroll-smooth">
              {categories.map((cat:any) => (
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={cn(
                    "px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all border", 
                    selectedCategory === cat 
                      ? "bg-slate-900 text-white border-slate-900 shadow-md" 
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-300"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 lg:grid-cols-4 gap-3">
            {(selectedCategory === 'Digital' || selectedCategory === 'All') && (
              <div className="col-span-2 lg:col-span-4 space-y-4 mb-4">
                <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-fit">
                  <button 
                    onClick={() => setDigitalTab('pulsa')} 
                    className={cn(
                      "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", 
                      digitalTab === 'pulsa' ? "bg-white text-blue-600 shadow-sm" : "text-slate-400"
                    )}
                  >
                    <Smartphone className="w-3.5 h-3.5" /> PULSA
                  </button>
                  <button 
                    onClick={() => setDigitalTab('transfer')} 
                    className={cn(
                      "flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2", 
                      digitalTab === 'transfer' ? "bg-white text-purple-600 shadow-sm" : "text-slate-400"
                    )}
                  >
                    <Send className="w-3.5 h-3.5" /> TRANSFER
                  </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
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
                        "p-4 rounded-3xl text-white text-left transition-all active:scale-95 group overflow-hidden relative",
                        digitalTab === 'pulsa' ? "bg-blue-600" : "bg-purple-600"
                      )}
                    >
                      <div className="absolute top-0 right-0 w-12 h-12 opacity-10 translate-x-3 -translate-y-3">
                        {digitalTab === 'pulsa' ? <Smartphone className="w-full h-full" /> : <Send className="w-full h-full" />}
                      </div>
                      <div className="text-2xl font-black">{nom >= 1000 ? nom/1000 : nom}K</div>
                      <div className="text-[9px] font-bold opacity-70 uppercase tracking-widest mt-1">Ready</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            {filteredProducts.map((p:any) => (
              <button 
                key={p.id} 
                onClick={() => addToCart(p)} 
                disabled={p.stock <= 0} 
                className={cn(
                  "bg-white p-3 rounded-2xl border border-slate-200 text-left transition-all hover:shadow-md active:scale-95 flex flex-col justify-between h-[140px] relative overflow-hidden group",
                  p.stock <= 0 && "grayscale opacity-50"
                )}
              >
                <div className="absolute top-0 right-0 p-2 bg-slate-50 rounded-bl-xl text-[9px] font-black tabular-nums text-slate-400">
                  {p.stock} <span className="opacity-50">STOK</span>
                </div>
                
                <div>
                  <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-300 group-hover:text-emerald-500 transition-colors">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="mt-2">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{p.category}</div>
                    <div className="text-[11px] font-black text-slate-800 line-clamp-2 leading-tight uppercase">{p.name}</div>
                  </div>
                </div>
                
                <div className="text-sm font-black text-emerald-600 mt-2">
                  {formatCurrency(p.sellPrice)}
                </div>
              </button>
            ))}
            
            {filteredProducts.length === 0 && selectedCategory !== 'Digital' && (
              <div className="col-span-2 lg:col-span-4 py-20 text-center flex flex-col items-center justify-center opacity-30">
                <Search className="w-10 h-10 mb-4" />
                <span className="text-[10px] font-black uppercase tracking-widest">Produk tidak ditemukan</span>
              </div>
            )}
          </div>
        </div>

        {/* Cart Overlay for Mobile & Desktop Panel */}
        <div className={cn(
          "fixed inset-0 z-40 lg:relative lg:inset-auto lg:col-span-4 transition-transform duration-300 pointer-events-none lg:pointer-events-auto",
          isMobileCartOpen ? "translate-x-0 pointer-events-auto" : "translate-x-full lg:translate-x-0"
        )}>
          {/* Backdrop for mobile */}
          <div 
            className={cn("absolute inset-0 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity", isMobileCartOpen ? "opacity-100" : "opacity-0")}
            onClick={() => setIsMobileCartOpen(false)}
          />
          
          <div className="absolute right-0 top-0 bottom-0 w-[85%] lg:w-full bg-white lg:rounded-3xl border-l lg:border border-slate-200 shadow-2xl flex flex-col h-[100dvh] lg:h-full overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-black text-sm text-slate-800 uppercase tracking-tight">KASIR</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black bg-slate-100 text-slate-400 px-2 py-0.5 rounded-full uppercase tabular-nums">
                  {cart.length} ITEMS
                </span>
                <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden p-1.5 bg-slate-100 rounded-full">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 no-scrollbar bg-slate-50/50">
              {cart.map(item => (
                <motion.div 
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={`${item.productId}-${item.variantId || ''}`} 
                  className="flex flex-col gap-3 p-3 border border-slate-200 rounded-2xl bg-white shadow-sm ring-1 ring-black/[0.02]"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border", 
                        item.isPulse ? (item.digitalType === 'pulsa' ? "bg-blue-50 border-blue-100 text-blue-600" : "bg-purple-50 border-purple-100 text-purple-600") : "bg-slate-50 border-slate-100 text-slate-400"
                      )}>
                        {item.isPulse ? (item.digitalType === 'pulsa' ? <Smartphone className="w-5 h-5" /> : <Send className="w-5 h-5" />) : <Package className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-slate-800 line-clamp-2 leading-none uppercase mb-1">{item.name}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest tabular-nums">{formatCurrency(item.price)}</div>
                      </div>
                    </div>
                    <button onClick={() => updateCartItemQuantity(item.productId, item.variantId, 0)} className="text-slate-200 hover:text-rose-500 transition-colors p-1.5">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-slate-50">
                    <div className="text-sm font-black text-slate-800 tabular-nums">{formatCurrency(item.subtotal)}</div>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      <button 
                        onClick={() => updateCartItemQuantity(item.productId, item.variantId, item.quantity - 1)} 
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-all active:scale-90"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <input 
                        type="number" 
                        value={item.quantity} 
                        readOnly
                        className="w-8 text-center text-xs font-black bg-transparent border-none p-0 focus:ring-0 tabular-nums" 
                      />
                      <button 
                        onClick={() => updateCartItemQuantity(item.productId, item.variantId, item.quantity + 1)} 
                        className="w-7 h-7 rounded-lg bg-white shadow-sm flex items-center justify-center text-slate-500 hover:text-emerald-600 transition-all active:scale-90"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {cart.length === 0 && (
                <div className="py-20 text-center flex flex-col items-center justify-center opacity-10 grayscale">
                  <ShoppingCart className="w-16 h-16 mb-4" />
                  <div className="text-[10px] font-black uppercase tracking-[0.2em]">KERANJANG KOSONG</div>
                </div>
              )}
            </div>

            <div className="p-4 md:p-6 bg-white border-t border-slate-200 space-y-4">
              <div className="flex flex-col gap-2">
                <div className="flex bg-slate-100 p-1 rounded-xl">
                  <input 
                    type="text" 
                    placeholder="NAMA CUSTOMER (OPSIONAL)" 
                    className="flex-1 bg-transparent border-none px-3 py-2 text-[10px] font-bold placeholder:text-slate-400 focus:ring-0 outline-none uppercase" 
                    value={customerName} 
                    onChange={e => setCustomerName(e.target.value)} 
                  />
                  <div className="relative flex items-center w-28 bg-white rounded-lg border border-slate-200 px-2">
                    <span className="text-[8px] font-black text-slate-400 mr-1 uppercase">Disc</span>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full bg-transparent border-none px-1 py-1 text-xs font-black focus:ring-0 outline-none tabular-nums" 
                      value={discount || ''} 
                      onChange={e => setDiscount(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase text-slate-400 tabular-nums">
                  <span>Subtotal</span>
                  <span>{formatCurrency(cartSubtotal)}</span>
                </div>
                
                {discount !== 0 && (
                  <div className={cn(
                    "flex justify-between items-center text-[10px] font-black uppercase tabular-nums",
                    discount > 0 ? "text-emerald-500" : "text-blue-500"
                  )}>
                    <span>{discount > 0 ? "DISKON" : "BIAYA LAIN"}</span>
                    <span>{discount > 0 ? "-" : "+"}{formatCurrency(Math.abs(discount))}</span>
                  </div>
                )}
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">TOTAL TAGIHAN</div>
                  <div className="text-xl font-black text-slate-900 tabular-nums tracking-tight">{formatCurrency(total)}</div>
                </div>
                
                <div className="pt-2">
                  <select 
                    className="w-full text-[10px] font-black uppercase border-2 border-slate-100 rounded-xl px-3 py-2.5 outline-none bg-white focus:border-slate-900 transition-all shadow-sm" 
                    value={paymentMethod} 
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="Cash">💵 SALDO CASH (TOKOKAS)</option>
                    <option value="Transfer">🏦 BANK (BCA/MANDIRI/DLL)</option>
                    <option value="QRIS">📱 DIGITAL (QRIS/E-WALLET)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleCheckout} 
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-emerald-600/20 disabled:opacity-50 disabled:shadow-none transition-all uppercase tracking-[0.1em] text-xs active:scale-[0.98]" 
                disabled={cart.length === 0}
              >
                PROSES PEMBAYARAN
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="lg:hidden fixed bottom-20 right-4 z-30">
        <button 
          onClick={() => setIsMobileCartOpen(true)}
          className="relative bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:scale-110 active:scale-95 transition-transform"
        >
          <ShoppingCart className="w-6 h-6" />
          {cart.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-lg border-2 border-white tabular-nums shadow-lg">
              {cart.length}
            </span>
          )}
        </button>
      </div>

      <AnimatePresence>
        {variantModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight mb-0.5">Pilih Varian</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate max-w-[200px]">{variantModal.name}</p>
                  </div>
                  <button onClick={() => setVariantModal(null)} className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"><X className="w-4 h-4 text-slate-400" /></button>
                </div>
                
                <div className="space-y-2 max-h-[50vh] overflow-y-auto no-scrollbar pr-1">
                  {variantModal.variants?.map(v => (
                    <button 
                      key={v.id}
                      disabled={v.stock <= 0}
                      onClick={() => addVariantToCart(variantModal, v)}
                      className={cn(
                        "w-full p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] flex items-center justify-between",
                        v.stock > 0 
                          ? "border-slate-100 hover:border-emerald-500 bg-white shadow-sm" 
                          : "border-slate-50 bg-slate-50 opacity-40 cursor-not-allowed"
                      )}
                    >
                      <div className="min-w-0">
                        <div className="text-[11px] font-black text-slate-800 uppercase truncate leading-tight mb-1">{v.name}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Stok: {v.stock}</div>
                      </div>
                      <div className="text-sm font-black text-emerald-600 tabular-nums">
                        {formatCurrency(v.sellPrice || variantModal.sellPrice!)}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50">
                  <button 
                    onClick={() => setVariantModal(null)}
                    className="w-full py-3 bg-slate-100 text-slate-400 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Tutup Panel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {digitalPending && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-[24px] w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="p-6 text-center">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 border shadow-sm",
                  digitalPending.type === 'pulsa' ? "bg-blue-50 border-blue-100 text-blue-500" : "bg-purple-50 border-purple-100 text-purple-500"
                )}>
                  {digitalPending.type === 'pulsa' ? <Smartphone className="w-6 h-6" /> : <Send className="w-6 h-6" />}
                </div>
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tighter mb-1">PILIH BIAYA ADMIN</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-6 tabular-nums">
                  {digitalPending.type} {formatCurrency(digitalPending.nominal)}
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  {[1000, 2000, 3000, 5000].map(fee => (
                    <button 
                      key={fee}
                      onClick={() => addDigitalToCart(digitalPending.nominal, digitalPending.type, fee)}
                      className="p-4 bg-slate-50 hover:bg-white hover:border-emerald-500 rounded-2xl border-2 border-slate-50 transition-all group text-center shadow-sm active:scale-95"
                    >
                      <div className="text-[8px] font-black text-slate-400 group-hover:text-emerald-500 mb-1 uppercase tracking-widest">Fee</div>
                      <div className="text-base font-black text-slate-800 tabular-nums">+{fee/1000}rb</div>
                    </button>
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-50">
                  <button 
                    onClick={() => setDigitalPending(null)}
                    className="w-full py-3 bg-slate-100 text-slate-400 font-black rounded-xl uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReceipt && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[200] p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} 
              animate={{ scale: 1, opacity: 1, y: 0 }} 
              className="bg-white rounded-[24px] p-8 w-full max-w-sm text-center shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
                <Check className="w-6 h-6" />
              </div>
              <h4 className="text-lg font-black text-slate-800 uppercase tracking-tight mb-2">Checkout Berhasil</h4>
              <p className="text-[10px] text-slate-400 mb-6 font-bold uppercase tracking-widest leading-relaxed">Invoice generated for {showReceipt.customerName}.<br/>Saldo kas telah diperbarui.</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-8 space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black text-slate-400 uppercase">
                  <span>ID Transaksi</span>
                  <span className="text-slate-800">{showReceipt.id}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-black text-slate-800 tabular-nums">
                  <span>Total Bayar</span>
                  <span className="text-emerald-600">{formatCurrency(showReceipt.total)}</span>
                </div>
              </div>
              
              <button 
                onClick={() => setShowReceipt(null)} 
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl shadow-slate-200 uppercase tracking-[0.2em] text-[10px] transition-all"
              >
                Tutup Panel
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
