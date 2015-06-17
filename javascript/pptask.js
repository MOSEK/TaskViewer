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

function barsymmat(tf,midx,dim)
{
    return "<span class='bar-symmat' onmouseover='showSymmatAt(this,"+midx+");' onmouseout='hideSymmat("+midx+")'>M#"+midx+"</span>";
}

function fmtbarelm(tf,alpha,midx,first,last,name,dim)
{
    if (last-first > 0)
    {
        var cof = alpha[first];
        var title = "PSD("+dim+")";

        var elms = new Array(last-first);
        for (var i = 0; i < last-first; ++i)
        {
            var cof = alpha[first+i];
            var title = "PSD("+dim+")";
            if (cof > 0)
            {
                if (cof > 1 || cof < 1)
                    elms[i] = " + "+cof+" "+barsymmat(tf,midx[first+i],dim);
                else
                    elms[i] = " + "+barsymmat(tf,midx[first],dim);
            }
            else if (cof < 0)
            {
                if (cof > -1 || cof < -1)
                    elms[i] = " - "+(-cof)+" "+barsymmat(tf,midx[first],dim);
                else
                    elms[i] = " - "+barsymmat(tf,midx[first],dim);
            }
        }

        if (elms.length == 1)
            return elms.join("")+" "+barvarname(name,title);
        else
            return "+ ("+elms.join("")+") "+barvarname(name,title);
    }
    else
        return "";
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



function getCurrentVarSelection(tf)
{
    var colsubset_len = 0;
    for (var i = 0; i < tf.numvar+tf.numbarvar; ++i) { var e = document.getElementById("check-var-"+i); if (e.checked) ++colsubset_len; }
    var colsubset = new Int32Array(colsubset_len);
    var idx = 0;
    for (var i = 0; i < tf.numbarvar+tf.numvar; ++i) { var e = document.getElementById("check-var-"+i); if (e.checked) { colsubset[idx] = i; ++idx; } }
    return colsubset;
}

function getCurrentConSelection(tf)
{
    var rowsubset_len = 0;
    for (var i = 0; i < tf.numcon; ++i) { var e = document.getElementById("check-con-"+i); if (e && e.checked) ++rowsubset_len; }
    var rowsubset = new Int32Array(rowsubset_len);
    var idx = 0;
    for (var i = 0; i < tf.numcon; ++i) { var e = document.getElementById("check-con-"+i); if (e && e.checked) { rowsubset[idx] = i; ++idx; } }
    return rowsubset;
}

function solkey_to_str(v)
{
    return ( v == 98 ? "BAS" : 
             ( v == 115 ? "SUPBAS" :
               ( v == 108 ? "LOW" : 
                 ( v == 117 ? "UP" :
                   ( v == 120 ? "FX" :
                     ( v == 42 ? "INF" :
                       "UNK" ) ) ) ) ) );
}

function renderSolution(tf,elt)
{
    elt.innerHTML = "";
    if (tf.solbas == null &&
        tf.solitr == null &&
        tf.solitg == null)
    {
        elt.innerHTML = "No solutions available";
        return;
    }

    var table = new Table({"class" : "solution-table"});
    elt.appendChild(table.node);

    colsubset = getCurrentVarSelection(tf);
    rowsubset = getCurrentConSelection(tf);

    var tr = table.addrow({"class" : "header"});
    tr.addcell({"class" : "medium-border-right-cell"})
    tr.addcell({"colspan" : "4", "class" : "medium-border-right-cell"},"Basic")
    tr.addcell({"colspan" : "5", "class" : "medium-border-right-cell"},"Interior")
    tr.addcell({"colspan" : "2"},"Integer")

    var tr = table.addrow({"class" : "header"});
    // name
    tr.addcell({"class" : "medium-border-right-cell"})
    // basic
    tr.addcell(undefined,"status");
    tr.addcell(undefined,"xx");
    tr.addcell(undefined,"slx");
    tr.addcell({"class" : "medium-border-right-cell"},"sux");
    // interior
    tr.addcell(undefined,"status");
    tr.addcell(undefined,"xx");
    tr.addcell(undefined,"slx");
    tr.addcell(undefined,"sux");
    tr.addcell({"class" : "medium-border-right-cell"},"snx");
    // integer
    tr.addcell(undefined,"status");
    tr.addcell(undefined,"xx");

    for (var i = 0; i < colsubset.length; ++i)
        if (colsubset[i] < tf.numvar)
    {
        var tr = table.addrow({ 'class' : 'sol-row' });
        var ii = colsubset[i];
        tr.addcell(undefined,tf.varnames[ii]);
        if (tf.solbas != null)
        {
            tr.addcell(undefined,solkey_to_str(tf.solbas.skx[ii]));
            tr.addcell(undefined,tf.solbas.xx[ii]);
            tr.addcell(undefined,tf.solbas.slx[ii]);
            tr.addcell(undefined,tf.solbas.sux[ii]);
        }
        else
            tr.addcells(4);

        if (tf.solitr != null)
        {
            tr.addcell(undefined,solkey_to_str(tf.solitr.skx[ii]));
            tr.addcell(undefined,tf.solitr.xx[ii]);
            tr.addcell(undefined,tf.solitr.slx[ii]);
            tr.addcell(undefined,tf.solitr.sux[ii]);
            tr.addcell(undefined,tf.solitr.snx[ii]);
        }
        else
            tr.addcells(5);

        if (tf.solitg != null)
        {
            tr.addcell(undefined,solkey_to_str(tf.solitg.skx[ii]));
            tr.addcell(undefined,tf.solitg.xx[ii]);
        }
        else
            tr.addcells(2);
    }

    var tr = table.addrow({"class" : "header"});
    // name
    tr.addcell({"class" : "medium-border-right-cell"})
    // basic
    tr.addcell(undefined,"status");
    tr.addcell(undefined,"xc");
    tr.addcell(undefined,"slc");
    tr.addcell({"class" : "medium-border-right-cell"},"suc");
    // interior
    tr.addcell(undefined,"status");
    tr.addcell(undefined,"xc");
    tr.addcell(undefined,"slc");
    tr.addcell(undefined,"suc");
    tr.addcell({"class" : "medium-border-right-cell"},"y ");
    // integer
    tr.addcell(undefined,"status");
    tr.addcell(undefined,"xc");


    for (var i = 0; i < rowsubset.length; ++i)
    {
        var tr = table.addrow({ 'class' : 'sol-row' });
        var ii = rowsubset[i];
        tr.addcell(undefined,tf.connames[ii]);

        if (tf.solbas != null)
        {
            tr.addcell(undefined,solkey_to_str(tf.solbas.skc[ii]));
            tr.addcell(undefined,tf.solbas.xc[ii]);
            tr.addcell(undefined,tf.solbas.slc[ii]);
            tr.addcell(undefined,tf.solbas.suc[ii]);
            tr.addcell(undefined,tf.solitr.y[ii]);
        }
        else
            tr.addcells(4);

        if (tf.solitr != null)
        {
            tr.addcell(undefined,solkey_to_str(tf.solitr.skc[ii]));
            tr.addcell(undefined,tf.solitr.xc[ii]);
            tr.addcell(undefined,tf.solitr.slc[ii]);
            tr.addcell(undefined,tf.solitr.suc[ii]);
            tr.addcell(undefined,tf.solitr.y[ii]);
        }
        else
            tr.addcells(5);

        if (tf.solitg != null)
        {
            tr.addcell(undefined,solkey_to_str(tf.solitg.skc[ii]));
            tr.addcell(undefined,tf.solitg.xc[ii]);
        }
        else
            tr.addcells(2);
    }

}


// rowsubset and colsubset must be sorted
function renderProblem(tf,element)
{
    element.innerHTML = "";

    colsubset = getCurrentVarSelection(tf);
    rowsubset = getCurrentConSelection(tf);

    var rowsubset_len = 0;
    for (var i = 0; i < tf.numcon; ++i) { var e = document.getElementById("check-con-"+i); if (e && e.checked) ++rowsubset_len; }
    var rowsubset = new Int32Array(rowsubset_len);
    var idx = 0;
    for (var i = 0; i < tf.numcon; ++i) { var e = document.getElementById("check-con-"+i); if (e && e.checked) { rowsubset[idx] = i; ++idx; } }
    // --------------------

    
    var table = new Table({ "id" : "problem-table" });
    element.appendChild(table.node);

    // ---------------- HEAD
    var tr = table.addrow({"class" : "header" });
    tr.addcells(2);
    var numskipcol = 0;
    var prev = -1;
    for (var i = 0; i < colsubset.length;    ++i)
    {
        if (colsubset[i] > prev+1) { tr.addcell(); ++numskipcol; }
        tr.addcell({"id" : "var-"+colsubset[i]}, colsubset[i] < tf.numvar ? tf.varnames[colsubset[i]] : tf.barvarnames[colsubset[i]-tf.numvar] );
        prev = colsubset[i];
    }
    if (prev < tf.numvar+tf.numbarvar-1) { tr.addcell(); ++numskipcol; }
    tr.addcell();
    // ---------------- HEAD

    // count number of skipped row blocks
    var numskiprow = 0;
    var prev = -1;
    for (var i = 0; i < rowsubset.length; ++i)
        if (prev + 1 < rowsubset[i]) ++ numskiprow; else prev = rowsubset[i]; 
    if (prev +1< tf.numcon) ++numskiprow;


    var probtablenumcol = 4+colsubset.length+numskipcol;
    var probtablenumrow = 6+rowsubset.length+numskiprow;


    //----- Add row with markers for skipped columns

    if (numskipcol > 0)
    {
        table.addrow({ "style" : "display : none;"});

        var tr = table.addrow(); tr.addcells(2);
        prev = -1;
        for (var i = 0; i < colsubset.length;    ++i)
        {
            if (colsubset[i] > prev+1)
            {
                var td = tr.addcell({"class" : "skip-marker","rowspan" : probtablenumrow,"style" : "vertical-align : top; width : 16px;" },"");
                var div = document.createElement('div');
                div.setAttribute("style","transform : rotate(90deg); height : 16px; width : 16px;");
                div.innerHTML = "... " + (colsubset[i] - prev - 1) + " hidden columns";
                td.node.appendChild(div)
            }
            tr.addcell();
            prev = colsubset[i];
        }
        if (prev < tf.numvar+tf.numbarvar-1)
        {
            var td = tr.addcell({"class" : "skip-marker","rowspan" : probtablenumrow,"style" : "vertical-align : top; width : 16px;" },"");
            var div = document.createElement('div');
            div.setAttribute("style","transform : rotate(90deg); height : 16px; width : 16px;");
            div.innerHTML = "... " + (tf.numvar+tf.numcon-1 - prev) + " hidden columns";
            td.node.appendChild(div)
        }
        table.addhead();
    }

    //----- Objective row

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

                cols[i].innerHTML = fmtbarelm(tf,
                                              tf.barcalpha.valij,
                                              tf.barcalpha.subj,
                                              pb,pe,
                                              tf.barvarnames[sub],
                                              tf.barvardim[sub]);
                ++i; ++k;
            }
        }
    }


    //----- Constraint rows

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
        tr.addcell(undefined,"<span  class=\"con-name\">"+tf.connames[i]+"</span>");

        var bk = tf.conbk[i];
        if (bk == MSK_BK_LO ||
            bk == MSK_BK_RA )
            tr.addcell({"class" : "con-lb"},""+tf.conbound[i]+" &leq;");
        else
            tr.addcell({"class" : "con-lb"});

        var cols = tr.addcells(colsubset.length);

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

                    cols[l].node.innerHTML = fmtbarelm(tf,
                                                       tf.baraalpha.valij,
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




    table.addrow({"class" : "header"}).addcell({"colspan" : probtablenumcol },"Variable domains");

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
    tr.addcell(undefined,"&nbsp;"); tr.addcell();
    var tpcells = tr.addcells(colsubset.length);
    tr.addcell()

    var ii = 0;
    for (; ii < colsubset.length && colsubset[ii] < tf.numvar ; ++ii)
    {
        var i = colsubset[ii];
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
        tpcells[ii].node.innerHTML = "PSD("+tf.barvardim[i-tf.numvar]+")";
    }

    table.addrow({"class" : "header"}).addcell({"colspan" : probtablenumcol },"Cones");

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

} /* renderProblem */

