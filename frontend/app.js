/* ==========================================================================
   1. ИМИТАЦИЯ БАЗЫ ДАННЫХ (ДАТАСЕТ НА 100+ ТОВАРОВ И ЗАКАЗЫ)
   ========================================================================== */

// Массив категорий для генерации
const categories = ["Женское", "Мужское", "Детское", "Аксессуары"];
const colors = ["Deep Space Black", "Stardust White", "Cosmic Ginger", "Strawberry Blonde", "Nebula Violet"];
const sizes = ["XS", "S", "M", "L", "XL"];
const clothingTypes = ["Платья", "Костюмы", "Пальто", "Худи", "Куртки"];
const materials = ["Метеоритная сталь", "Углеродное волокно", "Звездное серебро", "Космический шелк"];
const accTypes = ["Очки", "Часы", "Сумки", "Ремни"];

// Генератор картинок для разнообразия
const imgTemplates = {
    "Женское": "https://images.unsplash.com/photo-1515347619252-8d2a1bf6f162?auto=format&fit=crop&q=80",
    "Мужское": "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80",
    "Детское": "https://images.unsplash.com/photo-1519457431-44ccd64a579b?auto=format&fit=crop&q=80",
    "Аксессуары": "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80"
};

let productsDb = [];

// Генерируем 105 товаров для глубокого каталога
for (let i = 1; i <= 105; i++) {
    let cat = categories[i % categories.length];
    let color = colors[i % colors.length];
    let type = cat === "Аксессуары" ? accTypes[i % accTypes.length] : clothingTypes[i % clothingTypes.length];
    let meta = cat === "Аксессуары" ? materials[i % materials.length] : sizes[i % sizes.length];
    let basePrice = 5000 + (i * 270) % 45000;

    productsDb.push({
        id: i,
        name: `${type} "${cat === 'Аксессуары' ? 'Квазар' : 'Галактика'} — ${i}"`,
        category: cat,
        price: basePrice,
        color: color,
        type: type,
        meta: meta, // Для одежды это размер, для аксессуаров - материал
        image: imgTemplates[cat]
    });
}

// Базовые тестовые пользователи (Бэкенд заменит это на хэши в SQL)
const usersDb = [
    { email: "admin@milka.space", pass: "admin2026", name: "Главный Навигатор", role: "Admin" },
    { email: "picker@milka.space", pass: "pick2026", name: "Сборщик Сектора 4", role: "Picker" },
    { email: "accountant@milka.space", pass: "money2026", name: "Главный Аудитор", role: "Accountant" },
    { email: "user@milka.space", pass: "user2026", name: "Елена Орион", role: "Customer" }
];

// Начальный пул заказов для Сборщика
let ordersDb = [
    { id: "ORD-4402", items: "Шелковое платье \"Сириус\" (Женское) x1", note: "Проверить застежки перед отправкой", status: "В процессе" },
    { id: "ORD-7719", items: "Костюм \"Метеор\" (Мужское) x1, Часы Затмения x1", note: "Хрупкое стекло", status: "В процессе" },
    { id: "ORD-9012", items: "Худи куртка (Детское) x2", note: "Подарочная космическая упаковка", status: "В процессе" }
];

// Глобальное состояние сессии фронтенда
let currentUser = null;
let currentCategory = "Женское"; // По умолчанию открываем этот отсек

/* ==========================================================================
   2. СИСТЕМА ИНИЦИАЛИЗАЦИИ И МАРШРУТИЗАЦИИ (SPA)
   ========================================================================== */
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initAuthLogic();
    initCatalogFilters();
    initSearchAnimation();
    initAdminPanel();
    initPickerPanel();
    
    // Рендерим стартовый контент
    renderCatalog();
    renderFinancialChart();
});

// Переключение экранов (Элегантный SPA-эффект)
function switchScreen(targetViewId) {
    document.querySelectorAll(".screen-view").forEach(screen => {
        screen.classList.remove("active");
    });
    const targetScreen = document.getElementById(targetViewId);
    if (targetScreen) {
        targetScreen.classList.add("active");
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

function initNavigation() {
    // Клики по логотипу и ссылкам категорий
    document.querySelectorAll("[data-target]").forEach(element => {
        element.addEventListener("click", (e) => {
            e.preventDefault();
            switchScreen(element.getAttribute("data-target"));
        });
    });

    // Обработка кликов по главным категориям в Навбаре и Футере
    document.querySelectorAll(".main-cat-link").forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            currentCategory = link.getAttribute("data-category");
            
            // Настраиваем видимость фильтров в зависимости от выбранного сектора
            adjustFilterInputsVisibility();
            
            // Обновляем текстовые заголовки в каталоге
            document.getElementById("catalog-title-display").innerText = `Отсек: ${currentCategory}`;
            document.getElementById("catalog-subtitle-display").innerText = `Линейка товаров премиум-класса категории ${currentCategory.toLowerCase()}`;
            
            resetFilters();
            renderCatalog();
            switchScreen("view-catalog");
        });
    });

    // Кнопка на главном баннере
    const exploreBtn = document.getElementById("explore-collection-btn");
    if (exploreBtn) {
        exploreBtn.addEventListener("click", () => {
            currentCategory = "Женское";
            adjustFilterInputsVisibility();
            renderCatalog();
            switchScreen("view-catalog");
        });
    }
}

