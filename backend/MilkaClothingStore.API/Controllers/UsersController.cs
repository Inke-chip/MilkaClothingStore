using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MilkaClothingStore.API.Data;
using MilkaClothingStore.API.DTOs; // Не забываем подключить DTOs!
using MilkaClothingStore.API.Models;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MilkaClothingStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly StoreDbContext _context;

        public UsersController(StoreDbContext context)
        {
            _context = context;
        }

        // GET: api/users
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }

        // GET: api/users/5
        [HttpGet("{id}")]
        public async Task<ActionResult<User>> GetUser(int id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null)
            {
                return NotFound(new { message = $"Пользователь с ID {id} не найден" });
            }
            return Ok(user);
        }

        // POST: api/users/register — РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // 1. Проверяем, нет ли уже пользователя с таким Email в базе
            if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
            {
                return BadRequest(new { message = "Пользователь с таким Email уже зарегистрирован" });
            }

            // 2. ХЭШИРУЕМ ПАРОЛЬ с помощью BCrypt (в базу летит безопасная строка, а не чистый пароль)
            string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

            // 3. Создаем объект нового пользователя для записи в БД
            var newUser = new User
            {
                Email = dto.Email,
                PasswordHash = passwordHash,
                FirstName = dto.FirstName,
                LastName = dto.LastName,
                Phone = dto.Phone,
                CreatedAt = DateTime.UtcNow
            };

            // 4. Сохраняем в SQL Server
            _context.Users.Add(newUser);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Регистрация прошла успешно!" });
        }
    }
}