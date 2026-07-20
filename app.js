(function(){
// ============ 状态 ============
const state = {
  search: "",
  lead_types: new Set(),
  categories: new Set(),
  regions: new Set(),
  sizes: new Set(),
  statuses: new Set(),
  sources: new Set(),
  qty_min: 0,
  qty_max: 50000,
  conf_min: 0,
  sort: "published_desc",
  selectedId: null
};

// ============ 工具 ============
const qs = (sel) => document.querySelector(sel);
const qsa = (sel) => Array.from(document.querySelectorAll(sel));
const fmt = (n) => {
  if (n === null || n === undefined) return "—";
  if (n >= 10000) return (n/10000).toFixed(n%10000===0?0:1) + "万";
  return n.toLocaleString();
};
const fmtQty = (lead) => {
  if (lead.est_qty_min == null && lead.est_qty_max == null) return "数量未明";
  const unit = lead.qty_unit || "";
  const period = lead.qty_period === "per_year" ? "/年" : "";
  if (lead.est_qty_min === lead.est_qty_max || lead.est_qty_max == null) {
    return `${fmt(lead.est_qty_min)}${unit}${period}`;
  }
  return `${fmt(lead.est_qty_min)}-${fmt(lead.est_qty_max)}${unit}${period}`;
};
const daysLeft = (deadline) => {
  if (!deadline) return null;
  const d = new Date(deadline);
  const today = new Date("2026-07-17");
  return Math.round((d - today) / (1000 * 60 * 60 * 24));
};
const confColor = (c) => c >= 0.8 ? "#16a34a" : c >= 0.6 ? "#f59e0b" : "#ef4444";
const confLabel = (c) => c >= 0.8 ? "高" : c >= 0.6 ? "中" : "低";
const verifiedMeta = {
  reachable:   { label: "可访问",   chipClass: "chip-green" },
  unstable:    { label: "不稳定",   chipClass: "chip-amber" },
  partial:     { label: "部分可访问", chipClass: "chip-amber" },
  unreachable: { label: "暂不可达", chipClass: "chip-rose" },
  landing_only:{ label: "仅官网",   chipClass: "chip-blue" },
  waf_blocked: { label: "受保护",   chipClass: "chip-amber" }
};

// ============ 渲染筛选器 ============
function renderFilters() {
  // 商机类型
  const leadTypes = [
    ["procurement", "采购"],
    ["custom", "定制"],
    ["solution", "方案"],
    ["oem", "代工"],
    ["other", "其他"]
  ];
  qs("#filterLeadType").innerHTML = leadTypes.map(([code, label]) => {
    const count = window.LEADS.filter(l => l.lead_type === code).length;
    return `
      <label class="flex items-center justify-between cursor-pointer hover:bg-ink-50 -mx-1 px-1 rounded">
        <span class="flex items-center gap-2 text-sm">
          <input type="checkbox" data-filter="lead_types" data-value="${code}" class="accent-brand-500">
          <span>${label}</span>
        </span>
        <span class="text-xs text-ink-400">${count}</span>
      </label>`;
  }).join("");

  // 产品品类
  const cats = Object.entries(window.META.product_category);
  qs("#filterCategory").innerHTML = cats.map(([code, info]) => {
    const count = window.LEADS.filter(l => l.product_category === code).length;
    return `
      <label class="flex items-center justify-between cursor-pointer hover:bg-ink-50 -mx-1 px-1 rounded">
        <span class="flex items-center gap-2 text-sm">
          <input type="checkbox" data-filter="categories" data-value="${code}" class="accent-brand-500">
          <span class="inline-block w-2 h-2 rounded-full" style="background:${info.color}"></span>
          <span>${info.label}</span>
        </span>
        <span class="text-xs text-ink-400">${count}</span>
      </label>`;
  }).join("");

  // 地区
  const regionSet = new Set();
  window.LEADS.forEach(l => l.regions.forEach(r => regionSet.add(r)));
  const regions = Array.from(regionSet).sort();
  qs("#filterRegion").innerHTML = regions.map(r => {
    const count = window.LEADS.filter(l => l.regions.includes(r)).length;
    return `
      <label class="flex items-center justify-between cursor-pointer hover:bg-ink-50 -mx-1 px-1 rounded">
        <span class="flex items-center gap-2 text-sm">
          <input type="checkbox" data-filter="regions" data-value="${r}" class="accent-brand-500">
          <span>${r}</span>
        </span>
        <span class="text-xs text-ink-400">${count}</span>
      </label>`;
  }).join("");

  // 需求方规模
  const sizes = [
    ["large", "大型"],
    ["medium", "中型"],
    ["small", "小型"],
    ["unknown", "未知"]
  ];
  qs("#filterSize").innerHTML = sizes.map(([code, label]) => {
    const count = window.LEADS.filter(l => l.demand_side_size === code).length;
    return `
      <label class="flex items-center justify-between cursor-pointer hover:bg-ink-50 -mx-1 px-1 rounded">
        <span class="flex items-center gap-2 text-sm">
          <input type="checkbox" data-filter="sizes" data-value="${code}" class="accent-brand-500">
          <span>${label}</span>
        </span>
        <span class="text-xs text-ink-400">${count}</span>
      </label>`;
  }).join("");

  // 信源(优先用 catalog 里所有源,加数据计数;无数据的也显示但带"待接入"标记)
  const sourceCounts = new Map();
  window.LEADS.forEach(l => l.sources.forEach(s => {
    sourceCounts.set(s.source_name, (sourceCounts.get(s.source_name) || 0) + 1);
  }));
  // 合并 catalog + 实际有数据的源
  const catalogSources = window.SOURCES || {};
  const allSourceNames = new Set();
  // 1) catalog 的 name
  Object.values(catalogSources).forEach(s => allSourceNames.add(s.name));
  // 2) 实际数据里的 source_name
  sourceCounts.forEach((_, name) => allSourceNames.add(name));
  
  const sources = Array.from(allSourceNames).map(name => ({
    name,
    count: sourceCounts.get(name) || 0
  })).sort((a, b) => b.count - a.count);
  
  qs("#filterSource").innerHTML = sources.map(({name, count}) => {
    const escName = name.replace(/"/g, '&quot;');
    const badge = count === 0 
      ? '<span class="text-[10px] text-ink-400 bg-ink-50 px-1 rounded shrink-0">待接入</span>' 
      : '<span class="text-xs text-ink-400 shrink-0">' + count + '</span>';
    return `
      <label class="flex items-center justify-between cursor-pointer hover:bg-ink-50 -mx-1 px-1 rounded">
        <span class="flex items-center gap-2 text-sm min-w-0">
          <input type="checkbox" data-filter="sources" data-value="${escName}" class="accent-brand-500 shrink-0">
          <span class="truncate" title="${escName}">${name}</span>
        </span>
        ${badge}
      </label>`;
  }).join("");

  // 状态
  const statuses = Object.entries(window.META.status);
  qs("#filterStatus").innerHTML = statuses.map(([code, info]) => {
    const count = window.LEADS.filter(l => l.status === code).length;
    return `
      <label class="flex items-center justify-between cursor-pointer hover:bg-ink-50 -mx-1 px-1 rounded">
        <span class="flex items-center gap-2 text-sm">
          <input type="checkbox" data-filter="statuses" data-value="${code}" class="accent-brand-500">
          <span class="chip ${info.chipClass}">${info.label}</span>
        </span>
        <span class="text-xs text-ink-400">${count}</span>
      </label>`;
  }).join("");

  // 绑定 checkbox
  qsa('[data-filter]').forEach(el => {
    el.addEventListener('change', (e) => {
      const f = e.target.dataset.filter;
      const v = e.target.dataset.value;
      if (e.target.checked) state[f].add(v);
      else state[f].delete(v);
      applyFilters();
    });
  });
}

// ============ 过滤逻辑 ============
function getFiltered() {
  let arr = window.LEADS.filter(l => {
    // 搜索
    if (state.search) {
      const s = state.search.toLowerCase();
      const hay = [
        l.title, l.product_category_raw, l.demand_side_raw,
        ...(l.components || [])
      ].join(" ").toLowerCase();
      if (!hay.includes(s)) return false;
    }
    // 类型
    if (state.lead_types.size && !state.lead_types.has(l.lead_type)) return false;
    // 品类
    if (state.categories.size && !state.categories.has(l.product_category)) return false;
    // 地区
    if (state.regions.size && !l.regions.some(r => state.regions.has(r))) return false;
    // 规模
    if (state.sizes.size && !state.sizes.has(l.demand_side_size)) return false;
    // 状态
    if (state.statuses.size && !state.statuses.has(l.status)) return false;
    // 信源(任一信源匹配即可)
    if (state.sources.size && !l.sources.some(s => state.sources.has(s.source_name))) return false;
    // 数量下界
    if (state.qty_min > 0) {
      const max = l.est_qty_max ?? l.est_qty_min ?? 0;
      if (max < state.qty_min) return false;
    }
    // 数量上界
    if (state.qty_max < 50000) {
      const min = l.est_qty_min ?? 0;
      if (min > state.qty_max) return false;
    }
    // 置信度
    if (l.confidence < state.conf_min) return false;
    return true;
  });

  // 排序
  const sorters = {
    published_desc: (a, b) => (b.published_at || "").localeCompare(a.published_at || ""),
    deadline_asc:   (a, b) => (a.deadline || "9999").localeCompare(b.deadline || "9999"),
    qty_desc:       (a, b) => (b.est_qty_max ?? 0) - (a.est_qty_max ?? 0),
    confidence_desc:(a, b) => b.confidence - a.confidence
  };
  return arr.sort(sorters[state.sort]);
}

// ============ 渲染卡片列表 ============
function renderLeadCard(l) {
  const typeInfo = window.META.lead_type[l.lead_type];
  const catInfo = window.META.product_category[l.product_category];
  const statusInfo = window.META.status[l.status];
  const dl = daysLeft(l.deadline);
  const dlText = dl == null ? "—" : dl < 0 ? "已截止" : `${dl}天`;
  const dlColor = dl == null ? "text-ink-400" : dl < 0 ? "text-ink-300" : dl <= 14 ? "text-rose-600 font-medium" : dl <= 30 ? "text-amber-600" : "text-ink-500";
  const confPct = Math.round(l.confidence * 100);

  return `
    <div class="lead-card bg-white rounded-xl border border-ink-100 card-shadow p-4 cursor-pointer" data-id="${l.id}">
      <div class="flex items-start gap-3">
        <div class="w-1 self-stretch rounded-full" style="background:${catInfo.color}"></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1.5">
            ${l.is_real ? '<span class="chip chip-green text-[9px] py-0">CCGP</span>' : '<span class="chip chip-amber text-[9px] py-0">示例</span>'}
            <span class="chip ${typeInfo.chipClass}">${typeInfo.label}</span>
            <span class="chip" style="background:${catInfo.color}1a;color:${catInfo.color}">${catInfo.label}</span>
            ${l.regions.slice(0,2).map(r => `<span class="chip chip-slate">${r}</span>`).join("")}
            ${l.regions.length > 2 ? `<span class="text-xs text-ink-400">+${l.regions.length-2}</span>` : ""}
            <span class="chip ${statusInfo.chipClass}">${statusInfo.label}</span>
            ${l.confidence < 0.4 ? `<span class="chip chip-rose">⚠ 低置信</span>` : ""}
            ${l.merged_count > 1 ? `<span class="chip chip-violet">聚合 ×${l.merged_count}</span>` : ""}
          </div>

          <h3 class="font-semibold text-ink-900 text-[15px] leading-snug mb-1.5">${l.title}</h3>

          <div class="flex items-center gap-4 text-xs text-ink-500 flex-wrap">
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              ${l.demand_side_raw}
            </span>
            <span class="flex items-center gap-1 text-ink-600" title="${l.sources.map(s => s.url).join('\n')}">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              ${l.sources[0].source_name}
            <span class="text-[10px] text-ink-400 ml-1" title="其它 38 个源待接入,目前仅 CCGP 有数据">其它源暂无该 lead</span>
            </span>
            <span class="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
              ${fmtQty(l)}
            </span>
          </div>

          ${l.components.length ? `
            <div class="flex items-center gap-1.5 mt-2 flex-wrap">
              ${l.components.slice(0,5).map(c => `<span class="text-[11px] px-2 py-0.5 rounded bg-ink-50 text-ink-600 border border-ink-100">${c}</span>`).join("")}
              ${l.components.length > 5 ? `<span class="text-[11px] text-ink-400">+${l.components.length-5}</span>` : ""}
            </div>
          ` : ""}
        </div>

        <div class="text-right shrink-0 w-28">
          <div class="text-[11px] text-ink-400 mb-0.5">截止</div>
          <div class="text-sm font-medium ${dlColor}">${dlText}</div>
          <div class="text-[11px] text-ink-400 mt-2">置信 ${confLabel(l.confidence)} ${confPct}%</div>
          <div class="confidence-bar mt-1">
            <div class="confidence-fill" style="width:${confPct}%;background:${confColor(l.confidence)}"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ============ 渲染 active filters ============
function renderActiveFilters() {
  const chips = [];
  const make = (key, value, label) => {
    state[key].forEach(v => chips.push({ key, value, label: label(v) }));
  };
  make("lead_types", null, v => window.META.lead_type[v]?.label || v);
  make("categories", null, v => window.META.product_category[v]?.label || v);
  make("regions", null, v => v);
  make("sizes", null, v => window.META.demand_side_size[v] || v);
  make("statuses", null, v => window.META.status[v]?.label || v);
  make("sources", null, v => v);

  if (state.qty_min > 0) chips.push({ key: "qty_min", value: state.qty_min, label: `数量 ≥ ${fmt(state.qty_min)}` });
  if (state.qty_max < 50000) chips.push({ key: "qty_max", value: state.qty_max, label: `数量 ≤ ${fmt(state.qty_max)}` });
  if (state.conf_min > 0) chips.push({ key: "conf_min", value: state.conf_min, label: `置信度 ≥ ${state.conf_min.toFixed(1)}` });
  if (state.search) chips.push({ key: "search", value: state.search, label: `搜索:"${state.search}"` });

  if (chips.length === 0) {
    qs("#activeFilters").innerHTML = '<span class="text-xs text-ink-400">未筛选</span>';
    return;
  }

  qs("#activeFilters").innerHTML = `<span class="text-xs text-ink-400">已选:</span>` + chips.map(c => `
    <span class="filter-chip">${c.label}<button data-clear="${c.key}" data-value="${c.value}">
      <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
    </button></span>
  `).join("");

  qsa('[data-clear]').forEach(el => {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const key = btn.dataset.clear;
      const value = btn.dataset.value;
      if (state[key] instanceof Set) {
        state[key].delete(value);
        // 同步 checkbox
        const cb = document.querySelector(`[data-filter="${key}"][data-value="${value}"]`);
        if (cb) cb.checked = false;
      } else if (key === "qty_min") {
        state.qty_min = 0; qs("#qtyMin").value = 0; qs("#qtyMinLabel").textContent = "0";
      } else if (key === "qty_max") {
        state.qty_max = 50000; qs("#qtyMax").value = 50000; qs("#qtyMaxLabel").textContent = "不限";
      } else if (key === "conf_min") {
        state.conf_min = 0; qs("#confSlider").value = 0; qs("#confLabel").textContent = "0.0";
      } else if (key === "search") {
        state.search = ""; qs("#globalSearch").value = "";
      }
      applyFilters();
    });
  });
}

// ============ 渲染统计 ============
function renderStats() {
  const total = window.LEADS.length;
  const today = new Date("2026-07-17");
  const weekAgo = new Date(today); weekAgo.setDate(today.getDate() - 7);
  const thisWeek = window.LEADS.filter(l => l.published_at && new Date(l.published_at) >= weekAgo).length;
  const proc = window.LEADS.filter(l => l.lead_type === "procurement").length;
  const highConf = window.LEADS.filter(l => l.confidence >= 0.8).length;
  const lowConf = window.LEADS.filter(l => l.confidence < 0.4).length;
  const deadlineSoon = window.LEADS.filter(l => {
    const d = daysLeft(l.deadline);
    return d !== null && d >= 0 && d <= 30;
  });
  const earliest = deadlineSoon.sort((a,b) => (a.deadline||"").localeCompare(b.deadline||""))[0];

  qs("#statTotal").textContent = total;
  qs("#statThisWeek").textContent = thisWeek;
  qs("#statProc").textContent = proc;
  qs("#statProcPct").textContent = total ? Math.round(proc/total*100)+"%" : "0%";
  qs("#statHighConf").textContent = highConf;
  qs("#statLowConf").textContent = lowConf;
  qs("#statDeadline").textContent = deadlineSoon.length;
  qs("#statEarliest").textContent = earliest ? earliest.deadline : "—";
}

// ============ 详情抽屉 ============
function renderDetail(lead) {
  const typeInfo = window.META.lead_type[lead.lead_type];
  const catInfo = window.META.product_category[lead.product_category];
  const sizeLabel = window.META.demand_side_size[lead.demand_side_size];
  const statusInfo = window.META.status[lead.status];
  const dl = daysLeft(lead.deadline);
  const confPct = Math.round(lead.confidence * 100);

  qs("#detailContent").innerHTML = `
    <div class="sticky top-0 bg-white border-b border-ink-100 px-6 py-4 flex items-center justify-between z-10">
      <div>
        <div class="text-xs text-ink-400 mb-0.5">商机 #${lead.id}</div>
        <h2 class="font-semibold text-ink-900">商机详情</h2>
      </div>
      <button id="closeDetail" class="text-ink-400 hover:text-ink-900 p-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>

    <div class="p-6 space-y-5">
      <!-- chips -->
      <div class="flex items-center gap-2 flex-wrap">
        <span class="chip ${typeInfo.chipClass}">${typeInfo.label}</span>
        <span class="chip" style="background:${catInfo.color}1a;color:${catInfo.color}">${catInfo.label}</span>
        <span class="chip chip-slate">${sizeLabel}需求方</span>
        <span class="chip ${statusInfo.chipClass}">${statusInfo.label}</span>
      </div>

      <!-- 标题 -->
      <div>
        <h1 class="text-xl font-semibold text-ink-900 leading-tight mb-2">${lead.title}</h1>
        <div class="text-sm text-ink-500">${lead.product_category_raw}</div>
      </div>

      <!-- 关键指标 -->
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-ink-50 rounded-lg p-3">
          <div class="text-[11px] text-ink-400 mb-1">估算数量</div>
          <div class="text-base font-semibold text-ink-900">${fmtQty(lead)}</div>
        </div>
        <div class="bg-ink-50 rounded-lg p-3">
          <div class="text-[11px] text-ink-400 mb-1">截止日期</div>
          <div class="text-base font-semibold ${dl!=null && dl>=0 && dl<=14 ? 'text-rose-600' : 'text-ink-900'}">${lead.deadline || "—"}</div>
          <div class="text-[11px] text-ink-400 mt-0.5">${dl==null?"":dl<0?"已截止":`剩 ${dl} 天`}</div>
        </div>
        <div class="bg-ink-50 rounded-lg p-3">
          <div class="text-[11px] text-ink-400 mb-1">抽取置信</div>
          <div class="text-base font-semibold" style="color:${confColor(lead.confidence)}">${confLabel(lead.confidence)} · ${confPct}%</div>
          <div class="confidence-bar mt-1.5"><div class="confidence-fill" style="width:${confPct}%;background:${confColor(lead.confidence)}"></div></div>
        </div>
      </div>

      <!-- 字段表 -->
      <div class="border border-ink-100 rounded-lg overflow-hidden">
        <div class="grid grid-cols-3 text-sm">
          <div class="col-span-1 bg-ink-50 px-4 py-2.5 text-ink-500 border-b border-r border-ink-100">需求方(原文)</div>
          <div class="col-span-2 px-4 py-2.5 border-b border-ink-100">${lead.demand_side_raw}</div>

          <div class="col-span-1 bg-ink-50 px-4 py-2.5 text-ink-500 border-b border-r border-ink-100">规模描述(原文)</div>
          <div class="col-span-2 px-4 py-2.5 border-b border-ink-100">${lead.scale_raw}</div>

          <div class="col-span-1 bg-ink-50 px-4 py-2.5 text-ink-500 border-b border-r border-ink-100">地区</div>
          <div class="col-span-2 px-4 py-2.5 border-b border-ink-100">
            ${lead.regions.map(r => `<span class="chip chip-slate mr-1">${r}</span>`).join("")}
          </div>

          <div class="col-span-1 bg-ink-50 px-4 py-2.5 text-ink-500 border-b border-r border-ink-100">部件/物料</div>
          <div class="col-span-2 px-4 py-2.5 border-b border-ink-100">
            ${lead.components.length ? lead.components.map(c => `<span class="inline-block text-xs px-2 py-0.5 rounded bg-brand-50 text-brand-700 border border-brand-100 mr-1 mb-1">${c}</span>`).join("") : '<span class="text-ink-400">—</span>'}
          </div>

          <div class="col-span-1 bg-ink-50 px-4 py-2.5 text-ink-500 border-b border-r border-ink-100">发布日期</div>
          <div class="col-span-2 px-4 py-2.5 border-b border-ink-100">${lead.published_at || "—"}</div>

          ${lead.merged_count > 1 ? `
            <div class="col-span-1 bg-ink-50 px-4 py-2.5 text-ink-500 border-b border-r border-ink-100">聚合次数</div>
            <div class="col-span-2 px-4 py-2.5 border-b border-ink-100"><span class="chip chip-violet">×${lead.merged_count}</span> <span class="text-xs text-ink-500 ml-1">跨 ${lead.sources.length} 个信源合并</span></div>
          ` : ""}

          <div class="col-span-1 bg-ink-50 px-4 py-2.5 text-ink-500 border-r border-ink-100">抽取备注</div>
          <div class="col-span-2 px-4 py-2.5">${lead.extract_notes || '<span class="text-ink-400">—</span>'}</div>
        </div>
      </div>

      <!-- 来源 -->
      <div>
        <div class="flex items-center justify-between mb-2">
          <h4 class="text-sm font-semibold text-ink-700">数据来源 (${lead.sources.length})</h4>
          <span class="text-xs text-ink-400">其它 38 个源待接入</span>
        </div>
        <div class="space-y-1.5">
          ${lead.sources.map(s => `
            <a href="${s.url}" target="_blank" class="block px-3 py-2 rounded-lg border border-ink-100 hover:border-brand-200 hover:bg-brand-50/50 transition">
              <div class="flex items-center justify-between mb-0.5">
                <span class="flex items-center gap-2 text-sm font-medium text-ink-800">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-ink-400"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  ${s.source_name}
                </span>
                <span class="text-[10px] text-ink-400 font-mono">${s.url.replace(/^https?:\/\//, '').split('/')[0]}</span>
              </div>
              <div class="text-xs text-ink-500 truncate pl-6">${s.url}</div>
            </a>
          `).join("")}
        </div>
      </div>

      <!-- 跟进 -->
      <div>
        <h4 class="text-sm font-semibold text-ink-700 mb-2">跟进状态</h4>
        <div class="bg-ink-50 rounded-lg p-3">
          <div class="flex items-center gap-2 mb-1">
            <span class="chip ${statusInfo.chipClass}">${statusInfo.label}</span>
            <span class="text-xs text-ink-400">最近更新 ${lead.status_updated_at || "2026-07-15"}</span>
          </div>
          <div class="text-sm text-ink-700">${lead.status_note || '<span class="text-ink-400 italic">暂无备注</span>'}</div>
        </div>
      </div>

      <!-- 原始文本 -->
      <details>
        <summary class="text-sm font-semibold text-ink-700 cursor-pointer flex items-center gap-1">
          <svg class="chev text-ink-400" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          查看原始文本
        </summary>
        <pre class="mt-2 p-3 bg-ink-900 text-ink-100 text-xs leading-relaxed rounded-lg overflow-x-auto whitespace-pre-wrap font-mono">${lead.raw_content}</pre>
      </details>

      <!-- 操作按钮 -->
      <div class="flex items-center gap-2 pt-2 border-t border-ink-100">
        <button class="bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-md">更新状态</button>
        <button class="border border-ink-200 hover:border-ink-300 text-sm px-4 py-2 rounded-md text-ink-700">添加备注</button>
        <button class="border border-ink-200 hover:border-ink-300 text-sm px-4 py-2 rounded-md text-ink-700">查看原始条目</button>
        <button class="ml-auto text-sm text-ink-500 hover:text-rose-600 px-3 py-2">标记忽略</button>
      </div>
    </div>
  `;

  qs("#closeDetail").addEventListener('click', closeDetail);
}

// ============ 主渲染 ============
function applyFilters() {
  const arr = getFiltered();
  qs("#resultCount").textContent = arr.length;

  if (arr.length === 0) {
    qs("#leadsList").innerHTML = "";
    qs("#emptyState").classList.remove("hidden");
  } else {
    qs("#emptyState").classList.add("hidden");
    qs("#leadsList").innerHTML = arr.map(renderLeadCard).join("");
    qsa('.lead-card').forEach(el => {
      el.addEventListener('click', () => openDetail(Number(el.dataset.id)));
    });
  }
  renderActiveFilters();
}

function openDetail(id) {
  const lead = window.LEADS.find(l => l.id === id);
  if (!lead) return;
  state.selectedId = id;
  renderDetail(lead);
  qs("#detailDrawer").classList.add("open");
  qs("#detailBackdrop").classList.remove("hidden");
  document.body.style.overflow = "hidden";

  qsa('.lead-card').forEach(el => {
    el.classList.toggle('selected', Number(el.dataset.id) === id);
  });
}

function closeDetail() {
  qs("#detailDrawer").classList.remove("open");
  qs("#detailBackdrop").classList.add("hidden");
  document.body.style.overflow = "";
  state.selectedId = null;
  qsa('.lead-card').forEach(el => el.classList.remove("selected"));
}

// ============ 事件绑定 ============
function bindEvents() {
  // 全局搜索
  qs("#globalSearch").addEventListener('input', (e) => {
    state.search = e.target.value;
    applyFilters();
  });

  // ⌘K 聚焦
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      qs("#globalSearch").focus();
    }
    if (e.key === 'Escape' && state.selectedId) closeDetail();
  });

  // 排序
  qsa('.seg-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      qsa('.seg-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.sort = btn.dataset.sort;
      applyFilters();
    });
  });

  // 数量 slider
  qs("#qtyMin").addEventListener('input', (e) => {
    state.qty_min = Number(e.target.value);
    qs("#qtyMinLabel").textContent = state.qty_min === 0 ? "0" : fmt(state.qty_min);
    applyFilters();
  });
  qs("#qtyMax").addEventListener('input', (e) => {
    state.qty_max = Number(e.target.value);
    qs("#qtyMaxLabel").textContent = state.qty_max === 50000 ? "不限" : fmt(state.qty_max);
    applyFilters();
  });

  // 置信度
  qs("#confSlider").addEventListener('input', (e) => {
    state.conf_min = Number(e.target.value) / 100;
    qs("#confLabel").textContent = state.conf_min.toFixed(1);
    applyFilters();
  });

  // 清空
  qs("#clearAll").addEventListener('click', () => {
    state.lead_types.clear(); state.categories.clear(); state.regions.clear();
    state.sizes.clear(); state.statuses.clear(); state.sources.clear();
    state.qty_min = 0; state.qty_max = 50000;
    state.conf_min = 0; state.search = "";
    qsa('[data-filter]').forEach(el => el.checked = false);
    qs("#qtyMin").value = 0; qs("#qtyMax").value = 50000;
    qs("#qtyMinLabel").textContent = "0"; qs("#qtyMaxLabel").textContent = "不限";
    qs("#confSlider").value = 0; qs("#confLabel").textContent = "0.0";
    qs("#globalSearch").value = "";
    applyFilters();
  });

  // 抽屉背景点击关闭
  qs("#detailBackdrop").addEventListener('click', closeDetail);

  // nav tabs (装饰用,模拟多页)
  qsa('.nav-tab').forEach(t => {
    t.addEventListener('click', () => {
      qsa('.nav-tab').forEach(x => x.classList.remove('active'));
      t.classList.add('active');
    });
  });
}



// ============ 数据状态计数 ============
function updateDataStatus() {
  const real = window.LEADS.filter(l => l.is_real).length;
  const realEl = document.getElementById("realCount");
  if (realEl) realEl.textContent = real;
  
  // Banner 动态数字
  const lc = document.getElementById("leadCount");
  if (lc) lc.textContent = window.LEADS.length;
  
  // 按源统计
  const srcCount = new Map();
  window.LEADS.forEach(l => l.sources.forEach(s => {
    srcCount.set(s.source_name, (srcCount.get(s.source_name) || 0) + 1);
  }));
  const sc = document.getElementById("srcCount");
  if (sc) sc.textContent = srcCount.size;
  
  // 6 个固定源位置
  const srcMap = {
    "中国政府采购网": "src1", "中国机器人网": "src2", "中招国际": "src3",
    "中国公共采购网": "src4", "必联网": "src5", "中招联合": "src6"
  };
  for (const [name, elid] of Object.entries(srcMap)) {
    const el = document.getElementById(elid);
    if (el) {
      const c = srcCount.get(name) || 0;
      el.innerHTML = `${name}(<span id="${elid}c">${c}</span>)`;
    }
  }
  
  // 最后更新日期
  const lu = document.getElementById("lastUpdate");
  if (lu && window.LEADS.length > 0) {
    const dates = window.LEADS.map(l => l.published_at).filter(Boolean).sort().reverse();
    if (dates.length > 0) lu.textContent = dates[0];
  }
}

// ============ 启动 ============
renderFilters();
renderStats();
bindEvents();
applyFilters();
updateDataStatus();
})();

