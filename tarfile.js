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

    var asciidecoder = new TextDecoder('utf-8');

    var namelen = 0; while (namelen < 100 && head.getUint8(namelen) != 0) ++namelen;

    var filename = asciidecoder.decode(new Uint8Array(this.data,this.pos,namelen));
    this.curentry_name = filename;

    var sizebuf = new Uint8Array(this.data,this.pos+124,12);
    var size = 0;
    if (sizebuf[0] == 0x80)
    {
        for (var i = 1; i < 12; ++i)
        {
            size = (size << 8) + sizebuf[i];
        }
    }
    else // octal - never happens
    {
        for (var i = 0; i < 11; ++i)
        {
            size = (size << 3) + (sizebuf[i]-48);
        }
    }
    this.curentry_size = size;
    var roundsize = size+512; 
    if (size % 512 != 0) roundsize += (512-size%512);
    this.next_pos = this.pos+roundsize;

    //console.log("pos",this.pos,sizebuf)
    //console.log("filename",filename,size,roundsize);

    this.curentry_data = new DataView(this.data,this.pos+512,size);
}

function TarFile_nextentry()
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



