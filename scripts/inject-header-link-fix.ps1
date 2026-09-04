$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ignored = '^(deploy-|source-|startsmartai(?:\\|$)|admin(?:\\|$))'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' | Where-Object { $_.FullName.Substring($root.Length + 1) -notmatch $ignored -and $_.Name -notmatch '^google[0-9a-f]+\.html$' }
$changed = 0
foreach ($file in $files) {
  $html = [IO.File]::ReadAllText($file.FullName)
  if ($html -match 'class="career-links"' -and $html -notmatch '/assets/header-link-fix\.css') {
    $updated = $html.Replace('</head>', '<link rel="stylesheet" href="/assets/header-link-fix.css"></head>')
    [IO.File]::WriteAllText($file.FullName, $updated, [Text.UTF8Encoding]::new($false))
    $changed++
  }
}
Write-Output "Normalized the Career Finder header link on $changed pages."
