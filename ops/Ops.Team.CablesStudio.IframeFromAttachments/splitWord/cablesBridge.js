window.addEventListener("load", () => {
	// Listen for BroadcastChannel messages from Cables.gl
	const channel = new BroadcastChannel("cables_iframe_channel");
	channel.onmessage = (e) => {
		if (e.data && (e.data.type === "SET_VAR" || e.data.type === "SET_VARS")) {
			var varsToSet = e.data.vars || {};
			if (e.data.key !== undefined) {
				varsToSet[e.data.key] = e.data.value;
			}
			
			var changed = false;
			if (varsToSet.message !== undefined) {
				window.message = String(varsToSet.message);
				if (window.input) window.input.value(window.message);
				changed = true;
			}
			if (varsToSet.fontSize !== undefined) {
				window.fontSize = parseFloat(varsToSet.fontSize);
				if (window.sliderFontSize) window.sliderFontSize.value(window.fontSize);
				changed = true;
			}
			if (varsToSet.rangeX !== undefined) {
				window.rangeX = parseFloat(varsToSet.rangeX);
				if (window.sliderRangeX) window.sliderRangeX.value(window.rangeX);
				changed = true;
			}
			if (varsToSet.rangeY !== undefined) {
				window.rangeY = parseFloat(varsToSet.rangeY);
				if (window.sliderRangeY) window.sliderRangeY.value(window.rangeY);
				changed = true;
			}
			if (varsToSet.lineMultiplication !== undefined) {
				window.lineMultiplication = parseInt(varsToSet.lineMultiplication);
				if (window.sliderLineMultiplication) window.sliderLineMultiplication.value(window.lineMultiplication);
				changed = true;
			}
			if (varsToSet.lineOpacity !== undefined) {
				window.lineOpacity = parseFloat(varsToSet.lineOpacity);
				if (window.sliderLineOpacity) window.sliderLineOpacity.value(window.lineOpacity);
				changed = true;
			}
			if (varsToSet.lineWidth !== undefined) {
				window.lineWidth = parseFloat(varsToSet.lineWidth);
				if (window.sliderLineWidth) window.sliderLineWidth.value(window.lineWidth);
				changed = true;
			}
			if (varsToSet.randomness !== undefined) {
				window.randomness = parseFloat(varsToSet.randomness);
				if (window.slideRandomness) window.slideRandomness.value(window.randomness);
				changed = true;
			}
			if (varsToSet.crop !== undefined) {
				window.crop = parseFloat(varsToSet.crop);
				if (window.sliderCrop) window.sliderCrop.value(window.crop);
				changed = true;
			}
			if (varsToSet.messageMouseX !== undefined) {
				window.messageMouseX = parseFloat(varsToSet.messageMouseX);
			}
			if (varsToSet.messageMouseY !== undefined) {
				window.messageMouseY = parseFloat(varsToSet.messageMouseY);
			}
			
			if (changed && typeof window.onMessageChange === "function") {
				window.onMessageChange();
			}
		}
	};
});
