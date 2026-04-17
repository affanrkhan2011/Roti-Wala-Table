export type MenuItem = {
  id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
};

export const MENU_CATEGORIES = [
  'Street Heaven',
  'Freshly Baked',
  'Rotiwala\'s Brunch',
  'Roti Wala Specialty',
  'Dessert',
  'Tea / Coffee',
  'Cold Drinks'
];

export const MENU_ITEMS: MenuItem[] = [
  // Street Heaven
  { id: 'sh1', name: 'Fuchka (Pani Puri) 7pcs', price: 8, category: 'Street Heaven' },
  { id: 'sh2', name: 'Doi Fuchka', price: 9, category: 'Street Heaven' },
  { id: 'sh3', name: 'Chotpoti', price: 6, category: 'Street Heaven' },
  { id: 'sh4', name: 'Piyaju (Veg Pakora)', price: 8.5, category: 'Street Heaven' },
  { id: 'sh5', name: 'Samosa\'s 3pcs (Beef, Chicken, or Veg)', price: 7, category: 'Street Heaven' },
  { id: 'sh6', name: 'Mughlai Paratha (Egg)', price: 8, category: 'Street Heaven' },
  { id: 'sh7', name: 'Mughlai Paratha (Chicken)', price: 9.5, category: 'Street Heaven' },
  { id: 'sh8', name: 'Chicken Rolls (2pcs)', price: 6.49, category: 'Street Heaven' },
  { id: 'sh9', name: 'Koliji Singara: Beef Liver (2pcs)', price: 6, category: 'Street Heaven' },
  { id: 'sh10', name: 'Dal Puri (3pcs)', description: 'Add extra 1pc for $2', price: 7, category: 'Street Heaven' },

  // Freshly Baked
  { id: 'fb1', name: 'Cookies 1 Doz (Nankhatai)', price: 7.50, category: 'Freshly Baked' },
  { id: 'fb2', name: 'Cookies 24pcs (Nankhatai)', price: 8.50, category: 'Freshly Baked' },
  { id: 'fb3', name: 'Samosa Chips (Salted/Sweet/Sesame)', price: 3.50, category: 'Freshly Baked' },
  { id: 'fb4', name: 'Monakka (Shakkar Para)', price: 5, category: 'Freshly Baked' },
  { id: 'fb5', name: 'Whole Wheat Roti\'s – 10pcs Pack', price: 7, category: 'Freshly Baked' },
  { id: 'fb6', name: 'Whole Wheat Roti\'s – 20pcs Pack', price: 13.50, category: 'Freshly Baked' },

  // Rotiwala's Brunch
  { id: 'rb1', name: '2pcs Roti / Paratha with Omelette', description: 'Add Curries: $4 for Veg / $5 for Meat', price: 6, category: 'Rotiwala\'s Brunch' },
  { id: 'rb2', name: 'Breakfast Roti Wrap', description: 'Served with Chips; Add $2 for Beef/Chicken', price: 5.95, category: 'Rotiwala\'s Brunch' },
  { id: 'rb3', name: 'Lunch Value Box', description: 'Served with Roasted Chicken, Pulao, Samosa & Salad', price: 13, category: 'Rotiwala\'s Brunch' },
  { id: 'rb4', name: 'Combo Meals 1 – Veg', description: 'Rice, 2 Roti, 2 Veg Curries, and Sweets', price: 10, category: 'Rotiwala\'s Brunch' },
  { id: 'rb5', name: 'Combo Meals 2 – Mix', description: 'Rice, 2 Roti, 1 Veg and 1 Meat Curries, and Sweets', price: 11, category: 'Rotiwala\'s Brunch' },
  { id: 'rb6', name: 'Combo Meals 3 – Meat', description: 'Rice, 2 Roti, 2 Meat Curries, and Sweets', price: 13, category: 'Rotiwala\'s Brunch' },

  // Roti Wala Specialty
  { id: 'rws1', name: 'Beef Tehari', price: 16, category: 'Roti Wala Specialty' },
  { id: 'rws2', name: 'Murgh Pulam (Roasted Chicken)', price: 18, category: 'Roti Wala Specialty' },
  { id: 'rws3', name: 'Roasted Chicken Pulaw – Spicy', price: 18, category: 'Roti Wala Specialty' },
  { id: 'rws4', name: 'Haleem', price: 12, category: 'Roti Wala Specialty' },
  { id: 'rws5', name: 'Haleem Paratha / Roti', price: 15, category: 'Roti Wala Specialty' },
  { id: 'rws6', name: 'Meat Pies / Patties', description: 'Beef, Chicken, Vegetable', price: 4, category: 'Roti Wala Specialty' },

  // Dessert
  { id: 'd1', name: 'Real Fruit Falooda', price: 9, category: 'Dessert' },
  { id: 'd2', name: 'Firni', price: 6, category: 'Dessert' },
  { id: 'd3', name: 'Rasmalai', price: 6, category: 'Dessert' },
  { id: 'd4', name: 'Gulab Jamun (2pcs)', price: 5, category: 'Dessert' },
  { id: 'd5', name: 'Desi Doi', price: 6, category: 'Dessert' },

  // Tea / Coffee
  { id: 'tc1', name: 'Cha (Bangladeshi Style)', price: 2.50, category: 'Tea / Coffee' },
  { id: 'tc2', name: 'Ginger & Lemon Tea', price: 2.50, category: 'Tea / Coffee' },
  { id: 'tc3', name: 'Black Tea', price: 2.50, category: 'Tea / Coffee' },
  { id: 'tc4', name: 'Green Tea', price: 3, category: 'Tea / Coffee' },
  { id: 'tc5', name: 'Coffee', description: 'Espresso, Americano, Cappuccino, Latte', price: 4, category: 'Tea / Coffee' },

  // Cold Drinks
  { id: 'cd1', name: 'Soda Pop', price: 2.50, category: 'Cold Drinks' },
  { id: 'cd2', name: 'Mango Juice', price: 3.50, category: 'Cold Drinks' },
  { id: 'cd3', name: 'Apple Juice', price: 3.50, category: 'Cold Drinks' },
  { id: 'cd4', name: 'Passionfruit Juice', price: 3.50, category: 'Cold Drinks' },
  { id: 'cd5', name: 'Bottle Water', price: 1.50, category: 'Cold Drinks' }
];

