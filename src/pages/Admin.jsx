import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy, updateDoc, doc } from 'firebase/firestore';
import './Admin.css';

const Admin = () => {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [expandedBooking, setExpandedBooking] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

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

  const toggleContacted = async (id, currentContacted) => {
    try {
      if (!currentContacted) {
        await updateDoc(doc(db, 'bookings', id), { 
          contacted: true,
          contactedAt: new Date()
        });
      } else {
        await updateDoc(doc(db, 'bookings', id), { 
          contacted: false,
          contactedAt: null
        });
      }
      fetchBookings();
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
      await updateDoc(doc(db, 'bookings', selectedBooking.id), { 
        status: 'rejected',
        rejectReason: rejectReason,
        rejectedAt: new Date()
      });
      setShowRejectModal(false);
      setSelectedBooking(null);
      setRejectReason('');
      fetchBookings();
    } catch (error) {
      console.error("Error rejecting booking:", error);
    }
  };

  const openRejectModal = (booking) => {
    setSelectedBooking(booking);
    setShowRejectModal(true);
    setRejectReason('');
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'pending') return (booking.status === 'pending' || !booking.status);
    if (activeTab === 'confirmed') return booking.status === 'confirmed';
    if (activeTab === 'rejected') return booking.status === 'rejected';
    return true;
  });

  const getStatusCount = () => {
    return {
      pending: bookings.filter(b => b.status === 'pending' || !b.status).length,
      confirmed: bookings.filter(b => b.status === 'confirmed').length,
      rejected: bookings.filter(b => b.status === 'rejected').length
    };
  };

  const toggleExpand = (id) => {
    setExpandedBooking(expandedBooking === id ? null : id);
  };

  const counts = getStatusCount();

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>Панель администратора</h1>
        <p>Управление заявками на бронирование</p>
      </div>

      <div className="admin-tabs">
        <button 
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <span className="tab-icon"></span>
          В обработке
          <span className="tab-count">{counts.pending}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'confirmed' ? 'active' : ''}`}
          onClick={() => setActiveTab('confirmed')}
        >
          <span className="tab-icon"></span>
          Подтверждённые
          <span className="tab-count">{counts.confirmed}</span>
        </button>
        <button 
          className={`tab ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          <span className="tab-icon"></span>
          Отказано
          <span className="tab-count">{counts.rejected}</span>
        </button>
      </div>

      {loading ? (
        <div className="admin-loading">
          <div className="spinner"></div>
          <p>Загрузка заявок...</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="admin-empty">
          <div className="empty-icon"></div>
          <h3>Нет заявок</h3>
          <p>В этом разделе пока нет заявок</p>
        </div>
      ) : (
        <div className="admin-bookings">
          {filteredBookings.map(booking => (
            <div key={booking.id} className={`admin-booking-card ${booking.status === 'rejected' ? 'rejected' : ''} ${booking.contacted ? 'contacted' : ''}`}>
              <div className="card-header" onClick={() => toggleExpand(booking.id)}>
                <div className="header-left">
                  <span className="booking-id">#{booking.id.slice(-8).toUpperCase()}</span>
                  <span className={`status-badge ${booking.status || 'pending'}`}>
                    {booking.status === 'pending' && 'В обработке'}
                    {booking.status === 'confirmed' && 'Подтверждён'}
                    {booking.status === 'rejected' && 'Отказано'}
                    {!booking.status && 'В обработке'}
                  </span>
                  {booking.contacted && (
                    <span className="contacted-badge">
                      Связались {booking.contactedAt?.toLocaleDateString('ru-RU')}
                    </span>
                  )}
                </div>
                <div className="header-right">
                  <span className="booking-date">
                    {booking.createdAt?.toLocaleDateString('ru-RU')}
                  </span>
                  <span className={`expand-icon ${expandedBooking === booking.id ? 'expanded' : ''}`}>▼</span>
                </div>
              </div>
              {expandedBooking === booking.id && (
                <div className="card-content">
                  <div className="info-section">
                    <h4>Информация о туре</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Название тура:</label>
                        <span>{booking.tourName}</span>
                      </div>
                      <div className="info-item">
                        <label>Страна / Город:</label>
                        <span>{booking.tourCountry}, {booking.tourCity}</span>
                      </div>
                      <div className="info-item">
                        <label>Стоимость тура:</label>
                        <span className="price">{booking.tourPrice?.toLocaleString('ru-RU')} ₽</span>
                      </div>
                      <div className="info-item">
                        <label>Общая стоимость:</label>
                        <span className="total-price">{booking.totalPrice?.toLocaleString('ru-RU')} ₽</span>
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h4>Информация о клиенте</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>ФИО:</label>
                        <span>{booking.userName || booking.userEmail}</span>
                      </div>
                      <div className="info-item">
                        <label>Email:</label>
                        <span>{booking.userEmail}</span>
                      </div>
                      <div className="info-item highlight">
                        <label>Телефон для связи (главный пассажир):</label>
                        <span className="main-phone">{booking.mainPhone || 'Не указан'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h4>Пожелания по перелёту и проживанию</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Класс перелёта:</label>
                        <span>
                          {booking.flight === 'business' ? 'Бизнес-класс' : 
                           booking.flight === 'first' ? 'Первый класс' : 'Частный самолёт'}
                        </span>
                      </div>
                      <div className="info-item">
                        <label>Категория отеля:</label>
                        <span>
                          {booking.hotel === '4star' ? '4★ Люкс' : 
                           booking.hotel === '5star' ? '5★ Премиум' : 'Ультра-люкс'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="info-section">
                    <h4>Пассажиры ({booking.passengers?.length || 0})</h4>
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
                          {booking.passengers?.map((p, idx) => (
                            <tr key={idx} className={idx === 0 ? 'main-passenger' : ''}>
                              <td>{idx + 1}{idx === 0 && ' (главный)'}</td>
                              <td><strong>{p.name}</strong></td>
                              <td>{p.age} лет</td>
                              <td>
                                {p.relationship === 'self' ? 'Я' : 
                                 p.relationship === 'spouse' ? 'Супруг(а)' : 
                                 p.relationship === 'child' ? 'Ребёнок' : 
                                 p.relationship === 'parent' ? 'Родитель' : 'Друг/Подруга'}
                              </td>
                              <td className="doc-number">
                                {p.passportNumber || 'Не указан'}
                              </td>
                              <td className="passenger-price">
                                {Math.round(p.price || (p.age < 14 ? booking.tourPrice / 2 : booking.tourPrice)).toLocaleString('ru-RU')} ₽
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  {booking.specialRequests && booking.specialRequests !== 'Нет' && (
                    <div className="info-section">
                      <h4>Особые пожелания</h4>
                      <div className="special-requests">
                        {booking.specialRequests}
                      </div>
                    </div>
                  )}
                  {booking.status === 'rejected' && booking.rejectReason && (
                    <div className="info-section rejected-section">
                      <h4>Причина отказа</h4>
                      <div className="reject-reason">
                        {booking.rejectReason}
                      </div>
                    </div>
                  )}
                  <div className="info-section">
                    <h4>Даты</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Дата создания заявки:</label>
                        <span>
                          {booking.createdAt?.toLocaleString('ru-RU', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      {booking.contactedAt && (
                        <div className="info-item">
                          <label>Дата связи:</label>
                          <span>
                            {booking.contactedAt?.toLocaleString('ru-RU', {
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
                {booking.status === 'pending' && (
                  <>
                    <button onClick={() => updateStatus(booking.id, 'confirmed')} className="confirm-btn">
                      Подтвердить
                    </button>
                    <button onClick={() => openRejectModal(booking)} className="reject-btn">
                      Отказать
                    </button>
                  </>
                )}

                {(booking.status === 'confirmed' || booking.status === 'rejected') && (
                  <>
                    <button 
                      onClick={() => toggleContacted(booking.id, booking.contacted)} 
                      className={`contact-toggle-btn ${booking.contacted ? 'contacted' : ''}`}
                    >
                      {booking.contacted ? (
                        <>Связались (снять отметку)</>
                      ) : (
                        <>Отметить, что связались</>
                      )}
                    </button>
                    <button onClick={() => updateStatus(booking.id, 'pending')} className="pending-btn">
                      Вернуть в обработку
                    </button>
                  </>
                )}
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
              <h3>Отказ в бронировании</h3>
              <button className="modal-close" onClick={() => setShowRejectModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Вы отклоняете заявку:</p>
              <div className="modal-booking-info">
                <strong>{selectedBooking?.tourName}</strong>
                <span>Клиент: {selectedBooking?.userName || selectedBooking?.userEmail}</span>
                <span>Телефон для связи: {selectedBooking?.mainPhone || selectedBooking?.userPhone || 'Не указан'}</span>
              </div>
              <label>Укажите причину отказа:</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Например: тур забронирован, недостаточно мест, проблемы с документами и т.д."
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