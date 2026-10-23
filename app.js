/* ============================================================
   app.js — 路由（左侧导航）+ 今日看板（最后加载，统一 init）
   ============================================================ */

/* ---------------- 今日看板 ---------------- */
const DashboardModule = (function () {
  const els = {};

  function cache() {
    els.dateBig = document.getElementById('dateBig');
    els.dateMonth = document.getElementById('dateMonth');
    els.dateWeek = document.getElementById('dateWeek');
    els.greeting = document.getElementById('greeting');
    els.sumTodoValue = document.getElementById('sumTodoValue');
    els.sumTodoSub = document.getElementById('sumTodoSub');
    els.sumMoneyValue = document.getElementById('sumMoneyValue');
    els.sumMoneyNet = document.getElementById('sumMoneyNet');
    els.sumMoneyWeek = document.getElementById('sumMoneyWeek');
    els.sumMoneyMonth = document.getElementById('sumMoneyMonth');
    els.sumHabitValue = document.getElementById('sumHabitValue');
    els.sumHabitSub = document.getElementById('sumHabitSub');
    els.dashTodoList = document.getElementById('dashTodoList');
    els.dashTodoEmpty = document.getElementById('dashTodoEmpty');
    els.dashHabitList = document.getElementById('dashHabitList');
    els.dashHabitHead = document.getElementById('dashHabitHead');
    els.dashHabitEmpty = document.getElementById('dashHabitEmpty');
  }

  function renderDate() {
    const now = new Date();
    if (els.dateBig) els.dateBig.textContent = now.getDate();
    if (els.dateMonth) {
      els.dateMonth.textContent = now.getFullYear() + ' 年 ' + (now.getMonth() + 1) + ' 月';
    }
    if (els.dateWeek) {
      const wd = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
      els.dateWeek.textContent = '星期' + wd;
    }
    if (els.greeting) {
      const h = now.getHours();
      const greet = h < 6 ? '夜深了' : h < 11 ? '早上好' : h < 14 ? '中午好' :
                    h < 18 ? '下午好' : h < 23 ? '晚上好' : '夜深了';
      els.greeting.textContent = greet;
    }
  }

  function refresh() {
    // 待办进度
    const todos = window.TodoModule ? window.TodoModule.getItems() : [];
    const today = Store.todayStr();
    const todayTodos = todos.filter(t => t.createdDate === today);
    const doneToday = todayTodos.filter(t => t.done).length;
    const weekDone = window.TodoModule ? window.TodoModule.getRangeCount('week') : 0;
    const monthDone = window.TodoModule ? window.TodoModule.getRangeCount('month') : 0;
    if (els.sumTodoValue) els.sumTodoValue.textContent = doneToday + ' / ' + todayTodos.length;
    if (els.sumTodoSub) {
      const wAll = window.TodoModule ? window.TodoModule.getRangeCount('week', true) : 0;
      const mAll = window.TodoModule ? window.TodoModule.getRangeCount('month', true) : 0;
      els.sumTodoSub.textContent = '本日已完成 ' + doneToday + ' 项 · 本周 ' + weekDone +
        ' / ' + wAll + ' · 本月 ' + monthDone + '/' + mAll;
    }

    if (els.dashTodoList) {
      els.dashTodoList.innerHTML = '';
      els.dashTodoList.hidden = todayTodos.length === 0;
      todayTodos.slice().sort((a, b) => (a.done ? 1 : 0) - (b.done ? 1 : 0)).forEach(function (t) {
        const li = document.createElement('li');
        li.style.padding = '9px 16px';
        li.style.borderBottom = '1px solid var(--line-soft)';
        li.style.cursor = 'pointer';
        li.style.display = 'flex';
        li.style.justifyContent = 'space-between';
        li.style.alignItems = 'center';
        li.style.gap = '10px';

        const title = document.createElement('span');
        title.style.fontSize = '13px';
        title.textContent = t.text;
        if (t.done) {
          title.style.textDecoration = 'line-through';
          title.style.color = 'var(--ink-3)';
        }
        li.appendChild(title);

        const tag = document.createElement('span');
        tag.className = 'tag' + (t.done ? ' done' : '');
        tag.textContent = t.done ? '已完成' : '进行中';
        li.appendChild(tag);

        li.addEventListener('click', function () {
          window.TodoModule.toggleDone(t.id);
        });
        els.dashTodoList.appendChild(li);
      });
    }
    if (els.dashTodoEmpty) els.dashTodoEmpty.hidden = todayTodos.length !== 0;

    // 收支
    if (window.LedgerModule) {
      const L = window.LedgerModule;
      const todayNet = L.getTodayNet();
      const weekNet = L.getWeekNet();
      const monthNet = L.getMonthNet();
      const fmt = n => (n < 0 ? '−¥' : '¥') + Math.abs(n).toFixed(2);
      const todayIn = L.getTodayIn ? L.getTodayIn() : 0;
      const todayOut = L.getTodayOut ? L.getTodayOut() : 0;
      if (els.sumMoneyValue) els.sumMoneyValue.textContent = fmt(todayIn) + ' / ' + fmt(todayOut);
      if (els.sumMoneyNet) els.sumMoneyNet.textContent = fmt(todayNet);
      if (els.sumMoneyWeek) els.sumMoneyWeek.textContent = fmt(weekNet);
      if (els.sumMoneyMonth) els.sumMoneyMonth.textContent = fmt(monthNet);
    }

    // 打卡
    if (window.HabitsModule) {
      const s = window.HabitsModule.getSummary();
      const list = window.HabitsModule.getList();
      const daily = list.filter(function (h) { return h.period === 'day'; });
      const weekly = list.filter(function (h) { return h.period === 'week'; });
      const dailyDone = daily.filter(function (h) { return h.done; }).length;
      const weeklyDone = weekly.filter(function (h) { return h.done; }).length;

      if (els.sumHabitValue) els.sumHabitValue.textContent = s.ok + ' / ' + s.total;
      if (els.sumHabitSub) {
        els.sumHabitSub.textContent = '每日 ' + dailyDone + ' 项 · 每周 ' + weeklyDone + ' 项';
      }
      if (els.dashHabitList) {
        els.dashHabitList.innerHTML = '';
        els.dashHabitList.hidden = list.length === 0;
        if (els.dashHabitHead) {
          els.dashHabitHead.innerHTML = '打卡一览 <span class="sub">· 当前周期达标 ' +
            s.ok + ' / ' + s.total + '</span>';
        }
        list.forEach(function (h) {
          const li = document.createElement('li');

          const left = document.createElement('span');
          left.className = 'ck-name';
          const dot = document.createElement('span');
          dot.className = 'ck-dot' + (h.done ? ' on' : '');
          left.appendChild(dot);
          const nm = document.createElement('span');
          nm.textContent = h.name;
          left.appendChild(nm);

          const bar = document.createElement('span');
          bar.className = 'ck-bar';
          const fill = document.createElement('span');
          const pct = h.target > 0 ? Math.min(100, (h.cur / h.target) * 100) : 0;
          fill.style.width = pct + '%';
          bar.appendChild(fill);

          const val = document.createElement('span');
          val.className = 'ck-val';
          val.textContent = h.cur + ' / ' + h.target;

          li.appendChild(left);
          li.appendChild(bar);
          li.appendChild(val);
          els.dashHabitList.appendChild(li);
        });
      }
      if (els.dashHabitEmpty) els.dashHabitEmpty.hidden = list.length !== 0;
    }
  }

  function init() {
    cache();
    renderDate();
    refresh();
  }

  return { init: init, refresh: refresh };
})();

