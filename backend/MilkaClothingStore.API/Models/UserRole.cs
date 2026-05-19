using System.ComponentModel.DataAnnotations.Schema;

namespace MilkaClothingStore.API.Models
{
    [Table("UserRoles")] 
    public class UserRole
    {
        public int UserId { get; set; }
        public int RoleId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }

        [ForeignKey("RoleId")]
        public Role? Role { get; set; }
    }
}