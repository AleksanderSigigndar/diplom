import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, addDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import './Reviews.css';

const Reviews = ({ tourId, tourName }) => {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (tourId) {
      fetchReviews();
    }
  }, [tourId]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      console.log("=== ПОИСК ОТЗЫВОВ ===");
      console.log("tourId (тип):", typeof tourId, "значение:", tourId);
      
      // Пробуем найти отзывы где tourId как строка
      let q = query(
        collection(db, 'reviews'),
        where('tourId', '==', String(tourId)),
        where('status', '==', 'approved'),
        orderBy('createdAt', 'desc')
      );
      
      let snapshot = await getDocs(q);
      console.log("Поиск по строке:", snapshot.size, "отзывов");
      
      // Если не нашли, пробуем как число
      if (snapshot.empty) {
        q = query(
          collection(db, 'reviews'),
          where('tourId', '==', Number(tourId)),
          where('status', '==', 'approved'),
          orderBy('createdAt', 'desc')
        );
        snapshot = await getDocs(q);
        console.log("Поиск по числу:", snapshot.size, "отзывов");
      }
      
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      
      console.log("Загружено отзывов:", reviewsData.length);
      reviewsData.forEach(r => console.log("-", r.tourName, "рейтинг:", r.rating, "статус:", r.status));
      
      setReviews(reviewsData);

      if (user) {
        const userReviewQuery = query(
          collection(db, 'reviews'),
          where('userId', '==', user.uid),
          where('tourId', '==', String(tourId))
        );
        const userReviewSnap = await getDocs(userReviewQuery);
        if (!userReviewSnap.empty) {
          setUserReview(userReviewSnap.docs[0].data());
        }
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setMessage('Пожалуйста, войдите в аккаунт, чтобы оставить отзыв');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (userReview) {
      setMessage('Вы уже оставили отзыв на этот тур');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    if (!comment.trim()) {
      setMessage('Пожалуйста, напишите комментарий');
      setTimeout(() => setMessage(''), 5000);
      return;
    }

    setSubmitting(true);
    try {
      const reviewData = {
        tourId: String(tourId),
        tourName: tourName,
        userId: user.uid,
        userName: user.displayName || user.email,
        rating: rating,
        comment: comment.trim(),
        status: 'pending',
        createdAt: serverTimestamp(),
        helpful: 0
      };
      
      console.log("Отправка отзыва:", reviewData);
      await addDoc(collection(db, 'reviews'), reviewData);
      setMessage('✓ Спасибо за отзыв! Он будет опубликован после модерации.');
      setRating(5);
      setComment('');
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error("Error submitting review:", error);
      setMessage('Ошибка при отправке отзыва. Попробуйте позже.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (ratingValue, interactive = false) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= (interactive ? hoverRating || ratingValue : ratingValue) ? 'filled' : ''}`}
          onClick={() => interactive && setRating(i)}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
        >
          ★
        </span>
      );
    }
    return stars;
  };

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : 0;

  return (
    <div className="reviews-section">
      <div className="reviews-header">
        <h3>Отзывы и оценки</h3>
        {reviews.length > 0 && (
          <div className="reviews-summary">
            <div className="average-rating">
              <span className="rating-value">{averageRating}</span>
              <div className="stars">{renderStars(Math.round(averageRating))}</div>
              <span className="review-count">({reviews.length} отзывов)</span>
            </div>
          </div>
        )}
      </div>

      <div className="review-form">
        <h4>Оставить отзыв</h4>
        {user ? (
          userReview ? (
            <div className="already-reviewed">
              <p>✓ Вы уже оставили отзыв на этот тур. Спасибо за ваше мнение!</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="rating-input">
                <label>Ваша оценка:</label>
                <div className="stars-input">
                  {renderStars(rating, true)}
                </div>
              </div>
              <div className="comment-input">
                <label>Ваш комментарий:</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Расскажите о своих впечатлениях..."
                  rows="4"
                  required
                />
              </div>
              <button type="submit" disabled={submitting} className="submit-review-btn">
                {submitting ? 'Отправка...' : 'Отправить отзыв'}
              </button>
            </form>
          )
        ) : (
          <div className="login-to-review">
            <p>Чтобы оставить отзыв, пожалуйста, <a href="/login">войдите</a> в аккаунт</p>
          </div>
        )}
        {message && <div className={`review-message ${message.includes('✓') ? 'success' : 'error'}`}>{message}</div>}
      </div>

      {loading ? (
        <div className="reviews-loading">Загрузка отзывов...</div>
      ) : reviews.length > 0 ? (
        <div className="reviews-list">
          {reviews.map(review => (
            <div key={review.id} className="review-card">
              <div className="review-header">
                <div className="reviewer-info">
                  <span className="reviewer-name">{review.userName}</span>
                  <span className="review-date">
                    {review.createdAt?.toLocaleDateString('ru-RU')}
                  </span>
                </div>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
              </div>
              <div className="review-comment">
                <p>{review.comment}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-reviews">
          <p>📝 Пока нет отзывов. Будьте первым, кто оценит этот тур!</p>
        </div>
      )}
    </div>
  );
};

export default Reviews;