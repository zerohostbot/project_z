// Инициализация корзины как объекта
const cart = {
    items: {}
};

let products = {};

// Загружаем продукты из JSON
fetch('js/products.json')
    .then(response => response.json())
    .then(data => {
        products = data;
    })
    .catch(error => console.error('Ошибка загрузки продуктов:', error));

// Функции
function showCategoryProducts(category) {
    const welcomeAnimation = document.querySelector('.welcome-animation');
    const productsGrid = document.querySelector('.products-grid');
    
    if (category === 'all') {
        welcomeAnimation.style.display = 'flex';
        productsGrid.style.display = 'none';
        return;
    }

    welcomeAnimation.style.display = 'none';
    productsGrid.style.display = 'grid';
    productsGrid.style.opacity = '1';

    const categoryProducts = products[category] || [];
    
    productsGrid.innerHTML = categoryProducts.map(product => `
        <div class="product-card" data-id="${product.id}">
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
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
        
        // Сохраняем корзину в localStorage перед переходом
        localStorage.setItem('cart', JSON.stringify(cart));
        
        // Переходим на страницу оформления
        window.location.href = './checkout.html';
    });

    // Начальная инициализация
    showCategoryProducts('all');
}); 