using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("UserRoles")] // Указываем точное имя промежуточной таблицы
    public class UserRole
    {
        public int UserId { get; set; }
        public int RoleId { get; set; }

        // Навигационные свойства для удобства построения запросов
        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("RoleId")]
        public Role? Role { get; set; }
    }
}