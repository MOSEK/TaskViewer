var MATRIX_FMT_SYMMETRIC = 0x01;
var MATRIX_FMT_SPARSE    = 0x02;
var MATRIX_FMT_DENSE     = 0x00;
var MATRIX_FMT_PACKED    = 0x04;
var MATRIX_FMT_ROW       = 0x08;
var MATRIX_FMT_COLUMN    = 0x00;


var TP_VOID     = 0;
var TP_INT8     = 1;
var TP_INT16    = 2;
var TP_INT32    = 3;
var TP_INT64    = 4;
var TP_FLOAT32  = 8;
var TP_FLOAT64  = 9;
var TP_FLOAT128 = 10;

var MSK_BK_LO = 108; // 'l'
var MSK_BK_UP = 117; // 'u'
var MSK_BK_FX = 120; // 'x'
var MSK_BK_FR = 102; // 'f'
var MSK_BK_RA = 114; // 'r'

var MSK_CT_QUAD  = 113; // quad
var MSK_CT_RQUAD = 114; // rquad


function Int64Array(data,pos,num)
{
    var tmp = new Int32Array(data,pos,num*2);
    var res = new Int32Array(num);
    for (var i = 0; i < num; ++i) res[i] = tmp[i*2];
    //console.log("-- Int64Array");
    //console.log(tmp);
    //console.log(res);
    return res;
}

var dataviewfunc = {};
dataviewfunc[TP_INT8]    = function (data,pos,num) { return new Int8Array(data,pos,num); };
dataviewfunc[TP_INT16]   = function (data,pos,num) { return new Int16Array(data,pos,num); };
dataviewfunc[TP_INT32]   = function (data,pos,num) { return new Int32Array(data,pos,num); };
dataviewfunc[TP_INT64]   = function (data,pos,num) { return Int64Array(data,pos,num); };
dataviewfunc[TP_VOID]    = function (data,pos,num) { return null; };
dataviewfunc[TP_FLOAT64] = function (data,pos,num) { return new Float64Array(data,pos,num); };

var datasize = {};
datasize[TP_INT8]    = 1;
datasize[TP_INT16]   = 2;
datasize[TP_INT32]   = 4;
datasize[TP_INT64]   = 8;
datasize[TP_FLOAT64] = 8;


function Solution(status)
{
    this.status = status;
    this.skx    = null;    
    this.xx     = null;
    this.slx    = null;
    this.sux    = null;
    this.snx    = null;
    this.skc    = null;
    this.xc     = null;
    this.y      = null;
    this.slc    = null;
    this.suc    = null;
    this.skn    = null;
    this.barx   = null;
    this.bars   = null;
}


function transpose(m)
{
    if (m.type == 'packed')
    {

        var subi = m.subi;
        var subj = m.subj;
        var dimi = m.dimi;
        var dimj = m.dimj;

        var num  = m.nnz;
        var val  = m.valij;
        var ptrb = m.ptrb;

        var ncols = m.rowpack ? m.dimj : m.dimi;
        var colptrb = new Int32Array(ncols+1);


        for (var i = 0; i < ptrb.length-1; ++i)
            for (var k = ptrb[i]; k < ptrb[i+1]; ++k)
                ++ colptrb[subj[k]+1];
        for (var i = 0; i < colptrb.length; ++i)
            colptrb[i+1] += colptrb[i];

        var colsubj = new Int32Array(num)
        var colval  = new Float64Array(num)

        for (var i = 0; i < ptrb.length-1; ++i)
        {
            for (var k = ptrb[i]; k < ptrb[i+1]; ++k)
            {
                colsubj[colptrb[subj[k]]] = subi[i];
                colval [colptrb[subj[k]]] = val[k];
                ++colptrb[subj[k]];
            }
        }
        var colsubi = new Int32Array(ncols); for (var i = 0; i < ncols; ++i) colsubi[i] = i;

        for (var i = colptrb.length-1; i > 0; --i)
            colptrb[i] = colptrb[i-1];
        colptrb[0] = 0;

        return { 
            'type'    : 'packed',
            'dimi'    : dimi,
            'dimj'    : dimj,
            'nnz'     : m.nnz,
            'rowpack' : ! m.is_row_oriented,
            'subi'    : colsubi,
            'ptrb'    : colptrb,
            'subj'    : colsubj,
            'valij'   : colval,
        }
    }
}

