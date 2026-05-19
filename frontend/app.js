const API_URL = 'http://localhost:5008/api/products';

// База данных ролей (Для распределения сотрудников при авторизации)
const userRolesDB = {
    'admin@milka.space': { pass: 'admin123', view: 'view-admin', name: 'Главный Архитектор' },
    'sklad@milka.space': { pass: 'sklad123', view: 'view-seller', name: 'Старший Сборщик' },
    'courier@milka.space': { pass: 'courier123', view: 'view-delivery', name: 'Пилот Доставки' },
    'money@milka.space': { pass: 'money123', view: 'view-accountant', name: 'Главный Бухгалтер' }
};

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

// --- SPA РОУТЕР ---
function navigateTo(targetViewId) {
    document.querySelectorAll('.screen-view').forEach(screen => screen.classList.remove('active'));
    
    const activeScreen = document.getElementById(targetViewId);
    if (activeScreen) activeScreen.classList.add('active');

    document.querySelectorAll('.nav-link-item').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.target === targetViewId) link.classList.add('active');
    });

    // Сбрасываем зум фона при уходе с экрана авторизации
    if (targetViewId !== 'view-auth') {
        document.getElementById('cosmicBg').classList.remove('cosmic-zoomed');
    }

    appState.currentView = targetViewId;
    window.scrollTo(0, 0);

    if (targetViewId === 'view-catalog') loadCatalog();
    if (targetViewId === 'view-cart') renderCart();
    if (targetViewId === 'view-admin') renderAdminPanel();
    if (targetViewId === 'view-seller') renderSellerPanel();
    if (targetViewId === 'view-delivery') renderCourierPanel();
}

// --- КАТАЛОГ С С# API ---
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
        if (!response.ok) throw new Error('Ошибка');
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
        grid.innerHTML = '<div class="loading" style="color:#ff4a4a">Ошибка состыковки с API. Запусти бэкенд 🔌</div>';
    }
}

// --- КАРТОЧКА ТОВАРА (Описание, Состав, Кружочки, Остаток) ---
function showProductDetails(product) {
    const container = document.getElementById('productDetailContent');
    const img = product.imageUrl ? product.imageUrl : 'https://via.placeholder.com/400/140f19/08ffe2?text=MILKA';

    // Генерируем кружочки цветов
    let circlesHtml = '';
    if (product.availableColors) {
        product.availableColors.forEach(c => {
            circlesHtml += `<div class="color-circle" style="background: ${colorMap[c] || '#555'}; width:24px; height:24px; display:inline-block; margin-right:8px;"></div>`;
        });
    }

    // Имитация состава и остатков (если бэкенд их ещё не передает)
    const fabric = product.fabricComposition || 'Состав: 80% Органический космический хлопок, 20% Полиэстер высокой прочности';
    const stockCount = product.stockQty || Math.floor(Math.random() * 12) + 2; // Генерация остатка для витрины

    container.innerHTML = `
        <div class="detail-img-box"><img src="${img}"></div>
        <div class="detail-info-box">
            <span class="product-category">${product.category}</span>
            <h2>${product.productName}</h2>
            <div class="detail-price">${product.price.toLocaleString()} ₽</div>
            
            <p class="detail-desc">${product.description || 'Эксклюзивный оверсайз крой с усиленными швами. Идеально держит форму.'}</p>
            <div class="detail-fabric"><i class="fas fa-atom"></i> ${fabric}</div>
            
            <div style="margin-bottom: 20px;">
                <label style="display:block; font-size:12px; text-transform:uppercase; color:var(--text-gray); margin-bottom:8px;">Доступные цвета спектра:</label>
                <div class="product-colors">${circlesHtml}</div>
            </div>

            <div class="detail-stock"><i class="fas fa-boxes"></i> Остаток в вашей туманности: ${stockCount} шт.</div>
            
            <button class="cta-btn" id="addToCartBtn" style="width:100%">Загрузить в отсек корзины</button>
        </div>
    `;

    document.getElementById('addToCartBtn').addEventListener('click', () => {
        appState.cart.push(product);
        document.getElementById('cart-count-badge').innerText = appState.cart.length;
        alert('Товар добавлен на борт корзины!');
        navigateTo('view-catalog');
    });

    navigateTo('view-product-detail');
}

