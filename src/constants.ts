import { Product, Expense, StoreProfile } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: 'BRG002', name: 'KC Samsung Colour', category: 'KC', buyPrice: 8500, sellPrice: 20000, stock: 3, minStock: 0 },
  { id: '2', code: 'BRG003', name: 'GURITA', category: 'ETC', buyPrice: 950, sellPrice: 5000, stock: 5, minStock: 0 },
  { id: '3', code: 'BRG004', name: 'HS Bluetooth Hippo Mono', category: 'HS', buyPrice: 75000, sellPrice: 120000, stock: 2, minStock: 0 },
  { id: '4', code: 'BRG005', name: 'HS Gaming XG', category: 'HS', buyPrice: 57000, sellPrice: 98000, stock: 1, minStock: 0 },
  { id: '5', code: 'BRG006', name: 'FAN', category: 'FAN', buyPrice: 30000, sellPrice: 60000, stock: 3, minStock: 0 },
  { id: '6', code: 'BRG007', name: 'HS Bluetooth TWS Macaron', category: 'HS', buyPrice: 50000, sellPrice: 100000, stock: 2, minStock: 0 },
  { id: '7', code: 'BRG008', name: 'Pocket Stand Grip Cartoon', category: 'ETC', buyPrice: 6500, sellPrice: 15000, stock: 6, minStock: 0 },
  { id: '8', code: 'BRG009', name: 'KP ISAT 3GB', category: 'KP', buyPrice: 35000, sellPrice: 40000, stock: 1, minStock: 0 },
  { id: '9', code: 'BRG010', name: 'KP TRI AON 2GB', category: 'KP', buyPrice: 15500, sellPrice: 22000, stock: 2, minStock: 0 },
  { 
    id: '10', code: 'BRG011', name: 'MC Sandisk', category: 'MM', buyPrice: 69500, sellPrice: 150000, stock: 1, minStock: 0, hasVariants: true,
    variants: [
      { id: '10-1', productId: '10', name: '16 GB', buyPrice: 70000, sellPrice: 150000, stock: 0 },
      { id: '10-2', productId: '10', name: '32 GB', buyPrice: 69500, sellPrice: 150000, stock: 1 }
    ]
  },
  { id: '11', code: 'BRG012', name: 'Pocket PUBG', category: 'ETC', buyPrice: 1900, sellPrice: 10000, stock: 19, minStock: 1 },
  { id: '12', code: 'BRG013', name: 'Tali HP', category: 'ETC', buyPrice: 5000, sellPrice: 10000, stock: 4, minStock: 1 },
  { id: '13', code: 'BRG014', name: 'Tripod Gorila besar gurita', category: 'ETC', buyPrice: 42000, sellPrice: 80000, stock: 0, minStock: 0 },
  { id: '14', code: 'BRG015', name: 'Trigger 15k', category: 'ETC', buyPrice: 5000, sellPrice: 15000, stock: 1, minStock: 0 },
  { id: '15', code: 'BRG016', name: 'Trigger 20k', category: 'ETC', buyPrice: 10000, sellPrice: 20000, stock: 1, minStock: 0 },
  {
    id: '16', code: 'BRG017', name: 'OTG', category: 'ETC', buyPrice: 4950, sellPrice: 15000, stock: 12, minStock: 0, hasVariants: true,
    variants: [
      { id: '16-1', productId: '16', name: 'Type Micro', buyPrice: 4950, sellPrice: 15000, stock: 6 },
      { id: '16-2', productId: '16', name: 'Type C', buyPrice: 5700, sellPrice: 17000, stock: 6 }
    ]
  },
  {
    id: '17', code: 'BRG018', name: 'MC Vgen', category: 'MM', buyPrice: 45000, sellPrice: 70000, stock: 6, minStock: 0, hasVariants: true,
    variants: [
      { id: '17-1', productId: '17', name: '16GB', buyPrice: 45000, sellPrice: 70000, stock: 2 },
      { id: '17-2', productId: '17', name: '32GB', buyPrice: 50000, sellPrice: 80000, stock: 1 },
      { id: '17-3', productId: '17', name: '64 GB', buyPrice: 80000, sellPrice: 120000, stock: 1 },
      { id: '17-4', productId: '17', name: '128 GB', buyPrice: 130000, sellPrice: 180000, stock: 2 }
    ]
  },
  { id: '18', code: 'BRG019', name: 'SP Gaming RS200', category: 'SPEAKER', buyPrice: 115000, sellPrice: 185000, stock: 2, minStock: 0 },
  { id: '19', code: 'BRG020', name: 'KP XL 3gb', category: 'KP', buyPrice: 35000, sellPrice: 40000, stock: 0, minStock: 0 },
  {
    id: '20', code: 'BRG021', name: 'KP SMARTFREN', category: 'KP', buyPrice: 25000, sellPrice: 30000, stock: 5, minStock: 0, hasVariants: true,
    variants: [
      { id: '20-1', productId: '20', name: 'Reguler', buyPrice: 25000, sellPrice: 30000, stock: 0 },
      { id: '20-2', productId: '20', name: '3GB', buyPrice: 30000, sellPrice: 38000, stock: 5 }
    ]
  },
  { id: '21', code: 'BRG022', name: 'Bluetooth Receiver CK 02', category: 'ETC', buyPrice: 9900, sellPrice: 23000, stock: 1, minStock: 0 },
  { id: '22', code: 'BRG023', name: 'HS Roker Acoustic', category: 'HS', buyPrice: 37000, sellPrice: 70000, stock: 1, minStock: 0 },
  { id: '23', code: 'BRG024', name: 'Case Bening', category: 'CASE', buyPrice: 15000, sellPrice: 10000, stock: 49, minStock: 20 },
  { id: '24', code: 'BRG025', name: 'Pelindung Kabel', category: 'ETC', buyPrice: 1000, sellPrice: 3000, stock: 6, minStock: 0 },
  { id: '25', code: 'BRG026', name: 'Tali HP Viral', category: 'ETC', buyPrice: 7200, sellPrice: 25000, stock: 15, minStock: 1 },
  { id: '26', code: 'BRG027', name: 'HS Macaron Warna', category: 'HS', buyPrice: 8000, sellPrice: 25000, stock: 0, minStock: 1 },
  { id: '27', code: 'BRG028', name: 'CHR Foomee 2.4A White', category: 'CHR', buyPrice: 36000, sellPrice: 90000, stock: 1, minStock: 0 },
  { id: '28', code: 'BRG029', name: 'CHR Kodok', category: 'CHR', buyPrice: 10000, sellPrice: 30000, stock: 1, minStock: 0 },
  { id: '29', code: 'BRG030', name: 'Sarung Tangan Jempol Gaming', category: 'ETC', buyPrice: 2000, sellPrice: 15000, stock: 4, minStock: 0 },
  { id: '30', code: 'BRG031', name: 'KD Norton Micro dan Type C', category: 'KD', buyPrice: 5000, sellPrice: 15000, stock: 59, minStock: 5 },
  { id: '31', code: 'BRG032', name: 'KP Telkom 3gb', category: 'KP', buyPrice: 30000, sellPrice: 39000, stock: 0, minStock: 1 },
  { id: '32', code: 'BRG033', name: 'KP AXIS 3GB', category: 'KP', buyPrice: 35000, sellPrice: 40000, stock: 1, minStock: 0 },
  { id: '33', code: 'BRG034', name: 'SP Bluetooth Satoo', category: 'SPEAKER', buyPrice: 70000, sellPrice: 130000, stock: 2, minStock: 0 },
  { id: '34', code: 'BRG035', name: 'Amplop', category: 'ETC', buyPrice: 160, sellPrice: 500, stock: 52, minStock: 0 },
  { id: '35', code: 'BRG036', name: 'HOLDER STAND HP REXI HM01', category: 'ETC', buyPrice: 43000, sellPrice: 80000, stock: 2, minStock: 0 },
  { id: '36', code: 'BRG037', name: 'HS BLUETOOTH MAGNETIC SPORT', category: 'HS', buyPrice: 15000, sellPrice: 38000, stock: 0, minStock: 0 },
  { id: '37', code: 'BRG038', name: 'USB HUB PORT ON OFF', category: 'ETC', buyPrice: 25000, sellPrice: 60000, stock: 1, minStock: 0 },
  { id: '38', code: 'BRG039', name: 'WATERPROOF CASE UNIVERSAL', category: 'CASE', buyPrice: 5000, sellPrice: 18000, stock: 16, minStock: 0 },
  { id: '39', code: 'BRG040', name: 'Converter sambungan Micro ke Type C', category: 'OTG', buyPrice: 2000, sellPrice: 10000, stock: 9, minStock: 0 },
  { id: '40', code: 'BRG041', name: 'OTG YI-TAI', category: 'OTG', buyPrice: 7000, sellPrice: 15000, stock: 9, minStock: 0 },
  { id: '41', code: 'BRG042', name: 'Kabel AUX Jack Audio 2 in 1', category: 'SPEAKER', buyPrice: 5000, sellPrice: 15000, stock: 0, minStock: 0 },
  { id: '42', code: 'BRG043', name: 'OTG ROBOT MURAH', category: 'OTG', buyPrice: 2000, sellPrice: 10000, stock: 19, minStock: 0 },
  { id: '43', code: 'BRG044', name: 'SPLITTER AUDIO MODEL U', category: 'SPEAKER', buyPrice: 5000, sellPrice: 15000, stock: 4, minStock: 0 },
  { id: '44', code: 'BRG045', name: 'MICROPHONE CLIP', category: 'SPEAKER', buyPrice: 5000, sellPrice: 18000, stock: 4, minStock: 0 },
  { id: '45', code: 'BRG046', name: 'Tali ETC', category: 'ETC', buyPrice: 2500, sellPrice: 5000, stock: 12, minStock: 0 },
  { id: '46', code: 'BRG047', name: 'Kabel Aux 1 ke 1', category: 'ETC', buyPrice: 3000, sellPrice: 12000, stock: 6, minStock: 0 },
  {
    id: '47', code: 'BRG048', name: 'KD VGEN 15K MURAH', category: 'KD', buyPrice: 9000, sellPrice: 15000, stock: 33, minStock: 0, hasVariants: true,
    variants: [
      { id: '47-1', productId: '47', name: 'Micro', buyPrice: 9000, sellPrice: 15000, stock: 23 },
      { id: '47-2', productId: '47', name: 'C', buyPrice: 9000, sellPrice: 15000, stock: 10 }
    ]
  },
  { id: '48', code: 'BRG049', name: 'KD Mymo Iphone', category: 'KD', buyPrice: 12000, sellPrice: 30000, stock: 3, minStock: 0 },
  { id: '49', code: 'BRG050', name: 'HS VGEN VEP1-16', category: 'HS', buyPrice: 15000, sellPrice: 30000, stock: 8, minStock: 0 },
  { id: '50', code: 'BRG051', name: 'KC VGEN', category: 'KC', buyPrice: 25000, sellPrice: 38000, stock: 4, minStock: 0 },
  {
    id: '51', code: 'BRG052', name: 'KD VGEN TOPLES', category: 'KD', buyPrice: 7000, sellPrice: 18000, stock: 20, minStock: 0, hasVariants: true,
    variants: [
      { id: '51-1', productId: '51', name: 'C', buyPrice: 8000, sellPrice: 20000, stock: 17 },
      { id: '51-2', productId: '51', name: 'Micro', buyPrice: 7000, sellPrice: 18000, stock: 3 }
    ]
  },
  {
    id: '52', code: 'BRG053', name: 'CHR Fast Charging OC', category: 'CHR', buyPrice: 70000, sellPrice: 99000, stock: 2, minStock: 0, hasVariants: true,
    variants: [
      { id: '52-1', productId: '52', name: 'Vivo Type C 44 watt', buyPrice: 70000, sellPrice: 99000, stock: 1 },
      { id: '52-2', productId: '52', name: 'OPPO type c 33watt', buyPrice: 70000, sellPrice: 99000, stock: 1 }
    ]
  },
  { id: '53', code: 'BRG054', name: 'FOLDONG PORTABLE VGEN HOLDER', category: 'Holder Bracket', buyPrice: 25000, sellPrice: 45000, stock: 2, minStock: 0 },
  { id: '54', code: 'BRG055', name: 'CHR VGEN', category: 'CHR', buyPrice: 26000, sellPrice: 50000, stock: 0, minStock: 0 },
  {
    id: '55', code: 'BRG056', name: 'MINIFAN KIIP', category: 'FAN', buyPrice: 95000, sellPrice: 150000, stock: 3, minStock: 0, hasVariants: true,
    variants: [
      { id: '55-1', productId: '55', name: 'MINIFAN KIIP', buyPrice: 95000, sellPrice: 150000, stock: 2 },
      { id: '55-2', productId: '55', name: 'MINIFAN BESAR', buyPrice: 165000, sellPrice: 280000, stock: 1 }
    ]
  },
  { id: '56', code: 'BRG057', name: 'HS VGEN WIRELESS', category: 'HS', buyPrice: 85000, sellPrice: 150000, stock: 1, minStock: 0 },
  {
    id: '57', code: 'BRG058', name: 'KD VGEN C TO C', category: 'KD', buyPrice: 15000, sellPrice: 30000, stock: 3, minStock: 0, hasVariants: true,
    variants: [
      { id: '57-1', productId: '57', name: 'Reguler', buyPrice: 15000, sellPrice: 30000, stock: 2 },
      { id: '57-2', productId: '57', name: 'C TO C 3M', buyPrice: 29000, sellPrice: 45000, stock: 1 }
    ]
  },
  {
    id: '58', code: 'BRG059', name: 'VC AXIS', category: 'VC', buyPrice: 23000, sellPrice: 27000, stock: 59, minStock: 0, hasVariants: true,
    variants: [
      { id: '58-1', productId: '58', name: 'HARIAN 19/5', buyPrice: 23000, sellPrice: 27000, stock: 2 },
      { id: '58-2', productId: '58', name: 'BULANAN 26/28', buyPrice: 59000, sellPrice: 68000, stock: 6 },
      { id: '58-3', productId: '58', name: 'HARIAN 4/3', buyPrice: 11000, sellPrice: 13000, stock: 4 },
      { id: '58-4', productId: '58', name: 'HARIAN 3.5/5', buyPrice: 14000, sellPrice: 15000, stock: 14 },
      { id: '58-5', productId: '58', name: 'BULANAN 4.5/28', buyPrice: 32000, sellPrice: 36000, stock: 5 },
      { id: '58-6', productId: '58', name: 'HARIAN 6/1', buyPrice: 7000, sellPrice: 9000, stock: 11 },
      { id: '58-7', productId: '58', name: 'HARIAN 6/5', buyPrice: 13000, sellPrice: 17000, stock: 2 },
      { id: '58-8', productId: '58', name: 'HARIAN 7/5', buyPrice: 15000, sellPrice: 18000, stock: 0 },
      { id: '58-9', productId: '58', name: 'MINGGUAN 11/14', buyPrice: 28000, sellPrice: 32000, stock: 3 },
      { id: '58-10', productId: '58', name: 'BULANAN 7/28', buyPrice: 32000, sellPrice: 38000, stock: 0 },
      { id: '58-11', productId: '58', name: 'BULANAN 10/28', buyPrice: 36000, sellPrice: 43000, stock: 4 },
      { id: '58-12', productId: '58', name: 'BULANAN 16/28', buyPrice: 44000, sellPrice: 53000, stock: 2 },
      { id: '58-13', productId: '58', name: 'BULANAN 40/28', buyPrice: 72500, sellPrice: 85000, stock: 0 },
      { id: '58-14', productId: '58', name: 'HARIAN 6/2', buyPrice: 9000, sellPrice: 12000, stock: 0 },
      { id: '58-15', productId: '58', name: 'HARIAN 6/3', buyPrice: 11500, sellPrice: 14000, stock: 8 },
      { id: '58-16', productId: '58', name: 'HARIAN 10/3', buyPrice: 13500, sellPrice: 17000, stock: 0 },
      { id: '58-17', productId: '58', name: 'MINGGUAN 5/7', buyPrice: 14000, sellPrice: 17000, stock: 0 },
      { id: '58-18', productId: '58', name: 'MINGGUAN 13/7', buyPrice: 23000, sellPrice: 28000, stock: 3 },
      { id: '58-19', productId: '58', name: 'MINGGUAN 7.5/14', buyPrice: 22000, sellPrice: 25000, stock: 1 },
      { id: '58-20', productId: '58', name: 'MINGGUAN 5/14', buyPrice: 18500, sellPrice: 22000, stock: 8 },
      { id: '58-21', productId: '58', name: 'HARIAN 10/5', buyPrice: 17500, sellPrice: 22000, stock: 0 },
      { id: '58-22', productId: '58', name: 'HARIAN 6.5/7', buyPrice: 17000, sellPrice: 20000, stock: 0 },
      { id: '58-23', productId: '58', name: 'HARIAN 9/7', buyPrice: 18500, sellPrice: 22000, stock: 0 },
    ]
  },
  {
    id: '59', code: 'BRG060', name: 'CHR REXI', category: 'CHR', buyPrice: 23000, sellPrice: 42000, stock: 1, minStock: 0, hasVariants: true,
    variants: [
      { id: '59-1', productId: '59', name: 'CHR REXI MICRO BC24 2.4A', buyPrice: 36000, sellPrice: 70000, stock: 0 },
      { id: '59-2', productId: '59', name: 'CHR REXI MICRO CB15 1.5A', buyPrice: 23000, sellPrice: 42000, stock: 0 },
      { id: '59-3', productId: '59', name: 'CHR REXI MICRO CC20 2A', buyPrice: 30000, sellPrice: 60000, stock: 1 },
      { id: '59-4', productId: '59', name: 'CHR REXI MICRO CD24 2.4A', buyPrice: 32000, sellPrice: 65000, stock: 0 },
      { id: '59-5', productId: '59', name: 'CHR REXI MICRO CE30 3.0A 18Watt', buyPrice: 46000, sellPrice: 90000, stock: 0 },
      { id: '59-6', productId: '59', name: 'CHR REXI TYPE C CE30 QC 3.0A 18W', buyPrice: 50000, sellPrice: 100000, stock: 0 },
    ]
  },
  {
    id: '60', code: 'BRG061', name: 'HS REXI', category: 'HS', buyPrice: 12000, sellPrice: 25000, stock: 0, minStock: 0, hasVariants: true,
    variants: [
      { id: '60-1', productId: '60', name: 'HS REXI AF01 K', buyPrice: 30000, sellPrice: 55000, stock: 0 },
      { id: '60-2', productId: '60', name: 'HS REXI AI01 P', buyPrice: 12000, sellPrice: 25000, stock: 0 },
      { id: '60-3', productId: '60', name: 'HS REXI AI02 K', buyPrice: 20000, sellPrice: 42000, stock: 0 },
      { id: '60-4', productId: '60', name: 'HS REXI AS01P', buyPrice: 14000, sellPrice: 30000, stock: 0 },
    ]
  },
  {
    id: '61', code: 'BRG062', name: 'VC ISAT', category: 'VC', buyPrice: 7500, sellPrice: 10000, stock: 71, minStock: 0, hasVariants: true,
    variants: [
      { id: '61-1', productId: '61', name: 'BULANAN 10/28', buyPrice: 38500, sellPrice: 45000, stock: 3 },
      { id: '61-2', productId: '61', name: 'BULANAN 16/28', buyPrice: 47000, sellPrice: 55000, stock: 2 },
      { id: '61-3', productId: '61', name: 'HARIAN 5/1', buyPrice: 7500, sellPrice: 10000, stock: 8 },
      { id: '61-4', productId: '61', name: 'HARIAN 3.5/3', buyPrice: 12500, sellPrice: 15000, stock: 6 },
      { id: '61-5', productId: '61', name: 'HARIAN 5/5', buyPrice: 14000, sellPrice: 16000, stock: 7 },
      { id: '61-6', productId: '61', name: 'MINGGUAN 7/14', buyPrice: 23000, sellPrice: 27000, stock: 0 },
      { id: '61-7', productId: '61', name: 'HARIAN 6/2', buyPrice: 10000, sellPrice: 12000, stock: 8 },
      { id: '61-8', productId: '61', name: 'HARIAN 8/3', buyPrice: 14000, sellPrice: 16000, stock: 1 },
      { id: '61-9', productId: '61', name: 'HARIAN 6/5', buyPrice: 16000, sellPrice: 18000, stock: 17 },
      { id: '61-10', productId: '61', name: 'HARIAN 9/5', buyPrice: 18000, sellPrice: 22000, stock: 0 },
      { id: '61-11', productId: '61', name: 'BULANAN 7/28', buyPrice: 33500, sellPrice: 37000, stock: 1 },
      { id: '61-12', productId: '61', name: 'MINGGUAN 13/7', buyPrice: 24000, sellPrice: 28000, stock: 8 },
      { id: '61-13', productId: '61', name: 'BULANAN 24/28', buyPrice: 56000, sellPrice: 68000, stock: 0 },
      { id: '61-14', productId: '61', name: 'BULANAN 30/28', buyPrice: 66000, sellPrice: 80000, stock: 0 },
      { id: '61-15', productId: '61', name: 'HARIAN 7/1', buyPrice: 8500, sellPrice: 11000, stock: 0 },
      { id: '61-16', productId: '61', name: 'MINGGUAN 10/14', buyPrice: 28000, sellPrice: 32000, stock: 0 },
      { id: '61-17', productId: '61', name: 'MINGGUAN 22/7', buyPrice: 30000, sellPrice: 35000, stock: 10 },
    ]
  },
  {
    id: '62', code: 'BRG063', name: 'KD REXI', category: 'KD', buyPrice: 18000, sellPrice: 35000, stock: 20, minStock: 0, hasVariants: true,
    variants: [
      { id: '62-1', productId: '62', name: 'KD REXI 3 in 1 KD01 T', buyPrice: 42000, sellPrice: 80000, stock: 4 },
      { id: '62-2', productId: '62', name: 'KD REXI MICRO KB01 NS 2.4A', buyPrice: 21000, sellPrice: 40000, stock: 1 },
      { id: '62-3', productId: '62', name: 'KD REXI MICRO KE01 2.4A', buyPrice: 21000, sellPrice: 40000, stock: 5 },
      { id: '62-4', productId: '62', name: 'KD REXI MICRO KF01 NC 2.4A', buyPrice: 27000, sellPrice: 50000, stock: 1 },
      { id: '62-5', productId: '62', name: 'KD REXI TYPE C KA01 3.A', buyPrice: 18000, sellPrice: 35000, stock: 0 },
      { id: '62-6', productId: '62', name: 'KD REXI TYPE C KB01 NS 3A', buyPrice: 22000, sellPrice: 42000, stock: 0 },
      { id: '62-7', productId: '62', name: 'KD REXI TYPE C KE01 3A', buyPrice: 25000, sellPrice: 50000, stock: 3 },
      { id: '62-8', productId: '62', name: 'KD REXI TYPE C KF01 NC 3A', buyPrice: 28000, sellPrice: 55000, stock: 6 },
    ]
  },
  {
    id: '63', code: 'BRG064', name: 'VC SMARTFREN', category: 'VC', buyPrice: 9000, sellPrice: 12000, stock: 0, minStock: 0, hasVariants: true,
    variants: [
      { id: '63-1', productId: '63', name: '10gb Unlimited', buyPrice: 40000, sellPrice: 48000, stock: 0 },
      { id: '63-2', productId: '63', name: '2/3 HR', buyPrice: 9000, sellPrice: 12000, stock: 0 },
      { id: '63-3', productId: '63', name: '10/6 HR', buyPrice: 21000, sellPrice: 27000, stock: 0 },
      { id: '63-4', productId: '63', name: '15gb Unlimited', buyPrice: 48000, sellPrice: 58000, stock: 0 },
      { id: '63-5', productId: '63', name: 'Smartfren Unli 7hr', buyPrice: 25000, sellPrice: 28000, stock: 0 },
      { id: '63-6', productId: '63', name: '6/7 HR', buyPrice: 16000, sellPrice: 22000, stock: 0 },
      { id: '63-7', productId: '63', name: '4/14', buyPrice: 18000, sellPrice: 25000, stock: 0 },
      { id: '63-8', productId: '63', name: '50/14', buyPrice: 60000, sellPrice: 68000, stock: 0 },
    ]
  },
  {
    id: '64', code: 'BRG065', name: 'VC TRI', category: 'VC', buyPrice: 4000, sellPrice: 6000, stock: 1, minStock: 0, hasVariants: true,
    variants: [
      { id: '64-1', productId: '64', name: 'Tri 3GB full (AON 1)', buyPrice: 22000, sellPrice: 25000, stock: 0 },
      { id: '64-2', productId: '64', name: 'Tri 4.5gb Full (AON 2)', buyPrice: 24000, sellPrice: 27000, stock: 0 },
      { id: '64-3', productId: '64', name: 'Tri 4/3 HR', buyPrice: 12000, sellPrice: 15000, stock: 0 },
      { id: '64-4', productId: '64', name: 'Tri 5/7 mini 2 (3/7)', buyPrice: 16000, sellPrice: 18000, stock: 0 },
      { id: '64-5', productId: '64', name: 'Tri 8GB Full (AON 6)', buyPrice: 31000, sellPrice: 37000, stock: 0 },
      { id: '64-6', productId: '64', name: 'Tri Happy 6/5', buyPrice: 21000, sellPrice: 25000, stock: 0 },
      { id: '64-7', productId: '64', name: 'Tri Happy 7/3 HR', buyPrice: 13500, sellPrice: 18000, stock: 0 },
      { id: '64-8', productId: '64', name: 'Tri Mini 1gb + YouTube', buyPrice: 7000, sellPrice: 10000, stock: 0 },
      { id: '64-9', productId: '64', name: 'Tri Mini 2/5', buyPrice: 11000, sellPrice: 13000, stock: 0 },
      { id: '64-10', productId: '64', name: 'Tri Pm 1', buyPrice: 16000, sellPrice: 18000, stock: 0 },
      { id: '64-11', productId: '64', name: 'Tri 1.5/3 HR', buyPrice: 8000, sellPrice: 10000, stock: 1 },
      { id: '64-12', productId: '64', name: 'Tri 12Gb full (AON 9)', buyPrice: 45000, sellPrice: 52000, stock: 0 },
      { id: '64-13', productId: '64', name: 'Tri 16 Gb FULL (AON 12GB)', buyPrice: 58000, sellPrice: 65000, stock: 0 },
      { id: '64-14', productId: '64', name: 'Tri 2/1 HR', buyPrice: 4000, sellPrice: 6000, stock: 0 },
    ]
  },
  {
    id: '65', code: 'BRG066', name: 'USB MOBIL REXI', category: 'ACC CAR', buyPrice: 25000, sellPrice: 50000, stock: 1, minStock: 0, hasVariants: true,
    variants: [
      { id: '65-1', productId: '65', name: 'USB MOBIL REXI 2 Port GA31 3.1A', buyPrice: 25000, sellPrice: 50000, stock: 1 },
      { id: '65-2', productId: '65', name: 'USB MOBIL REXI GB34 3.4A', buyPrice: 30000, sellPrice: 60000, stock: 0 },
    ]
  },
  {
    id: '66', code: 'BRG067', name: 'VC XL', category: 'VC', buyPrice: 3500, sellPrice: 5000, stock: 30, minStock: 0, hasVariants: true,
    variants: [
      { id: '66-1', productId: '66', name: 'Harian 1/1', buyPrice: 3500, sellPrice: 5000, stock: 0 },
      { id: '66-2', productId: '66', name: 'Harian 3/3', buyPrice: 9000, sellPrice: 12000, stock: 0 },
      { id: '66-3', productId: '66', name: 'Harian 5/5', buyPrice: 14500, sellPrice: 16000, stock: 0 },
      { id: '66-4', productId: '66', name: 'XL Combo 14/30', buyPrice: 47500, sellPrice: 55000, stock: 3 },
      { id: '66-5', productId: '66', name: 'XL Combo 8/30', buyPrice: 35000, sellPrice: 40000, stock: 3 },
      { id: '66-6', productId: '66', name: 'XL FLEX L 22GB', buyPrice: 66000, sellPrice: 75000, stock: 3 },
      { id: '66-7', productId: '66', name: 'XL FLEX L+ 29GB', buyPrice: 75000, sellPrice: 82000, stock: 0 },
      { id: '66-8', productId: '66', name: 'XL FLEX M 12GB', buyPrice: 47000, sellPrice: 55000, stock: 3 },
      { id: '66-9', productId: '66', name: 'XL FLEX S 4GB', buyPrice: 21000, sellPrice: 23000, stock: 0 },
      { id: '66-10', productId: '66', name: 'XL Hot 4/10', buyPrice: 17500, sellPrice: 20000, stock: 3 },
      { id: '66-11', productId: '66', name: 'XL Hot 6/10', buyPrice: 18000, sellPrice: 23000, stock: 8 },
      { id: '66-12', productId: '66', name: 'XL Hot 9/10', buyPrice: 23000, sellPrice: 28000, stock: 7 },
    ]
  },
  { id: '67', code: 'BRG068', name: 'KD VGEN IPHONE 2.4A', category: 'KD', buyPrice: 18000, sellPrice: 35000, stock: 1, minStock: 0 },
  {
    id: '68', code: 'BRG069', name: 'VC TELKOM', category: 'VC', buyPrice: 13000, sellPrice: 15000, stock: 51, minStock: 0, hasVariants: true,
    variants: [
      { id: '68-1', productId: '68', name: 'BULANAN 10/28', buyPrice: 44000, sellPrice: 47000, stock: 0 },
      { id: '68-2', productId: '68', name: 'BULANAN 18/28', buyPrice: 54000, sellPrice: 60000, stock: 3 },
      { id: '68-3', productId: '68', name: 'HARIAN 2/3', buyPrice: 13000, sellPrice: 15000, stock: 3 },
      { id: '68-4', productId: '68', name: 'HARIAN 2/5', buyPrice: 13000, sellPrice: 16000, stock: 0 },
      { id: '68-5', productId: '68', name: 'HARIAN 3/5', buyPrice: 15000, sellPrice: 17000, stock: 0 },
      { id: '68-6', productId: '68', name: 'MINGGUAN 3/7', buyPrice: 21000, sellPrice: 23000, stock: 0 },
      { id: '68-7', productId: '68', name: 'HARIAN 4/3', buyPrice: 14000, sellPrice: 16000, stock: 0 },
      { id: '68-8', productId: '68', name: 'HARIAN 8/5', buyPrice: 24000, sellPrice: 30000, stock: 0 },
      { id: '68-9', productId: '68', name: 'MINGGUAN 9/7', buyPrice: 28000, sellPrice: 32000, stock: 0 },
      { id: '68-10', productId: '68', name: 'BULANAN 25/28', buyPrice: 67000, sellPrice: 77000, stock: 4 },
      { id: '68-11', productId: '68', name: 'HARIAN 5/3', buyPrice: 14500, sellPrice: 17000, stock: 9 },
      { id: '68-12', productId: '68', name: 'HARIAN 7/3', buyPrice: 16000, sellPrice: 18000, stock: 0 },
      { id: '68-13', productId: '68', name: 'HARIAN 9/3', buyPrice: 19000, sellPrice: 22000, stock: 0 },
      { id: '68-14', productId: '68', name: 'HARIAN 4/5', buyPrice: 15000, sellPrice: 18000, stock: 15 },
      { id: '68-15', productId: '68', name: 'HARIAN 8/5 v2', buyPrice: 24000, sellPrice: 27000, stock: 0 },
      { id: '68-16', productId: '68', name: 'HARIAN 9/5', buyPrice: 25000, sellPrice: 28000, stock: 7 },
      { id: '68-17', productId: '68', name: 'MINGGUAN 5/7', buyPrice: 21000, sellPrice: 23000, stock: 0 },
      { id: '68-18', productId: '68', name: 'MINGGUAN 9/7 v2', buyPrice: 29000, sellPrice: 33000, stock: 10 },
    ]
  }
];

export const PULSA_NOMINALS = [5000, 10000, 15000, 20000, 25000, 30000, 50000, 60000, 70000, 75000, 80000, 90000, 100000, 150000, 200000, 250000];

export const EXPENSE_CATEGORIES = [
  'Operasional',
  'Gaji',
  'Listrik',
  'Internet',
  'Transportasi',
  'Belanja barang',
  'Sewa tempat',
  'Lainnya'
] as const;

export const STORE_PROFILE: StoreProfile = {
  name: "TOKO KAS PRO",
  address: "Jl. Merdeka No. 123, Jakarta",
  phone: "0812-3456-7890"
};
