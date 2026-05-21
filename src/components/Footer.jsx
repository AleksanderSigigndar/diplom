import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <h3>Визы и Путешествия</h3>
          <p>Премиум турагентство</p>
          <p>Создаём незабываемые путешествия</p>
          <p>с 2015 года</p>
        </div>
        
        <div className="footer-section">
          <h4>Быстрые ссылки</h4>
          <Link to="/">Главная</Link>
          <Link to="/tours">Туры</Link>
          <Link to="/why-us">Почему мы</Link>
          <Link to="/auth">Личный кабинет</Link>
        </div>
        
        <div className="footer-section">
          <h4>Контакты</h4>
          <p>+7 (495) 123-45-67</p>
          <p>info@visiputeshestvia.ru</p>
          <p>Санкт-Петербург, Невский пр. 71/1</p>
        </div>
        
        <div className="footer-section">
          <h4>Мы в соцсетях</h4>
          <div className="social-links">
            <a href="#">Instagram</a>
            <a href="#">Telegram</a>
            <a href="#">Facebook</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;