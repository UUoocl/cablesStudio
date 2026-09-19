let LogicEngine = null;

try {
    const pkg = (typeof op.require === "function")
        ? op.require("json-logic-engine")
        : ((typeof require !== "undefined") ? require("json-logic-engine") : null);

    LogicEngine = pkg?.LogicEngine || pkg?.default?.LogicEngine || pkg;
} catch (err) {
    op.setUiError("lib_missing", "Could not load json-logic-engine: " + (err?.message || err));
}

// Op Ports
const
    inTrigger = op.inTrigger("Evaluate"),
    inFacts = op.inObject("Input Facts"),
    inRules = op.inObject("Rule JSON"),

    outMatch = op.outTrigger("Matched"),
    outResult = op.outObject("Result Payload"),
    outNoMatch = op.outTrigger("Not Matched"),
    outIsMatch = op.outBool("Is Matched", false);

let engine = null;
if (LogicEngine) {
    try {
        engine = new LogicEngine();
    } catch (err) {
        op.logError("Failed to initialize LogicEngine:", err);
        op.setUiError("engine_init", "Failed to initialize LogicEngine: " + (err?.message || err));
    }
}

let compiledRule = null;

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
        op.logError("JsonLogicEngine compilation failed:", err);
        op.setUiError("rule_compile", "Rule compilation failed: " + errMsg);
        compiledRule = null;
    }
}

// Compile rule ONLY when the JSON input changes
inRules.onChange = compileRule;

inTrigger.onTriggered = () => {
    if (!compiledRule) return;

    let facts = inFacts.get();
    if (facts === undefined || facts === null) return;

    // Support JSON strings as facts input as well
    if (typeof facts === "string") {
        const trimmed = facts.trim();
        if (trimmed && (trimmed.startsWith("{") || trimmed.startsWith("["))) {
            try {
                facts = JSON.parse(trimmed);
            } catch (e) {
                // Keep facts as string if not valid JSON
            }
        }
    }

    try {
        // Synchronous, near-instant evaluation
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
        op.logError("JsonLogicEngine evaluation failed:", err);
    }
};

// Initial compilation in case rule is pre-configured or restored from patch
compileRule();
