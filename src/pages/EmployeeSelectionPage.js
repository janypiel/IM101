import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import '../styles/EmployeeSelectionPage.css';

const EmployeeSelectionPage = () => {
  const [employees, setEmployees] = useState({});
  const [reservationDetails, setReservationDetails] = useState({});
  const [selectedEmployees, setSelectedEmployees] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pending, setPending] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const storedDetails = localStorage.getItem('reservationDetails');
    if (storedDetails) {
      setReservationDetails(JSON.parse(storedDetails));
    } else {
      navigate('/user-reservation');
    }
  }, [navigate]);

  useEffect(() => {
    if (reservationDetails.services && reservationDetails.branch) {
      fetch('https://vynceianoani.helioho.st/fetchEmployeesByService.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          services: reservationDetails.services,
          branch: reservationDetails.branch,
        }),
      })
        .then(response => response.json())
        .then(data => {
          if (data.status === 'success') {
            setEmployees(data.employees);
          } else {
            setError(data.message);
          }
        })
        .catch(error => {
          console.error('Error fetching employees:', error);
          setError('Failed to fetch employees.');
        });
    }
  }, [reservationDetails]);

  const handleSelectEmployee = (event, serviceName) => {
    const employeeId = event.target.value;
    const isChecked = event.target.checked;

    setSelectedEmployees((prevSelectedEmployees) => {
      const updatedEmployees = { ...prevSelectedEmployees };

      if (isChecked) {
        updatedEmployees[serviceName] = [employeeId];
      } else {
        updatedEmployees[serviceName] = updatedEmployees[serviceName].filter((id) => id !== employeeId);
      }

      return updatedEmployees;
    });
  };

  const handleSubmit = () => {
    const errors = reservationDetails.services.some(service => {
      return !selectedEmployees[service] || selectedEmployees[service].length === 0;
    });

    if (errors) {
      setError('Please select at least one employee for each service.');
      return;
    }

    // Proceed to payment options
    // You can show buttons directly here
  };

  const handlePayNow = () => {
    const updatedReservationDetails = {
      ...reservationDetails,
      employees: selectedEmployees,
    };

    localStorage.setItem('reservationDetails', JSON.stringify(updatedReservationDetails));
    navigate('/final-reservation', {
      state: updatedReservationDetails,
    });
  };

  const handlePayLater = async () => {
    setPending(true);
  
    // Prepare reservation data
    const data = {
      services: reservationDetails.services,
      date: reservationDetails.date,
      time: reservationDetails.time,
      email: reservationDetails.email,
      employees: selectedEmployees,
      price: reservationDetails.price,
      branch: reservationDetails.branch,
    };
  
    try {
      // Validate the reservation first
      const response = await fetch('https://vynceianoani.helioho.st/validate_reservation.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: data.date,
          time: data.time,
          employees: Object.values(data.employees).flat(),
        }),
      });
  
      const validationResult = await response.json();
  
      if (validationResult.status === 'error') {
        setPending(false);
        setError(validationResult.message || 'Duplicate reservation found.');
        return; // Stop further processing if a duplicate is found
      }
  
      // If validation passes, proceed to create the reservation
      const result = await fetch('https://vynceianoani.helioho.st/billing.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then((res) => res.json());
  
      setPending(false);
      if (result.status === 'success') {
        setSuccess('Reservation created successfully with Pay Later option!');
        navigate('/userpage', { state: { reservationId: result.reservation_id } });
      } else {
        setError(result.message || 'Failed to create reservation. Please try again.');
      }
    } catch (error) {
      setPending(false);
      setError('Failed to create reservation. Please try again later.');
      console.error('Error:', error);
    }
  };
  
  return (
    <div className="employee-selection-container">
      <Header />
      <div className="selection-box">
        <h2>Select Employees</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        {pending && <div className="pending-message">Loading...</div>}
        <div className="employee-list">
          {reservationDetails.services &&
            reservationDetails.services.map((service) => (
              <div key={service} className="service-group">
                <h3>Select employees for {service}</h3>
                {employees[service] && employees[service].length > 0 ? (
                  employees[service].map((employee) => (
                    <div key={employee.id} className="employee-item">
                      <input
                        type="checkbox"
                        id={`employee-${employee.id}-${service}`}
                        value={employee.id}
                        onChange={(e) => handleSelectEmployee(e, service)}
                        checked={selectedEmployees[service]?.includes(employee.id) || false}
                        disabled={selectedEmployees[service]?.length > 0 && !selectedEmployees[service]?.includes(employee.id)}
                      />
                      <label htmlFor={`employee-${employee.id}-${service}`} className="employee-label">
                        <img src={employee.profile_image_url} alt={employee.fullName} className="employee-image" />
                        <span>{employee.fullName}</span>
                      </label>
                    </div>
                  ))
                ) : (
                  <p>No employees available for {service}</p>
                )}
              </div>
            ))}
        </div>
        <button onClick={handleSubmit} disabled={pending}>
          {pending ? 'Processing...' : 'Submit'}
        </button>
        
        {/* Payment Options */}
        <div className="payment-options">
          <button onClick={handlePayNow} disabled={pending}>
            Pay Now
          </button>
          <button onClick={handlePayLater} disabled={pending}>
            Pay Later
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeSelectionPage;
