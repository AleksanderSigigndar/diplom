import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

const Home = () => {
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.pageYOffset;
      setScrollY(scrolled);
      if (heroRef.current) {
        requestAnimationFrame(() => {
          heroRef.current.style.transform = `translateY(${scrolled * 0.3}px)`;
        });
      }
      
      cardsRef.current.forEach((card, index) => {
        if (card) {
          const rect = card.getBoundingClientRect();
          if (rect.top < window.innerHeight - 100) {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
          }
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const floatingCards = [
    { title: 'Эксклюзивные туры', icon: '', delay: 0 },
    { title: 'Частные самолёты', icon: '', delay: 0.2 },
    { title: '5★ отели', icon: '', delay: 0.4 },
    { title: '24/7 Консьерж', icon: '', delay: 0.6 },
  ];

  const destinations = [
    { name: 'Альпы, Швейцария', image: 'https://i.pinimg.com/1200x/69/a8/71/69a871ed0f35cbf8735f81a5c7537936.jpg', price: '₽269.100' },
    { name: 'Мальдивы', image: 'https://i.pinimg.com/1200x/bf/bf/b5/bfbfb5f1bf71420c99d71b4c6a797f70.jpg', price: '₽405.000' },
    { name: 'Санторини, Греция', image: 'https://i.pinimg.com/1200x/54/88/41/548841e75b0ec831e7f9bb188ee693b3.jpg', price: '₽288.000' },
    { name: 'Бора-Бора', image: 'https://i.pinimg.com/1200x/f4/64/9a/f4649a5dbdf9241bddb6e862579c6d65.jpg', price: '₽468.000' },
    { name: 'Киото, Япония', image: 'https://i.pinimg.com/1200x/d1/52/67/d15267e1058a7aa9344fbd7f787231e7.jpg', price: '₽342.000' },
    { name: 'Позитано, Италия', image: 'https://i.pinimg.com/736x/57/64/c5/5764c554ab95ab2bc150f613c981b20f.jpg', price: '₽378.000' },
  ];

  return (
    <div className="home">
      <div className="hero-section">
        <div className="parallax-layer" ref={heroRef}>
          <div className="parallax-bg"></div>
        </div>
        <div className="hero-content">
          <h1 className="hero-title">
            ОТКРОЙТЕ
            <span className="hero-gradient"> МИР</span>
            <br />
            <span className="hero-subtitle">РОСКОШНЫХ ПУТЕШЕСТВИЙ</span>
          </h1>
          <p className="hero-description">
            Индивидуальные туры премиум-класса в самые красивые уголки планеты
          </p>
          <div className="hero-buttons">
            <Link to="/tours" className="btn-primary">ИССЛЕДОВАТЬ ТУРЫ</Link>
            <Link to="/why-us" className="btn-secondary">ПОЧЕМУ МЫ</Link>
          </div>
        </div>
      </div>
      <div className="about-section">
        <div className="about-grid">
          <div className="about-content">
            <h2>ПРЕМИУМ <span>ПУТЕШЕСТВИЯ</span></h2>
            <p>LUX TRIPS — это не просто турагентство. Мы создаём впечатления, которые остаются с вами на всю жизнь. Каждое путешествие разрабатывается индивидуально, учитывая все ваши пожелания и предпочтения.</p>
            <div className="stats">
              <div className="stat">
                <div className="stat-number">500+</div>
                <div>Эксклюзивных отелей</div>
              </div>
              <div className="stat">
                <div className="stat-number">50+</div>
                <div>Стран мира</div>
              </div>
              <div className="stat">
                <div className="stat-number">98%</div>
                <div>Довольных клиентов</div>
              </div>
            </div>
          </div>
          <div className="about-image">
            <img src="https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop" alt="luxury travel" />
          </div>
        </div>
      </div>
      <div className="destinations-section">
        <h2>ПОПУЛЯРНЫЕ <span>НАПРАВЛЕНИЯ</span></h2>
        <div className="destinations-grid">
          {destinations.map((dest, idx) => (
            <div 
              key={idx} 
              className="destination-card"
              ref={el => cardsRef.current[idx] = el}
            >
              <img src={dest.image} alt={dest.name} />
              <div className="destination-overlay">
                <h3>{dest.name}</h3>
                <p>от {dest.price}</p> 
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="quote-section">
        <div className="quote-content">
          <div className="quote-icon">“</div>
          <p>Путешествие — это единственная вещь,<br />которая делает вас богаче.</p>
          <span>- Аноним</span>
        </div>
      </div>
      <div className="cta-section">
        <div className="cta-content">
          <h2>ГОТОВЫ К ПУТЕШЕСТВИЮ МЕЧТЫ?</h2>
          <p>Свяжитесь с нами, и мы создадим идеальный маршрут</p>
          <Link to="/tours" className="btn-primary">НАЧАТЬ ПУТЕШЕСТВИЕ</Link>
        </div>
      </div>
    </div>
  );
};

export default Home;