using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MilkaClothingStore.API.Data;
using MilkaClothingStore.API.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MilkaClothingStore.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")] // Наш эндпоинт будет доступен по адресу: api/users
    public class UsersController : ControllerBase
    {
        private readonly StoreDbContext _context;

        // Внедряем наш контекст базы данных через конструктор (Dependency Injection)
        public UsersController(StoreDbContext context)
        {
            _context = context;
        }

        // GET: api/users — Получить список всех пользователей из базы данных
        [HttpGet]
        public async Task<ActionResult<IEnumerable<User>>> GetUsers()
        {
            var users = await _context.Users.ToListAsync();
            return Ok(users);
        }

        // GET: api/users/5 — Получить конкретного пользователя по его ID
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
    }
}