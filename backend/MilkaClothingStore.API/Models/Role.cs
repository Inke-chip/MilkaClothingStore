using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("Roles")] // Указываем точное имя таблицы в SQL Server
    public class Role
    {
        [Key] // Это первичный ключ (PRIMARY KEY)
        public int RoleId { get; set; }

        [Required]
        [MaxLength(50)]
        public string RoleName { get; set; } = string.Empty;
    }
}