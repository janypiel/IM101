import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header.js';
import '../styles/Billing.css'

const BillingList = () => {
  const [billings, setBillings] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');

    if (!email) {
      navigate('/login');
      return;
    }

    setLoading(true);

    fetch('https://vynceianoani.helioho.st/fetchBillings.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })
      .then((response) => response.json())
      .then((data) => {
        setLoading(false);
        if (data.status === 'success') {
          setBillings(data.billings);
        } else {
          setError(data.message || 'Failed to fetch billings.');
        }
      })
      .catch((error) => {
        setLoading(false);
        setError('An error occurred while fetching billings.');
      });
  }, [navigate]);

  const handlePayNow = (billing) => {
    // Navigate to FinalizeBillingPage and pass billing details
    navigate('/finalize-billing', { state: { billing } });
  };

  return (
    <div>
        <Header/>
    
    <div className="billing-list-container">
      <h2>Your Billings</h2>

      {loading && <p>Loading...</p>}
      {error && <div className="error-message">{error}</div>}

      <ul className="billing-list">
        {billings.length > 0 ? (
          billings.map((billing) => (
            <li key={billing.billing_id} className="billing-item">
              <div>
                <p><strong>Billing ID:</strong> {billing.billing_id}</p>
                <p><strong>Total Price:</strong> ${billing.total_price}</p>
                <p><strong>Status:</strong> {billing.status}</p>
                <p><strong>Date:</strong> {billing.billing_date}</p>
                <p><strong>Time:</strong> {billing.billing_time}</p>
              </div>
              {billing.status === 'pending' && (
                <button
                  className="pay-now-button"
                  onClick={() => handlePayNow(billing)}
                >
                  Pay Now
                </button>
              )}
            </li>
          ))
        ) : (
          <p>No billings found.</p>
        )}
      </ul>
    </div>
    </div>
  );
};

export default BillingList;
