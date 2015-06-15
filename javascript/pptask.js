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

function TableHeadCell(attrs,text)
{
    var node = document.createElement("th")
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
    if (typeof attrs != 'undefined')
        for ( var a in attrs )
            node.setAttribute(a,attrs[a]);
    this.node = node;
    this.addcell = function(attrs,text) { var td = new TableCell(attrs,text); this.node.appendChild(td.node); return td; }
    this.addcells = function(n) { var cells = new Array(n); for (var i = 0; i < n; ++i) cells[i] = this.addcell(); return cells; }
}


function TableHead(elmname)
{
    var node = document.createElement(elmname)
    var n = document.createElement("tr")
    node.appendChild(n);

    this.node = node;
    this.addcell = function(attrs,text) { var td = new TableHeadCell(attrs,text); this.node.appendChild(td.node); return td; }
}

function Table(attrs,hashead,hasfoot)
{
    var node = document.createElement("table");
    if (typeof attrs != 'undefined')
        for ( var a in attrs )
            node.setAttribute(a,attrs[a]);

    this.node = node;

    if (hashead)
    {
        this.thead  = new TableHead("thead")
        this.node.appendChild(this.thead.node)
    }

    this.tbody = document.createElement('tbody');
    this.node.appendChild(this.tbody);

    if (hasfoot)
    {
        this.tfoot = new TableHead("tfoot")
        this.node.appendChild(this.tfoot.node)
    }

    this.addhead = function (attrs, text) {
        if (typeof this.thead != 'undefined')
            this.thead.addcell(attrs,text);
        if (typeof this.tfoot != 'undefined')
            this.tfoot.addcell(attrs,text);
    }

    this.addfootrow

    this.addcol = function(attrs) {
        var elt = document.createElement("col");
        if (typeof attrs != 'undefined')
            for (var a in attrs)
                elt.setAttribute(a,attrs[a]);
        this.node.appendChild(elt);
        return elt;
    }

    this.addrow  = function(attrs) { var tr = new TableRow(attrs); this.tbody.appendChild(tr.node); return tr; }
    this.addonecell = function(text) {
        var tr = new TableRow(attrs);
        this.tbody.appendChild(tr.node);
        var td = tr.addcell({},text);
        return td;
    }
}








