# leadbot · 机器人招标商机查询

> **当前状态(2026-07-20)**:自动抓取脚本(方案 2)已配好。  
> 推送 GitHub 后,每天 0:00 UTC(北京时间 8:00)自动跑一次。  
> 本文档介绍如何启用自动更新。

---

## 一、这个项目是什么

参照 `robot-leads-design.md` 设计的查询前台。

- **前端**: 静态 HTML + Tailwind + 原生 JS,无后端
- **数据**: 写死在 `data.js` 里(`window.LEADS = [...]`)
- **运行方式**: 任意 HTTP 服务器(本地双击 `index.html` 也行)

## 二、当前数据情况(2026-07-20 自动抓取)

- 88 条 lead,6 个真实信源
- 数据来源:中国政府采购网 / 中招国际 / 中国机器人网 / 中国公共采购网 / 必联网 / 中招联合
- 详细见顶部黄底 banner

## 三、如何启用自动更新(GitHub Actions)

### 一次性设置

1. **把项目推到 GitHub**:
```bash
cd /Users/jimmyzhao/Documents/机器人招标信息查询
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:YOUR_USERNAME/leadbot.git  # 改你的
git push -u origin main
```

2. **启用 GitHub Actions**:
- 进 GitHub 仓库 → Settings → Actions → General → "Allow all actions and reusable workflows" → Save

3. **(可选)启用 GitHub Pages 自动部署**:
- Settings → Pages → Source: "GitHub Actions" → Save
- 访问 `https://YOUR_USERNAME.github.io/leadbot/`

4. (可选) 设置 Secrets:
- 进 Settings → Secrets and variables → Actions
- 加 `MAX_LEADS_PER_SOURCE` = 25(默认 25,可不设)

### 之后会发生什么

- 每天 0:00 UTC(北京时间 8:00)`.github/workflows/daily-fetch.yml` 自动跑
- 装 Python 3.11 + Playwright + Chromium
- 跑 `fetch_leads.py`,抓 ~80-120 条 lead
- 自动 `git commit` + `git push` 更新 `data.js`
- 如果挂了 Pages,网站几分钟内自动更新

### 手动触发

进 GitHub 仓库 → Actions → "Daily fetch robot tender leads" → Run workflow

## 四、本地运行

```bash
# 装依赖
pip install playwright
playwright install chromium

# 跑抓取(覆盖 data.js)
python3 fetch_leads.py

# 用任意 HTTP server 跑前端
python3 -m http.server 8765
# 打开 http://localhost:8765/
```

## 五、抓取的数据源(6 个真实信源)

| 源 | URL 模式 | 抓取方式 |
|---|---|---|
| 中国政府采购网 CCGP | search.ccgp.gov.cn/bxsearch?kw= | Playwright + 等 2 秒 |
| 中招国际 | chinabidding.com | Playwright |
| 中国机器人网 | robot-china.com/news/search.php | Playwright |
| 中国公共采购网 | cgpnews.cn | Playwright |
| 必联网 | ebnew.com/info/list-1-1... | Playwright |
| 中招联合 | 365trade.com.cn/jhwzb/ | Playwright |

其他 36 个源在 SOURCES 目录但目前未接采集器。

## 六、文件结构

```
.
├── index.html             # 页面骨架
├── data.js                # 88 条 lead(自动生成)
├── app.js                 # 过滤/搜索/详情(IIFE 包裹)
├── fetch_leads.py         # 抓取脚本(Playwright)
├── requirements.txt       # Python 依赖
├── .github/workflows/
│   └── daily-fetch.yml    # GitHub Actions 每日自动跑
└── README.md
```

## 七、常见问题

**Q: 抓取失败?**
A: 多数源有反爬机制(Cloudflare 521、JS 验证)。fetch_leads.py 已加 wait_for_timeout,但仍可能偶尔失败。重跑即可。

**Q: 数据是真实的吗?**
A: 88 条 lead 全部 is_real=true,URL 全部经过 Playwright 实测可达。CCGP/中招国际/必联网/中招联合 是真实招标公告,中国机器人网/中国公共采购网 是行业新闻动态。

**Q: 怎么加新的信源?**
A: 编辑 `fetch_leads.py`,在 `for src_key, src_name, url_tpl, kw_list in [...]` 加一条;同时在 `data.js` 顶部的 `window.SOURCES` 加新源条目。

**Q: GitHub Actions 跑超时?**
A: 抓取 6 个源一般 5-10 分钟完成。`timeout-minutes: 30` 已设。

## 八、扩展建议

- 接入设计文档里描述的 LLM 抽取(目前 `extract_notes` 是占位)
- 加 admin UI 让人工编辑 lead 状态
- 把 fetch_leads.py 输出改成 JSON,再写个 importer 进 PostgreSQL(走设计文档的 schema)
- 增量更新:不去重直接入库,让 `merged_count` 字段做交叉去重
