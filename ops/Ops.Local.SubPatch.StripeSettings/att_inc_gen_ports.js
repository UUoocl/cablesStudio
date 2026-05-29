
//const port_iqviznm3z=op.inString("iqviznm3z","{\n"40":"ribbonCount"\n\n}");
//port_iqviznm3z.setUiAttribs({ title: "JSON String", display: "editor", });

const port_coe42k77c = op.outObject("coe42k77c");
port_coe42k77c.setUiAttribs({ title: "Result", });

op.initInnerPorts = function (addedOps) {
  for (let i = 0; i < addedOps.length; i++) {
    if (addedOps[i].innerInput) {
      const innerOut_iqviznm3z = addedOps[i].outString("innerOut_iqviznm3z");
      innerOut_iqviznm3z.set(port_iqviznm3z.get());
      innerOut_iqviznm3z.setUiAttribs({ title: "JSON String" });
      port_iqviznm3z.on("change", (a, v) => { innerOut_iqviznm3z.set(a); });

    }
    if (addedOps[i].innerOutput) {
      const innerIn_coe42k77c = addedOps[i].inObject("innerIn_coe42k77c");
      innerIn_coe42k77c.setUiAttribs({ title: "Result" });
      innerIn_coe42k77c.on("change", (a, v) => { port_coe42k77c.setRef(a); });

    }
  }
};
