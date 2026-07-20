$ErrorActionPreference = "Stop"

$workspaceRoot = (Get-Location).Path
$cssPath = Join-Path $workspaceRoot 'assets\css\legacy-head-styles.css'
$htmlFiles = Get-ChildItem -Path $workspaceRoot -Recurse -Filter *.html
$blocks = New-Object System.Collections.Generic.List[string]
$seen = @{}

foreach ($file in $htmlFiles) {
    $content = Get-Content -LiteralPath $file.FullName -Raw
    $headMatch = [regex]::Match($content, '<head>[\s\S]*?</head>', 'IgnoreCase')
    if (-not $headMatch.Success) { continue }

    $head = $headMatch.Value
    $styleMatches = [regex]::Matches($head, '<style(?<attrs>[^>]*)>(?<css>[\s\S]*?)</style>', 'IgnoreCase')
    if ($styleMatches.Count -eq 0) { continue }

    foreach ($match in $styleMatches) {
        $attrs = $match.Groups['attrs'].Value.Trim()
        $css = $match.Groups['css'].Value.Trim()
        if (-not $css) { continue }

        $key = ($attrs + "`n" + $css)
        if (-not $seen.ContainsKey($key)) {
            $label = $file.FullName.Replace($workspaceRoot + '\', '').Replace('\', '/')
            $comment = if ($attrs) { "/* Source: $label | style $attrs */" } else { "/* Source: $label */" }
            $blocks.Add($comment)
            $blocks.Add($css)
            $blocks.Add("")
            $seen[$key] = $true
        }
    }

    $cleanHead = [regex]::Replace($head, '<style[^>]*>[\s\S]*?</style>\s*', '', 'IgnoreCase')
    if ($cleanHead -notmatch '/assets/css/legacy-head-styles\.css') {
        $cleanHead = $cleanHead.Replace("</head>", "`r`n<link rel='stylesheet' href='/assets/css/legacy-head-styles.css'>`r`n</head>")
    }

    $updated = $content.Substring(0, $headMatch.Index) + $cleanHead + $content.Substring($headMatch.Index + $headMatch.Length)
    Set-Content -LiteralPath $file.FullName -Value $updated -Encoding UTF8
}

$finalCss = @("/* Consolidated top-level page CSS extracted from HTML heads. */", "") + $blocks
Set-Content -LiteralPath $cssPath -Value $finalCss -Encoding UTF8
