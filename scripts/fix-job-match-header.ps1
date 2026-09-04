$ErrorActionPreference = 'Stop'
$path = Join-Path (Split-Path -Parent $PSScriptRoot) 'job-match.html'
$html = [IO.File]::ReadAllText($path)
$old = '<nav class="career-nav"><a class="career-logo" href="/"><img src="/assets/career-logo.svg" alt="StartBusinessAI"></a><button class="career-menu" aria-expanded="false">Menu</button><div class="career-links"><a href="/">Home</a><a href="/career-finder">Career Finder</a><a href="/careers">Careers</a><a href="/cv-tools">CV Tools</a><a href="/jobs">Jobs</a><a href="/job-match" aria-current="page">Job Match</a></div></nav>'
$new = '<nav class="career-nav"><a class="career-logo" href="/"><img src="/assets/career-logo.svg" alt="StartBusinessAI"></a><button class="career-menu" aria-expanded="false" aria-label="Open navigation">Menu</button><div class="career-links"><a href="/">Home</a><a href="/careers">Careers</a><a href="/cv-tools">CV Tools</a><a href="/jobs">Jobs</a><a href="/job-match" aria-current="page">Job Match</a><a href="/roadmap">My Roadmap</a><a class="nav-cta" href="/career-finder">Career Finder</a></div></nav>'
if (-not $html.Contains($old)) { throw 'Expected job-match header markup was not found.' }
[IO.File]::WriteAllText($path, $html.Replace($old, $new), [Text.UTF8Encoding]::new($false))
Write-Output 'Job Match now uses the shared header structure.'