/* ==========================================================================
   3. ВЫТЯГИВАЮЩИЙСЯ ПОИСК И ФИЛЬТРАЦИЯ
   ========================================================================== */
function initSearchAnimation() {
    const searchBlock = document.getElementById("search-block");
    const searchInput = document.getElementById("search-input");
    const triggerBtn = document.getElementById("search-trigger-btn");

    triggerBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        searchBlock.classList.toggle("active");
        if (searchBlock.classList.contains("active")) {
            searchInput.focus();
        }
    });

    // Закрытие поиска при клике мимо, если поле пустое
    document.addEventListener("click", (e) => {
        if (!searchBlock.contains(e.target) && searchInput.value.trim() === "") {
            searchBlock.classList.remove("active");
        }
    });

    // Живой поиск совпадений среди товаров при вводе текста
    searchInput.addEventListener("input", () => {
        switchScreen("view-catalog");
        renderCatalog();
    });
}

function adjustFilterInputsVisibility() {
    const clothingFilters = document.getElementById("filter-group-clothing");
    const accFilters = document.getElementById("filter-group-accessories");

    if (currentCategory === "Аксессуары") {
        clothingFilters.style.display = "none";
        accFilters.style.display = "flex";
    } else {
        clothingFilters.style.display = "flex";
        accFilters.style.display = "none";
    }
}

function initCatalogFilters() {
    const filterIds = ["filter-size", "filter-color", "filter-clothing-type", "filter-material", "filter-acc-type"];
    filterIds.forEach(id => {
        document.getElementById(id).addEventListener("change", renderCatalog);
    });

    document.getElementById("reset-filters-btn").addEventListener("click", () => {
        resetFilters();
        renderCatalog();
        showToast("Фильтры орбиты успешно сброшены", "info");
    });
}

function resetFilters() {
    document.getElementById("filter-size").value = "all";
    document.getElementById("filter-color").value = "all";
    document.getElementById("filter-clothing-type").value = "all";
    document.getElementById("filter-material").value = "all";
    document.getElementById("filter-acc-type").value = "all";
}

// Ядро фильтрации и вывода товаров на фронтенде
function renderCatalog() {
    const grid = document.getElementById("catalog-products-grid");
    const emptyMsg = document.getElementById("catalog-empty-msg");
    const searchQuery = document.getElementById("search-input").value.toLowerCase().trim();

    // Извлекаем значения фильтров
    const sizeVal = document.getElementById("filter-size").value;
    const colorVal = document.getElementById("filter-color").value;
    const clothTypeVal = document.getElementById("filter-clothing-type").value;
    const matVal = document.getElementById("filter-material").value;
    const accTypeVal = document.getElementById("filter-acc-type").value;

    grid.innerHTML = "";

    // Фильтруем массив данных
    let filtered = productsDb.filter(p => {
        if (p.category !== currentCategory) return false;

        // Поиск по тексту (название, цвет, тип)
        if (searchQuery && !p.name.toLowerCase().includes(searchQuery) && !p.color.toLowerCase().includes(searchQuery)) {
            return false;
        }

        // Кастомные селекторы
        if (currentCategory === "Аксессуары") {
            if (matVal !== "all" && p.meta !== matVal) return false;
            if (accTypeVal !== "all" && p.type !== accTypeVal) return false;
        } else {
            if (sizeVal !== "all" && p.meta !== sizeVal) return false;
            if (colorVal !== "all" && p.color !== colorVal) return false;
            if (clothTypeVal !== "all" && p.type !== clothTypeVal) return false;
        }

        return true;
    });

    // Отрисовка результатов
    if (filtered.length === 0) {
        emptyMsg.style.display = "block";
    } else {
        emptyMsg.style.display = "none";
        filtered.forEach(prod => {
            const card = document.createElement("div");
            card.className = "product-card";
            card.innerHTML = `
                <img src="${prod.image}" class="prod-img" alt="${prod.name}">
                <div class="prod-cat">${prod.category} • ${prod.color}</div>
                <div class="prod-name">${prod.name}</div>
                <div class="prod-price">${prod.price.toLocaleString()} ₽</div>
            `;
            grid.appendChild(card);
        });
    }
}

