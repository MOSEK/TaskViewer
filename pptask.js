
function varname(s)
{
    return '<span class="var-name">'+s+'</span>';
}

function fmtbarelm(alpha,midx,first,last,name)
{
    if (last-first == 1)
    {
        var cof = alpha[first];
        if (cof > 0)
        {
            if (cof > 1 || cof < 1)
                return " + "+cof+" M#"+midx[first]+" "+varname(name);
            else
                return " + M#"+midx[first]+" "+varname(name);
        }
        else if (cof < 0)
        {
            if (cof > -1 || cof < -1)
                return " - "+(-cof)+" M#"+midx[first]+" "+varname(name);
            else
                return " - M#"+midx[first]+" "+varname(name);
        }
        else
            return "";
    }
    else
        return " <FAIL> ";
}

function fmtlinelm(cof,name)
{
    if (cof > 0)
    {
        if      (cof > 1 || cof < 1)
            return" + "+cof + " " + varname(name);
        else
            return " + " + varname(name);
    }
    else if (cof < 0)
    {
        if      (cof > -1 || cof < -1)
            return " - "+ (-cof) + " " + varname(name);
        else
            return " - " + varname(name);
    }
    else
        return "";
}

function pptask(data,element)
{
    var tf = new TaskFile(data);

    element.innerHTML = "";
    element.innerHTML += ("<h1>Summary</h1>\n"+
                          "<table class=\"info-table\">\n"+
                          "  <tr><td>File written by Mosek version</td>  <td>"+tf.mosekver+"</td></tr>\n"+
                          "  <tr><td>Task Name</td>           <td>"+(tf.taskname.length > 0 ? tf.taskname : "<anonymous>")+"</td></tr>\n"+
                          "  <tr><td>Variables</td>           <td>"+tf.numvar+"</td></tr>\n"+
                          "  <tr><td>Constraints</td>         <td>"+tf.numcon+"</td></tr>\n"+
                          "  <tr><td>Quadratic Cones</td>     <td>"+tf.numcone+"</td></tr>\n"+
                          "  <tr><td>PSD Variables</td>       <td>"+tf.numbarvar+"</td></tr>\n"+
                          "  <tr><td>A non-zeros</td>         <td>"+tf.numanz+"</td></tr>\n"+
                          "  <tr><td>Q non-zeros</td>         <td>"+tf.numqnz+"</td></tr>\n"+
                          "  <tr><td>Symmetric Matrixes</td>  <td>"+tf.numsymmat+"</td></tr>\n"+
                          "</table>\n")
    element.innerHTML += "<h1>Problem</h1>\n";

    var ppdata = new Array();

    ppdata[0] = "<table class=\"problem-table\" style=\"border : solid thin black; \">"

    var objstr = new Array(tf.numvar+tf.numbarvar+1);
    if (tf.c != null)
    {
        for (var i = 0; i < tf.c.length; ++i)
            objstr[i] = fmtlinelm(tf.c[i],tf.varnames[i]);
    }
    if (tf.barcsparsity != null)
    {
        for (var k = 0; k < tf.barcsparsity.length; ++k)
        {
            var sub = tf.barcsparsity[k];
            var pb  = tf.barcalpha.ptrb[k];
            var pe  = tf.barcalpha.ptrb[k+1];

            objstr[sub+tf.numvar] = fmtbarelm(tf.barcalpha.valij,
                                              tf.barcalpha.subj,
                                              pb,pe,
                                              tf.barvarnames[sub]);
        }
    }




    ppdata[ppdata.length] = "<tr><td class=\"obj-sense\">" + (tf.objsense == "MIN" ? "Minimize" : "Maximize") + "</td><td></td><td>" + objstr.join("</td><td>") + "</td></tr>";
    ppdata[ppdata.length] = "<tr><td>Such that</td></td>"


    if (tf.barasparsity != null)
    {
        var baraptrb = new Int32Array(tf.numcon+1);
        for (var i = 0; i < tf.barasparsity.nnz; ++i)
            ++baraptrb[tf.barasparsity.subi[i]+1];
        for (var i = 0; i < tf.barasparsity.nnz; ++i)
            baraptrb[tf.barasparsity.subi[i]+1] += baraptrb[tf.barasparsity.subi[i]];
    }

    //console.log("A");
    //console.log(tf.A);

    for (var i = 0; i < tf.numcon; ++i)
    {
        var conarr = new Array();
        conarr[0]  = "<td><span  class=\"con-name\">"+tf.connames[i]+"</span></td>";
        var bk = tf.conbk[i];
        //console.log("bk = "+bk+ ", bound = "+tf.conbound[i]+", "+tf.conbound[i+tf.numcon]);
        if (bk == MSK_BK_LO ||
            bk == MSK_BK_RA )
        {
            conarr[conarr.length] = "<td class=\"con-lb\">"+tf.conbound[i]+" &leq;</td>"
        }
        else
        {
            conarr[conarr.length] = "<td class=\"con-lb\"></td>"
        }

        conarr[conarr.length] = "<td>";

        var conexpr = new Array(tf.numvar+tf.numbarvar);

        //console.log(tf.A.valij);
        //console.log("range : "+tf.A.ptrb[i]+" - " +tf.A.ptrb[i+1]);
        for (var k = tf.A.ptrb[i]; k < tf.A.ptrb[i+1]; ++k)
        {
            var sub = tf.A.subj[k];
            conexpr[sub] = fmtlinelm(tf.A.valij[k], tf.varnames[sub]);
        }
        //console.log("k : "+k);
        

        if (tf.barasparsity != null)
        {
            for (var k = baraptrb[i]; k < baraptrb[i+1]; ++k)
            {
                var sub = tf.barasparsity.subj[k];
                var pb  = tf.baraalpha.ptrb[k];
                var pe  = tf.baraalpha.ptrb[k+1];
                
                conexpr[tf.numvar+sub] = fmtbarelm(tf.baraalpha.valij,
                                                   tf.baraalpha.subj,
                                                   pb,pe,
                                                   tf.barvarnames[sub]);
            }
        }

        conarr[conarr.length] = conexpr.join("</td><td>");
        conarr[conarr.length] = "</td>"
        if (bk == MSK_BK_UP ||
            bk == MSK_BK_RA )
        {
            conarr[conarr.length] = "<td class=\"con-ub\">&leq; "+tf.conbound[tf.numcon+i]+"</td>"
        }
        else if (bk == MSK_BK_FX)
        {
            conarr[conarr.length] = "<td class=\"con-ub\">= "+tf.conbound[tf.numcon+i]+"</td>"
        }
        else
        {
            conarr[conarr.length] = "<td class=\"con-ub\"></td>"
        }
        ppdata[ppdata.length] = "<tr class=\""+(ppdata.length % 2 == 0 ? "even" : "odd")+"\">"+conarr.join("")+"</tr>";
    }
    ppdata[ppdata.length] = "</table>";

    element.innerHTML += ppdata.join("\n")+"\n";


    ppdata = new Array();
    ppdata[0] = "<table class\"variables-table\">"

    ppdata[ppdata.length] = "<tr><td>With variables</td></tr>";
    for (var i = 0; i < tf.numvar; ++i)
    {
        if      (tf.varbk[i] == MSK_BK_FX)
            ppdata[ppdata.length] = "<tr><td /><td colspan=10><span class=\"var-name\">"+ tf.varnames[i] + "</span> = " + tf.varbound[i] +"</td></tr>";
        else if (tf.varbk[i] == MSK_BK_FR)
            ppdata[ppdata.length] = "<tr><td /><td colspan=10> -&infin; &lt; <span class=\"var-name\">" +tf.varnames[i] + "</span> &lt; &infin;</td></tr>";
        else if (tf.varbk[i] == MSK_BK_UP)
            ppdata[ppdata.length] = "<tr><td /><td colspan=10> -&infin; &lt; <span class=\"var-name\">" +tf.varnames[i] + "</span> &leq; " + tf.varbound[tf.numvar+i] +"</td></tr>";
        else if (tf.varbk[i] == MSK_BK_LO)
            ppdata[ppdata.length] = "<tr><td /><td colspan=10>"+tf.varbound[i]+" &leq; <span class=\"var-name\">" +tf.varnames[i] + "</span> &lt; &infin; </td></tr>";
        else if (tf.varbk[i] == MSK_BK_RA)
            ppdata[ppdata.length] = "<tr><td /><td colspan=10>"+tf.varbound[i]+" &leq; <span class=\"var-name\">" +tf.varnames[i] + "</span> &leq; " + tf.varbound[tf.numvar+i] +"</td></tr>";
    }
    for (var i = 0; i < tf.numbarvar; ++i)
    {
        ppdata[ppdata.length] = "<tr><td /><td colspan=10><span class=\"var-name\">"+tf.barvarnames[i]+"</span> &in; PSD("+tf.barvardim[i]+")</td></tr>";
    }

    ppdata[ppdata.length] = "</table>";

    element.innerHTML += ppdata.join("\n")+"\n";

    element.innerHTML += "<h1>Solver parameters</h1>\n";
    if (tf.integerparameters != null)
    {
        element.innerHTML += "<h2>Integer parameters</h2>\n";
        var rows = new Array();
        rows[0] = "<table class=\"parameter-table\">";
        for (var i in tf.integerparameters)
        {
            var item = tf.integerparameters[i];
            rows[rows.length] = "<tr><td>"+item[0]+"</td><td>"+item[1]+"</td><tr>";
        }
        rows[rows.length] = "</table>";
        element.innerHTML += rows.join("\n");
    }
    if (tf.doubleparameters != null)
    {
        element.innerHTML += "<h2>Double parameters</h2>\n";
        var rows = new Array();
        rows[0] = "<table class=\"parameter-table\">";
        for (var i in tf.doubleparameters)
        {
            var item = tf.doubleparameters[i];
            rows[rows.length] = "<tr><td>"+item[0]+"</td><td>"+item[1]+"</td><tr>";
        }
        rows[rows.length] = "</table>";
        element.innerHTML += rows.join("\n");
    }
    if (tf.stringparameters != null)
    {
        element.innerHTML += "<h2>String parameters</h2>\n";
        var rows = new Array();
        rows[0] = "<table class=\"parameter-table\">";
        for (var i in tf.stringparameters)
        {
            var item = tf.stringparameters[i];
            rows[rows.length] = "<tr><td>"+item[0]+"</td><td>\""+item[1]+"\"</td><tr>";
        }
        rows[rows.length] = "</table>";
        element.innerHTML += rows.join("\n");
    }
}
