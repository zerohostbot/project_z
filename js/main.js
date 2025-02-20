// Инициализация корзины как объекта
const cart = {
    items: {}
};

let products = {};
let currentSlide = 0;
const slides = [
    {
        image: 'https://placehold.co/400x400/e74c3c/ffffff/webp?text=Скидка&font=playfair',
        title: 'Скидка 20% на первый заказ',
        description: 'Используйте промокод: FIRST20'
    },
    {
        image: 'https://placehold.co/400x400/e74c3c/ffffff/webp?text=Доставка&font=playfair',
        title: 'Бесплатная доставка',
        description: 'При заказе от 1000 ₽'
    },
    {
        image: 'https://placehold.co/400x400/e74c3c/ffffff/webp?text=Выпечка&font=playfair',
        title: 'Свежая выпечка',
        description: 'Скидки до 25% на всю выпечку до 10:00'
    }
];

// Загружаем продукты из JSON
fetch('products.json')
    .then(response => response.json())
    .then(data => {
        products = data;
        // После загрузки данных показываем первую категорию
        showCategoryProducts('all');
    })
    .catch(error => console.error('Ошибка загрузки продуктов:', error));

// Функции
function showCategoryProducts(category) {
    const promoSlider = document.querySelector('.promo-slider');
    const productsGrid = document.querySelector('.products-grid');
    
    if (category === 'all') {
        promoSlider.style.display = 'block';
        productsGrid.style.display = 'none';
        return;
    }

    promoSlider.style.display = 'none';
    productsGrid.style.display = 'grid';
    productsGrid.style.opacity = '1';

    const categoryProducts = products[category] || [];
    
    productsGrid.innerHTML = categoryProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" 
                     alt="${product.name}" 
                     onerror="this.src='https://placehold.co/400x400/e74c3c/ffffff/webp?text=${encodeURIComponent(product.name)}&font=playfair'">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                <p>${product.description}</p>
                <div class="product-footer">
                    <span class="price">${product.price} ₽</span>
                    <button class="add-to-cart" aria-label="добавить в корзину">+</button>
                </div>
            </div>
        </div>
    `).join('');
}

function showCart() {
    const cartSidebar = document.querySelector('.cart-sidebar');
    cartSidebar.style.display = 'flex';
    setTimeout(() => {
        cartSidebar.classList.add('visible');
    }, 10);
}

function hideCart() {
    const cartSidebar = document.querySelector('.cart-sidebar');
    cartSidebar.classList.add('hiding');
    cartSidebar.classList.remove('visible');
    setTimeout(() => {
        cartSidebar.style.display = 'none';
        cartSidebar.classList.remove('hiding');
    }, 300);
}

function showNotification(message) {
    // Удаляем старое уведомление если оно есть
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Добавляем класс для появления
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Удаляем уведомление
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 2000);
}

function updateCart() {
    const cartItems = document.querySelector('.cart-items');
    const totalElement = document.querySelector('.total-price');
    const itemsCount = document.querySelector('.items-count');
    
    cartItems.innerHTML = '';
    let total = 0;
    let count = 0;
    
    Object.entries(cart.items).forEach(([id, item]) => {
        total += item.price * item.quantity;
        count += item.quantity;
        
        cartItems.innerHTML += `
            <div class="cart-item" data-id="${id}">
                <img src="${item.image}" alt="${item.name}">
                <div class="item-info">
                    <h4>${item.name}</h4>
                    <p>${item.price} ₽</p>
                </div>
                <div class="quantity-controls">
                    <button class="minus">−</button>
                    <span>${item.quantity}</span>
                    <button class="plus">+</button>
                </div>
            </div>
        `;
    });
    
    totalElement.textContent = `${total} ₽`;
    itemsCount.textContent = `${count} ${getProductWord(count)}`;
}

function getProductWord(count) {
    if (count === 1) return 'товар';
    if (count > 1 && count < 5) return 'товара';
    return 'товаров';
}

// Добавляем функцию поиска
function searchProducts(query) {
    query = query.toLowerCase();
    let results = [];
    
    // Ищем по всем категориям
    Object.values(products).forEach(category => {
        category.forEach(product => {
            if (product.name.toLowerCase().includes(query) || 
                product.description.toLowerCase().includes(query)) {
                results.push(product);
            }
        });
    });
    
    return results;
}

// Добавляем обработчик поиска
document.querySelector('.search-bar input').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const searchResults = document.querySelector('.search-results');
    
    if (query.length < 2) {
        searchResults.classList.remove('active');
        return;
    }
    
    const results = searchProducts(query);
    
    if (results.length > 0) {
        searchResults.innerHTML = results.map(product => `
            <div class="search-item" data-id="${product.id}">
                <img src="${product.image}" alt="${product.name}">
                <div class="search-item-info">
                    <h4>${product.name}</h4>
                    <p>${product.price} ₽</p>
                </div>
            </div>
        `).join('');
        searchResults.classList.add('active');
    } else {
        searchResults.innerHTML = '<div class="search-item">Ничего не найдено</div>';
        searchResults.classList.add('active');
    }
});

// Добавляем обработчик клика по результату поиска
document.querySelector('.search-results').addEventListener('click', (e) => {
    const searchItem = e.target.closest('.search-item');
    if (searchItem) {
        const id = searchItem.dataset.id;
        // Находим товар и добавляем в корзину
        Object.values(products).forEach(category => {
            const product = category.find(p => p.id === id);
            if (product) {
                if (cart.items[id]) {
                    cart.items[id].quantity++;
                } else {
                    cart.items[id] = {
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        quantity: 1
                    };
                    showCart();
                }
                updateCart();
                showNotification('Товар добавлен в корзину');
                
                // Очищаем поиск
                document.querySelector('.search-bar input').value = '';
                document.querySelector('.search-results').classList.remove('active');
            }
        });
    }
});

// Закрываем результаты поиска при клике вне
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-wrapper')) {
        document.querySelector('.search-results').classList.remove('active');
    }
});

// Инициализация после загрузки DOM
document.addEventListener('DOMContentLoaded', () => {
    // Инициализируем слайдер
    initPromoSlider();
    
    // Загружаем продукты
    fetch('products.json')
        .then(response => response.json())
        .then(data => {
            products = data;
            showCategoryProducts('all'); // Показываем первую категорию после загрузки данных
        })
        .catch(error => console.error('Ошибка загрузки продуктов:', error));

    // Обработчики для категорий
    document.querySelectorAll('.category-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = item.dataset.category;
            
            document.querySelectorAll('.category-item').forEach(i => {
                i.classList.remove('active');
            });
            
            item.classList.add('active');
            
            const productsGrid = document.querySelector('.products-grid');
            productsGrid.style.opacity = '0';
            
            setTimeout(() => {
                showCategoryProducts(category);
            }, 300);
        });
    });

    // Обработчик добавления в корзину
    document.addEventListener('click', (e) => {
        const addButton = e.target.closest('.add-to-cart');
        if (addButton) {
            addButton.classList.add('adding');
            setTimeout(() => {
                addButton.classList.remove('adding');
            }, 300);

            const card = addButton.closest('.product-card');
            const id = card.dataset.id;
            const name = card.querySelector('h3').textContent;
            const price = parseInt(card.querySelector('.price').textContent);
            const image = card.querySelector('.product-image img').src;
            
            if (cart.items[id]) {
                cart.items[id].quantity++;
            } else {
                cart.items[id] = {
                    name,
                    price,
                    image,
                    quantity: 1
                };
                showCart();
            }
            
            updateCart();
            showNotification('Товар добавлен в корзину');
        }
    });

    // Обработчик кнопки корзины
    document.querySelector('.cart-button').addEventListener('click', () => {
        const cartSidebar = document.querySelector('.cart-sidebar');
        if (cartSidebar.style.display === 'none' || !cartSidebar.style.display) {
            showCart();
        } else {
            hideCart();
        }
    });

    // Обработчик кнопок в корзине
    document.querySelector('.cart-items').addEventListener('click', (e) => {
        if (e.target.classList.contains('plus') || e.target.classList.contains('minus')) {
            const id = e.target.closest('.cart-item').dataset.id;
            
            if (e.target.classList.contains('plus')) {
                cart.items[id].quantity++;
            } else {
                if (cart.items[id].quantity > 1) {
                    cart.items[id].quantity--;
                } else {
                    delete cart.items[id];
                }
            }
            
            updateCart();
            
            if (Object.keys(cart.items).length === 0) {
                hideCart();
            }
        }
    });

    // Обработчик оформления заказа
    document.querySelector('.checkout-button').addEventListener('click', () => {
        if (Object.keys(cart.items).length === 0) {
            showNotification('добавьте товары в корзину');
            return;
        }
        
        // Сохраняем заказ и переходим к оформлению
        const order = createOrder();
        saveOrder(order);
        window.location.href = 'checkout.html';
    });
});

function handleImageError(img) {
    img.onerror = null; // Предотвращаем рекурсию
    img.src = './img/products/placeholder.jpg'; // Путь к плейсхолдеру
}

function initPromoSlider() {
    const slidesContainer = document.querySelector('.promo-slides');
    const dotsContainer = document.querySelector('.slide-dots');
    const prevButton = document.querySelector('.prev-slide');
    const nextButton = document.querySelector('.next-slide');

    // Добавляем слайды
    slidesContainer.innerHTML = slides.map(slide => `
        <div class="promo-slide">
            <img src="${slide.image}" alt="${slide.title}">
            <div class="promo-content">
                <h2>${slide.title}</h2>
                <p>${slide.description}</p>
            </div>
        </div>
    `).join('');

    // Добавляем точки
    dotsContainer.innerHTML = slides.map((_, index) => `
        <button class="slide-dot ${index === 0 ? 'active' : ''}" data-index="${index}"></button>
    `).join('');

    // Обработчики для кнопок
    prevButton.addEventListener('click', () => {
        currentSlide = (currentSlide - 1 + slides.length) % slides.length;
        updateSlider();
    });

    nextButton.addEventListener('click', () => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
    });

    // Обработчик для точек
    dotsContainer.addEventListener('click', (e) => {
        const dot = e.target.closest('.slide-dot');
        if (dot) {
            currentSlide = parseInt(dot.dataset.index);
            updateSlider();
        }
    });

    // Автоматическое переключение слайдов
    setInterval(() => {
        currentSlide = (currentSlide + 1) % slides.length;
        updateSlider();
    }, 5000);
}

function updateSlider() {
    const slidesContainer = document.querySelector('.promo-slides');
    const dots = document.querySelectorAll('.slide-dot');

    slidesContainer.style.transform = `translateX(-${currentSlide * 100}%)`;
    
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlide);
    });
}

// В функции оформления заказа
function createOrder() {
    const cartItems = { ...cart.items };
    const orderId = 'ORDER' + Date.now().toString().slice(-6);
    
    return {
        id: orderId,
        items: cartItems,
        status: 'processing',
        date: new Date()
    };
}

function saveOrder(order) {
    // Сохраняем заказ в localStorage
    const orders = JSON.parse(localStorage.getItem('orders') || '[]');
    orders.push(order);
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('currentOrder', JSON.stringify(order));
    // Сохраняем корзину
    localStorage.setItem('cart', JSON.stringify(cart));
} 