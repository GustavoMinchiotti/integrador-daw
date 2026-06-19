param(
    [string]$DumpPath = "$PSScriptRoot\..\backups\control_fluido_app_20260618.dump"
)

$ErrorActionPreference = 'Stop'

if (-not $env:DATABASE_URL) {
    throw 'Defini DATABASE_URL en la terminal antes de ejecutar la restauracion.'
}

if (-not (Test-Path -LiteralPath $DumpPath)) {
    throw "No se encontro el respaldo: $DumpPath"
}

$requiredCommands = @('psql', 'pg_restore')
foreach ($command in $requiredCommands) {
    if (-not (Get-Command $command -ErrorAction SilentlyContinue)) {
        throw "No se encontro $command en PATH. Instala las herramientas de PostgreSQL."
    }
}

$tableCount = & psql --dbname=$env:DATABASE_URL -X -t -A -v ON_ERROR_STOP=1 -c `
    "SELECT count(*) FROM pg_tables WHERE schemaname = 'public';"

if ($LASTEXITCODE -ne 0) {
    throw 'No se pudo conectar con la base alojada.'
}

if ([int]$tableCount -ne 0) {
    throw "La base de destino ya contiene $tableCount tablas publicas. Se cancela para evitar sobrescrituras."
}

& pg_restore `
    --dbname=$env:DATABASE_URL `
    --no-owner `
    --no-privileges `
    --exit-on-error `
    $DumpPath

if ($LASTEXITCODE -ne 0) {
    throw 'La restauracion fallo. La base local no fue modificada.'
}

$counts = & psql --dbname=$env:DATABASE_URL -X -v ON_ERROR_STOP=1 -P pager=off -c `
    "SELECT 'clientes' AS tabla, count(*) AS filas FROM clientes
     UNION ALL SELECT 'proyectos', count(*) FROM proyectos
     UNION ALL SELECT 'tareas', count(*) FROM tareas
     UNION ALL SELECT 'usuarios', count(*) FROM usuarios
     ORDER BY tabla;"

if ($LASTEXITCODE -ne 0) {
    throw 'La restauracion termino, pero fallo la validacion de conteos.'
}

$counts
