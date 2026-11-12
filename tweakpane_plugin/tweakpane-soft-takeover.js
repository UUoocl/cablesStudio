/**
 * Tweakpane Soft Takeover (MIDI Pickup / Catch-up Mode) Plugin
 * Compatible with Tweakpane 3.1.x
 *
 * Prevents parameter value jumps when switching panes or receiving hardware
 * potentiometer values (e.g. Akai 24-knob MIDI mixer over WebSocket).
 *
 * UI Architectures:
 * 1. Number Sliders: Twin-Thumb Track (Solid Target Thumb + Hollow Ghost Pickup Thumb + Striped Band)
 * 2. Text Lists / Dropdowns: Blade label directional badge (▲ Turn CW / ▼ Turn CCW)
 * 3. Color Controls (RGBA): 4-channel miniature chevron strip [R: ▲] [G: ✓] [B: ▼] [A: ✓]
 */
(function (root, factory) {
    if (typeof exports === 'object' && typeof module === 'object') {
        module.exports = factory(root);
    } else if (typeof define === 'function' && define.amd) {
        define([], function () { return factory(root); });
    } else {
        root.TweakpaneSoftTakeoverPlugin = factory(root);
    }
}(typeof self !== 'undefined' ? self : this, function (root) {
    'use strict';

    // --- PURE SOFT TAKEOVER STATE MACHINE ---

    function createNumericPickupState(options) {
        const opts = options || {};
        return {
            latched: false,
            hwValue: null,
            prevHwValue: null,
            tolerance: typeof opts.tolerance === 'number' ? opts.tolerance : 0,
            hasInteracted: false
        };
    }

    function unlatchNumericState(state, clearHwValue) {
        state.latched = false;
        state.prevHwValue = null;
        if (clearHwValue) {
            state.hwValue = null;
            state.hasInteracted = false;
        }
    }

    /**
     * Evaluate an incoming mapped hardware number against a target value.
     * Supports both tolerance proximity and fast-turn crossing detection.
     */
    function stepNumericPickup(state, incomingHw, targetValue, toleranceOverride) {
        const hw = Number(incomingHw);
        const target = Number(targetValue);
        const tol = typeof toleranceOverride === 'number' ? toleranceOverride : state.tolerance;

        if (!Number.isFinite(hw) || !Number.isFinite(target)) {
            return {
                latched: state.latched,
                acceptedValue: null,
                direction: 0,
                hwValue: state.hwValue,
                targetValue: target,
                justLatched: false
            };
        }

        state.hasInteracted = true;

        if (state.latched) {
            state.prevHwValue = state.hwValue;
            state.hwValue = hw;
            return {
                latched: true,
                acceptedValue: hw,
                direction: 0,
                hwValue: hw,
                targetValue: target,
                justLatched: false
            };
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
            return {
                latched: true,
                acceptedValue: hw,
                direction: 0,
                hwValue: hw,
                targetValue: target,
                justLatched: true
            };
        }

        return {
            latched: false,
            acceptedValue: null,
            direction: hw < target ? 1 : -1,
            hwValue: hw,
            targetValue: target,
            justLatched: false
        };
    }

    function stepListPickup(state, incomingIndex, targetIndex) {
        return stepNumericPickup(state, incomingIndex, targetIndex, 0);
    }

    // --- HELPERS ---

    function clamp(val, min, max) {
        return Math.min(max, Math.max(min, val));
    }

    function isSoftTakeoverEnabled(params) {
        if (!params || typeof params !== 'object') return false;
        return Boolean(params.softTakeover || params.pickup);
    }

    function getSoftTakeoverOptions(params) {
        const raw = params.softTakeover && typeof params.softTakeover === 'object'
            ? params.softTakeover
            : (params.pickup && typeof params.pickup === 'object' ? params.pickup : {});
        return raw;
    }

    function isColorString(val) {
        if (typeof val !== 'string') return false;
        const s = val.trim();
        return /^#([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(s) ||
            /^rgba?\(/i.test(s) ||
            /^hsla?\(/i.test(s);
    }

    function isColorObject(val) {
        return Boolean(
            val &&
            typeof val === 'object' &&
            typeof val.r === 'number' &&
            typeof val.g === 'number' &&
            typeof val.b === 'number'
        );
    }

    function hasAlphaChannel(initialValue, params) {
        if (params && (params.alpha === true || (params.color && params.color.alpha === true))) {
            return true;
        }
        if (isColorObject(initialValue) && typeof initialValue.a === 'number') {
            return true;
        }
        if (typeof initialValue === 'string') {
            const s = initialValue.trim();
            if (/^#([0-9a-f]{4}|[0-9a-f]{8})$/i.test(s)) return true;
            if (/^rgba\(/i.test(s) || /^hsla\(/i.test(s)) return true;
        }
        return false;
    }

    function parseHexToRgba(hex) {
        let h = hex.replace('#', '').trim();
        if (h.length === 3 || h.length === 4) {
            h = h.split('').map(function (c) { return c + c; }).join('');
        }
        if (h.length !== 6 && h.length !== 8) return null;
        const r = parseInt(h.slice(0, 2), 16);
        const g = parseInt(h.slice(2, 4), 16);
        const b = parseInt(h.slice(4, 6), 16);
        const a = h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1;
        return { r: r, g: g, b: b, a: a };
    }

    function parseAnyColorInput(input, colorReader) {
        if (input === null || input === undefined) return null;

        if (typeof input === 'object' && !Array.isArray(input)) {
            if (typeof input.channel === 'string' && input.value !== undefined) {
                const ch = input.channel.toLowerCase();
                if (ch === 'r' || ch === 'g' || ch === 'b' || ch === 'a') {
                    return { partial: true, channels: { [ch]: Number(input.value) } };
                }
            }
            const channels = {};
            let hasPartial = false;
            ['r', 'g', 'b', 'a'].forEach(function (ch) {
                if (typeof input[ch] === 'number') {
                    channels[ch] = input[ch];
                    hasPartial = true;
                }
            });
            if (hasPartial && !(typeof input.r === 'number' && typeof input.g === 'number' && typeof input.b === 'number')) {
                return { partial: true, channels: channels };
            }
            if (isColorObject(input)) {
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

        if (typeof input === 'string') {
            const s = input.trim();
            if (s.startsWith('#')) {
                const parsed = parseHexToRgba(s);
                if (parsed) return { partial: false, channels: parsed };
            }
            const rgbaMatch = s.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/i);
            if (rgbaMatch) {
                return {
                    partial: false,
                    channels: {
                        r: clamp(Number(rgbaMatch[1]), 0, 255),
                        g: clamp(Number(rgbaMatch[2]), 0, 255),
                        b: clamp(Number(rgbaMatch[3]), 0, 255),
                        a: rgbaMatch[4] !== undefined ? clamp(Number(rgbaMatch[4]), 0, 1) : 1
                    }
                };
            }
            if (typeof colorReader === 'function') {
                try {
                    const colorObj = colorReader(s);
                    if (colorObj && typeof colorObj.toRgbaObject === 'function') {
                        return { partial: false, channels: colorObj.toRgbaObject('int') };
                    }
                } catch (_) { /* ignore */ }
            }
        }

        if (typeof input === 'number' && typeof colorReader === 'function') {
            try {
                const colorObj = colorReader(input);
                if (colorObj && typeof colorObj.toRgbaObject === 'function') {
                    return { partial: false, channels: colorObj.toRgbaObject('int') };
                }
            } catch (_) { /* ignore */ }
        }

        return null;
    }

    function stripPluginParams(params) {
        const clean = {};
        Object.keys(params || {}).forEach(function (k) {
            if (k === 'softTakeover' || k === 'pickup' || k === 'label') return;
            clean[k] = params[k];
        });
        return clean;
    }

    // Cached offscreen Tweakpane instance per Document for native controller creation
    const headlessPaneCache = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

    function getHeadlessPane(doc) {
        const Tp = root.Tweakpane || (typeof require === 'function' ? require('../apps/lib/tweakpane.min.js') : null);
        if (!Tp || !Tp.Pane) {
            throw new Error('[TweakpaneSoftTakeoverPlugin] Tweakpane global not found.');
        }
        if (headlessPaneCache && headlessPaneCache.has(doc)) {
            return headlessPaneCache.get(doc);
        }
        const host = doc.createElement('div');
        const pane = new Tp.Pane({ container: host });
        if (headlessPaneCache) {
            headlessPaneCache.set(doc, pane);
        }
        return pane;
    }

    function createNativeDelegate(doc, initialValue, params) {
        const pane = getHeadlessPane(doc);
        const proxyObj = { v: initialValue };
        const cleanParams = stripPluginParams(params);
        const innerBinding = pane.addInput(proxyObj, 'v', cleanParams);
        pane.remove(innerBinding);
        return {
            proxyObj: proxyObj,
            innerBinding: innerBinding,
            innerController: innerBinding.controller_.valueController,
            innerBindingCore: innerBinding.controller_.binding
        };
    }

    function bindViewPropsSync(outerViewProps, innerViewProps, onDispose) {
        outerViewProps.emitter.on('change', function (ev) {
            const key = ev.target && ev.target.key ? ev.target.key : null;
            if (!key) {
                innerViewProps.set('disabled', outerViewProps.get('disabled'));
                innerViewProps.set('hidden', outerViewProps.get('hidden'));
                if (outerViewProps.get('disposed')) {
                    innerViewProps.set('disposed', true);
                    if (onDispose) onDispose();
                }
                return;
            }
            if (key === 'disabled' || key === 'hidden') {
                innerViewProps.set(key, outerViewProps.get(key));
            } else if (key === 'disposed' && outerViewProps.get('disposed')) {
                innerViewProps.set('disposed', true);
                if (onDispose) onDispose();
            }
        });
    }

    // --- MULTI-PANE SOFT TAKEOVER MANAGER ---

    const bindingRegistry = typeof WeakMap !== 'undefined' ? new WeakMap() : null;

    class SoftTakeoverManager {
        constructor(options) {
            const opts = options || {};
            this.toleranceRatio = typeof opts.toleranceRatio === 'number' ? opts.toleranceRatio : 0.02;
            this.colorTolerance = typeof opts.colorTolerance === 'number' ? opts.colorTolerance : 4;
            this.alphaTolerance = typeof opts.alphaTolerance === 'number' ? opts.alphaTolerance : 0.02;
            this.fadeLatchedMs = typeof opts.fadeLatchedMs === 'number' ? opts.fadeLatchedMs : 700;
            this.cwLabel = opts.cwLabel || '▲ Turn CW';
            this.ccwLabel = opts.ccwLabel || '▼ Turn CCW';
            this.autoUnlatchOnPaneSwitch = opts.autoUnlatchOnPaneSwitch !== false;
            this.panes = new Map(); // paneId -> Map<key, controllerHandle>
            this.activePaneId = null;
        }

        register(paneId, key, handle) {
            const pId = String(paneId || 'default');
            const pKey = String(key);
            if (!this.panes.has(pId)) {
                this.panes.set(pId, new Map());
            }
            this.panes.get(pId).set(pKey, handle);
            return function unregister() {
                const paneMap = this.panes.get(pId);
                if (paneMap && paneMap.get(pKey) === handle) {
                    paneMap.delete(pKey);
                    if (paneMap.size === 0) {
                        this.panes.delete(pId);
                    }
                }
            }.bind(this);
        }

        setActivePane(paneId) {
            const nextId = paneId !== undefined && paneId !== null ? String(paneId) : null;
            if (this.activePaneId && this.activePaneId !== nextId) {
                this.unlatchPane(this.activePaneId, true);
            }
            this.activePaneId = nextId;
            if (nextId) {
                this.unlatchPane(nextId, true);
            }
        }

        unlatchPane(paneId, clearHw) {
            const paneMap = this.panes.get(String(paneId));
            if (!paneMap) return;
            paneMap.forEach(function (handle) {
                handle.unlatch(clearHw !== false);
            });
        }

        unlatchAll(clearHw) {
            this.panes.forEach(function (paneMap) {
                paneMap.forEach(function (handle) {
                    handle.unlatch(clearHw !== false);
                });
            });
        }

        getControl(paneId, key) {
            const targetPane = (paneId !== undefined && paneId !== null && paneId !== 'active')
                ? String(paneId)
                : this.activePaneId;
            if (!targetPane) return null;
            const paneMap = this.panes.get(targetPane);
            return paneMap ? (paneMap.get(String(key)) || null) : null;
        }

        /**
         * Feed an incoming hardware / MIDI value to a specific pane control.
         * Automatically unlatches both old and new panes if the target pane changes.
         * Returns true if the control was found and processed.
         */
        handleUpdate(paneId, key, hwValue) {
            const targetPane = (paneId !== undefined && paneId !== null && paneId !== 'active')
                ? String(paneId)
                : this.activePaneId;
            if (!targetPane) return false;
            if (this.autoUnlatchOnPaneSwitch && this.activePaneId !== targetPane) {
                this.setActivePane(targetPane);
            }
            const handle = this.getControl(targetPane, key);
            if (!handle) return false;
            handle.receiveHardwareValue(hwValue);
            return true;
        }

        /**
         * Batch update an object of key -> hwValue pairs for a pane.
         */
        handleBatchUpdate(paneId, valuesObj) {
            if (!valuesObj || typeof valuesObj !== 'object') return 0;
            const targetPane = (paneId !== undefined && paneId !== null && paneId !== 'active')
                ? String(paneId)
                : this.activePaneId;
            if (!targetPane) return 0;
            if (this.autoUnlatchOnPaneSwitch && this.activePaneId !== targetPane) {
                this.setActivePane(targetPane);
            }
            let count = 0;
            const self = this;
            Object.keys(valuesObj).forEach(function (k) {
                if (self.handleUpdate(targetPane, k, valuesObj[k])) {
                    count++;
                }
            });
            return count;
        }

        /**
         * Sync target value from authoritative external source (e.g. client preset load)
         * without triggering hardware pickup latch if divergent.
         */
        syncTarget(paneId, key, targetValue) {
            const handle = this.getControl(paneId, key);
            if (!handle) return false;
            handle.syncExternalTarget(targetValue);
            return true;
        }

        getPaneLatchSummary(paneId) {
            const paneMap = this.panes.get(String(paneId || this.activePaneId));
            if (!paneMap) return { total: 0, latched: 0, unlatched: 0 };
            let total = 0;
            let latched = 0;
            let unlatched = 0;
            paneMap.forEach(function (handle) {
                total++;
                if (handle.isLatched()) latched++;
                else unlatched++;
            });
            return { total: total, latched: latched, unlatched: unlatched };
        }
    }

    const defaultManager = new SoftTakeoverManager();

    function resolveManagerAndKey(args) {
        const opts = getSoftTakeoverOptions(args.params);
        const manager = opts.manager || defaultManager;
        const paneId = opts.paneId || 'default';
        const key = opts.key || opts.paramKey || (args.params && args.params.label) || 'param';
        return { opts: opts, manager: manager, paneId: paneId, key: key };
    }

    function registerBindingHandle(valueController, handle) {
        if (bindingRegistry) {
            bindingRegistry.set(valueController, handle);
        }
    }

    function getHandleFromBinding(bindingOrController) {
        if (!bindingOrController || !bindingRegistry) return null;
        if (bindingRegistry.has(bindingOrController)) {
            return bindingRegistry.get(bindingOrController);
        }
        if (bindingOrController.controller_ && bindingOrController.controller_.valueController) {
            return bindingRegistry.get(bindingOrController.controller_.valueController) || null;
        }
        return null;
    }

    function pushValue(binding, hwValue) {
        const handle = getHandleFromBinding(binding);
        if (!handle) return false;
        handle.receiveHardwareValue(hwValue);
        return true;
    }

    function pushColorChannel(binding, channel, value) {
        const handle = getHandleFromBinding(binding);
        if (!handle) return false;
        handle.receiveHardwareValue({ channel: channel, value: value });
        return true;
    }

    function unlatchBinding(binding, clearHw) {
        const handle = getHandleFromBinding(binding);
        if (!handle) return false;
        handle.unlatch(clearHw !== false);
        return true;
    }

    // --- 1. NUMBER SLIDER PLUGIN (TWIN-THUMB TRACK) ---

    const SoftTakeoverNumberPlugin = {
        id: 'soft-takeover-number',
        type: 'input',
        accept: function (exValue, params) {
            if (typeof exValue !== 'number') return null;
            if (!isSoftTakeoverEnabled(params)) return null;
            if (params.options) return null; // Handled by SoftTakeoverListPlugin
            return { initialValue: exValue, params: params };
        },
        binding: {
            reader: function () {
                return function (exValue) { return Number(exValue); };
            },
            equals: function (v1, v2) { return v1 === v2; },
            writer: function () {
                return function (target, inValue) { target.write(inValue); };
            }
        },
        controller: function (args) {
            const doc = args.document;
            const delegate = createNativeDelegate(doc, args.initialValue, args.params);
            const innerVc = delegate.innerController;
            const resolved = resolveManagerAndKey(args);
            const opts = resolved.opts;

            const minVal = typeof args.params.min === 'number' ? args.params.min : 0;
            const maxVal = typeof args.params.max === 'number' ? args.params.max : 100;
            const stepVal = typeof args.params.step === 'number' ? args.params.step : 0;
            const span = Math.abs(maxVal - minVal) || 1;
            const tolRatio = typeof opts.toleranceRatio === 'number'
                ? opts.toleranceRatio
                : resolved.manager.toleranceRatio;
            const tolerance = typeof opts.tolerance === 'number'
                ? opts.tolerance
                : Math.max(stepVal, span * tolRatio);

            const pickupState = createNumericPickupState({ tolerance: tolerance });

            // Attach Twin-Thumb DOM elements onto .tp-sldv_t if slider track exists
            const rootEl = innerVc.view.element;
            const trackEl = rootEl.querySelector('.tp-sldv_t');
            let bandEl = null;
            let ghostEl = null;
            let latchFadeTimer = null;

            if (trackEl) {
                bandEl = doc.createElement('div');
                bandEl.classList.add('tp-st-band');
                ghostEl = doc.createElement('div');
                ghostEl.classList.add('tp-st-ghost');
                trackEl.appendChild(bandEl);
                trackEl.appendChild(ghostEl);
            }

            function valueToPct(v) {
                if (maxVal === minVal) return 0;
                return clamp(((v - minVal) / (maxVal - minVal)) * 100, 0, 100);
            }

            function renderTwinThumb() {
                if (!trackEl || !bandEl || !ghostEl) return;

                if (latchFadeTimer) {
                    clearTimeout(latchFadeTimer);
                    latchFadeTimer = null;
                }

                const targetPct = valueToPct(args.value.rawValue);

                if (pickupState.latched || pickupState.hwValue === null) {
                    rootEl.classList.remove('tp-st-unlatched');
                    rootEl.classList.remove('tp-st-just-latched');
                    bandEl.style.width = '0%';
                    ghostEl.style.opacity = '0';
                    return;
                }

                const hwPct = valueToPct(pickupState.hwValue);
                const leftPct = Math.min(targetPct, hwPct);
                const widthPct = Math.abs(targetPct - hwPct);

                rootEl.classList.remove('tp-st-just-latched');
                rootEl.classList.add('tp-st-unlatched');

                bandEl.style.left = leftPct + '%';
                bandEl.style.width = widthPct + '%';
                bandEl.style.opacity = '1';

                ghostEl.style.left = hwPct + '%';
                ghostEl.style.opacity = '1';
                ghostEl.setAttribute(
                    'title',
                    'Hardware: ' + Number(pickupState.hwValue).toFixed(2) +
                    ' | Target: ' + Number(args.value.rawValue).toFixed(2)
                );
            }

            function renderLatchMerge() {
                if (!trackEl || !bandEl || !ghostEl) return;
                if (latchFadeTimer) clearTimeout(latchFadeTimer);

                const targetPct = valueToPct(args.value.rawValue);
                rootEl.classList.add('tp-st-just-latched');
                ghostEl.style.left = targetPct + '%';
                ghostEl.style.opacity = '0';
                bandEl.style.left = targetPct + '%';
                bandEl.style.width = '0%';
                bandEl.style.opacity = '0';

                latchFadeTimer = setTimeout(function () {
                    rootEl.classList.remove('tp-st-unlatched');
                    rootEl.classList.remove('tp-st-just-latched');
                    latchFadeTimer = null;
                }, 230);
            }

            let syncingFromInner = false;
            let syncingFromOuter = false;
            let syncingFromHardware = false;

            // User manually dragged slider or edited text box
            innerVc.value.emitter.on('change', function () {
                if (syncingFromOuter) return;
                syncingFromInner = true;
                try {
                    const nextVal = delegate.proxyObj.v;
                    if (!syncingFromHardware && pickupState.hwValue !== null) {
                        if (Math.abs(pickupState.hwValue - nextVal) > tolerance) {
                            unlatchNumericState(pickupState, false);
                            renderTwinThumb();
                        }
                    }
                    args.value.rawValue = nextVal;
                } finally {
                    syncingFromInner = false;
                }
            });

            // External target updated (e.g. pane.refresh() or preset sync)
            args.value.emitter.on('change', function () {
                if (syncingFromInner) return;
                syncingFromOuter = true;
                try {
                    delegate.proxyObj.v = args.value.rawValue;
                    delegate.innerBindingCore.read();
                    if (pickupState.hwValue !== null && Math.abs(pickupState.hwValue - args.value.rawValue) > tolerance) {
                        unlatchNumericState(pickupState, false);
                    }
                    renderTwinThumb();
                } finally {
                    syncingFromOuter = false;
                }
            });

            const handle = {
                type: 'number',
                receiveHardwareValue: function (rawHw) {
                    const clampedHw = clamp(Number(rawHw), Math.min(minVal, maxVal), Math.max(minVal, maxVal));
                    const targetVal = args.value.rawValue;
                    const res = stepNumericPickup(pickupState, clampedHw, targetVal, tolerance);

                    if (res.latched && res.acceptedValue !== null) {
                        syncingFromHardware = true;
                        try {
                            delegate.proxyObj.v = res.acceptedValue;
                            delegate.innerBindingCore.read();
                            // Read back constrained/stepped value from inner binding
                            const finalVal = delegate.proxyObj.v;
                            args.value.rawValue = finalVal;
                        } finally {
                            syncingFromHardware = false;
                        }
                        if (res.justLatched) {
                            renderLatchMerge();
                        } else {
                            renderTwinThumb();
                        }
                    } else {
                        renderTwinThumb();
                    }
                },
                unlatch: function (clearHw) {
                    unlatchNumericState(pickupState, clearHw);
                    renderTwinThumb();
                },
                syncExternalTarget: function (val) {
                    syncingFromOuter = true;
                    try {
                        delegate.proxyObj.v = Number(val);
                        delegate.innerBindingCore.read();
                        args.value.rawValue = delegate.proxyObj.v;
                        if (pickupState.hwValue !== null && Math.abs(pickupState.hwValue - args.value.rawValue) > tolerance) {
                            unlatchNumericState(pickupState, false);
                        }
                        renderTwinThumb();
                    } finally {
                        syncingFromOuter = false;
                    }
                },
                isLatched: function () {
                    return pickupState.latched;
                },
                getState: function () {
                    return Object.assign({}, pickupState, { targetValue: args.value.rawValue, tolerance: tolerance });
                }
            };

            const unregister = resolved.manager.register(resolved.paneId, resolved.key, handle);
            registerBindingHandle(innerVc, handle);

            bindViewPropsSync(args.viewProps, innerVc.viewProps, function () {
                if (latchFadeTimer) clearTimeout(latchFadeTimer);
                unregister();
            });

            renderTwinThumb();

            return {
                view: innerVc.view,
                value: args.value,
                viewProps: args.viewProps
            };
        }
    };

    // --- 2. LIST / DROPDOWN PLUGIN (LABEL DIRECTIONAL BADGE) ---

    const SoftTakeoverListPlugin = {
        id: 'soft-takeover-list',
        type: 'input',
        accept: function (exValue, params) {
            if (typeof exValue !== 'string' && typeof exValue !== 'number') return null;
            if (!isSoftTakeoverEnabled(params)) return null;
            if (!params.options) return null;
            return { initialValue: exValue, params: params };
        },
        binding: {
            reader: function () {
                return function (exValue) { return exValue; };
            },
            equals: function (v1, v2) { return v1 === v2; },
            writer: function () {
                return function (target, inValue) { target.write(inValue); };
            }
        },
        controller: function (args) {
            const doc = args.document;
            const delegate = createNativeDelegate(doc, args.initialValue, args.params);
            const innerVc = delegate.innerController;
            const resolved = resolveManagerAndKey(args);
            const opts = resolved.opts;

            const cwText = opts.cwLabel || resolved.manager.cwLabel || '▲ Turn CW';
            const ccwText = opts.ccwLabel || resolved.manager.ccwLabel || '▼ Turn CCW';
            const pickupState = createNumericPickupState({ tolerance: 0 });
            const rootEl = innerVc.view.element;

            let badgeEl = null;

            function getOptionsList() {
                return (innerVc.props && innerVc.props.get('options')) || [];
            }

            function findTargetIndex(val) {
                const options = getOptionsList();
                return options.findIndex(function (o) { return o.value === val; });
            }

            function resolveIncomingIndex(hwInput) {
                const options = getOptionsList();
                if (!options.length) return -1;

                // 1. Direct value match
                const byValue = options.findIndex(function (o) { return o.value === hwInput; });
                if (byValue !== -1) return byValue;

                // 2. Direct text label match
                const byText = options.findIndex(function (o) { return o.text === hwInput; });
                if (byText !== -1) return byText;

                // 3. Explicit index object { index: n }
                if (hwInput && typeof hwInput === 'object' && typeof hwInput.index === 'number') {
                    return clamp(Math.round(hwInput.index), 0, options.length - 1);
                }

                // 4. Numeric index fallback
                if (typeof hwInput === 'number' && Number.isFinite(hwInput)) {
                    return clamp(Math.round(hwInput), 0, options.length - 1);
                }

                return -1;
            }

            function ensureLabelBadgeElement() {
                if (badgeEl && badgeEl.isConnected) return badgeEl;
                const lblv = rootEl.closest('.tp-lblv');
                if (!lblv) return null;
                const labelEl = lblv.querySelector('.tp-lblv_l');
                if (!labelEl) return null;

                labelEl.classList.add('tp-st-lbl-host');
                let existing = labelEl.querySelector('.tp-st-list-badge');
                if (!existing) {
                    existing = doc.createElement('span');
                    existing.classList.add('tp-st-list-badge');
                    labelEl.appendChild(existing);
                }
                badgeEl = existing;
                return badgeEl;
            }

            function renderListBadge() {
                const badge = ensureLabelBadgeElement();
                const targetIdx = findTargetIndex(args.value.rawValue);

                if (pickupState.latched || pickupState.hwValue === null || targetIdx === -1) {
                    rootEl.classList.remove('tp-st-unlatched');
                    if (badge) {
                        badge.style.display = 'none';
                        badge.textContent = '';
                        badge.classList.remove('tp-st-dir-up', 'tp-st-dir-down');
                    }
                    return;
                }

                const hwIdx = pickupState.hwValue;
                const options = getOptionsList();
                rootEl.classList.add('tp-st-unlatched');

                if (badge) {
                    badge.style.display = 'inline-flex';
                    badge.classList.remove('tp-st-dir-up', 'tp-st-dir-down');
                    if (hwIdx < targetIdx) {
                        badge.textContent = cwText;
                        badge.classList.add('tp-st-dir-up');
                    } else {
                        badge.textContent = ccwText;
                        badge.classList.add('tp-st-dir-down');
                    }
                    const hwLabel = options[hwIdx] ? options[hwIdx].text : hwIdx;
                    const targetLabel = options[targetIdx] ? options[targetIdx].text : targetIdx;
                    badge.setAttribute('title', 'Hardware: ' + hwLabel + ' → Target: ' + targetLabel);
                }
            }

            // Ensure badge mounts after Tweakpane appends view into .tp-lblv_v
            if (typeof queueMicrotask === 'function') {
                queueMicrotask(renderListBadge);
            } else {
                setTimeout(renderListBadge, 0);
            }

            let syncingFromInner = false;
            let syncingFromOuter = false;
            let syncingFromHardware = false;

            innerVc.value.emitter.on('change', function () {
                if (syncingFromOuter) return;
                syncingFromInner = true;
                try {
                    const nextVal = delegate.proxyObj.v;
                    if (!syncingFromHardware && pickupState.hwValue !== null) {
                        const targetIdx = findTargetIndex(nextVal);
                        if (targetIdx !== pickupState.hwValue) {
                            unlatchNumericState(pickupState, false);
                            renderListBadge();
                        }
                    }
                    args.value.rawValue = nextVal;
                } finally {
                    syncingFromInner = false;
                }
            });

            args.value.emitter.on('change', function () {
                if (syncingFromInner) return;
                syncingFromOuter = true;
                try {
                    delegate.proxyObj.v = args.value.rawValue;
                    delegate.innerBindingCore.read();
                    const targetIdx = findTargetIndex(args.value.rawValue);
                    if (pickupState.hwValue !== null && targetIdx !== pickupState.hwValue) {
                        unlatchNumericState(pickupState, false);
                    }
                    renderListBadge();
                } finally {
                    syncingFromOuter = false;
                }
            });

            const handle = {
                type: 'list',
                receiveHardwareValue: function (rawHw) {
                    const options = getOptionsList();
                    const hwIdx = resolveIncomingIndex(rawHw);
                    const targetIdx = findTargetIndex(args.value.rawValue);
                    if (hwIdx === -1 || targetIdx === -1) return;

                    const res = stepListPickup(pickupState, hwIdx, targetIdx);
                    if (res.latched && res.acceptedValue !== null) {
                        const matchedOpt = options[res.acceptedValue];
                        if (matchedOpt) {
                            syncingFromHardware = true;
                            try {
                                delegate.proxyObj.v = matchedOpt.value;
                                delegate.innerBindingCore.read();
                                args.value.rawValue = delegate.proxyObj.v;
                            } finally {
                                syncingFromHardware = false;
                            }
                        }
                        renderListBadge();
                    } else {
                        renderListBadge();
                    }
                },
                unlatch: function (clearHw) {
                    unlatchNumericState(pickupState, clearHw);
                    renderListBadge();
                },
                syncExternalTarget: function (val) {
                    syncingFromOuter = true;
                    try {
                        delegate.proxyObj.v = val;
                        delegate.innerBindingCore.read();
                        args.value.rawValue = delegate.proxyObj.v;
                        const targetIdx = findTargetIndex(args.value.rawValue);
                        if (pickupState.hwValue !== null && targetIdx !== pickupState.hwValue) {
                            unlatchNumericState(pickupState, false);
                        }
                        renderListBadge();
                    } finally {
                        syncingFromOuter = false;
                    }
                },
                isLatched: function () {
                    return pickupState.latched;
                },
                getState: function () {
                    return Object.assign({}, pickupState, {
                        targetIndex: findTargetIndex(args.value.rawValue)
                    });
                }
            };

            const unregister = resolved.manager.register(resolved.paneId, resolved.key, handle);
            registerBindingHandle(innerVc, handle);

            bindViewPropsSync(args.viewProps, innerVc.viewProps, function () {
                if (badgeEl && badgeEl.parentElement) {
                    badgeEl.parentElement.removeChild(badgeEl);
                }
                unregister();
            });

            return {
                view: innerVc.view,
                value: args.value,
                viewProps: args.viewProps
            };
        }
    };

    // --- 3. COLOR RGBA PLUGIN (4-CHANNEL CHEVRON STRIP) ---

    const SoftTakeoverColorPlugin = {
        id: 'soft-takeover-color',
        type: 'input',
        accept: function (exValue, params) {
            if (!isSoftTakeoverEnabled(params)) return null;
            if (params.options) return null;
            if (params.view === 'text') return null;
            const wantsColor = params.view === 'color' || isColorObject(exValue) || isColorString(exValue);
            if (!wantsColor) return null;
            return { initialValue: exValue, params: params };
        },
        binding: {
            reader: function () {
                return function (exValue) {
                    return isColorObject(exValue) ? Object.assign({}, exValue) : exValue;
                };
            },
            equals: function (v1, v2) {
                if (isColorObject(v1) && isColorObject(v2)) {
                    return v1.r === v2.r && v1.g === v2.g && v1.b === v2.b && v1.a === v2.a;
                }
                return v1 === v2;
            },
            writer: function () {
                return function (target, inValue) {
                    if (isColorObject(inValue)) {
                        const existing = target.read();
                        if (isColorObject(existing)) {
                            existing.r = inValue.r;
                            existing.g = inValue.g;
                            existing.b = inValue.b;
                            if ('a' in existing && typeof inValue.a === 'number') {
                                existing.a = inValue.a;
                            }
                            return;
                        }
                    }
                    target.write(inValue);
                };
            }
        },
        controller: function (args) {
            const doc = args.document;
            const delegate = createNativeDelegate(doc, args.initialValue, args.params);
            const innerVc = delegate.innerController;
            const resolved = resolveManagerAndKey(args);
            const opts = resolved.opts;

            const rgbTol = typeof opts.colorTolerance === 'number'
                ? opts.colorTolerance
                : resolved.manager.colorTolerance;
            const alphaTol = typeof opts.alphaTolerance === 'number'
                ? opts.alphaTolerance
                : resolved.manager.alphaTolerance;
            const fadeLatchedMs = typeof opts.fadeLatchedMs === 'number'
                ? opts.fadeLatchedMs
                : resolved.manager.fadeLatchedMs;

            const useAlpha = hasAlphaChannel(args.initialValue, args.params);
            const activeChannels = useAlpha ? ['r', 'g', 'b', 'a'] : ['r', 'g', 'b'];

            const channelStates = {
                r: createNumericPickupState({ tolerance: rgbTol }),
                g: createNumericPickupState({ tolerance: rgbTol }),
                b: createNumericPickupState({ tolerance: rgbTol }),
                a: createNumericPickupState({ tolerance: alphaTol })
            };

            const rootEl = innerVc.view.element;
            const stripEl = doc.createElement('div');
            stripEl.classList.add('tp-st-color-strip');
            const chipElements = {};

            activeChannels.forEach(function (ch) {
                const chip = doc.createElement('span');
                chip.classList.add('tp-st-ch');
                chip.dataset.channel = ch;
                chip.textContent = ch.toUpperCase() + ': ·';
                stripEl.appendChild(chip);
                chipElements[ch] = chip;
            });

            const headerEl = rootEl.querySelector('.tp-colv_h');
            if (headerEl && headerEl.parentElement) {
                headerEl.parentElement.insertBefore(stripEl, headerEl.nextSibling);
            } else {
                rootEl.appendChild(stripEl);
            }

            let fadeOutTimer = null;
            let stagedChannels = {};

            function isColorControlLatched() {
                const anyLatched = activeChannels.some(function (ch) {
                    return channelStates[ch].latched;
                });
                const anyInteractedUnlatched = activeChannels.some(function (ch) {
                    return channelStates[ch].hasInteracted && !channelStates[ch].latched;
                });
                return anyLatched && !anyInteractedUnlatched;
            }

            function getCurrentRgba() {
                const colorModel = innerVc.value.rawValue;
                if (colorModel && typeof colorModel.toRgbaObject === 'function') {
                    return colorModel.toRgbaObject('int');
                }
                return { r: 0, g: 0, b: 0, a: 1 };
            }

            function writeRgbaToInner(rgba) {
                const currentColor = innerVc.value.rawValue;
                if (!currentColor) return;
                const ColorCtor = currentColor.constructor;
                const colorType = currentColor.type || 'int';
                let comps;
                if (colorType === 'float') {
                    comps = [rgba.r / 255, rgba.g / 255, rgba.b / 255, rgba.a];
                } else {
                    comps = [rgba.r, rgba.g, rgba.b, rgba.a];
                }
                innerVc.value.rawValue = new ColorCtor(comps, 'rgb', colorType);
            }

            function renderColorStrip() {
                if (fadeOutTimer) {
                    clearTimeout(fadeOutTimer);
                    fadeOutTimer = null;
                }

                const anyHardwareActive = activeChannels.some(function (ch) {
                    return channelStates[ch].hasInteracted;
                });
                const anyUnlatched = activeChannels.some(function (ch) {
                    return channelStates[ch].hasInteracted && !channelStates[ch].latched;
                });

                if (!anyHardwareActive) {
                    stripEl.classList.remove('tp-st-strip-visible', 'tp-st-strip-all-latched');
                    rootEl.classList.remove('tp-st-unlatched');
                    return;
                }

                const targetRgba = getCurrentRgba();
                stripEl.classList.add('tp-st-strip-visible');

                activeChannels.forEach(function (ch) {
                    const st = channelStates[ch];
                    const chip = chipElements[ch];
                    const label = ch.toUpperCase();
                    chip.classList.remove('tp-st-ch-up', 'tp-st-ch-down', 'tp-st-ch-latched', 'tp-st-ch-idle');

                    if (!st.hasInteracted) {
                        chip.textContent = label + ': ·';
                        chip.classList.add('tp-st-ch-idle');
                        chip.removeAttribute('title');
                    } else if (st.latched) {
                        chip.textContent = label + ': ✓';
                        chip.classList.add('tp-st-ch-latched');
                        chip.setAttribute('title', label + ' latched');
                    } else {
                        const targetVal = targetRgba[ch];
                        const hwVal = st.hwValue;
                        if (hwVal < targetVal) {
                            chip.textContent = label + ': ▲';
                            chip.classList.add('tp-st-ch-up');
                        } else {
                            chip.textContent = label + ': ▼';
                            chip.classList.add('tp-st-ch-down');
                        }
                        chip.setAttribute(
                            'title',
                            label + ' Hardware: ' + (ch === 'a' ? hwVal.toFixed(2) : Math.round(hwVal)) +
                            ' → Target: ' + (ch === 'a' ? targetVal.toFixed(2) : Math.round(targetVal))
                        );
                    }
                });

                if (anyUnlatched) {
                    rootEl.classList.add('tp-st-unlatched');
                    stripEl.classList.remove('tp-st-strip-all-latched');
                } else {
                    rootEl.classList.remove('tp-st-unlatched');
                    stripEl.classList.add('tp-st-strip-all-latched');
                    fadeOutTimer = setTimeout(function () {
                        stripEl.classList.remove('tp-st-strip-visible', 'tp-st-strip-all-latched');
                        activeChannels.forEach(function (ch) {
                            if (channelStates[ch].latched) {
                                channelStates[ch].hasInteracted = false;
                            }
                        });
                        fadeOutTimer = null;
                    }, fadeLatchedMs);
                }
            }

            let syncingFromInner = false;
            let syncingFromOuter = false;
            let syncingFromHardware = false;

            innerVc.value.emitter.on('change', function () {
                if (syncingFromOuter) return;
                syncingFromInner = true;
                try {
                    const outVal = delegate.proxyObj.v;
                    if (!syncingFromHardware) {
                        const targetRgba = getCurrentRgba();
                        activeChannels.forEach(function (ch) {
                            const st = channelStates[ch];
                            const tol = ch === 'a' ? alphaTol : rgbTol;
                            if (st.hwValue !== null && Math.abs(st.hwValue - targetRgba[ch]) > tol) {
                                unlatchNumericState(st, false);
                            }
                        });
                        renderColorStrip();
                    }
                    args.value.rawValue = isColorObject(outVal) ? Object.assign({}, outVal) : outVal;
                } finally {
                    syncingFromInner = false;
                }
            });

            args.value.emitter.on('change', function () {
                if (syncingFromInner) return;
                syncingFromOuter = true;
                try {
                    if (isColorObject(args.value.rawValue)) {
                        delegate.proxyObj.v = Object.assign({}, args.value.rawValue);
                    } else {
                        delegate.proxyObj.v = args.value.rawValue;
                    }
                    delegate.innerBindingCore.read();
                    const targetRgba = getCurrentRgba();
                    activeChannels.forEach(function (ch) {
                        const st = channelStates[ch];
                        const tol = ch === 'a' ? alphaTol : rgbTol;
                        if (st.hwValue !== null && Math.abs(st.hwValue - targetRgba[ch]) > tol) {
                            unlatchNumericState(st, false);
                        }
                    });
                    renderColorStrip();
                } finally {
                    syncingFromOuter = false;
                }
            });

            const handle = {
                type: 'color',
                receiveHardwareValue: function (rawHw) {
                    const parsed = parseAnyColorInput(rawHw, delegate.innerBindingCore.reader);
                    if (!parsed) return;

                    const targetRgba = getCurrentRgba();

                    activeChannels.forEach(function (ch) {
                        if (!(ch in parsed.channels)) return;
                        let incomingCh = Number(parsed.channels[ch]);
                        if (!Number.isFinite(incomingCh)) return;

                        if (ch === 'a') {
                            // Auto-normalize if user sent 0..255 alpha into a 0..1 channel
                            if (incomingCh > 1) incomingCh = incomingCh / 255;
                            incomingCh = clamp(incomingCh, 0, 1);
                        } else {
                            incomingCh = clamp(incomingCh, 0, 255);
                        }

                        const tol = ch === 'a' ? alphaTol : rgbTol;
                        const res = stepNumericPickup(channelStates[ch], incomingCh, targetRgba[ch], tol);
                        if (res.latched && res.acceptedValue !== null) {
                            stagedChannels[ch] = ch === 'a' ? res.acceptedValue : Math.round(res.acceptedValue);
                        }
                    });

                    if (isColorControlLatched() && Object.keys(stagedChannels).length > 0) {
                        const nextRgba = Object.assign({}, targetRgba, stagedChannels);
                        stagedChannels = {};
                        syncingFromHardware = true;
                        try {
                            writeRgbaToInner(nextRgba);
                            const outVal = delegate.proxyObj.v;
                            args.value.rawValue = isColorObject(outVal) ? Object.assign({}, outVal) : outVal;
                        } finally {
                            syncingFromHardware = false;
                        }
                    }

                    renderColorStrip();
                },
                unlatch: function (clearHw) {
                    stagedChannels = {};
                    activeChannels.forEach(function (ch) {
                        unlatchNumericState(channelStates[ch], clearHw);
                    });
                    renderColorStrip();
                },
                syncExternalTarget: function (val) {
                    stagedChannels = {};
                    syncingFromOuter = true;
                    try {
                        delegate.proxyObj.v = isColorObject(val) ? Object.assign({}, val) : val;
                        delegate.innerBindingCore.read();
                        const outVal = delegate.proxyObj.v;
                        args.value.rawValue = isColorObject(outVal) ? Object.assign({}, outVal) : outVal;
                        const targetRgba = getCurrentRgba();
                        activeChannels.forEach(function (ch) {
                            const st = channelStates[ch];
                            const tol = ch === 'a' ? alphaTol : rgbTol;
                            if (st.hwValue !== null && Math.abs(st.hwValue - targetRgba[ch]) > tol) {
                                unlatchNumericState(st, false);
                            }
                        });
                        renderColorStrip();
                    } finally {
                        syncingFromOuter = false;
                    }
                },
                isLatched: function () {
                    return isColorControlLatched();
                },
                getState: function () {
                    const out = {};
                    activeChannels.forEach(function (ch) {
                        out[ch] = Object.assign({}, channelStates[ch]);
                    });
                    return { channels: out, targetRgba: getCurrentRgba() };
                }
            };

            const unregister = resolved.manager.register(resolved.paneId, resolved.key, handle);
            registerBindingHandle(innerVc, handle);

            bindViewPropsSync(args.viewProps, innerVc.viewProps, function () {
                if (fadeOutTimer) clearTimeout(fadeOutTimer);
                unregister();
            });

            renderColorStrip();

            return {
                view: innerVc.view,
                value: args.value,
                viewProps: args.viewProps
            };
        }
    };

    // --- 4. BOOLEAN PLUGIN ---

    const SoftTakeoverBooleanPlugin = {
        id: 'soft-takeover-bool',
        type: 'input',
        accept: function (exValue, params) {
            if (typeof exValue !== 'boolean') return null;
            if (!isSoftTakeoverEnabled(params)) return null;
            return { initialValue: exValue, params: params };
        },
        binding: {
            reader: function () {
                return function (exValue) { return Boolean(exValue); };
            },
            equals: function (v1, v2) { return v1 === v2; },
            writer: function () {
                return function (target, inValue) { target.write(inValue); };
            }
        },
        controller: function (args) {
            const doc = args.document;
            const delegate = createNativeDelegate(doc, args.initialValue, args.params);
            const innerVc = delegate.innerController;
            const resolved = resolveManagerAndKey(args);
            const pickupState = createNumericPickupState({ tolerance: 0 });
            const rootEl = innerVc.view.element;

            let badgeEl = null;

            function toBool(v) {
                if (typeof v === 'boolean') return v;
                if (typeof v === 'number') return v > 0.5;
                if (typeof v === 'string') return v.toLowerCase() === 'true' || v === '1';
                return Boolean(v);
            }

            function ensureBoolBadge() {
                if (badgeEl && badgeEl.isConnected) return badgeEl;
                const lblv = rootEl.closest('.tp-lblv');
                if (!lblv) return null;
                const labelEl = lblv.querySelector('.tp-lblv_l');
                if (!labelEl) return null;
                labelEl.classList.add('tp-st-lbl-host');
                let existing = labelEl.querySelector('.tp-st-list-badge');
                if (!existing) {
                    existing = doc.createElement('span');
                    existing.classList.add('tp-st-list-badge');
                    labelEl.appendChild(existing);
                }
                badgeEl = existing;
                return badgeEl;
            }

            function renderBoolBadge() {
                const badge = ensureBoolBadge();
                if (pickupState.latched || pickupState.hwValue === null) {
                    rootEl.classList.remove('tp-st-unlatched');
                    if (badge) {
                        badge.style.display = 'none';
                        badge.textContent = '';
                        badge.classList.remove('tp-st-dir-up', 'tp-st-dir-down');
                    }
                    return;
                }
                const targetBool = Boolean(args.value.rawValue);
                rootEl.classList.add('tp-st-unlatched');
                if (badge) {
                    badge.style.display = 'inline-flex';
                    badge.classList.remove('tp-st-dir-up', 'tp-st-dir-down');
                    badge.classList.add(targetBool ? 'tp-st-dir-up' : 'tp-st-dir-down');
                    badge.textContent = targetBool ? '▲ Match ON' : '▼ Match OFF';
                }
            }

            if (typeof queueMicrotask === 'function') {
                queueMicrotask(renderBoolBadge);
            } else {
                setTimeout(renderBoolBadge, 0);
            }

            let syncingFromInner = false;
            let syncingFromOuter = false;
            let syncingFromHardware = false;

            innerVc.value.emitter.on('change', function () {
                if (syncingFromOuter) return;
                syncingFromInner = true;
                try {
                    const nextVal = Boolean(delegate.proxyObj.v);
                    if (!syncingFromHardware && pickupState.hwValue !== null && pickupState.hwValue !== (nextVal ? 1 : 0)) {
                        unlatchNumericState(pickupState, false);
                        renderBoolBadge();
                    }
                    args.value.rawValue = nextVal;
                } finally {
                    syncingFromInner = false;
                }
            });

            args.value.emitter.on('change', function () {
                if (syncingFromInner) return;
                syncingFromOuter = true;
                try {
                    delegate.proxyObj.v = Boolean(args.value.rawValue);
                    delegate.innerBindingCore.read();
                    if (pickupState.hwValue !== null && pickupState.hwValue !== (args.value.rawValue ? 1 : 0)) {
                        unlatchNumericState(pickupState, false);
                    }
                    renderBoolBadge();
                } finally {
                    syncingFromOuter = false;
                }
            });

            const handle = {
                type: 'boolean',
                receiveHardwareValue: function (rawHw) {
                    const hwNum = toBool(rawHw) ? 1 : 0;
                    const targetNum = args.value.rawValue ? 1 : 0;
                    const res = stepNumericPickup(pickupState, hwNum, targetNum, 0);
                    if (res.latched && res.acceptedValue !== null) {
                        syncingFromHardware = true;
                        try {
                            const nextBool = Boolean(res.acceptedValue);
                            delegate.proxyObj.v = nextBool;
                            delegate.innerBindingCore.read();
                            args.value.rawValue = Boolean(delegate.proxyObj.v);
                        } finally {
                            syncingFromHardware = false;
                        }
                    }
                    renderBoolBadge();
                },
                unlatch: function (clearHw) {
                    unlatchNumericState(pickupState, clearHw);
                    renderBoolBadge();
                },
                syncExternalTarget: function (val) {
                    syncingFromOuter = true;
                    try {
                        delegate.proxyObj.v = Boolean(val);
                        delegate.innerBindingCore.read();
                        args.value.rawValue = Boolean(delegate.proxyObj.v);
                        if (pickupState.hwValue !== null && pickupState.hwValue !== (args.value.rawValue ? 1 : 0)) {
                            unlatchNumericState(pickupState, false);
                        }
                        renderBoolBadge();
                    } finally {
                        syncingFromOuter = false;
                    }
                },
                isLatched: function () {
                    return pickupState.latched;
                },
                getState: function () {
                    return Object.assign({}, pickupState, { targetValue: Boolean(args.value.rawValue) });
                }
            };

            const unregister = resolved.manager.register(resolved.paneId, resolved.key, handle);
            registerBindingHandle(innerVc, handle);

            bindViewPropsSync(args.viewProps, innerVc.viewProps, function () {
                if (badgeEl && badgeEl.parentElement) {
                    badgeEl.parentElement.removeChild(badgeEl);
                }
                unregister();
            });

            return {
                view: innerVc.view,
                value: args.value,
                viewProps: args.viewProps
            };
        }
    };

    // --- PLUGIN CSS (AUTOMATICALLY EMBEDDED BY TWEAKPANE) ---

    const PLUGIN_CSS = [
        '/* Tweakpane Soft Takeover (MIDI Pickup) Plugin Styles */',
        '.tp-sldv_t { position: relative; }',
        '.tp-st-band {',
        '  position: absolute;',
        '  top: 50%;',
        '  height: 4px;',
        '  transform: translateY(-50%);',
        '  border-radius: 2px;',
        '  pointer-events: none;',
        '  opacity: 0;',
        '  z-index: 1;',
        '  background: repeating-linear-gradient(',
        '    -45deg,',
        '    rgba(255, 184, 77, 0.55) 0px,',
        '    rgba(255, 184, 77, 0.55) 4px,',
        '    rgba(255, 184, 77, 0.16) 4px,',
        '    rgba(255, 184, 77, 0.16) 8px',
        '  );',
        '}',
        '.tp-st-ghost {',
        '  position: absolute;',
        '  top: 50%;',
        '  width: 12px;',
        '  height: 12px;',
        '  border-radius: 50%;',
        '  border: 2px solid #ffb84d;',
        '  background: rgba(15, 18, 25, 0.85);',
        '  box-shadow: 0 0 6px rgba(255, 184, 77, 0.55);',
        '  transform: translate(-50%, -50%);',
        '  pointer-events: none;',
        '  opacity: 0;',
        '  z-index: 3;',
        '}',
        '.tp-st-unlatched .tp-sldv_k::after {',
        '  background-color: #38bdf8;',
        '  box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35);',
        '}',
        '.tp-st-just-latched .tp-st-ghost {',
        '  transition: left 180ms ease-out, opacity 210ms ease-out, transform 180ms ease-out;',
        '  transform: translate(-50%, -50%) scale(0.7);',
        '}',
        '.tp-st-just-latched .tp-st-band {',
        '  transition: left 180ms ease-out, width 180ms ease-out, opacity 210ms ease-out;',
        '}',
        '',
        '/* List / Dropdown Directional Label Badge */',
        '.tp-st-lbl-host {',
        '  display: flex;',
        '  align-items: center;',
        '  justify-content: space-between;',
        '  gap: 6px;',
        '  flex-wrap: wrap;',
        '}',
        '.tp-st-list-badge {',
        '  display: none;',
        '  align-items: center;',
        '  font-size: 10px;',
        '  font-weight: 700;',
        '  line-height: 1;',
        '  padding: 2px 6px;',
        '  border-radius: 999px;',
        '  letter-spacing: 0.02em;',
        '  white-space: nowrap;',
        '}',
        '.tp-st-list-badge.tp-st-dir-up {',
        '  background: rgba(255, 184, 77, 0.16);',
        '  color: #ffb84d;',
        '  border: 1px solid rgba(255, 184, 77, 0.45);',
        '}',
        '.tp-st-list-badge.tp-st-dir-down {',
        '  background: rgba(56, 189, 248, 0.16);',
        '  color: #38bdf8;',
        '  border: 1px solid rgba(56, 189, 248, 0.45);',
        '}',
        '',
        '/* Color 4-Channel (RGBA) Latch Strip */',
        '.tp-st-color-strip {',
        '  display: flex;',
        '  align-items: center;',
        '  gap: 4px;',
        '  max-height: 0;',
        '  opacity: 0;',
        '  margin-top: 0;',
        '  overflow: hidden;',
        '  transition: opacity 220ms ease, max-height 220ms ease, margin-top 220ms ease;',
        '}',
        '.tp-st-color-strip.tp-st-strip-visible {',
        '  max-height: 24px;',
        '  opacity: 1;',
        '  margin-top: 4px;',
        '}',
        '.tp-st-color-strip.tp-st-strip-all-latched {',
        '  opacity: 0.72;',
        '}',
        '.tp-st-ch {',
        '  flex: 1;',
        '  text-align: center;',
        '  font-size: 10px;',
        '  font-weight: 600;',
        '  line-height: 16px;',
        '  border-radius: 3px;',
        '  padding: 0 3px;',
        '  background: rgba(255, 255, 255, 0.05);',
        '  color: var(--lbl-fg, #bbb);',
        '  border: 1px solid rgba(255, 255, 255, 0.1);',
        '  white-space: nowrap;',
        '}',
        '.tp-st-ch.tp-st-ch-up {',
        '  color: #ffb84d;',
        '  background: rgba(255, 184, 77, 0.14);',
        '  border-color: rgba(255, 184, 77, 0.42);',
        '}',
        '.tp-st-ch.tp-st-ch-down {',
        '  color: #38bdf8;',
        '  background: rgba(56, 189, 248, 0.14);',
        '  border-color: rgba(56, 189, 248, 0.42);',
        '}',
        '.tp-st-ch.tp-st-ch-latched {',
        '  color: #34d399;',
        '  background: rgba(52, 211, 153, 0.12);',
        '  border-color: rgba(52, 211, 153, 0.35);',
        '}',
        '.tp-st-ch.tp-st-ch-idle {',
        '  opacity: 0.55;',
        '}'
    ].join('\n');

    SoftTakeoverNumberPlugin.css = PLUGIN_CSS;

    return {
        plugins: [
            SoftTakeoverNumberPlugin,
            SoftTakeoverListPlugin,
            SoftTakeoverColorPlugin,
            SoftTakeoverBooleanPlugin
        ],
        SoftTakeoverManager: SoftTakeoverManager,
        createManager: function (opts) { return new SoftTakeoverManager(opts); },
        getDefaultManager: function () { return defaultManager; },
        pushValue: pushValue,
        pushColorChannel: pushColorChannel,
        unlatchBinding: unlatchBinding,
        getHandle: getHandleFromBinding,
        core: {
            createNumericPickupState: createNumericPickupState,
            unlatchNumericState: unlatchNumericState,
            stepNumericPickup: stepNumericPickup,
            stepListPickup: stepListPickup,
            parseAnyColorInput: parseAnyColorInput
        }
    };
}));