function parsematrix(data) // data is the original ArrayBuffer
{
    var bom = data.getInt32(0,true);    // "MSKM"
    var fmt = data.getUint8(4,true);
    //--  padding 1 byte
    var vt   = data.getUint8(6,true);
    var it   = data.getUint8(7,true);
    var dimi = data.getUint32(8,true);  // disregard upper 32 bits
    var dimj = data.getUint32(16,true); // disregard upper 32 bits
    var num  = data.getUint32(24,true); // disregard upper 32 bits
    var nrow = data.getUint32(32,true);
    //--  padding 4 bytes

    var is_symmetric    = (MATRIX_FMT_SYMMETRIC & fmt) != 0;
    var is_sparse       = (MATRIX_FMT_SPARSE    & fmt) != 0;
    var is_packed       = (MATRIX_FMT_PACKED    & fmt) != 0;
    var is_row_oriented = (MATRIX_FMT_ROW       & fmt) != 0;

    var databuf = data.buffer;
    var dataofs = data.byteOffset+40;

    if (is_sparse)
    {
        return {
            'type'  : 'sparse',
            'dimi'  : dimi,
            'dimj'  : dimj,
            'nnz'   : num,
            'subi'  : dataviewfunc[it](databuf,dataofs,num),
            'subj'  : dataviewfunc[it](databuf,dataofs+num*datasize[it],num),
            'valij' : dataviewfunc[vt](databuf,dataofs+num*datasize[it]*2,num)
        };
    }
    else if (is_packed)
    {
        var subi = dataviewfunc[it](databuf,dataofs,nrow);
        var rowlen = dataviewfunc[it](databuf,dataofs+nrow*datasize[it],nrow);
        var subj = dataviewfunc[it](databuf,dataofs+nrow*datasize[it]*2,num);
        var valbase = ( dataofs + datasize[it]*(nrow*2+num));
        if (valbase % 8 == 0)
            var val = dataviewfunc[vt](databuf,valbase,num);
        else
        {
            var val = new Float64Array(num);
            var valview = new DataView(databuf,valbase,num*8);
            for (var i = 0; i < num; ++i) val[i] = valview.getFloat64(i*8,true);
        }


        var ptrb = new Int32Array(nrow+1);
        for (var i = 0; i < nrow; ++i) ptrb[i+1] = ptrb[i]+rowlen[i];



        // A is column based, so we need to sort by rows

        return {
            'type'    : 'packed',
            'dimi'    : dimi,
            'dimj'    : dimj,
            'nnz'     : num,
            'rowpack' : is_row_oriented,
            'subi'    : subi,
            'ptrb'    : ptrb,
            'subj'    : subj,
            'valij'   : val
        };
    }
    else // dense
    {
        //console.log("-----------")
        //console.log("num = "+num+",data ofs = "+dataofs);

        var d = dataviewfunc[vt](databuf,dataofs,num);

        var arr = new Array(d.length); for (var i = 0; i < d.length; ++i) { arr[i] = d[i] ; }
        
        //console.log(arr.join(","))
        //console.log("res.data  = "+d);
        //console.log("res.data.length  = "+d.length);

        return { 
            'type' : 'dense',
            'dimi' : dimi,
            'dimj' : dimj,
            'nnz'  : num,
            'data' : d
        };
    }
}

