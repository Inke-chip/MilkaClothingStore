using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Hosting;
using System;
using System.IO;
using System.Threading.Tasks;
using System.Linq;
using MilkaClothingStore.API.Data;   // Подключаем папку Data, где обычно лежит контекст


// Подключаем пространство имен моделей
using MilkaClothingStore.API.Models; 

namespace MilkaClothingStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AdminController : ControllerBase
    {
        // Если твой контекст БД называется по-другому (например, MilkaContext или AppDbContext),
        // просто замени слово StoreDbContext ниже на имя твоего контекста.
        private readonly StoreDbContext _context;
        private readonly IWebHostEnvironment _env;

        public AdminController(StoreDbContext context, IWebHostEnvironment env)
        {
            _context = context;
            _env = env;
        }

        /// <summary>
        /// Добавление нового товара администратором
        /// </summary>
        [HttpPost("products")]
        public async Task<IActionResult> AddProduct([FromForm] ProductFormDto dto)
        {
            if (dto == null)
                return BadRequest("Данные товара не переданы.");

            string imageUrl = "/images/placeholder.png";

            // Логика сохранения картинки на сервер в wwwroot/images
            if (dto.Image != null && dto.Image.Length > 0)
            {
                var imagesFolder = Path.Combine(_env.WebRootPath, "images");
                if (!Directory.Exists(imagesFolder))
                {
                    Directory.CreateDirectory(imagesFolder);
                }

                var fileName = Guid.NewGuid().ToString() + Path.GetExtension(dto.Image.FileName);
                var filePath = Path.Combine(imagesFolder, fileName);

                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await dto.Image.CopyToAsync(stream);
                }

                imageUrl = "/images/" + fileName;
            }

            var categoryEntity = await _context.Categories.FirstOrDefaultAsync(c => c.CategoryName == dto.Category) 
                     ?? await _context.Categories.FirstOrDefaultAsync();
            if (categoryEntity == null)
            {
                return BadRequest("В базе данных не найдено ни одной категории. Создайте хотя бы одну категорию в таблице Categories.");
            }


            string fullDescription = $"{dto.Description}|Состав: {dto.FabricComposition}|Остаток: {dto.StockQty}";


            var product = new Product
            {
                ProductName = dto.ProductName ?? "Без названия",
                Price = dto.Price,
                Category = categoryEntity, 
                Description = fullDescription, 
                ImageUrl = imageUrl
            };

            _context.Products.Add(product);
            await _context.SaveChangesAsync();

            return Ok(product);
        }

        /// <summary>
        /// Удаление товара администратором
        /// </summary>
        [HttpDelete("products/{id}")]
        public async Task<IActionResult> DeleteProduct(int id)
        {
            var product = await _context.Products.FindAsync(id);
            if (product == null)
                return NotFound($"Товар с ID {id} не найден.");

            // Физическое удаление файла картинки с сервера
            if (!string.IsNullOrEmpty(product.ImageUrl) && !product.ImageUrl.Contains("placeholder.png"))
            {
                var filePath = Path.Combine(_env.WebRootPath, product.ImageUrl.TrimStart('/'));
                if (System.IO.File.Exists(filePath))
                {
                    System.IO.File.Delete(filePath);
                }
            }

            _context.Products.Remove(product);
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Товар {id} успешно удален." });
        }
    }

    /// <summary>
    /// Вспомогательный класс (DTO) для приема данных с фронтенда
    /// </summary>
    public class ProductFormDto
    {
        public string? ProductName { get; set; }
        public decimal Price { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? FabricComposition { get; set; }
        public int StockQty { get; set; }
        public IFormFile? Image { get; set; }
    }
}