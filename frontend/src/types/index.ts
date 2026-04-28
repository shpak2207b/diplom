export interface Component {
  id: number
  partNumber: string
  manufacturer: string
  quantity: number
}

export interface CartItem {
  component: Component
  quantity: number
}

export interface CatalogResponse {
  items: Component[]
  total: number
  page: number
  limit: number
  pages: number
}

export interface Order {
  id: number
  customerName: string
  customerEmail: string
  customerPhone?: string
  companyName?: string
  comment?: string
  status: 'NEW' | 'PROCESSED' | 'COMPLETED' | 'ARCHIVED'
  createdAt: string
  items: OrderItem[]
}

export interface OrderItem {
  id: number
  partNumber: string
  manufacturer: string
  quantityRequested: number
}

export interface DashboardMessage {
  id: number
  name: string
  email: string
  message: string
  createdAt: string
}

export interface DashboardStats {
  totalOrders: number
  newOrders: number
  totalComponents: number
  newMessages: number
  recentMessages: DashboardMessage[]
}
