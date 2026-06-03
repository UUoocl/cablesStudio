const port_2vhblem9m=op.inTrigger("2vhblem9m");
port_2vhblem9m.setUiAttribs({title:"On WS Message",});

const port_17tmc9dky=op.inString("17tmc9dky","mouseEvents");
port_17tmc9dky.setUiAttribs({title:"WS Message Channel",});

const port_g7p4r0m7k=op.inObject("g7p4r0m7k");
port_g7p4r0m7k.setUiAttribs({title:"WS Message Data",});

op.initInnerPorts=function(addedOps)
{
  for(let i=0;i<addedOps.length;i++)
  {
    if(addedOps[i].innerInput)
    {
const innerOut_2vhblem9m = addedOps[i].outTrigger("innerOut_2vhblem9m");
innerOut_2vhblem9m.setUiAttribs({title:"On WS Message"});
port_2vhblem9m.onTriggered = () => { innerOut_2vhblem9m.trigger(); };

const innerOut_17tmc9dky = addedOps[i].outString("innerOut_17tmc9dky");
innerOut_17tmc9dky.set(port_17tmc9dky.get() );
innerOut_17tmc9dky.setUiAttribs({title:"WS Message Channel"});
port_17tmc9dky.on("change", (a,v) => { innerOut_17tmc9dky.set(a); });

const innerOut_g7p4r0m7k = addedOps[i].outObject("innerOut_g7p4r0m7k");
innerOut_g7p4r0m7k.setUiAttribs({title:"WS Message Data"});
port_g7p4r0m7k.on("change", (a,v) => { innerOut_g7p4r0m7k.setRef(a); });

    }
if(addedOps[i].innerOutput)
{
}
}
};
