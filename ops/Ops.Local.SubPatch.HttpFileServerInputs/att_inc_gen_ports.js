const port_lwl5v2d6d=op.outTrigger("lwl5v2d6d");
port_lwl5v2d6d.setUiAttribs({title:"Triggered",});

const port_ityt6yfh1=op.outString("ityt6yfh1");
port_ityt6yfh1.setUiAttribs({title:"Value",});

const port_b19mk5ioa=op.outObject("b19mk5ioa");
port_b19mk5ioa.setUiAttribs({title:"Value",});

const port_asukhwvr7=op.outString("asukhwvr7");
port_asukhwvr7.setUiAttribs({title:"Value",});

const port_06etkpjjh=op.outNumber("06etkpjjh");
port_06etkpjjh.setUiAttribs({title:"Value",});

const port_szj6wo9ax=op.outString("szj6wo9ax");
port_szj6wo9ax.setUiAttribs({title:"Value",});

const port_k8qcjk6qb=op.outObject("k8qcjk6qb");
port_k8qcjk6qb.setUiAttribs({title:"Value",});

const port_dvem0uete=op.outTrigger("dvem0uete");
port_dvem0uete.setUiAttribs({title:"Triggered",});

op.initInnerPorts=function(addedOps)
{
  for(let i=0;i<addedOps.length;i++)
  {
    if(addedOps[i].innerInput)
    {
    }
if(addedOps[i].innerOutput)
{
const innerIn_lwl5v2d6d = addedOps[i].inTrigger("innerIn_lwl5v2d6d");
innerIn_lwl5v2d6d.setUiAttribs({title:"Triggered"});
innerIn_lwl5v2d6d.onTriggered = () => { port_lwl5v2d6d.trigger(); };

const innerIn_ityt6yfh1 = addedOps[i].inString("innerIn_ityt6yfh1");
innerIn_ityt6yfh1.setUiAttribs({title:"Value"});
innerIn_ityt6yfh1.on("change", (a,v) => { port_ityt6yfh1.set(a); });

const innerIn_b19mk5ioa = addedOps[i].inObject("innerIn_b19mk5ioa");
innerIn_b19mk5ioa.setUiAttribs({title:"Value"});
innerIn_b19mk5ioa.on("change", (a,v) => { port_b19mk5ioa.setRef(a); });

const innerIn_asukhwvr7 = addedOps[i].inString("innerIn_asukhwvr7");
innerIn_asukhwvr7.setUiAttribs({title:"Value"});
innerIn_asukhwvr7.on("change", (a,v) => { port_asukhwvr7.set(a); });

const innerIn_06etkpjjh = addedOps[i].inFloat("innerIn_06etkpjjh");
innerIn_06etkpjjh.setUiAttribs({title:"Value"});
innerIn_06etkpjjh.on("change", (a,v) => { port_06etkpjjh.set(a); });

const innerIn_szj6wo9ax = addedOps[i].inString("innerIn_szj6wo9ax");
innerIn_szj6wo9ax.setUiAttribs({title:"Value"});
innerIn_szj6wo9ax.on("change", (a,v) => { port_szj6wo9ax.set(a); });

const innerIn_k8qcjk6qb = addedOps[i].inObject("innerIn_k8qcjk6qb");
innerIn_k8qcjk6qb.setUiAttribs({title:"Value"});
innerIn_k8qcjk6qb.on("change", (a,v) => { port_k8qcjk6qb.setRef(a); });

const innerIn_dvem0uete = addedOps[i].inTrigger("innerIn_dvem0uete");
innerIn_dvem0uete.setUiAttribs({title:"Triggered"});
innerIn_dvem0uete.onTriggered = () => { port_dvem0uete.trigger(); };

}
}
};
