import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { 
  validateFullName, validatePhone, validatePassport 
} from '../utils/validation';
import './Visa.css';

const Visa = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  
  // Состояния для выпадающих списков
  const [isCountryOpen, setIsCountryOpen] = useState(false);
  const [isVisaTypeOpen, setIsVisaTypeOpen] = useState(false);
  const [isDocumentsOpen, setIsDocumentsOpen] = useState(false);
  
  const countryRef = useRef(null);
  const visaTypeRef = useRef(null);
  const documentsRef = useRef(null);
  
  // Данные формы
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    passportNumber: '',
    country: '',
    visaType: 'tourist',
    documents: [],
    additionalInfo: ''
  });
  
  // Список стран для визы
  const countries = [
    { value: 'schengen', label: 'Шенгенская зона (Европа)' },
    { value: 'usa', label: 'США' },
    { value: 'uk', label: 'Великобритания' },
    { value: 'china', label: 'Китай' },
    { value: 'japan', label: 'Япония' },
    { value: 'india', label: 'Индия' },
    { value: 'turkey', label: 'Турция' },
    { value: 'uae', label: 'ОАЭ' },
    { value: 'thailand', label: 'Таиланд' },
    { value: 'vietnam', label: 'Вьетнам' },
  ];
  
  // Типы виз
  const visaTypes = [
    { value: 'tourist', label: 'Туристическая' },
    { value: 'business', label: 'Бизнес' },
    { value: 'work', label: 'Рабочая' },
    { value: 'student', label: 'Студенческая' },
    { value: 'transit', label: 'Транзитная' },
    { value: 'private', label: 'Частная (гостевая)' },
  ];
  
  // Необходимые документы для разных стран
  const documentsByCountry = {
    schengen: [
      { id: 'passport', label: 'Загранпаспорт (срок действия не менее 3 месяцев после окончания поездки)' },
      { id: 'photo', label: 'Фотографии 3.5×4.5 см — 2 шт.' },
      { id: 'application', label: 'Заполненная анкета' },
      { id: 'income', label: 'Справка с места работы (2-НДФЛ)' },
      { id: 'bank', label: 'Выписка из банка о движении средств' },
      { id: 'hotel', label: 'Подтверждение брони отеля' },
      { id: 'flight', label: 'Билеты (туда-обратно)' },
      { id: 'insurance', label: 'Медицинская страховка (от 30 000 €)' },
      { id: 'snils', label: 'Копия СНИЛС' },
      { id: 'inn', label: 'Копия ИНН' },
    ],
    usa: [
      { id: 'passport', label: 'Загранпаспорт (действителен не менее 6 месяцев)' },
      { id: 'photo', label: 'Фотография 5×5 см на белом фоне' },
      { id: 'application', label: 'Заполненная анкета DS-160' },
      { id: 'income', label: 'Справка с места работы (2-НДФЛ)' },
      { id: 'bank', label: 'Выписка из банка' },
      { id: 'property', label: 'Документы на недвижимость' },
      { id: 'family', label: 'Свидетельства о рождении детей (при поездке с детьми)' },
      { id: 'invitation', label: 'Приглашение (при наличии)' },
    ],
    uk: [
      { id: 'passport', label: 'Загранпаспорт (действителен не менее 6 месяцев)' },
      { id: 'photo', label: 'Фотографии 3.5×4.5 см — 2 шт.' },
      { id: 'application', label: 'Заполненная анкета' },
      { id: 'income', label: 'Справка с места работы (2-НДФЛ)' },
      { id: 'bank', label: 'Выписка из банка за 6 месяцев' },
      { id: 'hotel', label: 'Подтверждение брони отеля' },
      { id: 'flight', label: 'Билеты (туда-обратно)' },
      { id: 'invitation', label: 'Приглашение от принимающей стороны' },
    ],
    default: [
      { id: 'passport', label: 'Загранпаспорт' },
      { id: 'photo', label: 'Фотографии 3.5×4.5 см — 2 шт.' },
      { id: 'application', label: 'Заполненная анкета' },
      { id: 'income', label: 'Справка с места работы' },
      { id: 'bank', label: 'Выписка из банка' },
    ]
  };
  
  // Получение списка документов для выбранной страны
  const getDocumentsForCountry = () => {
    if (!formData.country) return [];
    return documentsByCountry[formData.country] || documentsByCountry.default;
  };
  
  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData(data);
          setFormData(prev => ({
            ...prev,
            fullName: data.fullName || '',
            phone: data.phone || '',
            email: user.email || '',
            passportNumber: data.passportNumber || ''
          }));
        } else {
          setFormData(prev => ({
            ...prev,
            email: user.email || ''
          }));
        }
      }
    };
    fetchUserData();
  }, []);
  
  // Закрытие выпадающих списков при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryRef.current && !countryRef.current.contains(event.target)) {
        setIsCountryOpen(false);
      }
      if (visaTypeRef.current && !visaTypeRef.current.contains(event.target)) {
        setIsVisaTypeOpen(false);
      }
      if (documentsRef.current && !documentsRef.current.contains(event.target)) {
        setIsDocumentsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setTouched(prev => ({ ...prev, [field]: true }));
    
    // Валидация
    let error = '';
    if (field === 'fullName') error = validateFullName(value);
    if (field === 'phone') error = validatePhone(value);
    if (field === 'passportNumber') error = validatePassport(value);
    if (field === 'country' && !value) error = 'Выберите страну';
    if (field === 'email' && !value) error = 'Email обязателен';
    
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = errors[field];
    if (!error && field === 'fullName') {
      const newError = validateFullName(formData.fullName);
      if (newError) setErrors(prev => ({ ...prev, [field]: newError }));
    }
    if (!error && field === 'phone') {
      const newError = validatePhone(formData.phone);
      if (newError) setErrors(prev => ({ ...prev, [field]: newError }));
    }
  };
  
  const toggleDocument = (docId) => {
    const currentDocs = [...formData.documents];
    if (currentDocs.includes(docId)) {
      setFormData(prev => ({
        ...prev,
        documents: prev.documents.filter(d => d !== docId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, docId]
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;
    
    const nameError = validateFullName(formData.fullName);
    if (nameError) {
      newErrors.fullName = nameError;
      isValid = false;
    }
    
    const phoneError = validatePhone(formData.phone);
    if (phoneError) {
      newErrors.phone = phoneError;
      isValid = false;
    }
    
    if (!formData.email) {
      newErrors.email = 'Email обязателен';
      isValid = false;
    }
    
    const passportError = validatePassport(formData.passportNumber);
    if (passportError) {
      newErrors.passportNumber = passportError;
      isValid = false;
    }
    
    if (!formData.country) {
      newErrors.country = 'Выберите страну';
      isValid = false;
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
        setTimeout(() => navigate('/auth'), 2000);
        return;
      }
      
      const visaRequestData = {
        type: 'visa',
        fullName: formData.fullName,
        phone: formData.phone,
        email: formData.email,
        passportNumber: formData.passportNumber,
        country: formData.country,
        countryLabel: countries.find(c => c.value === formData.country)?.label || formData.country,
        visaType: formData.visaType,
        visaTypeLabel: visaTypes.find(v => v.value === formData.visaType)?.label || formData.visaType,
        documents: formData.documents,
        documentsLabels: getDocumentsForCountry()
          .filter(d => formData.documents.includes(d.id))
          .map(d => d.label),
        additionalInfo: formData.additionalInfo || 'Нет',
        userId: user.uid,
        userEmail: user.email,
        userName: userData.fullName || user.displayName || user.email,
        createdAt: serverTimestamp(),
        status: 'pending'
      };
      
      await addDoc(collection(db, 'visa_requests'), visaRequestData);
      setMessage('✓ Ваша заявка на визовую поддержку отправлена! Мы свяжемся с вами в течение 48 часов');
      
      // Очистка формы
      setFormData(prev => ({
        ...prev,
        additionalInfo: '',
        documents: []
      }));
      
      setTimeout(() => {
        setMessage('');
        navigate('/tours');
      }, 5000);
    } catch (err) {
      console.error("Visa request error:", err);
      setMessage('Ошибка при отправке. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };
  
  const getCountryLabel = () => {
    const country = countries.find(c => c.value === formData.country);
    return country ? country.label : 'Выберите страну';
  };
  
  const getVisaTypeLabel = () => {
    const type = visaTypes.find(t => t.value === formData.visaType);
    return type ? type.label : 'Выберите тип визы';
  };
  
  const availableDocuments = getDocumentsForCountry();
  
  return (
    <div className="visa-container">
      <div className="visa-bg"></div>
      <div className="visa-card">
        <div className="visa-header">
          <h1>Визовая поддержка</h1>
          <p>Поможем оформить визу любой сложности</p>
        </div>
        
        {message && <div className={`visa-message ${message.includes('✓') ? 'success' : 'error'}`}>{message}</div>}
        
        <form onSubmit={handleSubmit} className="visa-form">
          <div className="form-section">
            <h3>Личные данные</h3>
            <div className="form-row">
              <div className="form-group">
                <label>ФИО *</label>
                <input 
                  type="text" 
                  value={formData.fullName} 
                  onChange={(e) => handleChange('fullName', e.target.value)}
                  onBlur={() => handleBlur('fullName')}
                  placeholder="Иванов Иван Иванович"
                />
                {touched.fullName && errors.fullName && <span className="error-text">{errors.fullName}</span>}
              </div>
              <div className="form-group">
                <label>Телефон *</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={(e) => handleChange('phone', e.target.value)}
                  onBlur={() => handleBlur('phone')}
                  placeholder="+7 123 456-78-90"
                />
                {touched.phone && errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="ivanov@example.com"
                />
                {touched.email && errors.email && <span className="error-text">{errors.email}</span>}
              </div>
              <div className="form-group">
                <label>Номер паспорта *</label>
                <input 
                  type="text" 
                  value={formData.passportNumber} 
                  onChange={(e) => handleChange('passportNumber', e.target.value)}
                  placeholder="1234 567890"
                />
                {touched.passportNumber && errors.passportNumber && <span className="error-text">{errors.passportNumber}</span>}
              </div>
            </div>
          </div>
          
          <div className="form-section">
            <h3>Информация о визе</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Страна *</label>
                <div className="custom-select-wrapper" ref={countryRef}>
                  <button 
                    type="button"
                    className={`select-btn ${isCountryOpen ? 'open' : ''}`}
                    onClick={() => setIsCountryOpen(!isCountryOpen)}
                  >
                    <span className="select-btn-text">{getCountryLabel()}</span>
                    <span className={`select-arrow ${isCountryOpen ? 'rotate' : ''}`}>▼</span>
                  </button>
                  {isCountryOpen && (
                    <div className="select-dropdown">
                      {countries.map(country => (
                        <button
                          key={country.value}
                          type="button"
                          className={`select-option ${formData.country === country.value ? 'active' : ''}`}
                          onClick={() => {
                            handleChange('country', country.value);
                            setIsCountryOpen(false);
                            // Сбрасываем выбранные документы при смене страны
                            setFormData(prev => ({ ...prev, documents: [] }));
                          }}
                        >
                          {country.label}
                          {formData.country === country.value && <span className="option-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {touched.country && errors.country && <span className="error-text">{errors.country}</span>}
              </div>
              <div className="form-group">
                <label>Тип визы</label>
                <div className="custom-select-wrapper" ref={visaTypeRef}>
                  <button 
                    type="button"
                    className={`select-btn ${isVisaTypeOpen ? 'open' : ''}`}
                    onClick={() => setIsVisaTypeOpen(!isVisaTypeOpen)}
                  >
                    <span className="select-btn-text">{getVisaTypeLabel()}</span>
                    <span className={`select-arrow ${isVisaTypeOpen ? 'rotate' : ''}`}>▼</span>
                  </button>
                  {isVisaTypeOpen && (
                    <div className="select-dropdown">
                      {visaTypes.map(type => (
                        <button
                          key={type.value}
                          type="button"
                          className={`select-option ${formData.visaType === type.value ? 'active' : ''}`}
                          onClick={() => {
                            handleChange('visaType', type.value);
                            setIsVisaTypeOpen(false);
                          }}
                        >
                          {type.label}
                          {formData.visaType === type.value && <span className="option-check">✓</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {formData.country && (
            <div className="form-section">
              <h3>Необходимые документы</h3>
              <p className="documents-hint">Отметьте документы, которые у вас уже есть или которые вам нужна помощь в оформлении:</p>
              <div className="documents-grid">
                {availableDocuments.map(doc => (
                  <label key={doc.id} className="document-checkbox">
                    <input 
                      type="checkbox" 
                      checked={formData.documents.includes(doc.id)}
                      onChange={() => toggleDocument(doc.id)}
                    />
                    <span>{doc.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          
          <div className="form-section">
            <h3>Дополнительная информация</h3>
            <textarea 
              value={formData.additionalInfo} 
              onChange={(e) => handleChange('additionalInfo', e.target.value)}
              placeholder="Укажите дополнительные пожелания, срочность, особые обстоятельства..."
              rows="4"
            />
          </div>
          
          <button type="submit" disabled={loading} className="visa-submit-btn">
            {loading ? 'Отправка...' : 'Отправить заявку на визовую поддержку'}
          </button>
        </form>
        
        <div className="visa-info">
          <h4>Почему стоит обратиться к нам?</h4>
          <ul>
            <li>✓ Помощь в сборе полного пакета документов</li>
            <li>✓ Заполнение анкет и перевод документов</li>
            <li>✓ Сопровождение в посольство и консульство</li>
            <li>✓ Экспресс-оформление (от 3 рабочих дней)</li>
            <li>✓ Консультация по визовым вопросам</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Visa;