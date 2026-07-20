# leadbot · 机器人招标商机查询

> **状态(2026-07-20)**: 项目就绪, 一键部署到 GitHub Actions 自动更新。
> 本地 git 仓库已初始化, 差一个 GitHub token 就能推上去。

---

## 一、这是什么

参照 `robot-leads-design.md` 设计的查询前台。

- **前端**: 静态 HTML + Tailwind + 原生 JS
- **数据**: 103 条真实 lead, 4 个源, 写死在 `data.js`(`window.LEADS = [...]`)
- **运行**: 任意 HTTP 服务器(本地双击 `index.html` 也行)

## 二、当前数据(2026-07-20 自动抓取)

| 源 | 条数 | 类型 |
|---|---|---|
| 中国机器人网 | 89 | 行业新闻 |
| 中国政府采购网 CCGP | 10 | 招标公告 |
| 中招国际 | 2 | 招标公告 |
| 中国公共采购网 | 2 | 行业经济 |

SOURCES 目录共 42 个源(38 个待接入)。其他 2 个源(必联网、中招联合)被 Cloudflare/JS 验证临时拦住。

## 三、启用自动更新(GitHub Actions)

**前置条件**: 一个 GitHub 账号 + 一个 Personal Access Token。

### 一次性操作

#### 1. 拿 GitHub token

到 https://github.com/settings/tokens/new 创建 token:
- **Note**: leadbot-deploy
- **Expiration**: 90 days(到时再续)
- **Scopes**: 勾上 `repo` (Full control of private repositories)
- 点 "Generate token", **复制** 出来(只显示一次)

#### 2. 跑部署脚本

```bash
export GH_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
cd /Users/jimmyzhao/Documents/机器人招标信息查询
./deploy-to-github.sh
```

脚本会:
- 在你的 GitHub 账号下创建 `leadbot` 仓库
- 推送 main 分支
- 启用 Actions 权限

#### 3. 第一次触发(可选)

打开 https://github.com/你的用户名/leadbot/actions:
- 左侧 "Daily fetch robot tender leads" → 右侧 "Run workflow"
- 第一次跑 5-10 分钟,生成新 `data.js`, 自动 commit + push

#### 4. 启用 Pages(可选, 让网站公网可访问)

- Settings → Pages
- Source: **GitHub Actions** → Save
- 几分钟后, 网站会出现在 `https://你的用户名.github.io/leadbot/`

### 之后会发生什么

- **每天 UTC 0:00 (北京时间 8:00)** 自动跑 `fetch_leads.py`
- 抓最新 80-120 条 lead, 覆盖 `data.js`
- GitHub Actions 自动 commit + push
- 你的网站(如果开了 Pages)几分钟内自动更新

## 四、本地运行

```bash
# 装依赖
pip install -r requirements.txt
playwright install chromium

# 跑抓取(覆盖 data.js)
python3 fetch_leads.py

# 启 HTTP server
python3 -m http.server 8765
# 浏览器打开 http://localhost:8765/
```

## 五、抓取的数据源(6 个)

| 源 | URL 模式 | 抓取方式 |
|---|---|---|
| 中国政府采购网 CCGP | search.ccgp.gov.cn/bxsearch | Playwright + 等 2 秒 |
| 中招国际 | chinabidding.com | Playwright |
| 中国机器人网 | robot-china.com/news/search.php | Playwright |
| 中国公共采购网 | cgpnews.cn | Playwright |
| 必联网 | ebnew.com/info/list-1-1... | Playwright (被 Cloudflare 拦) |
| 中招联合 | 365trade.com.cn/jhwzb/ | Playwright (被 JS 验证拦) |

## 六、文件结构

```
.
├── index.html             # 页面骨架
├── data.js                # 103 条 lead (抓取脚本生成)
├── app.js                 # 过滤/搜索/详情逻辑 (IIFE)
├── fetch_leads.py         # 抓取脚本 (Playwright)
├── deploy-to-github.sh    # 一键部署到 GitHub
├── requirements.txt       # playwright
├── .github/workflows/
│   └── daily-fetch.yml    # GitHub Actions 每日跑
├── .gitignore
└── README.md
```

## 七、常见问题

**Q: 抓取失败?**
A: 多数源有反爬(Cloudflare 521、JS 验证)。`fetch_leads.py` 加了 `wait_for_timeout`, 但仍可能偶尔失败。GitHub Actions 默认重试 3 次。

**Q: token 安全?**
A: `GH_TOKEN` 只在环境变量里, 不会写进任何文件。`.gitignore` 也忽略了 `.env` 以防误提交。建议用 fine-grained token + 设 90 天过期 + 限定 `leadbot` 仓库权限。

**Q: 想换源?**
A: 编辑 `fetch_leads.py` 里的 `for src_key, src_name, url_tpl, kw_list in [...]`,加一条;同时在 `data.js` 顶部的 `window.SOURCES` 加新源条目。

**Q: 数据是真实的吗?**
A: 103 条 lead 全部 `is_real: true`, URL 经 Playwright 实测可达。CCGP/中招国际 是真实招标公告, 中国机器人网/中国公共采购网 是行业新闻动态。