// --- КОРЗИНА ---
function renderCart() {
    const list = document.getElementById('cartItemsList');
    list.innerHTML = '';
    if (appState.cart.length === 0) {
        list.innerHTML = '<div class="loading">Шлюз корзины пуст.</div>';
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

// --- РОЛИ УПРАВЛЕНИЯ ---
function renderAdminPanel() {
    document.getElementById('admin-orders-list').innerHTML = appState.orders.map(o => `
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
            <span class="status-badge packing">Ожидает сборки</span>
            <button class="panel-btn" onclick="updateOrderStatus('${o.id}', 'delivery')">Собрано и упаковано</button>
        </div>
    `).join('') : '<div class="loading">Все заказы укомплектованы!</div>';
}

function renderCourierPanel() {
    const container = document.getElementById('courierDeliveries');
    const deliveryOrders = appState.orders.filter(o => o.status === 'delivery');
    container.innerHTML = deliveryOrders.length ? deliveryOrders.map(o => `
        <div class="panel-order-card">
            <h3>Груз ${o.id}</h3>
            <p>Маршрут: ${o.address}</p>
            <span class="status-badge delivery">В гипердоставке</span>
            <button class="panel-btn" onclick="updateOrderStatus('${o.id}', 'done')">Вручено адресату</button>
        </div>
    `).join('') : '<div class="loading">Свободных доставок нет.</div>';
}

window.updateOrderStatus = function(orderId, newStatus) {
    const order = appState.orders.find(o => o.id === orderId);
    if (order) {
        if (newStatus === 'done') {
            appState.orders = appState.orders.filter(o => o.id !== orderId);
        } else {
            order.status = newStatus;
        }
        navigateTo(appState.currentView);
    }
};

// --- ИНИЦИАЛИЗАЦИЯ И ОБРАБОТЧИКИ ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Глобальный кликаут для SPA роутинга
    document.body.addEventListener('click', (e) => {
        const targetElement = e.target.closest('[data-target]');
        if (targetElement) {
            e.preventDefault();
            navigateTo(targetElement.dataset.target);
        }
    });

    // --- КЛИКАБЕЛЬНАЯ АНИМАЦИЯ ЗУМА И ПЕРЕКЛЮЧЕНИЯ ВХОД/РЕГИСТРАЦИЯ ---
    const bg = document.getElementById('cosmicBg');
    const loginBlock = document.getElementById('auth-login-block');
    const registerBlock = document.getElementById('auth-register-block');

    document.getElementById('goToRegisterBtn').addEventListener('click', (e) => {
        e.preventDefault();
        bg.classList.add('cosmic-zoomed'); // Приближаем Млечный путь
        loginBlock.style.display = 'none';
        registerBlock.style.display = 'block';
    });

    document.getElementById('goToLoginBtn').addEventListener('click', (e) => {
        e.preventDefault();
        bg.classList.remove('cosmic-zoomed'); // Отдаляем обратно
        registerBlock.style.display = 'none';
        loginBlock.style.display = 'block';
    });

    // Иконка показа пароля
    document.querySelector('.toggle-password').addEventListener('click', (e) => {
        const input = document.getElementById('login-pass');
        if (input.type === 'password') {
            input.type = 'text';
            e.target.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            e.target.classList.replace('fa-eye-slash', 'fa-eye');
        }
    });

    // --- УМНАЯ АУТЕНТИФИКАЦИЯ ПО РОЛЯМ ---
    document.getElementById('login-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value.trim();
        const pass = document.getElementById('login-pass').value.trim();

        // Проверяем, есть ли такой сотрудник в базе ролей
        if (userRolesDB[email]) {
            const user = userRolesDB[email];
            if (user.pass === pass) {
                alert(`Доступ разрешен. Роль: ${user.name}`);
                document.getElementById('auth-nav-btn').innerHTML = `<i class="fas fa-user-tie"></i> ${user.name}`;
                navigateTo(user.view); // Перекидываем на нужный интерфейс
                return;
            }
        }

        // Если это не сотрудник, пускаем как обычного покупателя (Клиента)
        alert('Успешный вход! Добро пожаловать на борт, Капитан.');
        document.getElementById('auth-nav-btn').innerHTML = `<i class="fas fa-user-astronaut"></i> Клиент`;
        navigateTo('view-home');
    });

    // Поиск
    const navSearchInput = document.getElementById('navSearchInput');
    const runSearch = () => { appState.currentFilters.search = navSearchInput.value.trim(); navigateTo('view-catalog'); };
    document.getElementById('navSearchBtn').addEventListener('click', runSearch);
    navSearchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') runSearch(); });

    // Фильтры
    document.getElementById('categoryFilter').addEventListener('change', (e) => { appState.currentFilters.category = e.target.value; loadCatalog(); });
    document.getElementById('colorFilter').addEventListener('change', (e) => { appState.currentFilters.color = e.target.value; loadCatalog(); });

    navigateTo('view-home');
});