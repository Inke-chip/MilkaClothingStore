using Microsoft.EntityFrameworkCore;
using MilkaClothingStore.API.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()   // Разрешаем запросы с любого адреса (включая твой Live Server)
              .AllowAnyMethod()   // Разрешаем любые методы (GET, POST и т.д.)
              .AllowAnyHeader();  // Разрешаем любые заголовки
    });
});

builder.Services.AddDbContext<StoreDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

builder.Services.AddOpenApi();

var app = builder.Build();
app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();