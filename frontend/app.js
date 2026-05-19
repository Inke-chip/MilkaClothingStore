const API_URL = 'http://localhost:5008/api/products';

let currentFilters = {
    category: '',
    color: '',
    size: '',
    search: ''
};

// Карта цветов: связываем названия из базы данных с CSS цветами
const colorMap = {
    'Милка-Фиолетовый': '#9202f2',
    'Угольно-Чёрный': '#1a1a1a',
    'Белый': '#ffffff',
    'Лавандовый': '#ce99f2'
};

async function loadProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '<div class="loading">Загрузка неоновой коллекции...</div>';

    try {
        const url = new URL(API_URL);
        if (currentFilters.category) url.searchParams.append('category', currentFilters.category);
        if (currentFilters.color) url.searchParams.append('color', currentFilters.color);
        if (currentFilters.size) url.searchParams.append('size', currentFilters.size);
        if (currentFilters.search) url.searchParams.append('search', currentFilters.search);

        const response = await fetch(url);
        if (!response.ok) throw new Error('Ошибка при ответе сервера');
        
        const products = await response.json();
        grid.innerHTML = '';

        if (products.length === 0) {
            grid.innerHTML = '<div class="loading">Ничего не найдено по вашему запросу 👾</div>';
            return;
        }

        products.forEach(product => {
            const card = document.createElement('div');
            card.className = 'product-card';

            const imgUrl = product.imageUrl ? product.imageUrl : 'https://via.placeholder.com/400/140f19/08ffe2?text=MILKA';

            // ГЕНЕРИРУЕМ КРУЖОЧКИ ЦВЕТОВ
            let colorsHtml = '';
            if (product.availableColors && product.availableColors.length > 0) {
                product.availableColors.forEach(colorName => {
                    // Ищем HEX код в нашей карте, если не нашли - ставим серый по умолчанию
                    const hexColor = colorMap[colorName] || '#555555';
                    colorsHtml += `<div class="color-circle" style="background-color: ${hexColor};" title="${colorName}"></div>`;
                });
            }

            card.innerHTML = `
                <div class="image-container">
                    <img src="${imgUrl}" alt="${product.productName}">
                </div>
                <div class="product-info">
                    <span class="product-category">${product.category}</span>
                    <h4 class="product-name">${product.productName}</h4>
                    <p class="product-details">${product.description || 'Без описания'}</p>
                    
                    <div class="product-colors">
                        ${colorsHtml}
                    </div>

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

// Слушатели событий
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
        currentFilters.category = e.target.value;
        loadProducts();
    });

    document.getElementById('colorFilter').addEventListener('change', (e) => {
        currentFilters.color = e.target.value;
        loadProducts();
    });

    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.classList.contains('active')) {
                btn.classList.remove('active');
                currentFilters.size = '';
            } else {
                sizeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilters.size = btn.dataset.size;
            }
            loadProducts();
        });
    });

    const searchInput = document.getElementById('searchInput');
    const triggerSearch = () => {
        currentFilters.search = searchInput.value.trim();
        loadProducts();
    };

    document.getElementById('searchBtn').addEventListener('click', triggerSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') triggerSearch();
    });

    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        currentFilters = { category: '', color: '', size: '', search: '' };
        document.getElementById('categoryFilter').value = '';
        document.getElementById('colorFilter').value = '';
        searchInput.value = '';
        sizeButtons.forEach(b => b.classList.remove('active'));
        loadProducts();
    });

    loadProducts();
});