function TaskFile(data)
{
    this.tf = new TarFile(data);

    // INFO
    this.mosekver   = null;
    this.taskname   = null;
    this.numvar     = 0;
    this.numcon     = 0;
    this.numcone    = 0;
    this.numbarvar  = 0;
    this.numanz     = 0;
    this.numqnz     = 0;
    this.numsymmat  = 0;
    this.objsense   = 0;
    this.objname    = 0;

    // data
    this.A        = null;
    this.c        = null;
    this.cfix     = null;
    this.conbk    = null;
    this.varbk    = null;
    this.conbound = null;
    this.varbound = null;
    this.intvaridxs = null;
    this.connames = null;
    this.varnames = null;
    this.conenames = null;
    this.barvarnames = null;
    this.barcalpha = null;
    this.barcsparsity = null;
    this.baraalpha = null;
    this.barasparsity = null;


    this.qconetype = null;
    this.qconesub  = null;

    // solutions
    this.solbas = null;
    this.solitr = null;
    this.solitg = null;

    // parameters
    this.stringparameters  = null;
    this.integerparameters = null;
    this.doubleparameers   = null;

    var utf8decoder = new TextDecoder('utf-8');

    this.tf.next_entry();
    if (this.tf.curentry_name == 'Task/INFO')
    {
        var items = utf8decoder.decode(this.tf.curentry_data).split("\n");
        for (var i in items)
        {
            var keyval = items[i].split("=");
            if (keyval.length == 2)
            {
                if      (keyval[0] == "mosekver")  this.mosekver  = keyval[1];
                else if (keyval[0] == "taskname")  this.taskname  = keyval[1];
                else if (keyval[0] == "numvar")    this.numvar    = parseInt(keyval[1]);
                else if (keyval[0] == "numcon")    this.numcon    = parseInt(keyval[1]);
                else if (keyval[0] == "numcone")   this.numcone   = parseInt(keyval[1]);
                else if (keyval[0] == "numbarvar") this.numbarvar = parseInt(keyval[1]);
                else if (keyval[0] == "numanz")    this.numanz    = parseInt(keyval[1]);
                else if (keyval[0] == "numqnz")    this.numqnz    = parseInt(keyval[1]);
                else if (keyval[0] == "numsymmat") this.numsymmat = parseInt(keyval[1]);
                else if (keyval[0] == "objsense")  this.objsense  = keyval[1];
                else if (keyval[0] == "objname")   this.objname   = keyval[1];
            }
        }
    }

    while ( this.tf.next_entry() )
    {
        if      (this.tf.curentry_name == 'Task/data/A')
        {
            console.log("A:")
            this.A = transpose(parsematrix(this.tf.curentry_data));
            console.log("A transposed");
            console.log(this.A);
        }
        else if (this.tf.curentry_name == 'Task/data/c')
        {
            this.c = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/cfix')
        {
        }
        else if (this.tf.curentry_name == 'Task/data/var/name')
        {
            this.varnames = utf8decoder.decode(this.tf.curentry_data).split("\n");
            for (var i in this.varnames)
            {
                if (this.varnames[i].length == 0)
                    this.varnames[i] = "x#"+i;
            }
        }
        else if (this.tf.curentry_name == 'Task/data/var/boundkey')
        {
            this.varbk = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/var/bound')
        {
            this.varbound = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/intvar')
        {
            this.intvaridxs = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/con/name')
        {
            this.connames = utf8decoder.decode(this.tf.curentry_data).split("\n");
            for (var i in this.connames)
            {
                if (this.connames[i].length == 0)
                    this.connames[i] = "con#"+i;
            }
        }
        else if (this.tf.curentry_name == 'Task/data/con/boundkey')
        {
            this.conbk = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/con/bound')
        {
            this.conbound = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/qcone/name')
        {
            this.conenames = utf8decoder.decode(this.tf.curentry_data).split("\n");
            for (var i in this.conenames)
            {
                if (this.conenames[i].length == 0)
                    this.conenames[i] = "cone#"+i;
            }
        }
        else if (this.tf.curentry_name == 'Task/data/barvar/name')
        {
            this.barvarnames = utf8decoder.decode(this.tf.curentry_data).split("\n");
            for (var i in this.barvarnames)
            {
                if (this.barvarnames[i].length == 0)
                    this.barvarnames[i] = "barvar#"+i;
            }
        }

        else if (this.tf.curentry_name == 'Task/data/barvar/dim')
        {
            this.barvardim = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/barc/alpha')
        {
            //console.log("read barc/alpha");
            this.barcalpha = parsematrix(this.tf.curentry_data);
        }
        else if (this.tf.curentry_name == 'Task/data/barc/sparsity')
        {
            this.barcsparsity = parsematrix(this.tf.curentry_data).subj;
        }
        else if (this.tf.curentry_name == 'Task/data/bara/alpha')
        {
            this.baraalpha = parsematrix(this.tf.curentry_data);
        }
        else if (this.tf.curentry_name == 'Task/data/bara/sparsity')
        {
            this.barasparsity = parsematrix(this.tf.curentry_data);
        }

        else if (this.tf.curentry_name == 'Task/data/qcone/conetype')
        {
            this.qconetype = parsematrix(this.tf.curentry_data).data;
        }
        else if (this.tf.curentry_name == 'Task/data/qcone/sub')
        {
            this.qconesub = parsematrix(this.tf.curentry_data);
        }

        else if (this.tf.curentry_name == 'Task/parameter/sparam')
        {
            var lines = utf8decoder.decode(this.tf.curentry_data).split("\n");
            var keyval = new Array();
            for (var i in lines)
            {
                var item = lines[i].split("=");
                if (item.length == 2)
                    keyval[keyval.length] = [item[0].trim(),item[1].trim()];
            }
            this.stringparameters = keyval;
        }
        else if (this.tf.curentry_name == 'Task/parameter/iparam')
        {
            var lines = utf8decoder.decode(this.tf.curentry_data).split("\n");
            var keyval = new Array();
            for (var i in lines)
            {
                var item = lines[i].split("=");
                if (item.length == 2)
                    keyval[keyval.length] = [item[0].trim(),item[1].trim()];
            }
            this.integerparameters = keyval;
        }
        else if (this.tf.curentry_name == 'Task/parameter/dparam')
        {
            var lines = utf8decoder.decode(this.tf.curentry_data).split("\n");
            var keyval = new Array();
            for (var i in lines)
            {
                var item = lines[i].split("=");
                if (item.length == 2)
                {
                    keyval[keyval.length] = [item[0].trim(),item[1].trim().split(" ")[1]];
                }
            }
            this.doubleparameters = keyval;
        }
        //--------------------------------
        //-- Solutions -------------------
        else if (this.tf.curentry_name == 'Task/solution/basic/status')
            this.solbas = new Solution();
        else if (this.tf.curentry_name == 'Task/solution/interior/status')
            this.solitr = new Solution();
        else if (this.tf.curentry_name == 'Task/solution/integer/status')
            this.solitg = new Solution();
        else if (this.tf.curentry_name.match('Task/solution') != null)
        {
            var p = this.tf.curentry_name.split('/');
            var whichsol = p[2];
            var whichitem = p[3];

            var sol = ( whichsol == "basic" ? this.solbas :
                        ( whichsol == 'interior' ? this.solitr :
                          solitg ));

            if (whichitem == "skx" ||
                whichitem == "xx"  ||
                whichitem == "slx" ||
                whichitem == "sux" ||
                whichitem == "xc"  ||
                whichitem == "y"   ||
                whichitem == "skc" ||
                whichitem == "slc" ||
                whichitem == "suc" ||
                whichitem == "snx" ||
                whichitem == "skn" )
                sol[whichitem] = parsematrix(this.tf.curentry_data).data;
            else if ( whichitem == "barx" || 
                      whichitem == "bars" )
            {
            }
        }
    }

}
