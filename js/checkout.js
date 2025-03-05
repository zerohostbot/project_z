let map, marker;
let confirmAddressBtn; // Объявляем глобально

function initMap() {
    // Пробуем получить местоположение пользователя
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                map = L.map('map').setView([latitude, longitude], 13);
                initMapLayers();
            },
            (error) => {
                // Если не удалось получить местоположение, используем центр Москвы
                map = L.map('map').setView([55.751244, 37.618423], 11);
                initMapLayers();
            }
        );
    } else {
        // Если геолокация не поддерживается
        map = L.map('map').setView([55.751244, 37.618423], 11);
        initMapLayers();
    }
}

function initMapLayers() {
    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    const addressInput = document.getElementById('address');

    // Обработчик клика по карте
    map.on('click', async (e) => {
        const { lat, lng } = e.latlng;
        
        // Удаляем старый маркер если есть
        if (marker) {
            map.removeLayer(marker);
        }
        
        // Создаем новый маркер
        marker = L.marker([lat, lng], {
            draggable: true
        }).addTo(map);
        
        // Получаем адрес по координатам
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ru`);
            const data = await response.json();
            addressInput.value = data.display_name;
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
        }

        // Обработчик перетаскивания маркера
        marker.on('dragend', async () => {
            const pos = marker.getLatLng();
            try {
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.lat}&lon=${pos.lng}&format=json&accept-language=ru`);
                const data = await response.json();
                addressInput.value = data.display_name;
            } catch (error) {
                console.error('Ошибка геокодирования:', error);
            }
        });
    });

    // Поиск по адресу
    addressInput.addEventListener('change', async () => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(addressInput.value)}&format=json&accept-language=ru`);
            const data = await response.json();
            
            if (data.length > 0) {
                const { lat, lon } = data[0];
                
                if (marker) {
                    map.removeLayer(marker);
                }
                
                marker = L.marker([lat, lon], {
                    draggable: true
                }).addTo(map);
                
                map.setView([lat, lon], 16);
            }
        } catch (error) {
            console.error('Ошибка поиска:', error);
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // Проверяем наличие корзины и заказа
    const savedCart = localStorage.getItem('cart');
    const currentOrder = localStorage.getItem('currentOrder');
    
    if (!savedCart || !currentOrder) {
        // Если нет данных, возвращаемся на главную
        window.location.href = 'index.html';
        return;
    }
    
    // Загружаем корзину
    const cart = JSON.parse(savedCart);
    
    // Инициализируем кнопку подтверждения адреса
    confirmAddressBtn = document.querySelector('.confirm-address');
    
    // Отображаем товары
    updateCheckoutCart(cart);
    
    // Обработчик подтверждения адреса
    confirmAddressBtn.addEventListener('click', () => {
        const addressInput = document.getElementById('address');
        if (addressInput.value.trim().length < 5) {
            showNotification('введите корректный адрес');
            return;
        }
        confirmAddressBtn.classList.add('success');
        addressInput.disabled = true;
    });

    // Обработчики для методов оплаты
    document.querySelectorAll('.payment-method').forEach(button => {
        button.addEventListener('click', async (e) => {
            // Проверяем, что адрес подтвержден
            if (!confirmAddressBtn.classList.contains('success')) {
                showNotification('сначала подтвердите адрес доставки');
                return;
            }
            
            const method = button.dataset.method;
            const addressInput = document.getElementById('address');
            
            // Начинаем анимацию загрузки
            button.classList.add('loading');
            
            // Имитируем процесс оплаты
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Показываем успех
            button.classList.remove('loading');
            button.classList.add('success');
            
            // Создаем заказ
            const order = {
                id: JSON.parse(localStorage.getItem('currentOrder')).id,
                items: cart.items,
                address: addressInput.value,
                paymentMethod: method,
                status: 'processing',
                date: new Date().toISOString()
            };
            
            // Сохраняем заказ
            const orders = JSON.parse(localStorage.getItem('orders') || '[]');
            // Проверяем, нет ли уже такого заказа
            if (!orders.some(o => o.id === order.id)) {
                orders.push(order);
                localStorage.setItem('orders', JSON.stringify(orders));
            }
            
            // Очищаем корзину
            localStorage.setItem('cart', JSON.stringify({ items: {} }));
            
            // Показываем уведомление об успехе
            showSuccessPopup(() => {
                window.location.href = './deliveries.html';
            });
        });
    });
});

function showSuccessPopup(callback) {
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
        <div class="success-popup-content">
            <div class="success-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path class="checkmark" d="M4 12L10 18L20 6" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </div>
            <h2>заказ оформлен</h2>
            <p class="redirect-text">переходим к отслеживанию доставки</p>
        </div>
    `;
    document.body.appendChild(popup);
    
    // Добавляем стили для попапа
    const style = document.createElement('style');
    style.textContent = `
        .success-popup {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        
        .success-popup-content {
            background: white;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            transform: translateY(20px);
            transition: transform 0.3s ease;
        }
        
        .success-icon {
            width: 80px;
            height: 80px;
            background: #4CAF50;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 24px;
            position: relative;
            transform: scale(0);
        }
        
        .success-icon svg {
            width: 40px;
            height: 40px;
        }
        
        .success-icon .checkmark {
            stroke-dasharray: 100;
            stroke-dashoffset: 100;
        }
        
        .success-popup h2 {
            font-size: 24px;
            margin-bottom: 12px;
            color: var(--text-color);
        }
        
        .success-popup p {
            color: var(--gray-dark);
            margin-bottom: 8px;
        }
        
        .redirect-text {
            margin-top: 16px;
            font-size: 14px;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.3s ease 0.5s;
        }
        
        .success-popup.visible {
            opacity: 1;
        }
        
        .success-popup.visible .success-popup-content {
            transform: translateY(0);
        }
        
        .success-popup.visible .success-icon {
            animation: scaleIn 0.3s ease forwards;
        }
        
        .success-popup.visible .checkmark {
            animation: drawCheck 0.6s ease 0.3s forwards;
        }
        
        .success-popup.visible .redirect-text {
            opacity: 1;
            transform: translateY(0);
        }
        
        @keyframes scaleIn {
            from { transform: scale(0); }
            to { transform: scale(1); }
        }
        
        @keyframes drawCheck {
            to { stroke-dashoffset: 0; }
        }
    `;
    document.head.appendChild(style);
    
    // Анимируем появление
    requestAnimationFrame(() => {
        popup.classList.add('visible');
    });
    
    // Переходим на страницу доставок через 3 секунды
    setTimeout(callback, 3000);
}

