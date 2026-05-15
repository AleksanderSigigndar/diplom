import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { validateEmail, validatePassword, validateConfirmPassword, validateFullName } from '../utils/validation';
import './Auth.css';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});
  const [fieldErrors, setFieldErrors] = useState({});
  const navigate = useNavigate();

  const validateField = (field, value) => {
    if (field === 'email') return validateEmail(value);
    if (field === 'password') return validatePassword(value);
    if (field === 'confirmPassword') return validateConfirmPassword(password, value);
    if (field === 'name') return validateFullName(value);
    return '';
  };

  const handleChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    if (field === 'confirmPassword') setConfirmPassword(value);
    if (field === 'name') setName(value);
    
    const error = validateField(field, value);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    const error = validateField(field, field === 'email' ? email : field === 'password' ? password : field === 'confirmPassword' ? confirmPassword : name);
    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const validateForm = () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    
    setFieldErrors({
      email: emailError,
      password: passwordError,
      ...(!isLogin && { name: validateFullName(name), confirmPassword: validateConfirmPassword(password, confirmPassword) })
    });
    
    if (emailError || passwordError) return false;
    if (!isLogin && (validateFullName(name) || validateConfirmPassword(password, confirmPassword))) return false;
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/profile');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        await setDoc(doc(db, 'users', userCredential.user.uid), { fullName: name, email: email, createdAt: new Date() });
        navigate('/profile');
      }
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setError('Этот email уже зарегистрирован');
      else if (err.code === 'auth/invalid-email') setError('Неверный формат email');
      else if (err.code === 'auth/wrong-password') setError('Неверный пароль');
      else if (err.code === 'auth/user-not-found') setError('Пользователь не найден');
      else setError('Произошла ошибка. Попробуйте позже.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-bg"><div className="auth-bg-overlay"></div></div>
      <div className="auth-card">
        <div className="auth-header"><h2>{isLogin ? 'ДОБРО ПОЖАЛОВАТЬ' : 'СОЗДАТЬ АККАУНТ'}</h2><p>{isLogin ? 'Войдите в свой аккаунт' : 'Присоединяйтесь к миру роскошных путешествий'}</p></div>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (<><input type="text" placeholder="Ваше имя" value={name} onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} />{touched.name && fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}</>)}
          <input type="email" placeholder="Email" value={email} onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} />
          {touched.email && fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
          <input type="password" placeholder="Пароль" value={password} onChange={(e) => handleChange('password', e.target.value)} onBlur={() => handleBlur('password')} />
          {touched.password && fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}
          {!isLogin && (<><input type="password" placeholder="Подтвердите пароль" value={confirmPassword} onChange={(e) => handleChange('confirmPassword', e.target.value)} onBlur={() => handleBlur('confirmPassword')} />{touched.confirmPassword && fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}</>)}
          <button type="submit" disabled={loading}>{loading ? 'Загрузка...' : (isLogin ? 'ВОЙТИ' : 'ЗАРЕГИСТРИРОВАТЬСЯ')}</button>
        </form>
        <div className="auth-switch"><p>{isLogin ? 'Нет аккаунта? ' : 'Уже есть аккаунт? '}<button onClick={() => { setIsLogin(!isLogin); setError(''); setFieldErrors({}); setTouched({}); }}>{isLogin ? 'Зарегистрироваться' : 'Войти'}</button></p></div>
      </div>
    </div>
  );
};

export default Auth;