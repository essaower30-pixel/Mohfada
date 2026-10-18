import { CommunityUser, AdminVault, LocalTransaction } from '../types/wallet';

export const INITIAL_USERS: CommunityUser[] = [
  {
    id: 'usr_admin',
    name: 'أبو حامد (أمين الصندوق والمعتمد)',
    username: 'admin',
    phone: '0999000111',
    accountNumber: 'CASH-100',
    role: 'admin',
    shopName: 'نقطة الكاش المعتمدة بالحي',
    address: 'ساحة الحي الرئيسية - جانب جامع التقوى (مكتب إدارة كاش الحي)',
    balance: 750000,
    pin: 'admin', // initial password: admin
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2026-10-01',
    savedContacts: [],
  },
  {
    id: 'usr_ahmad',
    name: 'عيسى عوير (مواطن بالحي)',
    phone: '0982115383',
    accountNumber: 'POCKET-562',
    role: 'resident',
    balance: 350000,
    pin: '1234',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2026-10-05',
    savedContacts: [
      {
        id: 'cnt_1',
        name: 'أبو النور (سوبرماركت الحي)',
        phone: '0933555777',
        accountNumber: 'SHOP-201',
        shopName: 'بقالية وسوبرماركت النور',
        savedAt: '2026-10-06',
      },
    ],
  },
  {
    id: 'usr_supermarket',
    name: 'أبو النور (سوبرماركت الحي)',
    phone: '0933555777',
    accountNumber: 'SHOP-201',
    role: 'merchant',
    shopName: 'بقالية وسوبرماركت النور',
    balance: 1850000,
    pin: '1234',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2026-10-02',
    savedContacts: [
      {
        id: 'cnt_admin_m',
        name: 'أبو حامد (أمين الصندوق والمعتمد)',
        phone: '0999000111',
        accountNumber: 'CASH-100',
        shopName: 'نقطة الكاش المعتمدة بالحي',
        savedAt: '2026-10-02',
      },
    ],
  },
  {
    id: 'usr_pharmacy',
    name: 'د. حسان (صيدلية السلام)',
    phone: '0988222333',
    accountNumber: 'SHOP-202',
    role: 'merchant',
    shopName: 'صيدلية السلام بالحي',
    balance: 920000,
    pin: '1234',
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2026-10-03',
    savedContacts: [],
  },
  {
    id: 'usr_sara',
    name: 'سارة الحلبي (زبون / مقيمة)',
    phone: '0966444888',
    accountNumber: 'POCKET-103',
    role: 'resident',
    balance: 180000,
    pin: '1234',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    registeredAt: '2026-10-10',
    savedContacts: [],
  },
];

export const INITIAL_ADMIN_VAULT: AdminVault = {
  digitalVaultBalance: 45000000, // 45,000,000 ل.س جاهزة للتوزيع
  cashInDrawer: 3940000, // 3,940,000 ل.س كاش مقبوض ومودع بالصندوق
  cashPaidOut: 500000, // 500,000 ل.س كاش تم صرفه عند السحب
  totalIssuedToUsers: 3940000,
  transferFeeRate: 0.01, // 1% commission returning to admin
  totalAdminFeesCollected: 730, // 450 + 280 collected from transfers
};

export const INITIAL_TRANSACTIONS: LocalTransaction[] = [
  {
    id: 'ltx_001',
    type: 'admin_cash_charge',
    amount: 500000,
    senderId: 'usr_admin',
    senderName: 'أبو حامد (أمين الصندوق والمعتمد)',
    recipientId: 'usr_ahmad',
    recipientName: 'عيسى عوير (مواطن بالحي)',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    note: 'شحن رصيد مقابل تسليم 500,000 ل.س كاش يداً بيد',
    receiptCode: 'CASH-8812',
    isQrScan: false,
  },
  {
    id: 'ltx_002',
    type: 'merchant_pay',
    amount: 45000,
    fee: 450, // 1% returning to admin
    senderId: 'usr_ahmad',
    senderName: 'عيسى عوير',
    recipientId: 'usr_supermarket',
    recipientName: 'أبو النور (سوبرماركت الحي)',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    note: 'شراء مواد غذائية وخضار عبر مسح باركود البقالية',
    receiptCode: 'QR-9421',
    isQrScan: true,
  },
  {
    id: 'ltx_003',
    type: 'merchant_pay',
    amount: 28000,
    fee: 280, // 1% returning to admin
    senderId: 'usr_ahmad',
    senderName: 'عيسى عوير',
    recipientId: 'usr_pharmacy',
    recipientName: 'صيدلية السلام بالحي',
    timestamp: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    note: 'دفع ثمن أدوية ومستلزمات عبر الباركود',
    receiptCode: 'QR-1082',
    isQrScan: true,
  },
];
