
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

function TableCell(attrs,text)
{
    var node = document.createElement("td")
    if (typeof attrs != 'undefined')
    {
        for ( var a in attrs )
            node.setAttribute(a,attrs[a]);
    }
    if (typeof text != 'undefined')
        node.innerHTML = text
    this.node = node;
}

function TableRow(attrs)
{
    var node = document.createElement("tr")
    if (typeof text != 'undefined')
        for ( var a in attrs )
            node.setAttribute(a,attrs[a]);
    this.node = node;
    this.addcell = function(attrs,text) { var td = new TableCell(attrs,text); this.node.appendChild(td.node); return td; }
    this.addcells = function(n) { var cells = new Array(n); for (var i = 0; i < n; ++i) cells[i] = this.addcell(); return cells; }
}

function Table(attrs)
{
    var node = document.createElement("table");
    if (typeof attrs != 'undefined')
        for ( var a in attrs )
            node.setAttribute(a,attrs[a]);

    this.node = node;
    this.addrow  = function(attrs) { var tr = new TableRow(attrs); this.node.appendChild(tr.node); return tr; }
    this.addonecell = function(text) {
        var tr = new TableRow(attrs);
        this.node.appendChild(tr.node);
        var td = tr.addcell({},text);
        return td;
    }
}

function pptask(data,element)
{
    var tf = new TaskFile(data);

    var h1node = document.createElement("h1");
    h1node.innerHTML = "Summary";
    element.appendChild(h1node)

    var table =  new Table({ 'id' : "info-table" });
    element.appendChild(table.node);

    var tr = table.addrow({}); tr.addcell({},"File written by Mosek version"); tr.addcell({},tf.mosekver);
    var tr = table.addrow({}); tr.addcell({},"Task Name"); tr.addcell({},""+tf.taskname);
    var tr = table.addrow({}); tr.addcell({},"Variables"); tr.addcell({},""+tf.numvar);
    var tr = table.addrow({}); tr.addcell({},"Constraints"); tr.addcell({},""+tf.numcon);
    var tr = table.addrow({}); tr.addcell({},"Quadratic Cones"); tr.addcell({},""+tf.numcone);
    var tr = table.addrow({}); tr.addcell({},"PSD Variables"); tr.addcell({},""+tf.numbarvar);
    var tr = table.addrow({}); tr.addcell({},"A non-zeros"); tr.addcell({},""+tf.numanz);


    var h1node = document.createElement("h1");
    h1node.innerHTML = "Problem";
    element.appendChild(h1node)


    var probtablenumcol = 3+tf.numvar+tf.numbarvar;

    var table = new Table({ "id" : "problem-table" });
    element.appendChild(table.node);

    var tr = table.addrow();
    tr.addcell({"class" : "obj-sense"},(tf.objsense == "MIN" ? "Minimize" : "Maximize"))
    tr.addcell();
    var cols = tr.addcells(tf.numvar+tf.numbarvar);
    tr.addcell();

    if (tf.c != null)
        for (var i = 0; i < tf.c.length; ++i)
            cols[i].node.innerHTML = fmtlinelm(tf.c[i],tf.varnames[i]);

    if (tf.barcsparsity != null)
    {
        for (var k = 0; k < tf.barcsparsity.length; ++k)
        {
            var sub = tf.barcsparsity[k];
            var pb  = tf.barcalpha.ptrb[k];
            var pe  = tf.barcalpha.ptrb[k+1];

            cols[sub+tf.numvar].innerHTML = fmtbarelm(tf.barcalpha.valij,
                                                      tf.barcalpha.subj,
                                                      pb,pe,
                                                      tf.barvarnames[sub]);
        }
    }

    if (tf.barasparsity != null)
    {
        var baraptrb = new Int32Array(tf.numcon+1);
        for (var i = 0; i < tf.barasparsity.nnz; ++i)
            ++baraptrb[tf.barasparsity.subi[i]+1];
        for (var i = 0; i < tf.barasparsity.nnz; ++i)
            baraptrb[i+1] += baraptrb[i];
    }

    for (var i = 0; i < tf.numcon; ++i)
    {
        var  tr = table.addrow();
        tr.addcell({},"<span  class=\"con-name\">"+tf.connames[i]+"</span>");

        var bk = tf.conbk[i];
        if (bk == MSK_BK_LO ||
            bk == MSK_BK_RA )
            tr.addcell({"class" : "con-lb"},""+tf.conbound[i]+" &leq;");
        else
            tr.addcell({"class" : "con-lb"});

        var cols = tr.addcells(tf.numvar+tf.numbarvar);

        if (tf.A != null)
        {
            for (var k = tf.A.ptrb[i]; k < tf.A.ptrb[i+1]; ++k)
            {
                var sub = tf.A.subj[k];
                cols[sub].node.innerHTML = fmtlinelm(tf.A.valij[k], tf.varnames[sub]);
            }
        }

        if (tf.barasparsity != null)
        {
            for (var k = baraptrb[i]; k < baraptrb[i+1]; ++k)
            {
                var sub = tf.barasparsity.subj[k];
                var pb  = tf.baraalpha.ptrb[k];
                var pe  = tf.baraalpha.ptrb[k+1];

                cols[tf.numvar+sub].node.innerHTML = fmtbarelm(tf.baraalpha.valij,
                                                               tf.baraalpha.subj,
                                                               pb,pe,
                                                               tf.barvarnames[sub]);
            }
        }

        if (bk == MSK_BK_UP ||
            bk == MSK_BK_RA )
            tr.addcell({"class" : "con-ub"}, "&leq; "+tf.conbound[tf.numcon+i]);
        else if (bk == MSK_BK_FX)
            tr.addcell({"class" : "con-ub"}, "= "+tf.conbound[tf.numcon+i]);
        else
            tr.addcell({"class" : "con-ub"});
    }


    // cones
    for (var i = 0; i < tf.numcone; ++i)
    {
        var conesize = tf.qconesub.ptrb[i+1] - tf.qconesub.ptrb[i];
        var conearr = new Array();
        for (var j = tf.qconesub.ptrb[i]; j < tf.qconesub.ptrb[i+1]; ++j)
            conearr[conearr.length] = varname(tf.varnames[tf.qconesub.subj[j]]);

        var conedef = "("+conearr.join(",")+") &in; "+(tf.qconetype[i] == MSK_CT_QUAD ? "QCone" : "RotatedQCone")+"("+conesize+")";

        var tr = table.addrow();
        tr.addcell({"class" : "cone-name" }, tf.conenames[i]);
        tr.addcell();
        tr.addcell({"colspan" : ""+(probtablenumcol-2)},conedef);
    }







    ppdata = new Array();
    ppdata[0] = "<table class\"variables-table\">"

    ppdata[ppdata.length] = "<tr><td>With variables</td></tr>";
    for (var i = 0; i < tf.numvar; ++i)
    {
        if      (tf.varbk[i] == MSK_BK_FX)
            ppdata[ppdata.length] = "<tr><td /><td><span class=\"var-name\">"+ tf.varnames[i] + "</span> = " + tf.varbound[i] +"</td></tr>";
        else if (tf.varbk[i] == MSK_BK_FR)
            ppdata[ppdata.length] = "<tr><td /><td> -&infin; &lt; <span class=\"var-name\">" +tf.varnames[i] + "</span> &lt; &infin;</td></tr>";
        else if (tf.varbk[i] == MSK_BK_UP)
            ppdata[ppdata.length] = "<tr><td /><td> -&infin; &lt; <span class=\"var-name\">" +tf.varnames[i] + "</span> &leq; " + tf.varbound[tf.numvar+i] +"</td></tr>";
        else if (tf.varbk[i] == MSK_BK_LO)
            ppdata[ppdata.length] = "<tr><td /><td>"+tf.varbound[i]+" &leq; <span class=\"var-name\">" +tf.varnames[i] + "</span> &lt; &infin; </td></tr>";
        else if (tf.varbk[i] == MSK_BK_RA)
            ppdata[ppdata.length] = "<tr><td /><td>"+tf.varbound[i]+" &leq; <span class=\"var-name\">" +tf.varnames[i] + "</span> &leq; " + tf.varbound[tf.numvar+i] +"</td></tr>";
    }

    for (var i = 0; i < tf.numbarvar; ++i)
    {
        //ppdata[ppdata.length] = "<tr><td /><td><span class=\"var-name\">"+tf.barvarnames[i]+"</span> &in; $S_+^{"+tf.barvardim[i]+"}$</td></tr>";
        ppdata[ppdata.length] = "<tr><td /><td><span class=\"var-name\">"+tf.barvarnames[i]+"</span> &in; PSD("+tf.barvardim[i]+")</td></tr>";
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
