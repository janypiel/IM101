import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import '../styles/FinalReservation.css';
// Load PayPal SDK dynamically
const loadPayPalScript = (callback) => {
  const script = document.createElement('script');
  script.src = 'https://www.paypal.com/sdk/js?client-id=ASKmv9SI7KJMNK3yafnnS5xEG-BgdxBaTHuUmU9UXtSJ5VjoyaICL9Nqre4vewdy-q5uf5Lin_lC27Yl';
  script.onload = () => callback();
  document.body.appendChild(script);
};
const FinalizeReservationPage = () => {
  const [reservationDetails, setReservationDetails] = useState({});
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [reservationId, setReservationId] = useState(null);
  const [disablePayPal, setDisablePayPal] = useState(false); // State to disable PayPal
  const navigate = useNavigate();
  const location = useLocation();
  // Load reservation details from location state
  useEffect(() => {
    const details = location.state;
    if (details) {
      setReservationDetails(details);
    } else {
      navigate('/userpage'); // Redirect if no reservation details
    }
  }, [location, navigate]);
  // Validate reservation to prevent duplicate entries
  useEffect(() => {
    if (reservationDetails.date && reservationDetails.time && reservationDetails.employees) {
      validateReservation();
    }
  }, [reservationDetails]);
  const validateReservation = async () => {
    try {
      const response = await fetch('https://vynceianoani.helioho.st/validate_reservation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: reservationDetails.date,
          time: reservationDetails.time,
          employees: Object.values(reservationDetails.employees).flat(),
        }),
      });
      const data = await response.json();
      if (data.status === 'error') {
        setError(data.message);
        setDisablePayPal(true); // Disable PayPal buttons if duplicate is found
        setPending(true); // Disable actions if conflict is detected
      }
    } catch (err) {
      console.error('Validation error:', err);
      setError('Duplicate reservation found.');
      setDisablePayPal(true); // Disable PayPal on validation error
    }
  };
  // Load PayPal button only if no conflict is found
  useEffect(() => {
    if (!disablePayPal) {
      loadPayPalScript(() => {
        window.paypal.Buttons({
          createOrder: (data, actions) => {
            return actions.order.create({
              purchase_units: [
                {
                  amount: {
                    value: reservationDetails.price ? reservationDetails.price.toFixed(2) : '0.00',
                  },
                },
              ],
            });
          },
          onApprove: (data, actions) => {
            return actions.order.capture().then(() => {
              setIsPaid(true);
              createReservation(reservationDetails);
            });
          },
          onError: (err) => {
            setError('Payment failed. Please try again.');
            setPending(false);
          },
        }).render('#paypal-button-container');
      });
    }
  }, [disablePayPal, reservationDetails.price]);
  // Create reservation in the backend
  const createReservation = (details) => {
    if (reservationId) return;
    setPending(true);
    const reservationData = {
      ...details,
      status: 'pending',
    };
    fetch('https://vynceianoani.helioho.st/billing.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reservationData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success' && data.billing_id) {
          setReservationId(data.billing_id);
          setPending(false);
        } else {
          setPending(false);
          setError(data.message || 'Failed to create reservation.');
        }
      })
      .catch((error) => {
        console.error('Error creating reservation:', error);
        setError('Failed to create reservation.');
        setPending(false);
      });
  };
  // Save payment information to the backend
  const savePaymentToDatabase = () => {
    const paymentData = {
      email: reservationDetails.email,
      billing_id: reservationId,
      date_of_payment: new Date().toISOString(),
      type_of_payment: 'PayPal',
      payment_confirmation: 'success',
    };
    fetch('https://vynceianoani.helioho.st/payment2.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.status === 'success') {
          navigate('/userpage'); // Redirect on success
        } else {
          setError('Failed to save payment information.');
        }
      })
      .catch((error) => {
        console.error('Error saving payment information:', error);
        setError('Failed to save payment information.');
      });
  };
  return (
    <div>
      <Header />
      <div className="finalize-reservation-container">
        <div className="reservation-summary-box">
          <h2>Finalize Your Reservation</h2>
          {error && <div className="error-message">{error}</div>}
          <div className="reservation-details">
            <p><strong>Email:</strong> {reservationDetails.email}</p>
            <p><strong>Branch:</strong> {reservationDetails.branch}</p>
            <p><strong>Date:</strong> {reservationDetails.date}</p>
            <p><strong>Time:</strong> {reservationDetails.time}</p>
            <p><strong>Price:</strong> {reservationDetails.price?.toFixed(2) || 'N/A'}</p>
            {reservationDetails.services?.map((service, index) => (
              <div key={index}>
                <p><strong>Service {index + 1}:</strong> {service}</p>
                <p><strong>Employee:</strong> {reservationDetails.employees?.[service]?.[0] || 'N/A'}</p>
              </div>
            ))}
          </div>
          {!disablePayPal && <div id="paypal-button-container"></div>}
          <button
            onClick={savePaymentToDatabase}
            disabled={pending || !isPaid || disablePayPal}
          >
            {pending ? 'Processing...' : isPaid ? 'Confirm Reservation' : 'Complete Payment First'}
          </button>
        </div>
      </div>
    </div>
  );
};
export default FinalizeReservationPage;
