import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { toursData } from '../data/toursData';
import './Tours.css';

const Tours = () => {
  const [tours, setTours] = useState([]);
  const [visibleCount, setVisibleCount] = useState(12);
  const [sortBy, setSortBy] = useState('price-asc');
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    let sorted = [...toursData];
    if (sortBy === 'price-asc') sorted.sort((a,b) => a.price - b.price);
    if (sortBy === 'price-desc') sorted.sort((a,b) => b.price - a.price);
    if (sortBy === 'rating-asc') sorted.sort((a,b) => a.rating - b.rating);
    if (sortBy === 'rating-desc') sorted.sort((a,b) => b.rating - a.rating);
    setTours(sorted);
  }, [sortBy]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setVisibleCount(prev => prev + 8);
      setLoading(false);
    }, 500);
  };

  const getSortLabel = () => {
    switch(sortBy) {
      case 'price-asc': return 'Цена: по возрастанию';
      case 'price-desc': return 'Цена: по убыванию';
      case 'rating-asc': return 'Рейтинг: по возрастанию';
      case 'rating-desc': return 'Рейтинг: по убыванию';
      default: return 'Сортировать';
    }
  };

  const sortOptions = [
    { value: 'price-asc', label: 'Цена: по возрастанию', icon: '' },
    { value: 'price-desc', label: 'Цена: по убыванию', icon: '' },
    { value: 'rating-asc', label: 'Рейтинг: по возрастанию', icon: '' },
    { value: 'rating-desc', label: 'Рейтинг: по убыванию', icon: '' },
  ];

  return (
    <div className="tours-page">
      <div className="tours-hero">
        <div className="tours-hero-bg"></div>
        <div className="tours-hero-overlay">
          <h1>НАШИ ТУРЫ</h1>
          <p>Откройте для себя коллекцию эксклюзивных путешествий</p>
        </div>
      </div>

      <div className="tours-content">
        <div className="sort-bar">
          <div className="sort-info">
            <span className="sort-icon"></span>
            <span>Найдено туров: <strong>{tours.length}</strong></span>
          </div>
          
          <div className="custom-sort-select" ref={dropdownRef}>
            <button 
              className="sort-button"
              onClick={() => setIsOpen(!isOpen)}
              type="button"
            >
              <span>
                <span></span> {getSortLabel()}
              </span>
              <span className={`sort-arrow ${isOpen ? 'open' : ''}`}>▼</span>
            </button>
            
            {isOpen && (
              <div className="sort-dropdown">
                {sortOptions.map(option => (
                  <button
                    key={option.value}
                    className={`sort-option ${sortBy === option.value ? 'active' : ''}`}
                    onClick={() => {
                      setSortBy(option.value);
                      setIsOpen(false);
                    }}
                    type="button"
                  >
                    <span>{option.icon}</span>
                    <span>{option.label}</span>
                    {sortBy === option.value && <span className="option-check">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="tours-grid">
          {tours.slice(0, visibleCount).map((tour) => (
            <div key={tour.id} className="tour-card">
              <div className="tour-card-image">
                <img src={tour.image} alt={tour.name} />
                <div className="price-badge">{tour.price} ₽</div>
                <div className="rating-badge">{tour.rating}</div>
              </div>
              <div className="tour-card-content">
                <h3>{tour.name}</h3>
                <p className="location">{tour.city}, {tour.country}</p>
                <div className="tour-info">
                  <span>{tour.duration}</span>
                </div>
                <p className="description">{tour.description.substring(0, 80)}...</p>
                <Link to={`/tour/${tour.id}`} className="learn-more">Подробнее →</Link>
              </div>
            </div>
          ))}
        </div>

        {visibleCount < tours.length && (
          <button onClick={loadMore} disabled={loading} className="load-more">
            {loading ? 'Загрузка...' : 'Загрузить ещё туры'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Tours;