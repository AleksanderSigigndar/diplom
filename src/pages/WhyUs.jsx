import React from 'react';
import { Link } from 'react-router-dom';
import './WhyUs.css';

const WhyUs = () => {
  const reasons = [
    { icon: "1", title: "10+ лет опыта", desc: "Десятилетие создания незабываемых путешествий" },
    { icon: "2", title: "Эксклюзивные партнёрства", desc: "Доступ к лучшим 5-звёздочным отелям мира" },
    { icon: "3", title: "Приватный транспорт", desc: "Частные самолёты, яхты и вертолёты" },
    { icon: "4", title: "Рестораны Мишлен", desc: "Бронирование в лучших ресторанах мира" },
    { icon: "5", title: "24/7 Консьерж", desc: "Круглосуточная персональная помощь" },
    { icon: "6", title: "Индивидуальные маршруты", desc: "Персонализированные впечатления" }
  ];

  return (
    <div className="why-us">
      <div className="why-us-hero">
        <div className="why-us-hero-bg"></div>
        <div className="why-us-overlay">
          <h1>Почему выбирают <span>LUX TRIPS</span></h1>
          <p>Путешествуйте с лучшими</p>
        </div>
      </div>

      <div className="why-us-stats">
        <div className="stat">
          <div className="stat-number">10,000+</div>
          <div>Счастливых путешественников</div>
        </div>
        <div className="stat">
          <div className="stat-number">500+</div>
          <div>Люксовых отелей</div>
        </div>
        <div className="stat">
          <div className="stat-number">120+</div>
          <div>Стран мира</div>
        </div>
        <div className="stat">
          <div className="stat-number">98%</div>
          <div>Уровень удовлетворённости</div>
        </div>
      </div>

      <div className="why-us-reasons">
        <h2>Наши преимущества</h2>
        <div className="reasons-grid">
          {reasons.map((reason, idx) => (
            <div key={idx} className="reason-card">
              <div className="reason-icon">{reason.icon}</div>
              <h3>{reason.title}</h3>
              <p>{reason.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="why-us-cta">
        <h2>Готовы к следующему приключению?</h2>
        <p>Создайте идеальное путешествие вместе с нами</p>
        <Link to="/tours">
          <button>ИССЛЕДОВАТЬ ТУРЫ →</button>
        </Link>
      </div>
    </div>
  );
};

export default WhyUs;