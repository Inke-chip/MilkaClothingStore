using System.ComponentModel.DataAnnotations;

namespace MilkaClothingStore.API.DTOs
{
    public class RegisterDto
    {
        [Required(ErrorMessage = "Email обязателен для заполнения")]
        [EmailAddress(ErrorMessage = "Некорректный формат Email")]
        [MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "Пароль обязателен для заполнения")]
        [MinLength(6, ErrorMessage = "Пароль должен быть не менее 6 символов")]
        public string Password { get; set; } = string.Empty;

        [Required(ErrorMessage = "Имя обязательно для заполнения")]
        [MaxLength(50)]
        public string FirstName { get; set; } = string.Empty;

        [Required(ErrorMessage = "Фамилия обязательна для заполнения")]
        [MaxLength(50)]
        public string LastName { get; set; } = string.Empty;

        [MaxLength(20)]
        public string? Phone { get; set; }

        [Required(ErrorMessage = "Идентификатор роли обязателен")]
        public int RoleId { get; set; } // Сюда передаем ID роли из таблицы Roles
    }
}