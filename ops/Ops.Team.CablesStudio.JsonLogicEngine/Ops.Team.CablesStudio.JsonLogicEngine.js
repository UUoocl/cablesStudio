// Op Ports
const
    inTrigger = op.inTrigger("Evaluate"),
    inFacts = op.inObject("Input Facts"),
    inRules = op.inObject("Rule JSON"),

    outMatch = op.outTrigger("Matched"),
    outResult = op.outObject("Result Payload"),
    outNoMatch = op.outTrigger("Not Matched"),
    outIsMatch = op.outBool("Is Matched", false);

// Resolves the cables.gl imported module named "JsonLogicEngine"
const LogicEngine = typeof JsonLogicEngine !== "undefined" ? (JsonLogicEngine.LogicEngine || JsonLogicEngine) : null;
const engine = LogicEngine ? new LogicEngine() : null;

if (!engine) {
    op.setUiError("lib_missing", "Imported module 'JsonLogicEngine' not found. Please add the JS Module dependency named 'JsonLogicEngine'.");
}

let compiledRule = null;

// Compile rule ONLY when the JSON input changes
inRules.onChange = () => {
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

    if (typeof ruleData === "string") {
        try {
            ruleData = JSON.parse(ruleData.trim());
        } catch (err) {
            op.setUiError("rule_compile", "Rule JSON syntax error: " + (err.message || err));
            compiledRule = null;
            return;
        }
    }

    try {
        // engine.build() produces an optimized native JS function
        compiledRule = engine.build(ruleData);
        op.setUiError("rule_compile", null);
    } catch (err) {
        op.logError("[JsonLogicEngine] Compilation failed:", err);
        op.setUiError("rule_compile", "Compilation failed: " + (err.message || JSON.stringify(err) || err));
        compiledRule = null;
    }
};

inTrigger.onTriggered = () => {
    if (!compiledRule) return;

    let facts = inFacts.get();
    if (facts === undefined || facts === null) return;

    if (typeof facts === "string") {
        try {
            facts = JSON.parse(facts.trim());
        } catch (e) {}
    }

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
};

// Initial compile
inRules.onChange();
