$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ignored = '^(deploy-|source-|startsmartai(?:\\|$)|admin(?:\\|$))'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' | Where-Object { $r = $_.FullName.Substring($root.Length + 1); $r -notmatch $ignored -and $_.Name -notmatch '^google[0-9a-f]+\.html$' }
foreach ($file in $files) {
  $html = [IO.File]::ReadAllText($file.FullName)
  $updated = [regex]::Replace($html, '(https://startbusinessai\.online/(?:[^"''<>&?\s]+))\.html(?=(["''<>&?\s]))', '$1')
  if ($file.Name -eq 'career-finder.html' -and $updated -notmatch 'rel=["'']canonical["'']') { $updated = $updated.Replace('<link rel="icon"', '<link rel="canonical" href="https://startbusinessai.online/career-finder"><link rel="icon"') }
  if ($file.Name -eq 'portfolio.html' -and $updated -notmatch '(?i)<h1\b') { $updated = $updated.Replace('<div class="shell" data-portfolio></div>', '<div class="shell" data-portfolio><h1>Build Your Career Portfolio Project</h1><p>Choose a career to create a practical portfolio project and save your progress.</p></div>') }
  if ($file.Name -eq 'roadmap.html' -and $updated -notmatch '(?i)<h1\b') { $updated = $updated.Replace('<div class="shell" data-roadmap></div>', '<div class="shell" data-roadmap><h1>My Career Roadmap</h1><p>Complete the career finder to create your personalized learning and portfolio roadmap.</p></div>') }
  if ($updated -ne $html) { [IO.File]::WriteAllText($file.FullName, $updated, [Text.UTF8Encoding]::new($false)) }
}
$urls = foreach ($file in $files) { $r = $file.FullName.Substring($root.Length + 1).Replace('\\', '/'); if ($r -eq 'index.html') { '/' } else { '/' + $r.Substring(0, $r.Length - 5) } }
$urls = $urls | Sort-Object { if ($_ -eq '/') { '0' } else { '1' + $_ } }
$lines = @('<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
foreach ($url in $urls) { $p = if ($url -eq '/') { '1.0' } elseif ($url -like '/guides/*') { '0.75' } elseif ($url -like '/freetools/*') { '0.80' } else { '0.60' }; $f = if ($url -eq '/' -or $url -eq '/ideas' -or $url -like '/guides/*') { 'weekly' } else { 'monthly' }; $lines += "  <url><loc>https://startbusinessai.online$url</loc><lastmod>2026-09-04</lastmod><changefreq>$f</changefreq><priority>$p</priority></url>" }
$lines += '</urlset>'
[IO.File]::WriteAllLines((Join-Path $root 'sitemap.xml'), $lines, [Text.UTF8Encoding]::new($false))
Write-Output "Fixed SEO metadata and generated a sitemap with $($urls.Count) URLs."
