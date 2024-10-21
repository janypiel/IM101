import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from './Header';
import '../styles/UserPage.css';

const UserReservationPage = () => {
  const [services, setServices] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedServiceTypes, setSelectedServiceTypes] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [availableTimes, setAvailableTimes] = useState([]);
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [email, setEmail] = useState(null);
  const [servicePrices, setServicePrices] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Fetch services and branches from the backend
    const fetchServices = async () => {
      try {
        const servicesResponse = await fetch('https://vynceianoani.helioho.st/services.php');
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    const fetchBranches = async () => {
      try {
        const branchesResponse = await fetch('https://vynceianoani.helioho.st/branches.php');
        const branchesData = await branchesResponse.json();
        setBranches(branchesData.branches);
      } catch (error) {
        console.error('Error fetching branches:', error);
      }
    };

    fetchServices();
    fetchBranches();

    // Retrieve email from local storage
    const userEmail = localStorage.getItem('userEmail');
    if (userEmail) {
      setEmail(userEmail);
    } else {
      navigate('/login');
    }

    // Extract service type, name, and price from URL query parameters
    const queryParams = new URLSearchParams(location.search);
    const serviceType = queryParams.get('serviceType');
    const serviceName = queryParams.get('serviceName');
    const price = queryParams.get('price');

    if (serviceType && serviceName && price) {
      setSelectedServiceTypes([serviceType]);
      setSelectedServices([serviceName]);
      setServicePrices([price]);
    }
  }, [navigate, location]);

  // Store email in local storage whenever it is updated
  useEffect(() => {
    if (email) {
      localStorage.setItem('userEmail', email);
    }
  }, [email]);

  // Filter services by selected service types
  useEffect(() => {
    const filtered = services.filter(service => selectedServiceTypes.includes(service.type));
    setFilteredServices(filtered);
  }, [selectedServiceTypes, services]);

  // Generate available times based on selected services
  useEffect(() => {
    const times = [];
    const startHour = 9; // 9 AM
    const endHour = 19; // 7 PM
    const totalHours = selectedServices.length;

    for (let hour = startHour; hour + totalHours <= endHour; hour++) {
      times.push(`${hour}:00-${hour + totalHours}:00`);
    }

    setAvailableTimes(times);
  }, [selectedServices]);

  const handleServiceTypeChange = (event) => {
    const serviceType = event.target.value;
    setSelectedServiceTypes(prev => {
      if (prev.includes(serviceType)) {
        return prev.filter(type => type !== serviceType);
      } else {
        return [...prev, serviceType];
      }
    });
    setSelectedServices([]); // Reset service selection when service type changes
    setServicePrices([]); // Clear prices when service types change
  };

  const handleServiceChange = (event) => {
    const serviceName = event.target.value;
    const isChecked = event.target.checked;

    if (isChecked) {
      if (selectedServices.length < 5) { // Allow a maximum of 5 services
        setSelectedServices(prev => [...prev, serviceName]);
        const selectedService = filteredServices.find(service => service.name === serviceName);
        if (selectedService) {
          setServicePrices(prev => [...prev, selectedService.price]);
        }
      } else {
        setError('You can select a maximum of 5 services.');
      }
    } else {
      setSelectedServices(prev => prev.filter(service => service !== serviceName));
      const selectedService = filteredServices.find(service => service.name === serviceName);
      if (selectedService) {
        setServicePrices(prev => prev.filter(price => price !== selectedService.price));
      }
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (selectedServices.length === 0 || !date || !time || !selectedBranch) {
      setError('Please fill out all fields.');
      return;
    }

    const totalPrice = servicePrices.reduce((sum, price) => sum + parseFloat(price), 0);

    // Save reservation details in local storage
    localStorage.setItem('reservationDetails', JSON.stringify({
      services: selectedServices,
      branch: selectedBranch,
      date,
      time,
      price: totalPrice,
      email
    }));

    navigate('/employee-selection');
  };

  return (
    <div className="user-reservation-container">
      <Header />
      <div className="reservation-box">
        <h2>Reserve a Service</h2>
        {error && <div className="error-message">{error}</div>}
        {pending && <div className="pending-message">Reservation in progress...</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Service Type</label>
            <div className="service-type-checkbox-group">
              {['Nails', 'Lash and Brow', 'Waxing', 'Hair and Make-up'].map((type) => (
                <div key={type} className="checkbox-wrapper">
                  <input
                    type="checkbox"
                    id={type}
                    value={type}
                    onChange={handleServiceTypeChange}
                  />
                  <label htmlFor={type}>{type}</label>
                </div>
              ))}
            </div>
          </div>

          {/* Grouping services by type */}
          {selectedServiceTypes.map((type) => (
            <div key={type} className="form-group">
              <label>{type} Services</label>
              <div className="service-checkbox-group">
                {filteredServices
                  .filter(service => service.type === type)
                  .map((service) => (
                    <div key={service.id} className="checkbox-wrapper">
                      <input
                        type="checkbox"
                        id={service.name}
                        value={service.name}
                        onChange={handleServiceChange}
                        disabled={selectedServices.length >= 5 && !selectedServices.includes(service.name)}
                      />
                      <label htmlFor={service.name}>
                        {service.name} - ₱{service.price}
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          ))}

          <div className="form-group">
            <label htmlFor="branch">Branch</label>
            <select
              id="branch"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              disabled={pending}
            >
              <option value="">Select a branch</option>
              {branches.map(branch => (
                <option key={branch.id} value={branch.id}>
                  {branch.name} - {branch.address}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              disabled={pending}
            />
          </div>
          <div className="form-group">
            <label htmlFor="time">Time</label>
            <select
              id="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              disabled={pending}
            >
              <option value="">Select a time</option>
              {availableTimes.map(timeSlot => (
                <option key={timeSlot} value={timeSlot}>
                  {timeSlot}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="reserve-button" disabled={pending}>
            {pending ? 'Proceeding...' : 'Proceed'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default UserReservationPage;
