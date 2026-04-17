import { useState, useEffect } from 'react';
import { Clock, CheckCircle, Eye, BellRing, Receipt, Trash2 } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';

type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  notes: string;
  price: number;
};

type Order = {
  id: string;
  table: string;
  items: OrderItem[];
  subtotal: number;
  status: 'NEW' | 'SEEN' | 'DONE';
  timestamp: string;
};

type BillRequest = {
  id: string;
  table: string;
  orders: Order[];
  total: number;
  status: 'PENDING' | 'DELIVERED';
  timestamp: string;
};

export default function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [billRequests, setBillRequests] = useState<BillRequest[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [confirmingOrderId, setConfirmingOrderId] = useState<string | null>(null);
  const [confirmingBillId, setConfirmingBillId] = useState<string | null>(null);

  useEffect(() => {
    if (confirmingOrderId || confirmingBillId) {
      const timer = setTimeout(() => {
        setConfirmingOrderId(null);
        setConfirmingBillId(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [confirmingOrderId, confirmingBillId]);

  useEffect(() => {
    // Setup Firestore listeners
    const ordersQuery = query(collection(db, 'orders'), orderBy('timestamp', 'desc'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[];
      setOrders(ordersData);
      setIsConnected(true);
    }, (error) => {
      console.error('Firestore Error (orders):', error);
      setIsConnected(false);
    });

    const billsQuery = query(collection(db, 'billRequests'), orderBy('timestamp', 'desc'));
    const unsubscribeBills = onSnapshot(billsQuery, (snapshot) => {
      const billsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as BillRequest[];
      setBillRequests(billsData);
    }, (error) => {
      console.error('Firestore Error (billRequests):', error);
    });

    return () => {
      unsubscribeOrders();
      unsubscribeBills();
    };
  }, []);

  const updateOrderStatus = async (id: string, status: 'SEEN' | 'DONE') => {
    try {
      const orderRef = doc(db, 'orders', id);
      await updateDoc(orderRef, { status });
    } catch (error) {
      console.error('Failed to update order status', error);
    }
  };

  const updateItemServedStatus = async (orderId: string, itemId: string, served: boolean) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      const order = orders.find(o => o.id === orderId);
      if (!order) return;

      const updatedItems = order.items.map((item: any) => 
        item.orderItemId === itemId ? { ...item, served } : item
      );

      // Check if all items are served
      let newStatus = order.status;
      const allServed = updatedItems.every((i: any) => i.served);
      if (allServed && order.status !== 'DONE') {
        newStatus = 'DONE';
      } else if (!allServed && order.status === 'DONE') {
        newStatus = 'SEEN';
      }

      await updateDoc(orderRef, { 
        items: updatedItems,
        status: newStatus
      });
    } catch (error) {
      console.error('Failed to update item served status', error);
    }
  };

  const updateBillStatus = async (id: string, table: string) => {
    try {
      // 1. Mark the bill request as COMPLETED
      const billRef = doc(db, 'billRequests', id);
      await updateDoc(billRef, { status: 'COMPLETED' });

      // 2. Find all non-archived orders for this table and mark them as ARCHIVED
      // We do this so the table resets for the next customer
      const tableOrders = orders.filter(o => o.table === table && o.status !== 'ARCHIVED');
      for (const order of tableOrders) {
        const orderRef = doc(db, 'orders', order.id);
        await updateDoc(orderRef, { status: 'ARCHIVED' });
      }
    } catch (error) {
      console.error('Failed to clear table and pay bill', error);
    }
  };

  const archiveOrder = async (orderId: string) => {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await updateDoc(orderRef, { status: 'ARCHIVED' });
    } catch (error) {
      console.error('Failed to archive individual order', error);
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'ARCHIVED');
  const activeBillRequests = billRequests.filter(r => r.status === 'PENDING');

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans">
      {/* Header */}
      <header className="bg-white border-b border-line px-6 py-4 flex justify-between items-center sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-40 flex-shrink-0">
            <img 
              src="https://rotiwala.ca/wp-content/uploads/2024/11/Roti-Wala-Logo-full5-1024x344.png" 
              alt="Roti Wala Logo" 
              className="w-full h-auto object-contain object-left"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h1 className="text-xl font-serif text-brown-dark font-medium border-l-2 border-line pl-4">Staff Dashboard</h1>
            <div className="flex items-center gap-2 mt-1 pl-4">
              <div className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-sm text-ink/60">{isConnected ? 'Live' : 'Disconnected'}</span>
            </div>
          </div>
        </div>
        <div className="flex gap-6 text-sm font-medium">
          <div className="flex flex-col items-center">
            <span className="text-brown-light text-xl">{activeOrders.length}</span>
            <span className="text-ink/60">Active</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-red-600 text-xl">{activeBillRequests.length}</span>
            <span className="text-ink/60">Bills</span>
          </div>
        </div>
      </header>

      <main className="p-6 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left/Main Column: Active Orders */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-ink flex items-center gap-2">
            <Clock className="w-5 h-5" /> Active Orders
          </h2>
          
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center text-ink/60 border border-line">
              No active orders. Kitchen is clear!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeOrders.map(order => (
                <div 
                  key={order.id} 
                  className={`rounded-xl border-2 overflow-hidden flex flex-col bg-white ${
                    order.status === 'NEW' 
                      ? 'border-brown-light shadow-[0_0_15px_rgba(166,123,91,0.2)]' 
                      : 'border-yellow-500/50'
                  }`}
                >
                    <div className={`p-3 flex justify-between items-center border-b ${
                      order.status === 'NEW' ? 'bg-brown-light/10 border-brown-light/20' : 'bg-yellow-500/10 border-yellow-500/20'
                    }`}>
                      <div className="flex flex-col">
                         <div className="font-bold text-2xl text-ink leading-none">Table {order.table}</div>
                         <div className="flex items-center gap-2 mt-1">
                           <div className="text-[10px] uppercase tracking-widest text-ink/40 font-bold">New Order</div>
                           <div className="text-[10px] bg-ink text-white px-1.5 py-0.5 rounded font-bold">${order.subtotal.toFixed(2)}</div>
                         </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-sm font-bold text-brown-dark bg-white px-2 py-0.5 rounded shadow-sm">{formatTime(order.timestamp)}</div>
                        <div className="text-[10px] text-ink/40 mt-1 uppercase">Received</div>
                      </div>
                    </div>
                  
                  <div className="p-4 flex-1">
                    <ul className="space-y-3">
                      {order.items.map((item: any, idx: number) => (
                        <li key={idx} className={`flex flex-col p-2 rounded-md transition-colors ${item.served ? 'bg-green-50 opacity-70' : 'hover:bg-black/5'}`}>
                          <div className="flex items-start gap-3">
                            <button 
                              onClick={() => updateItemServedStatus(order.id, item.orderItemId, !item.served)}
                              className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                item.served ? 'bg-green-500 border-green-500 text-white' : 'border-brown-light/50 text-transparent hover:border-brown-light'
                              }`}
                            >
                              <CheckCircle className="w-3.5 h-3.5" />
                            </button>
                            <div className={`flex-1 ${item.served ? 'line-through text-ink/60' : ''}`}>
                              <div className="flex items-start gap-2">
                                <span className="font-bold text-brown-light min-w-[1.5rem]">{item.quantity}x</span>
                                <span className="font-medium text-ink">{item.name}</span>
                              </div>
                              {item.notes && (
                                <span className="text-sm text-brown-dark ml-8 bg-brown-light/10 px-2 py-1 rounded inline-block mt-1">
                                  Note: {item.notes}
                                </span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="p-3 bg-black/5 border-t border-line flex gap-2">
                    {order.status === 'NEW' && (
                      <button 
                        onClick={() => updateOrderStatus(order.id, 'SEEN')}
                        className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Eye className="w-4 h-4" /> Acknowledge
                      </button>
                    )}
                    {confirmingOrderId === order.id ? (
                      <button 
                        onClick={() => { archiveOrder(order.id); setConfirmingOrderId(null); }}
                        className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold animate-pulse shadow-inner"
                      >
                        Click to Confirm
                      </button>
                    ) : (
                      <button 
                        onClick={() => setConfirmingOrderId(order.id)}
                        className={`flex-1 ${order.status === 'NEW' ? 'bg-ink/10 text-ink/60 hover:bg-ink/20' : 'bg-ink text-white hover:bg-black'} py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors`}
                      >
                        <Trash2 className="w-4 h-4" /> Clear Order
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Bills & Completed */}
        <div className="space-y-6">
          
          {/* Bill Requests */}
          <div>
            <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-4">
              <BellRing className="w-5 h-5" /> Bill Requests
            </h2>
            
            {activeBillRequests.length === 0 ? (
              <div className="bg-white rounded-xl p-6 text-center text-ink/60 border border-line text-sm">
                No pending bills.
              </div>
            ) : (
              <div className="space-y-3">
                {activeBillRequests.map(req => (
                  <div key={req.id} className="bg-red-50 border border-red-200 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center mb-3">
                      <div className="font-bold text-xl text-red-700">Table {req.table}</div>
                      <div className="text-sm text-red-600/70">{formatTime(req.timestamp)}</div>
                    </div>
                    <div className="flex justify-between items-center mb-4 text-ink">
                      <span>Total Due:</span>
                      <span className="font-bold text-lg">${req.total.toFixed(2)}</span>
                    </div>
                    {confirmingBillId === req.id ? (
                      <button 
                        onClick={() => { updateBillStatus(req.id, req.table); setConfirmingBillId(null); }}
                        className="w-full bg-red-700 text-white py-2 rounded-lg font-bold animate-pulse shadow-inner"
                      >
                        Confirm Payment?
                      </button>
                    ) : (
                      <button 
                        onClick={() => setConfirmingBillId(req.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                      >
                        <Receipt className="w-4 h-4" /> Paid & Clear Table
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
