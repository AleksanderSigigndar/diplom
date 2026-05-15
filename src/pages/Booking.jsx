import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getTourById } from '../data/toursData';
import { 
  validateFullName, validateAge, validatePassport, 
  validateBirthCertificate, validatePhone
} from '../utils/validation';
import './Booking.css';

const Booking = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tour, setTour] = useState(null);
  const [userData, setUserData] = useState({});
  const [mainPhone, setMainPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [passengers, setPassengers] = useState([{ 
    name: '', age: '', passportNumber: '', relationship: 'self'
  }]);
  const [flight, setFlight] = useState('business');
  const [hotel, setHotel] = useState('5star');
  const [specialRequests, setSpecialRequests] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  const [isFlightOpen, setIsFlightOpen] = useState(false);
  const [isHotelOpen, setIsHotelOpen] = useState(false);
  const [openRelationshipIndex, setOpenRelationshipIndex] = useState(null);
  
  const flightRef = useRef(null);
  const hotelRef = useRef(null);
  const relationshipRefs = useRef({});

  const calculateTotalPrice = () => {
    if (!tour) return 0;
    
    let total = tour.price; 
    
    for (let i = 1; i < passengers.length; i++) {
      const passenger = passengers[i];
      const age = parseInt(passenger.age);
      
      if (!age || isNaN(age)) {
        total += tour.price;
      } else if (age < 14) {
        total += tour.price / 2;
      } else {
        total += tour.price;
      }
    }
    
    return Math.round(total);
  };

  useEffect(() => {
    const tourData = getTourById(id);
    setTour(tourData);
    
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setMainPhone(data.phone || '');
            setPassengers([{
              name: data.fullName || '',
              age: '',
              passportNumber: data.passportNumber || '',
              relationship: 'self'
            }]);
          }
        } else {
          navigate('/auth');
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    };
    fetchUserData();
  }, [id, navigate]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (flightRef.current && !flightRef.current.contains(event.target)) {
        setIsFlightOpen(false);
      }
      if (hotelRef.current && !hotelRef.current.contains(event.target)) {
        setIsHotelOpen(false);
      }
      if (openRelationshipIndex !== null) {
        const ref = relationshipRefs.current[openRelationshipIndex];
        if (ref && !ref.contains(event.target)) {
          setOpenRelationshipIndex(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openRelationshipIndex]);

  const updatePassenger = (index, field, value) => {
    const updated = [...passengers];
    updated[index][field] = value;
    setPassengers(updated);
  };

  const validateField = (field, value, index = null, passenger = null) => {
    if (field === 'name') return validateFullName(value);
    if (field === 'age') return validateAge(value);
    if (field === 'passportNumber') {
      if (passenger && passenger.age < 14) return validateBirthCertificate(value);
      return validatePassport(value);
    }
    return '';
  };

  const handlePassengerChange = (index, field, value) => {
    const updated = [...passengers];
    const passenger = updated[index];
    passenger[field] = value;
    setPassengers(updated);
    
    const error = validateField(field, value, index, passenger);
    setErrors(prev => ({ ...prev, [`passenger_${index}_${field}`]: error }));
    setTouched(prev => ({ ...prev, [`passenger_${index}_${field}`]: true }));
  };

  const handleBlur = (index, field) => {
    setTouched(prev => ({ ...prev, [`passenger_${index}_${field}`]: true }));
    const passenger = passengers[index];
    const error = validateField(field, passenger[field], index, passenger);
    setErrors(prev => ({ ...prev, [`passenger_${index}_${field}`]: error }));
  };

  const handlePhoneChange = (value) => {
    setMainPhone(value);
    setPhoneTouched(true);
    const error = validatePhone(value);
    setPhoneError(error);
  };

  const addPassenger = () => {
    setPassengers([...passengers, {
      name: '',
      age: '',
      passportNumber: '',
      relationship: 'friend'
    }]);
  };

  const removePassenger = (index) => {
    if (index !== 0) {
      setPassengers(passengers.filter((_, i) => i !== index));
      if (openRelationshipIndex === index) {
        setOpenRelationshipIndex(null);
      }
    }
  };

  const toggleRelationship = (index) => {
    setOpenRelationshipIndex(openRelationshipIndex === index ? null : index);
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {};
    
    const phoneValidationError = validatePhone(mainPhone);
    if (phoneValidationError) {
      setPhoneError(phoneValidationError);
      isValid = false;
    }
    
    for (let i = 0; i < passengers.length; i++) {
      const p = passengers[i];
      
      const nameError = validateFullName(p.name);
      if (nameError) {
        newErrors[`passenger_${i}_name`] = nameError;
        isValid = false;
      }
      
      const ageError = validateAge(p.age);
      if (ageError) {
        newErrors[`passenger_${i}_age`] = ageError;
        isValid = false;
      }
      
      if (p.age < 14) {
        const certError = validateBirthCertificate(p.passportNumber);
        if (certError) {
          newErrors[`passenger_${i}_passportNumber`] = certError;
          isValid = false;
        }
      } else if (p.age >= 14) {
        const passportError = validatePassport(p.passportNumber);
        if (passportError) {
          newErrors[`passenger_${i}_passportNumber`] = passportError;
          isValid = false;
        }
      }
    }
    
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      setMessage('Пожалуйста, исправьте ошибки в форме');
      setTimeout(() => setMessage(''), 5000);
      return;
    }
    
    setLoading(true);
    
    try {
      const user = auth.currentUser;
      if (!user) {
        setMessage('Пожалуйста, войдите в аккаунт');
        navigate('/auth');
        return;
      }
      
      const totalPrice = calculateTotalPrice();
      
      const bookingData = {
        tourId: parseInt(id),
        tourName: tour?.name,
        tourCountry: tour?.country,
        tourCity: tour?.city,
        tourPrice: tour?.price,
        totalPrice: totalPrice,
        flight,
        hotel,
        specialRequests: specialRequests || 'Нет',
        mainPhone: mainPhone,
        passengers: passengers.map(p => ({
          name: p.name,
          age: parseInt(p.age) || 0,
          passportNumber: p.passportNumber,
          relationship: p.relationship,
          price: (parseInt(p.age) < 14 && parseInt(p.age) > 0) ? tour?.price / 2 : tour?.price
        })),
        userId: user.uid,
        userEmail: user.email,
        userName: userData.fullName || user.displayName || user.email,
        userPhone: userData.phone || '',
        createdAt: serverTimestamp(),
        status: 'pending'
      };
      
      await addDoc(collection(db, 'bookings'), bookingData);
      setMessage('Ваша заявка отправлена! Мы свяжемся с вами в течение 48 часов');
      setTimeout(() => {
        setMessage('');
        navigate('/tours');
      }, 5000);
    } catch (err) {
      console.error("Booking error:", err);
      setMessage('Ошибка при отправке. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  const flightOptions = [
    { value: 'business', label: 'Бизнес-класс' },
    { value: 'first', label: 'Первый класс' },
    { value: 'private', label: 'Частный самолёт (по запросу)' },
  ];

  const hotelOptions = [
    { value: '4star', label: '4 звезды Люкс' },
    { value: '5star', label: '5 звёзд Премиум' },
    { value: 'palace', label: 'Дворец / Ультра-люкс' },
  ];

  const relationshipOptions = [
    { value: 'self', label: 'Я' },
    { value: 'spouse', label: 'Супруг(а)' },
    { value: 'child', label: 'Ребёнок' },
    { value: 'parent', label: 'Родитель' },
    { value: 'friend', label: 'Друг/Подруга' },
  ];

  const getFlightLabel = () => {
    const option = flightOptions.find(opt => opt.value === flight);
    return option ? option.label : 'Выберите класс';
  };

  const getHotelLabel = () => {
    const option = hotelOptions.find(opt => opt.value === hotel);
    return option ? option.label : 'Выберите отель';
  };

  const getRelationshipLabel = (value) => {
    const option = relationshipOptions.find(opt => opt.value === value);
    return option ? option.label : 'Кем приходится';
  };

  if (!tour) return <div className="loading">Загрузка...</div>;

  const totalPrice = calculateTotalPrice();
  const basePrice = tour.price;
  const passengersCount = passengers.length;
  const childrenCount = passengers.filter(p => parseInt(p.age) < 14 && p.age && !isNaN(parseInt(p.age))).length;

  return (
    <div className="booking-container">
      <div className="booking-bg"></div>
      <div className="booking-card">
        <h2>Бронирование тура</h2>
        <p className="booking-tour">{tour.name} - {tour.city}, {tour.country}</p>

        {/* Блок с предварительной стоимостью */}
        <div className="price-calculator">
          <h3>Предварительная стоимость</h3>
          <div className="price-details">
            <div className="price-row">
              <span>Стоимость тура (1 взрослый):</span>
              <span>{Math.round(basePrice).toLocaleString('ru-RU')} ₽</span>
            </div>
            {passengersCount > 1 && (
              <div className="price-row">
                <span>Дополнительные пассажиры:</span>
                <span>{Math.round(totalPrice - basePrice).toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            {childrenCount > 0 && (
              <div className="price-row discount">
                <span>Скидка за детей до 14 лет ({childrenCount}):</span>
                <span>- {Math.round((basePrice / 2 * childrenCount)).toLocaleString('ru-RU')} ₽</span>
              </div>
            )}
            <div className="price-row total">
              <span>Итого:</span>
              <span>{totalPrice.toLocaleString('ru-RU')} ₽</span>
            </div>
          </div>
        </div>

        {message && <div className={`message ${message.includes('✓') ? 'success' : 'error'}`}>{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="booking-section">
            <h3>Контактный телефон</h3>
            <div className="form-group">
              <label>Номер телефона (главного пассажира) *</label>
              <input 
                type="tel" 
                value={mainPhone} 
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => { setPhoneTouched(true); handlePhoneChange(mainPhone); }}
                placeholder="+7 123 456-78-90"
              />
              {phoneTouched && phoneError && <span className="error-text">{phoneError}</span>}
            </div>
          </div>

          <div className="booking-section">
            <h3>Пожелания по перелёту и проживанию</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Класс перелёта</label>
                <div className="custom-select-wrapper" ref={flightRef}>
                  <button 
                    type="button"
                    className={`select-btn ${isFlightOpen ? 'open' : ''}`}
                    onClick={() => setIsFlightOpen(!isFlightOpen)}
                  >
                    <span className="select-btn-text">{getFlightLabel()}</span>
                    <span className={`select-arrow ${isFlightOpen ? 'rotate' : ''}`}>▼</span>
                  </button>
                  {isFlightOpen && (
                    <div className="select-dropdown">
                      {flightOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`select-option ${flight === option.value ? 'active' : ''}`}
                          onClick={() => {
                            setFlight(option.value);
                            setIsFlightOpen(false);
                          }}
                        >
                          {option.label}
                          {flight === option.value && <span className="option-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label>Категория отеля</label>
                <div className="custom-select-wrapper" ref={hotelRef}>
                  <button 
                    type="button"
                    className={`select-btn ${isHotelOpen ? 'open' : ''}`}
                    onClick={() => setIsHotelOpen(!isHotelOpen)}
                  >
                    <span className="select-btn-text">{getHotelLabel()}</span>
                    <span className={`select-arrow ${isHotelOpen ? 'rotate' : ''}`}>▼</span>
                  </button>
                  {isHotelOpen && (
                    <div className="select-dropdown">
                      {hotelOptions.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          className={`select-option ${hotel === option.value ? 'active' : ''}`}
                          onClick={() => {
                            setHotel(option.value);
                            setIsHotelOpen(false);
                          }}
                        >
                          {option.label}
                          {hotel === option.value && <span className="option-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="booking-section">
            <h3>Данные пассажиров</h3>
            {passengers.map((passenger, idx) => (
              <div key={idx} className="passenger-card">
                <div className="passenger-header">
                  <span>Пассажир {idx + 1} {idx === 0 && '(главный)'}</span>
                  {idx > 0 && (
                    <button type="button" onClick={() => removePassenger(idx)} className="remove-btn">Удалить</button>
                  )}
                </div>
                
                <div className="form-group">
                  <label>ФИО *</label>
                  <input 
                    type="text" 
                    value={passenger.name} 
                    onChange={(e) => handlePassengerChange(idx, 'name', e.target.value)}
                    onBlur={() => handleBlur(idx, 'name')}
                    placeholder="Иванов Иван Иванович"
                  />
                  {touched[`passenger_${idx}_name`] && errors[`passenger_${idx}_name`] && (
                    <span className="error-text">{errors[`passenger_${idx}_name`]}</span>
                  )}
                </div>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>Возраст *</label>
                    <input 
                      type="number" 
                      value={passenger.age} 
                      onChange={(e) => handlePassengerChange(idx, 'age', e.target.value)}
                      onBlur={() => handleBlur(idx, 'age')}
                      min="0" 
                      max="120"
                      placeholder="25"
                    />
                    {touched[`passenger_${idx}_age`] && errors[`passenger_${idx}_age`] && (
                      <span className="error-text">{errors[`passenger_${idx}_age`]}</span>
                    )}
                    {passenger.age < 14 && passenger.age && (
                      <span className="info-text">Детский тариф (50% от стоимости)</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Кем приходится</label>
                    <div className="custom-select-wrapper" ref={el => relationshipRefs.current[idx] = el}>
                      <button 
                        type="button"
                        className={`select-btn ${openRelationshipIndex === idx ? 'open' : ''}`}
                        onClick={() => toggleRelationship(idx)}
                      >
                        <span className="select-btn-text">{getRelationshipLabel(passenger.relationship)}</span>
                        <span className={`select-arrow ${openRelationshipIndex === idx ? 'rotate' : ''}`}>▼</span>
                      </button>
                      {openRelationshipIndex === idx && (
                        <div className="select-dropdown">
                          {relationshipOptions.map(option => (
                            <button
                              key={option.value}
                              type="button"
                              className={`select-option ${passenger.relationship === option.value ? 'active' : ''}`}
                              onClick={() => {
                                updatePassenger(idx, 'relationship', option.value);
                                setOpenRelationshipIndex(null);
                              }}
                            >
                              {option.label}
                              {passenger.relationship === option.value && <span className="option-check">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>{passenger.age < 14 ? 'Свидетельство о рождении *' : 'Номер паспорта *'}</label>
                  <input 
                    type="text" 
                    value={passenger.passportNumber} 
                    onChange={(e) => handlePassengerChange(idx, 'passportNumber', e.target.value)}
                    onBlur={() => handleBlur(idx, 'passportNumber')}
                    placeholder={passenger.age < 14 ? "VIII-АБ №123456" : "1234 567890"}
                  />
                  {touched[`passenger_${idx}_passportNumber`] && errors[`passenger_${idx}_passportNumber`] && (
                    <span className="error-text">{errors[`passenger_${idx}_passportNumber`]}</span>
                  )}
                </div>
              </div>
            ))}
            <button type="button" onClick={addPassenger} className="add-btn">+ Добавить пассажира</button>
          </div>

          <div className="booking-section">
            <h3>Особые пожелания</h3>
            <textarea 
              value={specialRequests} 
              onChange={(e) => setSpecialRequests(e.target.value)} 
              placeholder="Диетические ограничения, предпочтения по номеру, празднование..." 
              rows="3"
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Отправка...' : `Забронировать за ${totalPrice.toLocaleString('ru-RU')} ₽`}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Booking;