/* ---------------- 路由 / App ---------------- */
const App = (function () {
  const MODULE_BY_PAGE = {
    dashboard: 'DashboardModule',
    todo: 'TodoModule',
    note: 'NotesModule',
    finance: 'LedgerModule',
    shortcut: 'LinksModule',
    checkin: 'HabitsModule'
  };

  let current = 'dashboard';

  function go(page) {
    const target = document.querySelector('.page[data-page="' + page + '"]');
    if (!target) return;
    current = page;

    document.querySelectorAll('.page').forEach(function (p) {
      p.classList.toggle('active', p === target);
    });
    document.querySelectorAll('.sidebar nav li').forEach(function (li) {
      li.classList.toggle('active', li.dataset.page === page);
    });

    // 切到该页时刷新一次，保证数据是最新的
    const mod = MODULE_BY_PAGE[page];
    if (mod && window[mod] && typeof window[mod].render === 'function') {
      window[mod].render();
    } else if (mod === 'LedgerModule' && window.LedgerModule) {
      window.LedgerModule.render();
    }

    try {
      history.replaceState(null, '', '#' + page);
    } catch (e) { /* ignore */ }
  }

  function reloadAll() {
    if (window.TodoModule) window.TodoModule.render();
    if (window.NotesModule) window.NotesModule.render();
    if (window.LinksModule) window.LinksModule.render();
    if (window.HabitsModule) window.HabitsModule.renderValues();
    if (window.LedgerModule) window.LedgerModule.render();
    if (window.DashboardModule) window.DashboardModule.refresh();
  }

  function init() {
    // 导航点击
    document.querySelectorAll('.sidebar nav li').forEach(function (li) {
      li.addEventListener('click', function () {
        go(li.dataset.page);
      });
    });

    // 支持 #page 直接进入
    const hash = (location.hash || '').replace('#', '');
    if (hash && document.querySelector('.page[data-page="' + hash + '"]')) {
      go(hash);
    }
    window.addEventListener('hashchange', function () {
      const h = (location.hash || '').replace('#', '');
      if (h && h !== current) go(h);
    });
  }

  return { init: init, go: go, reloadAll: reloadAll };
})();

/* ---------------- 统一初始化（app.js 最后加载） ---------------- */
document.addEventListener('DOMContentLoaded', function () {
  // 顺序有依赖：先各业务模块装载数据，最后 Dashboard 汇总
  TodoModule.init();
  NotesModule.init();
  LinksModule.init();
  HabitsModule.init();
  LedgerModule.init();
  OCRModule.init();
  DataModule.init();
  App.init();
  DashboardModule.init();
});

// 显式挂到 window：其他模块通过 window.DashboardModule 触发看板刷新
window.DashboardModule = DashboardModule;
window.App = App;
