/* @ds-bundle: {"format":4,"namespace":"Hackerspace","components":[{"name":"AppShell"},{"name":"PageHeader"},{"name":"Section"},{"name":"Stack"},{"name":"Grid"},{"name":"Button"},{"name":"Tabs"},{"name":"Input"},{"name":"Select"},{"name":"Icon"},{"name":"Badge"},{"name":"Card"},{"name":"Avatar"},{"name":"AvatarStack"},{"name":"EmptyState"},{"name":"PresencePill"},{"name":"Countdown"},{"name":"AgentTag"},{"name":"ActivityFeed"},{"name":"TeamSlots"},{"name":"HackathonCard"},{"name":"TeamCard"},{"name":"ProjectCard"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;
  var Fragment = React.Fragment;

  function cx() {
    var out = [];
    for (var i = 0; i < arguments.length; i++) if (arguments[i]) out.push(arguments[i]);
    return out.join(' ');
  }
  function omit(obj, keys) {
    var o = {};
    for (var k in obj) if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) < 0) o[k] = obj[k];
    return o;
  }

  /* ---------- Icon ---------- */
  var ICONS = {
    search: [['circle', { cx: 11, cy: 11, r: 7 }], ['path', { d: 'M20 20l-3.5-3.5' }]],
    pin: [['path', { d: 'M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z' }], ['circle', { cx: 12, cy: 10, r: 2.5 }]],
    calendar: [['rect', { x: 3, y: 5, width: 18, height: 16, rx: 2 }], ['path', { d: 'M3 10h18M8 3v4M16 3v4' }]],
    users: [['circle', { cx: 9, cy: 8, r: 3.5 }], ['path', { d: 'M2.5 20a6.5 6.5 0 0 1 13 0M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5a6.5 6.5 0 0 1 3.5 5.5' }]],
    heart: [['path', { d: 'M12 20s-7.5-4.6-7.5-10A4.5 4.5 0 0 1 12 7a4.5 4.5 0 0 1 7.5 3c0 5.4-7.5 10-7.5 10z' }]],
    plus: [['path', { d: 'M12 5v14M5 12h14' }]],
    bell: [['path', { d: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15zM10 20a2 2 0 0 0 4 0' }]],
    bot: [['rect', { x: 5, y: 8, width: 14, height: 11, rx: 2 }], ['path', { d: 'M12 4v4' }], ['circle', { cx: 9.5, cy: 13.5, r: 1 }], ['circle', { cx: 14.5, cy: 13.5, r: 1 }]],
    trophy: [['path', { d: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5a3 3 0 0 0 3 4M16 6h3a3 3 0 0 1-3 4M12 13v4M9 20h6' }]],
    globe: [['circle', { cx: 12, cy: 12, r: 9 }], ['path', { d: 'M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18' }]],
    arrow: [['path', { d: 'M5 12h14M13 6l6 6-6 6' }]],
    menu: [['path', { d: 'M4 7h16M4 12h16M4 17h16' }]],
    code: [['path', { d: 'M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14' }]]
  };
  function Icon(props) {
    var size = props.size || 16;
    var parts = ICONS[props.name] || [];
    return h('svg', {
      className: cx('hs-icon', props.className), width: size, height: size, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': props.label ? undefined : true, role: props.label ? 'img' : undefined, 'aria-label': props.label
    }, parts.map(function (p, i) { return h(p[0], Object.assign({ key: i }, p[1])); }));
  }

  /* ---------- Layout ---------- */
  function AppShell(props) {
    var nav = props.nav || [];
    return h('div', { className: cx('hs-shell', props.className) },
      h('header', { className: 'hs-shell-bar' },
        h('div', { className: 'hs-shell-bar-inner' },
          h('a', { className: 'hs-wordmark', href: props.homeHref || '#' }, h('span', { className: 'hs-wordmark-mark', 'aria-hidden': true }), 'Hackerspace'),
          nav.length ? h('nav', { className: 'hs-shell-nav', 'aria-label': 'Principal' },
            nav.map(function (n, i) {
              return h('a', { key: i, href: n.href || '#', className: 'hs-shell-link', 'aria-current': n.active ? 'page' : undefined }, n.label,
                n.count != null ? h('span', { className: 'hs-shell-count' }, n.count) : null);
            })) : null,
          h('div', { className: 'hs-shell-actions' }, props.actions))),
      props.banner ? h('div', { className: 'hs-shell-banner' }, props.banner) : null,
      h('div', { className: cx('hs-shell-body', props.aside && 'hs-shell-body--aside') },
        h('main', { className: 'hs-shell-main' }, props.children),
        props.aside ? h('aside', { className: 'hs-shell-aside' }, props.aside) : null));
  }

  function PageHeader(props) {
    return h('div', { className: cx('hs-pagehead', props.className) },
      h('div', { className: 'hs-pagehead-text' },
        props.eyebrow ? h('div', { className: 'hs-pagehead-eyebrow' }, props.eyebrow) : null,
        h('h1', { className: 'hs-pagehead-title' }, props.title),
        props.description ? h('p', { className: 'hs-pagehead-desc' }, props.description) : null,
        props.meta ? h('div', { className: 'hs-pagehead-meta' }, props.meta) : null),
      props.actions ? h('div', { className: 'hs-pagehead-actions' }, props.actions) : null);
  }

  function Section(props) {
    return h('section', { className: cx('hs-section', props.className) },
      (props.title || props.action) ? h('div', { className: 'hs-section-head' },
        h('h2', { className: 'hs-section-title' }, props.title,
          props.count != null ? h('span', { className: 'hs-section-count' }, props.count) : null),
        props.action || null) : null,
      props.children);
  }

  var GAP = { 1: 'var(--space-1)', 2: 'var(--space-2)', 4: 'var(--space-4)', 6: 'var(--space-6)', 12: 'var(--space-12)' };
  function Stack(props) {
    var style = Object.assign({
      flexDirection: props.direction === 'row' ? 'row' : 'column',
      gap: GAP[props.gap == null ? 4 : props.gap] || props.gap,
      alignItems: props.align, justifyContent: props.justify,
      flexWrap: props.wrap ? 'wrap' : undefined
    }, props.style);
    return h(props.as || 'div', Object.assign(omit(props, ['as', 'direction', 'gap', 'align', 'justify', 'wrap', 'style', 'className']), { className: cx('hs-stack', props.className), style: style }));
  }

  function Grid(props) {
    var style = Object.assign({
      gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, ' + (props.min || 280) + 'px), 1fr))',
      gap: GAP[props.gap == null ? 6 : props.gap] || props.gap
    }, props.style);
    return h(props.as || 'div', Object.assign(omit(props, ['as', 'min', 'gap', 'style', 'className']), { className: cx('hs-grid', props.className), style: style }));
  }

  /* ---------- Actions & forms ---------- */
  function Button(props) {
    var variant = props.variant || 'secondary';
    var size = props.size || 'md';
    var rest = omit(props, ['variant', 'size', 'icon', 'iconEnd', 'className', 'children', 'href']);
    var content = h(Fragment, null,
      props.icon ? h(Icon, { name: props.icon }) : null,
      props.children,
      props.iconEnd ? h(Icon, { name: props.iconEnd }) : null);
    var cls = cx('hs-btn', 'hs-btn--' + variant, 'hs-btn--' + size, !props.children && 'hs-btn--icon', props.className);
    if (props.href) return h('a', Object.assign(rest, { href: props.href, className: cls }), content);
    return h('button', Object.assign({ type: 'button' }, rest, { className: cls }), content);
  }

  function Tabs(props) {
    var items = props.items || [];
    var st = React.useState(props.defaultValue || (items[0] && items[0].value));
    var value = props.value != null ? props.value : st[0];
    function pick(v) { st[1](v); if (props.onChange) props.onChange(v); }
    function onKey(e) {
      var i = items.findIndex(function (it) { return it.value === value; });
      var n = e.key === 'ArrowRight' ? i + 1 : e.key === 'ArrowLeft' ? i - 1 : e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : -1;
      if (n < 0 && e.key !== 'ArrowLeft') return;
      n = (n + items.length) % items.length;
      e.preventDefault();
      pick(items[n].value);
      var tabs = e.currentTarget.querySelectorAll('[role="tab"]');
      if (tabs[n]) tabs[n].focus();
    }
    return h('div', { className: cx('hs-tabs', props.className), role: 'tablist', 'aria-label': props.label, onKeyDown: onKey },
      items.map(function (it) {
        var on = it.value === value;
        return h('button', {
          key: it.value, type: 'button', role: 'tab', 'aria-selected': on, tabIndex: on ? 0 : -1,
          className: 'hs-tab', onClick: function () { pick(it.value); }
        }, it.label, it.count != null ? h('span', { className: 'hs-tab-count' }, it.count) : null);
      }));
  }

  var fieldSeq = 0;
  function useId(given) {
    var r = React.useRef(given);
    if (!r.current) r.current = 'hs-f' + (++fieldSeq);
    return r.current;
  }
  function Field(props, control) {
    return h('div', { className: cx('hs-field', props.error && 'hs-field--error', props.className) },
      props.label ? h('label', { className: 'hs-field-label', htmlFor: props.id }, props.label) : null,
      control,
      (props.error || props.hint) ? h('div', { className: 'hs-field-hint', id: props.id + '-hint' }, props.error || props.hint) : null);
  }
  function Input(props) {
    var id = useId(props.id);
    var rest = omit(props, ['label', 'hint', 'error', 'icon', 'className', 'id']);
    var input = h('input', Object.assign({ type: 'text' }, rest, {
      id: id, className: 'hs-input-control', 'aria-invalid': props.error ? true : undefined,
      'aria-describedby': (props.error || props.hint) ? id + '-hint' : undefined
    }));
    return Field(Object.assign({}, props, { id: id }),
      h('div', { className: cx('hs-input', props.icon && 'hs-input--icon') }, props.icon ? h(Icon, { name: props.icon }) : null, input));
  }
  function Select(props) {
    var id = useId(props.id);
    var rest = omit(props, ['label', 'hint', 'error', 'options', 'className', 'id']);
    return Field(Object.assign({}, props, { id: id }),
      h('div', { className: 'hs-select' }, h('select', Object.assign({}, rest, { id: id, className: 'hs-select-control' }),
        (props.options || []).map(function (o) {
          var v = typeof o === 'string' ? o : o.value;
          return h('option', { key: v, value: v }, typeof o === 'string' ? o : o.label);
        }))));
  }

  /* ---------- Display ---------- */
  function Badge(props) {
    var tone = props.tone || 'neutral';
    var icon = props.icon || (tone === 'virtual' ? 'globe' : tone === 'presencial' ? 'pin' : null);
    return h('span', { className: cx('hs-badge', 'hs-badge--' + tone, props.className) },
      icon ? h(Icon, { name: icon, size: 12 }) : null, props.children);
  }

  function Card(props) {
    var Tag = props.href ? 'a' : (props.as || 'div');
    return h(Tag, Object.assign(omit(props, ['as', 'className', 'interactive', 'padding']), {
      className: cx('hs-card', (props.href || props.interactive) && 'hs-card--interactive', props.padding === 'none' && 'hs-card--flush', props.className)
    }));
  }

  function initials(name) {
    return String(name || '?').trim().split(/\s+/).slice(0, 2).map(function (s) { return s[0]; }).join('').toUpperCase();
  }
  function hue(name) {
    var s = 0; name = String(name || '');
    for (var i = 0; i < name.length; i++) s = (s * 31 + name.charCodeAt(i)) % 4;
    return s;
  }
  function Avatar(props) {
    var size = props.size || 'md';
    return h('span', {
      className: cx('hs-avatar', 'hs-avatar--' + size, 'hs-avatar--t' + hue(props.name), props.className),
      title: props.name, role: 'img', 'aria-label': props.name + (props.online ? ' (en línea)' : '')
    },
      props.src ? h('img', { src: props.src, alt: '' }) : h('span', { 'aria-hidden': true }, initials(props.name)),
      props.online ? h('span', { className: 'hs-avatar-dot', 'aria-hidden': true }) : null);
  }

  function AvatarStack(props) {
    var people = props.people || [];
    var max = props.max || 5;
    var shown = people.slice(0, max);
    var extra = (props.total != null ? props.total : people.length) - shown.length;
    return h('span', { className: cx('hs-avstack', props.className) },
      h('span', { className: 'hs-avstack-faces' },
        shown.map(function (p, i) {
          var o = typeof p === 'string' ? { name: p } : p;
          return h(Avatar, { key: i, name: o.name, src: o.src, size: props.size || 'sm' });
        })),
      extra > 0 ? h('span', { className: 'hs-avstack-more' }, '+' + extra) : null);
  }

  function EmptyState(props) {
    return h('div', { className: cx('hs-empty', props.className) },
      h('div', { className: 'hs-empty-seats', 'aria-hidden': true }, h('span'), h('span'), h('span')),
      h('h3', { className: 'hs-empty-title' }, props.title),
      props.description ? h('p', { className: 'hs-empty-desc' }, props.description) : null,
      props.action || null);
  }

  /* ---------- Live ---------- */
  function PresencePill(props) {
    var n = props.count || 0;
    var label = props.label || 'viendo';
    return h('span', { className: cx('hs-presence', props.size === 'sm' && 'hs-presence--sm', props.className), role: 'status', 'aria-live': 'polite' },
      h('span', { className: 'hs-presence-dot', 'aria-hidden': true }),
      props.live === false ? null : h('span', { className: 'hs-presence-live' }, 'En vivo'),
      h('span', { className: 'hs-presence-count', key: n }, n + ' ' + label),
      props.people && props.people.length ? h(AvatarStack, { people: props.people, max: 3, total: n, size: 'xs' }) : null);
  }

  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function Countdown(props) {
    var target = props.to instanceof Date ? props.to.getTime() : (typeof props.to === 'number' ? props.to : Date.parse(props.to));
    var st = React.useState(Date.now());
    React.useEffect(function () {
      var t = setInterval(function () { st[1](Date.now()); }, 1000);
      return function () { clearInterval(t); };
    }, []);
    var left = Math.max(0, Math.floor((target - st[0]) / 1000));
    var d = Math.floor(left / 86400), hh = Math.floor(left % 86400 / 3600), mm = Math.floor(left % 3600 / 60), ss = left % 60;
    var txt = (d ? d + 'd ' : '') + pad(hh) + ':' + pad(mm) + ':' + pad(ss);
    return h('span', { className: cx('hs-countdown', left === 0 && 'hs-countdown--done', props.className) },
      props.label ? h('span', { className: 'hs-countdown-label' }, props.label) : null,
      h('time', { className: 'hs-countdown-time' }, left === 0 ? (props.doneLabel || 'Ya comenzó') : txt));
  }

  function AgentTag(props) {
    return h('span', { className: cx('hs-agent', props.className), title: props.title },
      h(Icon, { name: 'bot', size: 12 }),
      'agente', props.name ? ' ' + props.name : null);
  }

  function ActivityFeed(props) {
    var items = props.items || [];
    return h('ol', { className: cx('hs-feed', props.className), 'aria-live': 'polite' },
      items.map(function (it, i) {
        var a = it.actor || {};
        return h('li', { key: it.id || i, className: cx('hs-feed-item', it.isNew && 'hs-feed-item--new') },
          h('time', { className: 'hs-feed-time' }, it.time),
          a.agent ? h(AgentTag, { name: a.name }) : h(Avatar, { name: a.name, src: a.src, size: 'xs' }),
          h('span', { className: 'hs-feed-text' },
            a.agent ? null : h('strong', null, a.name + ' '),
            it.action,
            it.target ? h(Fragment, null, ' ', h('a', { href: it.href || '#', className: 'hs-link' }, it.target)) : null));
      }));
  }

  function TeamSlots(props) {
    var members = props.members || [];
    var size = props.size || 4;
    var free = Math.max(0, size - members.length);
    var slots = [];
    for (var i = 0; i < size; i++) {
      var m = members[i];
      slots.push(m
        ? h(Avatar, { key: i, name: typeof m === 'string' ? m : m.name, src: m.src, online: m.online, size: 'md' })
        : h('span', { key: i, className: 'hs-slot-empty', 'aria-hidden': true }, h(Icon, { name: 'plus', size: 14 })));
    }
    return h('div', { className: cx('hs-slots', props.className) },
      h('div', { className: 'hs-slots-row', role: 'img', 'aria-label': members.length + ' de ' + size + ' integrantes' }, slots),
      h('span', { className: cx('hs-slots-label', free === 0 && 'hs-slots-label--full') },
        free === 0 ? 'Equipo completo' : free + (free === 1 ? ' lugar libre' : ' lugares libres')));
  }

  /* ---------- Domain cards ---------- */
  function HackathonCard(props) {
    var virtual = props.mode === 'virtual';
    return h(Card, { href: props.href, interactive: !props.href, className: 'hs-hcard' },
      h('div', { className: 'hs-hcard-top' },
        h(Badge, { tone: virtual ? 'virtual' : 'presencial' }, virtual ? 'Virtual' : 'Presencial'),
        props.viewers ? h(PresencePill, { count: props.viewers, size: 'sm', live: false }) : null),
      h('h3', { className: 'hs-hcard-title' }, props.title),
      h('div', { className: 'hs-hcard-meta' },
        h('span', null, h(Icon, { name: 'calendar', size: 14 }), props.dates),
        h('span', null, h(Icon, { name: virtual ? 'globe' : 'pin', size: 14 }), props.location)),
      props.description ? h('p', { className: 'hs-hcard-desc' }, props.description) : null,
      props.tags && props.tags.length ? h('div', { className: 'hs-hcard-tags' }, props.tags.map(function (t) { return h(Badge, { key: t }, t); })) : null,
      h('div', { className: 'hs-hcard-foot' },
        props.teamsLooking != null ? h('span', { className: 'hs-hcard-teams' }, h(Icon, { name: 'users', size: 14 }),
          props.teamsLooking + (props.teamsLooking === 1 ? ' equipo busca gente' : ' equipos buscan gente')) : h('span'),
        props.source ? h(AgentTag, { name: props.source }) : null));
  }

  function TeamCard(props) {
    return h(Card, { href: props.href, interactive: !props.href, className: 'hs-tcard' },
      h('div', { className: 'hs-tcard-head' },
        h('div', null,
          h('h3', { className: 'hs-tcard-title' }, props.name),
          props.hackathon ? h('div', { className: 'hs-tcard-sub' }, props.hackathon) : null),
        props.activeNow ? h(Badge, { tone: 'live' }, 'Activo ahora') : null),
      props.pitch ? h('p', { className: 'hs-tcard-pitch' }, props.pitch) : null,
      props.lookingFor && props.lookingFor.length ? h('div', { className: 'hs-tcard-looking' },
        h('span', { className: 'hs-tcard-looking-label' }, 'Buscan'),
        props.lookingFor.map(function (r) { return h(Badge, { key: r, tone: 'signal' }, r); })) : null,
      h('div', { className: 'hs-tcard-foot' },
        h(TeamSlots, { members: props.members, size: props.size }),
        props.action || null));
  }

  function ProjectCard(props) {
    return h(Card, { href: props.href, interactive: !props.href, padding: 'none', className: 'hs-pcard' },
      h('div', { className: 'hs-pcard-media' },
        props.image ? h('img', { src: props.image, alt: '' }) : h('span', { className: 'hs-pcard-ph', 'aria-hidden': true }, h(Icon, { name: 'code', size: 28 })),
        props.award ? h('span', { className: 'hs-pcard-award' }, h(Badge, { tone: 'signal', icon: 'trophy' }, props.award)) : null),
      h('div', { className: 'hs-pcard-body' },
        h('h3', { className: 'hs-pcard-title' }, props.title),
        props.description ? h('p', { className: 'hs-pcard-desc' }, props.description) : null,
        props.tags && props.tags.length ? h('div', { className: 'hs-hcard-tags' }, props.tags.map(function (t) { return h(Badge, { key: t }, t); })) : null,
        h('div', { className: 'hs-pcard-foot' },
          h('span', { className: 'hs-pcard-team' }, h(AvatarStack, { people: props.team || [], max: 4, size: 'xs' }), props.hackathon),
          props.likes != null ? h('span', { className: 'hs-pcard-likes' }, h(Icon, { name: 'heart', size: 14 }), props.likes) : null)));
  }

  window.Hackerspace = Object.assign(window.Hackerspace || {}, {
    AppShell: AppShell, PageHeader: PageHeader, Section: Section, Stack: Stack, Grid: Grid,
    Button: Button, Tabs: Tabs, Input: Input, Select: Select, Icon: Icon,
    Badge: Badge, Card: Card, Avatar: Avatar, AvatarStack: AvatarStack, EmptyState: EmptyState,
    PresencePill: PresencePill, Countdown: Countdown, AgentTag: AgentTag, ActivityFeed: ActivityFeed, TeamSlots: TeamSlots,
    HackathonCard: HackathonCard, TeamCard: TeamCard, ProjectCard: ProjectCard
  });
})();
