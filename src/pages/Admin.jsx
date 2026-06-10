import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, orderBy, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import './Admin.css';

const Admin = () => {
  const [bookings, setBookings] = useState([]);
  const [visaRequests, setVisaRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [requestType, setRequestType] = useState('tours');
  const [reviewsTab, setReviewsTab] = useState(false);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    if (!reviewsTab) {
      if (requestType === 'tours') {
        fetchBookings();
      } else if (requestType === 'visa') {
        fetchVisaRequests();
      }
    } else {
      fetchReviews();
    }
  }, [requestType, reviewsTab]);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'bookings'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const bookingsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        contactedAt: doc.data().contactedAt?.toDate?.() || null
      }));
      setBookings(bookingsData);
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVisaRequests = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'visa_requests'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const requestsData = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        contactedAt: doc.data().contactedAt?.toDate?.() || null
      }));
      setVisaRequests(requestsData);
    } catch (error) {
      console.error("Error fetching visa requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'reviews'), orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));
      setReviews(reviewsData);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'bookings', id), { 
        status,
        updatedAt: new Date()
      });
      fetchBookings();
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const updateVisaStatus = async (id, status) => {
    try {
      await updateDoc(doc(db, 'visa_requests', id), { 
        status,
        updatedAt: new Date()
      });
      fetchVisaRequests();
    } catch (error) {
      console.error("Error updating visa status:", error);
    }
  };

  const toggleContacted = async (id, currentContacted, type) => {
    try {
      const collectionName = type === 'tours' ? 'bookings' : 'visa_requests';
      if (!currentContacted) {
        await updateDoc(doc(db, collectionName, id), { 
          contacted: true,
          contactedAt: new Date()
        });
      } else {
        await updateDoc(doc(db, collectionName, id), { 
          contacted: false,
          contactedAt: null
        });
      }
      if (type === 'tours') {
        fetchBookings();
      } else {
        fetchVisaRequests();
      }
    } catch (error) {
      console.error("Error toggling contacted status:", error);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Пожалуйста, укажите причину отказа');
      return;
    }
    
    try {
      const collectionName = requestType === 'tours' ? 'bookings' : 'visa_requests';
      await updateDoc(doc(db, collectionName, selectedItem.id), { 
        status: 'rejected',
        rejectReason: rejectReason,
        rejectedAt: new Date()
      });
      setShowRejectModal(false);
      setSelectedItem(null);
      setRejectReason('');
      if (requestType === 'tours') {
        fetchBookings();
      } else {
        fetchVisaRequests();
      }
    } catch (error) {
      console.error("Error rejecting item:", error);
    }
  };

  const openRejectModal = (item) => {
    setSelectedItem(item);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const approveReview = async (id) => {
  console.log("=== ОДОБРЕНИЕ ОТЗЫВА ===");
  console.log("ID отзыва:", id);
  
  try {
    const reviewRef = doc(db, 'reviews', id);
    await updateDoc(reviewRef, { 
      status: 'approved',
      moderatedAt: new Date()
    });
    console.log("Отзыв успешно одобрен!");
    fetchReviews(); // Обновляем список в админке
  } catch (error) {
    console.error("Ошибка при одобрении:", error);
    alert("Ошибка: " + error.message);
  }
};

const rejectReview = async (id) => {
  console.log("=== ОТКЛОНЕНИЕ ОТЗЫВА ===");
  console.log("ID отзыва:", id);
  
  try {
    const reviewRef = doc(db, 'reviews', id);
    await updateDoc(reviewRef, { 
      status: 'rejected',
      moderatedAt: new Date()
    });
    console.log("Отзыв успешно отклонён!");
    fetchReviews();
  } catch (error) {
    console.error("Ошибка при отклонении:", error);
    alert("Ошибка: " + error.message);
  }
};

const deleteReview = async (id) => {
  console.log("=== УДАЛЕНИЕ ОТЗЫВА ===");
  console.log("ID отзыва:", id);
  
  if (window.confirm('Вы уверены, что хотите удалить этот отзыв?')) {
    try {
      const reviewRef = doc(db, 'reviews', id);
      await deleteDoc(reviewRef);
      console.log("Отзыв успешно удалён!");
      fetchReviews();
    } catch (error) {
      console.error("Ошибка при удалении:", error);
      alert("Ошибка: " + error.message);
    }
  }
};

  const getCurrentItems = () => {
    if (reviewsTab) return [];
    return requestType === 'tours' ? bookings : visaRequests;
  };

  const filteredItems = getCurrentItems().filter(item => {
    if (activeTab === 'pending') return (item.status === 'pending' || !item.status);
    if (activeTab === 'confirmed') return item.status === 'confirmed';
    if (activeTab === 'rejected') return item.status === 'rejected';
    return true;
  });

  const getStatusCount = () => {
    if (reviewsTab) return { pending: 0, confirmed: 0, rejected: 0 };
    const items = getCurrentItems();
    return {
      pending: items.filter(b => b.status === 'pending' || !b.status).length,
      confirmed: items.filter(b => b.status === 'confirmed').length,
      rejected: items.filter(b => b.status === 'rejected').length
    };
  };

  const getReviewsStats = () => {
    return {
      pending: reviews.filter(r => r.status === 'pending').length,
      approved: reviews.filter(r => r.status === 'approved').length,
      rejected: reviews.filter(r => r.status === 'rejected').length
    };
  };

  const toggleExpand = (id) => {
    setExpandedItem(expandedItem === id ? null : id);
  };

  const counts = getStatusCount();
  const reviewStats = getReviewsStats();

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Панель администратора</h1>
        <p>Управление заявками и отзывами</p>
      </div>

      <div className="admin-type-switch">
        <button 
          className={`type-btn ${!reviewsTab && requestType === 'tours' ? 'active' : ''}`}
          onClick={() => { setReviewsTab(false); setRequestType('tours'); setActiveTab('pending'); setExpandedItem(null); }}
        >
          🏖️ Заявки на туры
        </button>
        <button 
          className={`type-btn ${!reviewsTab && requestType === 'visa' ? 'active' : ''}`}
          onClick={() => { setReviewsTab(false); setRequestType('visa'); setActiveTab('pending'); setExpandedItem(null); }}
        >
          🛂 Заявки на визы
        </button>
        <button 
          className={`type-btn ${reviewsTab ? 'active' : ''}`}
          onClick={() => { setReviewsTab(true); setExpandedItem(null); }}
        >
          ⭐ Отзывы (модерация)
        </button>
      </div>

      {/* Табы для заявок (не показываем для отзывов) */}
      {!reviewsTab && (
        <div className="admin-tabs">
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <span className="tab-icon">⏳</span>
            В обработке
            <span className="tab-count">{counts.pending}</span>
          </button>
          <button 
            className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
            onClick={() => setActiveTab('confirmed')}
          >
            <span className="tab-icon">✓</span>
            Подтверждённые
            <span className="tab-count">{counts.confirmed}</span>
          </button>
          <button 
            className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            <span className="tab-icon">✗</span>
            Отказано
            <span className="tab-count">{counts.rejected}</span>
          </button>
        </div>
      )}

      {/* Статистика отзывов */}
      {reviewsTab && (
        <div className="reviews-stats">
          <span className="stat-pending">⏳ На модерации: {reviewStats.pending}</span>
          <span className="stat-approved">✓ Одобрено: {reviewStats.approved}</span>
          <span className="stat-rejected">✗ Отклонено: {reviewStats.rejected}</span>
        </div>
      )}

      {/* Загрузка */}
      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Загрузка...</p>
        </div>
      ) : !reviewsTab && filteredItems.length === 0 ? (
        <div className="admin-empty">
          <div className="empty-icon">📭</div>
          <h3>Нет заявок</h3>
          <p>В этом разделе пока нет заявок</p>
        </div>
      ) : reviewsTab && reviews.length === 0 ? (
        <div className="admin-empty">
          <div className="empty-icon">⭐</div>
          <h3>Нет отзывов</h3>
          <p>Пока нет ни одного отзыва</p>
        </div>
      ) : (
        <div className="admin-bookings">
          {/* ЗАЯВКИ НА ТУРЫ И ВИЗЫ */}
          {!reviewsTab && filteredItems.map(item => (
            <div key={item.id} className={`admin-booking-card ${item.status === 'rejected' ? 'rejected' : ''} ${item.contacted ? 'contacted' : ''}`}>
              <div className="card-header" onClick={() => toggleExpand(item.id)}>
                <div className="header-left">
                  <span className="booking-id">#{item.id.slice(-8).toUpperCase()}</span>
                  {requestType === 'visa' && <span className="visa-badge">🛂 Визовая поддержка</span>}
                  <span className={`status-badge ${item.status || 'pending'}`}>
                    {item.status === 'pending' && '⏳ В обработке'}
                    {item.status === 'confirmed' && '✓ Подтверждён'}
                    {item.status === 'rejected' && '✗ Отказано'}
                    {!item.status && '⏳ В обработке'}
                  </span>
                  {item.contacted && (
                    <span className="contacted-badge">
                      📞 Связались {item.contactedAt?.toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
                <div className="header-right">
                  <span className="booking-date">
                    {item.createdAt?.toLocaleDateString('ru-RU')}
                  </span>
                  <span className={`expand-icon ${expandedItem === item.id ? 'expanded' : ''}`}>▼</span>
                </div>
              </div>
              
              {expandedItem === item.id && (
                <div className="card-content">
                  {requestType === 'tours' ? (
                    // Блок для туров
                    <>
                      <div className="info-section">
                        <h4>📋 Информация о туре</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Название тура:</label>
                            <span>{item.tourName}</span>
                          </div>
                          <div className="info-item">
                            <label>Страна / Город:</label>
                            <span>{item.tourCountry}, {item.tourCity}</span>
                          </div>
                          <div className="info-item">
                            <label>Стоимость тура:</label>
                            <span className="price">{item.tourPrice?.toLocaleString('ru-RU')} ₽</span>
                          </div>
                          <div className="info-item">
                            <label>Общая стоимость:</label>
                            <span className="total-price">{item.totalPrice?.toLocaleString('ru-RU')} ₽</span>
                          </div>
                        </div>
                      </div>
                      <div className="info-section">
                        <h4>👤 Информация о клиенте</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>ФИО:</label>
                            <span>{item.userName || item.userEmail}</span>
                          </div>
                          <div className="info-item">
                            <label>Email:</label>
                            <span>{item.userEmail}</span>
                          </div>
                          <div className="info-item highlight">
                            <label>📞 Телефон для связи:</label>
                            <span className="main-phone">{item.mainPhone || 'Не указан'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="info-section">
                        <h4>✈️ Пожелания</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>Класс перелёта:</label>
                            <span>
                              {item.flight === 'business' ? '✈️ Бизнес-класс' : 
                               item.flight === 'first' ? '💺 Первый класс' : '🚁 Частный самолёт'}
                            </span>
                          </div>
                          <div className="info-item">
                            <label>Категория отеля:</label>
                            <span>
                              {item.hotel === '4star' ? '🏨 4★ Люкс' : 
                               item.hotel === '5star' ? '⭐ 5★ Премиум' : '👑 Ультра-люкс'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="info-section">
                        <h4>👥 Пассажиры ({item.passengers?.length || 0})</h4>
                        <div className="passengers-table">
                          <table>
                            <thead>
                              <tr>
                                <th>№</th>
                                <th>ФИО</th>
                                <th>Возраст</th>
                                <th>Кем приходится</th>
                                <th>Документ</th>
                                <th>Стоимость</th>
                              </tr>
                            </thead>
                            <tbody>
                              {item.passengers?.map((p, idx) => (
                                <tr key={idx} className={idx === 0 ? 'main-passenger' : ''}>
                                  <td>{idx + 1}{idx === 0 && ' (главный)'}</td>
                                  <td><strong>{p.name}</strong></td>
                                  <td>{p.age} лет</td>
                                  <td>
                                    {p.relationship === 'self' ? '👤 Я' : 
                                     p.relationship === 'spouse' ? '💑 Супруг(а)' : 
                                     p.relationship === 'child' ? '👶 Ребёнок' : 
                                     p.relationship === 'parent' ? '👴👵 Родитель' : '🤝 Друг/Подруга'}
                                  </td>
                                  <td className="doc-number">{p.passportNumber || 'Не указан'}</td>
                                  <td className="passenger-price">
                                    {Math.round(p.price || (p.age < 14 ? item.tourPrice / 2 : item.tourPrice)).toLocaleString('ru-RU')} ₽
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                      {item.specialRequests && item.specialRequests !== 'Нет' && (
                        <div className="info-section">
                          <h4>💬 Особые пожелания</h4>
                          <div className="special-requests">{item.specialRequests}</div>
                        </div>
                      )}
                    </>
                  ) : (
                    // Блок для виз
                    <>
                      <div className="info-section">
                        <h4>👤 Личные данные</h4>
                        <div className="info-grid">
                          <div className="info-item">
                            <label>ФИО:</label>
                            <span>{item.fullName}</span>
                          </div>
                          <div className="info-item">
                            <label>📞 Телефон:</label>
                            <span className="main-phone">{item.phone}</span>
                          </div>
                          <div className="info-item">
                            <label>Email:</label>
                            <span>{item.email}</span>
                          </div>
                          <div className="info-item">
                            <label>Номер паспорта:</label>
                            <span>{item.passportNumber}</span>
                          </div>
                        </div>
                      </div>
                      <div className="info-section">
                        <h4>🌍 Информация о визе</h4>
                        <div className="info-grid">
                          <div className="info-item highlight">
                            <label>Страна:</label>
                            <span className="main-phone">{item.countryLabel || item.country}</span>
                          </div>
                          <div className="info-item">
                            <label>Тип визы:</label>
                            <span>{item.visaTypeLabel || item.visaType}</span>
                          </div>
                        </div>
                      </div>
                      {item.documentsLabels && item.documentsLabels.length > 0 && (
                        <div className="info-section">
                          <h4>📋 Необходимые документы</h4>
                          <div className="documents-list">
                            {item.documentsLabels.map((doc, idx) => (
                              <span key={idx} className="doc-tag">📄 {doc}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {item.additionalInfo && item.additionalInfo !== 'Нет' && (
                        <div className="info-section">
                          <h4>💬 Дополнительная информация</h4>
                          <div className="special-requests">{item.additionalInfo}</div>
                        </div>
                      )}
                    </>
                  )}
                  
                  {item.status === 'rejected' && item.rejectReason && (
                    <div className="info-section rejected-section">
                      <h4>❌ Причина отказа</h4>
                      <div className="reject-reason">{item.rejectReason}</div>
                    </div>
                  )}
                  
                  <div className="info-section">
                    <h4>📅 Даты</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Дата создания:</label>
                        <span>
                          {item.createdAt?.toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {item.contactedAt && (
                        <div className="info-item">
                          <label>Дата связи:</label>
                          <span>
                            {item.contactedAt?.toLocaleString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <div className="card-actions">
                {item.status === 'pending' && (
                  <>
                    <button 
                      onClick={() => requestType === 'tours' ? updateStatus(item.id, 'confirmed') : updateVisaStatus(item.id, 'confirmed')} 
                      className="confirm-btn"
                    >
                      ✓ Подтвердить
                    </button>
                    <button 
                      onClick={() => openRejectModal(item)} 
                      className="reject-btn"
                    >
                      ✗ Отказать
                    </button>
                  </>
                )}

                {(item.status === 'confirmed' || item.status === 'rejected') && (
                  <>
                    <button 
                      onClick={() => toggleContacted(item.id, item.contacted, requestType)} 
                      className={`contact-toggle-btn ${item.contacted ? 'contacted' : ''}`}
                    >
                      {item.contacted ? '📞✓ Связались (снять)' : '📞 Отметить, что связались'}
                    </button>
                    <button 
                      onClick={() => requestType === 'tours' ? updateStatus(item.id, 'pending') : updateVisaStatus(item.id, 'pending')} 
                      className="pending-btn"
                    >
                      🔄 Вернуть в обработку
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {/* ОТЗЫВЫ НА МОДЕРАЦИЮ */}
          {reviewsTab && reviews.map(review => (
            <div key={review.id} className={`admin-booking-card review-card-admin ${review.status}`}>
              <div className="card-header" onClick={() => toggleExpand(review.id)}>
                <div className="header-left">
                  <span className="booking-id">#{review.id.slice(-8).toUpperCase()}</span>
                  <span className="review-badge">⭐ Отзыв</span>
                  <span className={`status-badge ${review.status || 'pending'}`}>
                    {review.status === 'pending' && '⏳ На модерации'}
                    {review.status === 'approved' && '✓ Одобрен'}
                    {review.status === 'rejected' && '✗ Отклонён'}
                  </span>
                </div>
                <div className="header-right">
                  <span className="booking-date">{review.createdAt?.toLocaleDateString('ru-RU')}</span>
                  <span className={`expand-icon ${expandedItem === review.id ? 'expanded' : ''}`}>▼</span>
                </div>
              </div>
              
              {expandedItem === review.id && (
                <div className="card-content">
                  <div className="info-section">
                    <h4>⭐ Информация об отзыве</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Тур:</label>
                        <span className="tour-link">{review.tourName}</span>
                      </div>
                      <div className="info-item">
                        <label>Пользователь:</label>
                        <span>{review.userName}</span>
                      </div>
                      <div className="info-item">
                        <label>Оценка:</label>
                        <span className="rating-stars">{'⭐'.repeat(review.rating)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h4>💬 Комментарий</h4>
                    <div className="review-comment-admin">{review.comment}</div>
                  </div>
                  <div className="info-section">
                    <h4>📅 Дата</h4>
                    <div className="info-item">
                      <span>{review.createdAt?.toLocaleString('ru-RU')}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="card-actions">
                {review.status === 'pending' && (
                  <>
                    <button onClick={() => approveReview(review.id)} className="confirm-btn">✓ Одобрить</button>
                    <button onClick={() => rejectReview(review.id)} className="reject-btn">✗ Отклонить</button>
                  </>
                )}
                <button onClick={() => deleteReview(review.id)} className="delete-btn">🗑 Удалить</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Модальное окно отказа */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Отказ в {requestType === 'tours' ? 'бронировании' : 'визовой поддержке'}</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Вы отклоняете заявку:</p>
              <div className="modal-booking-info">
                <strong>{requestType === 'tours' ? selectedItem?.tourName : selectedItem?.countryLabel || 'Визовая заявка'}</strong>
                <span>Клиент: {selectedItem?.userName || selectedItem?.fullName || selectedItem?.userEmail}</span>
                <span>Телефон: {selectedItem?.mainPhone || selectedItem?.phone || 'Не указан'}</span>
              </div>
              <label>Укажите причину отказа:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Например: заявка отклонена, недостаточно документов, проблемы с оформлением и т.д."
                rows="4"
              />
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowRejectModal(false)}>Отмена</button>
              <button className="modal-confirm" onClick={handleReject}>Подтвердить отказ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;