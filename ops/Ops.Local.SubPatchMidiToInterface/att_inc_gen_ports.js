const port_9ct2eefiy=op.inString("9ct2eefiy","{}");
port_9ct2eefiy.setUiAttribs({title:"JSON String",display:"editor",});

const port_lkmmkuzbf=op.outObject("lkmmkuzbf");
port_lkmmkuzbf.setUiAttribs({title:"Result",});

op.initInnerPorts=function(addedOps)
{
  for(let i=0;i<addedOps.length;i++)
  {
    if(addedOps[i].innerInput)
    {
const innerOut_9ct2eefiy = addedOps[i].outString("innerOut_9ct2eefiy");
innerOut_9ct2eefiy.set(port_9ct2eefiy.get() );
innerOut_9ct2eefiy.setUiAttribs({title:"JSON String"});
port_9ct2eefiy.on("change", (a,v) => { innerOut_9ct2eefiy.set(a); });

    }
if(addedOps[i].innerOutput)
{
const innerIn_lkmmkuzbf = addedOps[i].inObject("innerIn_lkmmkuzbf");
innerIn_lkmmkuzbf.setUiAttribs({title:"Result"});
innerIn_lkmmkuzbf.on("change", (a,v) => { port_lkmmkuzbf.setRef(a); });

}
}
};
