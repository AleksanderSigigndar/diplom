// src/utils/validation.js

// Валидация email
export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@([^\s@.,]+\.)+[^\s@.,]{2,}$/;
  if (!email) return 'Email обязателен';
  if (!emailRegex.test(email)) return 'Введите корректный email (пример: name@domain.com)';
  return '';
};

// Валидация телефона (российские номера)
export const validatePhone = (phone) => {
  const phoneRegex = /^(\+7|7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
  if (!phone) return '';
  if (!phoneRegex.test(phone)) return 'Введите корректный номер телефона (например: +7 123 456-78-90)';
  return '';
};

// Валидация паспорта РФ
export const validatePassport = (passport) => {
  const passportRegex = /^[0-9]{4}\s?[0-9]{6}$/;
  if (!passport) return 'Паспорт обязателен';
  if (!passportRegex.test(passport)) return 'Введите корректный номер паспорта (4 цифры, пробел, 6 цифр)';
  return '';
};

// Валидация свидетельства о рождении
export const validateBirthCertificate = (certificate) => {
  const certificateRegex = /^[XI]{1,3}[-АБ]{0,2}\s?[-№]?\s?[0-9]{6,10}$/i;
  if (!certificate) return 'Свидетельство о рождении обязательно';
  if (certificate.length < 6) return 'Введите корректный номер свидетельства о рождении';
  return '';
};

// Валидация ФИО
export const validateFullName = (name) => {
  const nameRegex = /^[А-Яа-яA-Za-z\s\-]{2,50}$/;
  if (!name) return 'ФИО обязательно';
  if (!nameRegex.test(name)) return 'Используйте только буквы, пробелы и дефисы (2-50 символов)';
  return '';
};

// Валидация пароля
export const validatePassword = (password) => {
  if (!password) return 'Пароль обязателен';
  if (password.length < 6) return 'Пароль должен содержать минимум 6 символов';
  if (password.length > 50) return 'Пароль не должен превышать 50 символов';
  return '';
};

// Валидация подтверждения пароля
export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword) return 'Подтвердите пароль';
  if (password !== confirmPassword) return 'Пароли не совпадают';
  return '';
};

// Валидация возраста
export const validateAge = (age) => {
  if (!age) return 'Возраст обязателен';
  const numAge = parseInt(age);
  if (isNaN(numAge)) return 'Введите корректный возраст';
  if (numAge < 0) return 'Возраст не может быть отрицательным';
  if (numAge > 120) return 'Возраст не может превышать 120 лет';
  return '';
};

// Валидация даты рождения
export const validateDateOfBirth = (date) => {
  if (!date) return '';
  const birthDate = new Date(date);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  if (age < 0) return 'Дата рождения не может быть в будущем';
  if (age > 120) return 'Возраст не может превышать 120 лет';
  return '';
};

// Валидация всех пассажиров
export const validatePassengers = (passengers) => {
  const errors = [];
  for (let i = 0; i < passengers.length; i++) {
    const p = passengers[i];
    const nameError = validateFullName(p.name);
    if (nameError) errors.push(`Пассажир ${i + 1}: ${nameError}`);
    
    const ageError = validateAge(p.age);
    if (ageError) errors.push(`Пассажир ${i + 1}: ${ageError}`);
    
    if (p.age < 14) {
      const certError = validateBirthCertificate(p.passportNumber);
      if (certError) errors.push(`Пассажир ${i + 1}: ${certError}`);
    } else {
      const passportError = validatePassport(p.passportNumber);
      if (passportError) errors.push(`Пассажир ${i + 1}: ${passportError}`);
    }
  }
  return errors;
};