// Ops.Team.CablesStudio.JsonLogicEngine
// High-performance JSON Logic evaluation op for cables.gl website environment
// Uses CDN JS Module import: https://cables.gl/docs/5_writing_ops/dev_libraries/dev_libraries

const CDN_MODULE_URL = "https://cdn.jsdelivr.net/npm/json-logic-engine@5.0.7/+esm";

// Op Ports
const
    inTrigger = op.inTrigger("Evaluate"),
    inFacts = op.inObject("Input Facts"),
    inRules = op.inObject("Rule JSON"),

    outMatch = op.outTrigger("Matched"),
    outResult = op.outObject("Result Payload"),
    outNoMatch = op.outTrigger("Not Matched"),
    outIsMatch = op.outBool("Is Matched", false),
    outReady = op.outBool("Ready", false);

let LogicEngineClass = null;
let engine = null;
let compiledRule = null;
let isLoading = false;

// Resolve LogicEngine constructor if injected by cables JS Module dependency or already in scope
function getInjectedEngine() {
    if (typeof LogicEngine !== "undefined" && LogicEngine) {
        return LogicEngine.LogicEngine || LogicEngine;
    }
    if (typeof jsonLogicEngine !== "undefined" && jsonLogicEngine) {
        return jsonLogicEngine.LogicEngine || jsonLogicEngine;
    }
    if (typeof window !== "undefined") {
        if (window.LogicEngine) return window.LogicEngine;
        if (window.jsonLogicEngine && window.jsonLogicEngine.LogicEngine) return window.jsonLogicEngine.LogicEngine;
    }
    return null;
}

function onEngineReady(EngineConstructor) {
    LogicEngineClass = EngineConstructor;
    try {
        engine = new LogicEngineClass();
        outReady.set(true);
        op.setUiError("lib_missing", null);
        compileRule();
    } catch (err) {
        op.logError("[JsonLogicEngine] Failed to instantiate LogicEngine:", err);
        op.setUiError("engine_init", "Initialization error: " + (err?.message || err));
    }
}

async function initEngine() {
    // Check if injected by cables as a 'JS Module' dependency
    const injected = getInjectedEngine();
    if (injected) {
        onEngineReady(injected);
        return;
    }

    if (isLoading) return;
    isLoading = true;

    try {
        // Dynamic ESM import from CDN URL
        const mod = await import(CDN_MODULE_URL);
        const resolved = mod.LogicEngine || (mod.default && mod.default.LogicEngine) || mod;
        if (resolved) {
            onEngineReady(resolved);
            isLoading = false;
            return;
        }
        throw new Error("LogicEngine class not exported by module");
    } catch (err) {
        isLoading = false;
        op.logError("[JsonLogicEngine] Failed to import module from CDN:", err);
        op.setUiError("lib_missing", "Failed to load json-logic-engine from CDN: " + (err?.message || err));
    }
}

function compileRule() {
    if (!engine) {
        compiledRule = null;
        return;
    }

    let ruleData = inRules.get();
    if (!ruleData) {
        compiledRule = null;
        op.setUiError("rule_compile", null);
        return;
    }

    // Support both parsed objects and JSON string inputs
    if (typeof ruleData === "string") {
        const trimmed = ruleData.trim();
        if (!trimmed) {
            compiledRule = null;
            op.setUiError("rule_compile", null);
            return;
        }
        try {
            ruleData = JSON.parse(trimmed);
        } catch (err) {
            const msg = err?.message || String(err);
            op.setUiError("rule_compile", "Rule JSON syntax error: " + msg);
            compiledRule = null;
            return;
        }
    }

    try {
        // engine.build() produces an optimized native JS function
        compiledRule = engine.build(ruleData);
        op.setUiError("rule_compile", null);
    } catch (err) {
        const errMsg = err?.message || (typeof err === "object" ? JSON.stringify(err) : String(err));
        op.logError("[JsonLogicEngine] Compilation failed:", err);
        op.setUiError("rule_compile", "Rule compilation failed: " + errMsg);
        compiledRule = null;
    }
}

// Recompile rule ONLY when Rule JSON input changes
inRules.onChange = compileRule;

inTrigger.onTriggered = () => {
    if (!compiledRule) return;

    let facts = inFacts.get();
    if (facts === undefined || facts === null) return;

    // Support JSON strings as facts input
    if (typeof facts === "string") {
        const trimmed = facts.trim();
        if (trimmed && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
            try {
                facts = JSON.parse(trimmed);
            } catch (e) {}
        }
    }

    try {
        // Synchronous, near-instant evaluation via precompiled native function
        const result = compiledRule(facts);

        outResult.set(result);

        if (result) {
            outIsMatch.set(true);
            outMatch.trigger();
        } else {
            outIsMatch.set(false);
            outNoMatch.trigger();
        }
    } catch (err) {
        op.logError("[JsonLogicEngine] Evaluation failed:", err);
    }
};

// Start initialization from CDN
initEngine();
