using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("Sizes")]
    public class Size
    {
        [Key]
        public int SizeId { get; set; }

        [Required]
        [MaxLength(10)]
        public string SizeName { get; set; } = string.Empty; // S, M, L, 42, 44...
    }
}