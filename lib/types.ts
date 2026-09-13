export type UserRole = 'customer' | 'restaurant' | 'delivery' | 'admin';

export type OrderStatus =
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'delivered'
  | 'cancelled';

export type RestaurantStatus = 'pending' | 'approved' | 'suspended';

export type DeliveryPartnerStatus = 'offline' | 'available' | 'on_delivery';

export type PayoutStatus = 'pending' | 'processed' | 'paid' | 'failed' | 'reverted';

export type WithdrawalMethod = 'bank' | 'upi';

export type WalletTransactionType = 'credit' | 'debit' | 'withdrawal' | 'refund';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  isVeg: boolean;
  isBestseller?: boolean;
  addons?: { name: string; price: number }[];
  offer?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  deliveryTime: string;
  priceForTwo: number;
  image: string;
  coverImage: string;
  status: RestaurantStatus;
  location: string;
  menu: MenuItem[];
  commissionRate: number;
  ownerName?: string;
  ownerPhone?: string;
  ownerEmail?: string;
  businessLicense?: string;
  fssaiLicense?: string;
  walletBalance?: number;
  bankDetails?: BankDetails;
  upiId?: string;
  address?: string;
  operatingHours?: string;
  isOnline?: boolean;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  addons: { name: string; price: number }[];
  total: number;
}

export interface Order {
  id: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  restaurantId: string;
  restaurantName: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  placedAt: string;
  acceptedAt?: string;
  readyAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  deliveryPartnerId?: string;
  deliveryPartnerName?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid';
  commissionAmount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  joinedAt: string;
  lastOrder?: string;
  totalOrders?: number;
  profileImage?: string;
  address?: string;
  lastLogin?: string;
}

export interface DeliveryPartner {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: DeliveryPartnerStatus;
  totalDeliveries: number;
  rating: number;
  earnings: number;
  vehicleType: string;
  joinedAt: string;
  walletBalance?: number;
  bankDetails?: BankDetails;
  upiId?: string;
  documentVerified?: boolean;
  licenseNumber?: string;
}

export interface Payout {
  id: string;
  type: 'restaurant' | 'delivery';
  partnerName: string;
  partnerId: string;
  amount: number;
  commission: number;
  status: PayoutStatus;
  date: string;
  orders: number;
  processedAt?: string;
  paidAt?: string;
  failureReason?: string;
  revertedAt?: string;
}

export interface BankDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branchName?: string;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  userType: 'restaurant' | 'delivery' | 'customer';
  type: WalletTransactionType;
  amount: number;
  balance: number;
  description: string;
  orderId?: string;
  createdAt: string;
}

export interface WithdrawalRequest {
  id: string;
  userId: string;
  userType: 'restaurant' | 'delivery' | 'customer';
  amount: number;
  method: WithdrawalMethod;
  bankDetails?: BankDetails;
  upiId?: string;
  status: PayoutStatus;
  requestedAt: string;
  processedAt?: string;
  failureReason?: string;
}

export type DeliveryPartnerStatus =
  | 'offline'
  | 'available'
  | 'on_delivery'
  | 'suspended';

export type RestaurantStatus =
  | 'pending'
  | 'approved'
  | 'suspended';
}
