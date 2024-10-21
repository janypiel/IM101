import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import CreateAccountPage from './CreateAccountPage';
import '../styles/WelcomePage.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';


import image1 from '../images/chic1.jpg';
import image2 from '../images/chic2.jpg';
import image3 from '../images/chic3.jpg';
import image4 from '../images/chic4.jpg';
import image5 from '../images/chic5.jpg';
import branch1Image from '../images/LOC1.jpg';  
import branch2Image from '../images/LOC2.jpg';
import aboutUsBg from '../images/Chic Station.jpg'; // Correctly import the background image

const WelcomePage = () => {
  const [currentImage, setCurrentImage] = useState(0);
  const [currentBranch, setCurrentBranch] = useState(0); // New state for current branch
  const images = [image1, image2, image3, image4, image5];
  const branches = [
    {
      image: branch1Image,
      address: 'Chippens Dormitory, 368 Padre Gomez St., Poblacion District, Davao City',
    },
    {
      image: branch2Image,
      address: 'Rizal Extension, Corner De Jesus St, Davao City',
    },
  ];

  const [isClicked, setIsClicked] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [error, setError] = useState('');
  const [services, setServices] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prevIndex) => (prevIndex + 1) % images.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [images.length]);

  useEffect(() => {
    if (location.state && location.state.showLogin) {
      setShowLogin(true);
    }
  }, [location.state]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch('https://vynceianoani.helioho.st/getServices3.php');
        const data = await response.json();
        setServices(data);
      } catch (error) {
        console.error('Error fetching services:', error);
      }
    };

    fetchServices();
  }, []);

  const handleClick = () => {
    setIsClicked(true);
    setTimeout(() => {
      setShowLogin(true);
    }, 500);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    try {
      const response = await fetch('https://vynceianoani.helioho.st/login.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const result = await response.json();
      if (result.status === 'success') {
        localStorage.setItem('userEmail', email);
        navigate(result.isAdmin ? '/admin-today-reservations' : '/home');
      } else {
        setError(result.message);
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred. Please try again.');
    }
  };

  const handleBackToWelcome = () => {
    setShowLogin(false);
    setIsClicked(false);
  };

  const handleCreateAccountClick = () => {
    setShowCreateAccount(true);
    setTimeout(() => setIsModalVisible(true), 200);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setTimeout(() => setShowCreateAccount(false), 500);
  };

  // New functions to navigate branches
  const handlePrevBranch = () => {
    setCurrentBranch((prev) => (prev - 1 + branches.length) % branches.length);
  };

  const handleNextBranch = () => {
    setCurrentBranch((prev) => (prev + 1) % branches.length);
  };

  return (
    <div className="scrollable-container">
      <div className="container">
        <div className="slideshow">
          {images.map((img, index) => (
            <div
              key={index}
              className={`slide ${index === currentImage ? 'active' : ''}`}
              style={{ backgroundImage: `url(${img})` }}
            ></div>
          ))}
        </div>

        {!showLogin ? (
          <div className={`welcome-container ${isClicked ? 'fade-out' : ''}`}>
            <div className="welcome-message">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSlpxpNoZdeY_qOKahqCVqVtfTxlwNZN6x6w&s"
                alt="Chic Station Logo"
                className="logo"
              />
              <h1>Welcome to Chic Station</h1>
              <p>Book your appointment with ease and style.</p>
              <button className="book-now-button" onClick={handleClick}>
                Book Now
              </button>
            </div>
          </div>
        ) : (
          <div className="login-container fade-in">
            <div className="login-box">
              <img
                src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSlpxpNoZdeY_qOKahqCVqVtfTxlwNZN6x6w&s"
                alt="Chic Station Logo"
                className="logo"
              />
              <h2>Login to Chic Station</h2>
              {error && <div className="error-message">{error}</div>}
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="email">Email</label>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="password">Password</label>
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="login-button">
                  Login
                </button>
              </form>
              <div className="additional-links">
                <button onClick={handleCreateAccountClick} className="create-account-button2">
                  Create Account
                </button>
                <button onClick={handleBackToWelcome} className="back-button">
                  Back
                </button>
              </div>
            </div>
          </div>
        )}

        {showCreateAccount && (
          <div className={`modal ${isModalVisible ? 'show' : ''}`}>
            <div className="modal-content">
              <span className="close-button" onClick={handleCloseModal}>
                &times;
              </span>
              <CreateAccountPage onCloseModal={handleCloseModal} />
            </div>
            <div className="modal-overlay" onClick={handleCloseModal}></div>
          </div>
        )}
      </div>

      <div className="services-section1">
        <h2 className='h2-welcome'>Services Offered</h2>
        <div className="services-grid1">
          {Object.entries(services).map(([type, serviceList]) => (
            <div className="service-box1" key={type}>
              <h3>{type} Services</h3>
              <ul>
                {serviceList.map((service) => (
                  <li key={service.id}>{`${service.name} - ₱${service.price}`}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div 
        className="about-us-section" 
        style={{ backgroundImage: `url(${aboutUsBg})` }} // Set background image here
      >
        <div className="about-us-content">
          <h2>About Us</h2>
          <p>
            Welcome to Chic Station, where style meets convenience. Our team is dedicated to
            providing high-quality beauty services that cater to your personal needs. We aim to
            ensure every experience leaves you feeling refreshed and beautiful.
          </p>
        </div>
        <div className="branch-image">
  <div className="branch-navigation">
    <button
      onClick={handlePrevBranch}
      className="branch-button left"
      disabled={branches.length <= 1}
    >
      <FontAwesomeIcon icon={faChevronLeft} />
    </button>
    <h3>{`Branch ${currentBranch + 1}`}</h3>
    <button
      onClick={handleNextBranch}
      className="branch-button right"
      disabled={branches.length <= 1}
    >
      <FontAwesomeIcon icon={faChevronRight} />
    </button>
  </div>

  <div className="image-container">
    <img
      src={branches[currentBranch].image}
      alt={`Chic Station Branch ${currentBranch + 1}`}
    />
  </div>
  <p>{branches[currentBranch].address}</p>
</div>


      </div>
    </div>
  );
};

export default WelcomePage;
