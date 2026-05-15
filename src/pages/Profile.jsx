import React, { useState, useEffect, useRef } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { validateFullName, validatePhone, validatePassport, validateDateOfBirth } from '../utils/validation';
import './Profile.css';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    fullName: '',
    passportNumber: '',
    phone: '',
    gender: '',
    dateOfBirth: ''
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [saved, setSaved] = useState(false);
  const [isGenderOpen, setIsGenderOpen] = useState(false);
  const [isDateOpen, setIsDateOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [availableDays, setAvailableDays] = useState([]);
  const genderRef = useRef(null);
  const dateRef = useRef(null);

  const months = [
    { value: '01', label: 'Январь', days: 31 },
    { value: '02', label: 'Февраль', days: 28 },
    { value: '03', label: 'Март', days: 31 },
    { value: '04', label: 'Апрель', days: 30 },
    { value: '05', label: 'Май', days: 31 },
    { value: '06', label: 'Июнь', days: 30 },
    { value: '07', label: 'Июль', days: 31 },
    { value: '08', label: 'Август', days: 31 },
    { value: '09', label: 'Сентябрь', days: 30 },
    { value: '10', label: 'Октябрь', days: 31 },
    { value: '11', label: 'Ноябрь', days: 30 },
    { value: '12', label: 'Декабрь', days: 31 },
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear - 1900 + 1 }, (_, i) => currentYear - i);

  const isLeapYear = (year) => (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);

  const getDaysInMonth = (month, year) => {
    if (!month || !year) return [];
    const monthData = months.find(m => m.value === month);
    if (!monthData) return [];
    let daysCount = monthData.days;
    if (month === '02' && isLeapYear(parseInt(year))) daysCount = 29;
    return Array.from({ length: daysCount }, (_, i) => i + 1);
  };

  useEffect(() => {
    const days = getDaysInMonth(selectedMonth, selectedYear);
    setAvailableDays(days);
    if (selectedDay && days.length > 0 && parseInt(selectedDay) > days.length) setSelectedDay('');
  }, [selectedMonth, selectedYear]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      setUser(u);
      if (u) {
        const docRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(prev => ({ ...prev, ...data }));
          if (data.dateOfBirth) {
            const parts = data.dateOfBirth.split('-');
            if (parts.length === 3) {
              setSelectedYear(parts[0]);
              setSelectedMonth(parts[1]);
              setSelectedDay(parts[2]);
            }
          }
        }
        if (u.displayName) setProfile(prev => ({ ...prev, fullName: u.displayName }));
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (genderRef.current && !genderRef.current.contains(event.target)) setIsGenderOpen(false);
      if (dateRef.current && !dateRef.current.contains(event.target)) setIsDateOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (selectedDay && selectedMonth && selectedYear) {
      const formattedDate = `${selectedYear}-${selectedMonth}-${selectedDay.padStart(2, '0')}`;
      setProfile(prev => ({ ...prev, dateOfBirth: formattedDate }));
    }
  }, [selectedDay, selectedMonth, selectedYear]);

  const validateField = (field, value) => {
    if (field === 'fullName') return validateFullName(value);
    if (field === 'phone') return validatePhone(value);
    if (field === 'passportNumber') return validatePassport(value);
    if (field === 'dateOfBirth') return validateDateOfBirth(value);
    return '';
  };

  const handleChange = (field, value) => {
    setProfile({ ...profile, [field]: value });
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error }));
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, profile[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleSave = async () => {
    const fullNameError = validateFullName(profile.fullName);
    const phoneError = validatePhone(profile.phone);
    const passportError = validatePassport(profile.passportNumber);
    
    if (fullNameError || phoneError || passportError) {
      setErrors({ fullName: fullNameError, phone: phoneError, passportNumber: passportError });
      setTouched({ fullName: true, phone: true, passportNumber: true });
      return;
    }
    
    if (user) {
      await setDoc(doc(db, 'users', user.uid), profile, { merge: true });
      if (profile.fullName) await updateProfile(user, { displayName: profile.fullName });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const genderOptions = [
    { value: 'Мужской', label: 'Мужской' },
    { value: 'Женский', label: 'Женский' },
  ];

  const getGenderLabel = () => {
    if (!profile.gender) return 'Выберите пол';
    const option = genderOptions.find(opt => opt.value === profile.gender);
    return option ? option.label : profile.gender;
  };

  const getDateLabel = () => {
    if (selectedDay && selectedMonth && selectedYear) {
      const monthName = months.find(m => m.value === selectedMonth)?.label || '';
      return `${selectedDay} ${monthName} ${selectedYear}`;
    }
    return 'Выберите дату рождения';
  };

  if (!user) {
    return (
      <div className="profile-container">
        <div className="profile-message">
          <h2>Пожалуйста, войдите в аккаунт</h2>
          <a href="/auth" className="login-link">Войти</a>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-bg"></div>
      <div className="profile-card">
        <div className="profile-avatar">
          <div className="avatar-icon"></div>
          <h2>Добро пожаловать, {profile.fullName || user.email}</h2>
        </div>

        <div className="profile-form">
          <div className="form-group">
            <label>ФИО *</label>
            <input type="text" value={profile.fullName} onChange={(e) => handleChange('fullName', e.target.value)} onBlur={() => handleBlur('fullName')} placeholder="Иванов Иван Иванович" />
            {touched.fullName && errors.fullName && <span className="error-text">{errors.fullName}</span>}
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={user.email} disabled className="disabled" />
          </div>
          
          <div className="form-group">
            <label>Телефон</label>
            <input type="tel" value={profile.phone} onChange={(e) => handleChange('phone', e.target.value)} onBlur={() => handleBlur('phone')} placeholder="+7 123 456-78-90" />
            {touched.phone && errors.phone && <span className="error-text">{errors.phone}</span>}
          </div>
          
          <div className="form-group">
            <label>Номер паспорта *</label>
            <input type="text" value={profile.passportNumber} onChange={(e) => handleChange('passportNumber', e.target.value)} onBlur={() => handleBlur('passportNumber')} placeholder="1234 567890" />
            {touched.passportNumber && errors.passportNumber && <span className="error-text">{errors.passportNumber}</span>}
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>Дата рождения</label>
              <div className="custom-select date-select" ref={dateRef}>
                <button className={`select-trigger ${isDateOpen ? 'open' : ''}`} onClick={() => setIsDateOpen(!isDateOpen)} type="button">
                  <span>{getDateLabel()}</span>
                  <span className={`arrow ${isDateOpen ? 'open' : ''}`}>▼</span>
                </button>
                {isDateOpen && (
                  <div className="date-dropdown">
                    <div className="date-picker">
                      <div className="date-column"><div className="date-column-title">День</div><div className="date-options">{availableDays.map(day => (<button key={day} className={`date-option ${selectedDay === day.toString() ? 'active' : ''}`} onClick={() => setSelectedDay(day.toString())} type="button">{day}</button>))}</div></div>
                      <div className="date-column"><div className="date-column-title">Месяц</div><div className="date-options">{months.map(month => (<button key={month.value} className={`date-option ${selectedMonth === month.value ? 'active' : ''}`} onClick={() => setSelectedMonth(month.value)} type="button">{month.label}</button>))}</div></div>
                      <div className="date-column"><div className="date-column-title">Год</div><div className="date-options">{years.map(year => (<button key={year} className={`date-option ${selectedYear === year.toString() ? 'active' : ''}`} onClick={() => setSelectedYear(year.toString())} type="button">{year}</button>))}</div></div>
                    </div>
                    <div className="date-actions"><button className="date-clear" onClick={() => { setSelectedDay(''); setSelectedMonth(''); setSelectedYear(''); setProfile({...profile, dateOfBirth: ''}); }} type="button">Очистить</button><button className="date-confirm" onClick={() => setIsDateOpen(false)} type="button">Готово</button></div>
                  </div>
                )}
              </div>
            </div>
            <div className="form-group">
              <label>Пол</label>
              <div className="custom-select" ref={genderRef}>
                <button className={`select-trigger ${isGenderOpen ? 'open' : ''}`} onClick={() => setIsGenderOpen(!isGenderOpen)} type="button">
                  <span>{getGenderLabel()}</span>
                  <span className={`arrow ${isGenderOpen ? 'open' : ''}`}>▼</span>
                </button>
                {isGenderOpen && (<div className="select-dropdown">{genderOptions.map(option => (<button key={option.value} className={`select-option ${profile.gender === option.value ? 'active' : ''}`} onClick={() => { setProfile({...profile, gender: option.value}); setIsGenderOpen(false); }} type="button"><span>{option.label}</span>{profile.gender === option.value && <span className="check">✓</span>}</button>))}</div>)}
              </div>
            </div>
          </div>
          
          <button onClick={handleSave} className="save-btn">Сохранить</button>
          {saved && <div className="toast">Профиль сохранён!</div>}
        </div>
      </div>
    </div>
  );
};

export default Profile;