let deliveryMap;

function initDeliveryMap() {
    // Инициализируем карту
    deliveryMap = L.map('delivery-map').setView([55.76, 37.64], 11);
    
    // Добавляем слой OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(deliveryMap);

    // Добавляем маркеры для активных доставок
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
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

document.addEventListener('DOMContentLoaded', () => {
    const orders = JSON.parse(localStorage.getItem('orders')) || [];
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
    
    deliveriesList.innerHTML = orders.map(order => {
        const date = new Date(order.date);
        const formattedDate = date.toLocaleString('ru-RU', {
            day: 'numeric',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Определяем прогресс доставки
        const progress = getDeliveryProgress(order.status);
        
        return `
            <div class="delivery-card">
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
                    <p class="delivery-address">${order.address}</p>
                    <div class="delivery-items">
                        ${Object.values(order.items).map(item => `
                            <div class="delivery-item">
                                <span>${item.name}</span>
                                <span>×${item.quantity}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    // Инициализируем карту
    initDeliveryMap();
});

function getDeliveryProgress(status) {
    switch (status) {
        case 'processing': return 33;
        case 'delivering': return 66;
        case 'completed': return 100;
        default: return 0;
    }
} 