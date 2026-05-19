using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("Colors")]
    public class Color
    {
        [Key]
        public int ColorId { get; set; }

        [Required]
        [MaxLength(30)]
        public string ColorName { get; set; } = string.Empty;
    }
}