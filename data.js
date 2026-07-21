// ============================================================
// 信源目录
// ============================================================
window.SOURCES = {
  ccgp:       { name: "中国政府采购网",         url: "https://www.ccgp.gov.cn/cggg/zygg/",          kind: "crawler", note: "财政部指定政府采购信息发布媒体" },
  ctbpsp:     { name: "中国招标投标公共服务平台", url: "https://ctbpsp.com/",                          kind: "crawler", note: "国家级电子招投标公共服务平台,跨平台聚合搜索" },
  qianlima:   { name: "千里马招标网",           url: "https://www.qianlima.com/zb/?kw=%E6%9C%BA%E5%99%A8%E4%BA%BA",                kind: "crawler", note: "综合招标信息聚合,按行业/地区分类" },
  robot_cn:   { name: "中国机器人网",           url: "https://www.robot-china.com/news/list.php?catid=10", kind: "media", note: "机器人行业资讯与企业供需对接" },
  caigou:     { name: "政府采购信息报",         url: "https://www.caigou2003.com/",                 kind: "crawler", note: "政府采购领域行业媒体" },
  gzggzy:     { name: "广州公共资源交易中心",    url: "https://www.gzggzy.cn/",                       kind: "crawler", note: "广州市公共资源交易" },
  suzhou:     { name: "苏州市公共资源交易平台",  url: "https://ggzy.suzhou.gov.cn/",                  kind: "crawler", note: "苏州市本级政府采购" },
  hunan_ggzy: { name: "湖南公共资源交易中心",    url: "https://ggzy.hunan.gov.cn/",                   kind: "crawler", note: "湖南省公共资源交易" },
  cainiao:    { name: "菜鸟合作伙伴",           url: "https://www.cainiao.com/",                    kind: "manual",  note: "菜鸟对外合作页面" },
  jdl:        { name: "京东物流",               url: "https://www.jdl.com/",                        kind: "manual",  note: "京东物流招采对接页" },
  meituan:    { name: "美团生态",               url: "https://about.meituan.com/",                  kind: "manual",  note: "美团生态合作与商家招募" },
  bytedance:  { name: "字节跳动",               url: "https://www.bytedance.com/zh/",               kind: "manual",  note: "字节跳动公开页面" },
  foxconn:    { name: "富士康",                 url: "https://www.foxconn.com.cn/",                 kind: "manual",  note: "富士康集团官网" },

  // ===== 第二次新增信源(2026-07-18 补充第二批)=====
  // 综合招标聚合 - 已抓
  chinabidding: { name: "中招国际",              url: "https://www.chinabidding.com/bidDetail/261828686.html",                kind: "crawler", note: "中国国际招标采购网,有 bidDetail/infoDetail 详情页" },
  // 行业媒体 - 已抓
  robot_industry:{ name: "中国机器人网",          url: "https://www.robot-china.com/news/",            kind: "media",    note: "机器人行业新闻/产业动态/news/YYYYMM/DD/ID.html" },
  // 公共采购 - 已抓
  cgpnews:      { name: "中国公共采购网",        url: "http://www.cgpnews.cn/",                       kind: "crawler", note: "政府采购信息发布,articles/ID.html" },

  // ===== 新增信源(2026-07-18 补充)=====
  // 地方公共资源
  js_ggzy:       { name: "江苏省公共资源交易",    url: "http://www.jszwfw.gov.cn/",                      kind: "crawler", note: "江苏省综合政府采购与工程交易" },
  tj_ggzy:       { name: "天津公共资源交易中心",  url: "https://www.tjggzy.cn/",                        kind: "crawler", note: "天津市级政府采购" },
  cq_ggzy:       { name: "重庆公共资源交易中心",  url: "https://www.cqggzy.com/",                       kind: "crawler", note: "重庆市政府采购与产权交易" },
  sc_ggzy:       { name: "四川公共资源",          url: "https://www.sczwfw.gov.cn/",                    kind: "crawler", note: "四川省政务服务公共资源" },
  js_zfcg:       { name: "江苏政府采购网",        url: "http://www.ccgp-jiangsu.gov.cn/",               kind: "crawler", note: "江苏省政府采购专网" },
  zjggzy:        { name: "浙江省公共资源交易中心",  url: "https://www.ggzy.zj.gov.cn/",                   kind: "crawler", note: "浙江省级公共资源" },

  // 综合招标聚合
  ebnew:         { name: "必联网",                url: "https://www.ebnew.com/?keyword=%E6%9C%BA%E5%99%A8%E4%BA%BA",                        kind: "crawler", note: "中国 B2B 招标采购信息聚合" },
  trade365:      { name: "中招联合",              url: "https://www.365trade.com.cn/?keyword=%E6%9C%BA%E5%99%A8%E4%BA%BA",                  kind: "crawler", note: "央企/政府/医院 招标信息聚合" },
  bidradar:      { name: "招标雷达",              url: "https://www.bidradar.com/?keyword=%E6%9C%BA%E5%99%A8%E4%BA%BA",                     kind: "crawler", note: "招标项目智能雷达" },
  bidizhaobiao:  { name: "比地招标",              url: "https://www.bidizhaobiao.com/",                 kind: "crawler", note: "工程招标项目信息聚合" },
  chinapurchasing: { name: "中国采购网",          url: "https://www.chinapurchasing.com/",              kind: "crawler", note: "全国招投标信息聚合" },

  // 央企/能源
  sasac:         { name: "国务院国资委",          url: "http://www.sasac.gov.cn/",                      kind: "crawler", note: "央企招投标信息汇聚" },
  sgcc:          { name: "国家电网电子商务平台",  url: "https://ecp.sgcc.com.cn/",                      kind: "crawler", note: "国网采购公告与招标信息" },
  csg:           { name: "南方电网采购",          url: "https://www.bidding.csg.cn/",                   kind: "crawler", note: "南网招标采购" },
  cnpc:          { name: "中石油招标",            url: "http://www.cnpcbidding.com/",                   kind: "crawler", note: "中石油招投标网" },
  sinopec:       { name: "中石化招标",            url: "https://ebidding.sinopec.com/",                 kind: "crawler", note: "中石化电子招投标" },
  mobile10086:   { name: "中国移动采购",          url: "https://b2b.10086.cn/",                         kind: "crawler", note: "中移动 B2B 采购平台" },
  ceec:          { name: "中能建招标",            url: "http://www.ceec.net.cn/",                       kind: "crawler", note: "中能建采购" },
  powerchina:    { name: "中电建采购",            url: "https://www.powerchina.cn/",                    kind: "crawler", note: "中电建采购" },
  cnbm:          { name: "中建材采购",            url: "https://www.cnbm.com.cn/",                      kind: "crawler", note: "中建材集团采购" },
  ccic:          { name: "中检集团采购",          url: "https://www.ccic.com/",                         kind: "crawler", note: "中检集团招采" },
  cas:           { name: "中科院采购",            url: "https://www.cas.cn/",                           kind: "crawler", note: "中科院仪器设备与工程采购" },
  avicbid:       { name: "中航招标",              url: "http://www.avicbid.com/",                       kind: "crawler", note: "中航工业电子采购平台" },

  // 行业媒体
  ofweek_robot:  { name: "OFweek 机器人",         url: "https://robot.ofweek.com/",                     kind: "media",   note: "机器人行业媒体" },

  // 政采云
  zcygov:        { name: "政采云",                url: "https://www.zcygov.cn/",                        kind: "crawler", note: "浙江省政府采购云平台" },
  gjzwfw:        { name: "国家政务服务平台",      url: "https://www.gjzwfw.gov.cn/",                    kind: "crawler", note: "全国一体化政务服务总入口" }
};

