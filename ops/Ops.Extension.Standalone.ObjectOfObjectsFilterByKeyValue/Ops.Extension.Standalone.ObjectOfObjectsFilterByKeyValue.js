/**
 * Ops.Extension.Standalone.ObjectOfObjectsFilterByKeyValue
 *
 * Filters an object of objects (dictionary of child objects, such as a
 * ClientRegistry `manifest.parameters` object) by checking whether a specified
 * nested property key in each child object matches one or more target values.
 */

const
    inObj = op.inObject("In Object"),
    inFilterKey = op.inString("Filter Key", "type"),
    inFilterValues = op.inString("Filter Values", "float,int,boolean"),
    inFilterValuesArr = op.inArray("Filter Values Array"),
    inMode = op.inValueSelect("Mode", ["Include Matching", "Exclude Matching"], "Include Matching"),
    inCaseSensitive = op.inBool("Case Sensitive", false),

    outFilteredObj = op.outObject("Filtered Object", {}),
    outFilteredKeys = op.outArray("Filtered Keys", []),
    outFilteredValues = op.outArray("Filtered Values", []),
    outCount = op.outNumber("Count", 0);

op.setPortGroup("Input & Filter Criteria", [
    inObj,
    inFilterKey,
    inFilterValues,
    inFilterValuesArr,
    inMode,
    inCaseSensitive
]);
op.setPortGroup("Filtered Results", [
    outFilteredObj,
    outFilteredKeys,
    outFilteredValues,
    outCount
]);

function getNestedValue(obj, pathStr)
{
    if (!obj || typeof obj !== "object" || !pathStr) return undefined;
    if (Object.prototype.hasOwnProperty.call(obj, pathStr))
    {
        return obj[pathStr];
    }

    const parts = pathStr.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length; i++)
    {
        if (cur === null || cur === undefined || typeof cur !== "object")
        {
            return undefined;
        }
        cur = cur[parts[i]];
    }
    return cur;
}

function getAllowedTokens(caseSensitive)
{
    const arrInput = inFilterValuesArr.get();
    if (Array.isArray(arrInput) && inFilterValuesArr.isLinked())
    {
        return arrInput
            .filter((v) => v !== null && v !== undefined)
            .map((v) =>
            {
                const s = String(v).trim();
                return caseSensitive ? s : s.toLowerCase();
            })
            .filter((s) => s.length > 0);
    }

    const rawStr = inFilterValues.get();
    if (typeof rawStr !== "string" || !rawStr.trim()) return [];

    return rawStr
        .split(",")
        .map((s) =>
        {
            const trimmed = s.trim();
            return caseSensitive ? trimmed : trimmed.toLowerCase();
        })
        .filter((s) => s.length > 0);
}

function updateFilter()
{
    const source = inObj.get();
    const filterKey = (inFilterKey.get() || "").trim();
    const mode = inMode.get() || "Include Matching";
    const caseSensitive = Boolean(inCaseSensitive.get());
    const includeMode = mode !== "Exclude Matching";

    if (!source || typeof source !== "object" || Array.isArray(source))
    {
        outFilteredObj.set({});
        outFilteredKeys.set([]);
        outFilteredValues.set([]);
        outCount.set(0);
        return;
    }

    const allowedTokens = getAllowedTokens(caseSensitive);
    const tokenSet = new Set(allowedTokens);

    const filteredObj = {};
    const filteredKeys = [];
    const filteredValues = [];

    const keys = Object.keys(source);
    for (let i = 0; i < keys.length; i++)
    {
        const topKey = keys[i];
        const childObj = source[topKey];

        if (!childObj || typeof childObj !== "object" || Array.isArray(childObj))
        {
            continue;
        }

        let isMatch = false;
        if (!filterKey)
        {
            isMatch = true;
        }
        else
        {
            const rawVal = getNestedValue(childObj, filterKey);
            if (rawVal !== undefined && rawVal !== null)
            {
                const normalizedVal = caseSensitive
                    ? String(rawVal).trim()
                    : String(rawVal).trim().toLowerCase();
                isMatch = tokenSet.has(normalizedVal);
            }
        }

        const shouldKeep = includeMode ? isMatch : !isMatch;
        if (shouldKeep)
        {
            filteredObj[topKey] = childObj;
            filteredKeys.push(topKey);
            filteredValues.push(childObj);
        }
    }

    outFilteredObj.set(filteredObj);
    outFilteredKeys.set(filteredKeys);
    outFilteredValues.set(filteredValues);
    outCount.set(filteredKeys.length);
}

inObj.onChange = updateFilter;
inFilterKey.onChange = updateFilter;
inFilterValues.onChange = updateFilter;
inFilterValuesArr.onChange = updateFilter;
inMode.onChange = updateFilter;
inCaseSensitive.onChange = updateFilter;

updateFilter();

