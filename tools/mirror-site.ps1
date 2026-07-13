$ErrorActionPreference = "Stop"

$siteRoot = "https://adit.balloondecorationbhopal.com"
$workspaceRoot = Split-Path -Parent $PSScriptRoot
$downloadRoot = Join-Path $workspaceRoot "mirror"

$pages = @(
    @{ Url = "$siteRoot/"; Local = "index.html" },
    @{ Url = "$siteRoot/services/"; Local = "services/index.html" },
    @{ Url = "$siteRoot/world-wide-card-processing/"; Local = "world-wide-card-processing/index.html" },
    @{ Url = "$siteRoot/company-incorporation-services/"; Local = "company-incorporation-services/index.html" },
    @{ Url = "$siteRoot/upi-alternative-payment-solutions/"; Local = "upi-alternative-payment-solutions/index.html" },
    @{ Url = "$siteRoot/european-iban-business-accounts/"; Local = "european-iban-business-accounts/index.html" },
    @{ Url = "$siteRoot/website-technology-services/"; Local = "website-technology-services/index.html" },
    @{ Url = "$siteRoot/about-us/"; Local = "about-us/index.html" },
    @{ Url = "$siteRoot/contact-us/"; Local = "contact-us/index.html" }
)

function Ensure-Directory([string]$path) {
    if (-not (Test-Path -LiteralPath $path)) {
        New-Item -ItemType Directory -Path $path | Out-Null
    }
}

function Normalize-AssetUri([string]$rawUrl, [string]$baseUrl) {
    if ([string]::IsNullOrWhiteSpace($rawUrl)) {
        return $null
    }

    if ($rawUrl.StartsWith("//")) {
        return "https:$rawUrl"
    }

    if ($rawUrl.StartsWith("http://") -or $rawUrl.StartsWith("https://")) {
        return $rawUrl
    }

    if ($rawUrl.StartsWith("/")) {
        return "$siteRoot$rawUrl"
    }

    if ($rawUrl.StartsWith("#") -or $rawUrl.StartsWith("data:")) {
        return $null
    }

    return ([System.Uri]::new([System.Uri]$baseUrl, $rawUrl)).AbsoluteUri
}

function Test-IsAssetUrl([string]$assetUrl) {
    if (-not $assetUrl) {
        return $false
    }

    $uri = [System.Uri]$assetUrl
    $path = $uri.AbsolutePath.ToLowerInvariant()

    if ($path.StartsWith("/wp-content/") -or $path.StartsWith("/wp-includes/")) {
        return $true
    }

    return $path -match '\.(css|js|png|jpe?g|webp|gif|svg|woff2?|ttf|eot|ico|json|webm|mp4)$'
}

function Get-AssetLocalPath([string]$assetUrl) {
    $uri = [System.Uri]$assetUrl
    $path = $uri.AbsolutePath.TrimStart("/")

    if ([string]::IsNullOrWhiteSpace($path)) {
        $path = "index"
    }

    if ($uri.Query) {
        $hash = [System.BitConverter]::ToString(
            [System.Security.Cryptography.SHA1]::Create().ComputeHash(
                [System.Text.Encoding]::UTF8.GetBytes($uri.Query)
            )
        ).Replace("-", "").ToLowerInvariant().Substring(0, 10)

        $extension = [System.IO.Path]::GetExtension($path)
        $stem = if ($extension) { $path.Substring(0, $path.Length - $extension.Length) } else { $path }
        $path = if ($extension) { "$stem.$hash$extension" } else { "$stem.$hash" }
    }

    return (Join-Path $downloadRoot $path)
}

