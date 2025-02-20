let deliveryMap;
let orders = [];
let courierMarkers = new Map(); // Для хранения маркеров курьеров

// Константы
const RESTAURANT_LOCATION = [55.753994, 37.622093]; // Ресторан на Маросейке
const DELIVERY_SPEED = 300; // Скорость движения курьера
const PHONE_NUMBER = '+7 (999) 123-45-67';
const ZOOM_LEVEL = 15; // Уровень приближения карты
const COURIER_EMOJI = '🚗'; // Эмодзи для курьера

// Функция генерации случайного ресторана
function generateRandomRestaurant(deliveryLocation) {
    // Генерируем случайное смещение в пределах ~2км
    const offset = 0.02;
    const lat = deliveryLocation[0] + (Math.random() - 0.5) * offset;
    const lng = deliveryLocation[1] + (Math.random() - 0.5) * offset;
    
    return {
        location: [lat, lng]
    };
}

function initDeliveryMap() {
    deliveryMap = L.map('delivery-map').setView([55.76, 37.64], 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(deliveryMap);

    // Добавляем маркеры только для активных доставок
    const deliveringOrders = orders.filter(o => o.status === 'delivering');
    
    // Массив для хранения всех маркеров
    const markers = [];
    
    deliveringOrders.forEach(async (order) => {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.address)}&format=json`);
            const data = await response.json();
            
            if (data.length > 0) {
                const { lat, lon } = data[0];
                const marker = L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: 'delivery-marker',
                        html: '<div class="marker-content">🚚</div>'
                    })
                }).addTo(deliveryMap);
                
                markers.push(marker);
                
                // Если есть маркеры, центрируем карту по ним
                if (markers.length > 0) {
                    const group = L.featureGroup(markers);
                    deliveryMap.fitBounds(group.getBounds().pad(0.1));
                }
            }
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
        }
    });
}

// Функция для получения маршрута между двумя точками
async function getRoute(from, to) {
    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`);
        const data = await response.json();
        return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    } catch (error) {
        console.error('Ошибка получения маршрута:', error);
        return [from, to]; // Возвращаем прямую линию если ошибка
    }
}

// Функция для обновления UI заказа
function updateDeliveryUI(orderId, newStatus) {
    const orderElement = document.querySelector(`[data-order-id="${orderId}"]`);
    if (!orderElement) return;

    // Обновляем статус в массиве заказов
    const orderIndex = orders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        orders[orderIndex].status = newStatus;
        // Обновляем отображение всех заказов
        updateOrdersDisplay();
    }

    // Обновляем прогресс-бар и статусы
    const progressLine = orderElement.querySelector('.progress-line-fill');
    const statusSteps = orderElement.querySelectorAll('.status-step');
    
    let progress = getDeliveryProgress(newStatus);
    progressLine.style.width = `${progress}%`;
    
    statusSteps.forEach((step, index) => {
        if (index * 33 <= progress) {
            step.classList.add('active');
            if (index * 33 < progress) {
                step.classList.add('completed');
            }
        }
    });

    // Добавляем плавную анимацию при перемещении
    orderElement.style.transition = 'all 0.5s ease';
}

// Обновим сортировку заказов
function sortOrders(orders) {
    return orders.sort((a, b) => {
        // Сначала сортируем по статусу
        const statusOrder = {
            'processing': 0,
            'delivering': 1,
            'completed': 2
        };
        
        if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        
        // Затем по дате (новые сверху)
        return new Date(b.date) - new Date(a.date);
    });
}

// Обновим функцию симуляции доставки
function simulateDelivery(orderId, deliveryChain) {
    const statuses = ['processing', 'delivering', 'completed'];
    let currentStatusIndex = 0;

    const updateStatus = async () => {
        currentStatusIndex++;
        if (currentStatusIndex >= statuses.length) {
            return;
        }

        const newStatus = statuses[currentStatusIndex];
        const block = await deliveryChain.updateDeliveryStatus(orderId, newStatus);
        
        // Обновляем статус в localStorage
        const orders = JSON.parse(localStorage.getItem('orders')) || [];
        const orderIndex = orders.findIndex(o => o.id === orderId);
        if (orderIndex !== -1) {
            orders[orderIndex].status = newStatus;
            localStorage.setItem('orders', JSON.stringify(orders));
        }
        
        // Обновляем UI
        updateDeliveryUI(orderId, newStatus);
        
        // Запускаем анимацию доставки
        if (newStatus === 'delivering') {
            await simulateCourierMovement(orderId);
            // После завершения маршрута переходим к следующему статусу
            setTimeout(updateStatus, 2000);
        } else {
            setTimeout(updateStatus, 5000); // Следующий статус через 5 секунд
        }
    };

    // Начинаем с небольшой задержкой
    setTimeout(updateStatus, 2000);
}

