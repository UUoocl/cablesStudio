const port_i06o79ryu=op.inObject("i06o79ryu");
port_i06o79ryu.setUiAttribs({title:"Object",});

const port_2frxqik1p=op.inTrigger("2frxqik1p");
port_2frxqik1p.setUiAttribs({title:"Trigger",display:"button",});

const port_9ivl0fp48=op.outObject("9ivl0fp48");
port_9ivl0fp48.setUiAttribs({title:"Result",});

const port_2keme731f=op.outTrigger("2keme731f");
port_2keme731f.setUiAttribs({title:"Next",});

op.initInnerPorts=function(addedOps)
{
  for(let i=0;i<addedOps.length;i++)
  {
    if(addedOps[i].innerInput)
    {
const innerOut_i06o79ryu = addedOps[i].outObject("innerOut_i06o79ryu");
innerOut_i06o79ryu.setUiAttribs({title:"Object"});
port_i06o79ryu.on("change", (a,v) => { innerOut_i06o79ryu.setRef(a); });

const innerOut_2frxqik1p = addedOps[i].outTrigger("innerOut_2frxqik1p");
innerOut_2frxqik1p.setUiAttribs({title:"Trigger"});
port_2frxqik1p.onTriggered = () => { innerOut_2frxqik1p.trigger(); };

    }
if(addedOps[i].innerOutput)
{
const innerIn_9ivl0fp48 = addedOps[i].inObject("innerIn_9ivl0fp48");
innerIn_9ivl0fp48.setUiAttribs({title:"Result"});
innerIn_9ivl0fp48.on("change", (a,v) => { port_9ivl0fp48.setRef(a); });

const innerIn_2keme731f = addedOps[i].inTrigger("innerIn_2keme731f");
innerIn_2keme731f.setUiAttribs({title:"Next"});
innerIn_2keme731f.onTriggered = () => { port_2keme731f.trigger(); };

}
}
};
