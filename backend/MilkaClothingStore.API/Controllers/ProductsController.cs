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
        public async Task<IActionResult> GetAllProducts()
        {
            try
            {
                // 1. Сначала вытаскиваем базовые карточки товаров и их категории
                var products = await _context.Products
                    .Include(p => p.Category)
                    .ToListAsync();

                // 2. Вытаскиваем все складские варианты (размеры и цвета), которые есть в базе
                var variants = await _context.ProductVariants
                    .Include(v => v.Color)
                    .Include(v => v.Size)
                    .ToListAsync();

                // 3. Красиво группируем это всё в один JSON-ответ для карточек на фронтенде
                var result = products.Select(p => new
                {
                    p.ProductId,
                    p.ProductName,
                    p.Description,
                    p.Price,
                    p.ImageUrl,
                    Category = p.Category != null ? p.Category.CategoryName : "Без категории",
                    // Собираем массив уникальных цветов и размеров для этой карточки товара
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
                    // Общее количество товара всех видов на складе
                    TotalStock = variants
                        .Where(v => v.ProductId == p.ProductId)
                        .Sum(v => v.StockQuantity)
                });

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ошибка при получении каталога товаров", details = ex.Message });
            }
        }
    }
}