export interface Product {
  id: string
  name: string
  price: number
  category: string
  description: string
  emoji: string
  popular?: boolean
  new?: boolean
}

export const CATEGORIES = ['Tất cả', 'Coffee', 'Trà', 'Bánh', 'Khác']

export const PRODUCTS: Product[] = [
  { id: 'p1',  name: 'Black Coffee',       price: 35000, category: 'Coffee', emoji: '☕', description: 'Cà phê đen đậm đà, thức tỉnh ngay từ ngụm đầu tiên', popular: true },
  { id: 'p2',  name: 'Cafe Latte',          price: 45000, category: 'Coffee', emoji: '☕', description: 'Espresso kết hợp sữa tươi béo ngậy, hài hoà hoàn hảo', popular: true },
  { id: 'p3',  name: 'Cappuccino',          price: 45000, category: 'Coffee', emoji: '☕', description: 'Lớp foam mịn màng phủ trên espresso thơm nồng' },
  { id: 'p4',  name: 'Flat White',          price: 50000, category: 'Coffee', emoji: '☕', description: 'Đậm đà hơn Latte, ít sữa hơn Cappuccino' },
  { id: 'p5',  name: 'Irish Coffee',        price: 55000, category: 'Coffee', emoji: '☕', description: 'Cà phê đặc biệt với hương vị phong phú độc đáo', new: true },
  { id: 'p6',  name: 'Espresso',            price: 39000, category: 'Coffee', emoji: '☕', description: 'Thuần khiết, đậm đặc — cà phê trong trạng thái nguyên bản nhất' },
  { id: 'p7',  name: 'Trà Xanh Đậu Đỏ',   price: 40000, category: 'Trà',    emoji: '🍵', description: 'Trà xanh thơm mát kết hợp đậu đỏ ngọt bùi', popular: true },
  { id: 'p8',  name: 'Trà Thạch Đào',      price: 40000, category: 'Trà',    emoji: '🍵', description: 'Trà đào thanh mát với thạch giòn sần sật' },
  { id: 'p9',  name: 'Trà Thạch Vải',      price: 40000, category: 'Trà',    emoji: '🍵', description: 'Trà vải tươi ngọt với thạch trái cây hấp dẫn', new: true },
  { id: 'p10', name: 'Tiramisu',            price: 55000, category: 'Bánh',   emoji: '🎂', description: 'Bánh Ý kinh điển, lớp kem mascarpone tan chảy', popular: true },
  { id: 'p11', name: 'Mousse Cacao',        price: 50000, category: 'Bánh',   emoji: '🍫', description: 'Mousse cacao mềm mịn, vị đắng nhẹ tinh tế' },
  { id: 'p12', name: 'Phô Mai Trà Xanh',   price: 50000, category: 'Bánh',   emoji: '🧁', description: 'Cheesecake trà xanh — sự kết hợp hoàn hảo giữa Nhật và Tây' },
  { id: 'p13', name: 'Phô Mai Caramel',     price: 50000, category: 'Bánh',   emoji: '🧁', description: 'Cheesecake caramel ngọt thơm, béo ngậy', new: true },
  { id: 'p14', name: 'Phô Mai Cà Phê',     price: 50000, category: 'Bánh',   emoji: '🧁', description: 'Cheesecake kết hợp cà phê — dành cho tín đồ cà phê' },
]

export const FEATURED = PRODUCTS.filter((p) => p.popular)
