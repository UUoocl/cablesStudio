/**
 * Shared Client-Side Soft Takeover (MIDI Pickup) & Dashboard Targeting Helper
 *
 * Used by visualization clients (STG Stripes, STG Cylinder, Mouse Overlays, etc.)
 * to:
 * 1. Ignore messages explicitly targeted to settings_dashboard.html (`target: "dashboard"`,
 *    `type: "dashboard:update"`, or `type: "midi:update"`).
 * 2. Automatically unlatch when MIDI traffic or `client:select` / `pane:select` switches
 *    to another client pane.
 * 3. Gate direct MIDI/hardware updates (e.g. `originId: "cables-midi"`) behind soft-takeover
 *    tolerance and crossing detection until the physical knob catches the client's live value.
 */
(function (root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory(root);
    } else if (typeof define === 'function' && define.amd) {
        define([], function () { return factory(root); });
    } else {
        root.SoftTakeoverClient = factory(root);
    }
}(typeof self !== 'undefined' ? self : this, function (root) {
    'use strict';

    const PROTOCOL_KEYS = new Set([
        'type',
        'originId',
        'clientId',
        'paneId',
        'key',
        'value',
        'parameters',
        'channel',
        'target',
        'timestamp',
        'source',
        'pickup',
        'softTakeover',
        'sync'
    ]);

    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }

    function createNumericState(tolerance) {
        return {
            latched: false,
            hwValue: null,
            prevHwValue: null,
            hasInteracted: false,
            tolerance: typeof tolerance === 'number' ? tolerance : 0
        };
    }

    function unlatchState(state, clearHw) {
        state.latched = false;
        state.prevHwValue = null;
        if (clearHw !== false) {
            state.hwValue = null;
            state.hasInteracted = false;
        }
    }

    function stepNumeric(state, incomingHw, targetValue, toleranceOverride) {
        const hw = Number(incomingHw);
        const target = Number(targetValue);
        const tol = typeof toleranceOverride === 'number' ? toleranceOverride : state.tolerance;

        if (!Number.isFinite(hw) || !Number.isFinite(target)) {
            return { latched: state.latched, acceptedValue: null };
        }

        state.hasInteracted = true;

        if (state.latched) {
            state.prevHwValue = state.hwValue;
            state.hwValue = hw;
            return { latched: true, acceptedValue: hw };
        }

        const prev = state.hwValue;
        const withinTolerance = Math.abs(hw - target) <= tol;
        const crossed = prev !== null && (
            (prev < target && hw >= target) ||
            (prev > target && hw <= target)
        );

        state.prevHwValue = prev;
        state.hwValue = hw;

        if (withinTolerance || crossed) {
            state.latched = true;
            return { latched: true, acceptedValue: hw };
        }

        return { latched: false, acceptedValue: null };
    }

    function parseHexToRgba(hex) {
        let h = String(hex).replace('#', '').trim();
        if (h.length === 3 || h.length === 4) {
            h = h.split('').map(function (c) { return c + c; }).join('');
        }
        if (h.length !== 6 && h.length !== 8) return null;
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
        if ([r, g, b, a].some(Number.isNaN)) return null;
        return { r: r, g: g, b: b, a: a };
    }

    function parseColorInput(input) {
        if (input === null || input === undefined) return null;

        if (typeof input === 'object' && !Array.isArray(input)) {
            if (typeof input.channel === 'string' && input.value !== undefined) {
                const ch = input.channel.toLowerCase();
                if (ch === 'r' || ch === 'g' || ch === 'b' || ch === 'a') {
                    return { partial: true, channels: { [ch]: Number(input.value) } };
                }
            }
            const partial = {};
            let anyCh = false;
            ['r', 'g', 'b', 'a'].forEach(function (ch) {
                if (typeof input[ch] === 'number') {
                    partial[ch] = input[ch];
                    anyCh = true;
                }
            });
            if (anyCh && !(typeof input.r === 'number' && typeof input.g === 'number' && typeof input.b === 'number')) {
                return { partial: true, channels: partial };
            }
            if (typeof input.r === 'number' && typeof input.g === 'number' && typeof input.b === 'number') {
                return {
                    partial: false,
                    channels: {
                        r: clamp(input.r, 0, 255),
                        g: clamp(input.g, 0, 255),
                        b: clamp(input.b, 0, 255),
                        a: typeof input.a === 'number' ? clamp(input.a, 0, 1) : 1
                    }
                };
            }
        }

        if (Array.isArray(input) && input.length >= 3) {
            const aRaw = input.length >= 4 ? Number(input[3]) : 1;
            return {
                partial: false,
                channels: {
                    r: clamp(Number(input[0]), 0, 255),
                    g: clamp(Number(input[1]), 0, 255),
                    b: clamp(Number(input[2]), 0, 255),
                    a: aRaw > 1 ? clamp(aRaw / 255, 0, 1) : clamp(aRaw, 0, 1)
                }
            };
        }

        if (typeof input === 'string') {
            const s = input.trim();
            if (s.toLowerCase() === 'transparent') {
                return { partial: false, channels: { r: 0, g: 0, b: 0, a: 0 } };
            }
            if (s.startsWith('#')) {
                const parsed = parseHexToRgba(s);
                if (parsed) return { partial: false, channels: parsed };
            }
            const m = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
            if (m) {
                return {
                    partial: false,
                    channels: {
                        r: clamp(Number(m[1]), 0, 255),
                        g: clamp(Number(m[2]), 0, 255),
                        b: clamp(Number(m[3]), 0, 255),
                        a: m[4] !== undefined ? clamp(Number(m[4]), 0, 1) : 1
                    }
                };
            }
        }

        return null;
    }

    function rgbaToHex(rgba, includeAlpha) {
        const hexByte = function (v) {
            return clamp(Math.round(Number(v) || 0), 0, 255).toString(16).padStart(2, '0');
        };
        const rgb = '#' + hexByte(rgba.r) + hexByte(rgba.g) + hexByte(rgba.b);
        if (includeAlpha) {
            const aByte = hexByte((typeof rgba.a === 'number' ? rgba.a : 1) * 255);
            return rgb + aByte;
        }
        return rgb;
    }

    function normalizeOptions(optsObj) {
        if (!optsObj) return [];
        if (Array.isArray(optsObj)) {
            return optsObj.map(function (item) {
                if (item && typeof item === 'object' && 'value' in item) {
                    return { text: String(item.text !== undefined ? item.text : item.value), value: item.value };
                }
                return { text: String(item), value: item };
            });
        }
        if (typeof optsObj === 'object') {
            return Object.keys(optsObj).map(function (text) {
                return { text: text, value: optsObj[text] };
            });
        }
        return [];
    }

    function createClientFilter(options) {
        const opts = options || {};
        const toleranceRatio = typeof opts.toleranceRatio === 'number' ? opts.toleranceRatio : 0.02;
        const colorTolerance = typeof opts.colorTolerance === 'number' ? opts.colorTolerance : 4;
        const alphaTolerance = typeof opts.alphaTolerance === 'number' ? opts.alphaTolerance : 0.02;
        const midiOrigins = Array.isArray(opts.midiOrigins) ? opts.midiOrigins : ['cables-midi', 'midi', 'akai-midi'];

        let enabled = opts.enabled !== false;
        if (typeof root.location === 'object' && root.location && typeof root.location.search === 'string') {
            try {
                const sp = new URLSearchParams(root.location.search);
                const stParam = sp.get('softTakeover') || sp.get('pickup');
                if (stParam === 'false' || stParam === '0') enabled = false;
                if (stParam === 'true' || stParam === '1') enabled = true;
            } catch (_) { /* ignore */ }
        }

        // key -> pickup state entry
        const states = new Map();

        function getClientId() {
            if (typeof opts.getClientId === 'function') return opts.getClientId();
            if (opts.clientId) return opts.clientId;
            return typeof root.CLIENT_ID !== 'undefined' ? root.CLIENT_ID : null;
        }

        function getManifestParams() {
            if (typeof opts.getParameters === 'function') return opts.getParameters() || {};
            if (typeof root.getRegistrationPayload === 'function') {
                try {
                    const reg = root.getRegistrationPayload();
                    return (reg && reg.manifest && reg.manifest.parameters) || {};
                } catch (_) { /* ignore */ }
            }
            return {};
        }

        function getLiveValue(key) {
            if (typeof opts.getValue === 'function') {
                return opts.getValue(key);
            }
            const params = getManifestParams();
            return params[key] ? params[key].value : undefined;
        }

        function isDashboardOnlyMessage(data) {
            if (!data || typeof data !== 'object') return false;
            if (data.target === 'dashboard' || data.channel === 'dashboard') return true;
            if (data.type === 'dashboard:update' || data.type === 'midi:update') return true;
            return false;
        }

        function isMidiSource(data) {
            if (!data || typeof data !== 'object') return false;
            if (data.softTakeover === false || data.pickup === false || data.sync === true) return false;
            const orig = data.originId ? String(data.originId) : '';
            if (orig.startsWith('dashboard-')) return false;
            if (data.softTakeover === true || data.pickup === true || data.source === 'midi') return true;
            if (orig && (midiOrigins.indexOf(orig) !== -1 || /midi/i.test(orig))) return true;
            if (typeof root.location === 'object' && root.location && typeof root.location.search === 'string') {
                try {
                    const sp = new URLSearchParams(root.location.search);
                    if ((sp.get('softTakeover') || sp.get('pickup')) === 'all') return true;
                } catch (_) { /* ignore */ }
            }
            return false;
        }

        function getOrCreateEntry(key, spec) {
            if (states.has(key)) return states.get(key);
            const pType = spec && spec.type ? String(spec.type).toLowerCase() : '';
            let entry;

            if (pType === 'color' || (spec && spec.view === 'color')) {
                entry = {
                    kind: 'color',
                    hasAlpha: Boolean(spec && (spec.alpha || (spec.color && spec.color.alpha))),
                    channels: {
                        r: createNumericState(colorTolerance),
                        g: createNumericState(colorTolerance),
                        b: createNumericState(colorTolerance),
                        a: createNumericState(alphaTolerance)
                    },
                    staged: {}
                };
            } else if (spec && spec.options) {
                entry = {
                    kind: 'list',
                    options: normalizeOptions(spec.options),
                    state: createNumericState(0)
                };
            } else if (pType === 'boolean' || pType === 'bool') {
                entry = {
                    kind: 'boolean',
                    state: createNumericState(0)
                };
            } else if (pType === 'float' || pType === 'number' || pType === 'int' || pType === 'integer' ||
                (spec && (typeof spec.min === 'number' || typeof spec.max === 'number'))) {
                const min = spec && typeof spec.min === 'number' ? spec.min : 0;
                const max = spec && typeof spec.max === 'number' ? spec.max : 100;
                const step = spec && typeof spec.step === 'number' ? spec.step : (pType === 'int' || pType === 'integer' ? 1 : 0);
                const span = Math.abs(max - min) || 1;
                const tol = Math.max(step, span * toleranceRatio);
                entry = {
                    kind: 'number',
                    min: min,
                    max: max,
                    tolerance: tol,
                    state: createNumericState(tol)
                };
            } else {
                entry = { kind: 'passthrough' };
            }

            states.set(key, entry);
            return entry;
        }

        function unlatchAll() {
            states.forEach(function (entry) {
                if (entry.kind === 'color') {
                    entry.staged = {};
                    ['r', 'g', 'b', 'a'].forEach(function (ch) {
                        unlatchState(entry.channels[ch], true);
                    });
                } else if (entry.state) {
                    unlatchState(entry.state, true);
                }
            });
        }

        function syncTarget(key, val) {
            const manifestParams = getManifestParams();
            const entry = getOrCreateEntry(key, manifestParams[key]);
            if (entry.kind === 'number') {
                const num = Number(val);
                if (Number.isFinite(num) && entry.state.hwValue !== null && Math.abs(entry.state.hwValue - num) > entry.tolerance) {
                    unlatchState(entry.state, false);
                }
            } else if (entry.kind === 'list') {
                const targetIdx = entry.options.findIndex(function (o) { return o.value === val; });
                if (entry.state.hwValue !== null && targetIdx !== -1 && entry.state.hwValue !== targetIdx) {
                    unlatchState(entry.state, false);
                }
            } else if (entry.kind === 'boolean') {
                const bNum = val ? 1 : 0;
                if (entry.state.hwValue !== null && entry.state.hwValue !== bNum) {
                    unlatchState(entry.state, false);
                }
            } else if (entry.kind === 'color') {
                const parsed = parseColorInput(val);
                if (parsed && !parsed.partial) {
                    entry.staged = {};
                    ['r', 'g', 'b', 'a'].forEach(function (ch) {
                        const st = entry.channels[ch];
                        const tol = ch === 'a' ? alphaTolerance : colorTolerance;
                        if (st.hwValue !== null && Math.abs(st.hwValue - parsed.channels[ch]) > tol) {
                            unlatchState(st, false);
                        }
                    });
                }
            }
        }

        function observeMessage(data) {
            if (!data || typeof data !== 'object') {
                return { ignore: true, reason: 'invalid' };
            }

            if (isDashboardOnlyMessage(data)) {
                return { ignore: true, reason: 'dashboard-only' };
            }

            const myClientId = getClientId();

            if (data.type === 'client:select' || data.type === 'pane:select' ||
                data.type === 'tab:select' || data.type === 'activePane') {
                unlatchAll();
                return { ignore: true, reason: 'pane-select' };
            }

            if ((data.type === 'client:update' || data.type === 'param:update') &&
                myClientId && data.clientId && data.clientId !== myClientId) {
                if (isMidiSource(data)) {
                    unlatchAll();
                }
                return { ignore: true, reason: 'other-client' };
            }

            return { ignore: false };
        }

        function processSingleKey(key, hwVal, spec) {
            const entry = getOrCreateEntry(key, spec);
            if (entry.kind === 'passthrough') {
                return { accepted: true, value: hwVal };
            }

            const currentVal = getLiveValue(key);

            if (entry.kind === 'number') {
                const target = Number(currentVal !== undefined ? currentVal : (spec && spec.value !== undefined ? spec.value : 0));
                const clamped = clamp(Number(hwVal), Math.min(entry.min, entry.max), Math.max(entry.min, entry.max));
                const res = stepNumeric(entry.state, clamped, target, entry.tolerance);
                return res.latched ? { accepted: true, value: res.acceptedValue } : { accepted: false };
            }

            if (entry.kind === 'list') {
                const options = entry.options;
                const targetVal = currentVal !== undefined ? currentVal : (spec ? spec.value : undefined);
                const targetIdx = options.findIndex(function (o) { return o.value === targetVal; });
                let hwIdx = options.findIndex(function (o) { return o.value === hwVal || o.text === hwVal; });
                if (hwIdx === -1 && hwVal && typeof hwVal === 'object' && typeof hwVal.index === 'number') {
                    hwIdx = clamp(Math.round(hwVal.index), 0, options.length - 1);
                } else if (hwIdx === -1 && typeof hwVal === 'number' && Number.isFinite(hwVal) && options.length > 0) {
                    hwIdx = clamp(Math.round(hwVal), 0, options.length - 1);
                }
                if (targetIdx === -1 || hwIdx === -1) return { accepted: false };
                const res = stepNumeric(entry.state, hwIdx, targetIdx, 0);
                if (res.latched && options[res.acceptedValue]) {
                    return { accepted: true, value: options[res.acceptedValue].value };
                }
                return { accepted: false };
            }

            if (entry.kind === 'boolean') {
                const targetBool = Boolean(currentVal !== undefined ? currentVal : (spec ? spec.value : false));
                const hwBool = (typeof hwVal === 'number') ? hwVal > 0.5 : (typeof hwVal === 'string' ? hwVal.toLowerCase() === 'true' || hwVal === '1' : Boolean(hwVal));
                const res = stepNumeric(entry.state, hwBool ? 1 : 0, targetBool ? 1 : 0, 0);
                return res.latched ? { accepted: true, value: Boolean(res.acceptedValue) } : { accepted: false };
            }

            if (entry.kind === 'color') {
                const parsedHw = parseColorInput(hwVal);
                const parsedTarget = parseColorInput(currentVal !== undefined ? currentVal : (spec ? spec.value : '#ffffff'));
                if (!parsedHw || !parsedTarget || parsedTarget.partial) return { accepted: false };

                const activeChannels = entry.hasAlpha ? ['r', 'g', 'b', 'a'] : ['r', 'g', 'b'];
                activeChannels.forEach(function (ch) {
                    if (!(ch in parsedHw.channels)) return;
                    let incoming = Number(parsedHw.channels[ch]);
                    if (!Number.isFinite(incoming)) return;
                    if (ch === 'a') {
                        if (incoming > 1) incoming = incoming / 255;
                        incoming = clamp(incoming, 0, 1);
                    } else {
                        incoming = clamp(incoming, 0, 255);
                    }
                    const tol = ch === 'a' ? alphaTolerance : colorTolerance;
                    const res = stepNumeric(entry.channels[ch], incoming, parsedTarget.channels[ch], tol);
                    if (res.latched && res.acceptedValue !== null) {
                        entry.staged[ch] = ch === 'a' ? res.acceptedValue : Math.round(res.acceptedValue);
                    }
                });

                const anyLatched = activeChannels.some(function (ch) { return entry.channels[ch].latched; });
                const anyUnlatched = activeChannels.some(function (ch) {
                    return entry.channels[ch].hasInteracted && !entry.channels[ch].latched;
                });

                if (anyLatched && !anyUnlatched && Object.keys(entry.staged).length > 0) {
                    const merged = Object.assign({}, parsedTarget.channels, entry.staged);
                    entry.staged = {};
                    const outHex = rgbaToHex(merged, entry.hasAlpha || (typeof currentVal === 'string' && currentVal.length === 9));
                    return { accepted: true, value: outHex };
                }
                return { accepted: false };
            }

            return { accepted: true, value: hwVal };
        }

        function filterParameters(rawParams, metaData) {
            if (!rawParams || typeof rawParams !== 'object') return {};

            const cleanParams = {};
            Object.keys(rawParams).forEach(function (k) {
                if (!PROTOCOL_KEYS.has(k)) {
                    cleanParams[k] = rawParams[k];
                }
            });

            if (!enabled || !isMidiSource(metaData)) {
                Object.keys(cleanParams).forEach(function (k) {
                    syncTarget(k, cleanParams[k]);
                });
                return cleanParams;
            }

            const manifestParams = getManifestParams();
            const accepted = {};
            Object.keys(cleanParams).forEach(function (k) {
                const res = processSingleKey(k, cleanParams[k], manifestParams[k]);
                if (res.accepted) {
                    accepted[k] = res.value;
                }
            });
            return accepted;
        }

        return {
            observeMessage: observeMessage,
            filterParameters: filterParameters,
            syncTarget: syncTarget,
            unlatchAll: unlatchAll,
            isDashboardOnlyMessage: isDashboardOnlyMessage,
            isMidiSource: isMidiSource,
            setEnabled: function (v) { enabled = Boolean(v); },
            isEnabled: function () { return enabled; },
            getState: function (key) { return states.get(key) || null; }
        };
    }

    return {
        createClientFilter: createClientFilter,
        parseColorInput: parseColorInput,
        rgbaToHex: rgbaToHex
    };
}));

