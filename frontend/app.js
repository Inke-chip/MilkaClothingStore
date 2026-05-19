const API_URL = 'http://localhost:5008/api/products';

let appState = {
    products: [],
    cart: [],
    orders: [
        { id: '#ST-8841', address: 'Орбитальная Станция МИР-2', status: 'packing', items: 'Худи Milka (1 шт)' },
        { id: '#ST-3412', address: 'Созвездие Кассиопея, Платформа 7', status: 'delivery', items: 'Штаны Неон (2 шт)' }
    ],
    currentFilters: { category: '', color: '', size: '', search: '' },
    currentView: 'view-home'
};

const colorMap = {
    'Милка-Фиолетовый': '#9202f2',
    'Угольно-Чёрный': '#1a1a1a',
    'Белый': '#ffffff',
    'Лавандовый': '#ce99f2'
};

// --- ИСПРАВЛЕННЫЙ РОУТЕР (SPA) ---
function navigateTo(targetViewId) {
    document.querySelectorAll('.screen-view').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const activeScreen = document.getElementById(targetViewId);
    if (activeScreen) {
        activeScreen.classList.add('active');
    }

    // Обновляем активный класс на ссылках в шапке
    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === targetViewId) link.classList.add('active');
    });

    appState.currentView = targetViewId;
    window.scrollTo(0, 0);

    // Триггеры загрузки экранов
    if (targetViewId === 'view-catalog') loadCatalog();
    if (targetViewId === 'view-cart') renderCart();
    if (targetViewId === 'view-admin') renderAdminPanel();
    if (targetViewId === 'view-seller') renderSellerPanel();
    if (targetViewId === 'view-delivery') renderCourierPanel();
}

// --- СЕКРЕТНЫЙ КЛЮЧ ДЛЯ ПРЕПОДАВАТЕЛЯ (Вход в скрытые панели через консоль) ---
// Чтобы открыть админку, просто напиши в консоли браузера: openPanel('admin')
window.openPanel = function(role) {
    if (role === 'admin') navigateTo('view-admin');
    if (role === 'seller') navigateTo('view-seller');
    if (role === 'delivery') navigateTo('view-delivery');
    console.log(`Переключение на скрытый экран: ${role}`);
};

