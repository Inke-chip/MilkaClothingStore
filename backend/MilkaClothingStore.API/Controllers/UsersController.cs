using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Data.SqlClient;
using MilkaClothingStore.API.Data;
using MilkaClothingStore.API.DTOs;
using MilkaClothingStore.API.Models;
using System;
using System.Collections.Generic;
using System.Linq;
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
            try
            {
                if (await _context.Users.AnyAsync(u => u.Email == dto.Email))
                {
                    return BadRequest(new { message = "Пользователь с таким Email уже зарегистрирован" });
                }

                // Проверяем существование роли
                var roleExists = await _context.Roles.AnyAsync(r => r.RoleId == dto.RoleId);
                if (!roleExists)
                {
                    return BadRequest(new { message = $"Указанная роль с ID {dto.RoleId} не существует" });
                }

                string passwordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

                var newUser = new User
                {
                    Email = dto.Email.ToLower().Trim(),
                    PasswordHash = passwordHash,
                    FirstName = dto.FirstName,
                    LastName = dto.LastName,
                    Phone = dto.Phone,
                    CreatedAt = DateTime.UtcNow
                };

                // 1. Сохраняем пользователя, чтобы SQL Server сгенерировал ему UserId
                _context.Users.Add(newUser);
                await _context.SaveChangesAsync();

                // 2. Создаем запись в промежуточной таблице связей UserRoles
                var userRole = new UserRole
                {
                    UserId = newUser.UserId,
                    RoleId = dto.RoleId
                };

                _context.UserRoles.Add(userRole);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Регистрация прошла успешно!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ошибка при регистрации", details = ex.Message });
            }
        }

        // POST: api/users/login
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            try
            {
                // 1. Ищем пользователя по Email
                var user = await _context.Users
                    .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

                if (user == null)
                {
                    return Unauthorized(new { message = "Неверный Email или пароль" });
                }

                // 2. Проверяем хэш пароля
                bool isPasswordValid = BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash);
                if (!isPasswordValid)
                {
                    return Unauthorized(new { message = "Неверный Email или пароль" });
                }

                // 3. Достаем роль пользователя через промежуточную таблицу UserRoles
                var userRoleSetting = await _context.UserRoles
                    .Include(ur => ur.Role)
                    .FirstOrDefaultAsync(ur => ur.UserId == user.UserId);

                string roleName = userRoleSetting?.Role?.RoleName ?? "Customer";

                // 4. Формируем успешный ответ
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
                        Role = roleName
                    }
                };

                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Ошибка при входе", details = ex.Message });
            }
        }
    }
}