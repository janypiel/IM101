import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Reservations.css';
import Header from './Header';

const UserReservationsPage = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [email, setEmail] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve email from local storage
    const userEmail = localStorage.getItem('userEmail');
    if (!userEmail) {
      navigate('/login'); // Redirect to login if email is not found
      return;
    }
    setEmail(userEmail);

    // Fetch reservations from the backend
    fetch('https://vynceianoani.helioho.st/reservations.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: userEmail }),
    })
      .then(response => response.json())
      .then(data => {
        setReservations(data.reservations);
        setFilteredReservations(data.reservations);
      })
      .catch(error => {
        console.error('Error fetching reservations:', error);
        setError('An error occurred while fetching reservations.');
      });
  }, [navigate]);

  // Handle date filter
  const handleDateChange = (event) => {
    const selected = event.target.value;
    setSelectedDate(selected);

    // Filter reservations by selected date
    if (selected) {
      const filtered = reservations.filter(reservation => reservation.date === selected);
      setFilteredReservations(filtered);
    } else {
      setFilteredReservations(reservations); // Reset if no date is selected
    }
  };

  return (
    <div>
               <div className="sticky-header">
        <Header />
      </div>
    <div className="user-reservations-container">
      <div className="reservations-box">
        <h2>Your Reservations</h2>
        {error && <div className="error-message">{error}</div>}

        {/* Date filter */}
        <div className="date-filter">
          <label htmlFor="reservation-date">Filter by Date: </label>
          <input 
            type="date" 
            id="reservation-date" 
            value={selectedDate} 
            onChange={handleDateChange}
          />
        </div>

        {filteredReservations.length === 0 ? (
          <p>No reservations found.</p>
        ) : (
          <div className="reservations-grid">
            {filteredReservations.map((reservation, index) => (
              <div key={index} className="reservation-card">
                <h3>Reservation #{index + 1}</h3>
                <p><strong>Branch:</strong> {reservation.branch_name} ({reservation.branch_address})</p>
                <p><strong>Date:</strong> {reservation.date}</p>
                <p><strong>Time:</strong> {reservation.time}</p>
                <p><strong>Status:</strong> {reservation.status}</p>
                <p><strong>Total Price:</strong> {reservation.price ? reservation.price.toFixed(2) : 'N/A'}</p>

                {/* Display services and their respective employees */}
                {reservation.services && reservation.services.map((service, serviceIndex) => (
                  <div key={serviceIndex} className="service-details">
                    <p><strong>Service:</strong> {service.name}</p>
                    <p><strong>Employee:</strong> {service.employees.map(emp => emp.name).join(', ')}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default UserReservationsPage;
