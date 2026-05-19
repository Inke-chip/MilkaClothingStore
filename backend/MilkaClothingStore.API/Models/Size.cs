using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("Sizes")]
    public class Size
    {
        [Key]
        public int SizeId { get; set; }

        // Привязываем свойство к реальной колонке "SizeCode" в базе
        [Required]
        [Column("SizeCode")]
        [MaxLength(10)]
        public string SizeName { get; set; } = string.Empty; // В коде оставим SizeName для удобства, но в БД пойдет SizeCode

        [MaxLength(50)]
        public string? SizeSystem { get; set; }
    }
}