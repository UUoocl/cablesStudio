window.addEventListener("load", () => {
	// 1. Initialize p5 in instance mode if window.sketchFunction is defined
	let p5Instance = null;
	if (typeof window.sketchFunction === "function") {
		p5Instance = new p5((p) => {
			window.sketchFunction(p);
		});
		window.p5Instance = p5Instance;
	}

	// 2. Set up BroadcastChannel listener for MediaPipe Pose data
	const channel = new BroadcastChannel("cables_iframe_channel");
	channel.onmessage = (e) => {
		if (e.data) {
			// Support direct "SET_VAR" messages for cablesData
			if (e.data.type === "SET_VAR" && e.data.key === "cablesData") {
				if (p5Instance && typeof p5Instance.onDataChange === "function") {
					p5Instance.onDataChange(e.data.value);
				}
			}
			// Support batch variable updates under "SET_VARS"
			else if (e.data.type === "SET_VARS") {
				const vars = e.data.vars || {};
				if (vars.cablesData !== undefined && p5Instance && typeof p5Instance.onDataChange === "function") {
					p5Instance.onDataChange(vars.cablesData);
				}
			}
		}
	};
});
