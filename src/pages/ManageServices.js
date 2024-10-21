import React, { useState, useEffect } from 'react';
import '../styles/ManageServices.css';
import Header from './SuperAdminHeader';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Firebase imports
import { storage } from '../firebaseConfig'; // Import the initialized Firebase storage

const ManageServices = () => {
    const [services, setServices] = useState([]);
    const [newService, setNewService] = useState({ name: '', price: '', type: 'Nails', imageUrl: '' });
    const [editServiceId, setEditServiceId] = useState(null);
    const [selectedServiceType, setSelectedServiceType] = useState('All');
    const [imageFile, setImageFile] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false); // New state for form submission

    useEffect(() => {
        fetchServices();
    }, []);

    const fetchServices = async () => {
        try {
            const response = await fetch('https://vynceianoani.helioho.st/getServices2.php');
            const data = await response.json();

            if (Array.isArray(data)) {
                setServices(data);
            } else {
                console.error('Unexpected data format: ', data);
                setServices([]);
            }
        } catch (error) {
            console.error('Error fetching services:', error);
            setServices([]);
        }
    };

    const uploadImage = async () => {
        if (imageFile) {
            const imageRef = ref(storage, `services/${imageFile.name}`);
            await uploadBytes(imageRef, imageFile);
            const url = await getDownloadURL(imageRef);
            return url;
        }
        return null; // Return null if there's no image file
    };

    const handleAddService = async () => {
        // Validation: Check if any field is empty
        if (!newService.name || !newService.price || !newService.type || !imageFile) {
            alert('All fields must be filled out.');
            return; // Prevent adding the service if validation fails
        }

        setIsSubmitting(true); // Disable the button

        try {
            const imageUrl = await uploadImage(); // Upload image and get URL
            if (!imageUrl) {
                alert('Failed to upload image.'); // Handle upload failure
                return;
            }

            // Prepare data to be sent
            const serviceData = { ...newService, imageUrl }; // Combine service details with image URL

            const response = await fetch('https://vynceianoani.helioho.st/addService.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(serviceData), // Send imageUrl with other details
            });

            const data = await response.json();
            console.log(data); // Log the data returned from the API for debugging

            if (data.success) {
                fetchServices(); // Fetch updated services
                setNewService({ name: '', price: '', type: 'Nails', imageUrl: '' }); // Reset the form
                setImageFile(null); // Reset image file after upload
            } else {
                alert('Failed to add service.'); // Handle addition failure
            }
        } catch (error) {
            console.error('Error adding service:', error);
        } finally {
            setIsSubmitting(false); // Re-enable the button
        }
    };

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleEditService = async (serviceId) => {
        try {
            const imageUrl = await uploadImage();
            const response = await fetch('https://vynceianoani.helioho.st/editService.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: serviceId, ...newService, imageUrl }),
            });
            const data = await response.json();
            if (data.success) {
                fetchServices();
                setEditServiceId(null);
            }
        } catch (error) {
            console.error('Error editing service:', error);
        }
    };

    const toggleServiceStatus = async (serviceId, currentStatus) => {
        try {
            const newStatus = currentStatus === 'available' ? 'not available' : 'available';
            const response = await fetch('https://vynceianoani.helioho.st/toggleServiceStatus.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ id: serviceId, status: newStatus }),
            });
            const data = await response.json();
            if (data.success) {
                fetchServices();
            }
        } catch (error) {
            console.error('Error toggling service status:', error);
        }
    };

    const filteredServices = services.filter(service =>
        selectedServiceType === 'All' || service.type === selectedServiceType
    );

    return (
        <div className='background'>
            <Header />
            <div className="manage-services-container">
                <h2 className='h2-manage'>Manage Services</h2>

                <div className="form-container">
                    <input
                        type="text"
                        value={newService.name}
                        onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                        placeholder="Service Name"
                        className="input-field"
                    />
                    <input
                        type="number"
                        value={newService.price}
                        onChange={(e) => setNewService({ ...newService, price: e.target.value })}
                        placeholder="Service Price"
                        className="input-field"
                    />
                    <select
                        value={newService.type}
                        onChange={(e) => setNewService({ ...newService, type: e.target.value })}
                        className="input-field"
                    >
                        <option value="Nails">Nails Services</option>
                        <option value="Lash and Brow">Lash and Brow Services</option>
                        <option value="Waxing">Waxing Services</option>
                        <option value="Hair and Make-up">Hair and Make-up</option>
                    </select>
                    <input type="file" onChange={handleImageChange} className="input-field" />
                    <button
                        className="add-button"
                        onClick={editServiceId ? () => handleEditService(editServiceId) : handleAddService}
                        disabled={isSubmitting} // Disable while submitting
                    >
                        {editServiceId ? 'Edit Service' : 'Add Service'}
                    </button>
                </div>

                <div className="filter-container">
                    <label htmlFor="serviceTypeFilter">Filter by Service Type:  </label>
                    <select
                        id="serviceTypeFilter"
                        value={selectedServiceType}
                        onChange={(e) => setSelectedServiceType(e.target.value)}
                        className="input-field"
                    >
                        <option value="All">All Services</option>
                        <option value="Nails">Nails Services</option>
                        <option value="Lash and Brow">Lash and Brow Services</option>
                        <option value="Waxing">Waxing Services</option>
                        <option value="Hair and Make-up">Hair and Make-up</option>
                    </select>
                </div>

                <ul className="services-list">
                    {filteredServices.length > 0 ? (
                        filteredServices.map((service) => (
                            <li key={service.id} className="service-item">
                                <span className="service-details">
                                    {service.name} - ₱{service.price} ({service.type})
                                </span>
                                {service.imageUrl && <img src={service.imageUrl} alt={service.name} className="service-image" />}
                                <span className={`status ${service.status}`}>Status: {service.status}</span>
                                <button
                                    className="toggle-status-btn"
                                    onClick={() => toggleServiceStatus(service.id, service.status)}
                                >
                                    Toggle Status
                                </button>
                                <button className="edit-btn" onClick={() => setEditServiceId(service.id)}>
                                    Edit
                                </button>
                            </li>
                        ))
                    ) : (
                        <li>No services available.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

export default ManageServices;
