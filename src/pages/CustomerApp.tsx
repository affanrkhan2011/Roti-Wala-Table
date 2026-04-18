import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MENU_CATEGORIES, MENU_ITEMS, MenuItem } from '../data/menu';
import { ShoppingCart, Plus, Minus, Send, CreditCard, UtensilsCrossed } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, query, where, onSnapshot, doc } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

type CartItem = MenuItem & { quantity: number; notes: string };

export default function CustomerApp() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tableParam = searchParams.get('table');
  
  const [tableNumber, setTableNumber] = useState<string>(tableParam || '');
  const [isTableConfirmed, setIsTableConfirmed] = useState<boolean>(!!tableParam);
  
  const [activeCategory, setActiveCategory] = useState(MENU_CATEGORIES[0]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tableOrders, setTableOrders] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hasOrdered, setHasOrdered] = useState(false);
  const [orderStatus, setOrderStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [billStatus, setBillStatus] = useState<'idle' | 'requesting' | 'requested'>('idle');
  const [unavailableItems, setUnavailableItems] = useState<Record<string, boolean>>({});

  // Fetch unavailable menu items
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, 'menuState', 'availability'), (snapshot) => {
      if (snapshot.exists()) {
        setUnavailableItems(snapshot.data() as Record<string, boolean>);
      } else {
        setUnavailableItems({});
      }
    }, (error) => {
      console.error('Firestore Error (menu availability):', error);
    });
    return () => unsubscribe();
  }, []);

  // Firestore listeners for real-time updates
  useEffect(() => {
    if (isTableConfirmed && tableNumber) {
      const q = query(
        collection(db, 'orders'),
        where('table', '==', tableNumber),
        where('status', '!=', 'ARCHIVED')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        setTableOrders(orders);
        if (orders.length > 0) {
          setHasOrdered(true);
        } else {
          setHasOrdered(false);
          if (activeCategory === 'My Orders') {
            setActiveCategory(MENU_CATEGORIES[0]);
          }
        }
      }, (error) => {
        console.error('Firestore Error (orders):', error);
      });

      return () => unsubscribe();
    }
  }, [isTableConfirmed, tableNumber]);

  useEffect(() => {
    if (isTableConfirmed && tableNumber) {
      const q = query(
        collection(db, 'billRequests'),
        where('table', '==', tableNumber),
        where('status', '==', 'PENDING')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
        // If there's a pending request, set status to requested
        if (requests.length > 0) {
          setBillStatus('requested');
        } else {
          setBillStatus('idle');
        }
      }, (error) => {
        console.error('Firestore Error (billRequests):', error);
      });

      return () => unsubscribe();
    }
  }, [isTableConfirmed, tableNumber]);

  const handleTableSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tableNumber.trim()) {
      setSearchParams({ table: tableNumber });
      setIsTableConfirmed(true);
    }
  };

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...item, quantity: 1, notes: '' }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const updateNotes = (id: string, notes: string) => {
    setCart(prev => prev.map(item => item.id === id ? { ...item, notes } : item));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const tableTotal = tableOrders.reduce((sum, order) => sum + order.subtotal, 0);
  const grandTotal = cartTotal + tableTotal;

  // Combine categories with "My Orders" if they have ordered
  const displayCategories = hasOrdered ? [...MENU_CATEGORIES, 'My Orders'] : MENU_CATEGORIES;

  const placeOrder = async () => {
    if (cart.length === 0) return;
    setOrderStatus('sending');
    
    try {
      const itemsWithStatus = cart.map((item: any) => ({
        ...item,
        orderItemId: uuidv4(),
        served: false
      }));

      await addDoc(collection(db, 'orders'), {
        table: tableNumber,
        items: itemsWithStatus,
        subtotal: cartTotal,
        status: 'NEW',
        timestamp: new Date().toISOString(),
      });
      
      setOrderStatus('sent');
      setCart([]);
      setIsCartOpen(false);
      setHasOrdered(true);
      setTimeout(() => setOrderStatus('idle'), 3000);
    } catch (error) {
      console.error('Failed to place order', error);
      setOrderStatus('idle');
    }
  };

  const requestBill = async () => {
    if (tableOrders.length === 0) return;
    setBillStatus('requesting');
    
    try {
      await addDoc(collection(db, 'billRequests'), {
        table: tableNumber,
        orders: tableOrders,
        total: tableTotal,
        status: 'PENDING',
        timestamp: new Date().toISOString(),
      });
      
      setBillStatus('requested');
    } catch (error) {
      console.error('Failed to request bill', error);
      setBillStatus('idle');
    }
  };

  if (!isTableConfirmed) {
    return (
      <div className="min-h-screen bg-paper flex flex-col items-center justify-center p-6 font-sans text-ink">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border-t-4 border-brown-dark">
          <div className="w-64 mx-auto mb-6 flex items-center justify-center">
            <img 
              src="https://rotiwala.ca/wp-content/uploads/2024/11/Roti-Wala-Logo-full5-1024x344.png" 
              alt="Roti Wala Logo" 
              className="w-full h-auto object-contain object-center"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <form onSubmit={handleTableSubmit} className="space-y-4">
            <input
              type="number"
              min="1"
              max="100"
              required
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="w-full text-center font-serif text-4xl py-4 rounded-xl border border-line focus:border-brown-dark focus:ring-1 focus:ring-brown-dark outline-none"
              placeholder="Table #"
            />
            <button
              type="submit"
              className="w-full bg-brown-light hover:bg-brown-dark text-white font-bold uppercase text-xs tracking-[1px] py-4 rounded-md transition-colors"
            >
              View Menu
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-sans flex flex-col md:grid md:grid-cols-[240px_1fr] overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="bg-brown-dark text-white py-10 flex flex-col md:h-screen md:overflow-y-auto">
        <div className="px-4 pb-10 border-b border-white/10 hidden md:flex flex-col items-center">
          <div className="w-48 bg-white p-2 rounded-lg shadow-sm">
            <img 
              src="https://rotiwala.ca/wp-content/uploads/2024/11/Roti-Wala-Logo-full5-1024x344.png" 
              alt="Roti Wala Logo" 
              className="w-full h-auto object-contain object-center"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
        
        {/* Mobile Header */}
        <div className="px-4 pb-4 flex justify-between items-center md:hidden">
          <div className="flex items-center gap-3">
            <div className="w-24 flex-shrink-0 bg-white p-1 rounded-md shadow-sm">
              <img 
                src="https://rotiwala.ca/wp-content/uploads/2024/11/Roti-Wala-Logo-full5-1024x344.png" 
                alt="Logo" 
                className="w-full h-auto object-contain object-center"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[2px] opacity-80 text-white">Table {tableNumber}</p>
            </div>
          </div>
          {hasOrdered && (
            <button
              onClick={requestBill}
              disabled={billStatus !== 'idle'}
              className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-[1px] transition-colors ${
                billStatus === 'requested' 
                  ? 'bg-green-800 text-white opacity-50'
                  : 'bg-[#D32F2F] text-white hover:bg-red-800'
              }`}
            >
              <CreditCard className="w-3 h-3" />
              {billStatus === 'requested' ? 'Requested' : 'Pay Bill'}
            </button>
          )}
        </div>

        {/* Category Tabs */}
        <ul className="list-none md:mt-8 flex md:flex-col overflow-x-auto md:overflow-visible hide-scrollbar flex-1">
          {displayCategories.map(category => (
            <li
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`whitespace-nowrap px-6 md:px-8 py-4 text-sm font-medium cursor-pointer border-b-4 md:border-b-0 md:border-l-4 transition-all duration-200 ${
                activeCategory === category
                  ? 'bg-white/5 border-brown-light opacity-100'
                  : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              {category}
            </li>
          ))}
        </ul>
        
      </aside>

      {/* Main Content */}
      <main className="p-6 md:p-10 lg:px-16 lg:py-10 flex flex-col relative h-[calc(100vh-130px)] md:h-screen overflow-y-auto">
        <header className="hidden md:flex justify-between items-end mb-12">
          <div>
            <h2 className="font-serif text-5xl italic border-b-2 border-brown-dark pb-2 leading-none">{activeCategory}</h2>
          </div>
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-[2px] text-brown-dark font-bold">Table</div>
            <div className="font-serif text-6xl leading-[0.8] text-brown-light">{tableNumber}</div>
          </div>
        </header>

        {orderStatus === 'sent' && (
          <div className="bg-green-100 border border-green-200 text-green-800 px-4 py-3 rounded-xl mb-8 text-center font-medium shadow-sm">
            Your order has been sent to the kitchen! 🍛
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 content-start pb-32">
          {activeCategory === 'My Orders' ? (
            <div className="col-span-1 lg:col-span-2 space-y-8">
              {/* Preparing / Coming */}
              <div>
                <h3 className="font-serif text-2xl mb-4 text-brown-dark border-b border-line pb-2">Preparing</h3>
                <div className="space-y-3">
                  {tableOrders.flatMap(order => order.items).filter(item => !item.served).length === 0 ? (
                    <p className="text-ink/60 text-sm italic">No items currently preparing.</p>
                  ) : (
                    tableOrders.flatMap(order => order.items).filter(item => !item.served).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white p-4 rounded-xl border border-line shadow-sm">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-brown-light bg-brown-light/10 px-2 py-1 rounded">{item.quantity}x</span>
                          <span className="font-medium text-ink">{item.name}</span>
                        </div>
                        <span className="text-xs uppercase tracking-wider text-saffron font-bold animate-pulse">Cooking...</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Delivered / Served */}
              <div>
                <h3 className="font-serif text-2xl mb-4 text-brown-dark border-b border-line pb-2">Delivered</h3>
                <div className="space-y-3">
                  {tableOrders.flatMap(order => order.items).filter(item => item.served).length === 0 ? (
                    <p className="text-ink/60 text-sm italic">No items delivered yet.</p>
                  ) : (
                    tableOrders.flatMap(order => order.items).filter(item => item.served).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center bg-white/50 p-4 rounded-xl border border-line">
                        <div className="flex items-center gap-3 opacity-60">
                          <span className="font-bold text-brown-dark">{item.quantity}x</span>
                          <span className="font-medium text-ink line-through">{item.name}</span>
                        </div>
                        <span className="text-xs uppercase tracking-wider text-green-600 font-bold">Served</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            MENU_ITEMS.filter(item => item.category === activeCategory).map(item => {
              const cartItem = cart.find(i => i.id === item.id);
              return (
                <div key={item.id} className="grid grid-cols-[1fr_auto] gap-4 border-b border-line pb-5">
                  <div>
                    <h3 className="font-serif text-xl mb-1">{item.name}</h3>
                    {item.description && <p className="text-[13px] text-[#666] leading-relaxed">{item.description}</p>}
                  </div>
                  
                  <div className="text-right flex flex-col items-end justify-between">
                    <span className={`font-serif text-lg block mb-2 ${unavailableItems[item.id] ? 'opacity-50 line-through text-red-700' : 'font-bold'}`}>
                      ${item.price.toFixed(2)}
                    </span>
                    {cartItem ? (
                      <div className="flex items-center gap-3 bg-paper border border-brown-dark rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="p-1 text-brown-dark hover:bg-black/5 rounded-full">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{cartItem.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="p-1 text-brown-dark hover:bg-black/5 rounded-full">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : unavailableItems[item.id] ? (
                      <button
                        disabled
                        className="bg-red-50 text-red-600 border border-red-200 px-4 py-1.5 rounded-full font-semibold text-xs cursor-not-allowed opacity-80"
                      >
                        Unavailable
                      </button>
                    ) : (
                      <button
                        onClick={() => addToCart(item)}
                        className="bg-paper border border-brown-dark text-brown-dark px-4 py-1.5 rounded-full font-semibold text-xs cursor-pointer hover:bg-brown-dark hover:text-white transition-colors"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cart Summary Bar */}
        {(cartCount > 0 || hasOrdered) && !isCartOpen && (
          <div className="fixed bottom-6 left-6 right-6 md:bottom-10 md:left-[calc(240px+2.5rem)] lg:left-[calc(240px+4rem)] md:right-10 lg:right-16 bg-ink text-white px-6 py-4 md:px-8 md:py-5 rounded-xl flex justify-between items-center shadow-[0_20px_40px_rgba(0,0,0,0.4)] z-30">
            <div className="flex items-center gap-4 md:gap-5">
              {cartCount > 0 && (
                <div className="bg-brown-light w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                  {cartCount}
                </div>
              )}
              <div className="min-w-0">
                <div className="text-[10px] uppercase tracking-[1px] opacity-60 truncate">
                  {cartCount > 0 ? (tableTotal > 0 ? 'Cart + Ordered Total' : 'Cart Total') : 'Total Ordered'}
                </div>
                <div className="text-lg md:text-xl font-semibold">${grandTotal.toFixed(2)} CAD</div>
              </div>
            </div>
            <div className="flex gap-3 md:gap-4 shrink-0">
              {hasOrdered && (
                <button
                  onClick={requestBill}
                  disabled={billStatus !== 'idle'}
                  className={`hidden sm:block px-4 md:px-6 py-2.5 md:py-3 rounded-md font-bold uppercase text-[10px] md:text-xs tracking-[1px] transition-colors ${
                    billStatus === 'requested' 
                      ? 'bg-green-800 text-white cursor-not-allowed'
                      : 'bg-[#D32F2F] text-white hover:bg-red-800'
                  }`}
                >
                  {billStatus === 'requested' ? 'Requested' : '💳 Pay Bill'}
                </button>
              )}
              {cartCount > 0 && (
                <button
                  onClick={() => setIsCartOpen(true)}
                  className="bg-brown-light text-white px-4 py-2.5 md:px-6 md:py-3 rounded-md font-bold uppercase text-[10px] md:text-xs tracking-[1px] hover:bg-brown-dark transition-colors"
                >
                  View Order
                </button>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Full Cart Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-ink/80 z-50 flex flex-col justify-end md:justify-center md:items-center p-4">
          <div className="bg-paper w-full max-w-2xl mx-auto rounded-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-line flex justify-between items-center bg-white">
              <h2 className="font-serif text-2xl italic text-brown-dark">Your Order</h2>
              <button onClick={() => setIsCartOpen(false)} className="text-ink opacity-60 hover:opacity-100 font-medium text-sm uppercase tracking-wider">
                Close
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-paper">
              {cart.map(item => (
                <div key={item.id} className="space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-serif text-lg">{item.name}</h4>
                      <p className="text-ink opacity-60 text-sm font-serif">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white border border-line rounded-full px-2 py-1">
                      <button onClick={() => updateQuantity(item.id, -1)} className="p-1.5 text-brown-dark hover:bg-black/5 rounded-full">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold w-6 text-center text-sm">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="p-1.5 text-brown-dark hover:bg-black/5 rounded-full">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <input
                    type="text"
                    placeholder="Add note (e.g., No spice, extra sauce)"
                    value={item.notes}
                    onChange={(e) => updateNotes(item.id, e.target.value)}
                    className="w-full text-sm bg-white border border-line rounded-lg px-4 py-3 focus:outline-none focus:border-brown-dark font-sans"
                  />
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-line bg-white">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[11px] uppercase tracking-[2px] font-bold text-brown-dark">Total</span>
                <span className="font-serif text-2xl font-bold">${cartTotal.toFixed(2)}</span>
              </div>
              <button
                onClick={placeOrder}
                disabled={orderStatus === 'sending'}
                className="w-full bg-brown-light hover:bg-brown-dark disabled:opacity-50 text-white font-bold py-4 rounded-md uppercase text-sm tracking-[1px] flex items-center justify-center gap-2 transition-colors"
              >
                <Send className="w-4 h-4" />
                {orderStatus === 'sending' ? 'Sending...' : 'Confirm Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
