"use strict"
/*
    0 char name[100];
  100 char mode[8];
  108 char uid [8];
  116 char gid[8];
  124 char size[12];
  136 char mtime[12];
  142 char chksum[8];
  150 char typeflag;
  151 char linkname[100];
  251 char magic[6];
  char version[2];
  char uname[32];
  char gname[32];
  char devmajor[8];
  char devminor[8];
  char prefix[155];
*/
function TarFile_readentry()
{
    var head = new DataView(this.data,this.pos,512);

    var asciidecoder = new StringDecoder('ascii');

    var nameend = 0; while (nameend < 100 && head.getUint8(nameend) != 0) ++nameend;

    this.curentry_name = asciidecoder.decode(new Uint8Array(head,0,nameend));

    var sizebuf = new Uint8Array(this.data,124,12);
    var size = 0;
    if (sizebuf[0] == 0x80)
    {
        for (var i = 1; i < 12; ++i):
        {
            size = size * 256 + sizebug[i];
        }
    }
    else // octal - never happens
    {
    }
    this.curentry_size = size;
    var roundsize = size; 
    if (size % 512 != 0) roundsize += (512-size%512);
    this.next_pos = this.pos+512+roundsize;

    this.curentry_data = new DataView(this.data,this.pos+512,size);
}

function TarFile_next()
{
    this.pos = this.next_pos;
    if (! this.eof() )
    {
        this.read_entry()
        return true;
    }
    else
    {
        return false;
    }
}

function TarFile_eof()
{
    return !(this.pos < this.data.byteLength);
}


function TarFile(data)
{
    this.data = data;
    this.pos  = 0;

    this.curentry_name = null;
    this.curentry_size = 0;
    this.curentry_data = null;

    this.next_pos = 0;

    this.read_entry = TarFile_readentry;
    this.next_entry = TarFile_nextentry;
    this.eof        = TarFile_eof;
    this.forall     = function (h) { while (this.next_entry()) { h(this.curentry_name, this.curentry_data); } }
}