function updateCheckoutCart(cart) {
    const cartItems = document.querySelector('.cart-items-checkout');
    const subtotal = document.querySelector('.subtotal .amount');
    const deliveryCost = document.querySelector('.delivery-cost .amount');
    const total = document.querySelector('.total .amount');
    
    let totalAmount = 0;
    
    // Отображаем товары
    cartItems.innerHTML = Object.entries(cart.items).map(([id, item]) => {
        totalAmount += item.price * item.quantity;
        return `
            <div class="cart-item" data-id="${id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-info">
                    <h3>${item.name}</h3>
                    <p>${item.price} ₽ × ${item.quantity}</p>
                </div>
                <div class="item-total">${item.price * item.quantity} ₽</div>
            </div>
        `;
    }).join('');
    
    // Обновляем суммы
    const delivery = 199;
    subtotal.textContent = `${totalAmount} ₽`;
    deliveryCost.textContent = `${delivery} ₽`;
    total.textContent = `${totalAmount + delivery} ₽`;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

// Запускаем инициализацию карты после загрузки DOM
document.addEventListener('DOMContentLoaded', initMap);

// В функции оформления заказа
document.querySelector('.checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const currentOrder = JSON.parse(localStorage.getItem('currentOrder'));
    if (!currentOrder) {
        window.location.href = 'index.html';
        return;
    }

    // Получаем адрес из формы и маркера
    const address = document.getElementById('address').value;
    const marker = window.deliveryMarker;
    
    if (!address || !marker) {
        showNotification('Укажите адрес доставки');
        return;
    }
    
    // Обновляем заказ с адресом и координатами
    currentOrder.address = address;
    currentOrder.coordinates = marker.getLatLng();
    
    // Обновляем заказ в общем списке заказов
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    const orderIndex = orders.findIndex(o => o.id === currentOrder.id);
    if (orderIndex !== -1) {
        orders[orderIndex] = currentOrder;
        localStorage.setItem('orders', JSON.stringify(orders));
    }

    // Очищаем корзину
    localStorage.removeItem('cart');
    localStorage.removeItem('currentOrder');

    // Переходим на страницу доставок
    window.location.href = 'deliveries.html';
}); 