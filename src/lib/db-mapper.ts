import type { Order, OrderItem, Product, Store, StoreWithRelations, User } from "./types";

type DbProfile = { id: string; name: string | null; phone: string | null; created_at?: string };
type DbStore = {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  industry: string;
  theme: string;
  plan: string;
  status: string;
  accent_color: string;
  currency?: string | null;
  custom_domain: string | null;
  created_at: string;
  updated_at: string;
};
type DbProduct = {
  id: string;
  store_id: string;
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
  created_at: string;
};
type DbOrder = {
  id: string;
  store_id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  address: string;
  city: string | null;
  pincode: string | null;
  payment_method: string;
  status: string;
  subtotal: number;
  platform_fee: number;
  total: number;
  created_at: string;
  order_items?: DbOrderItem[];
};
type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  price: number;
  quantity: number;
  variant: string | null;
};

export function mapUser(profile: DbProfile | null, email: string): User {
  return {
    id: profile?.id || "",
    name: profile?.name || email.split("@")[0],
    email,
    phone: profile?.phone ?? null,
    createdAt: profile?.created_at ? new Date(profile.created_at) : undefined,
  };
}

export function mapStore(row: DbStore): Store {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    slug: row.slug,
    industry: row.industry,
    theme: row.theme,
    plan: row.plan,
    status: row.status,
    accentColor: row.accent_color,
    currency: row.currency || "INR",
    customDomain: row.custom_domain,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapProduct(row: DbProduct): Product {
  return {
    id: row.id,
    storeId: row.store_id,
    name: row.name,
    description: row.description,
    price: row.price,
    mrp: row.mrp,
    image: row.image,
    category: row.category,
    stock: row.stock,
    sku: row.sku,
    variants: row.variants,
    published: row.published,
    createdAt: new Date(row.created_at),
  };
}

export function mapOrderItem(row: DbOrderItem): OrderItem {
  return {
    id: row.id,
    orderId: row.order_id,
    productId: row.product_id,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
    variant: row.variant,
  };
}

export function mapOrder(row: DbOrder): Order & { items: OrderItem[] } {
  return {
    id: row.id,
    storeId: row.store_id,
    orderNumber: row.order_number,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerEmail: row.customer_email,
    address: row.address,
    city: row.city,
    pincode: row.pincode,
    paymentMethod: row.payment_method,
    status: row.status,
    subtotal: row.subtotal,
    platformFee: row.platform_fee,
    total: row.total,
    createdAt: new Date(row.created_at),
    items: (row.order_items || []).map(mapOrderItem),
  };
}

export function mapStoreWithRelations(
  storeRow: DbStore,
  profile: DbProfile | null,
  email: string,
  products: DbProduct[],
  orders: DbOrder[]
): StoreWithRelations {
  const store = mapStore(storeRow);
  return {
    ...store,
    owner: mapUser(profile, email),
    products: products.map(mapProduct),
    orders: orders.map(mapOrder),
  };
}

export function toProductInsert(data: {
  storeId: string;
  name: string;
  description?: string;
  price: number;
  mrp?: number;
  image?: string;
  category?: string;
  stock?: number;
  sku?: string;
  variants?: string;
}) {
  return {
    store_id: data.storeId,
    name: data.name,
    description: data.description ?? null,
    price: data.price,
    mrp: data.mrp ?? null,
    image: data.image ?? null,
    category: data.category || "all",
    stock: data.stock ?? 100,
    sku: data.sku ?? null,
    variants: data.variants ?? null,
  };
}

export function toStoreInsert(data: {
  ownerId: string;
  organizationId?: string | null;
  name: string;
  slug: string;
  industry: string;
  theme: string;
  plan: string;
  status: string;
  accentColor: string;
  customDomain?: string | null;
  templateKey?: string | null;
}) {
  const row: Record<string, unknown> = {
    owner_id: data.ownerId,
    name: data.name,
    slug: data.slug,
    industry: data.industry,
    theme: data.theme,
    plan: data.plan,
    status: data.status,
    accent_color: data.accentColor,
    custom_domain: data.customDomain ?? null,
  };
  if (data.organizationId) row.organization_id = data.organizationId;
  if (data.templateKey) row.template_key = data.templateKey;
  return row;
}
