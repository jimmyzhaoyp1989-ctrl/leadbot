#!/usr/bin/env python3
"""
fetch_leads.py - 抓取最新机器人/无人机/智能体/AGV 招标商机,生成 data.js

数据源(全部用 Playwright 真浏览器渲染):
  1. CCGP 中国政府采购网 - 主源
  2. 中招国际
  3. 中国机器人网
  4. 中国公共采购网
  5. 必联网
  6. 中招联合

部署:
  GitHub Actions 每天 0:00 UTC (北京时间 8:00) 自动跑,提交 data.js
  本地:  pip install playwright && playwright install chromium && python3 fetch_leads.py
"""
import asyncio
import json
import re
import sys
from datetime import date, timedelta
from pathlib import Path

try:
    from playwright.async_api import async_playwright
except ImportError:
    print("ERROR: 缺 playwright,装: pip install playwright && playwright install chromium", file=sys.stderr)
    sys.exit(1)


SOURCES_TUPLE = (
    ("ccgp", "中国政府采购网"),
    ("chinabidding", "中招国际"),
    ("robot_industry", "中国机器人网"),
    ("cgpnews", "中国公共采购网"),
    ("ebnew", "必联网"),
    ("365trade", "中招联合"),
)

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'


async def fetch_ccgp(page, kw, max_pages=1):
    """CCGP 搜索接口, 关键词, 抓多条"""
    out = []
    for page_idx in range(1, max_pages + 1):
        url = (
            f"https://search.ccgp.gov.cn/bxsearch?"
            f"searchtype=1&page_index={page_idx}&bidSort=0&bidType=0"
            f"&dbselect=bidx&kw={kw}&timeType=0&displayZone=&zoneId=&pppStatus=0"
        )
        try:
            await page.goto(url, wait_until="domcontentloaded", timeout=20000)
            await page.wait_for_timeout(2000)
            anchors = await page.evaluate(r"""
                () => Array.from(document.querySelectorAll('a[href*="/cggg/"]')).map(e => ({
                    href: e.getAttribute('href'),
                    title: e.getAttribute('title') || e.textContent.trim()
                })).filter(a => a.href && a.title && a.title.length > 5)
            """)
            for a in anchors:
                if not a['href'].startswith('http'):
                    a['href'] = 'https://www.ccgp.gov.cn' + a['href'].replace('./', '/')
                if a['href'] not in [x['href'] for x in out]:
                    out.append(a)
        except Exception as e:
            print(f"  CCGP {kw} p{page_idx} ERR: {e}", file=sys.stderr)
    return out


async def fetch_listing(page, url, selector='a'):
    """通用列表页抓取"""
    out = []
    try:
        await page.goto(url, wait_until="domcontentloaded", timeout=20000)
        await page.wait_for_timeout(2000)
        anchors = await page.evaluate(r"""
            () => {
                return Array.from(document.querySelectorAll('a')).map(e => ({
                    href: e.getAttribute('href') || e.href,
                    title: e.getAttribute('title') || e.textContent.trim()
                })).filter(a => a.href && a.title && a.title.length >= 5 && a.title.length < 100 &&
                    !a.href.startsWith('javascript:') && !a.href.startsWith('#') &&
                    /机器人|无人机|智能体|机械|AGV|巡检|人工智能/.test(a.title));
            }
        """)
        for a in anchors:
            if not a['href'].startswith('http'):
                from urllib.parse import urlparse
                p = urlparse(url)
                a['href'] = f"{p.scheme}://{p.netloc}" + a['href']
            if a['href'] not in [x['href'] for x in out]:
                out.append(a)
    except Exception as e:
        print(f"  {url} ERR: {e}", file=sys.stderr)
    return out


def date_from_url(u):
    m = re.search(r'/news/(\d{4})(\d{2})/(\d{2})/', u)
    if m: return f"{m.group(1)}-{m.group(2)}-{m.group(3)}"
    m = re.search(r'/2026(\d{2})/t2026(\d{2})(\d{2})_', u)
    if m: return f"2026-{m.group(1)}-{m.group(3)}"
    m = re.search(r'/articles/(\d+)', u)
    if m: return "2026-07-15"
    return "2026-07-15"


def extract_region(title, default="全国"):
    provinces = ["北京", "上海", "广州", "深圳", "天津", "重庆", "浙江", "江苏", "山东", "河南", "四川",
                 "湖北", "湖南", "河北", "福建", "安徽", "辽宁", "陕西", "云南", "贵州", "广西", "内蒙古",
                 "黑龙江", "吉林", "宁夏", "新疆", "海南", "国际"]
    for p in provinces:
        if p in title: return p
    return default


def build_lead(item, source_name, today, next_id):
    title = (item.get('title') or '').strip()
    if not title: return None
    pub_date = date_from_url(item['href'])
    try:
        pub_d = date.fromisoformat(pub_date)
    except ValueError:
        pub_d = today
    deadline = (pub_d + timedelta(days=21)).isoformat()
    region = extract_region(title)
    # 区分中标/成交(状态走 won)和 招标(状态走 new)
    is_won = ('中标' in title or '成交' in title) and '采购' not in title
    return {
        'id': next_id,
        'lead_type': 'procurement',  # 永远是 procurement (won 是 status)
        'title': title,
        'product_category': 'other',
        'product_category_raw': '示例类别',
        'components': ['待补充'],
        'demand_side_raw': '见公告原文',
        'demand_side_size': 'medium',
        'scale_raw': title,
        'est_qty_min': None, 'est_qty_max': None,
        'qty_unit': '', 'qty_period': '',
        'regions': [region],
        'deadline': deadline,
        'published_at': pub_date,
        'confidence': 0.7,
        'extract_notes': f"自动抓取自 {source_name}",
        'sources': [{'source_name': source_name, 'url': item['href']}],
        'status': 'won' if is_won else 'new',
        'status_note': '',
        'merged_count': 1,
        'raw_content': f"{title}\\n来源:{source_name} {item['href']}",
        'is_real': True,
    }


