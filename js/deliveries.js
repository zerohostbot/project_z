let deliveryMap;
let orders = [];
let courierMarkers = new Map(); // Для хранения маркеров курьеров

// Константы
const RESTAURANT_LOCATION = [55.753994, 37.622093]; // Ресторан на Маросейке
const DELIVERY_SPEED = 300; // Скорость движения курьера
const PHONE_NUMBER = '+7 (999) 123-45-67';
const ZOOM_LEVEL = 15; // Уровень приближения карты
const COURIER_EMOJI = '🚗'; // Эмодзи для курьера

// Класс для работы с блокчейном доставки
class BlockchainDelivery {
    constructor(delivery) {
        this.delivery = delivery;
        this.blockchainData = {
            transactionHash: this.generateHash(),
            smartContract: this.generateSmartContractAddress(),
            timestamps: [],
            verifications: []
        };
    }

    generateHash() {
        return '0x' + Math.random().toString(16).slice(2, 10) + 
               Date.now().toString(16) + 
               Math.random().toString(16).slice(2, 10);
    }

    generateSmartContractAddress() {
        return '0x' + Math.random().toString(16).slice(2, 40);
    }

    addVerification(stage) {
        const verification = {
            timestamp: Date.now(),
            stage: stage,
            verifier: '0x' + Math.random().toString(16).slice(2, 40),
            temperature: (Math.random() * 6 + 2).toFixed(1), // 2-8°C
            location: this.generateLocation()
        };
        this.blockchainData.verifications.push(verification);
        this.blockchainData.timestamps.push(verification.timestamp);
    }

    generateLocation() {
        // Генерируем координаты в пределах Москвы
        const moscowCenter = {
            lat: 55.7558,
            lng: 37.6173
        };
        const radius = 0.1; // примерно 10 км
        const lat = moscowCenter.lat + (Math.random() - 0.5) * radius;
        const lng = moscowCenter.lng + (Math.random() - 0.5) * radius;
        return { lat, lng };
    }

    getSmartContractDetails() {
        return {
            address: this.blockchainData.smartContract,
            conditions: {
                maxDeliveryTime: '2 hours',
                maxTemperature: '8°C',
                paymentAmount: this.delivery.total + ' RUB',
                paymentStatus: this.delivery.status === 'completed' ? 'EXECUTED' : 'PENDING'
            }
        };
    }

    getBlockchainInfo() {
        return {
            transactionHash: this.blockchainData.transactionHash,
            contract: this.getSmartContractDetails(),
            verifications: this.blockchainData.verifications,
            lastUpdate: Math.max(...this.blockchainData.timestamps)
        };
    }
}

// Класс для работы с блокчейном
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

// Функция генерации случайного ресторана
function generateRandomRestaurant(deliveryLocation) {
    // Генерируем случайное смещение в радиусе 1-3 км
    const radius = Math.random() * 2 + 1; // от 1 до 3 км
    const angle = Math.random() * Math.PI * 2; // случайный угол
    
    // Примерно 111 км на градус широты/долготы
    const lat = deliveryLocation[0] + (radius / 111) * Math.cos(angle);
    const lng = deliveryLocation[1] + (radius / 111) * Math.sin(angle);
    
    const restaurantNames = [
        'Магнит',
        'Перекресток',
        'Вкусвилл',
        'Дикси',
        'Пятёрочка',
    ];
    
    return {
        location: [lat, lng],
        name: restaurantNames[Math.floor(Math.random() * restaurantNames.length)]
    };
}

function initDeliveryMap() {
    deliveryMap = L.map('delivery-map').setView([55.76, 37.64], 11);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap'
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

// Функция для сохранения заказа
function saveOrder(order) {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
    const existingOrderIndex = orders.findIndex(o => o.id === order.id);
    
    if (existingOrderIndex !== -1) {
        orders[existingOrderIndex] = order;
    } else {
        orders.push(order);
    }
    
    localStorage.setItem('orders', JSON.stringify(orders));
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
            if (newStatus === 'completed') {
                orders[orderIndex].completedAt = new Date().toISOString();
            }
            localStorage.setItem('orders', JSON.stringify(orders));
        }
        
        // Обновляем UI
        updateDeliveryUI(orderId, newStatus);
        
        // Запускаем следующий статус через интервал
        setTimeout(updateStatus, newStatus === 'delivering' ? 10000 : 5000);
    };

    // Начинаем с небольшой задержкой
    setTimeout(updateStatus, 2000);
}

