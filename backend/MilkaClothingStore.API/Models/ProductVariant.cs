using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("ProductVariants")]
    public class ProductVariant
    {
        [Key]
        [Column("VariantId")] // Привязываем наше свойство к реальному первичному ключу VariantId!
        public int ProductVariantId { get; set; }

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

    
        [Column("PriceAdjustment", TypeName = "decimal(18,2)")]
        public decimal? PriceAdjustment { get; set; }

        [ForeignKey("ProductId")]
        public Product? Product { get; set; }

        [ForeignKey("ColorId")]
        public Color? Color { get; set; }

        [ForeignKey("SizeId")]
        public Size? Size { get; set; }
    }
}