/* ==========================================================================
   4. ВАЛИДАЦИЯ И КОНТРОЛЬ ДОСТУПА ПО РОЛЯМ
   ========================================================================== */
function initAuthLogic() {
    const formLogin = document.getElementById("form-login-gate");
    const formRegister = document.getElementById("form-register-gate");
    
    // Переключатели форм
    document.getElementById("go-to-reg-btn").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("box-login").style.display = "none";
        document.getElementById("box-register").style.display = "block";
    });

    document.getElementById("go-to-login-btn").addEventListener("click", (e) => {
        e.preventDefault();
        document.getElementById("box-register").style.display = "none";
        document.getElementById("box-login").style.display = "block";
    });

    // Валидация входа (Если пользователя нет - не впускать!)
    formLogin.addEventListener("submit", (e) => {
        e.preventDefault();
        const emailInput = document.getElementById("gate-login-email").value.trim();
        const passInput = document.getElementById("gate-login-password").value;

        // Поиск совпадений в системе
        const user = usersDb.find(u => u.email === emailInput && u.pass === passInput);

        if (!user) {
            showToast("Ошибка авторизации: Такого пользователя нет или пароль неверный!", "danger");
            return;
        }

        // Если ок - авторизуем
        executeLoginSuccess(user);
    });

    // Имитация регистрации
    formRegister.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = document.getElementById("gate-reg-email").value.trim();
        const pass = document.getElementById("gate-reg-password").value;
        const name = `${document.getElementById("gate-reg-firstname").value} ${document.getElementById("gate-reg-lastname").value}`;
        const role = document.getElementById("gate-reg-role").value;

        if (usersDb.some(u => u.email === email)) {
            showToast("Данный почтовый сектор уже занят!", "danger");
            return;
        }

        const newUser = { email, pass, name, role };
        usersDb.push(newUser);
        showToast("Учетная запись создана. Выполняем автоматический вход...", "success");
        executeLoginSuccess(newUser);
    });

    // Кнопки выхода
    document.getElementById("logoutBtn").addEventListener("click", executeLogout);
    document.getElementById("btn-logout-inside").addEventListener("click", executeLogout);
}

function executeLoginSuccess(user) {
    currentUser = user;
    showToast(`Добро пожаловать, ${user.name}! С возвращением на борт.`, "success");

    // Обновляем шапку
    document.getElementById("loginBtn").style.display = "none";
    document.getElementById("userMenuBtn").style.display = "block";
    document.getElementById("userNameDisplay").innerText = `${user.name} ▼`;

    // Скрываем все админские ссылки по умолчанию
    document.getElementById("link-admin").style.display = "none";
    document.getElementById("link-picker").style.display = "none";
    document.getElementById("link-account").style.display = "none";

    // Открываем права строго по ролям. АДМИН НЕ ВИДИТ БУХГАЛТЕРИЮ.
    if (user.role === "Admin") {
        document.getElementById("link-admin").style.display = "block";
        switchScreen("view-admin");
        renderAdminTable();
    } else if (user.role === "Picker") {
        document.getElementById("link-picker").style.display = "block";
        switchScreen("view-picker");
        renderPickerOrders();
    } else if (user.role === "Accountant") {
        document.getElementById("link-account").style.display = "block";
        switchScreen("view-accountant");
    } else {
        // Обычный покупатель
        document.getElementById("profile-full-name").innerText = user.name;
        document.getElementById("profile-email-label").innerText = user.email;
        switchScreen("view-profile");
    }
}

function executeLogout(e) {
    if(e) e.preventDefault();
    currentUser = null;
    document.getElementById("loginBtn").style.display = "block";
    document.getElementById("userMenuBtn").style.display = "none";
    
    // Сброс полей форм
    document.getElementById("form-login-gate").reset();
    document.getElementById("form-register-gate").reset();
    
    showToast("Вы вышли из системы. Безопасной сборки космоса!", "info");
    switchScreen("view-home");
}

/* ==========================================================================
   5. ПАНЕЛЬ АДМИНИСТРАТОРА (ДОБАВЛЕНИЕ / УДАЛЕНИЕ ИЗ 4-Х ОТСЕКОВ)
   ========================================================================== */
