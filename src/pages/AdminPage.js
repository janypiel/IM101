import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './AdminHeader';
import '../styles/AdminPage.css';
import defaultProfileImg from '../images/default-profile.jpg'

const AdminReservationPage = () => {
  const [reservations, setReservations] = useState([]);
  const [filteredReservations, setFilteredReservations] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userData, setUserData] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [filter, setFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    const adminEmail = localStorage.getItem('userEmail');
    if (!adminEmail || !adminEmail.includes('@chicstation')) {
      navigate('/login'); // Redirect to login if not an admin
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
          setImageUrl(data.data.profileImageUrl || defaultProfileImg); // Set profile image or default
        } else {
          setError('Failed to load user data.');
        }
      })
      .catch(error => {
        console.error('Error fetching user data:', error);
        setError('Failed to load user data.');
      });

    // Fetch reservations for the logged-in admin/employee
    fetch('https://vynceianoani.helioho.st/getReservationsAdmin.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: adminEmail }),
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'success') {
          setReservations(data.reservations); // Set the reservations
          setFilteredReservations(data.reservations); // Set initial filtered reservations
        } else {
          setError('Failed to load reservations.');
        }
      })
      .catch(error => {
        console.error('Error fetching reservations:', error);
        setError('Failed to load reservations.');
      });
  }, [navigate]);

  // Filter reservations based on the selected filter status
  useEffect(() => {
    if (filter === 'All') {
      setFilteredReservations(reservations);
    } else {
      setFilteredReservations(
        reservations.filter(reservation => 
          reservation.services.some(service => service.status.toLowerCase() === filter.toLowerCase())
        )
      );
    }
  }, [filter, reservations]);

  const updateStatus = async (reservationId, serviceId, newStatus) => {
    try {
      const response = await fetch('https://vynceianoani.helioho.st/updateReservations.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: reservationId, status: newStatus, employee_id: userData.id }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        setSuccess('Reservation status updated successfully!');
        setError('');
        // Refresh reservations
        setReservations(prevReservations =>
          prevReservations.map(reservation =>
            reservation.reservation_id === reservationId
              ? {
                  ...reservation,
                  services: reservation.services.map(service =>
                    service.service_id === serviceId
                      ? { ...service, status: newStatus }
                      : service
                  )
                }
              : reservation
          )
        );
      } else {
        setError(result.message);
        setSuccess('');
      }
    } catch (error) {
      setError('An error occurred while updating the reservation status.');
      setSuccess('');
    }
  };

  // Function to filter services based on the current logged-in employee's ID
  const filterServicesForEmployee = (services) => {
    if (!userData) return services; // If no user data, return all services
    const employeeId = userData.id; // Assuming userData has an ID for the logged-in employee
    return services.filter(service => service.employee_id === employeeId); // Filter by employee ID
  };

  return (
    <div>
      <Header />

      {userData && (
        <div className="upper-left-profile">
          <div className="upper-left-profile-img-container">
            <img
              src={imageUrl}
              alt="Profile"
              className="upper-left-profile-img"
            />
          </div>
          <div className="upper-left-profile-info">
            <span className="upper-left-profile-name">{userData.fullName}</span>
            <span className="upper-left-profile-branch">{userData.branchName}: {userData.address}</span>
          </div>
        </div>
      )}

      <div className="admin-reservation-container">
        <div className="admin-box">
          <h2>Admin: Manage Reservations</h2>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Filter options */}
          <div className="filter-container">
            <label htmlFor="filter">Filter by Status: </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="All">All</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <table className="reservation-table">
            <thead>
              <tr>
                <th>User Email</th>
                <th>Service</th>
                <th>Date</th>
                <th>Time</th>
                <th>Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredReservations.map(reservation => (
                <tr key={reservation.reservation_id}>
                  <td>{reservation.user_email}</td>
                  <td>
                    {filterServicesForEmployee(reservation.services).map((service, index) => (
                      <div key={index}>
                        {service.name} - <span className={`status ${service.status.toLowerCase()}`}>{service.status}</span>
                      </div>
                    ))}
                  </td>
                  <td>{reservation.date}</td>
                  <td>{reservation.time}</td>
                  <td>₱{reservation.price}</td>
                  <td>
                    {filterServicesForEmployee(reservation.services).some(service => service.status !== 'approved' && service.status !== 'rejected' && service.status !== 'completed') ? (
                      <div>
                        {filterServicesForEmployee(reservation.services).map((service, index) => (
                          <div key={index}>
                            {service.status !== 'approved' && service.status !== 'rejected' && service.status !== 'completed' && (
                              <>
                                <button onClick={() => updateStatus(reservation.reservation_id, service.service_id, 'approved')}>
                                  Approve
                                </button>
                                <button onClick={() => updateStatus(reservation.reservation_id, service.service_id, 'rejected')}>
                                  Reject
                                </button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span>No actions available</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminReservationPage;