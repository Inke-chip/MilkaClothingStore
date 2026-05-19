using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("Products")]
    public class Product
    {
        [Key]
        public int ProductId { get; set; }

        [Required]
        [Column("Name")]
        [MaxLength(150)]
        public string ProductName { get; set; } = string.Empty;

        
        public string? Description { get; set; }


        [Required]
        [Column("BasePrice", TypeName = "decimal(18,2)")]
        public decimal Price { get; set; }

        
        [NotMapped]
        public string? ImageUrl { get; set; } = "default_clothing.jpg";

        public bool IsActive { get; set; } = true;

        public DateTime? CreatedAt { get; set; }

        [Required]
        public int CategoryId { get; set; }

        [ForeignKey("CategoryId")]
        public Category? Category { get; set; }
    }
}