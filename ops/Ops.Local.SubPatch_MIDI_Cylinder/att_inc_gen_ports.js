const port_8t5n3wjjc=op.inObject("8t5n3wjjc");
port_8t5n3wjjc.setUiAttribs({title:"Event",});

const port_k34eraw82=op.outNumber("k34eraw82");
port_k34eraw82.setUiAttribs({title:"result",});

const port_koari3xf1=op.outNumber("koari3xf1");
port_koari3xf1.setUiAttribs({title:"CC Value Out",});

const port_1jcvc372y=op.outNumber("1jcvc372y");
port_1jcvc372y.setUiAttribs({title:"CC Value Out",});

const port_2ia02g9u6=op.outNumber("2ia02g9u6");
port_2ia02g9u6.setUiAttribs({title:"CC Value Out",});

const port_3ozvem006=op.outNumber("3ozvem006");
port_3ozvem006.setUiAttribs({title:"result",});

const port_9souzynhe=op.outNumber("9souzynhe");
port_9souzynhe.setUiAttribs({title:"result",});

const port_qsj6v0hdq=op.outNumber("qsj6v0hdq");
port_qsj6v0hdq.setUiAttribs({title:"CC Value Out",});

const port_irfulx4rp=op.outNumber("irfulx4rp");
port_irfulx4rp.setUiAttribs({title:"CC Value Out",});

const port_oj1yi38md=op.outNumber("oj1yi38md");
port_oj1yi38md.setUiAttribs({title:"CC Value Out",});

const port_g8xzp5kw1=op.outNumber("g8xzp5kw1");
port_g8xzp5kw1.setUiAttribs({title:"CC Value Out",});

const port_0xe9zkqvy=op.outNumber("0xe9zkqvy");
port_0xe9zkqvy.setUiAttribs({title:"CC Value Out",});

const port_zryz68zkm=op.outNumber("zryz68zkm");
port_zryz68zkm.setUiAttribs({title:"CC Value Out",});

const port_6j1rjmzp3=op.outNumber("6j1rjmzp3");
port_6j1rjmzp3.setUiAttribs({title:"CC Value Out",});

const port_wpyb3aqjm=op.outNumber("wpyb3aqjm");
port_wpyb3aqjm.setUiAttribs({title:"CC Value Out",});

const port_hwbhyqjtg=op.outNumber("hwbhyqjtg");
port_hwbhyqjtg.setUiAttribs({title:"CC Value Out",});

const port_fdvwts4bo=op.outNumber("fdvwts4bo");
port_fdvwts4bo.setUiAttribs({title:"CC Value Out",});

