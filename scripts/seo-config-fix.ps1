$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$vercelPath = Join-Path $root 'vercel.json'
$config = Get-Content -LiteralPath $vercelPath -Raw | ConvertFrom-Json
$archiveRedirects = @(
  [pscustomobject]@{ source = '/deploy-:id/:path*'; destination = '/:path*'; permanent = $true },
  [pscustomobject]@{ source = '/source-:id/:path*'; destination = '/:path*'; permanent = $true },
  [pscustomobject]@{ source = '/startsmartai/:path*'; destination = '/:path*'; permanent = $true }
)
$config.redirects = @($archiveRedirects) + @($config.redirects | Where-Object { $_.source -notin $archiveRedirects.source })
$noindexHeaders = @(
  [pscustomobject]@{ source = '/admin/:path*'; headers = @([pscustomobject]@{ key = 'X-Robots-Tag'; value = 'noindex, nofollow, noarchive' }) },
  [pscustomobject]@{ source = '/files/:path*'; headers = @([pscustomobject]@{ key = 'X-Robots-Tag'; value = 'noindex, nofollow, noarchive' }) }
)
$config.headers = @($noindexHeaders) + @($config.headers | Where-Object { $_.source -notin $noindexHeaders.source })
[IO.File]::WriteAllText($vercelPath, ($config | ConvertTo-Json -Depth 10) + [Environment]::NewLine, [Text.UTF8Encoding]::new($false))
$robotsPath = Join-Path $root 'robots.txt'
$robots = [IO.File]::ReadAllText($robotsPath)
foreach ($line in @('Disallow: /deploy-*/', 'Disallow: /source-*/', 'Disallow: /startsmartai/', 'Disallow: /files/')) { if ($robots -notmatch [regex]::Escape($line)) { $robots = $robots.Replace('Disallow: /admin/', "Disallow: /admin/`r`n$line") } }
[IO.File]::WriteAllText($robotsPath, $robots, [Text.UTF8Encoding]::new($false))
Write-Output 'Added archive redirects and noindex controls.'
