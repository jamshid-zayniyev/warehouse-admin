export interface About {
  id: number
  happy_clients: number
  product_type: number
  experience: number
}

export interface CreateAbout {
  happy_clients: number
  product_type: number
  experience: number
}

export interface Banner {
  id: number
  image: string 
}

export interface CreateBanner {
  image: any;
}

export interface Contact {
  id: number
  first_name: string
  email: string
  theme: string
  message: string
  created_at: string 
}

export interface CreateContact {
  first_name: string
  email: string
  theme: string
  message: string
}

export interface NewsImage {
  id: number
  image: string
  news: number
}

export interface News {
  id: number
  title: string
  description: string
  type: "p" | "s" | "c" | "t" // p, s, c, t
  images: NewsImage[]
  created_at: string
}

export interface CreateNews {
  title: string
  description: string
  type: "p" | "s" | "c" | "t" // p, s, c, t
  images: NewsImage[]
}

export interface PhoneNumber {
  id: number
  phone_number: string
  our_contact: number
}

export interface ContactEmail {
  id: number
  email: string
  our_contact: number
}

export interface OurContact {
  id: number
  address: string
  phone_numbers: string[]
  emails: string[]
  working_time: string
}

export interface CreateOurContact {
  address: string
  phone_numbers: string[]
  emails: string[]
  working_time: string
}

export interface SocialMedia {
  id: number
  telegram: string
  facebook: string
  x: string // formerly Twitter
  instagram: string
  youtube: string
}

export interface CreateSocialMedia {
  id?: number;
  telegram: string
  facebook: string
  x: string
  instagram: string
  youtube: string
}

export interface User {
  id: number
  full_name: string
  phone_number: string
  image: string
}

export interface UpdateUser {
  full_name?: string
  phone_number?: string
  image?: string
}

export interface Category {
  id: number
  name: string
  slug: string
  image: string
  categories?: any;
}

export interface CreateCategory {
  name: string
  slug: string
  image: any
  categories?: any;
}


export interface ProductImage {
  image: any
}

export interface Currency {
  id: number;
  name: string;
  name_uz: string;
  name_en: string;
  name_ru: string;
}

export interface CreateCurrency {
  name_uz: string;
  name_en: string;
  name_ru: string;
}


// Type for creating a product (POST/PUT request)
export interface CreateProduct {
  title: string
  description: string
  price: string
  old_price: string
  images: ProductImage[]
  category: string
}

export type ImageObj = { image: string }
export type Product = {
  id: number
  title: string
  title_ru: string
  title_uz: string
  title_en: string
  stock_quantity:number
  description_ru: string
  buy_price: any
  sell_price: any
  created: any
  quantity: any
  description_uz: string
  description_en: string
  description: string
  price: string
  old_price?: string | null
  images: ImageObj[]
  category: string
  colors?: Array<{
    colorId: number
    image: string
    price: string
  }>
  features?: Array<{
    typeId: number
    typeName: string
    value: string
    price: string
  }>
}
export interface NewsImage {
  id: number
  image: string
  news: number
}

export interface News {
  id: number
  title: string 
  title_uz: string | null
  title_en: string | null
  title_ru: string | null
  description: string 
  description_uz: string | null
  description_en: string | null
  description_ru: string | null
  type: "p" | "s" | "c" | "t"
  images: NewsImage[]
  created_at: string
}

export interface CreateNews {
  title_uz: string
  title_en: string
  title_ru: string
  description_uz: string
  description_en: string
  description_ru: string
  type: "p" | "s" | "c" | "t"
}

export interface Base64Image {
  base64: string
  type: string
  name: string
}

export interface ProductColorData {
  colorId: number
  image: File | null
  price: string
}

export interface ProductFeature {
  typeId: number
  typeName: string
  value: string
  price: string
}

export interface OrderItemDetail {
  product: number
  quantity: string
  color: number
  price: string
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

export interface OrderItem {
  product: string
  quantity: string
  color: string
  price: string
  images: string[]
}

export interface Order {
  id: number
  status: string
  location: Location
  receive: string
  payment: string
  name: string
  phone_number: string
  additional_phone_number: string
  items_detail: OrderItem[]
  created: string
  price: string
}


export interface OrderItemCom {
  product: string
  quantity: string
  color: string
  price: string
  images: string[]
  is_there?: boolean | {
    status: string
    supplier_requests: {
      id: number
      full_name: string
      phone: string
      status: string
      total_quantity: number
      created_at: string
    }[]
  }
}

export interface OrderCom {
  id: number
  status: string
  location: Location
  receive: string
  payment: string
  name: string
  phone_number: string
  additional_phone_number: string
  items_detail: OrderItemCom[]
  created: string
  price: string
}

// types.ts ga qo'shamiz

export interface SupplierRequest {
  id: number
  supplier: number
  product: number
  orders: number[]
  total_quantity: number
  status: 'p' | 'a' | 'r' // pending, accepted, rejected
  created_at: string
}

export interface SupplierRequestWithDetails extends SupplierRequest {
  supplier_details?: User
  product_details?: Product
  order_details?: Order[]
}

export type CreateOrder = Omit<Order, "id" | "created">
