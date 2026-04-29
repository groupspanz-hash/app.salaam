const fs = require('fs');
const uuid = require('crypto').randomUUID;

const items = [
  { name: 'KC Samsung Colour', category: 'KC', code: 'kcsamsungcolour', sellPrice: 20000, buyPrice: 8500, stock: 3, minStock: 0 },
  { name: 'GURITA', category: 'ETC', code: 'gurita', sellPrice: 5000, buyPrice: 950, stock: 5, minStock: 0 },
  { name: 'HS Bluetooth Hippo Mono', category: 'HS', code: 'hsbluetoothhippo', sellPrice: 120000, buyPrice: 75000, stock: 2, minStock: 0 },
  { name: 'HS Gaming XG', category: 'HS', code: 'hsgamingxg', sellPrice: 98000, buyPrice: 57000, stock: 1, minStock: 0 },
  { name: 'FAN', category: 'FAN', code: 'kipasportabel', sellPrice: 60000, buyPrice: 30000, stock: 3, minStock: 0 },
  { name: 'HS Bluetooth TWS Macaron', category: 'HS', code: '', sellPrice: 100000, buyPrice: 50000, stock: 2, minStock: 0 },
  { name: 'Pocket Stand Grip Cartoon', category: 'ETC', code: '', sellPrice: 15000, buyPrice: 6500, stock: 6, minStock: 0 },
  { name: 'KP ISAT 3GB', category: 'KP', code: '', sellPrice: 40000, buyPrice: 35000, stock: 1, minStock: 0 },
  { name: 'KP TRI AON 2GB', category: 'KP', code: '', sellPrice: 22000, buyPrice: 15500, stock: 2, minStock: 0 },
  {
    name: 'MC Sandisk',
    category: 'MM',
    code: '',
    hasVariants: true,
    variants: [
      { name: '16 GB', sellPrice: 150000, buyPrice: 70000, stock: 0 },
      { name: '32 GB', sellPrice: 150000, buyPrice: 69500, stock: 1 }
    ]
  },
  { name: 'Pocket PUBG', category: 'ETC', code: '', sellPrice: 10000, buyPrice: 1900, stock: 19, minStock: 1 },
  { name: 'Tali HP', category: 'ETC', code: '', sellPrice: 10000, buyPrice: 5000, stock: 4, minStock: 1 },
  { name: 'Tripod Gorila besar gurita', category: 'ETC', code: '', sellPrice: 80000, buyPrice: 42000, stock: 0, minStock: 0 },
  { name: 'Trigger 15k', category: 'ETC', code: '', sellPrice: 15000, buyPrice: 5000, stock: 1, minStock: 0 },
  { name: 'Trigger 20k', category: 'ETC', code: '', sellPrice: 20000, buyPrice: 10000, stock: 1, minStock: 0 },
  {
    name: 'OTG',
    category: 'ETC',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'Type Micro', sellPrice: 15000, buyPrice: 4950, stock: 6 },
      { name: 'Type C', sellPrice: 17000, buyPrice: 5700, stock: 6 }
    ]
  },
  {
    name: 'MC Vgen',
    category: 'MM',
    code: '',
    hasVariants: true,
    variants: [
      { name: '16GB', sellPrice: 70000, buyPrice: 45000, stock: 2 },
      { name: '32GB', sellPrice: 80000, buyPrice: 50000, stock: 1 },
      { name: '64 GB', sellPrice: 120000, buyPrice: 80000, stock: 1 },
      { name: '128 GB', sellPrice: 180000, buyPrice: 130000, stock: 2 }
    ]
  },
  { name: 'SP Gaming RS200', category: 'SPEAKER', code: '', sellPrice: 185000, buyPrice: 115000, stock: 2, minStock: 0 },
  { name: 'KP XL 3gb', category: 'KP', code: '', sellPrice: 40000, buyPrice: 35000, stock: 0, minStock: 0 },
  {
    name: 'KP SMARTFREN',
    category: 'KP',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'Reguler', sellPrice: 30000, buyPrice: 25000, stock: 0 },
      { name: '3GB', sellPrice: 38000, buyPrice: 30000, stock: 5 }
    ]
  },
  { name: 'Bluetooth Receiver CK 02', category: 'ETC', code: '', sellPrice: 23000, buyPrice: 9900, stock: 1, minStock: 0 },
  { name: 'HS Roker Acoustic', category: 'HS', code: '', sellPrice: 70000, buyPrice: 37000, stock: 1, minStock: 0 },
  { name: 'Case Bening', category: 'CASE', code: '', sellPrice: 10000, buyPrice: 15000, stock: 49, minStock: 20 },
  { name: 'Pelindung Kabel', category: 'ETC', code: '', sellPrice: 3000, buyPrice: 1000, stock: 6, minStock: 0 },
  { name: 'Tali HP Viral', category: 'ETC', code: '', sellPrice: 25000, buyPrice: 7200, stock: 15, minStock: 1 },
  { name: 'HS Macaron Warna', category: 'HS', code: '', sellPrice: 25000, buyPrice: 8000, stock: 0, minStock: 1 },
  { name: 'CHR Foomee 2.4A White', category: 'CHR', code: '', sellPrice: 90000, buyPrice: 36000, stock: 1, minStock: 0 },
  { name: 'CHR Kodok', category: 'CHR', code: '', sellPrice: 30000, buyPrice: 10000, stock: 1, minStock: 0 },
  { name: 'Sarung Tangan Jempol Gaming', category: 'ETC', code: '', sellPrice: 15000, buyPrice: 2000, stock: 4, minStock: 0 },
  { name: 'KD Norton Micro dan Type C', category: 'KD', code: '', sellPrice: 15000, buyPrice: 5000, stock: 59, minStock: 5 },
  { name: 'KP Telkom 3gb', category: 'KP', code: '', sellPrice: 39000, buyPrice: 30000, stock: 0, minStock: 1 },
  { name: 'KP AXIS 3GB', category: 'KP', code: '', sellPrice: 40000, buyPrice: 35000, stock: 1, minStock: 0 },
  { name: 'SP Bluetooth Satoo', category: 'SPEAKER', code: '', sellPrice: 130000, buyPrice: 70000, stock: 2, minStock: 0 },
  { name: 'Amplop', category: 'ETC', code: '', sellPrice: 500, buyPrice: 160, stock: 52, minStock: 0 },
  { name: 'HOLDER STAND HP REXI HM01', category: 'ETC', code: '', sellPrice: 80000, buyPrice: 43000, stock: 2, minStock: 0 },
  { name: 'HS BLUETOOTH MAGNETIC SPORT', category: 'HS', code: '', sellPrice: 38000, buyPrice: 15000, stock: 0, minStock: 0 },
  { name: 'USB HUB PORT ON OFF', category: 'ETC', code: '', sellPrice: 60000, buyPrice: 25000, stock: 1, minStock: 0 },
  { name: 'WATERPROOF CASE UNIVERSAL', category: 'CASE', code: '', sellPrice: 18000, buyPrice: 5000, stock: 16, minStock: 0 },
  { name: 'Converter sambungan Micro ke Type C', category: 'OTG', code: '', sellPrice: 10000, buyPrice: 2000, stock: 9, minStock: 0 },
  { name: 'OTG YI-TAI', category: 'OTG', code: '', sellPrice: 15000, buyPrice: 7000, stock: 9, minStock: 0 },
  { name: 'Kabel AUX Jack Audio 2 in 1', category: 'SPEAKER', code: '', sellPrice: 15000, buyPrice: 5000, stock: 0, minStock: 0 },
  { name: 'OTG ROBOT MURAH', category: 'OTG', code: '', sellPrice: 10000, buyPrice: 2000, stock: 19, minStock: 0 },
  { name: 'SPLITTER AUDIO MODEL U', category: 'SPEAKER', code: '', sellPrice: 15000, buyPrice: 5000, stock: 4, minStock: 0 },
  { name: 'MICROPHONE CLIP', category: 'SPEAKER', code: '', sellPrice: 18000, buyPrice: 5000, stock: 4, minStock: 0 },
  { name: 'Tali ETC', category: 'ETC', code: '', sellPrice: 5000, buyPrice: 2500, stock: 12, minStock: 0 },
  { name: 'Kabel Aux 1 ke 1', category: 'ETC', code: '', sellPrice: 12000, buyPrice: 3000, stock: 6, minStock: 0 },
  {
    name: 'KD VGEN 15K MURAH',
    category: 'KD',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'Micro', sellPrice: 15000, buyPrice: 9000, stock: 23 },
      { name: 'C', sellPrice: 15000, buyPrice: 9000, stock: 10 }
    ]
  },
  { name: 'KD Mymo Iphone', category: 'KD', code: '', sellPrice: 30000, buyPrice: 12000, stock: 3, minStock: 0 },
  { name: 'HS VGEN VEP1-16', category: 'HS', code: '', sellPrice: 30000, buyPrice: 15000, stock: 8, minStock: 0 },
  { name: 'KC VGEN', category: 'KC', code: '', sellPrice: 38000, buyPrice: 25000, stock: 4, minStock: 0 },
  {
    name: 'KD VGEN TOPLES',
    category: 'KD',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'C', sellPrice: 20000, buyPrice: 8000, stock: 17 },
      { name: 'Micro', sellPrice: 18000, buyPrice: 7000, stock: 3 }
    ]
  },
  {
    name: 'CHR Fast Charging OC',
    category: 'CHR',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'Vivo Type C 44 watt', sellPrice: 99000, buyPrice: 70000, stock: 1 },
      { name: 'OPPO type c 33watt', sellPrice: 99000, buyPrice: 70000, stock: 1 }
    ]
  },
  { name: 'FOLDONG PORTABLE VGEN HOLDER', category: 'Holder Bracket', code: '', sellPrice: 45000, buyPrice: 25000, stock: 2, minStock: 0 },
  { name: 'CHR VGEN', category: 'CHR', code: '', sellPrice: 50000, buyPrice: 26000, stock: 0, minStock: 0 },
  {
    name: 'MINIFAN KIIP',
    category: 'FAN',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'MINIFAN KIIP', sellPrice: 150000, buyPrice: 95000, stock: 2 },
      { name: 'MINIFAN BESAR', sellPrice: 280000, buyPrice: 165000, stock: 1 }
    ]
  },
  { name: 'HS VGEN WIRELESS', category: 'HS', code: '', sellPrice: 150000, buyPrice: 85000, stock: 1, minStock: 0 },
  {
    name: 'KD VGEN C TO C',
    category: 'KD',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'Reguler', sellPrice: 30000, buyPrice: 15000, stock: 2 },
      { name: 'C TO C 3M', sellPrice: 45000, buyPrice: 29000, stock: 1 }
    ]
  },
  {
    name: 'VC AXIS',
    category: 'VC',
    code: '',
    hasVariants: true,
    variants: [
      { name: 'HARIAN 19/5', sellPrice: 27000, buyPrice: 23000, stock: 2 },
      { name: 'BULANAN 26/28', sellPrice: 68000, buyPrice: 59000, stock: 6 },
      { name: 'HARIAN 4/3', sellPrice: 13000, buyPrice: 11000, stock: 4 },
      { name: 'HARIAN 3.5/5', sellPrice: 15000, buyPrice: 14000, stock: 14 },
      { name: 'BULANAN 4.5/28', sellPrice: 36000, buyPrice: 32000, stock: 5 },
      { name: 'HARIAN 6/1', sellPrice: 9000, buyPrice: 7000, stock: 11 },
      { name: 'HARIAN 6/5', sellPrice: 17000, buyPrice: 13000, stock: 2 },
      { name: 'HARIAN 7/5', sellPrice: 18000, buyPrice: 15000, stock: 0 },
      { name: 'MINGGUAN 11/14', sellPrice: 32000, buyPrice: 28000, stock: 3 },
      { name: 'BULANAN 7/28', sellPrice: 38000, buyPrice: 32000, stock: 0 },
    ]
  }
];

let globalId = 1;
const products = items.map(item => {
  const p = {
    id: String(globalId++),
    code: item.code || `BRG${String(globalId).padStart(3, '0')}`,
    name: item.name,
    category: item.category,
    buyPrice: item.buyPrice || 0,
    sellPrice: item.sellPrice || 0,
    stock: item.stock || 0,
    minStock: item.minStock || 0,
    hasVariants: !!item.hasVariants,
  };
  
  if (item.hasVariants) {
    p.variants = item.variants.map((v, idx) => ({
      id: `${p.id}-${idx+1}`,
      productId: p.id,
      name: v.name,
      buyPrice: v.buyPrice,
      sellPrice: v.sellPrice,
      stock: v.stock
    }));
    p.buyPrice = p.variants[0].buyPrice;
    p.sellPrice = p.variants[0].sellPrice;
    p.stock = p.variants.reduce((acc, curr) => acc + curr.stock, 0);
  }
  return p;
});

console.log(JSON.stringify(products, null, 2));
