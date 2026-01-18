# Script para limpiar conflictos de merge
$files = @(
    "src/components/Hero.jsx",
    "src/components/Features.jsx",
    "src/components/Footer.jsx",
    "src/components/DashboardPreview.jsx",
    "src/components/dashboard/MyBusiness.jsx",
    "src/pages/Dashboard.jsx",
    "src/pages/Login.jsx",
    "src/pages/Register.jsx"
)

foreach ($file in $files) {
    $fullPath = Join-Path $PSScriptRoot $file
    if (Test-Path $fullPath) {
        Write-Host "Limpiando $file..."
        $content = Get-Content $fullPath -Raw
        
        # Eliminar bloques de conflicto manteniendo la versión HEAD
        $content = $content -replace '(?ms)<<<<<<< HEAD\r?\n(.*?)\r?\n=======\r?\n.*?\r?\n>>>>>>> [a-f0-9]+\r?\n', '$1'
        
        Set-Content -Path $fullPath -Value $content -NoNewline
        Write-Host "✓ $file limpiado"
    }
}

Write-Host "`n✓ Todos los archivos limpiados"
