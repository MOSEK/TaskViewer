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







// rowsubset and colsubset must be sorted
function renderProblem(tf,element)
{
    element.innerHTML = "";

    console.log("Rerender!");

    // Rebuild subset lists
    var colsubset_len = 0;
    for (var i = 0; i < tf.numvar+tf.numbarvar; ++i) { var e = document.getElementById("check-var-"+i); if (e.checked) ++colsubset_len; }
    var colsubset = new Int32Array(colsubset_len);
    var idx = 0;
    for (var i = 0; i < tf.numbarvar+tf.numvar; ++i) { var e = document.getElementById("check-var-"+i); if (e.checked) { colsubset[idx] = i; ++idx; } }

    var rowsubset_len = 0;
    for (var i = 0; i < tf.numcon; ++i) { var e = document.getElementById("check-con-"+i); if (e && e.checked) ++rowsubset_len; }
    var rowsubset = new Int32Array(rowsubset_len);
    var idx = 0;
    for (var i = 0; i < tf.numcon; ++i) { var e = document.getElementById("check-con-"+i); if (e && e.checked) { rowsubset[idx] = i; ++idx; } }
    // --------------------

    var probtablenumcol = 3+colsubset.length;
    var probtablenumrow = 6+rowsubset.length+tf.numcone;

    var table = new Table({ "id" : "problem-table" },true,true);
    element.appendChild(table.node);

    table.addhead(); table.addhead();
    var prev = -1;
    for (var i = 0; i < colsubset.length;    ++i)
    {
        if (colsubset[i] > prev+1) table.addhead({"class" : "skip-marker" },"");
        table.addhead({"id" : "var-"+colsubset[i]}, colsubset[i] < tf.numvar ? tf.varnames[colsubset[i]] : tf.barvarnames[colsubset[i]-tf.numvar] );
        prev = colsubset[i];
    }
    if (prev < tf.numvar+tf.numcon-1) table.addhead();
    table.addhead();

    table.addrow({ "style" : "display : none;"});

    var tr = table.addrow(); tr.addcells(2);
    prev = -1;
    for (var i = 0; i < colsubset.length;    ++i)
    {
        if (colsubset[i] > prev+1)
        {
            var td = tr.addcell({"class" : "skip-marker","rowspan" : probtablenumrow+2,"style" : "vertical-align : top; width : 16px;" },"");
            var div = document.createElement('div');
            div.setAttribute("style","transform : rotate(90deg); height : 16px; width : 16px;");
            div.innerHTML = "... " + (colsubset[i] - prev) + " hidden columns";
            td.node.appendChild(div)
        }
        tr.addcell();
        prev = colsubset[i];
    }
    if (prev < tf.numvar+tf.numcon-1)
    {
        var td = tr.addcell({"class" : "skip-marker","rowspan" : probtablenumrow+2,"style" : "vertical-align : top; width : 16px;" },"");
        var div = document.createElement('div');
        div.setAttribute("style","transform : rotate(90deg); height : 16px; width : 16px;");
        div.innerHTML = "... " + (tf.numvar+tf.numcon-1 - prev) + " hidden columns";
        td.node.appendChild(div)

    }
    table.addhead();



    var tr = table.addrow();
    tr.addcell({"class" : "obj-sense"},(tf.objsense == "MIN" ? "Minimize" : "Maximize"))
    tr.addcell();
    var cols = tr.addcells(colsubset.length);
    tr.addcell();



    var i = 0;
    if (tf.c == null)
        while (i < colsubset.length && colsubset[i] < tf.numvar) ++i;
    else
    {
        while (i < colsubset.length && colsubset[i] < tf.numvar)
        {
            cols[i].node.innerHTML = fmtlinelm(tf.c[colsubset[i]],tf.varnames[colsubset[i]]);
            ++i;
        }
    }

    if (tf.barcsparsity != null)
    {
        var k = 0;
        while (i < colsubset.length && k < tf.barcsparsity.length)
        {
            if      (tf.barcsparsity[k] < colsubset[i] - tf.numvar) ++k;
            else if (tf.barcsparsity[k] > colsubset[i] - tf.numvar) ++i;
            else
            {
                var sub = tf.barcsparsity[k];
                var pb  = tf.barcalpha.ptrb[k];
                var pe  = tf.barcalpha.ptrb[k+1];

                cols[i].innerHTML = fmtbarelm(tf.barcalpha.valij,
                                              tf.barcalpha.subj,
                                              pb,pe,
                                              tf.barvarnames[sub],
                                              tf.barvardim[sub]);
                ++i; ++k;
            }
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

        //------- skipped rows, insert a marker
        if (prev < i - 1) 
        {
            table.addrow().addcell({"colspan" : probtablenumcol+1, "style" : "background-color : #ffd0d0;"},"... "+(i-1-prev)+" hidden rows");
            table.addrow({"display" : "none"}).addcell({"colspan" : probtablenumcol+1});
        }
        //-------------------------------------


        var  tr = table.addrow();
        tr.addcell({},"<span  class=\"con-name\">"+tf.connames[i]+"</span>");

        var bk = tf.conbk[i];
        if (bk == MSK_BK_LO ||
            bk == MSK_BK_RA )
            tr.addcell({"class" : "con-lb"},""+tf.conbound[i]+" &leq;");
        else
            tr.addcell({"class" : "con-lb"});

        var cols = tr.addcells(probtablenumcol-3);

        var l = 0;
        if (tf.A != null)
        {
            var k = tf.A.ptrb[i];
            while ( k < tf.A.ptrb[i+1] && l < colsubset.length)
            {
                if      (colsubset[l] < tf.A.subj[k]) ++l;
                else if (colsubset[l] > tf.A.subj[k]) ++k;
                else
                {
                    cols[l].node.innerHTML = fmtlinelm(tf.A.valij[k], tf.varnames[tf.A.subj[k]]);
                    ++l; ++k;
                }
            }
        }

        if (tf.barasparsity != null)
        {
            var k = baraptrb[i];
            while (k < baraptrb[i+1] && l < colsubset.length)
            {
                if      (tf.barasparsity.subj[k] < colsubset[l]-tf.numvar) ++k;
                else if (tf.barasparsity.subj[k] > colsubset[l]-tf.numvar) ++l;
                else
                {
                    var sub = tf.barasparsity.subj[k];
                    var pb  = tf.baraalpha.ptrb[k];
                    var pe  = tf.baraalpha.ptrb[k+1];

                    cols[l].node.innerHTML = fmtbarelm(tf.baraalpha.valij,
                                                       tf.baraalpha.subj,
                                                       pb,pe,
                                                       tf.barvarnames[sub],
                                                       tf.barvardim[sub]);
                    ++l; ++k;
                }
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
 
    //------- skipped rows, insert a marker
    if (prev < tf.numcon-1) // skipped rows, insert a marker
    {
        table.addrow().addcell({"colspan" : probtablenumcol, "class" : "skip-marker"},"... "+(tf.numcon-1-prev)+" hidden rows");
        table.addrow({"display" : "none"}).addcell({"colspan" : probtablenumcol});
    }
    //-------------------------------------


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
    var lbcells = tr.addcells(colsubset.length);
    tr.addcell()

    var tr = table.addrow({"class":"var-bound-row"});
    tr.addcell(undefined,"Upper"); tr.addcell();
    var ubcells = tr.addcells(colsubset.length);
    tr.addcell()

    var tr = table.addrow({"class":"var-bound-row"});
    tr.addcell(); tr.addcell();
    var tpcells = tr.addcells(colsubset.length);
    tr.addcell()

    var ii = 0;
    for (; ii < colsubset.length && colsubset[ii] < tf.numvar ; ++ii)
    {
        var u = colsubset[ii];
        if (vartypes[ii] > 0) tpcells[i].node.innerHTML = 'int';

        if      (tf.varbk[i] == MSK_BK_FX)
            lbcells[i].node.innerHTML = "= "+tf.varbound[i];

        else if (tf.varbk[i] == MSK_BK_FR)
        {
            lbcells[ii].node.innerHTML = "-&infin;";
            ubcells[ii].node.innerHTML = "&infin;";
        }
        else if (tf.varbk[i] == MSK_BK_UP)
        {
            lbcells[ii].node.innerHTML = "-&infin;";
            ubcells[ii].node.innerHTML = tf.varbound[tf.numvar+i];
        }
        else if (tf.varbk[i] == MSK_BK_LO)
        {
            lbcells[ii].node.innerHTML =  tf.varbound[i];
            ubcells[ii].node.innerHTML = "&infin;"
        }
        else if (tf.varbk[i] == MSK_BK_RA)
        {
            lbcells[ii].node.innerHTML = tf.varbound[i];
            ubcells[ii].node.innerHTML = tf.varbound[tf.numvar+i];
        }
    }

    for (; ii < colsubset.length; ++ii)
    {
        var i = colsubset[ii];
        console.log(ii,i,tf.barvardim)
        tpcells[ii].node.innerHTML = "PSD("+tf.barvardim[i-tf.numvar]+")";
    }
} /* renderProblem */

function renderVarSelectBox(tf,element,varsubset)
{
    element.innerHTML = "";

    var table = new Table();
    element.appendChild(table.node);
    var cellsperrow = 15;
    var i = 0;
    while (i < tf.numvar)
    {
        var tr = table.addrow();
        var cells = tr.addcells(cellsperrow);
        for (var j = 0; j < cellsperrow && i+j < tf.numvar; ++j)
        {
            cells[j].node.innerHTML = "<input type='checkbox' id='check-var-"+(i+j)+"'> " + tf.varnames[i+j];
        }
        i += 15;
    }
    i = 0;
    while (i < tf.numbarvar)
    {
        var tr = table.addrow();
        var cells = tr.addcells(cellsperrow);
        for (var j = 0; j < cellsperrow && i+j < tf.numbarvar; ++j)
        {
            cells[j].node.innerHTML = "<input type='checkbox' id='check-var-"+(i+j+tf.numvar)+"'> " + tf.barvarnames[i+j];
        }
        i += 15;
    }

    if (typeof varsubset != 'undefined')
        for (var i = 0; i < varsubset.length; ++i)
            document.getElementById('check-var-'+varsubset[i]).checked = true;
    else
        for (var i = 0; i < tf.numvar+tf.numbarvar; ++i)
            document.getElementById('check-var-'+i).checked = true;
}

function setAllVars(tf,v)
{
    for (var i = 0; i < tf.numvar+tf.numbarvar; ++i) document.getElementById("check-var-"+i).checked = v;
}

function setRegexVars(tf,regex,v)
{
    for (var i = 0; i < tf.numvar; ++i)
        if (tf.varnames[i].match(regex) != null)
            document.getElementById("check-var-"+i).checked = v;
    for (var i = 0; i < tf.numbarvar; ++i)
        if (tf.barvarnames[i].match(regex) != null)
            document.getElementById("check-var-"+(i+tf.numvar)).checked = v;
}


function renderConSelectBox(tf,element,consubset)
{
    element.innerHTML = "";
    var table = new Table();
    element.appendChild(table.node);
    var cellsperrow = 15;
    var i = 0;
    while (i < tf.numcon)
    {
        var tr = table.addrow();
        var cells = tr.addcells(cellsperrow);
        for (var j = 0; j < cellsperrow && i+j < tf.numcon; ++j)
        {
            cells[j].node.innerHTML = "<input type='checkbox' id='check-con-"+(i+j)+"'> " + tf.connames[i+j];
        }
        i += 15;
    }

    if (typeof consubset != 'undefined')
        for (var i = 0; i < consubset.length; ++i)
            document.getElementById('check-con-'+consubset[i]).checked = true;
    else
        for (var i = 0; i < tf.numcon; ++i)
            document.getElementById('check-con-'+i).checked = true;
}


function setAllCons(tf,v)
{
    for (var i = 0; i < tf.numvar+tf.numbarvar; ++i) document.getElementById("check-con-"+i).checked = v;
}

function setRegexCons(tf,regex,v)
{
    for (var i = 0; i < tf.numvar; ++i)
        if (tf.connames[i].match(regex) != null)
            document.getElementById("check-con-"+i).checked = v;
}


function pptask(data,element)
{
    var tf = new TaskFile(data);

    var element = document.getElementById("pretty-task-info");
    element.innerHTML = "";
    var table =  new Table({ 'id' : "info-table" });
    element.appendChild(table.node);

    var tr = table.addrow({}); tr.addcell({},"File written by Mosek version"); tr.addcell({},tf.mosekver);
    var tr = table.addrow({}); tr.addcell({},"Task Name"); tr.addcell({},""+tf.taskname);
    var tr = table.addrow({}); tr.addcell({},"Variables"); tr.addcell({},""+tf.numvar);
    var tr = table.addrow({}); tr.addcell({},"Constraints"); tr.addcell({},""+tf.numcon);
    var tr = table.addrow({}); tr.addcell({},"Quadratic Cones"); tr.addcell({},""+tf.numcone);
    var tr = table.addrow({}); tr.addcell({},"PSD Variables"); tr.addcell({},""+tf.numbarvar);
    var tr = table.addrow({}); tr.addcell({},"A non-zeros"); tr.addcell({},""+tf.numanz);

    if (tf.numcon > 40)
    {
        var con_subset = new Int32Array(40);
        for (var i = 0; i < 100; ++i)
            con_subset[i] = i;
    }

    if (tf.numvar > 20)
    {
        var var_subset = new Int32Array(20);
        for (var i = 0; i < 100; ++i)
            var_subset[i] = i;
    }

    if (tf.numcone > 20)
    {
        var cone_subset = new Int32Array(20);
        for (var i = 0; i < 100; ++i)
            cone_subset[i] = i;
    }

    renderVarSelectBox(tf,document.getElementById("pretty-select-variables"),var_subset);
    renderConSelectBox(tf,document.getElementById("pretty-select-constraints"),con_subset);


    if (tf.integerparameters != null)
    {
        div = document.getElementById("pretty-iparam-table");
        div.innerHTML = "";

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
        div.innerHTML = "";

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
        div.innerHTML = "";

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

    var element = document.getElementById("pretty-problem");
    element.innerHTML = "";
    var div = document.createElement("div");
    div.setAttribute("id","div-problem-table");
    element.appendChild(div);

    renderProblem(tf,div);

    $("#pretty-select-all-vars-button").click(function () { setAllVars(tf,true)});
    $("#pretty-deselect-all-vars-button").click(function () { setAllVars(tf,false)});
    $("#select-vars-regex").keyup(function (e) { if (e.originalEvent.keyCode == 13) setRegexVars(tf,$("#select-vars-regex").val(),true)});
    $("#pretty-select-regex-vars-button").click(function () { setRegexVars(tf,$("#select-vars-regex").val(),true)});
    $("#pretty-deselect-regex-vars-button").click(function () { setRegexVars(tf,$("#select-vars-regex").val(),false)});
    $("#pretty-refresh-problem-button").click(function () { console.log("refresh"); renderProblem(tf,div); });

    $("#pretty-select-all-cons-button").click(function () { setAllCons(tf,true)});
    $("#pretty-deselect-all-cons-button").click(function () { setAllCons(tf,false)});
    $("#select-cons-regex").keyup(function (e) { if (e.originalEvent.keyCode == 13) setRegexVars(tf,$("#select-cons-regex").val(),true)});
    $("#pretty-select-regex-cons-button").click(function () { setRegexCons(tf,$("#select-cons-regex").val(),true)});
    $("#pretty-deselect-regex-cons-button").click(function () { setRegexCons(tf,$("#select-cons-regex").val(),false)});
    $("#pretty-refresh-problem-button").click(function () { console.log("refresh"); renderProblem(tf,div); });

}