// Обновим функцию поиска ближайшего ресторана
function findNearestRestaurant(deliveryLocation) {
    // Генерируем 5 случайных ресторанов вокруг точки доставки
    const restaurants = Array.from({ length: 5 }, () => generateRandomRestaurant(deliveryLocation));
    
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
            const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(order.address)}&format=json`);
            const data = await response.json();
            
            if (data.length > 0) {
                deliveryLocation = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
            } else {
                console.error('Адрес не найден');
                return;
            }
        } catch (error) {
            console.error('Ошибка геокодирования:', error);
            return;
        }
    }

    // Находим ближайший ресторан к точке доставки
    const nearestRestaurant = findNearestRestaurant(deliveryLocation);
    
    // Получаем маршрут от ресторана до точки доставки
    const route = await getRoute(nearestRestaurant.location, deliveryLocation);

    // Создаем или обновляем маркер курьера
    let courierMarker = courierMarkers.get(orderId);
    if (!courierMarker) {
        courierMarker = L.marker(nearestRestaurant.location, {
            icon: L.divIcon({
                className: 'courier-marker',
                html: '<div class="courier-icon">🚗</div>',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
            })
        }).addTo(deliveryMap);
        
        courierMarker.bindPopup(`Курьер доставляет заказ #${order.id}`);
        courierMarkers.set(orderId, courierMarker);
    }

    // Создаем маркеры и линию маршрута
    const routeLine = L.polyline(route, {
        color: '#2962FF',
        weight: 4,
        opacity: 0.8
    }).addTo(deliveryMap);

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

    // Центрируем карту на маршруте
    deliveryMap.fitBounds(routeLine.getBounds(), {
        padding: [50, 50]
    });

    // Анимируем движение курьера
    for (let i = 0; i < route.length; i++) {
        courierMarker.setLatLng(route[i]);
        await new Promise(resolve => setTimeout(resolve, DELIVERY_SPEED));
    }

    // Плавно удаляем элементы
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
        const totalPrice = Object.values(order.items)
            .reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        const orderPageUrl = `order.html?id=${order.id}`;
        
        return `
            <div class="delivery-card" data-order-id="${order.id}">
                <div class="delivery-header">
                    <div class="order-info">
                        <div class="order-number">
                            <h3>
                                <a href="${orderPageUrl}" class="order-link">Заказ #${order.id}</a>
                            </h3>
                            <span class="status ${order.status}">${getStatusText(order.status)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="delivery-status-timeline">
                    <div class="progress-line">
                        <div class="progress-line-fill" style="width: ${getDeliveryProgress(order.status)}%"></div>
                    </div>
                    
                    <div class="status-steps">
                        ${getDeliverySteps(order.status).map((step, index) => `
                            <div class="status-step ${index * 33 <= getDeliveryProgress(order.status) ? 'active' : ''} ${index * 33 < getDeliveryProgress(order.status) ? 'completed' : ''}">
                                <div class="status-icon">
                                    ${getStatusIcon(step)}
                                </div>
                                <div class="status-text">
                                    ${step}
                                    <div class="status-time">${new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div class="smart-contract-status">
                    <p>Статус: <strong>${getDetailedStatus(order.status)}</strong></p>
                    <p>Сумма заказа: <strong>${totalPrice} ₽</strong></p>
                </div>
            </div>
        `;
    }).join('');
}

// Вспомогательная функция для получения шагов доставки
function getDeliverySteps(status) {
    const steps = ['ЗАКАЗ СОЗДАН', 'ОПЛАТА ПОДТВЕРЖДЕНА', 'ПЕРЕДАНО КУРЬЕРУ', 'ДОСТАВЛЕНО'];
    switch (status) {
        case 'processing':
            return steps.slice(0, 2);
        case 'delivering':
            return steps.slice(0, 3);
        case 'completed':
            return steps;
        default:
            return steps;
    }
}

function getDeliveryProgress(status) {
    switch (status) {
        case 'processing': return 33;
        case 'delivering': return 66;
        case 'completed': return 100;
        default: return 0;
    }
}

// Функция для показа уведомлений
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
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
    if (!deliveriesList) return;

    if (orders.length === 0) {
        deliveriesList.innerHTML = `
            <div class="empty-deliveries">
                <p>У вас пока нет доставок</p>
                <a href="index.html" class="primary-button">Сделать заказ</a>
            </div>
        `;
        return;
    }

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

    // Добавляем стили
    const style = document.createElement('style');
    style.textContent = `
        .order-link {
            color: var(--primary-color);
            text-decoration: none;
            transition: color 0.3s ease;
        }

        .order-link:hover {
            color: #1557b0;
            text-decoration: underline;
        }

        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--primary-color);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transform: translateY(100px);
            opacity: 0;
            transition: all 0.3s ease;
            z-index: 1000;
        }

        .notification.show {
            transform: translateY(0);
            opacity: 1;
        }
    `;
    document.head.appendChild(style);
}

// Добавим функцию для получения текста статуса
function getStatusText(status) {
    switch (status) {
        case 'processing': return 'готовится';
        case 'delivering': return 'в пути';
        case 'completed': return 'доставлен';
        default: return 'неизвестно';
    }
}

// Добавим функцию для получения детального статуса
function getDetailedStatus(status) {
    switch (status) {
        case 'processing':
            return 'в обработке';
        case 'delivering':
            return 'в пути';
        case 'completed':
            return 'выполнен';
        default:
            return 'неизвестно';
    }
}

// Функция для получения иконки статуса
function getStatusIcon(stage) {
    const icons = {
        'ЗАКАЗ СОЗДАН': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M12 3L13.9101 4.87147C14.3908 5.32918 15.0786 5.5 15.7754 5.5H18C19.1046 5.5 20 6.39543 20 7.5V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V7.5C4 6.39543 4.89543 5.5 6 5.5H8.22461C8.92139 5.5 9.60924 5.32918 10.0899 4.87147L12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        'ОПЛАТА ПОДТВЕРЖДЕНА': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        'СБОРКА ЗАВЕРШЕНА': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20.5 7.27783L12 12.0001M12 12.0001L3.5 7.27783M12 12.0001L12 21.5001M21 16.5001V7.50006C21 6.96963 20.7314 6.47545 20.2889 6.19213L12.7889 1.69213C12.3132 1.39839 11.6868 1.39839 11.2111 1.69213L3.71111 6.19213C3.26863 6.47545 3 6.96963 3 7.50006V16.5001C3 17.0305 3.26863 17.5247 3.71111 17.808L11.2111 22.308C11.6868 22.6018 12.3132 22.6018 12.7889 22.308L20.2889 17.808C20.7314 17.5247 21 17.0305 21 16.5001Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        'ПЕРЕДАНО КУРЬЕРУ': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 19L8 7M8 7L4 11M8 7L12 11M16 5V17M16 17L12 13M16 17L20 13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`,
        'ДОСТАВЛЕНО': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`
    };
    
    return icons[stage] || icons['ЗАКАЗ СОЗДАН'];
} 