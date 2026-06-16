const port_gadwiczy9=op.inObject("gadwiczy9");
port_gadwiczy9.setUiAttribs({title:"obsConnection",objType:"obsConnection"});

const port_kgwmapwhz=op.inString("kgwmapwhz","hi");
port_kgwmapwhz.setUiAttribs({title:"text",});
port_kgwmapwhz.setUiAttribs({"values":[""]});

const port_kgwmapwha=op.inString("kgwmapwha","hello");
port_kgwmapwha.setUiAttribs({title:"text2",});
port_kgwmapwha.setUiAttribs({"values":[""]});

op.initInnerPorts=function(addedOps)
{
  for(let i=0;i<addedOps.length;i++)
  {
    if(addedOps[i].innerInput)
    {
const innerOut_gadwiczy9 = addedOps[i].outObject("innerOut_gadwiczy9");
innerOut_gadwiczy9.setUiAttribs({title:"obsConnection"});
port_gadwiczy9.on("change", (a,v) => { innerOut_gadwiczy9.setRef(a); });

const innerOut_kgwmapwhz = addedOps[i].outString("innerOut_kgwmapwhz");
innerOut_kgwmapwhz.set(port_kgwmapwhz.get() );
innerOut_kgwmapwhz.setUiAttribs({title:"text"});
port_kgwmapwhz.on("change", (a,v) => { innerOut_kgwmapwhz.set(a); });

const innerOut_kgwmapwha = addedOps[i].outString("innerOut_kgwmapwha");
innerOut_kgwmapwha.set(port_kgwmapwha.get() );
innerOut_kgwmapwha.setUiAttribs({title:"text2"});
port_kgwmapwha.on("change", (a,v) => { innerOut_kgwmapwha.set(a); });

    }
if(addedOps[i].innerOutput)
{
}
}
};
