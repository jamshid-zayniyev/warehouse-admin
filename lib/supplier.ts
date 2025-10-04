export interface User {
  id: number
  role: string
  full_name: string
  phone_number: string
  image: string | null
  auth_type: string
  is_active: boolean
  date_joined: string
}

export interface ProductImage {
  image: string
  product: number
}

export interface Product {
  id: number
  title: string
  description: string
  buy_price: string
  price: string
  old_price: string
  images: ProductImage[]
  colors: any[]
  features: any[]
  category: string
}

export interface Location {
  id: number
  country: string
  region: string
  district: string
  street: string
  house: string
  postalCode: string
  fullAddress: string
  latitude: number
  longitude: number
  created: string
}

export interface SupplierRequestInfo {
  id: number
  full_name: string
  phone: string
  status: string
  total_quantity: number
  created_at: string
}

export interface OrderItemIsThere {
  status: string
  supplier_requests: SupplierRequestInfo[]
}

export interface OrderItem {
  id: number
  product: string
  quantity: number
  color: string | null
  price: string
  images: string[]
  is_partial: boolean
  is_there: OrderItemIsThere | boolean
  feature: any[]
}

export interface Order {
  id: number
  status: string
  location: Location
  receive: string
  payment: string
  user_full_name: string
  name: string
  phone_number: string
  additional_phone_number: string
  items_detail: OrderItem[]
  price: string
  created: string
}

export interface SupplierRequest {
  id: number
  supplier: number
  product: number
  orders: number[]
  total_quantity: number
  status: 'p' | 's' | 'r' | 'pt'
  amount_received: number
  new_supplier: number | null
  created_at: string
  reassigned_from: number | null
}

export interface SupplierRequestWithDetails extends SupplierRequest {
  supplier_details?: User
  product_details?: Product
  order_details?: Order[]
  new_supplier_details?: User | null
}