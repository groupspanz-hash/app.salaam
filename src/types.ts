/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  buyPrice?: number;
  sellPrice?: number;
  stock: number;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  category: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  minStock: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
}

export interface TransactionItem {
  productId: string;
  variantId?: string;
  name: string;
  variantName?: string;
  quantity: number;
  price: number;
  subtotal: number;
  isPulse?: boolean;
  digitalType?: 'pulsa' | 'transfer';
}

export interface Transaction {
  id: string;
  date: string;
  customerName?: string;
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  tax: number;
  total: number;
  paymentMethod: 'Cash' | 'Transfer' | 'QRIS' | 'E-wallet';
}

export interface Expense {
  id: string;
  date: string;
  name: string;
  category: 'Operasional' | 'Gaji' | 'Listrik' | 'Internet' | 'Transportasi' | 'Belanja barang' | 'Sewa tempat' | 'Lainnya';
  amount: number;
  description?: string;
}

export interface DigitalTopUp {
  id: string;
  date: string;
  amount: number;
  platform: string;
  type: 'pulsa' | 'transfer';
}

export interface BankTransfer {
  id: string;
  date: string;
  from: 'cash' | 'bank';
  to: 'cash' | 'bank';
  amount: number;
  note?: string;
}

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: 'in' | 'out' | 'adjustment' | 'return';
  quantity: number;
  date: string;
  description?: string;
  supplierId?: string;
  returnReason?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address: string;
  email?: string;
}

export interface ReturnReason {
  id: string;
  label: string;
}

export interface StoreProfile {
  name: string;
  address: string;
  phone: string;
}
