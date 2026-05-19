using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MilkaClothingStore.API.Data;
using MilkaClothingStore.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace MilkaClothingStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly StoreDbContext _context;

        public ProductsController(StoreDbContext context)
        {
            _context = context;
        }

        // GET: api/products
        // Получить каталог товаров с фильтрацией по категории, цвету, размеру и текстовым поиском по совпадениям
        [HttpGet]
        public async Task<IActionResult> GetAllProducts(
            [FromQuery] string? category = null,
            [FromQuery] string? color = null,
            [FromQuery] string? size = null,
            [FromQuery] string? search = null)
        {
            try
            {
                // 1. Формируем базовые запросы к таблицам (AsQueryable позволяет строить SQL-запрос динамически)
                var productsQuery = _context.Products.Include(p => p.Category).AsQueryable();
                var variantsQuery = _context.ProductVariants.Include(v => v.Color).Include(v => v.Size).AsQueryable();

                // 2. Применяем фильтр по категории вещи (например, Худи)
                if (!string.IsNullOrEmpty(category))
                {
                    productsQuery = productsQuery.Where(p => p.Category != null && p.Category.CategoryName == category);
                }

                // 3. Применяем фильтр по цвету ткани
                if (!string.IsNullOrEmpty(color))
                {
                    variantsQuery = variantsQuery.Where(v => v.Color != null && v.Color.ColorName == color);
                }

                // 4. Применяем фильтр по размерной сетке
                if (!string.IsNullOrEmpty(size))
                {
                    variantsQuery = variantsQuery.Where(v => v.Size != null && v.Size.SizeName == size);
                }

                // 5. Полнотекстовый поиск по совпадениям в названии или описании товара
                if (!string.IsNullOrEmpty(search))
                {
                    var lowerSearch = search.ToLower();
                    productsQuery = productsQuery.Where(p => 
                        p.ProductName.ToLower().Contains(lowerSearch) || 
                        (p.Description != null && p.Description.ToLower().Contains(lowerSearch)));
                }

                // Выполняем отфильтрованные запросы в базу данных SQL Server
                var products = await productsQuery.ToListAsync();
                var variants = await variantsQuery.ToListAsync();

                // 6. Агрегируем (склеиваем) данные из разных таблиц в единую структуру для фронтенда
                var result = products
                    .Select(p => new
                    {
                        p.ProductId,
                        p.ProductName,
                        p.Description,
                        p.Price,
                        p.ImageUrl,
                        Category = p.Category != null ? p.Category.CategoryName : "Без категории",
                        
                        // Собираем массив только тех цветов, которые реально привязаны к этому товару
                        AvailableColors = variants
                            .Where(v => v.ProductId == p.ProductId)
                            .Select(v => v.Color?.ColorName)
                            .Distinct()
                            .Where(c => c != null)
                            .ToList(),
                            
                        // Собираем массив доступных размеров для этой модели одежды
                        AvailableSizes = variants
                            .Where(v => v.ProductId == p.ProductId)
                            .Select(v => v.Size?.SizeName)
                            .Distinct()
                            .Where(s => s != null)
                            .ToList(),
                            
                        // Подсчитываем суммарный остаток всех вариантов товара на складе
                        TotalStock = variants
                            .Where(v => v.ProductId == p.ProductId)
                            .Sum(v => v.StockQuantity)
                    })
                    // Убираем из итоговой выдачи карточки, у которых нет остатков по выбранному цвету/размеру
                    .Where(p => p.TotalStock > 0 || (string.IsNullOrEmpty(color) && string.IsNullOrEmpty(size)))
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                // Возвращаем понятную ошибку в случае сбоя бэкенда или БД
                return StatusCode(500, new { message = "Ошибка при получении каталога товаров", details = ex.Message });
            }
        }
    }
}