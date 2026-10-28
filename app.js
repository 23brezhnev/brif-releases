// Лендинг Брифа: анимации-реконструкции интерфейса приложения.
// Каждая демо-сцена — асинхронный сценарий; при переключении или уходе с экрана он
// прерывается (поколение `gen` меняется, и ожидания внутри бросают Cancelled).

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };

class Cancelled extends Error {}

/** Проигрыватель сценариев: одна сцена за раз, автопереход к следующей, пауза вне экрана. */
class Player {
  constructor(root, scenes, { tabs, caption, loop = true } = {}) {
    Object.assign(this, { root, scenes, tabs, caption, loop, gen: 0, index: 0, visible: false });
    tabs && $$('button', tabs).forEach((b, i) => b.addEventListener('click', () => this.play(i, true)));
    new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible && !this.running) this.play(this.index);
      if (!this.visible) this.stop();
    }, { threshold: 0.35 }).observe(root);
  }
  stop() { this.gen++; this.running = false; }
  wait(ms, gen) {
    return new Promise((res, rej) => setTimeout(() => (gen === this.gen ? res() : rej(new Cancelled())), reduced ? 0 : ms));
  }
  async play(i, manual = false) {
    const gen = ++this.gen;
    this.index = i; this.running = true;
    const scene = this.scenes[i];
    if (this.tabs) $$('button', this.tabs).forEach((b, j) => {
      b.classList.toggle('on', j === i);
      const p = $('.prog', b); if (p) { p.style.transition = 'none'; p.style.width = '0'; }
    });
    if (this.caption) this.caption.textContent = scene.caption || '';
    const w = (ms) => this.wait(ms, gen);
    try {
      await scene.run(w, this.root);
      if (reduced) { this.running = false; return; }
      const bar = this.tabs && $('.prog', $$('button', this.tabs)[i]);
      const hold = scene.hold ?? 2600;
      if (bar) { void bar.offsetWidth; bar.style.transition = `width ${hold}ms linear`; bar.style.width = '100%'; }
      await w(hold);
      if (this.loop || i + 1 < this.scenes.length) this.play((i + 1) % this.scenes.length);
      else this.running = false;
    } catch (e) {
      if (!(e instanceof Cancelled)) throw e;
    }
  }
}

/** Печать текста по буквам. */
async function type(el, text, w, speed = 28) {
  if (reduced) { el.textContent = text; return; }
  el.textContent = '';
  for (const ch of text) { el.textContent += ch; await w(ch === ' ' ? speed * 1.6 : speed); }
}

// ------------------------------------------------------------------
// Данные демо-встречи (вымышленные, но в формате реальной выжимки Брифа)
// ------------------------------------------------------------------

const PEOPLE = {
  me: { name: 'Вы', color: 'var(--sp1)', ini: 'В' },
  anna: { name: 'Анна Котова', color: 'var(--sp2)', ini: 'АК' },
  ivan: { name: 'Иван Петров', color: 'var(--sp4)', ini: 'ИП' },
};

const LIVE = [
  ['me', 'Давайте по срокам: когда покажем лендинг?'],
  ['them', 'Макеты будут к четвергу, вёрстка — ещё два дня.'],
  ['me', 'Тогда релиз во вторник, третьего?'],
  ['them', 'Да, если тексты будут до пятницы.'],
  ['me', 'Тексты беру на себя. Бюджет на рекламу — 150 тысяч.'],
  ['them', 'Ок, запущу кампанию сразу после релиза.'],
];

const TRANSCRIPT = [
  ['04:08', 'me', 'Давайте по срокам: когда покажем лендинг?'],
  ['04:12', 'anna', 'Макеты будут к четвергу, вёрстка — ещё два дня. Если надо быстрее, отдам главную раньше.'],
  ['05:40', 'me', 'Тогда релиз во вторник, третьего ноября.'],
  ['05:46', 'anna', 'Да, если тексты будут до пятницы.'],
  ['05:52', 'me', 'Тексты беру на себя.'],
  ['12:03', 'ivan', 'Бюджет на рекламу — сто пятьдесят тысяч, кампанию запускаю сразу после релиза.'],
];

const STAGES = [
  ['Расшифровка', 'Расшифровываем запись целиком — точнее живого черновика'],
  ['Голоса', 'Разбираем, кто что говорил', 'Стенограмма почти готова'],
  ['Выжимка', 'Пишем выжимку', 'Стенограмма уже готова — её можно читать'],
  ['Задачи', 'Ищем задачи в разговоре', 'Выжимка готова — задачи появятся на вкладке «Задачи»'],
];

