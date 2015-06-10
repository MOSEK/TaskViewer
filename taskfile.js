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

function Int64Array(data,pos,num)
{
    var res = new Int32Array(num);
    for (var i = 0; i < num; ++i) res[i] = data.getInt32(pos+8*i);
}

var dataviewfunc = {
    TP_INT8    : function (data,pos,num) { return new Int8Array(data,pos,num); },
    TP_INT16   : function (data,pos,num) { return new Int16Array(data,pos,num); },
    TP_INT32   : function (data,pos,num) { return new Int32Array(data,pos,num); },
    TP_INT64   : function (data,pos,num) { return Int64Array(data,pos,num); },
    TP_FLOAT64 : function (data,pos,num) { return Float32Array(data,pos,num); } };
var datasize = {
    TP_INT8    : 1,
    TP_INT16   : 2,
    TP_INT32   : 4,
    TP_INT64   : 8,
    TP_FLOAT64 : 8 };

function TaskFile_readmatrix(data)
{
    var bom = data.getInt32(0,true);
    var fmt = data.getUint8(4,true);
    //--  padding 1 byte
    var vt   = data.getUint8(6,true);
    var it   = data.getUint8(7,true);
    var dimi = data.getUint32(8,true); // disregard upper 32 bits
    var dimj = data.getUint32(16,true); // disregard upper 32 bits
    var num  = data.getUint32(24,true); // disregard upper 32 bits
    var nrow = data.getUint32(32,true);
    //--  padding 4 bytes

    var is_symmetric    = (MATRIX_FMT_SYMMETRIC & fmt) != 0;
    var is_sparse       = (MATRIX_FMT_SPARSE    & fmt) != 0;
    var is_packed       = (MATRIX_FMT_PACKED    & fmt) != 0;
    var is_row_oriented = (MATRIX_FMT_ROW       & fmt) != 0;

    if (is_sparse)
    {
        return {
            'type'  : 'sparse',
            'dimi'  : dimi,
            'dimj'  : dimj,
            'nnz'   : num,
            'subi'  : dataviewfunc[it](this.data,40,num),
            'subj'  : dataviewfunc[it](this.data,40+num*datasize[it],num),
            'valij' : dataviewfunc[vt](this.data,40+num*datasize[it]*2,num)
        };
    }
    else if (is_packed)
    {
        var rowlen = dataviewfunc[it](this.data,40+nrow*datasize[it],nrow);
        var ptrb = new Int32Array(nrow+1);
        for (var i = 0; i < nrow; ++i) ptrb[i+1] = ptrb[i]+rowlen[i];
        return {
            'type'    : 'packed',
            'dimi'    : dimi,
            'dimj'    : dimj,
            'nnz'     : num,
            'rowpack' : is_row_oriented,
            'subi'    : dataviewfunc[it](this.data,40,nrow)
            'ptrb'    : ptrb,
            'subj'    : dataviewfunc[it](this.data,40+nrow*datasize[it]*2,num),
            'valij'   : dataviewfunc[it](this.data,40+nrow*datasize[it]*2+num*datasize[vt],num) 
        };
    }
    else // dense
    {
        return { 
            'type' : 'dense',
            'dimi' : dimi,
            'dimj' : dimj,
            'nnz'  : num,
            'data' : dataviewfunc[it](this.data,40,num) 
        };
    }
}