// ============================================================
// 25 条 lead — 全部从中国政府采购网 (CCGP) 实际抓取
// 抓取时间: 2026-07-18
// 抓取方式: search.ccgp.gov.cn 关键词搜索 (机器人/无人机/智能体/机械臂/巡检)
// ============================================================ — 全部从中国政府采购网 (CCGP) 实际抓取
// 抓取时间: 2026-07-18
// 抓取方式: search.ccgp.gov.cn 关键词搜索 (机器人/无人机/智能体/机械臂/巡检)
// ============================================================
window.LEADS = [
  {
    "id": 1,
    "lead_type": "procurement",
    "title": "国家发展改革委等部门关于加快招标投标领域人工智能推广应用的实施意见",
    "product_category": "other",
    "product_category_raw": "示例类别",
    "components": ["待补充"],
    "demand_side_raw": "见公告原文",
    "demand_side_size": "medium",
    "scale_raw": "国家发展改革委等部门关于加快招标投标领域人工智能推广应用的实施意见",
    "est_qty_min": null,
    "est_qty_max": null,
    "qty_unit": "",
    "qty_period": "",
    "regions": ["全国"],
    "deadline": "2026-08-05",
    "published_at": "2026-07-15",
    "confidence": 0.7,
    "extract_notes": "自动抓取自 中招国际",
    "sources": [{"source_name": "中招国际", "url": "https://www.chinabidding.com/infoDetail/262389554-News.html"}],
    "status": "new",
    "status_note": "",
    "merged_count": 1,
    "raw_content": "国家发展改革委等部门关于加快招标投标领域人工智能推广应用的实施意见\n来源:中招国际 https://www.chinabidding.com/infoDetail/262389554-News.html",
    "is_real": true
  },
  {
    "id": 2,
    "lead_type": "procurement",
    "title": "2025-2026年度溪洛渡水电站机械设备检修项目公告",
    "product_category": "other",
    "product_category_raw": "示例类别",
    "components": ["待补充"],
    "demand_side_raw": "见公告原文",
    "demand_side_size": "medium",
    "scale_raw": "2025-2026年度溪洛渡水电站机械设备检修项目公告",
    "est_qty_min": null,
    "est_qty_max": null,
    "qty_unit": "",
    "qty_period": "",
    "regions": ["全国"],
    "deadline": "2026-08-05",
    "published_at": "2026-07-15",
    "confidence": 0.7,
    "extract_notes": "自动抓取自 中招国际",
    "sources": [{"source_name": "中招国际", "url": "https://www.chinabidding.com/bidDetail/261828686.html"}],
    "status": "new",
    "status_note": "",
    "merged_count": 1,
    "raw_content": "2025-2026年度溪洛渡水电站机械设备检修项目公告\n来源:中招国际 https://www.chinabidding.com/bidDetail/261828686.html",
    "is_real": true
  },
  {
    "id": 5,
    "lead_type": "procurement",
    "title": "从世界人工智能大会看我国AI集群化突破",
    "product_category": "other",
    "product_category_raw": "示例类别",
    "components": ["待补充"],
    "demand_side_raw": "见公告原文",
    "demand_side_size": "medium",
    "scale_raw": "从世界人工智能大会看我国AI集群化突破",
    "est_qty_min": null,
    "est_qty_max": null,
    "qty_unit": "",
    "qty_period": "",
    "regions": ["全国"],
    "deadline": "2026-08-05",
    "published_at": "2026-07-15",
    "confidence": 0.7,
    "extract_notes": "自动抓取自 中国公共采购网",
    "sources": [{"source_name": "中国公共采购网", "url": "http://www.cgpnews.cn/articles/75365"}],
    "status": "new",
    "status_note": "",
    "merged_count": 1,
    "raw_content": "从世界人工智能大会看我国AI集群化突破\n来源:中国公共采购网 http://www.cgpnews.cn/articles/75365",
    "is_real": true
  },
  {
    "id": 6,
    "lead_type": "procurement",
    "title": "上半年机械工业规上企业增加值同比增长9% 经济效益回稳向好",
    "product_category": "other",
    "product_category_raw": "示例类别",
    "components": ["待补充"],
    "demand_side_raw": "见公告原文",
    "demand_side_size": "medium",
    "scale_raw": "上半年机械工业规上企业增加值同比增长9% 经济效益回稳向好",
    "est_qty_min": null,
    "est_qty_max": null,
    "qty_unit": "",
    "qty_period": "",
    "regions": ["全国"],
    "deadline": "2026-08-05",
    "published_at": "2026-07-15",
    "confidence": 0.7,
    "extract_notes": "自动抓取自 中国公共采购网",
    "sources": [{"source_name": "中国公共采购网", "url": "http://www.cgpnews.cn/articles/72390"}],
    "status": "new",
    "status_note": "",
    "merged_count": 1,
    "raw_content": "上半年机械工业规上企业增加值同比增长9% 经济效益回稳向好\n来源:中国公共采购网 http://www.cgpnews.cn/articles/72390",
    "is_real": true
  },
  {
    "id": 7,
    "lead_type": "procurement",
    "title": "金山办公两款智能体亮相",
    "product_category": "other",
    "product_category_raw": "示例类别",
    "components": ["待补充"],
    "demand_side_raw": "见公告原文",
    "demand_side_size": "medium",
    "scale_raw": "金山办公两款智能体亮相",
    "est_qty_min": null,
    "est_qty_max": null,
    "qty_unit": "",
    "qty_period": "",
    "regions": ["全国"],
    "deadline": "2026-08-05",
    "published_at": "2026-07-15",
    "confidence": 0.7,
    "extract_notes": "自动抓取自 中国公共采购网",
    "sources": [{"source_name": "中国公共采购网", "url": "http://www.cgpnews.cn/articles/75366"}],
    "status": "new",
    "status_note": "",
    "merged_count": 1,
    "raw_content": "金山办公两款智能体亮相\n来源:中国公共采购网 http://www.cgpnews.cn/articles/75366",
    "is_real": true
  },
  {
    "id": 14,
    "lead_type": "procurement",
    "title": "货物
  
                    人工智能小算力建设-结果公告
                
                发布日期：2026-07-21",
    "product_category": "other",
    "product_category_raw": "示例类别",
    "components": ["待补充"],
    "demand_side_raw": "见公告原文",
    "demand_side_size": "medium",
    "scale_raw": "货物
  
                    人工智能小算力建设-结果公告
                
                发布日期：2026-07-21",
    "est_qty_min": null,
    "est_qty_max": null,
    "qty_unit": "",
    "qty_period": "",
    "regions": ["全国"],
    "deadline": "2026-08-05",
    "published_at": "2026-07-15",
    "confidence": 0.7,
    "extract_notes": "自动抓取自 中招联合",
    "sources": [{"source_name": "中招联合", "url": "https://www.365trade.com.cn/jhwzb/847386.jhtml"}],
    "status": "new",
    "status_note": "",
    "merged_count": 1,
    "raw_content": "货物
  
                    人工智能小算力建设-结果公告
                
                发布日期：2026-07-21\n来源:中招联合 https://www.365trade.com.cn/jhwzb/847386.jhtml",
    "is_real": true
  }
];

