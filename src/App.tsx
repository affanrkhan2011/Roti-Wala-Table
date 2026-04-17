/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { HashRouter, Routes, Route } from 'react-router-dom';
import CustomerApp from './pages/CustomerApp';
import StaffDashboard from './pages/StaffDashboard';
import { useEffect } from 'react';
import { db } from './firebase';
import { doc, getDocFromServer } from 'firebase/firestore';

export default function App() {
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<CustomerApp />} />
        <Route path="/staff56789" element={<StaffDashboard />} />
      </Routes>
    </HashRouter>
  );
}
