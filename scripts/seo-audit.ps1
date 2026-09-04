$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$ignored = '^(deploy-|source-|startsmartai(?:\\|$))'
$files = Get-ChildItem -LiteralPath $root -Recurse -File -Filter '*.html' |
  Where-Object { $_.FullName.Substring($root.Length + 1) -notmatch $ignored -and $_.Name -notmatch '^google[0-9a-f]+\.html$' }
$seenTitles = @{}
$seenDescriptions = @{}
$seenCanonicals = @{}
$issues = [System.Collections.Generic.List[string]]::new()
foreach ($file in $files) {
  $relative = $file.FullName.Substring($root.Length + 1)
  $html = [IO.File]::ReadAllText($file.FullName)
  $titles = [regex]::Matches($html, '(?is)<title\b[^>]*>(.*?)</title>')
  $descriptions = [regex]::Matches($html, '(?is)<meta\b(?=[^>]*\bname=["'']description["''])[^>]*\bcontent=["'']([^"'']*)["''][^>]*>')
  $h1s = [regex]::Matches($html, '(?is)<h1\b[^>]*>.*?</h1>')
  $canonicals = [regex]::Matches($html, '(?is)<link\b(?=[^>]*\brel=["'']canonical["''])[^>]*\bhref=["'']([^"'']+)["''][^>]*>')
  $indexable = $html -notmatch '(?i)\bnoindex\b'
  if ($indexable) {
    foreach ($check in @(@('title', $titles.Count), @('description', $descriptions.Count), @('h1', $h1s.Count), @('canonical', $canonicals.Count))) {
      if ($check[1] -ne 1) { $issues.Add("${relative}: $($check[1]) $($check[0]) tags (expected 1)") }
    }
  }
  foreach ($item in @(@($seenTitles, $(if ($titles.Count) { $titles[0].Groups[1].Value.Trim().ToLowerInvariant() } else { '' })), @($seenDescriptions, $(if ($descriptions.Count) { $descriptions[0].Groups[1].Value.Trim().ToLowerInvariant() } else { '' })), @($seenCanonicals, $(if ($canonicals.Count) { $canonicals[0].Groups[1].Value.Trim().ToLowerInvariant() } else { '' })))) {
    if ($item[1]) { if (-not $item[0].ContainsKey($item[1])) { $item[0][$item[1]] = @() }; $item[0][$item[1]] += $relative }
  }
}
foreach ($group in @(@('title', $seenTitles), @('description', $seenDescriptions), @('canonical', $seenCanonicals))) {
  foreach ($entry in $group[1].GetEnumerator()) { if ($entry.Value.Count -gt 1) { $issues.Add("Duplicate $($group[0]): $($entry.Value -join ', ')") } }
}
Write-Output "Audited $($files.Count) production HTML files."
if ($issues.Count) { $issues | Sort-Object; exit 1 }
Write-Output 'No core SEO tag or H1 issues found.'