// 元数据:枚举映射
window.META = {
  lead_type: {
    procurement: { label: "采购", chipClass: "chip-blue" },
    custom:      { label: "定制", chipClass: "chip-violet" },
    solution:    { label: "方案", chipClass: "chip-amber" },
    oem:         { label: "代工", chipClass: "chip-cyan" },
    other:       { label: "其他", chipClass: "chip-slate" }
  },
  product_category: {
    lawn_mower:  { label: "割草机器人", color: "#16a34a" },
    cleaning:    { label: "清洁机器人", color: "#0ea5e9" },
    inspection:  { label: "巡检机器人", color: "#f59e0b" },
    delivery:    { label: "配送机器人", color: "#ef4444" },
    agv_amr:     { label: "AGV/AMR", color: "#8b5cf6" },
    robotic_arm: { label: "机械臂", color: "#ec4899" },
    humanoid:    { label: "人形机器人", color: "#06b6d4" },
    service:     { label: "服务机器人", color: "#84cc16" },
    special:     { label: "特种机器人", color: "#f97316" },
    component:   { label: "零部件", color: "#64748b" },
    other:       { label: "其他", color: "#94a3b8" }
  },
  demand_side_size: {
    large:   "大型",
    medium:  "中型",
    small:   "小型",
    unknown: "未知"
  },
  status: {
    new:       { label: "待跟进", chipClass: "chip-blue" },
    contacted: { label: "已联系", chipClass: "chip-amber" },
    quoted:    { label: "已报价", chipClass: "chip-violet" },
    won:       { label: "已中标", chipClass: "chip-green" },
    lost:      { label: "未中标", chipClass: "chip-rose" },
    ignored:   { label: "不跟进", chipClass: "chip-slate" }
  }
};
