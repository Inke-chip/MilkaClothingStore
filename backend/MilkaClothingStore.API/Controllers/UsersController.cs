using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using MilkaClothingStore.API.Data;
using MilkaClothingStore.API.DTOs;
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

        // POST: api/users/register
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            // Валидация модели срабатывает автоматически благодаря атрибуту [ApiController]
            try
            {
                // 1. Проверяем уникальность Email
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                {
                    return BadRequest(new { message = "Пользователь с таким Email уже зарегистрирован" });
                }

                // 2. Проверяем, существует ли указанная роль в БД
                var roleExists = await _context.Roles.AnyAsync(r => r.RoleId == dto.RoleId);
                if (!roleExists)
                {
                    return BadRequest(new { message = $"Указанная роль с ID {dto.RoleId} не существует в системе" });
                }

                // 3. Хэшируем пароль
                string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

                // 4. Создаем сущность
                var newUser = new User
                {
                    Email = dto.Email.ToLower().Trim(),
                    PasswordHash = passwordHash,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Phone = dto.Phone,
                    RoleId = dto.RoleId,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Регистрация прошла успешно!" });
            }
            catch (DbUpdateException ex) when (ex.InnerException is SqlException)
            {
                // Ловим критические ошибки самого SQL Server
                return StatusCode(500, new { message = "Ошибка базы данных при сохранении пользователя", details = ex.InnerException.Message });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Произошла внутренняя ошибка сервера", details = ex.Message });
            }
        }

        // POST: api/users/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                // 1. Ищем пользователя в БД и сразу «подтягиваем» его роль через Include
                var user = await _context.Users
                    .Include(u => u.Role)
                    .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

                // 2. Если пользователь не найден — возвращаем 401 Unauthorized
                if (user == null)
                {
                    return Unauthorized(new { message = "Неверный Email или пароль" });
                }

                // 3. Проверяем хэш пароля с помощью BCrypt
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
                if (!isPasswordValid)
                {
                    return Unauthorized(new { message = "Неверный Email или пароль" });
                }

                // 4. Формируем успешный ответ (статус 200) с данными пользователя и его ролью
                var response = new
                {
                    message = "Вход успешно выполнен",
                    user = new
                    {
                        user.UserId,
                        user.Email,
                        user.FirstName,
                        user.LastName,
                        user.Phone,
                        user.CreatedAt,
                        Role = user.Role != null ? user.Role.RoleName : "No Role"
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Произошла непредвиденная ошибка при входе", details = ex.Message });
            }
        }

        // GET: api/users (Дополнительный метод для контроля)
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users = await _context.Users.Include(u => u.Role).ToListAsync();
            return Ok(users);
        }
    }
}