$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$platformPath = Join-Path $root 'assets/career-platform.js'
$js = [IO.File]::ReadAllText($platformPath)
$js = $js.Replace("const ar=document.documentElement.lang==='ar',base=ar?'/ar':'';", "const ar=document.documentElement.lang==='ar',base='';")
$js = $js.Replace('${base}/careers?id=${c.id}', '${base}/careers/${c.id}')
$js = $js.Replace('const id=new URLSearchParams(location.search).get(''id'');if(!id)return;', 'const pathId=location.pathname.match(/\/careers\/([^/]+)\/?$/);const id=new URLSearchParams(location.search).get(''id'')||(pathId&&pathId[1]);if(!id)return;')
[IO.File]::WriteAllText($platformPath, $js, [Text.UTF8Encoding]::new($false))

$header = '<nav class="career-nav"><a class="career-logo" href="/"><img src="/assets/career-logo.svg" alt="StartBusinessAI"></a><button class="career-menu" aria-expanded="false" aria-label="Open navigation">Menu</button><div class="career-links"><a href="/">Home</a><a href="/careers">Careers</a><a href="/cv-tools">CV Tools</a><a href="/jobs">Jobs</a><a href="/job-match">Job Match</a><a href="/roadmap">My Roadmap</a><a class="nav-cta" href="/career-finder">Career Finder</a></div></nav>'
$public = Get-ChildItem -LiteralPath $root -File -Filter '*.html'
foreach ($file in $public) {
  $html = [IO.File]::ReadAllText($file.FullName)
  if ($html -match '<nav class="career-nav">') {
    $current = switch ($file.Name) { 'careers.html' {'/careers'} 'cv-tools.html' {'/cv-tools'} 'jobs.html' {'/jobs'} 'job-match.html' {'/job-match'} 'roadmap.html' {'/roadmap'} 'career-finder.html' {'/career-finder'} default {''} }
    $pageHeader = if ($current) { $header.Replace(('href="' + $current + '"'), ('href="' + $current + '" aria-current="page"')) } else { $header }
    $html = [regex]::Replace($html, '<nav class="career-nav">[\s\S]*?</nav>', $pageHeader, 1)
    [IO.File]::WriteAllText($file.FullName, $html, [Text.UTF8Encoding]::new($false))
  }
}

$data = [IO.File]::ReadAllText((Join-Path $root 'assets/career-data.js'))
$matches = [regex]::Matches($data, "id:'([^']+)',title:'([^']+)',category:'([^']+)',summary:'([^']+)'")
$careerDir = Join-Path $root 'careers'
if (-not (Test-Path -LiteralPath $careerDir)) { New-Item -ItemType Directory -Path $careerDir | Out-Null }
foreach ($m in $matches) {
  $id=$m.Groups[1].Value; $title=$m.Groups[2].Value; $summary=$m.Groups[4].Value
  $page = '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+ $title +' Career Path | StartBusinessAI</title><meta name="description" content="'+ $summary +'"><link rel="canonical" href="https://startbusinessai.online/careers/'+ $id +'"><link rel="stylesheet" href="/assets/career-platform.css"><link rel="stylesheet" href="/assets/career-product.css"><link rel="stylesheet" href="/assets/i18n.css"><link rel="stylesheet" href="/assets/i18n-refinement.css"><link rel="stylesheet" href="/assets/i18n-alignment.css"><link rel="stylesheet" href="/assets/header-rtl-fix.css"><link rel="stylesheet" href="/assets/header-link-fix.css"><script src="/assets/i18n.js"></script><script src="/assets/i18n-content.js"></script><script src="/assets/i18n-tools.js"></script><script defer src="/assets/i18n-extra.js"></script><script defer src="/assets/career-data.js"></script><script defer src="/assets/career-platform.js"></script></head><body class="career-site">'+ $header.Replace('href="/careers"','href="/careers" aria-current="page"') +'<main><div data-career-detail><section class="detail-hero"><div class="shell"><span class="kicker">Career path</span><h1>'+ $title +'</h1><p>'+ $summary +'</p></div></section></div></main></body></html>'
  [IO.File]::WriteAllText((Join-Path $careerDir "$id.html"), $page, [Text.UTF8Encoding]::new($false))
}
Write-Output "Built $($matches.Count) career pages and standardized shared headers."