function Get-CssDependencies([string]$cssFilePath, [string]$assetUrl) {
    if (-not (Test-Path -LiteralPath $cssFilePath)) {
        return @()
    }

    $content = Get-Content -LiteralPath $cssFilePath -Raw
    $deps = [System.Collections.Generic.List[string]]::new()

    [regex]::Matches($content, 'url\((["'']?)([^)"'']+)\1\)', 'IgnoreCase') | ForEach-Object {
        $raw = $_.Groups[2].Value.Trim()
        if ($raw -and -not $raw.StartsWith("data:")) {
            $normalized = Normalize-AssetUri $raw $assetUrl
            if (Test-IsAssetUrl $normalized) {
                $deps.Add($normalized)
            }
        }
    }

    [regex]::Matches($content, '@import\s+(?:url\()?\s*["'']?([^"'');]+)', 'IgnoreCase') | ForEach-Object {
        $normalized = Normalize-AssetUri $_.Groups[1].Value.Trim() $assetUrl
        if (Test-IsAssetUrl $normalized) {
            $deps.Add($normalized)
        }
    }

    return $deps | Sort-Object -Unique
}

function Download-Asset([string]$assetUrl, [hashtable]$map, [System.Collections.Generic.HashSet[string]]$visited) {
    if (-not $assetUrl) {
        return
    }

    if ($visited.Contains($assetUrl)) {
        return
    }

    $visited.Add($assetUrl) | Out-Null
    $localPath = Get-AssetLocalPath $assetUrl
    $localDir = Split-Path -Parent $localPath
    Ensure-Directory $localDir

    try {
        Invoke-WebRequest -Uri $assetUrl -OutFile $localPath -UseBasicParsing
        $map[$assetUrl] = $localPath

        if ($localPath.ToLowerInvariant().EndsWith('.css')) {
            foreach ($dependency in Get-CssDependencies $localPath $assetUrl) {
                Download-Asset $dependency $map $visited
            }
        }
    }
    catch {
        Write-Warning "Failed to download asset: $assetUrl"
    }
}

if (Test-Path -LiteralPath $downloadRoot) {
    Remove-Item -LiteralPath $downloadRoot -Recurse -Force
}

Ensure-Directory $downloadRoot

$assetMap = @{}
$visitedAssets = [System.Collections.Generic.HashSet[string]]::new()

foreach ($page in $pages) {
    $response = Invoke-WebRequest -Uri $page.Url -UseBasicParsing
    $html = $response.Content

    $assetUrls = [System.Collections.Generic.List[string]]::new()

    foreach ($pattern in @('<link[^>]+href=["'']([^"'']+)["'']', '<script[^>]+src=["'']([^"'']+)["'']', '<img[^>]+src=["'']([^"'']+)["'']', '<img[^>]+srcset=["'']([^"'']+)["'']', '<source[^>]+srcset=["'']([^"'']+)["'']')) {
        [regex]::Matches($html, $pattern, 'IgnoreCase') | ForEach-Object {
            $raw = $_.Groups[1].Value
            if ($pattern -match 'srcset') {
                $raw.Split(',') | ForEach-Object {
                    $part = ($_ -split '\s+')[0].Trim()
                    $normalized = Normalize-AssetUri $part $page.Url
                    if ((Test-IsAssetUrl $normalized) -and $normalized.StartsWith($siteRoot)) {
                        $assetUrls.Add($normalized)
                    }
                }
            }
            else {
                $normalized = Normalize-AssetUri $raw $page.Url
                if ((Test-IsAssetUrl $normalized) -and $normalized.StartsWith($siteRoot)) {
                    $assetUrls.Add($normalized)
                }
            }
        }
    }

    $assetUrls | Sort-Object -Unique | ForEach-Object {
        Download-Asset $_ $assetMap $visitedAssets
    }

    $localPagePath = Join-Path $workspaceRoot $page.Local
    Ensure-Directory (Split-Path -Parent $localPagePath)
    Set-Content -LiteralPath $localPagePath -Value $html -Encoding UTF8
}

$assetMap.GetEnumerator() | Sort-Object Name | ForEach-Object {
    "$($_.Name)`t$($_.Value.Replace($workspaceRoot, '.'))"
} | Set-Content -LiteralPath (Join-Path $workspaceRoot 'mirror-map.tsv') -Encoding UTF8
