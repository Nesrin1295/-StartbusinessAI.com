$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ignored = '^(deploy-|source-|startsmartai(?:\\|$)|admin(?:\\|$))'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' | Where-Object {
  $relative = $_.FullName.Substring($root.Length + 1)
  $relative -notmatch $ignored -and $_.Name -notmatch '^google[0-9a-f]+\.html$'
}
foreach ($file in $files) {
  $html = [IO.File]::ReadAllText($file.FullName)
  $updated = [regex]::Replace($html, '(https://startbusinessai\.online/(?:[^"''<>&?\s]+))\.html(?=(["''<>&?\s]))', '$1')
  if ($updated -ne $html) { [IO.File]::WriteAllText($file.FullName, $updated, [Text.UTF8Encoding]::new($false)) }
}
$urls = foreach ($file in $files) {
  $relative = $file.FullName.Substring($root.Length + 1).Replace('\\', '/')
  if ($relative -eq 'index.html') { '/' } else { '/' + $relative.Substring(0, $relative.Length - 5) }
}
$urls = $urls | Sort-Object { if ($_ -eq '/') { '0' } else { '1' + $_ } }
$lines = @('<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($url in $urls) {
  $priority = if ($url -eq '/') { '1.0' } elseif ($url -like '/guides/*') { '0.75' } elseif ($url -like '/freetools/*') { '0.80' } else { '0.60' }
  $frequency = if ($url -eq '/' -or $url -eq '/ideas' -or $url -like '/guides/*') { 'weekly' } else { 'monthly' }
  $lines += "  <url><loc>https://startbusinessai.online$url</loc><lastmod>2026-09-04</lastmod><changefreq>$frequency</changefreq><priority>$priority</priority></url>"
}
$lines += '</urlset>'
[IO.File]::WriteAllLines((Join-Path $root 'sitemap.xml'), $lines, [Text.UTF8Encoding]::new($false))
Write-Output "Normalized canonicals and generated a sitemap with $($urls.Count) URLs."
