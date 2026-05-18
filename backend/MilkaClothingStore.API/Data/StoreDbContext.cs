using Microsoft.EntityFrameworkCore;
using MilkaClothingStore.API.Models;

namespace MilkaClothingStore.API.Data
{
    public class StoreDbContext : DbContext
    {
        public StoreDbContext(DbContextOptions<StoreDbContext> options) : base(options)
        {
        }

        public DbSet<Role> Roles { get; set; }
        public DbSet<User> Users { get; set; }
    }
}