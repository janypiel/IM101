import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import '../styles/FinalReservation.css'; // You can reuse the same styles

// Load PayPal SDK
const loadPayPalScript = (callback) => {
  const script = document.createElement('script');
  script.src = 'https://www.paypal.com/sdk/js?client-id=ASKmv9SI7KJMNK3yafnnS5xEG-BgdxBaTHuUmU9UXtSJ5VjoyaICL9Nqre4vewdy-q5uf5Lin_lC27Yl'; // Replace with your PayPal client ID
  script.onload = () => callback();
  document.body.appendChild(script);
};

const FinalizeBillingPage = () => {
  const [billingDetails, setBillingDetails] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [isPaid, setIsPaid] = useState(false); // Track payment status
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Retrieve email from local storage
    const email = localStorage.getItem('userEmail');
    
    // Retrieve billing details from location state
    const billing = location.state?.billing;
    if (billing) {
      // Include the email in the billingDetails
      setBillingDetails({ ...billing, email });
    } else {
      navigate('/userpage'); // Redirect if no billing details found
    }

    // Load PayPal script when component mounts
    loadPayPalScript(() => {
      window.paypal.Buttons({
        createOrder: (data, actions) => {
          // Get the total price without the dollar sign
          const totalPrice = billingDetails.total_price ? parseFloat(billingDetails.total_price).toFixed(2) : '0.00';
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: totalPrice, // Pass the numeric value
              },
            }],
          });
        },
        onApprove: (data, actions) => {
          return actions.order.capture().then(details => {
            setIsPaid(true);
             // Save payment with email included in billingDetails
          });
        },
        onError: (err) => {
          setError('Payment failed. Please try again.');
          setPending(false);
        }
      }).render('#paypal-button-container');
    });
  }, [location, navigate, billingDetails.total_price]);

  const savePaymentToDatabase = () => {
    const paymentData = {
        email: billingDetails.email, // Email is now part of billingDetails
        billing_id: billingDetails.billing_id,
        date_of_payment: new Date().toISOString(),
        type_of_payment: 'PayPal',
        payment_confirmation: 'success',
    };

    // Call the payment2.php API with the payment data
    fetch('https://vynceianoani.helioho.st/payment2.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData), // Send the payment data as JSON
    })
    .then((response) => response.json())
    .then((data) => {
        if (data.status === 'success') {
            navigate('/userpage'); // Redirect to a success page after payment
        } else {
            setError('Failed to save payment information.');
            setPending(false);
        }
    })
    .catch((error) => {
        setError('Failed to save payment information.');
        setPending(false);
    });
};

  return (
    <div>
      <Header />
      <div className="finalize-reservation-container">
        <div className="reservation-summary-box">
          <h2>Finalize Your Billing</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="reservation-details">
            <p><strong>Billing ID:</strong> {billingDetails.billing_id}</p>
            <p><strong>Email:</strong> {billingDetails.email}</p> {/* Display email from billingDetails */}
            <p><strong>Date:</strong> {billingDetails.billing_date}</p>
            <p><strong>Time:</strong> {billingDetails.billing_time}</p>
            <p><strong>Total Price:</strong> 
              ${billingDetails.total_price && !isNaN(billingDetails.total_price) 
                  ? parseFloat(billingDetails.total_price).toFixed(2) 
                  : 'N/A'}
            </p>
          </div>

          {/* PayPal Button */}
          <div id="paypal-button-container"></div>

          <div className="sample-button">
            <button onClick={savePaymentToDatabase} disabled={pending || !isPaid}>
              {pending ? 'Processing...' : isPaid ? 'Confirm Payment' : 'Complete Payment First'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinalizeBillingPage;