// --- ЗАГРУЗКА КАТАЛОГА С API ---
async function loadCatalog() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div class="loading">Сканирование звездных систем API...</div>';

    try {
        const url = new URL(API_URL);
        const f = appState.currentFilters;
        if (f.category) url.searchParams.append('category', f.category);
        if (f.color) url.searchParams.append('color', f.color);
        if (f.size) url.searchParams.append('size', f.size);
        if (f.search) url.searchParams.append('search', f.search);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка связи');
        appState.products = await response.json();

        grid.innerHTML = '';
        if (appState.products.length === 0) {
            grid.innerHTML = '<div class="loading">Товары не обнаружены 👾</div>';
            return;
        }

        appState.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            let circlesHtml = '';
            if (product.availableColors) {
                product.availableColors.forEach(c => {
                    circlesHtml += `<div class="color-circle" style="background: ${colorMap[c] || '#555'}"></div>`;
                });
            }

            const img = product.imageUrl ? product.imageUrl : 'https://via.placeholder.com/400/140f19/08ffe2?text=MILKA';

            card.innerHTML = `
                <div class="image-container"><img src="${img}"></div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h4 class="product-name">${product.productName}</h4>
                    <div class="product-colors">${circlesHtml}</div>
                    <div class="product-meta">
                        <span class="product-price">${product.price.toLocaleString()} ₽</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => showProductDetails(product));
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<div class="loading" style="color:#ff4a4a">Ошибка состыковки с C# бэкендом. Убедись, что запущен dotnet run! 🔌</div>';
    }
}

// --- ДЕТАЛИЗАЦИЯ ТОВАРА ---
function showProductDetails(product) {
    const container = document.getElementById('productDetailContent');
    const img = product.imageUrl ? product.imageUrl : 'https://via.placeholder.com/400/140f19/08ffe2?text=MILKA';

    container.innerHTML = `
        <div class="detail-img-box"><img src="${img}"></div>
        <div class="detail-info-box">
            <span class="product-category">${product.category}</span>
            <h2>${product.productName}</h2>
            <div class="detail-price">${product.price.toLocaleString()} ₽</div>
            <p class="detail-desc">${product.description || 'Эксклюзивный крой из коллекции вселенной Milka.'}</p>
            <button class="cta-btn" id="addToCartBtn">Добавить в корзину</button>
        </div>
    `;

    document.getElementById('addToCartBtn').addEventListener('click', () => {
        appState.cart.push(product);
        document.getElementById('cart-count-badge').innerText = appState.cart.length;
        alert('Товар добавлен в корзину!');
        navigateTo('view-catalog');
    });

    navigateTo('view-product-detail');
}

// --- КОРЗИНА ---
function renderCart() {
    const list = document.getElementById('cartItemsList');
    list.innerHTML = '';

    if (appState.cart.length === 0) {
        list.innerHTML = '<div class="loading">Корзина пуста. Начните космический шоппинг!</div>';
        return;
    }

    appState.cart.forEach((item, index) => {
        const row = document.createElement('div');
        row.className = 'cart-item';
        row.innerHTML = `
            <img class="cart-item-img" src="${item.imageUrl || 'https://via.placeholder.com/100'}">
            <div><h4>${item.productName}</h4><p>${item.price} ₽</p></div>
            <button class="size-btn" style="border-color:#ff4a4a;color:#ff4a4a" onclick="removeFromCart(${index})"><i class="fas fa-trash"></i></button>
        `;
        list.appendChild(row);
    });

    document.getElementById('cart-summary-items').innerText = `${appState.cart.length} шт.`;
    const total = appState.cart.reduce((sum, item) => sum + item.price, 0);
    document.getElementById('cart-summary-total').innerText = `${total.toLocaleString()} ₽`;
}

window.removeFromCart = function(index) {
    appState.cart.splice(index, 1);
    document.getElementById('cart-count-badge').innerText = appState.cart.length;
    renderCart();
};

// --- АДМИНКА И ДРУГИЕ РОЛИ ---
function renderAdminPanel() {
    const list = document.getElementById('admin-orders-list');
    list.innerHTML = appState.orders.map(o => `
        <div style="padding:10px;border-bottom:1px solid rgba(255,255,255,0.05)">
            <strong>${o.id}</strong> — ${o.address} <span class="status-badge ${o.status}">${o.status}</span>
        </div>
    `).join('');
}

function renderSellerPanel() {
    const grid = document.getElementById('sellerOrdersGrid');
    const packingOrders = appState.orders.filter(o => o.status === 'packing');
    grid.innerHTML = packingOrders.length ? packingOrders.map(o => `
        <div class="panel-order-card">
            <h3>Заказ ${o.id}</h3>
            <p>Содержимое: ${o.items}</p>
            <span class="status-badge packing">Сборка на складе</span>
            <button class="panel-btn" onclick="updateOrderStatus('${o.id}', 'delivery')">Готов к отправке</button>
        </div>
    `).join('') : '<div class="loading">Все заказы упакованы. Склад чист! 🪐</div>';
}

function renderCourierPanel() {
    const container = document.getElementById('courierDeliveries');
    const deliveryOrders = appState.orders.filter(o => o.status === 'delivery');
    container.innerHTML = deliveryOrders.length ? deliveryOrders.map(o => `
        <div class="panel-order-card">
            <h3>Доставка ${o.id}</h3>
            <p>Адрес: ${o.address}</p>
            <span class="status-badge delivery">В пути</span>
            <button class="panel-btn" onclick="updateOrderStatus('${o.id}', 'done')">Вручить клиенту</button>
        </div>
    `).join('') : '<div class="loading">Нет маршрутов для доставки 🚀</div>';
}

window.updateOrderStatus = function(orderId, newStatus) {
    const order = appState.orders.find(o => o.id === orderId);
    if (order) {
        if (newStatus === 'done') {
            appState.orders = appState.orders.filter(o => o.id !== orderId);
            alert('Заказ успешно доставлен клиенту!');
        } else {
            order.status = newStatus;
            alert('Статус заказа обновлен!');
        }
        navigateTo(appState.currentView);
    }
};

// --- ИНИЦИАЛИЗАЦИЯ И СЛУШАТЕЛИ ---
document.addEventListener('DOMContentLoaded', () => {
    // Слушатель для всех кликабельных переходов
    document.body.addEventListener('click', (e) => {
        const targetElement = e.target.closest('[data-target]');
        if (targetElement) {
            e.preventDefault();
            navigateTo(targetElement.dataset.target);
        }
    });

    // Поисковая строка в шапке сайта
    const navSearchInput = document.getElementById('navSearchInput');
    const executeSearch = () => {
        appState.currentFilters.search = navSearchInput.value.trim();
        navigateTo('view-catalog');
    };
    document.getElementById('navSearchBtn').addEventListener('click', executeSearch);
    navSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') executeSearch(); });

    // Фильтры боковой панели
    document.getElementById('categoryFilter').addEventListener('change', (e) => { appState.currentFilters.category = e.target.value; loadCatalog(); });
    document.getElementById('colorFilter').addEventListener('change', (e) => { appState.currentFilters.color = e.target.value; loadCatalog(); });
    
    // Кнопки размеров
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                appState.currentFilters.size = '';
            } else {
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                appState.currentFilters.size = btn.dataset.size;
            }
            loadCatalog();
        });
    });

    // Сброс фильтров
    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        appState.currentFilters = { category: '', color: '', size: '', search: '' };
        document.getElementById('categoryFilter').value = '';
        document.getElementById('colorFilter').value = '';
        navSearchInput.value = '';
        sizeButtons.forEach(b => b.classList.remove('active'));
        loadCatalog();
    });

    // Оформление заказа
    document.getElementById('placeOrderBtn').addEventListener('click', () => {
        if (appState.cart.length === 0) return alert('Ваш шлюз корзины пуст!');
        const addr = document.getElementById('checkout-address').value;
        if (!addr) return alert('Укажите адрес доставки!');

        const newId = '#ST-' + Math.floor(1000 + Math.random() * 9000);
        appState.orders.push({ id: newId, address: addr, status: 'packing', items: 'Фирменный мерч-пак' });

        document.getElementById('generated-order-id').innerText = newId;
        document.querySelector('.checkout-form-panel').style.display = 'none';
        document.getElementById('orderConfirmationScreen').style.display = 'block';

        appState.cart = [];
        document.getElementById('cart-count-badge').innerText = '0';
    });

    // Форма входа
    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Квантовый доступ разрешен!');
        document.getElementById('auth-nav-btn').innerHTML = '<i class="fas fa-user-check"></i> Капитан Yana';
        navigateTo('view-home');
    });

    // Первая загрузка - открываем главную
    navigateTo('view-home');
});