def main():
    today = date.today()
    out_leads = []
    next_id = [1]  # 用 list 闭包修改

    async def go():
        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(user_agent=UA)

            print("[1/6] CCGP (主源)...", file=sys.stderr)
            ccgp_items = []
            for kw in ['机器人', '无人机', '智能体', 'AGV', '机械臂', '巡检']:
                for it in await fetch_ccgp(page, kw, max_pages=1):
                    if it['href'] not in [x['href'] for x in ccgp_items]:
                        ccgp_items.append(it)
            ccgp_items.sort(key=lambda x: date_from_url(x['href']), reverse=True)
            for it in ccgp_items[:25]:
                lead = build_lead(it, "中国政府采购网", today, next_id[0])
                if lead:
                    out_leads.append(lead)
                    next_id[0] += 1
            print(f"  CCGP: {len([l for l in out_leads if l['sources'][0]['source_name']=='中国政府采购网'])} 条", file=sys.stderr)

            for src_key, src_name, url_tpl, kw_list in [
                ('chinabidding', '中招国际', 'https://www.chinabidding.com/?keyword={}', ['机器人', '无人机', '智能']),
                ('robot_industry', '中国机器人网', 'https://www.robot-china.com/news/search.php?kw={}', ['机器人', '无人机', '智能', '机械臂', '巡检']),
                ('cgpnews', '中国公共采购网', 'http://www.cgpnews.cn/?keyword={}', ['机器人', '智能', '无人机']),
                ('ebnew', '必联网', 'https://www.ebnew.com/info/list-1-1-0-0-0-0-0-0-0-0-0.html?keyword={}', ['机器人', '无人机', 'AGV', '智能']),
                ('365trade', '中招联合', 'https://www.365trade.com.cn/jhwzb/?keyword={}', ['机器人', '无人机', '智能']),
            ]:
                print(f"[{src_key}] {src_name}...", file=sys.stderr)
                before = next_id[0]
                for kw in kw_list:
                    for it in await fetch_listing(page, url_tpl.format(kw)):
                        lead = build_lead(it, src_name, today, next_id[0])
                        if lead:
                            out_leads.append(lead)
                            next_id[0] += 1
                print(f"  +{next_id[0] - before} 条", file=sys.stderr)

            await browser.close()

    asyncio.run(go())

    # 去重(同 URL 保留先出现的)
    seen = set()
    dedup = []
    for l in out_leads:
        if any(s['url'] in seen for s in l['sources']):
            continue
        dedup.append(l)
        for s in l['sources']:
            seen.add(s['url'])
    out_leads = dedup

    # 写 data.js - 只替换 window.LEADS = [...]; 块
    this_dir = Path(__file__).parent
    data_path = this_dir / 'data.js'
    data_text = data_path.read_text(encoding='utf-8')

    leads_text = ",\n  ".join([
        f'''{{
    "id": {l['id']},
    "lead_type": {json.dumps(l['lead_type'], ensure_ascii=False)},
    "title": {json.dumps(l['title'], ensure_ascii=False)},
    "product_category": {json.dumps(l['product_category'], ensure_ascii=False)},
    "product_category_raw": {json.dumps(l['product_category_raw'], ensure_ascii=False)},
    "components": {json.dumps(l['components'], ensure_ascii=False)},
    "demand_side_raw": {json.dumps(l['demand_side_raw'], ensure_ascii=False)},
    "demand_side_size": {json.dumps(l['demand_side_size'], ensure_ascii=False)},
    "scale_raw": {json.dumps(l['scale_raw'], ensure_ascii=False)},
    "est_qty_min": {json.dumps(l['est_qty_min'])},
    "est_qty_max": {json.dumps(l['est_qty_max'])},
    "qty_unit": {json.dumps(l['qty_unit'], ensure_ascii=False)},
    "qty_period": {json.dumps(l['qty_period'], ensure_ascii=False)},
    "regions": {json.dumps(l['regions'], ensure_ascii=False)},
    "deadline": {json.dumps(l['deadline'], ensure_ascii=False)},
    "published_at": {json.dumps(l['published_at'], ensure_ascii=False)},
    "confidence": {l['confidence']},
    "extract_notes": {json.dumps(l['extract_notes'], ensure_ascii=False)},
    "sources": {json.dumps(l['sources'], ensure_ascii=False)},
    "status": {json.dumps(l['status'], ensure_ascii=False)},
    "status_note": {json.dumps(l['status_note'], ensure_ascii=False)},
    "merged_count": {l['merged_count']},
    "raw_content": {json.dumps(l['raw_content'], ensure_ascii=False)},
    "is_real": {json.dumps(l['is_real'])}
  }}'''
        for l in out_leads
    ])

    new_leads_block = f"window.LEADS = [\n  {leads_text}\n];"
    pattern = re.compile(r'window\.LEADS = \[.*?\n\];', re.DOTALL)
    new_data_text = pattern.sub(new_leads_block, data_text, count=1)
    data_path.write_text(new_data_text, encoding='utf-8')

    from collections import Counter
    src_count = Counter(s['source_name'] for l in out_leads for s in l['sources'])
    print(f"\n✓ {data_path}: {len(out_leads)} 条 lead", file=sys.stderr)
    for s, c in src_count.most_common():
        print(f"  {c:3d}  {s}", file=sys.stderr)


if __name__ == "__main__":
    main()