const cite = (t) => `<span class="cite">${t}</span>`;
const TAG_ICON = '<svg class="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8" r="1.3"/></svg>';

const SUMMARY_HTML = `
<div class="md">
  <p>Запуск лендинга назначили на вторник, 3 ноября. Макеты Анна сдаёт к четвергу, вёрстка займёт ещё два дня. Рекламу Иван запускает сразу после релиза, бюджет — 150 000 ₽. ${cite('05:40')}</p>
  <h5>Сроки</h5>
  <ul><li>Макеты — чт, 29 октября, вёрстка — ещё два дня ${cite('04:12')}</li><li>Релиз — вт, 3 ноября, если тексты будут до пятницы ${cite('05:46')}</li></ul>
  <h5>Реклама</h5>
  <ul><li>Бюджет 150 000 ₽, кампания стартует после релиза ${cite('12:03')}</li></ul>
</div>`;

const ACTIONS = [
  { t: 'Подготовить тексты для лендинга', m: '· пт, 30 окт. · Вы', c: '05:52', ok: true, hi: true },
  { t: 'Сдать макеты лендинга', m: '· чт, 29 окт. · Анна Котова <span class="tg">#сайт</span>', c: '04:12' },
  { t: 'Запустить рекламную кампанию', m: '· 3 нояб. · Иван Петров <span class="tg">#маркетинг</span>', c: '12:03' },
];

const actRow = (a) => h(`
  <div class="act ${a.ok ? 'ok' : ''} ${a.hi ? 'hi' : ''}">
    <span class="box"></span>
    <div><span class="tt">${a.t}</span><span class="mm">${a.m}</span> ${cite(a.c)}</div>
    <div class="btns"><i>✓</i><i>✕</i></div>
  </div>`);

const trRow = ([ts, who, txt], names) => {
  const p = who === 'me' ? PEOPLE.me : names[who];
  return h(`<div class="tr" data-who="${who}"><div class="who" style="color:${p.color}"><span class="nm">${p.name}</span> <span class="ts">${ts}</span></div><div class="txt">${txt}</div></div>`);
};

// ------------------------------------------------------------------
// Главное окно: запись → обработка → выжимка → голоса → вопрос
// ------------------------------------------------------------------

