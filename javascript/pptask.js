
function varname(s)
{
    return '<span class="var-name">'+s+'</span>';
}

function barvarname(s,title)
{
    if (typeof title != 'undefined')
        return '<span class="var-name" title="'+title+'">'+s+'</span>';
    else
        return '<span class="var-name">'+s+'</span>';
}

function fmtbarelm(alpha,midx,first,last,name,dim)
{
    if (last-first == 1)
    {
        var cof = alpha[first];
        var title = "PSD("+dim+")";
        if (cof > 0)
        {
            if (cof > 1 || cof < 1)
                return " + "+cof+" M#"+midx[first]+" "+barvarname(name,title);
            else
                return " + M#"+midx[first]+" "+barvarname(name,title);
        }
        else if (cof < 0)
        {
            if (cof > -1 || cof < -1)
                return " - "+(-cof)+" M#"+midx[first]+" "+barvarname(name,title);
            else
                return " - M#"+midx[first]+" "+barvarname(name,title);
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
                                                      tf.barvarnames[sub],
                                                      tf.barvardim[sub]);
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
                                                               tf.barvarnames[sub],
                                                               tf.barvardim[sub]);
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








    var vartypes = new Int8Array(tf.numvar);
    if (this.intvaridxs != null)
    {
        for (var i = 0; i < this.intvaridxs.length; ++i)
            vartypes[this.intvaridxs[i]] = 1;
    }

    var table = new Table({"id" : "variables-table" });
    element.appendChild(table.node);
    table.addrow().addcell({"colspan" : "4"}, "With Variables");

    for (var i = 0; i < tf.numvar; ++i)
    {
        var tr       = table.addrow();
        var lbcell   = tr.addcell();
        var namecell = tr.addcell({},varname(tf.varnames[i]));
        var ubcell   = tr.addcell();

        if (vartypes[i] > 0) tr.addcell({},", is integer");
        else tr.addcell();

        if      (tf.varbk[i] == MSK_BK_FX)
            ubcell.node.innerHTML = "= "+tf.varbound[i];
        else if (tf.varbk[i] == MSK_BK_FR)
        {
            lbcell.node.innerHTML = "-&infin; &lt;";
            ubcell.node.innerHTML = "&lt; &infin;";
        }
        else if (tf.varbk[i] == MSK_BK_UP)
        {
            lbcell.node.innerHTML = "-&infin; &lt;";
            ubcell.node.innerHTML = "&leq; " + tf.varbound[tf.numvar+i];
        }
        else if (tf.varbk[i] == MSK_BK_LO)
        {
            lbcell.node.innerHTML =  "" + tf.varbound[i] + " &lt;";
            ubcell.node.innerHTML = "&leq; &infin;"
        }
        else if (tf.varbk[i] == MSK_BK_RA)
        {
            lbcell.node.innerHTML =  "" + tf.varbound[i] + " &lt;";
            ubcell.node.innerHTML = "&leq; " + tf.varbound[tf.numvar+i];
        }
    }

    for (var i = 0; i < tf.numbarvar; ++i)
    {
        var tr = table.addrow();
        tr.addcell();
        tr.addcell({},barvarname(tf.barvarnames[i]));
        tr.addcell({"colspan" : "2"}, "PSD("+tf.barvardim[i]+")")
    }





    if (tf.integerparameters != null)
    {
        element.innerHTML += "<h2 class='toggle-next-div'>Integer parameters</h2>";
        var div = document.createElement("div");
        div.setAttribute("class","hidden");
        element.appendChild(div);

        var table = new Table({ "class" : "parameter-table" });
        div.appendChild(table.node);

        for (var i in tf.integerparameters)
        {
            var item = tf.integerparameters[i];
            var tr = table.addrow();
            tr.addcell({},item[0]);
            tr.addcell({},item[1]);
        }
    }
    if (tf.doubleparameters != null)
    {
        element.innerHTML += "<h2 class='toggle-next-div'>Double parameters</h2>";
        var div = document.createElement("div");
        div.setAttribute("class","hidden");
        element.appendChild(div);

        var table = new Table({ "class" : "parameter-table" });
        div.appendChild(table.node);


        for (var i in tf.doubleparameters)
        {
            var item = tf.doubleparameters[i];
            var tr = table.addrow();
            tr.addcell({},item[0]);
            tr.addcell({},item[1]);
        }
    }
    if (tf.stringparameters != null)
    {
        element.innerHTML += "<h2 class='toggle-next-div'>String parameters</h2>\n";
        var div = document.createElement("div");
        element.appendChild(div);

        var table = new Table({ "class" : "parameter-table" });
        div.setAttribute("class","hidden");
        div.appendChild(table.node);

        for (var i in tf.stringparameters)
        {
            var item = tf.stringparameters[i];
            var tr = table.addrow();
            tr.addcell({},item[0]);
            tr.addcell({},item[1]);
        }
    }

    $("*[class|=toggle-next-div]").click(function () { $(this).next().toggleClass("hidden") } );
}