op.initInnerPorts=function(addedOps)
{
  for(let i=0;i<addedOps.length;i++)
  {
    if(addedOps[i].innerInput)
    {
const innerOut_8t5n3wjjc = addedOps[i].outObject("innerOut_8t5n3wjjc");
innerOut_8t5n3wjjc.setUiAttribs({title:"Event"});
port_8t5n3wjjc.on("change", (a,v) => { innerOut_8t5n3wjjc.setRef(a); });

    }
if(addedOps[i].innerOutput)
{
const innerIn_k34eraw82 = addedOps[i].inFloat("innerIn_k34eraw82");
innerIn_k34eraw82.setUiAttribs({title:"result"});
innerIn_k34eraw82.on("change", (a,v) => { port_k34eraw82.set(a); });

const innerIn_koari3xf1 = addedOps[i].inFloat("innerIn_koari3xf1");
innerIn_koari3xf1.setUiAttribs({title:"CC Value Out"});
innerIn_koari3xf1.on("change", (a,v) => { port_koari3xf1.set(a); });

const innerIn_1jcvc372y = addedOps[i].inFloat("innerIn_1jcvc372y");
innerIn_1jcvc372y.setUiAttribs({title:"CC Value Out"});
innerIn_1jcvc372y.on("change", (a,v) => { port_1jcvc372y.set(a); });

const innerIn_2ia02g9u6 = addedOps[i].inFloat("innerIn_2ia02g9u6");
innerIn_2ia02g9u6.setUiAttribs({title:"CC Value Out"});
innerIn_2ia02g9u6.on("change", (a,v) => { port_2ia02g9u6.set(a); });

const innerIn_3ozvem006 = addedOps[i].inFloat("innerIn_3ozvem006");
innerIn_3ozvem006.setUiAttribs({title:"result"});
innerIn_3ozvem006.on("change", (a,v) => { port_3ozvem006.set(a); });

const innerIn_9souzynhe = addedOps[i].inFloat("innerIn_9souzynhe");
innerIn_9souzynhe.setUiAttribs({title:"result"});
innerIn_9souzynhe.on("change", (a,v) => { port_9souzynhe.set(a); });

const innerIn_qsj6v0hdq = addedOps[i].inFloat("innerIn_qsj6v0hdq");
innerIn_qsj6v0hdq.setUiAttribs({title:"CC Value Out"});
innerIn_qsj6v0hdq.on("change", (a,v) => { port_qsj6v0hdq.set(a); });

const innerIn_irfulx4rp = addedOps[i].inFloat("innerIn_irfulx4rp");
innerIn_irfulx4rp.setUiAttribs({title:"CC Value Out"});
innerIn_irfulx4rp.on("change", (a,v) => { port_irfulx4rp.set(a); });

const innerIn_oj1yi38md = addedOps[i].inFloat("innerIn_oj1yi38md");
innerIn_oj1yi38md.setUiAttribs({title:"CC Value Out"});
innerIn_oj1yi38md.on("change", (a,v) => { port_oj1yi38md.set(a); });

const innerIn_g8xzp5kw1 = addedOps[i].inFloat("innerIn_g8xzp5kw1");
innerIn_g8xzp5kw1.setUiAttribs({title:"CC Value Out"});
innerIn_g8xzp5kw1.on("change", (a,v) => { port_g8xzp5kw1.set(a); });

const innerIn_0xe9zkqvy = addedOps[i].inFloat("innerIn_0xe9zkqvy");
innerIn_0xe9zkqvy.setUiAttribs({title:"CC Value Out"});
innerIn_0xe9zkqvy.on("change", (a,v) => { port_0xe9zkqvy.set(a); });

const innerIn_zryz68zkm = addedOps[i].inFloat("innerIn_zryz68zkm");
innerIn_zryz68zkm.setUiAttribs({title:"CC Value Out"});
innerIn_zryz68zkm.on("change", (a,v) => { port_zryz68zkm.set(a); });

const innerIn_6j1rjmzp3 = addedOps[i].inFloat("innerIn_6j1rjmzp3");
innerIn_6j1rjmzp3.setUiAttribs({title:"CC Value Out"});
innerIn_6j1rjmzp3.on("change", (a,v) => { port_6j1rjmzp3.set(a); });

const innerIn_wpyb3aqjm = addedOps[i].inFloat("innerIn_wpyb3aqjm");
innerIn_wpyb3aqjm.setUiAttribs({title:"CC Value Out"});
innerIn_wpyb3aqjm.on("change", (a,v) => { port_wpyb3aqjm.set(a); });

const innerIn_hwbhyqjtg = addedOps[i].inFloat("innerIn_hwbhyqjtg");
innerIn_hwbhyqjtg.setUiAttribs({title:"CC Value Out"});
innerIn_hwbhyqjtg.on("change", (a,v) => { port_hwbhyqjtg.set(a); });

const innerIn_fdvwts4bo = addedOps[i].inFloat("innerIn_fdvwts4bo");
innerIn_fdvwts4bo.setUiAttribs({title:"CC Value Out"});
innerIn_fdvwts4bo.on("change", (a,v) => { port_fdvwts4bo.set(a); });

}
}
};