function renderProblem(tf,element,rowsubset,colsubset)
{
    var probtablenumcol = 3+tf.numvar+tf.numbarvar;

    if (typeof rowsubset == 'undefined')
    {
        rowsubset = new Int32Array(tf.numcon);
        for (var i = 0; i < tf.numcon; ++i) rowsubset[i] = i;
    }

    var table = new Table({ "id" : "problem-table" },true,true);
    element.appendChild(table.node);

    table.addhead(); table.addhead();
    for (var i = 0; i < tf.numvar;    ++i) table.addhead({"id" : "var-"+i},tf.varnames[i]);
    for (var i = 0; i < tf.numbarvar; ++i) table.addhead({"id" : "var-"+(i+tf.numvar)},tf.barvarnames[i]);
    table.addhead();

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

    var prev = -1;
    for (var ii = 0; ii < rowsubset.length; ++ii)
    {
        var i = rowsubset[ii];

        if (prev < i - 1) // skipped rows, insert a marker
        {
            table.addrow().addcell({"colspan" : probtablenumcol, "style" : "background-color : #ffd0d0;"},"... "+(i-1-prev)+" hidden rows");
            table.addrow({"display" : "none"}).addcell({"colspan" : probtablenumcol});
        }

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
        prev = i;
    }

    if (prev < tf.numcon-1) // skipped rows, insert a marker
    {
        table.addrow().addcell({"colspan" : probtablenumcol, "style" : "background-color : #ffd0d0;"},"... "+(tf.numcon-1-prev)+" hidden rows");
        table.addrow({"display" : "none"}).addcell({"colspan" : probtablenumcol});
    }


    // cones
    for (var i = 0; i < tf.numcone; ++i)
    {
        var conesize = tf.qconesub.ptrb[i+1] - tf.qconesub.ptrb[i];
        var conearr = new Array();
        for (var j = tf.qconesub.ptrb[i]; j < tf.qconesub.ptrb[i+1]; ++j)
            conearr[conearr.length] = varname(tf.varnames[tf.qconesub.subj[j]]);

        var conedef = "("+conearr.join(",")+") &in; "+(tf.qconetype[i] == MSK_CT_QUAD ? "QCone" : "RotatedQCone")+"("+conesize+")";

        var tr = table.addrow({"class" : "cone-row" });
        tr.addcell({"class" : "cone-name" }, tf.conenames[i]);
        tr.addcell();
        tr.addcell({"colspan" : ""+(probtablenumcol-2)},conedef);
    }


    var tr = table.addrow({"class" : "sub-header"});
    var td = document.createElement("th");
    td.setAttribute("colspan", probtablenumcol);
    td.innerHTML = "Variable domains";
    tr.node.appendChild(td);

    var vartypes = new Int8Array(tf.numvar);
    if (this.intvaridxs != null)
    {
        for (var i = 0; i < this.intvaridxs.length; ++i)
            vartypes[this.intvaridxs[i]] = 1;
    }

    var tr = table.addrow({"class":"var-bound-row"});
    tr.addcell(undefined,"Lower"); tr.addcell();
    var lbcells = tr.addcells(tf.numvar+tf.numcon);
    tr.addcell()

    var tr = table.addrow({"class":"var-bound-row"});
    tr.addcell(undefined,"Upper"); tr.addcell();
    var ubcells = tr.addcells(tf.numvar+tf.numcon);
    tr.addcell()

    var tr = table.addrow({"class":"var-bound-row"});
    tr.addcell(); tr.addcell();
    var tpcells = tr.addcells(tf.numvar+tf.numcon);
    tr.addcell()

    for (var i = 0; i < tf.numvar; ++i)
    {
        if (vartypes[i] > 0) tpcells[i].node.innerHTML = 'int';

        if      (tf.varbk[i] == MSK_BK_FX)
            lbcells[i].node.innerHTML = "= "+tf.varbound[i];

        else if (tf.varbk[i] == MSK_BK_FR)
        {
            lbcells[i].node.innerHTML = "-&infin;";
            ubcells[i].node.innerHTML = "&infin;";
        }
        else if (tf.varbk[i] == MSK_BK_UP)
        {
            lbcells[i].node.innerHTML = "-&infin;";
            ubcells[i].node.innerHTML = tf.varbound[tf.numvar+i];
        }
        else if (tf.varbk[i] == MSK_BK_LO)
        {
            lbcells[i].node.innerHTML =  tf.varbound[i];
            ubcells[i].node.innerHTML = "&infin;"
        }
        else if (tf.varbk[i] == MSK_BK_RA)
        {
            lbcells[i].node.innerHTML = tf.varbound[i];
            ubcells[i].node.innerHTML = tf.varbound[tf.numvar+i];
        }
    }

    for (var i = 0; i < tf.numbarvar; ++i)
    {
        tpcells[i+tf.numvar].node.innerHTML = "PSD("+tf.barvardim[i]+")";
    }
}



var global_con_subset    = undefined;
var global_var_subset    = undefined;
var global_barvar_subset = undefined;
var global_cone_subset   = undefined;


function pptask(data,element)
{
    var tf = new TaskFile(data);

    var element = document.getElementById("pretty-task-info");
    var table =  new Table({ 'id' : "info-table" });
    element.appendChild(table.node);

    var tr = table.addrow({}); tr.addcell({},"File written by Mosek version"); tr.addcell({},tf.mosekver);
    var tr = table.addrow({}); tr.addcell({},"Task Name"); tr.addcell({},""+tf.taskname);
    var tr = table.addrow({}); tr.addcell({},"Variables"); tr.addcell({},""+tf.numvar);
    var tr = table.addrow({}); tr.addcell({},"Constraints"); tr.addcell({},""+tf.numcon);
    var tr = table.addrow({}); tr.addcell({},"Quadratic Cones"); tr.addcell({},""+tf.numcone);
    var tr = table.addrow({}); tr.addcell({},"PSD Variables"); tr.addcell({},""+tf.numbarvar);
    var tr = table.addrow({}); tr.addcell({},"A non-zeros"); tr.addcell({},""+tf.numanz);

    var element = document.getElementById("pretty-problem");

    var div = document.createElement("div");
    div.setAttribute("id","div-problem-table");
    element.appendChild(div);

    renderProblem(tf,div);



    if (tf.integerparameters != null)
    {
        div = document.getElementById("pretty-iparam-table");

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
        div = document.getElementById("pretty-dparam-table");

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
        div = document.getElementById("pretty-sparam-table");

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
}

