$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ignored = '\\(deploy-|source-|startsmartai\\)'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' | Where-Object { $_.FullName -notmatch $ignored }
$changed = 0
foreach ($file in $files) {
  $html = [IO.File]::ReadAllText($file.FullName)
  $updated = [regex]::Replace($html, '<a class="nav-cta" href="/career-finder"(?: aria-current="page")?>Career Finder</a>', '')
  $updated = $updated.Replace('href="/career-finder"', 'href="/#career-questionnaire"')
  if ($updated -ne $html) { [IO.File]::WriteAllText($file.FullName, $updated, [Text.UTF8Encoding]::new($false)); $changed++ }
}
$platformPath = Join-Path $root 'assets/career-platform.js'
$platform = [IO.File]::ReadAllText($platformPath).Replace('href="${base}/career-finder"', 'href="/#career-questionnaire"')
[IO.File]::WriteAllText($platformPath, $platform, [Text.UTF8Encoding]::new($false))
Write-Output "Removed the header item and routed Career Finder links home in $changed pages."
