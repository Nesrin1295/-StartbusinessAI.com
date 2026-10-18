from __future__ import annotations

from email.utils import parsedate_to_datetime
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "fedniy-articles.json"
WORDPRESS_URL = "https://fedniy.com/wp-json/wp/v2/posts?_embed&per_page=12"
RSS_URL = "https://fedniy.com/feed"
MAX_ITEMS = 12
MAX_EXCERPT_LENGTH = 360
MAX_RESPONSE_BYTES = 8 * 1024 * 1024


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.parts: list[str] = []
        self.skipped_tags: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag in {"script", "style"}:
            self.skipped_tags.append(tag)
        elif not self.skipped_tags and tag in {"br", "p", "div", "li"}:
            self.parts.append(" ")

    def handle_endtag(self, tag: str) -> None:
        if self.skipped_tags and tag == self.skipped_tags[-1]:
            self.skipped_tags.pop()
        elif not self.skipped_tags and tag in {"p", "div", "li"}:
            self.parts.append(" ")

    def handle_data(self, data: str) -> None:
        if not self.skipped_tags:
            self.parts.append(data)


def clean_text(value: object, limit: int | None = None) -> str:
    parser = TextExtractor()
    parser.feed(str(value or ""))
    text = re.sub(r"\s+", " ", html.unescape(" ".join(parser.parts))).strip()
    if limit is not None and len(text) > limit:
        text = text[:limit].rsplit(" ", 1)[0].rstrip(" .،؛,;") + "…"
    return text


def trusted_url(value: object) -> str:
    candidate = str(value or "").strip()
    parsed = urlparse(candidate)
    if parsed.scheme != "https" or parsed.hostname not in {"fedniy.com", "www.fedniy.com"}:
        return ""
    return candidate


def normalized_date(value: str | None) -> str:
    if not value:
        return ""
    try:
        return parsedate_to_datetime(value).isoformat()
    except (TypeError, ValueError, OverflowError):
        return ""


def request_bytes(url: str, accept: str) -> bytes:
    request = Request(
        url,
        headers={
            "Accept": accept,
            "User-Agent": "StartBusinessAI-ArticleCache/1.0",
        },
    )
    with urlopen(request, timeout=20) as response:
        body = response.read(MAX_RESPONSE_BYTES + 1)
    if len(body) > MAX_RESPONSE_BYTES:
        raise ValueError(f"Response exceeded {MAX_RESPONSE_BYTES} bytes")
    return body


def wordpress_articles() -> list[dict[str, object]]:
    posts = json.loads(request_bytes(WORDPRESS_URL, "application/json"))
    if not isinstance(posts, list) or not posts:
        raise ValueError("WordPress returned no posts")

    articles = []
    for post in posts[:MAX_ITEMS]:
        if not isinstance(post, dict):
            continue
        embedded = post.get("_embedded") or {}
        media = embedded.get("wp:featuredmedia") or []
        media_item = media[0] if media and isinstance(media[0], dict) else {}
        terms = embedded.get("wp:term") or []
        categories = []
        for group in terms:
            if not isinstance(group, list):
                continue
            categories.extend(
                clean_text(term.get("name"), 80)
                for term in group
                if isinstance(term, dict)
                and term.get("taxonomy") == "category"
                and term.get("name")
            )
        articles.append(
            {
                "id": str(post.get("id") or post.get("slug") or ""),
                "title": clean_text((post.get("title") or {}).get("rendered"), 180),
                "url": trusted_url(post.get("link")),
                "date": str(post.get("date") or ""),
                "categories": list(dict.fromkeys(categories))[:4],
                "image": trusted_url(media_item.get("source_url")),
                "imageAlt": clean_text(media_item.get("alt_text"), 180),
                "excerpt": clean_text((post.get("excerpt") or {}).get("rendered"), MAX_EXCERPT_LENGTH),
            }
        )
    articles = [article for article in articles if article["title"] and article["url"]]
    if not articles:
        raise ValueError("WordPress response contained no usable article metadata")
    return articles


def rss_articles() -> list[dict[str, object]]:
    root = ET.fromstring(request_bytes(RSS_URL, "application/rss+xml, application/xml, text/xml"))
    channel = root.find("channel")
    if channel is None:
        raise ValueError("RSS response had no channel")

    articles = []
    media_namespaces = (
        "{http://search.yahoo.com/mrss/}content",
        "{http://search.yahoo.com/mrss/}thumbnail",
    )
    for item in channel.findall("item")[:MAX_ITEMS]:
        title = clean_text(item.findtext("title"), 180)
        link = trusted_url(item.findtext("link"))
        if not title or not link:
            continue
        image = ""
        for namespace in media_namespaces:
            image_node = item.find(namespace)
            if image_node is not None:
                image = trusted_url(image_node.get("url"))
                if image:
                    break
        enclosure = item.find("enclosure")
        if not image and enclosure is not None:
            image = trusted_url(enclosure.get("url"))

        articles.append(
            {
                "id": clean_text(item.findtext("guid"), 100) or link,
                "title": title,
                "url": link,
                "date": normalized_date(item.findtext("pubDate")),
                "categories": list(
                    dict.fromkeys(clean_text(node.text, 80) for node in item.findall("category") if node.text)
                )[:4],
                "image": image,
                "imageAlt": title,
                "excerpt": clean_text(item.findtext("description"), MAX_EXCERPT_LENGTH),
            }
        )
    if not articles:
        raise ValueError("RSS response contained no usable article metadata")
    return articles


def save_articles(articles: list[dict[str, object]]) -> bool:
    serialized = json.dumps(articles, ensure_ascii=False, indent=2) + "\n"
    previous = OUTPUT.read_text(encoding="utf-8") if OUTPUT.exists() else None
    if previous == serialized:
        print(f"Article cache is unchanged ({len(articles)} articles)")
        return False
    OUTPUT.write_text(serialized, encoding="utf-8")
    print(f"Updated article cache with {len(articles)} articles")
    return True


def main() -> int:
    try:
        articles = wordpress_articles()
        print("Fetched article metadata from the WordPress API")
    except (HTTPError, URLError, TimeoutError, ValueError, json.JSONDecodeError) as wordpress_error:
        print(f"WordPress API unavailable; trying RSS feed: {wordpress_error}", file=sys.stderr)
        try:
            articles = rss_articles()
            print("Fetched article metadata from the RSS feed")
        except (HTTPError, URLError, TimeoutError, ValueError, ET.ParseError) as rss_error:
            print(f"Fedniy article refresh failed; keeping the last cache: {rss_error}", file=sys.stderr)
            if not OUTPUT.exists():
                save_articles([])
            return 0
    save_articles(articles)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
