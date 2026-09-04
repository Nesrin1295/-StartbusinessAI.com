$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ignored = '^(deploy-|source-|startsmartai(?:\\|$)|admin(?:\\|$))'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' | Where-Object { $_.FullName.Substring($root.Length + 1) -notmatch $ignored }
$changed = 0
foreach ($file in $files) {
  $html = [IO.File]::ReadAllText($file.FullName)
  $updated = $html.Replace('href="/index.html', 'href="/').Replace("href='/index.html", "href='/")
  $updated = $updated.Replace('href="../index.html', 'href="../').Replace("href='../index.html", "href='../")
  $updated = [regex]::Replace($updated, '(href=["''])(?!https?://)([^"''?#]+)\.html(?=([?#"'']))', '$1$2')
  if ($updated -ne $html) { [IO.File]::WriteAllText($file.FullName, $updated, [Text.UTF8Encoding]::new($false)); $changed++ }
}
Write-Output "Removed redirecting .html suffixes from internal links in $changed files."
