// AdminTodayReservations.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../pages/AdminHeader';
import '../styles/AdminPage.css';

const AdminTodayReservations = () => {
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const adminEmail = localStorage.getItem('userEmail');
    if (!adminEmail || !adminEmail.includes('@chicstation')) {
      navigate('/'); // Redirect to login if not an admin
      return;
    }

    // Fetch profile data for the logged-in admin/employee
    fetch('https://vynceianoani.helioho.st/getprofileadmin.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: adminEmail }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setUserData(data.data); // Set user data
        } else {
          setError('Failed to load user data.');
        }
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data.');
      });
    // Get today's date in the format YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 10);

    // Fetch reservations for the logged-in admin/employee for today's date
    fetch('https://vynceianoani.helioho.st/getTodayReservations.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ adminEmail, date: today }), // Pass the admin's email and today's date
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setReservations(data.reservations); // Set today's reservations
        } else {
          setError('Failed to load today’s reservations.');
        }
      })
      .catch(error => {
        console.error('Error fetching reservations:', error);
        setError('Failed to load today’s reservations.');
      });
  }, [navigate]); 

  const updateStatusToCompleted = async (reservationId) => {
    try {
      const response = await fetch('https://vynceianoani.helioho.st/completeReservation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: reservationId,employee_id: userData.id, status: 'completed' }), // Update to 'completed'
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess('Reservation marked as completed!');
        setError('');
        // Refresh reservations list
        setReservations(prevReservations =>
          prevReservations.map(reservation =>
            reservation.id === reservationId
              ? { ...reservation, status: 'completed' }
              : reservation
          )
        );
      } else {
        setError(result.message || 'Failed to update reservation status.');
        setSuccess('');
      }
    } catch (error) {
      setError('An error occurred while updating the reservation status.');
      setSuccess('');
    }
  };

  return (
    <div>
      <Header />
      <div className="admin-reservation-container">
        <div className="admin-box">
          <h2>Today's Reservations</h2>
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          
          {reservations.length === 0 ? (
            <p>No reservations or appointments for today.</p>
          ) : (
            <table className="reservation-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map(reservation => (
                  <tr key={reservation.id}>
                    <td>{reservation.user_email}</td>
                    <td>{reservation.service_name}</td>
                    <td>{reservation.date}</td> {/* Display reservation date */}
                    <td>{reservation.time}</td>
                    <td>₱{reservation.price}</td>
                    <td>{reservation.status}</td>
                    <td>
                      {reservation.status !== 'completed' ? (
                        <button onClick={() => updateStatusToCompleted(reservation.id)}>
                          Mark as Completed
                        </button>
                      ) : (
                        <span>Completed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTodayReservations;
