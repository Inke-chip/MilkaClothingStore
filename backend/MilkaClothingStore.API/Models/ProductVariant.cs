using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("ProductVariants")]
    public class ProductVariant
    {
        [Key]
        public int ProductVariantId { get; set; }

        // Добавляем SKU, так как он обязателен в твоей БД!
        [Required]
        [MaxLength(50)]
        public string SKU { get; set; } = string.Empty;

        [Required]
        public int ProductId { get; set; }

        [Required]
        public int ColorId { get; set; }

        [Required]
        public int SizeId { get; set; }

        [Required]
        public int StockQuantity { get; set; }

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [ForeignKey("ColorId")]
        public Color? Color { get; set; }

        [ForeignKey("SizeId")]
        public Size? Size { get; set; }
    }
}