export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt?: Date;
}

export interface Store {
  id: string;
  name: string;
  slug: string;
  industry: string;
  theme: string;
  plan: string;
  status: string;
  accentColor: string;
  currency: string;
  customDomain: string | null;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  storeId: string;
  name: string;
  description: string | null;
  price: number;
  mrp: number | null;
  image: string | null;
  category: string;
  stock: number;
  sku: string | null;
  variants: string | null;
  published: boolean;
  createdAt: Date;
}

export interface Order {
  id: string;
  storeId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string | null;
  pincode: string | null;
  paymentMethod: string;
  status: string;
  subtotal: number;
  platformFee: number;
  total: number;
  createdAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string | null;
  name: string;
  price: number;
  quantity: number;
  variant: string | null;
}

export type StoreWithRelations = Store & {
  owner: User;
  products: Product[];
  orders: (Order & { items: OrderItem[] })[];
};
