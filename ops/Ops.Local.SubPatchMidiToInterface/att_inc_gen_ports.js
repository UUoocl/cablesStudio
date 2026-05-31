const port_9ct2eefiy=op.inString("9ct2eefiy","{}");
port_9ct2eefiy.setUiAttribs({title:"JSON String",display:"editor",});

const port_ur1wxkxb8=op.inObject("ur1wxkxb8");
port_ur1wxkxb8.setUiAttribs({title:"Event",});

const port_lkmmkuzbf=op.outObject("lkmmkuzbf");
port_lkmmkuzbf.setUiAttribs({title:"Result",});

const port_ol6752epc=op.outObject("ol6752epc");
port_ol6752epc.setUiAttribs({title:"Event",});

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

const innerOut_ur1wxkxb8 = addedOps[i].outObject("innerOut_ur1wxkxb8");
innerOut_ur1wxkxb8.setUiAttribs({title:"Event"});
port_ur1wxkxb8.on("change", (a,v) => { innerOut_ur1wxkxb8.setRef(a); });

    }
if(addedOps[i].innerOutput)
{
const innerIn_lkmmkuzbf = addedOps[i].inObject("innerIn_lkmmkuzbf");
innerIn_lkmmkuzbf.setUiAttribs({title:"Result"});
innerIn_lkmmkuzbf.on("change", (a,v) => { port_lkmmkuzbf.setRef(a); });

const innerIn_ol6752epc = addedOps[i].inObject("innerIn_ol6752epc");
innerIn_ol6752epc.setUiAttribs({title:"Event"});
innerIn_ol6752epc.on("change", (a,v) => { port_ol6752epc.setRef(a); });

}
}
};
