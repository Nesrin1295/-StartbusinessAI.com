$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ignored = '^(deploy-|source-|startsmartai(?:\\|$)|admin(?:\\|$))'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' | Where-Object { $_.FullName.Substring($root.Length + 1) -notmatch $ignored -and $_.Name -notmatch '^google[0-9a-f]+\.html$' }
$changed = 0
foreach ($file in $files) {
  $html = [IO.File]::ReadAllText($file.FullName)
  $updated = $html
  if ($updated -notmatch '/assets/header-rtl-fix\.css') { $updated = $updated.Replace('</head>', '<link rel="stylesheet" href="/assets/header-rtl-fix.css"></head>') }
  if ($updated -notmatch '/assets/i18n-extra\.js') { $updated = $updated.Replace('</head>', '<script defer src="/assets/i18n-extra.js"></script></head>') }
  if ($updated -ne $html) { [IO.File]::WriteAllText($file.FullName, $updated, [Text.UTF8Encoding]::new($false)); $changed++ }
}
Write-Output "Applied compact RTL header and extended Arabic translations to $changed pages."
