// ============================================================================
// Automata editor UI (Konva) — op attachment "inc_editor".
//
// Because the attachment name starts with "inc_", cables includes and executes
// this file in the op's scope BEFORE the main op code, so `initKonvaUI` is
// available to the op. It runs only under CABLES.UI (opened via "Show Tab") and
// reaches into the op-scope engine (setActiveStateId, startTransition,
// rebuildTriggers, Konva, the REGION_* constants, inStoreData, …), which all
// exist by the time initKonvaUI is called. Keep this file free of top-level
// executable statements — only the function declaration below.
// ============================================================================

function initKonvaUI(container)
{
        var width = container.offsetWidth || 800;
        var height = container.offsetHeight || 600;

        const COLORS = {
            nodeFill: "#2f2f2f",
            nodeStroke: "#0e1113",
            nodeStrokeHighlight: "#f6a21a",
            nodeShadow: "rgba(0, 0, 0, 0.35)",
            label: "#eaf7ff",
            transitionCyan: "#28e5ff",
            transitionActive: "#ffd166",
            transitionLabelBg: "rgb(99, 99, 99)",
            transitionLabelBgActive: "rgb(141, 111, 46)",
        };

        const stage = new Konva.Stage({
            container: container,
            width: width,
            height: height,
        });

        const regionLayer = new Konva.Layer();
        stage.add(regionLayer);

        const layer = new Konva.Layer();
        stage.add(layer);

        let nextStateId = 0;
        const states = [];
        const transitions = [];
        const regions = [];
        let nextTransitionId = 0;
        let nextRegionId = 0;
        let activeStateId = null;
        let activeTransitionId = currentActiveTransitionId;

        onActiveStateChanged = (id) =>
        {
            if (activeStateId === id) return;
            activeStateId = id;
            updateObjects();
            layer.batchDraw();
        };

        onTransitionActivityChanged = (id) =>
        {
            activeTransitionId = id;
            updateObjects();
            layer.batchDraw();
        };

        function updateActiveStateOutput()
        {
            setActiveStateId(activeStateId);
        }
        let activeLabelEditor = null;

        function getTransitionLabelText(transition)
        {
            const fromLabel = getStateLabelById(transition.from);
            const toLabel = getStateLabelById(transition.to);
            const frames = sanitizeFrames(transition.frames);
            return fromLabel + " to " + toLabel + " [" + frames + "f]";
        }

        // Load saved data or create default start state
        let savedData = null;
        try
        {
            const stored = inStoreData.get();
            if (stored) savedData = JSON.parse(stored);
        }
        catch (e) { /* ignore parse errors */ }

        if (savedData && Array.isArray(savedData.states) && savedData.states.length > 0)
        {
            if (Array.isArray(savedData.regions))
            {
                savedData.regions.forEach((region) =>
                {
                    if (!region || typeof region.x !== "number" || typeof region.y !== "number") return;
                    const safeRadius = Math.max(0, Number(region.radius) || 0);
                    if (safeRadius <= 0) return;
                    regions.push({
                        id: typeof region.id === "string" && region.id.length > 0
                            ? region.id
                            : "region-" + nextRegionId,
                        x: region.x,
                        y: region.y,
                        radius: safeRadius,
                        title: typeof region.title === "string" && region.title.trim().length > 0
                            ? region.title.trim()
                            : "Region " + (nextRegionId + 1),
                    });
                    nextRegionId += 1;
                });
            }
            savedData.states.forEach((s) =>
            {
                if (s && s.id && typeof s.x === "number" && typeof s.y === "number")
                {
                    states.push({
                        id: String(s.id),
                        label: typeof s.label === "string" ? s.label : String(s.id),
                        x: s.x,
                        y: s.y,
                    });
                }
            });
            if (Array.isArray(savedData.transitions))
            {
                savedData.transitions.forEach((t) =>
                {
                    if (t && t.id && t.from && t.to)
                    {
                        transitions.push({
                            id: String(t.id),
                            from: String(t.from),
                            to: String(t.to),
                            frames: sanitizeFrames(t.frames),
                        });
                    }
                });
            }
            nextStateId = states.length
                ? Math.max(...states.map((s) => parseInt(String(s.id).split("-").pop(), 10) || 0)) + 1
                : 0;
            nextTransitionId = transitions.length
                ? Math.max(...transitions.map((t) => parseInt(String(t.id).split("-").pop(), 10) || 0)) + 1
                : 0;
            nextRegionId = regions.length
                ? Math.max(...regions.map((region) => parseInt(String(region.id).split("-").pop(), 10) || 0)) + 1
                : 0;
            activeStateId = currentActiveStateId && states.some((s) => s.id === currentActiveStateId)
                ? currentActiveStateId
                : (states.length ? states[0].id : null);
            updateActiveStateOutput();
        }
        else
        {
            states.push({
                id: "state-" + nextStateId,
                label: "START",
                x: stage.width() / 2,
                y: stage.height() / 2,
            });
            nextStateId += 1;
            activeStateId = states[0].id;
            updateActiveStateOutput();
        }

        // ===================== Serialization & clipboard import/export =====================

        function saveState()
        {
            var snapshot = {
                regions: regions.map((region) => ({
                    id: region.id,
                    x: region.x,
                    y: region.y,
                    radius: region.radius,
                    title: region.title,
                })),
                states: states.map((s) => ({ id: s.id, label: s.label, x: s.x, y: s.y })),
                transitions: transitions.map((t) => ({ id: t.id, from: t.from, to: t.to, frames: sanitizeFrames(t.frames) })),
            };
            inStoreData.set(JSON.stringify(snapshot));
            rebuildTriggers();
        }

        function getStateSnapshot()
        {
            return {
                regions: regions.map((region) => ({ ...region })),
                states: states.map((state) => ({ ...state })),
                transitions: transitions.map((transition) => ({ ...transition })),
            };
        }

        function printStateAsJson()
        {
            const snapshot = getStateSnapshot();
            const json = JSON.stringify(snapshot, null, 2);
            if (navigator && navigator.clipboard && navigator.clipboard.writeText)
            {
                navigator.clipboard
                    .writeText(json)
                    .then(() => { op.log("State JSON copied to clipboard."); })
                    .catch(() => { op.log(json); });
            }
            else
            {
                op.log(json);
            }
        }

        function clearCurrentState()
        {
            regions.forEach((region) =>
            {
                const regionNode = regionLayer.findOne("#" + region.id);
                const regionTitleNode = regionLayer.findOne("#" + region.id + "-title");
                if (regionNode) regionNode.destroy();
                if (regionTitleNode) regionTitleNode.destroy();
            });
            states.forEach((state) =>
            {
                const node = layer.findOne("#" + state.id);
                const label = layer.findOne("#" + state.id + "-label");
                if (node) node.destroy();
                if (label) label.destroy();
            });
            transitions.forEach((transition) =>
            {
                const line = layer.findOne("#" + transition.id);
                const label = layer.findOne("#" + transition.id + "-label");
                if (line) line.destroy();
                if (label) label.destroy();
            });
            regions.length = 0;
            states.length = 0;
            transitions.length = 0;
            pendingTransitionFrom = null;
            tempTransition.visible(false);
        }

        function rebuildStateFromJson(data)
        {
            const incomingStates = Array.isArray(data.states)
                ? data.states
                : Array.isArray(data.targets)
                    ? data.targets
                    : [];
            const incomingTransitions = Array.isArray(data.transitions)
                ? data.transitions
                : Array.isArray(data.connectors)
                    ? data.connectors
                    : [];
            const incomingRegions = Array.isArray(data.regions)
                ? data.regions
                : [];

            clearCurrentState();

            incomingStates.forEach((state) =>
            {
                if (!state || !state.id || typeof state.x !== "number" || typeof state.y !== "number") return;
                const safeState = {
                    id: String(state.id),
                    label: typeof state.label === "string" ? state.label : String(state.id),
                    x: state.x,
                    y: state.y,
                };
                states.push(safeState);
                createState(safeState);
            });

            incomingTransitions.forEach((transition) =>
            {
                if (!transition || !transition.id || !transition.from || !transition.to) return;
                const safeTransition = {
                    id: String(transition.id),
                    from: String(transition.from),
                    to: String(transition.to),
                    frames: sanitizeFrames(transition.frames),
                };
                transitions.push(safeTransition);
                createTransition(safeTransition);
            });

            incomingRegions.forEach((region) =>
            {
                if (!region || typeof region.x !== "number" || typeof region.y !== "number") return;
                const safeRadius = Math.max(0, Number(region.radius) || 0);
                if (safeRadius <= 0) return;
                const safeRegion = {
                    id: typeof region.id === "string" && region.id.length > 0
                        ? region.id
                        : "region-" + nextRegionId,
                    x: region.x,
                    y: region.y,
                    radius: safeRadius,
                    title: typeof region.title === "string" && region.title.trim().length > 0
                        ? region.title.trim()
                        : "Region " + (nextRegionId + 1),
                };
                regions.push(safeRegion);
                createRegion(safeRegion);
                nextRegionId += 1;
            });

            nextStateId = states.length
                ? Math.max(...states.map((s) => parseInt(String(s.id).split("-").pop(), 10) || 0)) + 1
                : 0;
            nextTransitionId = transitions.length
                ? Math.max(...transitions.map((t) => parseInt(String(t.id).split("-").pop(), 10) || 0)) + 1
                : 0;
            nextRegionId = regions.length
                ? Math.max(...regions.map((region) => parseInt(String(region.id).split("-").pop(), 10) || 0)) + 1
                : 0;

            activeStateId = states.length ? states[0].id : null;
            updateActiveStateOutput();
            updateObjects();
            layer.batchDraw();
            saveState();
        }

        function importStateFromClipboard()
        {
            if (!navigator || !navigator.clipboard || !navigator.clipboard.readText)
            {
                op.log("Clipboard API not available.");
                return;
            }
            navigator.clipboard
                .readText()
                .then((text) =>
                {
                    let parsed;
                    try { parsed = JSON.parse(text); }
                    catch (error) { op.log("Invalid JSON in clipboard."); return; }
                    if (!parsed || typeof parsed !== "object")
                    {
                        op.log("Clipboard JSON is not an object.");
                        return;
                    }
                    rebuildStateFromJson(parsed);
                    op.log("State JSON imported from clipboard.");
                })
                .catch(() => { op.log("Failed to read clipboard."); });
        }

        function getStateLabelById(stateId)
        {
            const state = states.find((item) => item.id === stateId);
            return state ? state.label || state.id : stateId;
        }

        // ===================== Geometry & rendering (sync Konva nodes to data) =====================

        // A transition gets a small perpendicular shift when its reverse (to→from)
        // also exists, so the two are drawn — and picked — with a gap instead of
        // overlapping. Each direction uses its own left normal (of to-from), so the
        // pair separates symmetrically. When two states have transitions both ways,
        // the label also slides to 30% along its own direction; since the reverse
        // runs the other way, the pair lands at 30%/70% and the labels no longer
        // stack. A lone transition keeps its centred label and no offset.
        const TRANSITION_GAP = 16;          // perpendicular shift each side (doc units)
        const LABEL_FRAC_WITH_REVERSE = 0.3; // label position along the line

        function hasReverseTransition(transition)
        {
            return transitions.some((o) =>
                o && o.id !== transition.id && o.from === transition.to && o.to === transition.from);
        }

        function getTransitionPoints(from, to, gapOffset)
        {
            const dx = to.x - from.x;
            const dy = to.y - from.y;
            let angle = Math.atan2(-dy, dx);
            const radius = 55;
            let ox = 0;
            let oy = 0;
            if (gapOffset)
            {
                const len = Math.hypot(dx, dy);
                if (len > 0.0001)
                {
                    // Left normal of (dx, dy). The reverse transition swaps from/to,
                    // which flips (dx, dy) and thus this offset — separating the pair.
                    ox = (-dy / len) * gapOffset;
                    oy = (dx / len) * gapOffset;
                }
            }
            return [
                from.x + -radius * Math.cos(angle + Math.PI) + ox,
                from.y + radius * Math.sin(angle + Math.PI) + oy,
                to.x + -radius * Math.cos(angle) + ox,
                to.y + radius * Math.sin(angle) + oy,
            ];
        }

        let pendingTransitionFrom = null;
        let regionDraftStart = null;
        let regionCreationActive = false;
        const MIN_REGION_RADIUS = 8;
        const tempTransition = new Konva.Arrow({
            stroke: COLORS.transitionCyan,
            fill: COLORS.transitionCyan,
            pointerLength: 8,
            pointerWidth: 8,
            dash: [6, 4],
            listening: false,
            visible: false,
        });
        layer.add(tempTransition);

        const regionDraftCircle = new Konva.Circle({
            id: "region-draft",
            fill: "rgba(64, 180, 255, 0.14)",
            stroke: "rgba(64, 180, 255, 0.65)",
            strokeWidth: 2,
            dash: [8, 6],
            radius: 0,
            listening: false,
            visible: false,
        });
        regionLayer.add(regionDraftCircle);

        function updateObjects()
        {
            states.forEach((state) =>
            {
                const node = layer.findOne("#" + state.id);
                const label = layer.findOne("#" + state.id + "-label");
                if (node)
                {
                    const isHighlighted = activeStateId && state.id === activeStateId;
                    const nextStroke = isHighlighted
                        ? COLORS.nodeStrokeHighlight
                        : COLORS.nodeStroke;
                    if (node.getAttr("cachedStroke") !== nextStroke)
                    {
                        node.stroke(nextStroke);
                        node.setAttr("cachedStroke", nextStroke);
                    }
                }
                if (node)
                {
                    node.x(state.x);
                    node.y(state.y);
                }
                if (label)
                {
                    const nextText = state.label || state.id;
                    if (label.getAttr("cachedText") !== nextText)
                    {
                        label.text(nextText);
                        label.setAttr("cachedText", nextText);
                    }
                    label.x(state.x);
                    label.y(state.y);
                    label.offsetX(label.width() / 2);
                    label.offsetY(label.height() / 2);
                }
            });
            syncRegionActivityAppearance();
            transitions.forEach((transition) =>
            {
                const line = layer.findOne("#" + transition.id);
                const label = layer.findOne("#" + transition.id + "-label");
                const labelText = layer.findOne("#" + transition.id + "-label-text");
                const labelBg = layer.findOne("#" + transition.id + "-label-bg");
                const fromNode = layer.findOne("#" + transition.from);
                const toNode = layer.findOne("#" + transition.to);

                if (!fromNode || !toNode) return;

                const reversed = hasReverseTransition(transition);
                const points = getTransitionPoints(
                    fromNode.position(), toNode.position(), reversed ? TRANSITION_GAP : 0);
                line.points(points);
                const isTransitionActive = activeTransitionId && transition.id === activeTransitionId;
                const lineColor = isTransitionActive ? COLORS.transitionActive : COLORS.transitionCyan;
                line.stroke(lineColor);
                line.fill(lineColor);
                if (label && labelText && labelBg)
                {
                    const nextText = getTransitionLabelText(transition);
                    // Slide the label to 30% along its own direction when a reverse
                    // transition exists (else centred), so the two don't overlap.
                    const frac = reversed ? LABEL_FRAC_WITH_REVERSE : 0.5;
                    const midX = points[0] + (points[2] - points[0]) * frac;
                    const midY = points[1] + (points[3] - points[1]) * frac;
                    label.position({ x: midX, y: midY });
                    labelBg.fill(isTransitionActive ? COLORS.transitionLabelBgActive : COLORS.transitionLabelBg);
                    if (labelText.getAttr("cachedText") !== nextText)
                    {
                        labelText.text(nextText);
                        labelText.setAttr("cachedText", nextText);
                        const textWidth = labelText.width();
                        const textHeight = labelText.height();
                        const bgWidth = textWidth * 1.2;
                        const bgHeight = textHeight * 2;
                        labelBg.size({ width: bgWidth, height: bgHeight });
                        labelText.position({
                            x: (bgWidth - textWidth) / 2,
                            y: (bgHeight - textHeight) / 2,
                        });
                        label.cache();
                    }
                    const rect = label.getClientRect({ relativeTo: layer });
                    label.offsetX(rect.width / 2);
                    label.offsetY(rect.height / 2);
                    label.moveToTop();
                }
            });
            states.forEach((state) =>
            {
                const node = layer.findOne("#" + state.id);
                const label = layer.findOne("#" + state.id + "-label");
                if (node) node.moveToTop();
                if (label) label.moveToTop();
            });
        }

        function getStagePointFromPointer(pointer)
        {
            const scale = stage.scaleX();
            return {
                x: (pointer.x - stage.x()) / scale,
                y: (pointer.y - stage.y()) / scale,
            };
        }

        function updateTempTransition(pointer)
        {
            if (!pendingTransitionFrom || !pointer) return;
            const shape = stage.getIntersection(pointer);
            if (shape && shape.id && shape.id() === pendingTransitionFrom)
            {
                tempTransition.visible(false);
                layer.batchDraw();
                return;
            }
            const fromNode = layer.findOne("#" + pendingTransitionFrom);
            if (!fromNode) return;
            const stagePoint = getStagePointFromPointer(pointer);
            const points = getTransitionPoints(fromNode.position(), stagePoint);
            tempTransition.points(points);
            tempTransition.visible(true);
            tempTransition.moveToTop();
            layer.batchDraw();
        }

        // ===================== Inline text editors (on-canvas <input>) =====================

        // Remove the currently open inline <input> editor, if any.
        function closeActiveLabelEditor()
        {
            if (activeLabelEditor && activeLabelEditor.parentNode) activeLabelEditor.remove();
            activeLabelEditor = null;
        }

        // Shared factory for the on-canvas inline editors (state label, transition
        // frames, region title). `opts.x`/`opts.y` are the editor's centre in page
        // coords; `opts.onCommit(rawValue)` receives the raw input string on
        // Enter/blur. Escape cancels without committing.
        function createInlineEditor(opts)
        {
            closeActiveLabelEditor();

            const input = document.createElement("input");
            input.type = opts.type || "text";
            if (opts.min !== undefined) input.min = opts.min;
            if (opts.step !== undefined) input.step = opts.step;
            input.value = opts.value;

            Object.assign(input.style, {
                "position": "absolute",
                "left": (opts.x - opts.width / 2) + "px",
                "top": (opts.y - opts.height / 2) + "px",
                "width": opts.width + "px",
                "height": opts.height + "px",
                "fontSize": opts.fontSize + "px",
                "fontFamily": opts.fontFamily,
                "color": opts.color,
                "background": opts.background,
                "border": "1px solid #4aa3ff",
                "padding": (opts.padding || 10) + "px",
                "margin": "0",
                "textAlign": "center",
                "outline": "none",
                "boxSizing": "border-box",
                "zIndex": "9999",
            });

            // Container has relative positioning via Konva, so absolute works here.
            container.style.position = "relative";
            container.appendChild(input);
            input.focus();
            input.select();
            activeLabelEditor = input;

            let committed = false;
            const commit = () =>
            {
                if (committed) return;
                committed = true;
                const value = input.value;
                closeActiveLabelEditor();
                opts.onCommit(value);
            };

            input.addEventListener("keydown", (event) =>
            {
                if (event.key === "Enter") { event.preventDefault(); commit(); }
                else if (event.key === "Escape") { event.preventDefault(); closeActiveLabelEditor(); }
            });
            input.addEventListener("blur", () => { commit(); });
        }

        function startEditingStateLabel(state, label)
        {
            const pos = label.getAbsolutePosition();
            createInlineEditor({
                "x": pos.x,
                "y": pos.y,
                "width": Math.max(label.width(), 100),
                "height": label.height() + 20,
                "type": "text",
                "value": state.label || label.text(),
                "fontSize": label.fontSize(),
                "fontFamily": label.fontFamily(),
                "color": label.fill(),
                "background": "rgba(0,0,0,0.6)",
                "padding": 10,
                "onCommit": (value) =>
                {
                    const newText = value.trim();
                    state.label = newText ? newText : state.label;
                    label.text(state.label || state.id);
                    updateActiveStateOutput();
                    updateObjects();
                    layer.batchDraw();
                    saveState();
                },
            });
        }

        function startEditingTransitionFrames(transition, label, labelText)
        {
            const pos = label.getAbsolutePosition();
            createInlineEditor({
                "x": pos.x,
                "y": pos.y,
                "width": Math.max(labelText.width() + 40, 140),
                "height": Math.max(labelText.height() + 26, 44),
                "type": "number",
                "min": "0",
                "step": "1",
                "value": String(sanitizeFrames(transition.frames)),
                "fontSize": Math.max(labelText.fontSize() + 4, 18),
                "fontFamily": labelText.fontFamily(),
                "color": labelText.fill(),
                "background": "rgba(20,20,20,1)",
                "padding": 12,
                "onCommit": (value) =>
                {
                    transition.frames = sanitizeFrames(value);
                    updateObjects();
                    layer.batchDraw();
                    saveState();
                },
            });
        }

        // ===================== Node builders & CRUD (transitions / regions / states) =====================

        function createTransition(transition)
        {
            const line = new Konva.Arrow({
                stroke: COLORS.transitionCyan,
                id: transition.id,
                fill: COLORS.transitionCyan,
                pointerLength: 8,
                pointerWidth: 8,
            });
            layer.add(line);

            const label = new Konva.Group({
                id: transition.id + "-label",
                listening: true,
            });
            const labelBg = new Konva.Rect({
                id: transition.id + "-label-bg",
                fill: COLORS.transitionLabelBg,
                cornerRadius: 8,
                width: 0,
                height: 0,
                listening: true,
            });
            const labelText = new Konva.Text({
                id: transition.id + "-label-text",
                text: getTransitionLabelText(transition),
                fontSize: 12,
                fontFamily: "Arial",
                fill: COLORS.label,
                align: "center",
                listening: true,
            });
            labelText.setAttr("cachedText", getTransitionLabelText(transition));
            const textWidth = labelText.width();
            const textHeight = labelText.height();
            const bgWidth = textWidth * 1.5;
            const bgHeight = textHeight * 2;
            labelBg.size({ width: bgWidth, height: bgHeight });
            labelText.position({
                x: (bgWidth - textWidth) / 2,
                y: (bgHeight - textHeight) / 2,
            });
            label.add(labelBg);
            label.add(labelText);
            layer.add(label);
            const rect = label.getClientRect({ relativeTo: layer });
            label.offsetX(rect.width / 2);
            label.offsetY(rect.height / 2);
            label.cache();

            const handleMouseDown = (event) =>
            {
                if (event.evt.button === 0 && event.evt.ctrlKey)
                {
                    event.evt.preventDefault();
                    event.cancelBubble = true;
                    // Editor force-trigger: run this transition regardless of the
                    // current state — cancel any pending one, jump to its "from"
                    // state, then start it. Only this ctrl+click shortcut behaves
                    // this way; the normal trigger ports stay gated to "from".
                    cancelPendingTransition();
                    if (currentActiveStateId !== transition.from) setActiveStateId(transition.from);
                    startTransition(transition);
                    return;
                }

                if (event.evt.button !== 1 && !(event.evt.button === 0 && event.evt.altKey)) return;
                event.evt.preventDefault();
                removeTransition(transition.id);
            };

            const handleDoubleClick = (event) =>
            {
                event.cancelBubble = true;
                startEditingTransitionFrames(transition, label, labelText);
            };

            labelBg.on("mousedown", handleMouseDown);
            labelText.on("mousedown", handleMouseDown);
            labelBg.on("dblclick", handleDoubleClick);
            labelText.on("dblclick", handleDoubleClick);
        }

        function createRegion(region)
        {
            const title = typeof region.title === "string" && region.title.trim().length > 0
                ? region.title.trim()
                : region.id;

            const circle = new Konva.Circle({
                id: region.id,
                x: region.x,
                y: region.y,
                radius: region.radius,
                fill: REGION_INACTIVE_FILL,
                stroke: REGION_INACTIVE_STROKE,
                strokeWidth: 2,
                listening: true,
            });

            const titleText = new Konva.Text({
                id: region.id + "-title",
                x: region.x,
                y: region.y,
                text: title,
                fontSize: 16,
                fontFamily: "Arial",
                fill: REGION_INACTIVE_TITLE_FILL,
                align: "center",
                listening: true,
            });
            titleText.offsetX(titleText.width() / 2);
            titleText.offsetY(titleText.height() / 2);

            circle.on("dblclick", (event) =>
            {
                event.cancelBubble = true;
                startEditingRegionTitle(region, titleText);
            });

            titleText.on("dblclick", (event) =>
            {
                event.cancelBubble = true;
                startEditingRegionTitle(region, titleText);
            });

            regionLayer.add(circle);
            regionLayer.add(titleText);
            regionLayer.batchDraw();
        }

        function isStateInsideRegion(state, region)
        {
            if (!state || !region) return false;
            const dx = state.x - region.x;
            const dy = state.y - region.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= region.radius + STATE_RADIUS;
        }

        function updateRegionAppearance(region, isActive)
        {
            const circle = regionLayer.findOne("#" + region.id);
            const title = regionLayer.findOne("#" + region.id + "-title");

            if (circle)
            {
                circle.fill(isActive ? REGION_ACTIVE_FILL : REGION_INACTIVE_FILL);
                circle.stroke(isActive ? REGION_ACTIVE_STROKE : REGION_INACTIVE_STROKE);
                circle.strokeWidth(isActive ? 3 : 2);
            }

            if (title)
            {
                title.fill(isActive ? REGION_ACTIVE_TITLE_FILL : REGION_INACTIVE_TITLE_FILL);
            }
        }

        // Visual only: the output ports are owned/updated at op scope
        // (see module-level syncRegionActivityOutputs), driven from stored data
        // so they survive reloads without the editor tab being open.
        function syncRegionActivityAppearance()
        {
            const activeState = states.find((state) => state.id === activeStateId) || null;

            regions.forEach((region) =>
            {
                const isActive = !!(activeState && isStateInsideRegion(activeState, region));
                region.active = isActive;
                updateRegionAppearance(region, isActive);
            });

            regionLayer.batchDraw();
        }

        function startEditingRegionTitle(region, label)
        {
            const pos = label.getAbsolutePosition();
            createInlineEditor({
                "x": pos.x,
                "y": pos.y,
                "width": Math.max(label.width() + 40, 140),
                "height": Math.max(label.height() + 24, 42),
                "type": "text",
                "value": region.title || label.text() || "",
                "fontSize": Math.max(label.fontSize() + 2, 16),
                "fontFamily": label.fontFamily(),
                "color": "#eaf7ff",
                "background": "rgba(20,20,20,0.95)",
                "padding": 10,
                "onCommit": (value) =>
                {
                    const newTitle = value.trim();
                    region.title = newTitle || region.title || "Region";
                    label.text(region.title);
                    label.offsetX(label.width() / 2);
                    label.offsetY(label.height() / 2);
                    regionLayer.batchDraw();
                    syncRegionActivityAppearance();
                    saveState();
                },
            });
        }

        function removeRegion(regionId)
        {
            const index = regions.findIndex((region) => region.id === regionId);
            if (index === -1) return;

            regions.splice(index, 1);
            const circle = regionLayer.findOne("#" + regionId);
            const title = regionLayer.findOne("#" + regionId + "-title");
            if (circle) circle.destroy();
            if (title) title.destroy();
            regionLayer.batchDraw();
            syncRegionActivityAppearance();
            saveState();
        }

        function getRegionIdFromShapeId(shapeId)
        {
            if (typeof shapeId !== "string" || !shapeId.startsWith("region-")) return null;
            return shapeId.endsWith("-title") ? shapeId.slice(0, -6) : shapeId;
        }

        function isPointNearRegionEdge(region, point, tolerance = 10)
        {
            if (!region || !point) return false;
            const dx = point.x - region.x;
            const dy = point.y - region.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return Math.abs(distance - region.radius) <= tolerance;
        }

        function updateCursorForPointer(shapeId, stagePoint)
        {
            if (regionResizeTarget)
            {
                container.style.cursor = "nwse-resize";
                return;
            }

            if (regionDragTarget || canvasDrag)
            {
                container.style.cursor = "grabbing";
                return;
            }

            const regionId = getRegionIdFromShapeId(shapeId);
            if (shapeId && shapeId.endsWith("-title") && regionId)
            {
                container.style.cursor = "grab";
                return;
            }

            if (shapeId === regionId && regionId)
            {
                const regionObj = regions.find((region) => region.id === regionId);
                if (regionObj && isPointNearRegionEdge(regionObj, stagePoint))
                {
                    container.style.cursor = "nwse-resize";
                    return;
                }
            }

            container.style.cursor = "default";
        }

        function removeTransition(transitionId, skipUpdate)
        {
            const index = transitions.findIndex((transition) => transition.id === transitionId);
            if (index === -1) return;

            if (pendingTransition && pendingTransition.id === transitionId)
            {
                cancelPendingTransition();
            }

            transitions.splice(index, 1);
            const line = layer.findOne("#" + transitionId);
            const label = layer.findOne("#" + transitionId + "-label");
            if (line) line.destroy();
            if (label) label.destroy();
            if (!skipUpdate)
            {
                updateObjects();
                layer.batchDraw();
                saveState();
            }
        }

        function transitionExists(fromId, toId)
        {
            return transitions.some((transition) => transition.from === fromId && transition.to === toId);
        }

        function addTransition(fromId, toId)
        {
            if (fromId === toId) return;
            if (transitionExists(fromId, toId)) return;
            const transition = {
                id: "transition-" + nextTransitionId,
                from: fromId,
                to: toId,
                frames: 0,
            };
            nextTransitionId += 1;
            transitions.push(transition);
            createTransition(transition);
            updateObjects();
            layer.batchDraw();
            saveState();
        }

        regions.forEach((region) => { createRegion(region); });
        transitions.forEach((transition) => { createTransition(transition); });

        function removeState(stateId)
        {
            if (states.length <= 1) return;
            const index = states.findIndex((state) => state.id === stateId);
            if (index === -1) return;

            if (pendingTransitionFrom === stateId)
            {
                pendingTransitionFrom = null;
                tempTransition.visible(false);
            }

            if (pendingTransition && (pendingTransition.from === stateId || pendingTransition.to === stateId))
            {
                cancelPendingTransition();
            }

            states.splice(index, 1);
            const node = layer.findOne("#" + stateId);
            const label = layer.findOne("#" + stateId + "-label");
            if (node) node.destroy();
            if (label) label.destroy();

            const related = transitions.filter(
                (transition) => transition.from === stateId || transition.to === stateId
            );
            related.forEach((transition) => { removeTransition(transition.id, true); });

            if (activeStateId === stateId)
            {
                activeStateId = states.length ? states[0].id : null;
                updateActiveStateOutput();
            }
            updateObjects();
            layer.batchDraw();
            saveState();
        }

        function createState(state)
        {
            const isHighlighted = state.id === activeStateId;
            const node = new Konva.Circle({
                id: state.id,
                fill: COLORS.nodeFill,
                stroke: isHighlighted ? COLORS.nodeStrokeHighlight : COLORS.nodeStroke,
                strokeWidth: 4,
                radius: STATE_RADIUS,
                shadowBlur: 12,
                shadowColor: COLORS.nodeShadow,
                shadowForStrokeEnabled: false,
            });
            node.setAttr("cachedStroke", node.stroke());
            layer.add(node);

            const label = new Konva.Text({
                id: state.id + "-label",
                text: state.label || state.id,
                fontSize: 14,
                fontFamily: "Arial",
                fill: COLORS.label,
                align: "center",
                listening: false,
            });
            label.setAttr("cachedText", label.text());
            label.offsetX(label.width() / 2);
            label.offsetY(label.height() / 2);
            layer.add(label);

            node.on("contextmenu", (event) =>
            {
                event.evt.preventDefault();
                if (event.evt.ctrlKey) return;
                pendingTransitionFrom = state.id;
                updateTempTransition(stage.getPointerPosition());
            });

            node.on("dblclick", (event) =>
            {
                event.cancelBubble = true;
                startEditingStateLabel(state, label);
            });
        }

        function addStateAt(x, y)
        {
            const state = {
                id: "state-" + nextStateId,
                label: "state-" + nextStateId,
                x: x,
                y: y,
            };
            nextStateId += 1;
            states.push(state);
            createState(state);
            updateObjects();
            layer.batchDraw();
            saveState();
        }

        states.forEach((state) => { createState(state); });

        updateObjects();

        // Manual drag tracking (Konva's built-in drag doesn't work inside cables tabs)
        let dragTarget = null; // { stateObj, node, label, offsetX, offsetY }
        let regionDragTarget = null; // { regionObj, circle, title, offsetX, offsetY }
        let regionResizeTarget = null; // { regionObj, circle }
        let canvasDrag = false;
        let canvasDragStart = null;

        // ===================== Interaction: mouse, keyboard, viewport =====================

        stage.on("mousedown", (e) =>
        {
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const stagePoint = getStagePointFromPointer(pointer);
            const shape = stage.getIntersection(pointer);
            const shapeId = shape && shape.id ? shape.id() : null;
            const regionId = getRegionIdFromShapeId(shapeId);

            // Middle-click: delete state or transition
            if (e.evt.button === 1)
            {
                e.evt.preventDefault();
                if (shape && shape.id)
                {
                    const id = shapeId;
                    if (id.startsWith("state-")) removeState(id);
                    else if (id.startsWith("transition-")) removeTransition(id);
                }
                return;
            }

            // Left-click
            if (e.evt.button === 0)
            {
                if (shapeId && shapeId.startsWith("state-") && e.evt.altKey)
                {
                    e.evt.preventDefault();
                    removeState(shapeId);
                    return;
                }

                if (shapeId && shapeId.startsWith("transition-") && e.evt.altKey)
                {
                    e.evt.preventDefault();
                    removeTransition(shapeId);
                    return;
                }

                if (regionId && e.evt.altKey)
                {
                    e.evt.preventDefault();
                    removeRegion(regionId);
                    return;
                }

                if (shapeId === regionId && regionId)
                {
                    const regionObj = regions.find((region) => region.id === regionId);
                    if (regionObj && isPointNearRegionEdge(regionObj, stagePoint))
                    {
                        regionResizeTarget = {
                            regionObj: regionObj,
                            circle: regionLayer.findOne("#" + regionId),
                        };
                        container.style.cursor = "nwse-resize";
                        return;
                    }
                }

                // Alt+click on state: set active
                if (shapeId && shapeId.startsWith("state-") && e.evt.ctrlKey)
                {
                    activeStateId = shapeId;
                    updateActiveStateOutput();
                    updateObjects();
                    layer.batchDraw();
                    saveState();
                    return;
                }

                // Pending transition: complete it
                if (pendingTransitionFrom)
                {
                    if (shapeId && shapeId.startsWith("state-"))
                    {
                        const fromId = pendingTransitionFrom;
                        pendingTransitionFrom = null;
                        tempTransition.visible(false);
                        addTransition(fromId, shapeId);
                    }
                    else
                    {
                        pendingTransitionFrom = null;
                        tempTransition.visible(false);
                        layer.batchDraw();
                    }
                    return;
                }

                // Drag a region by dragging its title text
                if (shapeId && shapeId.endsWith("-title") && regionId)
                {
                    const regionObj = regions.find((region) => region.id === regionId);
                    if (regionObj)
                    {
                        regionDragTarget = {
                            regionObj: regionObj,
                            circle: regionLayer.findOne("#" + regionId),
                            title: regionLayer.findOne("#" + regionId + "-title"),
                            offsetX: stagePoint.x - regionObj.x,
                            offsetY: stagePoint.y - regionObj.y,
                        };
                        container.style.cursor = "grabbing";
                    }
                    return;
                }

                // Start dragging a state node
                if (shapeId && shapeId.startsWith("state-"))
                {
                    const stateObj = states.find((s) => s.id === shapeId);
                    if (stateObj)
                    {
                        const node = layer.findOne("#" + stateObj.id);
                        const label = layer.findOne("#" + stateObj.id + "-label");
                        dragTarget = {
                            stateObj: stateObj,
                            node: node,
                            label: label,
                            offsetX: stagePoint.x - stateObj.x,
                            offsetY: stagePoint.y - stateObj.y,
                        };
                        if (node) node.moveToTop();
                        if (label) label.moveToTop();
                        layer.batchDraw();
                    }
                    return;
                }

                // Alt + drag on empty space starts a new region (plain drag does
                // nothing, so regions aren't created by accident).
                if (!shape && e.evt.altKey && !e.evt.ctrlKey && !e.evt.metaKey && !e.evt.shiftKey)
                {
                    regionDraftStart = { x: stagePoint.x, y: stagePoint.y };
                    regionCreationActive = true;
                    regionDraftCircle.position(regionDraftStart);
                    regionDraftCircle.radius(0);
                    regionDraftCircle.visible(true);
                    regionLayer.batchDraw();
                    return;
                }
            }

            // Right-click on empty canvas: start canvas pan
            if (e.evt.button === 2)
            {
                if (shape && shape instanceof Konva.Circle) return;
                canvasDrag = true;
                canvasDragStart = { x: e.evt.clientX - stage.x(), y: e.evt.clientY - stage.y() };
                container.style.cursor = "grabbing";
            }
        });

        stage.on("mousemove", (e) =>
        {
            const pointer = stage.getPointerPosition();
            if (!pointer) return;
            const stagePoint = getStagePointFromPointer(pointer);
            const shape = stage.getIntersection(pointer);
            const shapeId = shape && shape.id ? shape.id() : null;

            updateCursorForPointer(shapeId, stagePoint);

            if (regionCreationActive && regionDraftStart)
            {
                const dx = stagePoint.x - regionDraftStart.x;
                const dy = stagePoint.y - regionDraftStart.y;
                const radius = Math.sqrt(dx * dx + dy * dy);
                regionDraftCircle.radius(radius);
                regionLayer.batchDraw();
                return;
            }

            if (regionResizeTarget)
            {
                const dx = stagePoint.x - regionResizeTarget.regionObj.x;
                const dy = stagePoint.y - regionResizeTarget.regionObj.y;
                const radius = Math.max(MIN_REGION_RADIUS, Math.sqrt(dx * dx + dy * dy));
                regionResizeTarget.regionObj.radius = radius;
                if (regionResizeTarget.circle) regionResizeTarget.circle.radius(radius);
                    syncRegionActivityAppearance();
                container.style.cursor = "nwse-resize";
                return;
            }

            if (regionDragTarget)
            {
                const nextX = stagePoint.x - regionDragTarget.offsetX;
                const nextY = stagePoint.y - regionDragTarget.offsetY;
                regionDragTarget.regionObj.x = nextX;
                regionDragTarget.regionObj.y = nextY;

                if (regionDragTarget.circle)
                {
                    regionDragTarget.circle.x(nextX);
                    regionDragTarget.circle.y(nextY);
                }
                if (regionDragTarget.title)
                {
                    regionDragTarget.title.x(nextX);
                    regionDragTarget.title.y(nextY);
                }

                    syncRegionActivityAppearance();
                container.style.cursor = "grabbing";
                return;
            }

            // Dragging a state node
            if (dragTarget)
            {
                dragTarget.stateObj.x = stagePoint.x - dragTarget.offsetX;
                dragTarget.stateObj.y = stagePoint.y - dragTarget.offsetY;
                updateObjects();
                layer.batchDraw();
                return;
            }

            // Panning the canvas
            if (canvasDrag && canvasDragStart)
            {
                stage.position({
                    x: e.evt.clientX - canvasDragStart.x,
                    y: e.evt.clientY - canvasDragStart.y,
                });
                stage.batchDraw();
                return;
            }

            // Update temp transition arrow
            if (pendingTransitionFrom)
            {
                updateTempTransition(pointer);
            }
        });

        stage.on("mouseup", () =>
        {
            let didCreateRegion = false;

            if (regionCreationActive && regionDraftStart)
            {
                const pointer = stage.getPointerPosition();
                const stagePoint = pointer
                    ? getStagePointFromPointer(pointer)
                    : regionDraftStart;
                const dx = stagePoint.x - regionDraftStart.x;
                const dy = stagePoint.y - regionDraftStart.y;
                const radius = Math.sqrt(dx * dx + dy * dy);

                if (radius >= MIN_REGION_RADIUS)
                {
                    const region = {
                        id: "region-" + nextRegionId,
                        x: regionDraftStart.x,
                        y: regionDraftStart.y,
                        radius: radius,
                        title: "Region " + (nextRegionId + 1),
                    };
                    nextRegionId += 1;
                    regions.push(region);
                    createRegion(region);
                    syncRegionActivityAppearance();
                    didCreateRegion = true;
                }

                regionDraftStart = null;
                regionCreationActive = false;
                regionDraftCircle.visible(false);
                regionDraftCircle.radius(0);
                syncRegionActivityAppearance();
            }

            if (dragTarget) saveState();
            if (regionDragTarget) saveState();
            if (regionResizeTarget) saveState();
            if (didCreateRegion) saveState();
            dragTarget = null;
            regionDragTarget = null;
            regionResizeTarget = null;
            canvasDrag = false;
            canvasDragStart = null;
            container.style.cursor = "default";
        });

        stage.on("dblclick", (e) =>
        {
            // Dblclick on state node: edit label
            if (e.target !== stage && e.target.id && e.target.id().startsWith("state-"))
            {
                return; // handled by node's dblclick
            }
            // Dblclick on empty canvas: add state
            if (e.target === stage)
            {
                const pointer = stage.getPointerPosition();
                if (!pointer) return;
                const scale = stage.scaleX();
                const x = (pointer.x - stage.x()) / scale;
                const y = (pointer.y - stage.y()) / scale;
                addStateAt(x, y);
            }
        });

        const scaleBy = 1.05;
        stage.on("wheel", (e) =>
        {
            e.evt.preventDefault();
            const oldScale = stage.scaleX();
            const pointer = stage.getPointerPosition();
            if (!pointer) return;

            const mousePointTo = {
                x: (pointer.x - stage.x()) / oldScale,
                y: (pointer.y - stage.y()) / oldScale,
            };

            let direction = e.evt.deltaY > 0 ? 1 : -1;
            if (e.evt.ctrlKey) direction = -direction;

            const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;
            stage.scale({ x: newScale, y: newScale });

            const newPos = {
                x: pointer.x - mousePointTo.x * newScale,
                y: pointer.y - mousePointTo.y * newScale,
            };
            stage.position(newPos);
            stage.batchDraw();
        });

        container.addEventListener("contextmenu", (e) => { e.preventDefault(); });

        // Stop cables UI from intercepting mouse events (bubble phase)
        // Leave a safety margin on the right edge so the tab resize handle still works
        const RESIZE_SAFETY_MARGIN = 32;
        ["mousedown", "mousemove", "mouseup", "pointerdown", "pointermove", "pointerup"].forEach((evtName) =>
        {
            container.addEventListener(evtName, (e) =>
            {
                const rect = container.getBoundingClientRect();
                if (e.clientX >= rect.right - RESIZE_SAFETY_MARGIN) return;
                e.stopPropagation();
            });
        });

        container.addEventListener("mouseleave", () =>
        {
            dragTarget = null;
            regionDragTarget = null;
            regionResizeTarget = null;
            canvasDrag = false;
            canvasDragStart = null;
            container.style.cursor = "default";
        });

        // Resize the Konva stage when the tab/container is resized
        const resizeObserver = new ResizeObserver(() =>
        {
            const newWidth = container.offsetWidth || 800;
            const newHeight = container.offsetHeight || 600;
            stage.width(newWidth);
            stage.height(newHeight);
            stage.batchDraw();
        });
        resizeObserver.observe(container);

        buildHelpOverlay(container);

        return { stage: stage, layer: layer, resizeObserver: resizeObserver };

        // ===================== Help overlay (quick controls reference) =====================

        // Collapsible cheat-sheet pinned to the top-left of the tab. Pure DOM,
        // sits above the canvas; clicks on it never reach the Konva stage.
        function buildHelpOverlay(host)
        {
            const SECTIONS = [
                ["States", [
                    ["Add", "double-click empty space"],
                    ["Move", "drag it"],
                    ["Rename", "double-click it"],
                    ["Set active", "Ctrl-click"],
                    ["Delete", "Alt-click (or middle-click)"],
                ]],
                ["Transitions", [
                    ["Create", "right-click a state, then click the target"],
                    ["Delay (frames)", "double-click the label"],
                    ["Force-run", "Ctrl-click the label"],
                    ["Delete", "Alt-click (or middle-click)"],
                ]],
                ["Regions", [
                    ["Create", "Alt-drag on empty space"],
                    ["Move", "drag its title"],
                    ["Resize", "drag its edge"],
                    ["Rename", "double-click it"],
                    ["Delete", "Alt-click"],
                ]],
                ["Canvas", [
                    ["Pan", "right-drag empty space"],
                    ["Zoom", "mouse wheel"],
                ]],
            ];

            host.style.position = "relative";

            const panel = document.createElement("div");
            panel.style.cssText = "position:absolute;top:12px;left:12px;z-index:500;"
                + "font-family:Arial,sans-serif;font-size:12px;color:#eaf7ff;"
                + "background:rgba(20,22,26,0.86);border:1px solid rgba(74,163,255,0.5);"
                + "border-radius:8px;user-select:none;max-width:300px;"
                + "box-shadow:0 4px 18px rgba(0,0,0,0.4);overflow:hidden;";

            const header = document.createElement("div");
            header.style.cssText = "display:flex;align-items:center;justify-content:space-between;"
                + "gap:12px;padding:7px 10px;cursor:pointer;";
            const title = document.createElement("span");
            title.textContent = "Controls";
            title.style.cssText = "font-weight:bold;letter-spacing:0.3px;color:#28e5ff;";
            const toggle = document.createElement("span");
            toggle.style.cssText = "opacity:0.75;font-size:11px;";
            header.appendChild(title);
            header.appendChild(toggle);

            const body = document.createElement("div");
            body.style.cssText = "padding:0 10px 9px;line-height:1.5;";

            SECTIONS.forEach(([sectionName, rows]) =>
            {
                const h = document.createElement("div");
                h.textContent = sectionName;
                h.style.cssText = "color:#7fd4ff;font-weight:bold;margin:8px 0 2px;";
                body.appendChild(h);

                rows.forEach(([action, how]) =>
                {
                    const row = document.createElement("div");
                    const key = document.createElement("b");
                    key.textContent = action;
                    const desc = document.createElement("span");
                    desc.textContent = " — " + how;
                    desc.style.cssText = "opacity:0.72;";
                    row.appendChild(key);
                    row.appendChild(desc);
                    body.appendChild(row);
                });
            });

            panel.appendChild(header);
            panel.appendChild(body);
            host.appendChild(panel);

            let open = false;
            const apply = () =>
            {
                body.style.display = open ? "block" : "none";
                toggle.textContent = open ? "hide ▾" : "show ▸";
            };
            header.addEventListener("click", () => { open = !open; apply(); });
            apply();

            // Keep interactions with the panel from reaching the canvas.
            ["mousedown", "mouseup", "click", "dblclick", "wheel", "contextmenu"].forEach((evt) =>
                panel.addEventListener(evt, (e) => { e.stopPropagation(); }));
        }
}
