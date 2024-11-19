import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import jsPDF from 'jspdf';
import '../styles/FinalReservation.css';

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
  const [queuePosition, setQueuePosition] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const details = location.state;
    if (details) {
      setReservationDetails(details);
    } else {
      navigate('/userpage');
    }

    loadPayPalScript(() => {
      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              amount: {
                value: reservationDetails.price ? reservationDetails.price.toFixed(2) : '0.00',
              },
            }],
          });
        },
        onApprove: (data, actions) => {
          return actions.order.capture().then(() => {
            setIsPaid(true);
            createReservation(reservationDetails);
          });
        },
        onError: () => {
          setError('Payment failed. Please try again.');
          setPending(false);
        }
      }).render('#paypal-button-container'); 
    });
  }, [location, navigate, reservationDetails.price]);

  const createReservation = (details) => {
    if (reservationId) return; 
  
    setPending(true);
  
    const reservationData = {
      ...details,
      status: 'pending',
    };
  
    fetch('https://vynceianoani.helioho.st/billing.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success' && data.billing_id) {
          setReservationId(data.billing_id);
          getQueuePosition(details.services); 
          setPending(false);
        } else {
          setPending(false);
          setError(data.message || 'Failed to create reservation.');
        }
      })
      .catch(() => {
        setPending(false);
        setError('Failed to create reservation.');
      });
  };

  const getQueuePosition = (services) => {
    const queueRequests = services.map(service =>
      fetch('https://vynceianoani.helioho.st/queue.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ serviceName: service }),
      })
        .then(response => response.json())
        .then(data => ({ service, position: data.queue_position || 'N/A' }))
    );

    Promise.all(queueRequests)
      .then(positions => {
        setQueuePosition(positions); 
      })
      .catch(() => {
        setError('Failed to fetch queue position.');
      });
  };

  const savePaymentToDatabase = () => {
    const paymentData = {
      email: reservationDetails.email,
      billing_id: reservationId,
      date_of_payment: new Date().toISOString(),
      type_of_payment: 'PayPal',
      payment_confirmation: 'success'
    };

    fetch('https://vynceianoani.helioho.st/payment2.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(paymentData),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setShowModal(true); 
        } else {
          setError('Failed to save payment information.');
          setPending(false);
        }
      })
      .catch(() => {
        setError('Failed to save payment information.');
        setPending(false);
      });
  };

  const closeModal = () => {
    setShowModal(false);
    navigate('/userpage'); 
  };

  const downloadReceipt = () => {
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text("Reservation Receipt", 10, 10);
    doc.text(`Reservation ID: ${reservationId}`, 10, 20);
    doc.text(`Email: ${reservationDetails.email}`, 10, 30);
    doc.text(`Branch: ${reservationDetails.branch}`, 10, 40);
    doc.text(`Date: ${reservationDetails.date}`, 10, 50);
    doc.text(`Time: ${reservationDetails.time}`, 10, 60);
    doc.text(`Price: ${reservationDetails.price ? reservationDetails.price.toFixed(2) : 'N/A'}`, 10, 70);

    doc.text("Services:", 10, 80);
    reservationDetails.services.forEach((service, index) => {
      const employee = reservationDetails.employees && reservationDetails.employees[service] 
                       ? reservationDetails.employees[service][0] : 'N/A';
      doc.text(`${index + 1}. ${service} - Employee: ${employee}`, 10, 90 + index * 10);
    });

    doc.text("Queue Positions:", 10, 100 + reservationDetails.services.length * 10);
    queuePosition.forEach((q, index) => {
      doc.text(`${q.service}: Position ${q.position}`, 10, 110 + reservationDetails.services.length * 10 + index * 10);
    });

    doc.save("ReservationReceipt.pdf");
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
            <p><strong>Price:</strong> {reservationDetails.price ? reservationDetails.price.toFixed(2) : 'N/A'}</p>

            {reservationDetails.services && reservationDetails.services.map((service, index) => (
              <div key={index}>
                <p><strong>Service {index + 1}:</strong> {service}</p>
                <p>
                  <strong>Employee:</strong> 
                  {reservationDetails.employees && reservationDetails.employees[service] 
                    ? reservationDetails.employees[service][0]
                    : 'N/A'}
                </p>
              </div>
            ))}
          </div>

          <div id="paypal-button-container"></div>

          <div className="sample-button">
            <button onClick={savePaymentToDatabase} disabled={pending || !isPaid}>
              {pending ? 'Processing...' : isPaid ? 'Confirm Reservation' : 'Complete Payment First'}
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Reservation Confirmed!</h3>
            <p>Your reservation was successful. Please download your receipt below.</p>
            <ul>
              {queuePosition.map((qp, index) => (
                <li key={index}>{qp.service}: Queue Position {qp.position}</li>
              ))}
            </ul>
            <button onClick={downloadReceipt}>Download Receipt (PDF)</button>
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinalizeReservationPage;
