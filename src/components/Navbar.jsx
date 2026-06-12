import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import './Navbar.css';

const Navbar = () => {
  const [user, setUser] = useState(null);
  const [mobileMenu, setMobileMenu] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
    setMobileMenu(false);
  };
  

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/tours" onClick={() => setMobileMenu(false)}>ТУРЫ</Link>
        <Link to="/visa" onClick={() => setMobileMenu(false)}>ВИЗЫ</Link>
        <Link to="/reviews" onClick={() => setMobileMenu(false)}>ОТЗЫВЫ</Link>
        <Link to="/why-us" onClick={() => setMobileMenu(false)}>ПОЧЕМУ МЫ</Link>
    </div>
      <Link to="/" className="nav-logo" onClick={() => setMobileMenu(false)}>
        <span className="logo-text">Визы{' \u00A0 '}и</span>
        <span className="logo-text-light">{' \u00A0 '}ПУТЕШЕСТВИЯ</span>
      </Link>
      
      <div className="nav-right">
        {user ? (
          <>
            <Link to="/profile" onClick={() => setMobileMenu(false)}>ПРОФИЛЬ</Link>
            {user.email === 'admin@mail.com' && <Link to="/admin" onClick={() => setMobileMenu(false)}>АДМИН</Link>}
            <button onClick={handleLogout} className="logout-btn">ВЫЙТИ</button>
          </>
        ) : (
          <Link to="/auth" className="auth-btn">ВОЙТИ</Link>
        )}
      </div>

      {/* Бургер-меню для мобильных */}
      <div className="burger" onClick={() => setMobileMenu(!mobileMenu)}>
        <div className="burger-line"></div>
        <div className="burger-line"></div>
        <div className="burger-line"></div>
      </div>

      {/* Мобильное меню */}
      {mobileMenu && (
        <div className="mobile-menu">
        <Link to="/tours" onClick={() => setMobileMenu(false)}>ТУРЫ</Link>
        <Link to="/visa" onClick={() => setMobileMenu(false)}>ВИЗЫ</Link>
        <Link to="/reviews" onClick={() => setMobileMenu(false)}>ОТЗЫВЫ</Link>
        <Link to="/why-us" onClick={() => setMobileMenu(false)}>ПОЧЕМУ МЫ</Link>
          {user ? (
            <>
              <Link to="/profile" onClick={() => setMobileMenu(false)}>ПРОФИЛЬ</Link>
              {user.email === 'admin@luxtrips.com' && <Link to="/admin" onClick={() => setMobileMenu(false)}>АДМИН</Link>}
              <button onClick={handleLogout} className="logout-btn-mobile">ВЫЙТИ</button>
            </>
          ) : (
            <Link to="/auth" onClick={() => setMobileMenu(false)}>ВОЙТИ</Link>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;