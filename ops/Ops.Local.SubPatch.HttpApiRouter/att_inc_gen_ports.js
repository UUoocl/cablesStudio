const port_7zx8tb75j=op.inTrigger("7zx8tb75j");
port_7zx8tb75j.setUiAttribs({title:"Execute",display:"button",});

const port_mz4vjy3lu=op.inObject("mz4vjy3lu");
port_mz4vjy3lu.setUiAttribs({title:"Response",});

const port_czh4oftwg=op.inString("czh4oftwg","/api/stt/result");
port_czh4oftwg.setUiAttribs({title:"String 0",});

const port_cgcgw3kyf=op.inTrigger("cgcgw3kyf");
port_cgcgw3kyf.setUiAttribs({title:"Trigger",display:"button",});

const port_t96yukjuq=op.inObject("t96yukjuq");
port_t96yukjuq.setUiAttribs({title:"Value",});

const port_r9guwazcz=op.inObject("r9guwazcz");
port_r9guwazcz.setUiAttribs({title:"Value",});

op.initInnerPorts=function(addedOps)
{
  for(let i=0;i<addedOps.length;i++)
  {
    if(addedOps[i].innerInput)
    {
const innerOut_7zx8tb75j = addedOps[i].outTrigger("innerOut_7zx8tb75j");
innerOut_7zx8tb75j.setUiAttribs({title:"Execute"});
port_7zx8tb75j.onTriggered = () => { innerOut_7zx8tb75j.trigger(); };

const innerOut_mz4vjy3lu = addedOps[i].outObject("innerOut_mz4vjy3lu");
innerOut_mz4vjy3lu.setUiAttribs({title:"Response"});
port_mz4vjy3lu.on("change", (a,v) => { innerOut_mz4vjy3lu.setRef(a); });

const innerOut_czh4oftwg = addedOps[i].outString("innerOut_czh4oftwg");
innerOut_czh4oftwg.set(port_czh4oftwg.get() );
innerOut_czh4oftwg.setUiAttribs({title:"String 0"});
port_czh4oftwg.on("change", (a,v) => { innerOut_czh4oftwg.set(a); });

const innerOut_cgcgw3kyf = addedOps[i].outTrigger("innerOut_cgcgw3kyf");
innerOut_cgcgw3kyf.setUiAttribs({title:"Trigger"});
port_cgcgw3kyf.onTriggered = () => { innerOut_cgcgw3kyf.trigger(); };

const innerOut_t96yukjuq = addedOps[i].outObject("innerOut_t96yukjuq");
innerOut_t96yukjuq.setUiAttribs({title:"Value"});
port_t96yukjuq.on("change", (a,v) => { innerOut_t96yukjuq.setRef(a); });

const innerOut_r9guwazcz = addedOps[i].outObject("innerOut_r9guwazcz");
innerOut_r9guwazcz.setUiAttribs({title:"Value"});
port_r9guwazcz.on("change", (a,v) => { innerOut_r9guwazcz.setRef(a); });

    }
if(addedOps[i].innerOutput)
{
}
}
};
