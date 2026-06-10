import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toursData, getTourById } from '../data/toursData';
import Reviews from '../components/Reviews';
import './TourDetail.css';

const TourDetail = () => {
  const { id } = useParams();
  const [tour, setTour] = useState(null);

  useEffect(() => {
    const found = getTourById(id);
    setTour(found);
    window.scrollTo(0, 0);
  }, [id]);

  if (!tour) {
    return <div className="loading">Загрузка...</div>;
  }

  const similarTours = toursData.filter(t => t.country === tour.country && t.id !== tour.id).slice(0, 3);

  return (
    <div className="tour-detail">
      <div className="detail-hero">
        <img src={tour.image} alt={tour.name} />
        <div className="detail-hero-overlay">
          <div className="detail-hero-content">
            <h1>{tour.name}</h1>
            <p>{tour.city}, {tour.country}</p>
            <div className="detail-price">₽{tour.price}</div>
          </div>
        </div>
      </div>

      <div className="detail-content">
        <div className="detail-main">
          <div className="detail-info-card">
            <div className="info-item">
              <span className="info-label">Длительность</span>
              <span className="info-value">{tour.duration}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Рейтинг</span>
              <span className="info-value">{tour.rating}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Лучший сезон</span>
              <span className="info-value">Круглый год</span>
            </div>
            <div className="info-item">
              <span className="info-label">Размер группы</span>
              <span className="info-value">2-10 человек</span>
            </div>
          </div>

          <div className="detail-description">
            <h2>О туре</h2>
            <p>{tour.description}</p>
            <p>Погрузитесь в мир роскоши и эксклюзивных впечатлений. Наши эксперты позаботятся о каждой детали вашего путешествия.</p>
            <h3>Что включено:</h3>
            <ul>
              <li>Проживание в люксовых отелях</li>
              <li>Ежедневные завтраки и избранные ужины</li>
              <li>Трансфер на раскошном автомобиле</li>
              <li>Круглосуточный персональный консьерж</li>
              <li>Все входные билеты и активности</li>
              <li>Медицинская страховка премиум-класса</li>
            </ul>
          </div>

          <div className="detail-actions">
            <Link to={`/booking/${tour.id}`}>
              <button className="book-now-btn">ЗАБРОНИРОВАТЬ</button>
            </Link>
            <Link to="/tours">
              <button className="back-btn">← НАЗАД К ТУРАМ</button>
            </Link>
          </div>
        </div>

        <div className="detail-sidebar">
          <div className="sidebar-card">
            <h3>Почему стоит выбрать этот тур?</h3>
            <ul>
              <li>VIP-доступ к эксклюзивным местам</li>
              <li>Проживание в отелях 5★</li>
              <li>Рестораны Мишлен</li>
              <li>Профессиональный фотограф</li>
              <li>Опциональные вертолётные туры</li>
            </ul>
          </div>
        </div>
      </div>
      <Reviews tourId={tour.id} tourName={tour.name} />

      {similarTours.length > 0 && (
        <div className="similar-tours">
          <h2>Вам также может понравиться</h2>
          <div className="similar-grid">
            {similarTours.map(similar => (
              <Link to={`/tour/${similar.id}`} key={similar.id} className="similar-card">
                <img src={similar.image} alt={similar.name} />
                <div className="similar-info">
                  <h4>{similar.name}</h4>
                  <p>€{similar.price}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TourDetail;