import React, { useState } from 'react';
import { FileText, Download, Printer, Filter, X, Package, CreditCard, User, Calendar, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportView({ 
  transactions, 
  setTransactions,
  expenses, 
  products, 
  setProducts,
  digitalTopups, 
  stockMovements, 
  setStockMovements,
  transfers, 
  cashBankHistory,
  setBalances
}: any) {
  const [reportType, setReportType] = useState('sales');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [stockSort, setStockSort] = useState<'name' | 'stock_asc'>('name');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<any>(null);

  const deleteTransaction = (trx: any) => {
    setIsDeleting(true);

    // Calculate restoration amounts
    const totalPulseReturn = trx.items
      .filter((i: any) => i.isPulse && i.digitalType === 'pulsa')
      .reduce((acc: number, curr: any) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);
    
    const totalTransferReturn = trx.items
      .filter((i: any) => i.isPulse && i.digitalType === 'transfer')
      .reduce((acc: number, curr: any) => acc + (parseInt(curr.productId.split('-')[1]) * curr.quantity), 0);

    // 1. Update Balances Atomically
    setBalances((prev: any) => {
      const next = { ...prev };
      
      // Refund payment by reducing from the balance it was added to
      // Wait, if it was a sale, we added money to cash/bank. So deletion should SUBTRACT it.
      const method = trx.paymentMethod?.toUpperCase();
      if (method === 'BANK' || method === 'TRANSFER' || method === 'QRIS') {
        next.bankBalance -= trx.total;
      } else {
        next.cashBalance -= trx.total;
      }

      // Restore Digital Assets (if they were reduced during sale)
      next.pulseBalance += totalPulseReturn;
      next.transferBalance += totalTransferReturn;

      return next;
    });

    // 2. Restore Stock
    setProducts((prevProducts: any) => {
      let currentProducts = JSON.parse(JSON.stringify(prevProducts)); // Deep copy to be safe
      
      trx.items.forEach((item: any) => {
        if (item.isPulse) return;

        currentProducts = currentProducts.map((p: any) => {
          if (String(p.id) !== String(item.productId)) return p;

          let updatedVariants = p.variants ? [...p.variants] : [];
          let totalQtyAdded = 0;

          if (item.variantId) {
            updatedVariants = updatedVariants.map((v: any) => {
              if (String(v.id) === String(item.variantId)) {
                totalQtyAdded = item.quantity;
                return { ...v, stock: (Number(v.stock) || 0) + item.quantity };
              }
              return v;
            });
          } else {
            totalQtyAdded = item.quantity;
          }

          return { 
            ...p, 
            stock: (Number(p.stock) || 0) + totalQtyAdded,
            variants: updatedVariants
          };
        });
      });

      return currentProducts;
    });

    // 3. Log Stock Movement Reversals
    const now = Date.now();
    trx.items.forEach((item: any, idx: number) => {
      if (item.isPulse) return;
      
      const newMovement: any = {
        id: `MOV-REV-SALE-${now}-${idx}`,
        productId: item.productId,
        productName: item.name,
        type: 'adjustment',
        quantity: item.quantity,
        date: new Date().toISOString(),
        description: `BATAL JUAL: TRX ${trx.id} DIHAPUS`,
      };
      if (item.variantId) newMovement.variantId = item.variantId;
      if (item.variantName) newMovement.variantName = item.variantName;

      setStockMovements((prev: any) => [newMovement, ...prev]);
    });

    // 4. Remove Transaction
    setTransactions((prev: any) => prev.filter((t: any) => t.id !== trx.id));
    
    setIsDeleting(false);
    setShowDeleteConfirm(null);
    setSelectedTransaction(null);
  };

  const downloadTransactionPDF = (trx: any) => {
    const doc = new jsPDF({
      unit: 'mm',
      format: [80, 150] // receipt size
    });

    // Custom Receipt Header
    doc.setFontSize(12);
    doc.text('STRUK PENJUALAN', 40, 10, { align: 'center' });
    doc.setFontSize(8);
    doc.text('------------------------------------------', 40, 14, { align: 'center' });
    
    // Header Info
    doc.setFontSize(7);
    doc.text(`ID:`, 5, 18);
    doc.text(`${trx.id}`, 15, 18);
    
    doc.text(`Tgl:`, 5, 22);
    doc.text(`${new Date(trx.date).toLocaleString('id-ID')}`, 15, 22);
    
    doc.text(`Cust:`, 5, 26);
    doc.text(`${trx.customerName || 'Umum'}`, 15, 26);
    
    doc.setFontSize(8);
    doc.text('------------------------------------------', 40, 30, { align: 'center' });

    // Table with better wrapping
    autoTable(doc, {
      startY: 32,
      head: [['Item', 'Qty', 'Total']],
      body: trx.items.map((i: any) => [
        i.name + (i.variantName ? `\n(${i.variantName})` : ''),
        i.quantity,
        formatCurrency(i.subtotal).replace('Rp ', '')
      ]),
      theme: 'plain',
      styles: { 
        fontSize: 7, 
        cellPadding: 1, 
        font: 'helvetica',
        valign: 'middle',
        overflow: 'linebreak'
      },
      headStyles: { fontStyle: 'bold', halign: 'left' },
      columnStyles: {
        0: { cellWidth: 38 },
        1: { cellWidth: 8, halign: 'center' },
        2: { cellWidth: 24, halign: 'right' }
      },
      margin: { left: 5, right: 5 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 4;
    doc.setFontSize(8);
    doc.text('------------------------------------------', 40, finalY, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL:', 5, finalY + 5);
    doc.text(formatCurrency(trx.total), 75, finalY + 5, { align: 'right' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Metode: ${trx.paymentMethod || 'CASH'}`, 5, finalY + 10);
    
    doc.text('------------------------------------------', 40, finalY + 14, { align: 'center' });
    doc.setFontSize(7);
    doc.text('Terima Kasih atas Kunjungan Anda', 40, finalY + 18, { align: 'center' });

    doc.save(`struk-${trx.id}.pdf`);
  };

  const generatePDF = (shouldPrint = false) => {
    const doc = new jsPDF();
    const currentTab = tabs.find(t => t.id === reportType);
    const title = `Laporan ${currentTab?.label || ''} - ${new Date().toLocaleDateString()}`;
    
    doc.setFontSize(18);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Periode: ${startDate || 'Semua'} s/d ${endDate || 'Semua'}`, 14, 28);

    let head: string[][] = [];
    let body: any[][] = [];

    switch (reportType) {
      case 'sales':
        head = [['ID', 'Waktu', 'Customer', 'Total', 'Metode']];
        body = filteredTransactions.map((t: any) => [t.id, new Date(t.date).toLocaleString(), t.customerName || '-', formatCurrency(t.total), t.paymentMethod]);
        break;
      case 'stock': {
        const stockItems: { id: string; name: string; variantName?: string; stock: number; buyPrice: number; sellPrice: number; category: string }[] = [];
        products.forEach((p: any) => {
          if (p.hasVariants && p.variants && p.variants.length > 0) {
            p.variants.forEach((v: any) => {
              stockItems.push({
                id: `${p.id}-${v.id}`,
                name: p.name,
                variantName: v.name,
                stock: Number(v.stock) || 0,
                buyPrice: Number(v.buyPrice || p.buyPrice || 0),
                sellPrice: Number(v.sellPrice || p.sellPrice || 0),
                category: p.category || '-'
              });
            });
          } else {
            stockItems.push({
              id: p.id,
              name: p.name,
              stock: Number(p.stock) || 0,
              buyPrice: Number(p.buyPrice || 0),
              sellPrice: Number(p.sellPrice || 0),
              category: p.category || '-'
            });
          }
        });
        stockItems.sort((a, b) => {
          if (stockSort === 'name') {
            const catA = a.category.toLowerCase();
            const catB = b.category.toLowerCase();
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
          } else {
            return a.stock - b.stock;
          }
        });
        head = [['Barang', 'Kategori', 'Stok', 'Nilai Modal', 'Potensi Jual']];
        body = stockItems.map((p) => [
          p.variantName ? `${p.name} - ${p.variantName}` : p.name, 
          p.category, 
          p.stock.toString(), 
          formatCurrency(p.stock * p.buyPrice), 
          formatCurrency(p.stock * p.sellPrice)
        ]);
        break;
      }
      case 'best_selling': {
        const bestSelling: Record<string, {productName: string, variantName?: string, count: number, revenue: number, profit: number}> = {};
        filteredTransactions.forEach((t: any) => {
          t.items.forEach((item: any) => {
             if (item.isPulse) return;
             const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
             if (!bestSelling[key]) {
               bestSelling[key] = { productName: item.name, variantName: item.variantName, count: 0, revenue: 0, profit: 0 };
             }
             bestSelling[key].count += item.quantity;
             bestSelling[key].revenue += item.subtotal;
             const product = products.find((p: any) => p.id === item.productId);
             let buyPrice = 0;
             if (product) {
               buyPrice = product.buyPrice || 0;
               if (item.variantId && product.variants) {
                 const variant = product.variants.find((v: any) => v.id === item.variantId);
                 if (variant && variant.buyPrice) buyPrice = variant.buyPrice;
               }
             }
             bestSelling[key].profit += (item.price - buyPrice) * item.quantity;
          });
        });
        const sortedBestSelling = Object.values(bestSelling).filter(v => v.count > 0).sort((a, b) => b.count - a.count);
        head = [['Nama Barang', 'Terjual', 'Omzet', 'Profit']];
        body = sortedBestSelling.map((v) => [
          v.variantName ? `${v.productName} - ${v.variantName}` : v.productName,
          v.count.toString(),
          formatCurrency(v.revenue),
          formatCurrency(v.profit)
        ]);
        break;
      }
      case 'stock_log':
        head = [['Waktu', 'Barang', 'Tipe', 'Jumlah', 'Catatan', 'Info', 'User']];
        body = filteredStockMovements.map((m: any) => [
          new Date(m.date).toLocaleString(), 
          m.variantName ? `${m.productName} - ${m.variantName}` : m.productName,
          m.type === 'in' ? 'Stok Masuk' : m.type === 'return' ? 'Retur' : 'Stok Keluar',
          `${m.type === 'in' ? '+' : '-'}${m.quantity}`,
          m.description || '-',
          m.type === 'in' ? (m.supplierId || '-') : m.type === 'return' ? (m.returnReason || '-') : '-',
          m.userRole || '-'
        ]);
        break;
      case 'expenses':
        head = [['Waktu', 'Nama', 'Kategori', 'Jumlah']];
        body = filteredExpenses.map((e: any) => [new Date(e.date).toLocaleString(), e.name, e.category, formatCurrency(e.amount)]);
        break;
      case 'digital':
        head = [['Waktu', 'Tipe', 'Nominal']];
        body = filteredDigitalTopups.map((tp: any) => [
          new Date(tp.date).toLocaleString(), 
          tp.platform, 
          formatCurrency(tp.amount)
        ]);
        break;
      case 'transfers':
        head = [['Waktu', 'Dari', 'Ke', 'Jumlah', 'Catatan']];
        body = filteredTransfers.map((t: any) => [
          new Date(t.date).toLocaleString(), 
          t.from.toUpperCase(), 
          t.to.toUpperCase(), 
          formatCurrency(t.amount), 
          t.note || '-'
        ]);
        break;
      case 'profit': {
        const totalSales = filteredTransactions.reduce((acc: number, t: any) => acc + t.total, 0);
        const totalCost = filteredTransactions.reduce((acc: number, t: any) => {
          return acc + t.items.reduce((itemAcc: number, item: any) => {
            if (item.isPulse) {
              const nominal = parseInt(item.productId.split('-')[1]);
              return itemAcc + nominal * item.quantity;
            }
            const product = products.find((p: any) => p.id === item.productId);
            if (!product) return itemAcc;
            let buyPrice = product.buyPrice;
            if (item.variantId && product.variants) {
              const variant = product.variants.find((v: any) => v.id === item.variantId);
              if (variant && variant.buyPrice) buyPrice = variant.buyPrice;
            }
            return itemAcc + buyPrice * item.quantity;
          }, 0);
        }, 0);
        const totalExpense = filteredExpenses.reduce((acc: number, e: any) => acc + e.amount, 0);
        const totalAdjustmentIncome = filteredHistory.filter((h: any) => h.difference > 0).reduce((acc: number, h: any) => acc + h.difference, 0);
        const totalAdjustmentExpense = filteredHistory.filter((h: any) => h.difference < 0).reduce((acc: number, h: any) => acc + Math.abs(h.difference), 0);
        const finalRevenue = totalSales + totalAdjustmentIncome;
        const finalExpense = totalExpense + totalAdjustmentExpense;
        const netProfit = finalRevenue - totalCost - finalExpense;

        head = [['Metrik', 'Nilai']];
        body = [
          ['Total Penjualan + Mutasi (+)', formatCurrency(finalRevenue)],
          ['Total Modal (COGS)', formatCurrency(totalCost)],
          ['Total Beban + Mutasi (-)', formatCurrency(finalExpense)],
          ['Laba Bersih', formatCurrency(netProfit)]
        ];
        break;
      }
      default:
        doc.text("Laporan detail belum tersedia untuk format PDF tipe ini.", 14, 40);
        if (shouldPrint) doc.autoPrint();
        doc.save(`${reportType}-report.pdf`);
        return;
    }

    autoTable(doc, {
      head,
      body,
      startY: 35,
      theme: 'grid',
      styles: { fontSize: 8, font: 'helvetica' },
      headStyles: { fillColor: '#1e293b' }
    });

    if (shouldPrint) {
      doc.autoPrint();
      window.open(doc.output('bloburl'), '_blank');
    } else {
      doc.save(`${reportType}-report.pdf`);
    }
  };

  const filteredTransactions = transactions.filter((t: any) => {
    const tDate = t.date.split('T')[0];
    if (startDate && tDate < startDate) return false;
    if (endDate && tDate > endDate) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredExpenses = expenses.filter((e: any) => {
    const eDate = e.date.split('T')[0];
    if (startDate && eDate < startDate) return false;
    if (endDate && eDate > endDate) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredDigitalTopups = digitalTopups.filter((tp: any) => {
    const tpDate = tp.date.split('T')[0];
    if (startDate && tpDate < startDate) return false;
    if (endDate && tpDate > endDate) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredStockMovements = stockMovements.filter((mov: any) => {
    const movDate = mov.date.split('T')[0];
    if (startDate && movDate < startDate) return false;
    if (endDate && movDate > endDate) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredTransfers = (transfers || []).filter((t: any) => {
    const tDate = t.date.split('T')[0];
    if (startDate && tDate < startDate) return false;
    if (endDate && tDate > endDate) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredHistory = (cashBankHistory || []).filter((h: any) => {
    const hDate = h.date.split('T')[0];
    if (startDate && hDate < startDate) return false;
    if (endDate && hDate > endDate) return false;
    return true;
  }).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const tabs = [
    { id: 'sales', label: 'Penjualan' },
    { id: 'stock', label: 'Stok Barang' },
    { id: 'best_selling', label: 'Barang Terlaris' },
    { id: 'stock_log', label: 'Log Stok' },
    { id: 'expenses', label: 'Pengeluaran' },
    { id: 'digital', label: 'Digital Asset' },
    { id: 'transfers', label: 'Mutasi Kas' },
    { id: 'profit', label: 'Laba Rugi' },
  ];

  const renderContent = () => {
    switch (reportType) {
      case 'transfers':
        return (
          <div className="flex flex-col h-full">
             <div className="p-6 bg-slate-50 border-b flex justify-between items-center text-blue-600">
              <div className="text-[10px] font-black uppercase tracking-[0.2em]">Total Mutasi Antar Rekening</div>
              <div className="text-xl font-black">{filteredTransfers.length} Mutasi</div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Dari</th><th className="px-6 py-4">Ke</th><th className="px-6 py-4 text-right">Jumlah</th><th className="px-6 py-4">Catatan</th></tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {filteredTransfers.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-[10px]">{new Date(t.date).toLocaleString()}</td>
                      <td className="px-6 py-4 uppercase text-xs">{t.from}</td>
                      <td className="px-6 py-4 uppercase text-xs">{t.to}</td>
                      <td className="px-6 py-4 text-right">{formatCurrency(t.amount)}</td>
                      <td className="px-6 py-4 text-slate-400 italic text-xs">{t.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransfers.length === 0 && <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs">Tidak ada data mutasi</div>}
            </div>
          </div>
        );
      case 'best_selling':
        const bestSelling: Record<string, {productName: string, variantName?: string, count: number, revenue: number, profit: number}> = {};
        
        filteredTransactions.forEach((t: any) => {
          t.items.forEach((item: any) => {
             // Exclude digital asset if needed, but let's include all non-pulse physical/variant items
             if (item.isPulse) return;
             
             const key = item.variantId ? `${item.productId}-${item.variantId}` : item.productId;
             
             if (!bestSelling[key]) {
               bestSelling[key] = { 
                 productName: item.name, 
                 variantName: item.variantName, 
                 count: 0, 
                 revenue: 0, 
                 profit: 0 
               };
             }
             bestSelling[key].count += item.quantity;
             bestSelling[key].revenue += item.subtotal;
             
             const product = products.find((p: any) => p.id === item.productId);
             let buyPrice = 0;
             if (product) {
               buyPrice = product.buyPrice || 0;
               if (item.variantId && product.variants) {
                 const variant = product.variants.find((v: any) => v.id === item.variantId);
                 if (variant && variant.buyPrice) buyPrice = variant.buyPrice;
               }
             }
             bestSelling[key].profit += (item.price - buyPrice) * item.quantity;
          });
        });
        
        const sortedBestSelling = Object.values(bestSelling)
          .filter(v => v.count > 0)
          .sort((a, b) => b.count - a.count);

        return (
          <div className="flex flex-col h-full">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center shrink-0">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Peringkat Barang Terlaris</div>
              <div className="text-xl font-black text-blue-600">{sortedBestSelling.length} Barang Terjual</div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left bg-white">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">Nama Barang</th>
                    <th className="px-6 py-4 text-center">Terjual</th>
                    <th className="px-6 py-4 text-right">Omzet</th>
                    <th className="px-6 py-4 text-right">Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {sortedBestSelling.map((v, i) => (
                    <tr key={i} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-slate-800">{v.productName}</div>
                        {v.variantName && <div className="text-[10px] text-slate-400 uppercase mt-1 font-black">{v.variantName}</div>}
                      </td>
                      <td className="px-6 py-4 text-center text-slate-700">{v.count}</td>
                      <td className="px-6 py-4 text-right text-slate-700">{formatCurrency(v.revenue)}</td>
                      <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(v.profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {sortedBestSelling.length === 0 && (
                <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs">
                  Belum ada data barang terjual
                </div>
              )}
            </div>
          </div>
        );
    case 'sales':
        const totalSalesVal = filteredTransactions.reduce((acc: number, t: any) => acc + t.total, 0);
        return (
          <div className="flex flex-col h-full">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Summary Penjualan</div>
              <div className="text-xl font-black text-emerald-600">{formatCurrency(totalSalesVal)}</div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">ID Transaksi</th>
                    <th className="px-6 py-4">Tanggal</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Total</th>
                    <th className="px-6 py-4">Metode</th>
                    <th className="px-6 py-4 text-right">PDF</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {filteredTransactions.map((t: any) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => setSelectedTransaction(t)}
                          className="text-blue-600 hover:underline cursor-pointer"
                        >
                          {t.id}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-[10px] text-slate-400">
                        {new Date(t.date).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                        <div className="text-[9px] opacity-60">{new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</div>
                      </td>
                      <td className="px-6 py-4">{t.customerName}</td>
                      <td className="px-6 py-4 text-emerald-600">{formatCurrency(t.total)}</td>
                      <td className="px-6 py-4 uppercase text-[10px] tracking-widest">{t.paymentMethod}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => downloadTransactionPDF(t)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                          title="Download Struk PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredTransactions.length === 0 && <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs">Tidak ada data transaksi</div>}
            </div>
          </div>
        );
      case 'stock': {
        const stockItems: { id: string; name: string; variantName?: string; stock: number; buyPrice: number; sellPrice: number; category: string }[] = [];
        
        products.forEach((p: any) => {
          if (p.hasVariants && p.variants && p.variants.length > 0) {
            p.variants.forEach((v: any) => {
              stockItems.push({
                id: `${p.id}-${v.id}`,
                name: p.name,
                variantName: v.name,
                stock: Number(v.stock) || 0,
                buyPrice: Number(v.buyPrice || p.buyPrice || 0),
                sellPrice: Number(v.sellPrice || p.sellPrice || 0),
                category: p.category || '-'
              });
            });
          } else {
            stockItems.push({
              id: p.id,
              name: p.name,
              stock: Number(p.stock) || 0,
              buyPrice: Number(p.buyPrice || 0),
              sellPrice: Number(p.sellPrice || 0),
              category: p.category || '-'
            });
          }
        });

        const totalStockValue = stockItems.reduce((acc, item) => acc + (item.stock * item.buyPrice), 0);
        const totalPotentialRevenue = stockItems.reduce((acc, item) => acc + (item.stock * item.sellPrice), 0);

        stockItems.sort((a, b) => {
          if (stockSort === 'name') {
            const catA = a.category.toLowerCase();
            const catB = b.category.toLowerCase();
            if (catA < catB) return -1;
            if (catA > catB) return 1;
            const nameA = a.name.toLowerCase();
            const nameB = b.name.toLowerCase();
            if (nameA < nameB) return -1;
            if (nameA > nameB) return 1;
            return 0;
          } else {
            return a.stock - b.stock;
          }
        });

        return (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 p-6 bg-slate-50 border-b gap-4 shrink-0">
              <div>
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Nilai Stok (Modal)</div>
                <div className="text-lg font-black text-slate-800">{formatCurrency(totalStockValue)}</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Estimasi Omzet (Jual)</div>
                <div className="text-lg font-black text-emerald-600">{formatCurrency(totalPotentialRevenue)}</div>
              </div>
            </div>
            <div className="p-4 border-b flex justify-between items-center bg-white shrink-0">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Daftar Stok Barang</div>
              <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                <button 
                  onClick={() => setStockSort('name')}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all", stockSort === 'name' ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Kategori
                </button>
                <button 
                  onClick={() => setStockSort('stock_asc')}
                  className={cn("px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all", stockSort === 'stock_asc' ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700")}
                >
                  Stok Tipis
                </button>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-left bg-white">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4">Barang</th>
                    <th className="px-6 py-4 text-center">Stok</th>
                    <th className="px-6 py-4 text-right">Nilai Modal</th>
                    <th className="px-6 py-4 text-right">Potensi Jual</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {stockItems.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-slate-800">{item.name}</div>
                        {item.variantName && <div className="text-[10px] text-slate-400 uppercase mt-1 font-black">{item.variantName}</div>}
                        <div className="text-[10px] text-blue-400 font-black mt-1">[{item.category}]</div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {item.stock === 0 ? (
                          <span className="bg-rose-100 text-rose-600 text-[10px] px-2 py-1 rounded-md uppercase font-black">OUT</span>
                        ) : (
                          <span className={cn("text-lg", item.stock < 5 ? "text-rose-500" : "text-slate-700")}>{item.stock}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-slate-600">{formatCurrency(item.stock * item.buyPrice)}</td>
                      <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(item.stock * item.sellPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }
      case 'digital':
        const totalDigitalAdded = filteredDigitalTopups.reduce((acc: number, tp: any) => acc + tp.amount, 0);
        return (
          <div className="flex flex-col h-full">
             <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Top Up Digital</div>
              <div className="text-xl font-black text-blue-600">{formatCurrency(totalDigitalAdded)}</div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Tipe</th><th className="px-6 py-4 text-right">Nominal</th></tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {filteredDigitalTopups.map((tp: any) => (
                    <tr key={tp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="text-sm">{tp.platform}</div>
                        <div className="text-[10px] text-slate-400 uppercase">{new Date(tp.date).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest",
                          tp.type === 'pulsa' ? "bg-blue-50 text-blue-600" : "bg-purple-50 text-purple-600"
                        )}>{tp.type}</span>
                      </td>
                      <td className="px-6 py-4 text-right text-emerald-600">{formatCurrency(tp.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredDigitalTopups.length === 0 && <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs">Tidak ada data topup digital</div>}
            </div>
          </div>
        );
      case 'expenses':
        const totalExp = filteredExpenses.reduce((acc: number, e: any) => acc + e.amount, 0);
        return (
          <div className="flex flex-col h-full">
             <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Pengeluaran</div>
              <div className="text-xl font-black text-rose-600">{formatCurrency(totalExp)}</div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr><th className="px-6 py-4">Waktu</th><th className="px-6 py-4">Nama</th><th className="px-6 py-4">Kategori</th><th className="px-6 py-4 text-right">Jumlah</th></tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {filteredExpenses.map((exp: any) => (
                    <tr key={exp.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-[10px]">{new Date(exp.date).toLocaleString()}</td>
                      <td className="px-6 py-4">{exp.name}</td>
                      <td className="px-6 py-4"><span className="px-2 py-0.5 bg-slate-100 rounded text-[8px] font-black uppercase">{exp.category}</span></td>
                      <td className="px-6 py-4 text-right text-rose-500">{formatCurrency(exp.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredExpenses.length === 0 && <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs">Tidak ada data pengeluaran</div>}
            </div>
          </div>
        );
      case 'profit':
        const totalSales = filteredTransactions.reduce((acc: number, t: any) => acc + t.total, 0);
        const totalCost = filteredTransactions.reduce((acc: number, t: any) => {
          return acc + t.items.reduce((itemAcc: number, item: any) => {
            if (item.isPulse) {
              const nominal = parseInt(item.productId.split('-')[1]);
              return itemAcc + nominal * item.quantity;
            }
            const product = products.find((p: any) => p.id === item.productId);
            if (!product) return itemAcc;
            
            let buyPrice = product.buyPrice;
            if (item.variantId && product.variants) {
              const variant = product.variants.find((v: any) => v.id === item.variantId);
              if (variant && variant.buyPrice) buyPrice = variant.buyPrice;
            }
            
            return itemAcc + buyPrice * item.quantity;
          }, 0);
        }, 0);
        const totalExpense = filteredExpenses.reduce((acc: number, e: any) => acc + e.amount, 0);
        
        const totalAdjustmentIncome = filteredHistory.filter((h: any) => h.difference > 0).reduce((acc: number, h: any) => acc + h.difference, 0);
        const totalAdjustmentExpense = filteredHistory.filter((h: any) => h.difference < 0).reduce((acc: number, h: any) => acc + Math.abs(h.difference), 0);

        const finalRevenue = totalSales + totalAdjustmentIncome;
        const finalExpense = totalExpense + totalAdjustmentExpense;
        const netProfit = finalRevenue - totalCost - finalExpense;

        return (
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Penjualan + Mutasi (+)</div>
                <div className="text-2xl font-black text-slate-800">{formatCurrency(finalRevenue)}</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Modal (COGS)</div>
                <div className="text-2xl font-black text-slate-800">{formatCurrency(totalCost)}</div>
              </div>
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Beban + Mutasi (-)</div>
                <div className="text-2xl font-black text-slate-800">{formatCurrency(finalExpense)}</div>
              </div>
            </div>
            <div className={cn(
              "p-8 rounded-[40px] text-white flex flex-col items-center justify-center text-center shadow-2xl",
              netProfit >= 0 ? "bg-emerald-500 shadow-emerald-100" : "bg-rose-500 shadow-rose-100"
            )}>
              <div className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-[0.2em]">{netProfit >= 0 ? 'Laba Bersih' : 'Rugi Bersih'}</div>
              <div className="text-5xl font-black mb-4">{formatCurrency(netProfit)}</div>
              <div className="text-[10px] font-bold opacity-60 uppercase">{new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</div>
            </div>
          </div>
        );
      case 'stock_log':
        const totalIn = filteredStockMovements.filter((m: any) => m.type === 'in').reduce((acc: number, m: any) => acc + Math.abs(m.quantity), 0);
        const totalOut = filteredStockMovements.filter((m: any) => m.type === 'out').reduce((acc: number, m: any) => acc + Math.abs(m.quantity), 0);
        return (
          <div className="flex flex-col h-full">
            <div className="grid grid-cols-2 p-6 bg-slate-50 border-b gap-4">
              <div>
                <div className="text-[8px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Stok Masuk</div>
                <div className="text-lg font-black text-slate-800">+{totalIn} unit</div>
              </div>
              <div className="text-right">
                <div className="text-[8px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Stok Keluar</div>
                <div className="text-lg font-black text-slate-800">-{totalOut} unit</div>
              </div>
            </div>
            <div className="overflow-auto">
              <table className="w-full text-left">
                <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                  <tr>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Barang</th>
                    <th className="px-6 py-4">Tipe</th>
                    <th className="px-6 py-4 text-center">Jumlah</th>
                    <th className="px-6 py-4">Keterangan</th>
                  </tr>
                </thead>
                <tbody className="divide-y text-sm font-bold">
                  {filteredStockMovements.map((mov: any) => (
                    <tr key={mov.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-slate-400 text-[10px]">
                        {new Date(mov.date).toLocaleString('id-ID')}
                      </td>
                      <td className="px-6 py-4">{mov.productName}</td>
                      <td className="px-6 py-4 uppercase text-[10px]">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full shrink-0",
                          mov.type === 'in' ? "bg-emerald-50 text-emerald-600" : 
                          mov.type === 'out' ? "bg-rose-50 text-rose-600" : 
                          mov.type === 'return' ? "bg-orange-50 text-orange-600" :
                          "bg-blue-50 text-blue-600"
                        )}>
                          {mov.type === 'in' ? 'Stok Masuk' : 
                           mov.type === 'out' ? 'Stok Keluar' : 
                           mov.type === 'return' ? 'Retur' : 
                           'Penyesuaian'}
                        </span>
                      </td>
                      <td className={cn(
                        "px-6 py-4 text-center",
                        (mov.type === 'in') ? "text-emerald-600" : "text-rose-600"
                      )}>
                        {mov.type === 'in' ? `+${mov.quantity}` : `${mov.quantity}`}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-xs text-slate-700 font-bold">{mov.description}</div>
                        {(mov.supplierId || mov.returnReason) && (
                          <div className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-tighter">
                            {mov.type === 'in' ? `Supplier: ${mov.supplierId || 'Umum'}` : `Alasan: ${mov.returnReason || '-'}`}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filteredStockMovements.length === 0 && <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs">Tidak ada log pergerakan stok</div>}
            </div>
          </div>
        );
      default:
        return <div className="py-20 text-center text-slate-300 uppercase font-black tracking-widest text-xs">Laporan {reportType} belum diimplementasi detail</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-6 justify-between items-center">
        <div className="flex bg-slate-50 p-1 rounded-2xl w-full lg:w-auto overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setReportType(tab.id)} className={cn("px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap", reportType === tab.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-600")}>{tab.label}</button>
          ))}
        </div>

        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100 flex-1 lg:flex-none">
            <Filter className="w-3 h-3 text-slate-400" />
            <input type="date" className="bg-transparent border-none text-[10px] font-bold outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
            <span className="text-slate-300">-</span>
            <input type="date" className="bg-transparent border-none text-[10px] font-bold outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
            {(startDate || endDate) && (
              <button onClick={() => { setStartDate(''); setEndDate(''); }} className="p-1 hover:bg-slate-200 rounded text-slate-400"><X className="w-3 h-3" /></button>
            )}
          </div>
          <div className="flex gap-2">
             <button onClick={() => generatePDF(true)} className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-500 rounded-xl transition-colors" title="Print PDF"><Printer className="w-4 h-4" /></button>
             <button onClick={() => generatePDF(false)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-500 rounded-xl transition-colors" title="Download PDF"><Download className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden min-h-[500px]">
        {renderContent()}
      </div>

      <AnimatePresence>
        {selectedTransaction && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-8 bg-slate-900 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-black uppercase tracking-widest text-sm">Detail Transaksi</h3>
                  <p className="text-[10px] text-white/40 mt-1 uppercase font-bold">{selectedTransaction.id}</p>
                </div>
                <button onClick={() => setSelectedTransaction(null)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-8 space-y-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Customer</span>
                    </div>
                    <div className="text-sm font-black text-slate-800">{selectedTransaction.customerName || 'Pelanggan'}</div>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                      <Calendar className="w-3 h-3" />
                      <span className="text-[8px] font-black uppercase tracking-widest">Waktu</span>
                    </div>
                    <div className="text-sm font-black text-slate-800">{new Date(selectedTransaction.date).toLocaleDateString()}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Item Belanja</div>
                  <div className="space-y-3 max-h-60 overflow-auto pr-2 custom-scrollbar">
                    {selectedTransaction.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-slate-300">
                            <Package className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-black text-slate-800 leading-tight">{item.name}</div>
                            <div className="text-[9px] text-slate-400 font-bold uppercase">{item.quantity} x {formatCurrency(item.price)}</div>
                          </div>
                        </div>
                        <div className="text-sm font-black text-slate-800">{formatCurrency(item.price * item.quantity)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t space-y-2">
                   {selectedTransaction.discount > 0 && (
                     <div className="flex justify-between items-center text-rose-500">
                       <span className="text-[10px] font-black uppercase tracking-widest">Potongan Diskon</span>
                       <span className="font-black text-sm">-{formatCurrency(selectedTransaction.discount)}</span>
                     </div>
                   )}
                   <div className="flex justify-between items-end pt-2">
                      <div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Bayar</div>
                        <div className="flex items-center gap-2 text-slate-400 text-[10px] font-bold">
                          <CreditCard className="w-3 h-3" />
                          {selectedTransaction.paymentMethod}
                        </div>
                      </div>
                      <div className="text-3xl font-black text-emerald-600">{formatCurrency(selectedTransaction.total)}</div>
                   </div>
                </div>

                 <div className="flex gap-3">
                   <button 
                     onClick={() => setShowDeleteConfirm(selectedTransaction)} 
                     disabled={isDeleting}
                     className="flex-1 py-4 bg-rose-50 text-rose-500 font-black rounded-2xl uppercase tracking-[0.2em] text-[10px] hover:bg-rose-100 active:scale-95 transition-all disabled:opacity-50"
                   >
                     Hapus Transaksi
                   </button>
                   <button 
                     onClick={() => setSelectedTransaction(null)} 
                     className="flex-1 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl shadow-slate-100 uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-95 transition-all"
                   >
                     Tutup Detail
                   </button>
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
       <AnimatePresence>
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[60] p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[40px] w-full max-w-sm p-8 text-center"
            >
              <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-rose-500" />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Konfirmasi Hapus</h3>
              <p className="text-sm text-slate-500 font-bold mb-8 leading-relaxed">
                Yakin ingin menghapus transaksi <span className="text-slate-900 font-black">{showDeleteConfirm.id}</span>? 
                <br/>Stok akan dikembalikan dan saldo akan dikurangi.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowDeleteConfirm(null)}
                  className="py-4 bg-slate-100 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-[10px] hover:bg-slate-200"
                >
                  Batal
                </button>
                <button 
                  onClick={() => deleteTransaction(showDeleteConfirm)}
                  disabled={isDeleting}
                  className="py-4 bg-rose-500 text-white font-black rounded-2xl uppercase tracking-widest text-[10px] shadow-lg shadow-rose-100 hover:bg-rose-600 disabled:opacity-50"
                >
                  {isDeleting ? 'Menghapus...' : 'Ya, Hapus'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// X import moved to top