// Обновим функцию поиска ближайшего ресторана
function findNearestRestaurant(deliveryLocation) {
    // Генерируем 3 случайных ресторана
    const restaurants = Array.from({ length: 3 }, () => generateRandomRestaurant(deliveryLocation));
    
    // Находим ближайший
    return restaurants.reduce((nearest, restaurant) => {
        const distance = Math.sqrt(
            Math.pow(restaurant.location[0] - deliveryLocation[0], 2) +
            Math.pow(restaurant.location[1] - deliveryLocation[1], 2)
        );
        
        if (!nearest || distance < nearest.distance) {
            return { ...restaurant, distance };
        }
        return nearest;
    }, null);
}

// Обновленная функция симуляции движения курьера
async function simulateCourierMovement(orderId) {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    let deliveryLocation;
    
    // Используем сохраненные координаты, если есть
    if (order.coordinates) {
        deliveryLocation = [order.coordinates.lat, order.coordinates.lng];
    } else {
        try {
            const fullAddress = `Москва, ${order.address}`;
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(fullAddress)}&format=json`);
            const data = await response.json();
            
            if (data.length > 0) {
                deliveryLocation = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            } else {
                console.warn('Адрес не найден, используем запасные координаты');
                deliveryLocation = [55.753994, 37.622093];
            }
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            deliveryLocation = [55.753994, 37.622093];
        }
    }

    // Находим ближайший ресторан
    const nearestRestaurant = findNearestRestaurant(deliveryLocation);
    
    // Получаем маршрут
    const route = await getRoute(nearestRestaurant.location, deliveryLocation);

    // Создаем или обновляем маркер курьера
    let courierMarker = courierMarkers.get(orderId);
    if (!courierMarker) {
        courierMarker = L.marker(nearestRestaurant.location, {
            icon: L.divIcon({
                className: 'courier-marker',
                html: '<div class="courier-icon">🚗</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20],
                popupAnchor: [0, -20]
            })
        }).addTo(deliveryMap);
        
        // Добавим всплывающую подсказку
        courierMarker.bindPopup('Ваш заказ в пути');
        courierMarkers.set(orderId, courierMarker);
    }

    // Создаем анимированную линию маршрута
    const routeLine = L.polyline(route, {
        color: '#2962FF',
        weight: 4,
        opacity: 0.8,
        className: 'courier-route'
    }).addTo(deliveryMap);

    // Центрируем карту на маршруте
    deliveryMap.fitBounds(routeLine.getBounds(), {
        padding: [50, 50],
        maxZoom: 15
    });

    // Добавляем маркеры ресторана и точки доставки
    const restaurantMarker = L.marker(nearestRestaurant.location, {
        icon: L.divIcon({
            className: 'restaurant-marker',
            html: '<div class="marker-icon">🏪</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(deliveryMap)
    .bindPopup(nearestRestaurant.name);

    const destinationMarker = L.marker(deliveryLocation, {
        icon: L.divIcon({
            className: 'destination-marker',
            html: '<div class="marker-icon">📍</div>',
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        })
    }).addTo(deliveryMap)
    .bindPopup(order.address);

    // Анимируем движение по маршруту
    for (let i = 0; i < route.length; i++) {
        courierMarker.setLatLng(route[i]);
        
        // Поворачиваем иконку в направлении движения
        if (i < route.length - 1) {
            const angle = getAngle(route[i], route[i + 1]);
            const icon = courierMarker.getElement().querySelector('.courier-icon');
            if (icon) {
                icon.style.transform = `rotate(${angle}deg)`;
            }
        }

        // Следим за курьером с приближением
        deliveryMap.setView(route[i], ZOOM_LEVEL, {
            animate: true,
            duration: 1,
            easeLinearity: 0.5
        });

        await new Promise(resolve => setTimeout(resolve, DELIVERY_SPEED));
    }

    // Плавно удаляем все элементы
    routeLine.setStyle({ opacity: 0 });
    setTimeout(() => {
        routeLine.remove();
        courierMarker.remove();
        restaurantMarker.remove();
        destinationMarker.remove();
        courierMarkers.delete(orderId);
    }, 500);

    return true;
}

// Функция для расчета угла поворота
function getAngle(from, to) {
    const dx = to[1] - from[1];
    const dy = to[0] - from[0];
    return Math.atan2(dx, dy) * 180 / Math.PI;
}

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', async () => {
    // Загружаем заказы
    orders = JSON.parse(localStorage.getItem('orders')) || [];
    
    // Инициализируем блокчейн
    const deliveryChain = new DeliveryChain();

    // Отображаем заказы
    const deliveriesList = document.querySelector('.deliveries-list');
    
    if (orders.length === 0) {
        deliveriesList.innerHTML = `
            <div class="empty-deliveries">
                <p>У вас пока нет доставок</p>
                <a href="index.html" class="primary-button">Сделать заказ</a>
            </div>
        `;
        return;
    }

    // Сортируем заказы перед группировкой
    orders = sortOrders(orders);

    // Группируем отсортированные заказы
    const groupedOrders = {
        processing: orders.filter(o => o.status === 'processing'),
        delivering: orders.filter(o => o.status === 'delivering'),
        completed: orders.filter(o => o.status === 'completed')
    };

    // Создаем разделы для каждого статуса
    deliveriesList.innerHTML = `
        ${groupedOrders.processing.length ? 
            createCollapsibleSection('processing', 'готовятся', renderOrders(groupedOrders.processing))
        : ''}
        
        ${groupedOrders.delivering.length ? 
            createCollapsibleSection('delivering', 'в пути', renderOrders(groupedOrders.delivering))
        : ''}
        
        ${groupedOrders.completed.length ? 
            createCollapsibleSection('completed', 'доставлены', renderOrders(groupedOrders.completed))
        : ''}
    `;

    // Инициализируем карту
    initDeliveryMap();

    // Запускаем симуляцию доставки для всех заказов
    orders.forEach(order => {
        if (order.status !== 'completed') {
            simulateDelivery(order.id, deliveryChain);
        }
    });

    // Добавим обработчик переключения режимов
    const modeSwitch = document.getElementById('blockchainMode');
    
    modeSwitch.addEventListener('change', (e) => {
        document.body.classList.toggle('classic-mode', !e.target.checked);
        updateOrdersDisplay();
    });
});

// Функция для создания сворачиваемых секций
function createCollapsibleSection(status, title, content) {
    const isExpanded = status === 'delivering' || status === 'processing';
    return `
        <div class="deliveries-section" data-status="${status}">
            <div class="section-header" onclick="toggleSection(this)">
                <h2>${title}</h2>
                <span class="toggle-icon">${isExpanded ? '▼' : '▶'}</span>
            </div>
            <div class="section-content ${isExpanded ? 'expanded' : ''}">
                ${content}
            </div>
        </div>
    `;
}

// Функция переключения секции
function toggleSection(header) {
    const content = header.nextElementSibling;
    const icon = header.querySelector('.toggle-icon');
    const isExpanded = content.classList.contains('expanded');
    
    content.classList.toggle('expanded');
    icon.textContent = isExpanded ? '▶' : '▼';
}

// Функция для рендеринга заказов
function renderOrders(orders) {
    const isClassicMode = document.body.classList.contains('classic-mode');
    
    return orders.map(order => {
        const date = new Date(order.date);
        const formattedDate = date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (isClassicMode) {
            // Классический вид
            const totalPrice = Object.values(order.items)
                .reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const estimatedDelivery = new Date(date.getTime() + 60 * 60 * 1000)
                .toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

            return `
                <div class="delivery-card" data-order-id="${order.id}">
                    <div class="delivery-order-info">
                        <h3>заказ #${order.id}</h3>
                        <p>адрес: ${order.address}</p>
                        <p>сумма заказа: ${totalPrice} ₽</p>
                        <p>примерное время доставки: ${estimatedDelivery}</p>
                        <div class="delivery-contact">
                            <p>телефон для справок:</p>
                            <p>${PHONE_NUMBER}</p>
                        </div>
                    </div>
                    <div class="delivery-items">
                        ${Object.entries(order.items).map(([id, item]) => `
                            <div class="delivery-item">
                                <img src="${item.image}" alt="${item.name}">
                                <div class="delivery-item-info">
                                    <span class="delivery-item-name">${item.name}</span>
                                    <span class="delivery-item-quantity">×${item.quantity}</span>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            // Существующий блокчейн вид
            const progress = getDeliveryProgress(order.status);
            
            return `
                <div class="delivery-card" data-order-id="${order.id}">
                    <div class="delivery-status-timeline">
                        <div class="progress-line">
                            <div class="progress-line-fill" style="width: ${progress}%"></div>
                        </div>
                        
                        <div class="status-step ${progress >= 0 ? 'active' : ''} ${progress >= 33 ? 'completed' : ''}">
                            <div class="status-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="status-text">
                                принят
                                <div class="status-time">${formattedDate}</div>
                            </div>
                        </div>
                        
                        <div class="status-step ${progress >= 33 ? 'active' : ''} ${progress >= 66 ? 'completed' : ''}">
                            <div class="status-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="status-text">
                                готовится
                                ${progress >= 33 ? `<div class="status-time">21:37</div>` : ''}
                            </div>
                        </div>
                        
                        <div class="status-step ${progress >= 66 ? 'active' : ''} ${progress >= 100 ? 'completed' : ''}">
                            <div class="status-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="status-text">
                                в пути
                                ${progress >= 66 ? `<div class="status-time">21:45</div>` : ''}
                            </div>
                        </div>
                        
                        <div class="status-step ${progress >= 100 ? 'active completed' : ''}">
                            <div class="status-icon">
                                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 15.5H7.5C6.10444 15.5 5.40665 15.5 4.83886 15.6722C3.56045 16.06 2.56004 17.0605 2.17224 18.3389C2 18.9067 2 19.6044 2 21M19 21V15M16 18H22M14.5 7.5C14.5 9.98528 12.4853 12 10 12C7.51472 12 5.5 9.98528 5.5 7.5C5.5 5.01472 7.51472 3 10 3C12.4853 3 14.5 5.01472 14.5 7.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                            </div>
                            <div class="status-text">
                                доставлен
                                ${progress >= 100 ? `<div class="status-time">22:00</div>` : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="delivery-info">
                        <p class="delivery-date">${formattedDate}</p>
                        <p class="delivery-address">${order.address}</p>
                        <div class="delivery-items">
                            ${Object.entries(order.items).map(([id, item]) => `
                                <div class="delivery-item">
                                    <img src="${item.image}" alt="${item.name}">
                                    <div class="delivery-item-info">
                                        <span class="delivery-item-name">${item.name}</span>
                                        <span class="delivery-item-quantity">×${item.quantity}</span>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            `;
        }
    }).join('');
}

function getDeliveryProgress(status) {
    switch (status) {
        case 'processing': return 33;
        case 'delivering': return 66;
        case 'completed': return 100;
        default: return 0;
    }
}

class DeliveryChain extends Blockchain {
    constructor() {
        super();
        this.difficulty = 1; // Упрощаем для демонстрации
    }

    async createDeliveryBlock(order) {
        await this.addTransaction(
            'store',
            order.address,
            order.items,
            order.status
        );
        await this.minePendingTransactions();
        return this.getLatestBlock();
    }

    async updateDeliveryStatus(orderId, newStatus) {
        const block = await this.createDeliveryBlock({
            id: orderId,
            status: newStatus,
            timestamp: Date.now()
        });
        return block;
    }
}

// Обновим функцию обновления статуса
function updateOrdersDisplay() {
    // Сортируем заказы
    orders = sortOrders(orders);
    
    // Обновляем localStorage
    localStorage.setItem('orders', JSON.stringify(orders));
    
    // Группируем заказы
    const groupedOrders = {
        processing: orders.filter(o => o.status === 'processing'),
        delivering: orders.filter(o => o.status === 'delivering'),
        completed: orders.filter(o => o.status === 'completed')
    };

    // Обновляем DOM
    const deliveriesList = document.querySelector('.deliveries-list');
    deliveriesList.innerHTML = `
        ${groupedOrders.processing.length ? 
            createCollapsibleSection('processing', 'готовятся', renderOrders(groupedOrders.processing))
        : ''}
        
        ${groupedOrders.delivering.length ? 
            createCollapsibleSection('delivering', 'в пути', renderOrders(groupedOrders.delivering))
        : ''}
        
        ${groupedOrders.completed.length ? 
            createCollapsibleSection('completed', 'доставлены', renderOrders(groupedOrders.completed))
        : ''}
    `;
} 