function heroScenes(win) {
  const content = $('.content', win);
  const tabs = $$('.tabs span[data-tab]', win);
  const strip = $('.strip', win);
  const people = $('[data-people]', win);
  const meta = $('[data-meta]', win);
  const player = $('[data-player]', win);
  const ask = $('[data-ask]', win);
  const cnt = $('[data-cnt]', win);
  const rowMeta = $('[data-row-meta]', win), rowPill = $('[data-row-pill]', win);
  const askText = 'Спросить о встрече: о чём договорились, кто отвечает за…';

  const setTab = (name) => tabs.forEach((t) => t.classList.toggle('on', t.dataset.tab === name));
  const setPill = (cls, text) => { rowPill.hidden = !cls; rowPill.className = 'pill ' + (cls || ''); rowPill.innerHTML = text || ''; };
  const peopleRow = (annaNamed) => {
    people.innerHTML = `
      <span class="person sp"><i class="d" style="background:var(--sp1)"></i>Вы</span>
      ${annaNamed
        ? '<span class="person sp" data-anna><i class="d" style="background:var(--sp2)"></i>Анна Котова</span>'
        : '<span class="person unk" data-anna><i class="d" style="background:var(--sp2)"></i>Спикер 2 <span class="q">?</span></span>'}
      <span class="person sp"><i class="d" style="background:var(--sp4)"></i>Иван Петров</span>
      <span class="add">+</span><span class="all">Всех в «Люди» · ${annaNamed ? 1 : 2}</span>`;
  };
  // Встреча после обработки: длительность, тег, плеер, строка вопроса.
  const finished = (annaNamed) => {
    strip.hidden = true;
    meta.innerHTML = `<span>28 октября 2026, 11:00</span><span class="sep">·</span><span>32 мин</span><span class="tagpill">${TAG_ICON}#сайт</span>`;
    player.hidden = false; ask.hidden = false; $('.q', ask).textContent = askText; ask.classList.remove('focus');
    rowMeta.textContent = '32 мин · Анна, Иван +1 · #сайт'; setPill(null);
    peopleRow(annaNamed);
  };
  const summary = (withActions = true) => {
    content.innerHTML = '';
    const box = h(`<div class="actions"><h6>Действия</h6></div>`);
    if (withActions) content.append(box);
    content.insertAdjacentHTML('beforeend', SUMMARY_HTML);
    return box;
  };

  // Уровень звука в полосе записи.
  const lvl = $('.lvl', strip);
  for (let i = 0; i < 22; i++) lvl.append(document.createElement('i'));
  setInterval(() => { if (!strip.hidden) $$('i', lvl).forEach((b) => (b.style.height = 15 + Math.random() * 85 + '%')); }, 140);

  return [
    {
      caption: 'Идёт звонок. Бриф пишет звук собеседников и ваш микрофон и сразу показывает живую расшифровку.',
      hold: 900,
      async run(w) {
        strip.hidden = false; player.hidden = true; ask.hidden = true; cnt.hidden = true;
        peopleRow(false); setTab('transcript');
        meta.innerHTML = '<span>28 октября 2026, 11:00</span><span class="pill rec">Запись</span><span class="linkbtn">Создать ссылку</span>';
        rowMeta.textContent = 'Анна, Иван'; setPill('rec', 'Запись');
        const timer = $('.clock', strip);
        const t0 = Date.now() - 31 * 60_000;
        const tick = () => { const s = Math.floor((Date.now() - t0) / 1000); timer.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
        tick();
        content.innerHTML = `<div class="live-note">Расшифровка в реальном времени</div><div class="chat"></div>`;
        const chat = $('.chat', content);
        for (const [who, text] of LIVE) {
          const b = h(`<div class="bubble ${who} typing"><small>${who === 'me' ? 'Вы' : 'Собеседник'}</small><span></span></div>`);
          chat.append(b);
          if (chat.children.length > 5) chat.firstElementChild.remove();
          await type($('span', b), text, async (ms) => { tick(); await w(ms); }, 22);
          b.classList.remove('typing');
          await w(450);
        }
      },
    },
    {
      caption: 'Запись остановлена. Бриф на вашем Mac расшифровывает её целиком, делит по голосам и пишет выжимку.',
      hold: 300,
      async run(w) {
        strip.hidden = true; player.hidden = true; ask.hidden = true; cnt.hidden = true;
        peopleRow(false); setTab('summary');
        meta.innerHTML = '<span>28 октября 2026, 11:00</span><span class="sep">·</span><span>32 мин</span>';
        rowMeta.textContent = '32 мин · Анна, Иван'; setPill('sum', '✦ Выжимка');
        content.innerHTML = `<div class="proc"><div class="top"><span class="si">◌</span><div><div class="h"></div><div class="s"></div></div></div>
          <div class="bar"><i></i></div><div class="proc-steps"></div></div>`;
        const steps = $('.proc-steps', content), hd = $('.h', content), sub = $('.s', content), bar = $('.bar', content), fill = $('.bar i', content);
        const els = STAGES.map(([t]) => { const e = h(`<span class="ps"><span class="c"></span>${t}</span>`); steps.append(e); return e; });
        for (let i = 0; i < els.length; i++) {
          els[i].classList.add('run'); hd.textContent = STAGES[i][1];
          if (i === 0) {
            bar.classList.remove('indet');
            for (let p = 0; p <= 100; p += 4) { fill.style.width = p + '%'; sub.textContent = `${p}% · осталось ${Math.max(1, Math.ceil((100 - p) / 20))} мин`; await w(70); }
          } else {
            bar.classList.add('indet');
            sub.textContent = STAGES[i][2];
            await w(1100);
          }
          els[i].classList.replace('run', 'done');
        }
        await w(300);
      },
    },
    {
      caption: 'Встреча открывается выжимкой. Сверху — «Действия»: задачи со сроком, ответственным и меткой времени в стенограмме.',
      hold: 3000,
      async run(w) {
        finished(false); setTab('summary'); cnt.hidden = true;
        const box = summary();
        const md = $('.md', content);
        md.style.opacity = 0; md.style.transition = 'opacity .6s';
        const rows = [];
        for (const a of ACTIONS) { const r = actRow(a); r.style.animation = 'pop .35s ease both'; box.append(r); rows.push(r); await w(380); }
        md.style.opacity = 1;
        cnt.hidden = false; cnt.textContent = 2;
        await w(1100);
        // Подтверждаем задачу, предложенную моделью: пунктирный квадрат становится кружком.
        const ok = $$('.btns i', rows[1])[0];
        ok.classList.add('hot'); await w(650);
        rows[1].classList.add('ok', 'flash'); ok.classList.remove('hot'); cnt.textContent = 1;
        await w(700); rows[1].classList.remove('flash');
      },
    },
    {
      caption: 'Незнакомый голос получает метку «Спикер 2». Назовите его один раз — на следующих встречах Бриф узнает его сам.',
      hold: 2600,
      async run(w) {
        finished(false); setTab('transcript'); cnt.hidden = false; cnt.textContent = 1;
        content.innerHTML = '<div class="chap"><span class="ct">04:08</span><b>Сроки запуска</b></div>';
        const names = { anna: { name: 'Спикер 2', color: 'var(--sp2)' }, ivan: PEOPLE.ivan };
        const rows = TRANSCRIPT.map((r) => { const e = trRow(r, names); content.append(e); return e; });
        await w(1300);
        const chip = $('[data-anna]', people);
        chip.style.boxShadow = '0 0 0 2px var(--accent)';
        await w(600);
        const pick = h(`<div style="position:absolute;z-index:4;background:#fff;border-radius:10px;padding:6px;box-shadow:0 0 0 1px var(--hairline),0 12px 30px -8px rgba(0,0,0,.25);font-size:13px;width:220px">
          <div style="padding:6px 8px;border-radius:6px;background:var(--muted);min-height:31px" class="q-in"></div>
          <div class="opt" style="padding:6px 8px;border-radius:6px;margin-top:4px;display:none"><span style="display:inline-grid;place-items:center;background:rgba(18,165,148,.15);color:var(--sp2);width:18px;height:18px;border-radius:50%;font-size:8.5px;font-weight:700;vertical-align:-4px;margin-right:6px">АК</span>Анна Котова</div></div>`);
        const r = chip.getBoundingClientRect(), pr = win.getBoundingClientRect(), k = win.offsetWidth / pr.width;
        pick.style.left = (r.left - pr.left) * k + 'px'; pick.style.top = (r.bottom - pr.top) * k + 6 + 'px';
        win.append(pick);
        await type($('.q-in', pick), 'Анна', w, 110);
        $('.opt', pick).style.display = 'block'; await w(500);
        $('.opt', pick).style.background = 'var(--accent-soft)'; await w(450);
        pick.remove();
        peopleRow(true);
        rows.forEach((e) => { if (e.dataset.who === 'anna') { $('.nm', e).textContent = 'Анна Котова'; e.classList.add('hl'); } });
        await w(1200);
        rows.forEach((e) => e.classList.remove('hl'));
      },
    },
    {
      caption: 'Не помните, о чём договорились? Спросите встречу — ответ придёт со ссылкой на место в стенограмме.',
      hold: 3400,
      async run(w) {
        finished(true); setTab('summary'); cnt.hidden = false; cnt.textContent = 1;
        content.innerHTML = `<div class="searching"><span class="spin"></span>Ищу ответ…</div>
          <div class="answer"><div class="lbl">✦ Ответ</div><div class="a"></div></div>`;
        const box = h('<div class="actions"><h6>Действия</h6></div>');
        ACTIONS.slice(0, 2).forEach((a) => { const r = actRow({ ...a, ok: true }); box.append(r); });
        content.append(box);
        await w(700);
        ask.classList.add('focus');
        await type($('.q', ask), 'Когда релиз и кто запускает рекламу?', w, 40);
        await w(400);
        $('.searching', content).classList.add('show'); await w(1300);
        $('.searching', content).classList.remove('show');
        $('.a', content).innerHTML = `Релиз — во вторник, 3 ноября, если тексты будут готовы до пятницы. ${cite('05:46')} Рекламу запускает Иван Петров сразу после релиза, бюджет — 150 000 ₽. ${cite('12:03')}`;
        $('.answer', content).classList.add('show');
        await w(1500);
        $$('.answer .cite', content)[1].classList.add('hot');
      },
    },
  ];
}

// ------------------------------------------------------------------
// «Встреча голосом»: плашка с волной → «Разбираю…» → карточка → готово
// ------------------------------------------------------------------

const AV = (ini, c) => `<span class="av" style="background:color-mix(in srgb, ${c} 18%, white);color:${c}">${ini}</span>`;

const VOICE = [
  {
    said: 'Поставь встречу с Иваном завтра в три на час, в Google Meet',
    card: `<div class="kinds"><span class="k on">Встреча</span><span class="k">Задача</span><span class="k">Контакт</span><span class="x">✕</span></div>
      <div class="quote">«Поставь встречу с Иваном завтра в три на час, в Google Meet»</div>
      <div class="ttl">Созвон с Иваном</div>
      <div class="vrow"><span class="vi">▦</span><span class="field">29.10.2026, 15:00</span></div>
      <div class="vrow"><span class="vi">◷</span><span class="chips"><span>15 мин</span><span>30 мин</span><span>45 мин</span><span class="on">1 ч</span><span>1,5 ч</span></span></div>
      <div class="vrow"><span class="vi">◯</span><span class="chips"><span>${AV('ИП', 'var(--sp4)')}Иван Петров ✕</span></span></div>
      <div class="vrow"><span class="vi">▶</span><span class="chips"><span class="on">Google Meet</span><span>Яндекс Телемост</span><span>Другой сервис</span></span></div>
      <div class="foot"><span class="re">🎙 Записать заново</span><span class="go">Создать встречу</span></div>`,
    done: `<div class="okh">Встреча создана</div><div class="ttl">Созвон с Иваном</div>
      <div class="sub2">29 октября 2026, 15:00 · 1 ч · Иван Петров</div>
      <div class="linkbox"><span style="color:var(--accent)">▶</span><span class="u">https://meet.g…/xpd-qmrw-ken</span><span>Скопировано</span><span>Открыть</span></div>
      <div class="note">Ссылка на Google Meet в буфере обмена — можно вставлять в чат.</div>
      <div class="foot"><span class="re">Открыть в календаре</span><span class="go">Готово</span></div>`,
  },
  {
    said: 'Задача: Анне подготовить КП для клиента до следующего понедельника, срочно',
    card: `<div class="kinds"><span class="k">Встреча</span><span class="k on">Задача</span><span class="k">Контакт</span><span class="x">✕</span></div>
      <div class="quote">«Задача: Анне подготовить КП для клиента до следующего понедельника, срочно»</div>
      <div class="ttl">Подготовить КП для клиента</div>
      <div class="vrow"><span class="vi">▦</span><span class="chips"><span>Без срока</span><span>Сегодня</span><span>Завтра</span><span class="on">Дата</span></span></div>
      <div class="vrow"><span class="vi"></span><span class="field">02.11.2026</span><span style="color:var(--text-2)">2 нояб.</span></div>
      <div class="vrow"><span class="vi">⚑</span><span class="chips"><span class="on">Высокий</span><span>Средний</span><span>Низкий</span><span>Обычная</span></span></div>
      <div class="vrow"><span class="vi">◯</span><span class="chips"><span>${AV('АК', 'var(--sp2)')}Анна Котова ⌄</span></span></div>
      <div class="vrow"><span class="vi">#</span><span class="chips"><span class="on">#продажи ✕</span></span><span style="color:var(--text-2)">+ тег</span></div>
      <div class="foot"><span class="re">🎙 Записать заново</span><span class="go">Создать задачу</span></div>`,
    done: `<div class="okh">Задача создана</div><div class="ttl">Подготовить КП для клиента</div>
      <div class="sub2">до 2 ноября · Анна Котова · высокий</div>
      <div class="note">В срок Бриф напомнит уведомлением — с кнопками «Выполнено» и «Отложить».</div>
      <div class="foot"><span class="re">Открыть в «Задачах»</span><span class="go">Готово</span></div>`,
  },
  {
    said: 'Новый контакт Олег Смирнов, почта олег собака пример точка ком',
    card: `<div class="kinds"><span class="k">Встреча</span><span class="k">Задача</span><span class="k on">Контакт</span><span class="x">✕</span></div>
      <div class="quote">«Новый контакт Олег Смирнов, почта олег собака пример точка ком»</div>
      <div class="ttl">Олег Смирнов</div>
      <div class="vrow"><span class="vi">✉</span><span class="field" style="flex:1">oleg@example.com</span></div>
      <div class="vrow"><span class="vi">#</span><span style="color:var(--text-2)">+ тег</span></div>
      <div class="foot"><span class="re">🎙 Записать заново</span><span class="go">Добавить контакт</span></div>`,
    done: `<div class="okh">Контакт добавлен</div><div class="ttl">Олег Смирнов</div>
      <div class="sub2">oleg@example.com · в «Людях»</div>
      <div class="note">Его можно звать на встречи и назначать ответственным за задачи.</div>
      <div class="foot"><span class="re">Открыть в «Людях»</span><span class="go">Готово</span></div>`,
  },
];

function voiceScenes(stage) {
  const pill = $('.vpill', stage), card = $('.card-vm', stage), kbd = $('.kbd', stage);
  const wave = $('.wave', pill), tm = $('.tm', pill);
  for (let i = 0; i < 40; i++) wave.append(document.createElement('i'));
  let talking = false;
  setInterval(() => { $$('i', wave).forEach((b) => (b.style.height = (talking ? 12 + Math.random() * 88 : 10) + '%')); }, 110);
  return VOICE.map((v) => ({
    hold: 2600,
    async run(w) {
      card.classList.remove('show'); pill.classList.remove('show', 'busy');
      await w(450);
      kbd.classList.add('press'); await w(160); kbd.classList.remove('press');
      pill.classList.add('show'); talking = true;
      const secs = Math.ceil(v.said.length / 18);
      for (let s = 0; s <= secs; s++) { tm.textContent = `0:${String(s).padStart(2, '0')}`; await w(420); }
      talking = false;
      pill.classList.add('busy'); await w(1000);
      pill.classList.remove('show');
      card.innerHTML = v.card; card.classList.add('show');
      await w(2600);
      const go = $('.go', card); go.classList.add('press'); await w(180); go.classList.remove('press');
      card.classList.remove('show'); await w(250);
      card.innerHTML = v.done; card.classList.add('show');
    },
  }));
}

// ------------------------------------------------------------------
// iPhone: задачи и уведомление о готовой выжимке
// ------------------------------------------------------------------

function phoneScenes(scr) {
  const notif = $('.notif', scr);
  return [{
    hold: 2400,
    async run(w) {
      notif.classList.remove('show');
      $$('.pc.task', scr).forEach((t) => t.classList.remove('done'));
      await w(900);
      notif.classList.add('show'); await w(2600);
      notif.classList.remove('show'); await w(800);
      $$('.pc.task', scr)[0].classList.add('done');
    },
  }];
}

// ------------------------------------------------------------------
// Ссылка на свежий dmg и прочее
// ------------------------------------------------------------------

async function latestRelease() {
  try {
    const r = await fetch('https://api.github.com/repos/23brezhnev/brif-releases/releases/latest');
    if (!r.ok) return;
    const rel = await r.json();
    const dmg = rel.assets?.find((a) => a.name.endsWith('.dmg'));
    if (!dmg) return;
    const ver = rel.tag_name.replace(/^v/, '');
    $$('[data-download]').forEach((a) => { a.href = dmg.browser_download_url; });
    $$('[data-version]').forEach((e) => { e.textContent = `Версия ${ver} · ${Math.round(dmg.size / 1048576)} МБ`; });
  } catch { /* без сети — остаётся ссылка на страницу выпусков */ }
}

document.addEventListener('DOMContentLoaded', () => {
  const win = $('#hero-window');
  // ?scene=N / ?voice=N — начать с нужной сцены (для проверки и ссылок).
  const q = new URLSearchParams(location.search);
  new Player(win, heroScenes(win), { tabs: $('#hero-tabs'), caption: $('#hero-caption') }).index = +q.get('scene') || (reduced ? 2 : 0);
  const vs = $('#voice-stage');
  new Player(vs, voiceScenes(vs), { tabs: $('#voice-tabs') }).index = +q.get('voice') || 0;
  const scr = $('#phone .scr');
  new Player(scr, phoneScenes(scr));

  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15 });
  $$('.reveal').forEach((e) => io.observe(e));
  const top = $('.topbar');
  addEventListener('scroll', () => top.classList.toggle('scrolled', scrollY > 8), { passive: true });
  latestRelease();

  // Не Mac (телефон, планшет, Windows): вместо скачивания — «Бриф работает на Mac» и ссылка.
  const ua = navigator.userAgent;
  const touchMac = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPad с «настольным» UA
  if (!/Macintosh|Mac OS X/.test(ua) || /iPhone|iPad|Android/.test(ua) || touchMac) {
    $$('.mac-only').forEach((e) => (e.hidden = true));
    $$('.not-mac').forEach((e) => (e.hidden = false));
  }
  $$('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(location.href.split('#')[0]); b.textContent = 'Ссылка скопирована'; }
    catch { prompt('Скопируйте ссылку:', location.href.split('#')[0]); }
  }));
});
