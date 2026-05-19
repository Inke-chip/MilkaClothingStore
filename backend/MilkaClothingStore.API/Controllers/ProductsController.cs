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
        // Получить все товары со всеми их цветами, размерами и категориями для витрины
        [HttpGet]
        public async Task<IActionResult> GetAllProducts(
            [FromQuery] string? category = null,
            [FromQuery] string? color = null,
            [FromQuery] string? size = null)
        {
            try
            {
                // 1. Начинаем строить запрос к продуктам
                var productsQuery = _context.Products.Include(p => p.Category).AsQueryable();

                // 2. Начинаем строить запрос к вариантам (складу)
                var variantsQuery = _context.ProductVariants.Include(v => v.Color).Include(v => v.Size).AsQueryable();

                // Фильтр по категории (если передан)
                if (!string.IsNullOrEmpty(category))
                {
                    productsQuery = productsQuery.Where(p => p.Category != null && p.Category.CategoryName == category);
                }

                // Фильтр по цвету (если передан)
                if (!string.IsNullOrEmpty(color))
                {
                    variantsQuery = variantsQuery.Where(v => v.Color != null && v.Color.ColorName == color);
                }

                // Фильтр по размеру (если передан)
                if (!string.IsNullOrEmpty(size))
                {
                    variantsQuery = variantsQuery.Where(v => v.Size != null && v.Size.SizeName == size);
                }

                // Выполняем запросы к базе данных
                var products = await productsQuery.ToListAsync();
                var variants = await variantsQuery.ToListAsync();

                // 3. Собираем итоговый JSON, оставляя только те товары, у которых есть подходящие варианты
                var result = products
                    .Select(p => new
                    {
                        p.ProductId,
                        p.ProductName,
                        p.Description,
                        p.Price,
                        p.ImageUrl,
                        Category = p.Category != null ? p.Category.CategoryName : "Без категории",
                        AvailableColors = variants
                            .Where(v => v.ProductId == p.ProductId)
                            .Select(v => v.Color?.ColorName)
                            .Distinct()
                            .Where(c => c != null)
                            .ToList(),
                        AvailableSizes = variants
                            .Where(v => v.ProductId == p.ProductId)
                            .Select(v => v.Size?.SizeName)
                            .Distinct()
                            .Where(s => s != null)
                            .ToList(),
                        TotalStock = variants
                            .Where(v => v.ProductId == p.ProductId)
                            .Sum(v => v.StockQuantity)
                    })
                    // Если мы фильтровали по цвету или размеру, убираем из выдачи товары, 
                    // для которых не нашлось подходящих остатков на складе
                    .Where(p => p.TotalStock > 0 || (string.IsNullOrEmpty(color) && string.IsNullOrEmpty(size)))
                    .ToList();

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ошибка при получении каталога товаров", details = ex.Message });
            }
        }
    }
}