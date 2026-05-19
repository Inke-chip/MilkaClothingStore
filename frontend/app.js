// Интеграция с локальным C# ASP.NET Core API
const API_URL = 'http://localhost:5008/api/products';

// Единое реактивное состояние всего приложения (State)
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

// --- ДВИЖОК МАРШРУТИЗАЦИИ (SPA ROUTER) ---
function navigateTo(targetViewId) {
    document.querySelectorAll('.screen-view').forEach(screen => {
        screen.classList.remove('active');
    });
    const activeScreen = document.getElementById(targetViewId);
    if (activeScreen) activeScreen.classList.add('active');

    // Обновляем подсветку ссылок в шапке
    document.querySelectorAll('.nav-item, .role-btn').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === targetViewId) link.classList.add('active');
    });

    appState.currentView = targetViewId;
    window.scrollTo(0, 0);

    // Дополнительные хуки при открытии экранов
    if (targetViewId === 'view-catalog') loadCatalog();
    if (targetViewId === 'view-cart') renderCart();
    if (targetViewId === 'view-admin') renderAdminPanel();
    if (targetViewId === 'view-seller') renderSellerPanel();
    if (targetViewId === 'view-delivery') renderCourierPanel();
}

// --- КАТАЛОГ: СВЯЗЬ С НАШИМ C# API ---
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
            grid.innerHTML = '<div class="loading">В этой туманности товары не найдены 👾</div>';
            return;
        }

        appState.products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';
            
            let circlesHtml = '';
            product.availableColors.forEach(c => {
                circlesHtml += `<div class="color-circle" style="background: ${colorMap[c] || '#555'}"></div>`;
            });

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
            
            // Клик по карточке открывает экран 3 (Детализация товара)
            card.addEventListener('click', () => showProductDetails(product));
            grid.appendChild(card);
        });
    } catch (e) {
        grid.innerHTML = '<div class="loading" style="color:#ff4a4a">Ошибка состыковки с C# бэкендом! Запусти dotnet run 🔌</div>';
    }
}

// --- ЭКРАН 3: КАРТОЧКА ТОВАРА (ДЕТАЛИ) ---
function showProductDetails(product) {
    const container = document.getElementById('productDetailContent');
    const img = product.imageUrl ? product.imageUrl : 'https://via.placeholder.com/400/140f19/08ffe2?text=MILKA';

    container.innerHTML = `
        <div class="detail-img-box"><img src="${img}"></div>
        <div class="detail-info-box">
            <span class="product-category">${product.category}</span>
            <h2>${product.productName}</h2>
            <div class="detail-price">${product.price.toLocaleString()} ₽</div>
            <p class="detail-desc">${product.description || 'Эксклюзивное космическое волокно высокой плотности.'}</p>
            <button class="cta-btn" id="addToCartBtn">Загрузить в шлюз корзины</button>
        </div>
    `;

    document.getElementById('addToCartBtn').addEventListener('click', () => {
        appState.cart.push(product);
        document.getElementById('cart-count').innerText = appState.cart.length;
        alert('Товар успешно добавлен на борт корзины!');
        navigateTo('view-catalog');
    });

    navigateTo('view-product-detail');
}

// --- ЭКРАН 4: КОРЗИНА ---
function renderCart() {
    const list = document.getElementById('cartItemsList');
    list.innerHTML = '';

    if (appState.cart.length === 0) {
        list.innerHTML = '<div class="loading">Шлюз пуст. Загрузите вещи в каталоге.</div>';
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
    document.getElementById('cart-count').innerText = appState.cart.length;
    renderCart();
};

// --- ЭКРАН 7, 8, 9: АДМИНКА, СКЛАД, КУРЬЕР ---
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
            <span class="status-badge packing">Требует сборки</span>
            <button class="panel-btn" onclick="updateOrderStatus('${o.id}', 'delivery')">Передать в гипердрайв курьеру</button>
        </div>
    `).join('') : '<div class="loading">Все товары упакованы! 🪐</div>';
}

function renderCourierPanel() {
    const container = document.getElementById('courierDeliveries');
    const deliveryOrders = appState.orders.filter(o => o.status === 'delivery');
    container.innerHTML = deliveryOrders.length ? deliveryOrders.map(o => `
        <div class="panel-order-card">
            <h3>Доставка ${o.id}</h3>
            <p>Вектор назначения: ${o.address}</p>
            <span class="status-badge delivery">В гиперпространстве</span>
            <button class="panel-btn" onclick="updateOrderStatus('${o.id}', 'done')"><i class="fas fa-flag-checkered"></i> Доставлено на планету</button>
        </div>
    `).join('') : '<div class="loading">Нет доступных маршрутов для доставки 🚀</div>';
}

window.updateOrderStatus = function(orderId, newStatus) {
    const order = appState.orders.find(o => o.id === orderId);
    if (order) {
        if (newStatus === 'done') {
            appState.orders = appState.orders.filter(o => o.id !== orderId);
            alert('Груз успешно доставлен и подтвержден!');
        } else {
            order.status = newStatus;
            alert('Статус орбитальной логистики изменен!');
        }
        navigateTo(appState.currentView);
    }
};

// --- НАСТРОЙКА ИНТЕРФЕЙСНЫХ СЛУШАТЕЛЕЙ ---
document.addEventListener('DOMContentLoaded', () => {
    // Клиентский роутинг по кликам
    document.querySelectorAll('[data-target]').forEach(element => {
        element.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(element.dataset.target);
        });
    });

    // Фильтры каталога
    document.getElementById('categoryFilter').addEventListener('change', (e) => { appState.currentFilters.category = e.target.value; loadCatalog(); });
    document.getElementById('colorFilter').addEventListener('change', (e) => { appState.currentFilters.color = e.target.value; loadCatalog(); });
    
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', () => { appState.currentFilters.search = searchInput.value.trim(); loadCatalog(); });

    // Оформление заказа
    document.getElementById('placeOrderBtn').addEventListener('click', () => {
        if (appState.cart.length === 0) return alert('Ваш грузовой отсек пуст!');
        const addr = document.getElementById('checkout-address').value;
        if (!addr) return alert('Введите космический вектор доставки!');

        const newId = '#ST-' + Math.floor(1000 + Math.random() * 9000);
        appState.orders.push({ id: newId, address: addr, status: 'packing', items: 'Индивидуальный сет одежды' });

        document.getElementById('generated-order-id').innerText = newId;
        document.querySelector('.checkout-form-panel').style.display = 'none';
        document.getElementById('orderConfirmationScreen').style.display = 'block';

        // Очищаем корзину
        appState.cart = [];
        document.getElementById('cart-count').innerText = '0';
    });

    // Аутентификация формы
    document.getElementById('auth-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Квантовая подпись подтверждена. Добро пожаловать на борт!');
        document.getElementById('auth-nav-btn').innerHTML = '<i class="fas fa-user-check"></i> Капитан Yana';
        navigateTo('view-home');
    });

    // Запуск главного экрана
    navigateTo('view-home');
});