function showSymmatAt(elm,midx)
{
    var e = $("#symmat-"+midx);
    var elmpos = $(elm).offset();
    elmpos.top -= 20;
    elmpos.left += 20;
    e.toggle();
    e.offset(elmpos);
}

function hideSymmat(midx)
{
    $("#symmat-"+midx).toggle(false);
}

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

function rerender(tf)
{
    renderProblem(tf,document.getElementById("div-problem-table"));
    renderSolution(tf,document.getElementById("pretty-solution"))

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
    renderSolution(tf,document.getElementById("pretty-solution"))


    // symmetric matrix dummies...
    var element = document.getElementById("symmat-store");
    element.innerHTML = "";
    
    for (var i = 0; i < tf.numsymmat; ++i)
    {
        var span = document.createElement("span");
        span.setAttribute('class','display-symmat-box');
        span.setAttribute('id','symmat-'+i);
        element.appendChild(span);

        var div = document.createElement("div");
        div.setAttribute('class','display-symmat')
        span.appendChild(div);

        var N = tf.matsto[i].dim;
        var table = new Table({'class':'symmat-display-table'});
        div.appendChild(table.node);


        if (N < 10) // full display
        {
            var rows = new Array(N);
            for (var k = 0; k < N; ++k)
            {
                rows[k] = table.addrow().addcells(N);
                for (var l = 0; l < N; ++l) rows[k][l].node.innerHTML = '&nbsp;';
            }

            for (var k = 0; k < tf.matsto[i].val.length; ++k)
            {
                var subi = tf.matsto[i].subi[k];
                var subj = tf.matsto[i].subj[k];
                rows[subi][subj].node.innerHTML = tf.matsto[i].val[k];
                if (subi != subj)
                    rows[subj][subi].node.innerHTML = tf.matsto[i].val[k];
            }
        }
        else // partial display
        {
            var M = 9;
            var rows = new Array(M+1);
            for (var k = 0; k < M+1; ++k)
            {
                rows[k] = table.addrow().addcells(M+1);
                for (var l = 0; l < N; ++l) rows[k][l].node.innerHTML = '&nbsp;';
            }
            rows[0][M-1].node.innerHTML = '&hellip;'
            rows[M-1][0].node.innerHTML = '&vellip;'
            rows[M-1][M-1].node.innerHTML = '&#8945;'

            for (var k = 0; k < tf.matsto[i].val.length; ++k)
            {
                var subi = tf.matsto[i].subi[k];
                var subj = tf.matsto[i].subj[k];
                if (subi < M && subj < M)
                {
                    rows[subi][subj].node.innerHTML = tf.matsto[i].val[k].toPrecision(3);
                    if (subi != subj)
                        rows[subj][subi].node.innerHTML = tf.matsto[i].val[k];
                }
            }

        }

    }




    $("#pretty-select-all-vars-button").click(function () { setAllVars(tf,true)});
    $("#pretty-deselect-all-vars-button").click(function () { setAllVars(tf,false)});
    $("#select-vars-regex").keyup(function (e) { if (e.originalEvent.keyCode == 13) setRegexVars(tf,$("#select-vars-regex").val(),true)});
    $("#pretty-select-regex-vars-button").click(function () { setRegexVars(tf,$("#select-vars-regex").val(),true)});
    $("#pretty-deselect-regex-vars-button").click(function () { setRegexVars(tf,$("#select-vars-regex").val(),false)});
    $("#pretty-refresh-problem-button").click(function () { rerender(tf); });

    $("#pretty-select-all-cons-button").click(function () { setAllCons(tf,true)});
    $("#pretty-deselect-all-cons-button").click(function () { setAllCons(tf,false)});
    $("#select-cons-regex").keyup(function (e) { if (e.originalEvent.keyCode == 13) setRegexVars(tf,$("#select-cons-regex").val(),true)});
    $("#pretty-select-regex-cons-button").click(function () { setRegexCons(tf,$("#select-cons-regex").val(),true)});
    $("#pretty-deselect-regex-cons-button").click(function () { setRegexCons(tf,$("#select-cons-regex").val(),false)});
    $("#pretty-refresh-problem-button").click(function () { rerender(tf); });

}
