// Адрес нашего C# ASP.NET бэкенда
const API_URL = 'http://localhost:5008/api/products';

// Состояние фильтров (то, что выбрал пользователь)
let currentFilters = {
    category: '',
    color: '',
    size: '',
    search: ''
};

// Функция загрузки товаров с бэкенда
async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div class="loading">Загрузка неоновой коллекции...</div>';

    try {
        // Строим URL с Query-параметрами для фильтрации и поиска
        const url = new URL(API_URL);
        if (currentFilters.category) url.searchParams.append('category', currentFilters.category);
        if (currentFilters.color) url.searchParams.append('color', currentFilters.color);
        if (currentFilters.size) url.searchParams.append('size', currentFilters.size);
        if (currentFilters.search) url.searchParams.append('search', currentFilters.search);

        // Делаем запрос к API
        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка при ответе сервера');
        
        const products = await response.json();

        // Очищаем сетку
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<div class="loading">Ничего не найдено по вашему запросу 👾</div>';
            return;
        }

        // Отрисовываем карточки товаров
        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            // Если картинки нет, подставляем заглушку с лавандовым фоном
            const imgUrl = product.imageUrl ? product.imageUrl : 'https://via.placeholder.com/400/1f2833/08ffe2?text=MILKA';

            card.innerHTML = `
                <div class="image-container">
                    <img src="${imgUrl}" alt="${product.productName}">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h4 class="product-name">${product.productName}</h4>
                    <p class="product-details">${product.description || 'Без описания'}</p>
                    <div class="product-meta">
                        <span class="product-price">${product.price.toLocaleString('ru-RU')} ₽</span>
                        <button class="add-to-cart-btn" title="Добавить в корзину">
                            <i class="fas fa-shopping-basket"></i>
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });

    } catch (error) {
        console.error(error);
        grid.innerHTML = '<div class="loading" style="color: #ff4a4a;">Не удалось подключиться к бэкенду. Проверь, запущен ли dotnet run! 🔌</div>';
    }
}

// НАСТРОЙКА СЛУШАТЕЛЕЙ СОБЫТИЙ (Интерфейс)
document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Фильтр категорий
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        loadProducts();
    });

    // 2. Фильтр цветов
    document.getElementById('colorFilter').addEventListener('change', (e) => {
        currentFilters.color = e.target.value;
        loadProducts();
    });

    // 3. Фильтр размеров (кнопки S, M, L)
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Если кнопка уже активна — сбрасываем фильтр размера
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentFilters.size = '';
            } else {
                // Иначе активируем текущую кнопку размера
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilters.size = btn.dataset.size;
            }
            loadProducts();
        });
    });

    // 4. Текстовый поиск (По кнопке или по Enter)
    const searchInput = document.getElementById('searchInput');
    const triggerSearch = () => {
        currentFilters.search = searchInput.value.trim();
        loadProducts();
    };

    document.getElementById('searchBtn').addEventListener('click', triggerSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSearch();
    });

    // 5. Кнопка сброса всех фильтров
    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        currentFilters = { category: '', color: '', size: '', search: '' };
        document.getElementById('categoryFilter').value = '';
        document.getElementById('colorFilter').value = '';
        searchInput.value = '';
        sizeButtons.forEach(b => b.classList.remove('active'));
        loadProducts();
    });

    // Первая загрузка товаров при открытии страницы
    loadProducts();
});