function initAdminPanel() {
    const addForm = document.getElementById("admin-add-product-form");
    addForm.addEventListener("submit", (e) => {
        e.preventDefault();
        
        const newProd = {
            id: productsDb.length + 1,
            name: document.getElementById("admin-p-name").value.trim(),
            price: parseFloat(document.getElementById("admin-p-price").value),
            category: document.getElementById("admin-p-category").value,
            color: document.getElementById("admin-p-color").value.trim() || "Classic Custom",
            meta: document.getElementById("admin-p-meta").value.trim() || "Universal",
            type: "Кастом",
            image: document.getElementById("admin-p-image").value.trim() || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80"
        };

        productsDb.unshift(newProd); // Добавляем в начало
        showToast(`Товар "${newProd.name}" успешно интегрирован в раздел ${newProd.category}`, "success");
        addForm.reset();
        renderAdminTable();
        renderCatalog();
    });
}

function renderAdminTable() {
    const tbody = document.getElementById("admin-catalog-table-body");
    tbody.innerHTML = "";

    // Показываем первые 15 товаров для удобства менеджмента во фронтенде
    productsDb.slice(0, 15).forEach(prod => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${prod.id}</td>
            <td><strong>${prod.name}</strong></td>
            <td><span class="status-pill processing">${prod.category}</span></td>
            <td>${prod.price.toLocaleString()} ₽</td>
            <td><button class="btn-picker-status reject-btn" onclick="deleteProductFromAdmin(${prod.id})"><i class="fas fa-trash-alt"></i> Исключить</button></td>
        `;
        tbody.appendChild(tr);
    });
}

// Глобальная функция удаления (чтобы работала через onclick в строке таблицы)
window.deleteProductFromAdmin = function(id) {
    productsDb = productsDb.filter(p => p.id !== id);
    showToast(`Товар #${id} стерт из реестра каталога`, "info");
    renderAdminTable();
    renderCatalog();
};

/* ==========================================================================
   6. МОНИТОР СБОРЩИКА (УПРАВЛЕНИЕ СТАТУСАМИ)
   ========================================================================== */
function initPickerPanel() {
    // Архитектура готова под динамические операции
}

function renderPickerOrders() {
    const container = document.getElementById("picker-orders-cards-container");
    container.innerHTML = "";

    ordersDb.forEach(order => {
        const card = document.createElement("div");
        card.className = "order-fulfillment-card";
        
        let statusClass = order.status === "Собран" ? "delivered" : "processing";
        if(order.status === "Нет в наличии") statusClass = "reject-btn";

        card.innerHTML = `
            <div class="card-status-header header-processing">
                <span>Магистраль: ${order.id}</span>
                <strong class="status-pill ${statusClass}">${order.status}</strong>
            </div>
            <div class="card-body-details">
                <p class="picker-item-row"><i class="fas fa-cubes"></i> ${order.items}</p>
                <hr class="card-divider">
                <p class="customer-note"><strong>Директива:</strong> ${order.note}</p>
            </div>
            <div class="card-action-footer">
                <button class="btn-picker-status approve-btn" onclick="changeOrderStatus('${order.id}', 'Собран')"><i class="fas fa-check"></i> СОБРАН</button>
                <button class="btn-picker-status reject-btn" onclick="changeOrderStatus('${order.id}', 'Нет в наличии')"><i class="fas fa-times"></i> НЕТ В НАЛИЧИИ</button>
            </div>
        `;
        container.appendChild(card);
    });
}

window.changeOrderStatus = function(orderId, newStatus) {
    const order = ordersDb.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        showToast(`Статус комплектации заказа ${orderId} изменен на: ${newStatus}`, "info");
        renderPickerOrders();
    }
};

/* ==========================================================================
   7. СЕРВИС УВЕДОМЛЕНИЙ (TOASTS) И АНАЛИТИКА ТЫС. РУБ.
   ========================================================================== */
function showToast(message, type = "info") {
    const container = document.getElementById("toast-container");
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    
    let icon = "fas fa-info-circle";
    if (type === "success") icon = "fas fa-check-circle";
    if (type === "danger") icon = "fas fa-exclamation-triangle";

    toast.innerHTML = `<i class="${icon}"></i> <span>${message}</span>`;
    container.appendChild(toast);

    // Плавное удаление из DOM
    setTimeout(() => {
        toast.style.animation = "slideInRight 0.4s reverse forwards";
        toast.addEventListener("animationend", () => toast.remove());
    }, 4000);
}

function renderFinancialChart() {
    const ctx = document.getElementById('financeDistributionChart');
    if (!ctx) return;

    // Инициализация Chart.js для панели бухгалтера
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Чистая прибыль', 'Налоги (13%)', 'Логистика', 'ФОТ', 'Амортизация'],
            datasets: [{
                data: [799.5, 188.5, 120, 350, 92], // Строго в тысячах рублей по ведомости
                backgroundColor: ['#d8b4e2', '#626d77', '#ffb74d', '#e57373', '#1a1a26'],
                borderColor: 'rgba(255,255,255,0.08)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#a0aab2', font: { family: 'Montserrat', size: 11 } }
                }
            }
        }
    });
}