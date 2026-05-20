using System;

namespace MilkaClothingStore.API.Models
{
    public class User
    {
        public int Id { get; set; }
        
        // Добавляем '?', чтобы компилятор не ругался на пустые значения из базы
        public string? Email { get; set; } 
        public string? PasswordHash { get; set; } 
        public string? FirstName { get; set; } 
        public string? LastName { get; set; } 
        public string? Phone { get; set; } 
        public string? Role { get; set; } 
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}