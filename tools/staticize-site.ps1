$ErrorActionPreference = "Stop"

$workspaceRoot = Split-Path -Parent $PSScriptRoot
$siteRoot = "https://adit.balloondecorationbhopal.com"
$mapPath = Join-Path $workspaceRoot "mirror-map.tsv"
$map = [ordered]@{}

Get-Content -LiteralPath $mapPath | ForEach-Object {
    if (-not $_.Trim()) { return }
    $parts = $_ -split "`t", 2
    if ($parts.Length -eq 2) {
        $local = ($parts[1] -replace '^[.][\\/]', '/') -replace '\\', '/'
        if (-not $local.StartsWith('/')) { $local = "/$local" }
        $map[$parts[0]] = $local
    }
}

$orderedKeys = $map.Keys | Sort-Object Length -Descending

function Replace-MappedUrls([string]$content) {
    foreach ($key in $orderedKeys) {
        $content = $content.Replace($key, $map[$key])
        $decoded = $key.Replace('&amp;','&')
        if ($decoded -ne $key) {
            $content = $content.Replace($decoded, $map[$key])
        }
    }

    $content = $content.Replace("$siteRoot/wp-content/", "/mirror/wp-content/")
    $content = $content.Replace("$siteRoot/wp-includes/", "/mirror/wp-includes/")
    $content = $content.Replace("$siteRoot/", "/")
    $content = $content.Replace($siteRoot, "/")
    $content = $content.Replace("http://adit.balloondecorationbhopal.com/wp-content/", "/mirror/wp-content/")
    $content = $content.Replace("http://adit.balloondecorationbhopal.com/wp-includes/", "/mirror/wp-includes/")

    $content = [regex]::Replace($content, '/\.\\mirror\\[^"''\s)]+', { param($m) $m.Value.Replace('/.\\mirror\\', '/mirror/').Replace('\\', '/') })
    $content = [regex]::Replace($content, '/\.\\mirror/[^"''\s)]+', { param($m) $m.Value.Replace('/.\\mirror/', '/mirror/').Replace('\\', '/') })
    $content = [regex]::Replace($content, '/\.\/mirror/[^"''\s)]+', { param($m) $m.Value.Replace('/./mirror/', '/mirror/').Replace('\\', '/') })
    $content = [regex]::Replace($content, '/mirror/[^"''\s)]*', { param($m) $m.Value.Replace('\\', '/') })
    return $content
}

$htmlFiles = Get-ChildItem -Path $workspaceRoot -Recurse -Filter *.html | Where-Object { $_.FullName -notlike "*\\mirror\\*" }
$assetFiles = Get-ChildItem -Path (Join-Path $workspaceRoot 'mirror') -Recurse -File | Where-Object { $_.Extension -in '.css','.js' }

foreach ($file in $assetFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $updated = Replace-MappedUrls $content
    if ($updated -ne $content) {
        Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8
    }
}

$headInjection = "`r`n<link rel='stylesheet' href='/assets/css/tailwind-output.css'>`r`n</head>"
$bodyInjection = "`r`n<script defer src='/assets/js/site.js'></script>`r`n</body>"

foreach ($file in $htmlFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $updated = Replace-MappedUrls $content

    $updated = [regex]::Replace($updated, '<link rel="alternate"[^>]*>\s*', '', 'IgnoreCase')
    $updated = [regex]::Replace($updated, '<link rel="https://api\.w\.org/"[^>]*>\s*', '', 'IgnoreCase')
    $updated = [regex]::Replace($updated, '<link rel="EditURI"[^>]*>\s*', '', 'IgnoreCase')
    $updated = [regex]::Replace($updated, '<meta name="generator"[^>]*>\s*', '', 'IgnoreCase')
    $updated = [regex]::Replace($updated, '<script type="speculationrules">[\s\S]*?</script>\s*', '', 'IgnoreCase')

    if ($updated -notmatch '/assets/css/tailwind-output\.css') {
        $updated = $updated.Replace('</head>', $headInjection)
    }

    if ($updated -notmatch '/assets/js/site\.js') {
        $updated = $updated.Replace('</body>', $bodyInjection)
    }

    Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8
}
