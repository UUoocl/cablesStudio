
const port_x241kwb0g = op.inObject("x241kwb0g");
port_x241kwb0g.setUiAttribs({ title: "Object", });

const port_byr2xk3rv = op.inTrigger("byr2xk3rv");
port_byr2xk3rv.setUiAttribs({ title: "Trigger", display: "button", });

const port_wv4ht3vp3 = op.outString("wv4ht3vp3");
port_wv4ht3vp3.setUiAttribs({ title: "String", });

const port_qddih6cp8 = op.outObject("qddih6cp8");
port_qddih6cp8.setUiAttribs({ title: "Result", });

const port_37wl9a84v = op.outTrigger("37wl9a84v");
port_37wl9a84v.setUiAttribs({ title: "Next", });

op.initInnerPorts = function (addedOps) {
  for (let i = 0; i < addedOps.length; i++) {
    if (addedOps[i].innerInput) {
      const innerOut_x241kwb0g = addedOps[i].outObject("innerOut_x241kwb0g");
      innerOut_x241kwb0g.setUiAttribs({ title: "Object" });
      port_x241kwb0g.on("change", (a, v) => { innerOut_x241kwb0g.setRef(a); });

      const innerOut_byr2xk3rv = addedOps[i].outTrigger("innerOut_byr2xk3rv");
      innerOut_byr2xk3rv.setUiAttribs({ title: "Trigger" });
      port_byr2xk3rv.onTriggered = () => { innerOut_byr2xk3rv.trigger(); };

    }
    if (addedOps[i].innerOutput) {
      const innerIn_wv4ht3vp3 = addedOps[i].inString("innerIn_wv4ht3vp3");
      innerIn_wv4ht3vp3.setUiAttribs({ title: "String" });
      innerIn_wv4ht3vp3.on("change", (a, v) => { port_wv4ht3vp3.set(a); });

      const innerIn_qddih6cp8 = addedOps[i].inObject("innerIn_qddih6cp8");
      innerIn_qddih6cp8.setUiAttribs({ title: "Result" });
      innerIn_qddih6cp8.on("change", (a, v) => { port_qddih6cp8.setRef(a); });

      const innerIn_37wl9a84v = addedOps[i].inTrigger("innerIn_37wl9a84v");
      innerIn_37wl9a84v.setUiAttribs({ title: "Next" });
      innerIn_37wl9a84v.onTriggered = () => { port_37wl9a84v.trigger(); };

    }
  }
};
