import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import './AllReviews.css';

const AllReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      console.log("=== ЗАГРУЗКА ВСЕХ ОТЗЫВОВ ===");
      
      const q = query(
        collection(db, 'reviews'),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      console.log("Найдено одобренных отзывов:", snapshot.size);
      
      const reviewsData = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Отзыв:", data.tourName, "статус:", data.status);
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date()
        };
      });
      
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredReviews = () => {
    if (filter === 'high') {
      return [...reviews].sort((a, b) => b.rating - a.rating);
    }
    if (filter === 'low') {
      return [...reviews].sort((a, b) => a.rating - b.rating);
    }
    return reviews;
  };

  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rating ? 'filled' : ''}`}>
          ★
        </span>
      );
    }
    return stars;
  };

  const filteredReviews = getFilteredReviews();

  return (
    <div className="all-reviews-container">
      <div className="all-reviews-header">
        <h1>Отзывы наших клиентов</h1>
        <p>Что говорят путешественники о своих впечатлениях</p>
      </div>

      <div className="all-reviews-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Все отзывы ({reviews.length})
        </button>
        <button 
          className={`filter-btn ${filter === 'high' ? 'active' : ''}`}
          onClick={() => setFilter('high')}
        >
          Сначала высокие ⭐
        </button>
        <button 
          className={`filter-btn ${filter === 'low' ? 'active' : ''}`}
          onClick={() => setFilter('low')}
        >
          Сначала низкие ⭐
        </button>
      </div>

      {loading ? (
        <div className="all-reviews-loading">Загрузка отзывов...</div>
      ) : filteredReviews.length === 0 ? (
        <div className="all-reviews-empty">
          <div className="empty-icon">📝</div>
          <h3>Пока нет одобренных отзывов</h3>
          <p>Будьте первым, кто оставит отзыв о путешествии!</p>
          <Link to="/tours" className="browse-tours-btn">Посмотреть туры</Link>
        </div>
      ) : (
        <div className="all-reviews-grid">
          {filteredReviews.map(review => (
            <div key={review.id} className="all-review-card">
              <div className="review-tour-info">
                <Link to={`/tour/${review.tourId}`} className="tour-link">
                  {review.tourName}
                </Link>
              </div>
              <div className="review-user-info">
                <span className="user-name">{review.userName}</span>
                <span className="review-date">
                  {review.createdAt?.toLocaleDateString('ru-RU')}
                </span>
              </div>
              <div className="review-rating-stars">
                {renderStars(review.rating)}
              </div>
              <div className="review-comment-text">
                <p>{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllReviews;