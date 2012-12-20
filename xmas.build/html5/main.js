
//Change this to true for a stretchy canvas!
//
var RESIZEABLE_CANVAS=false;

//Start us up!
//
window.onload=function( e ){

	if( RESIZEABLE_CANVAS ){
		window.onresize=function( e ){
			var canvas=document.getElementById( "GameCanvas" );

			//This vs window.innerWidth, which apparently doesn't account for scrollbar?
			var width=document.body.clientWidth;
			
			//This vs document.body.clientHeight, which does weird things - document seems to 'grow'...perhaps canvas resize pushing page down?
			var height=window.innerHeight;			

			canvas.width=width;
			canvas.height=height;
		}
		window.onresize( null );
	}
	
	game_canvas=document.getElementById( "GameCanvas" );
	
	game_console=document.getElementById( "GameConsole" );

	try{
	
		bbInit();
		bbMain();
		
		if( game_runner!=null ) game_runner();
		
	}catch( err ){
	
		alertError( err );
	}
}

var game_canvas;
var game_console;
var game_runner;

//${CONFIG_BEGIN}
CFG_BINARY_FILES="*.bin|*.dat";
CFG_CD="";
CFG_CONFIG="debug";
CFG_HOST="winnt";
CFG_IMAGE_FILES="*.png|*.jpg";
CFG_LANG="js";
CFG_MODPATH=".;C:/Users/Chris/Documents/GitHub/CM-XMAS-2012;C:/apps/MonkeyPro66/modules";
CFG_MOJO_AUTO_SUSPEND_ENABLED="0";
CFG_MUSIC_FILES="*.wav|*.ogg|*.mp3|*.m4a";
CFG_OPENGL_GLES20_ENABLED="0";
CFG_SAFEMODE="0";
CFG_SOUND_FILES="*.wav|*.ogg|*.mp3|*.m4a";
CFG_TARGET="html5";
CFG_TEXT_FILES="*.txt|*.xml|*.json";
CFG_TRANSDIR="";
//${CONFIG_END}

//${METADATA_BEGIN}
var META_DATA="[gfx/background.png];type=image/png;width=320;height=240;\n[gfx/xmas_sprites.png];type=image/png;width=512;height=512;\n[mojo_font.png];type=image/png;width=864;height=13;\n";
//${METADATA_END}

function getMetaData( path,key ){

	if( path.toLowerCase().indexOf("monkey://data/")!=0 ) return "";
	path=path.slice(14);

	var i=META_DATA.indexOf( "["+path+"]" );
	if( i==-1 ) return "";
	i+=path.length+2;

	var e=META_DATA.indexOf( "\n",i );
	if( e==-1 ) e=META_DATA.length;

	i=META_DATA.indexOf( ";"+key+"=",i )
	if( i==-1 || i>=e ) return "";
	i+=key.length+2;

	e=META_DATA.indexOf( ";",i );
	if( e==-1 ) return "";

	return META_DATA.slice( i,e );
}

function fixDataPath( path ){
	if( path.toLowerCase().indexOf("monkey://data/")==0 ) return "data/"+path.slice(14);
	return path;
}

function openXMLHttpRequest( req,path,async ){

	path=fixDataPath( path );
	
	var xhr=new XMLHttpRequest;
	xhr.open( req,path,async );
	return xhr;
}

function loadArrayBuffer( path ){

	var xhr=openXMLHttpRequest( "GET",path,false );

	if( xhr.overrideMimeType ) xhr.overrideMimeType( "text/plain; charset=x-user-defined" );

	xhr.send( null );
	
	if( xhr.status!=200 && xhr.status!=0 ) return null;

	var r=xhr.responseText;
	var buf=new ArrayBuffer( r.length );

	for( var i=0;i<r.length;++i ){
		this.dataView.setInt8( i,r.charCodeAt(i) );
	}
	return buf;
}

function loadString( path ){
	path=fixDataPath( path );
	var xhr=new XMLHttpRequest();
	xhr.open( "GET",path,false );
	xhr.send( null );
	if( (xhr.status==200) || (xhr.status==0) ) return xhr.responseText;
	return "";
}

function loadImage( path,onloadfun ){

	var ty=getMetaData( path,"type" );
	if( ty.indexOf( "image/" )!=0 ) return null;

	var image=new Image();
	
	image.meta_width=parseInt( getMetaData( path,"width" ) );
	image.meta_height=parseInt( getMetaData( path,"height" ) );
	image.onload=onloadfun;
	image.src="data/"+path.slice(14);
	
	return image;
}

function loadAudio( path ){

	path=fixDataPath( path );
	
	var audio=new Audio( path );
	return audio;
}

//${TRANSCODE_BEGIN}

// Javascript Monkey runtime.
//
// Placed into the public domain 24/02/2011.
// No warranty implied; use at your own risk.

//***** JavaScript Runtime *****

var D2R=0.017453292519943295;
var R2D=57.29577951308232;

var err_info="";
var err_stack=[];

var dbg_index=0;

function push_err(){
	err_stack.push( err_info );
}

function pop_err(){
	err_info=err_stack.pop();
}

function stackTrace(){
	if( !err_info.length ) return "";
	var str=err_info+"\n";
	for( var i=err_stack.length-1;i>0;--i ){
		str+=err_stack[i]+"\n";
	}
	return str;
}

function print( str ){
	if( game_console ){
		game_console.value+=str+"\n";
		game_console.scrollTop = game_console.scrollHeight - game_console.clientHeight;
	}
	if( window.console!=undefined ){
		window.console.log( str );
	}
	return 0;
}

function alertError( err ){
	if( typeof(err)=="string" && err=="" ) return;
	alert( "Monkey Runtime Error : "+err.toString()+"\n\n"+stackTrace() );
}

function error( err ){
	throw err;
}

function debugLog( str ){
	print( str );
}

function debugStop(){
	error( "STOP" );
}

function dbg_object( obj ){
	if( obj ) return obj;
	error( "Null object access" );
}

function dbg_array( arr,index ){
	if( index<0 || index>=arr.length ) error( "Array index out of range" );
	dbg_index=index;
	return arr;
}

function new_bool_array( len ){
	var arr=Array( len );
	for( var i=0;i<len;++i ) arr[i]=false;
	return arr;
}

function new_number_array( len ){
	var arr=Array( len );
	for( var i=0;i<len;++i ) arr[i]=0;
	return arr;
}

function new_string_array( len ){
	var arr=Array( len );
	for( var i=0;i<len;++i ) arr[i]='';
	return arr;
}

function new_array_array( len ){
	var arr=Array( len );
	for( var i=0;i<len;++i ) arr[i]=[];
	return arr;
}

function new_object_array( len ){
	var arr=Array( len );
	for( var i=0;i<len;++i ) arr[i]=null;
	return arr;
}

function resize_bool_array( arr,len ){
	var i=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=false;
	return arr;
}

function resize_number_array( arr,len ){
	var i=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=0;
	return arr;
}

function resize_string_array( arr,len ){
	var i=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]="";
	return arr;
}

function resize_array_array( arr,len ){
	var i=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=[];
	return arr;
}

function resize_object_array( arr,len ){
	var i=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=null;
	return arr;
}

function string_compare( lhs,rhs ){
	var n=Math.min( lhs.length,rhs.length ),i,t;
	for( i=0;i<n;++i ){
		t=lhs.charCodeAt(i)-rhs.charCodeAt(i);
		if( t ) return t;
	}
	return lhs.length-rhs.length;
}

function string_replace( str,find,rep ){	//no unregex replace all?!?
	var i=0;
	for(;;){
		i=str.indexOf( find,i );
		if( i==-1 ) return str;
		str=str.substring( 0,i )+rep+str.substring( i+find.length );
		i+=rep.length;
	}
}

function string_trim( str ){
	var i=0,i2=str.length;
	while( i<i2 && str.charCodeAt(i)<=32 ) i+=1;
	while( i2>i && str.charCodeAt(i2-1)<=32 ) i2-=1;
	return str.slice( i,i2 );
}

function string_startswith( str,substr ){
	return substr.length<=str.length && str.slice(0,substr.length)==substr;
}

function string_endswith( str,substr ){
	return substr.length<=str.length && str.slice(str.length-substr.length,str.length)==substr;
}

function string_tochars( str ){
	var arr=new Array( str.length );
	for( var i=0;i<str.length;++i ) arr[i]=str.charCodeAt(i);
	return arr;
}

function string_fromchars( chars ){
	var str="",i;
	for( i=0;i<chars.length;++i ){
		str+=String.fromCharCode( chars[i] );
	}
	return str;
}

function object_downcast( obj,clas ){
	if( obj instanceof clas ) return obj;
	return null;
}

function object_implements( obj,iface ){
	if( obj && obj.implments && obj.implments[iface] ) return obj;
	return null;
}

function extend_class( clas ){
	var tmp=function(){};
	tmp.prototype=clas.prototype;
	return new tmp;
}

function ThrowableObject(){
}

ThrowableObject.prototype.toString=function(){ 
	return "Uncaught Monkey Exception"; 
}

// Note: Firefox doesn't support DataView, so we have to kludge...
//
// This means pokes/peeks must be naturally aligned, but data has to be in WebGL anyway so that's OK for now.
//
function BBDataBuffer(){
	this.arrayBuffer=null;
	this.dataView=null;
	this.length=0;
}

BBDataBuffer.prototype._Init=function( buffer ){
	this.arrayBuffer=buffer;
	this.dataView=new DataView( buffer );
	this.length=buffer.byteLength;
}

BBDataBuffer.prototype._New=function( length ){
	if( this.arrayBuffer ) return false;
	
	var buf=new ArrayBuffer( length );
	if( !buf ) return false;
	
	this._Init( buf );
	return true;
}

BBDataBuffer.prototype._Load=function( path ){
	if( this.arrayBuffer ) return false;
	
	var buf=loadArrayBuffer( path );
	if( !buf ) return false;
	
	_Init( buf );
	return true;
}

BBDataBuffer.prototype.Length=function(){
	return this.length;
}

BBDataBuffer.prototype.Discard=function(){
	if( this.arrayBuffer ){
		this.arrayBuffer=null;
		this.dataView=null;
		this.length=0;
	}
}

BBDataBuffer.prototype.PokeByte=function( addr,value ){
	this.dataView.setInt8( addr,value );
}

BBDataBuffer.prototype.PokeShort=function( addr,value ){
	this.dataView.setInt16( addr,value );	
}

BBDataBuffer.prototype.PokeInt=function( addr,value ){
	this.dataView.setInt32( addr,value );	
}

BBDataBuffer.prototype.PokeFloat=function( addr,value ){
	this.dataView.setFloat32( addr,value );	
}

BBDataBuffer.prototype.PeekByte=function( addr ){
	return this.dataView.getInt8( addr );
}

BBDataBuffer.prototype.PeekShort=function( addr ){
	return this.dataView.getInt16( addr );
}

BBDataBuffer.prototype.PeekInt=function( addr ){
	return this.dataView.getInt32( addr );
}

BBDataBuffer.prototype.PeekFloat=function( addr ){
	return this.dataView.getFloat32( addr );
}

// HTML5 mojo runtime.
//
// Copyright 2011 Mark Sibly, all rights reserved.
// No warranty implied; use at your own risk.

var gl=null;	//global WebGL context - a bit rude!

KEY_LMB=1;
KEY_RMB=2;
KEY_MMB=3;
KEY_TOUCH0=0x180;

function eatEvent( e ){
	if( e.stopPropagation ){
		e.stopPropagation();
		e.preventDefault();
	}else{
		e.cancelBubble=true;
		e.returnValue=false;
	}
}

function keyToChar( key ){
	switch( key ){
	case 8:
	case 9:
	case 13:
	case 27:
	case 32:
		return key;
	case 33:
	case 34:
	case 35:
	case 36:
	case 37:
	case 38:
	case 39:
	case 40:
	case 45:
		return key | 0x10000;
	case 46:
		return 127;
	}
	return 0;
}

//***** gxtkApp class *****

function gxtkApp(){

	if( CFG_OPENGL_GLES20_ENABLED=="1" ){
		this.gl=game_canvas.getContext( "webgl" );
		if( !this.gl ) this.gl=game_canvas.getContext( "experimental-webgl" );
	}else{
		this.gl=null;
	}

	this.graphics=new gxtkGraphics( this,game_canvas );
	this.input=new gxtkInput( this );
	this.audio=new gxtkAudio( this );

	this.loading=0;
	this.maxloading=0;

	this.updateRate=0;
	this.startMillis=(new Date).getTime();
	
	this.dead=false;
	this.suspended=false;
	
	var app=this;
	var canvas=game_canvas;
	
	function gxtkMain(){
	
		var input=app.input;
	
		canvas.onkeydown=function( e ){
			input.OnKeyDown( e.keyCode );
			var chr=keyToChar( e.keyCode );
			if( chr ) input.PutChar( chr );
			if( e.keyCode<48 || (e.keyCode>111 && e.keyCode<122) ) eatEvent( e );
		}

		canvas.onkeyup=function( e ){
			input.OnKeyUp( e.keyCode );
		}

		canvas.onkeypress=function( e ){
			if( e.charCode ){
				input.PutChar( e.charCode );
			}else if( e.which ){
				input.PutChar( e.which );
			}
		}

		canvas.onmousedown=function( e ){
			switch( e.button ){
			case 0:input.OnKeyDown( KEY_LMB );break;
			case 1:input.OnKeyDown( KEY_MMB );break;
			case 2:input.OnKeyDown( KEY_RMB );break;
			}
			eatEvent( e );
		}
		
		canvas.onmouseup=function( e ){
			switch( e.button ){
			case 0:input.OnKeyUp( KEY_LMB );break;
			case 1:input.OnKeyUp( KEY_MMB );break;
			case 2:input.OnKeyUp( KEY_RMB );break;
			}
			eatEvent( e );
		}
		
		canvas.onmouseout=function( e ){
			input.OnKeyUp( KEY_LMB );
			input.OnKeyUp( KEY_MMB );
			input.OnKeyUp( KEY_RMB );
			eatEvent( e );
		}

		canvas.onmousemove=function( e ){
			var x=e.clientX+document.body.scrollLeft;
			var y=e.clientY+document.body.scrollTop;
			var c=canvas;
			while( c ){
				x-=c.offsetLeft;
				y-=c.offsetTop;
				c=c.offsetParent;
			}
			input.OnMouseMove( x,y );
			eatEvent( e );
		}

		canvas.onfocus=function( e ){
			if( CFG_MOJO_AUTO_SUSPEND_ENABLED=="1" ){
				app.InvokeOnResume();
			}
		}
		
		canvas.onblur=function( e ){
			if( CFG_MOJO_AUTO_SUSPEND_ENABLED=="1" ){
				app.InvokeOnSuspend();
			}
		}
		
		canvas.ontouchstart=function( e ){
			for( var i=0;i<e.changedTouches.length;++i ){
				var touch=e.changedTouches[i];
				var x=touch.pageX;
				var y=touch.pageY;
				var c=canvas;
				while( c ){
					x-=c.offsetLeft;
					y-=c.offsetTop;
					c=c.offsetParent;
				}
				input.OnTouchStart( touch.identifier,x,y );
			}
			eatEvent( e );
		}
		
		canvas.ontouchmove=function( e ){
			for( var i=0;i<e.changedTouches.length;++i ){
				var touch=e.changedTouches[i];
				var x=touch.pageX;
				var y=touch.pageY;
				var c=canvas;
				while( c ){
					x-=c.offsetLeft;
					y-=c.offsetTop;
					c=c.offsetParent;
				}
				input.OnTouchMove( touch.identifier,x,y );
			}
			eatEvent( e );
		}
		
		canvas.ontouchend=function( e ){
			for( var i=0;i<e.changedTouches.length;++i ){
				input.OnTouchEnd( e.changedTouches[i].identifier );
			}
			eatEvent( e );
		}
		
		window.ondevicemotion=function( e ){
			var tx=e.accelerationIncludingGravity.x/9.81;
			var ty=e.accelerationIncludingGravity.y/9.81;
			var tz=e.accelerationIncludingGravity.z/9.81;
			var x,y;
			switch( window.orientation ){
			case   0:x=+tx;y=-ty;break;
			case 180:x=-tx;y=+ty;break;
			case  90:x=-ty;y=-tx;break;
			case -90:x=+ty;y=+tx;break;
			}
			input.OnDeviceMotion( x,y,tz );
			eatEvent( e );
		}

		canvas.focus();

		app.InvokeOnCreate();
		app.InvokeOnRender();
	}

	game_runner=gxtkMain;
}

var timerSeq=0;

gxtkApp.prototype.SetFrameRate=function( fps ){

	var seq=++timerSeq;
	
	if( !fps ) return;
	
	var app=this;
	var updatePeriod=1000.0/fps;
	var nextUpdate=(new Date).getTime()+updatePeriod;
	
	function timeElapsed(){
		if( seq!=timerSeq ) return;

		var time;		
		var updates=0;

		for(;;){
			nextUpdate+=updatePeriod;

			app.InvokeOnUpdate();
			if( seq!=timerSeq ) return;
			
			if( nextUpdate>(new Date).getTime() ) break;
			
			if( ++updates==7 ){
				nextUpdate=(new Date).getTime();
				break;
			}
		}
		app.InvokeOnRender();
		if( seq!=timerSeq ) return;
			
		var delay=nextUpdate-(new Date).getTime();
		setTimeout( timeElapsed,delay>0 ? delay : 0 );
	}
	
	setTimeout( timeElapsed,updatePeriod );
}

gxtkApp.prototype.IncLoading=function(){
	++this.loading;
	if( this.loading>this.maxloading ) this.maxloading=this.loading;
	if( this.loading==1 ) this.SetFrameRate( 0 );
}

gxtkApp.prototype.DecLoading=function(){
	--this.loading;
	if( this.loading!=0 ) return;
	this.maxloading=0;
	this.SetFrameRate( this.updateRate );
}

gxtkApp.prototype.GetMetaData=function( path,key ){
	return getMetaData( path,key );
}

gxtkApp.prototype.Die=function( err ){
	this.dead=true;
	this.audio.OnSuspend();
	alertError( err );
}

gxtkApp.prototype.InvokeOnCreate=function(){
	if( this.dead ) return;
	
	try{
		gl=this.gl;
		this.OnCreate();
		gl=null;
	}catch( ex ){
		this.Die( ex );
	}
}

gxtkApp.prototype.InvokeOnUpdate=function(){
	if( this.dead || this.suspended || !this.updateRate || this.loading ) return;
	
	try{
		gl=this.gl;
		this.input.BeginUpdate();
		this.OnUpdate();		
		this.input.EndUpdate();
		gl=null;
	}catch( ex ){
		this.Die( ex );
	}
}

gxtkApp.prototype.InvokeOnSuspend=function(){
	if( this.dead || this.suspended ) return;
	
	try{
		gl=this.gl;
		this.suspended=true;
		this.OnSuspend();
		this.audio.OnSuspend();
		gl=null;
	}catch( ex ){
		this.Die( ex );
	}
}

gxtkApp.prototype.InvokeOnResume=function(){
	if( this.dead || !this.suspended ) return;
	
	try{
		gl=this.gl;
		this.audio.OnResume();
		this.OnResume();
		this.suspended=false;
		gl=null;
	}catch( ex ){
		this.Die( ex );
	}
}

gxtkApp.prototype.InvokeOnRender=function(){
	if( this.dead || this.suspended ) return;
	
	try{
		gl=this.gl;
		this.graphics.BeginRender();
		if( this.loading ){
			this.OnLoading();
		}else{
			this.OnRender();
		}
		this.graphics.EndRender();
		gl=null;
	}catch( ex ){
		this.Die( ex );
	}
}

//***** GXTK API *****

gxtkApp.prototype.GraphicsDevice=function(){
	return this.graphics;
}

gxtkApp.prototype.InputDevice=function(){
	return this.input;
}

gxtkApp.prototype.AudioDevice=function(){
	return this.audio;
}

gxtkApp.prototype.AppTitle=function(){
	return document.URL;
}

gxtkApp.prototype.LoadState=function(){
	var state=localStorage.getItem( ".mojostate@"+document.URL );
	if( state ) return state;
	return "";
}

gxtkApp.prototype.SaveState=function( state ){
	localStorage.setItem( ".mojostate@"+document.URL,state );
}

gxtkApp.prototype.LoadString=function( path ){
	return loadString( path );
}

gxtkApp.prototype.SetUpdateRate=function( fps ){
	this.updateRate=fps;
	
	if( !this.loading ) this.SetFrameRate( fps );
}

gxtkApp.prototype.MilliSecs=function(){
	return ((new Date).getTime()-this.startMillis)|0;
}

gxtkApp.prototype.Loading=function(){
	return this.loading;
}

gxtkApp.prototype.OnCreate=function(){
}

gxtkApp.prototype.OnUpdate=function(){
}

gxtkApp.prototype.OnSuspend=function(){
}

gxtkApp.prototype.OnResume=function(){
}

gxtkApp.prototype.OnRender=function(){
}

gxtkApp.prototype.OnLoading=function(){
}

//***** gxtkGraphics class *****

function gxtkGraphics( app,canvas ){
	this.app=app;
	this.canvas=canvas;
	this.gc=canvas.getContext( '2d' );
	this.tmpCanvas=null;
	this.r=255;
	this.b=255;
	this.g=255;
	this.white=true;
	this.color="rgb(255,255,255)"
	this.alpha=1;
	this.blend="source-over";
	this.ix=1;this.iy=0;
	this.jx=0;this.jy=1;
	this.tx=0;this.ty=0;
	this.tformed=false;
	this.scissorX=0;
	this.scissorY=0;
	this.scissorWidth=0;
	this.scissorHeight=0;
	this.clipped=false;
}

gxtkGraphics.prototype.BeginRender=function(){
	if( this.gc ) this.gc.save();
}

gxtkGraphics.prototype.EndRender=function(){
	if( this.gc ) this.gc.restore();
}

gxtkGraphics.prototype.Mode=function(){
	if( this.gc ) return 1;
	return 0;
}

gxtkGraphics.prototype.Width=function(){
	return this.canvas.width;
}

gxtkGraphics.prototype.Height=function(){
	return this.canvas.height;
}

gxtkGraphics.prototype.LoadSurface=function( path ){
	var app=this.app;
	
	function onloadfun(){
		app.DecLoading();
	}

	app.IncLoading();

	var image=loadImage( path,onloadfun );
	if( image ) return new gxtkSurface( image,this );

	app.DecLoading();
	return null;
}

gxtkGraphics.prototype.CreateSurface=function( width,height ){

	var canvas=document.createElement( 'canvas' );
	
	canvas.width=width;
	canvas.height=height;
	canvas.meta_width=width;
	canvas.meta_height=height;
	canvas.complete=true;
	
	var surface=new gxtkSurface( canvas,this );
	
	surface.gc=canvas.getContext( '2d' );
	
	return surface;
}

gxtkGraphics.prototype.SetAlpha=function( alpha ){
	this.alpha=alpha;
	this.gc.globalAlpha=alpha;
}

gxtkGraphics.prototype.SetColor=function( r,g,b ){
	this.r=r;
	this.g=g;
	this.b=b;
	this.white=(r==255 && g==255 && b==255);
	this.color="rgb("+(r|0)+","+(g|0)+","+(b|0)+")";
	this.gc.fillStyle=this.color;
	this.gc.strokeStyle=this.color;
}

gxtkGraphics.prototype.SetBlend=function( blend ){
	switch( blend ){
	case 1:
		this.blend="lighter";
		break;
	default:
		this.blend="source-over";
	}
	this.gc.globalCompositeOperation=this.blend;
}

gxtkGraphics.prototype.SetScissor=function( x,y,w,h ){
	this.scissorX=x;
	this.scissorY=y;
	this.scissorWidth=w;
	this.scissorHeight=h;
	this.clipped=(x!=0 || y!=0 || w!=this.canvas.width || h!=this.canvas.height);
	this.gc.restore();
	this.gc.save();
	if( this.clipped ){
		this.gc.beginPath();
		this.gc.rect( x,y,w,h );
		this.gc.clip();
		this.gc.closePath();
	}
	this.gc.fillStyle=this.color;
	this.gc.strokeStyle=this.color;
	if( this.tformed ) this.gc.setTransform( this.ix,this.iy,this.jx,this.jy,this.tx,this.ty );
}

gxtkGraphics.prototype.SetMatrix=function( ix,iy,jx,jy,tx,ty ){
	this.ix=ix;this.iy=iy;
	this.jx=jx;this.jy=jy;
	this.tx=tx;this.ty=ty;
	this.gc.setTransform( ix,iy,jx,jy,tx,ty );
	this.tformed=(ix!=1 || iy!=0 || jx!=0 || jy!=1 || tx!=0 || ty!=0);
}

gxtkGraphics.prototype.Cls=function( r,g,b ){
	if( this.tformed ) this.gc.setTransform( 1,0,0,1,0,0 );
	this.gc.fillStyle="rgb("+(r|0)+","+(g|0)+","+(b|0)+")";
	this.gc.globalAlpha=1;
	this.gc.globalCompositeOperation="source-over";
	this.gc.fillRect( 0,0,this.canvas.width,this.canvas.height );
	this.gc.fillStyle=this.color;
	this.gc.globalAlpha=this.alpha;
	this.gc.globalCompositeOperation=this.blend;
	if( this.tformed ) this.gc.setTransform( this.ix,this.iy,this.jx,this.jy,this.tx,this.ty );
}

gxtkGraphics.prototype.DrawPoint=function( x,y ){
	if( this.tformed ){
		var px=x;
		x=px * this.ix + y * this.jx + this.tx;
		y=px * this.iy + y * this.jy + this.ty;
		this.gc.setTransform( 1,0,0,1,0,0 );
		this.gc.fillRect( x,y,1,1 );
		this.gc.setTransform( this.ix,this.iy,this.jx,this.jy,this.tx,this.ty );
	}else{
		this.gc.fillRect( x,y,1,1 );
	}
}

gxtkGraphics.prototype.DrawRect=function( x,y,w,h ){
	if( w<0 ){ x+=w;w=-w; }
	if( h<0 ){ y+=h;h=-h; }
	if( w<=0 || h<=0 ) return;
	//
	this.gc.fillRect( x,y,w,h );
}

gxtkGraphics.prototype.DrawLine=function( x1,y1,x2,y2 ){
	if( this.tformed ){
		var x1_t=x1 * this.ix + y1 * this.jx + this.tx;
		var y1_t=x1 * this.iy + y1 * this.jy + this.ty;
		var x2_t=x2 * this.ix + y2 * this.jx + this.tx;
		var y2_t=x2 * this.iy + y2 * this.jy + this.ty;
		this.gc.setTransform( 1,0,0,1,0,0 );
	  	this.gc.beginPath();
	  	this.gc.moveTo( x1_t,y1_t );
	  	this.gc.lineTo( x2_t,y2_t );
	  	this.gc.stroke();
	  	this.gc.closePath();
		this.gc.setTransform( this.ix,this.iy,this.jx,this.jy,this.tx,this.ty );
	}else{
	  	this.gc.beginPath();
	  	this.gc.moveTo( x1,y1 );
	  	this.gc.lineTo( x2,y2 );
	  	this.gc.stroke();
	  	this.gc.closePath();
	}
}

gxtkGraphics.prototype.DrawOval=function( x,y,w,h ){
	if( w<0 ){ x+=w;w=-w; }
	if( h<0 ){ y+=h;h=-h; }
	if( w<=0 || h<=0 ) return;
	//
  	var w2=w/2,h2=h/2;
	this.gc.save();
	this.gc.translate( x+w2,y+h2 );
	this.gc.scale( w2,h2 );
  	this.gc.beginPath();
	this.gc.arc( 0,0,1,0,Math.PI*2,false );
	this.gc.fill();
  	this.gc.closePath();
	this.gc.restore();
}

gxtkGraphics.prototype.DrawPoly=function( verts ){
	if( verts.length<6 ) return;
	this.gc.beginPath();
	this.gc.moveTo( verts[0],verts[1] );
	for( var i=2;i<verts.length;i+=2 ){
		this.gc.lineTo( verts[i],verts[i+1] );
	}
	this.gc.fill();
	this.gc.closePath();
}

gxtkGraphics.prototype.DrawSurface=function( surface,x,y ){
	if( !surface.image.complete ) return;
	
	if( this.white ){
		this.gc.drawImage( surface.image,x,y );
		return;
	}
	
	this.DrawImageTinted( surface.image,x,y,0,0,surface.swidth,surface.sheight );
}

gxtkGraphics.prototype.DrawSurface2=function( surface,x,y,srcx,srcy,srcw,srch ){
	if( !surface.image.complete ) return;

	if( srcw<0 ){ srcx+=srcw;srcw=-srcw; }
	if( srch<0 ){ srcy+=srch;srch=-srch; }
	if( srcw<=0 || srch<=0 ) return;

	if( this.white ){
		this.gc.drawImage( surface.image,srcx,srcy,srcw,srch,x,y,srcw,srch );
		return;
	}
	
	this.DrawImageTinted( surface.image,x,y,srcx,srcy,srcw,srch  );
}

gxtkGraphics.prototype.DrawImageTinted=function( image,dx,dy,sx,sy,sw,sh ){

	if( !this.tmpCanvas ){
		this.tmpCanvas=document.createElement( "canvas" );
	}

	if( sw>this.tmpCanvas.width || sh>this.tmpCanvas.height ){
		this.tmpCanvas.width=Math.max( sw,this.tmpCanvas.width );
		this.tmpCanvas.height=Math.max( sh,this.tmpCanvas.height );
	}
	
	var tmpGC=this.tmpCanvas.getContext( "2d" );
	tmpGC.globalCompositeOperation="copy";
	
	tmpGC.drawImage( image,sx,sy,sw,sh,0,0,sw,sh );
	
	var imgData=tmpGC.getImageData( 0,0,sw,sh );
	
	var p=imgData.data,sz=sw*sh*4,i;
	
	for( i=0;i<sz;i+=4 ){
		p[i]=p[i]*this.r/255;
		p[i+1]=p[i+1]*this.g/255;
		p[i+2]=p[i+2]*this.b/255;
	}
	
	tmpGC.putImageData( imgData,0,0 );
	
	this.gc.drawImage( this.tmpCanvas,0,0,sw,sh,dx,dy,sw,sh );
}

gxtkGraphics.prototype.ReadPixels=function( pixels,x,y,width,height,offset,pitch ){

	var imgData=this.gc.getImageData( x,y,width,height );
	
	var p=imgData.data,i=0,j=offset,px,py;
	
	for( py=0;py<height;++py ){
		for( px=0;px<width;++px ){
			pixels[j++]=(p[i+3]<<24)|(p[i]<<16)|(p[i+1]<<8)|p[i+2];
			i+=4;
		}
		j+=pitch-width;
	}
}

gxtkGraphics.prototype.WritePixels2=function( surface,pixels,x,y,width,height,offset,pitch ){

	if( !surface.gc ){
		if( !surface.image.complete ) return;
		var canvas=document.createElement( "canvas" );
		canvas.width=surface.swidth;
		canvas.height=surface.sheight;
		surface.gc=canvas.getContext( "2d" );
		surface.gc.globalCompositeOperation="copy";
		surface.gc.drawImage( surface.image,0,0 );
		surface.image=canvas;
	}

	var imgData=surface.gc.createImageData( width,height );

	var p=imgData.data,i=0,j=offset,px,py,argb;
	
	for( py=0;py<height;++py ){
		for( px=0;px<width;++px ){
			argb=pixels[j++];
			p[i]=(argb>>16) & 0xff;
			p[i+1]=(argb>>8) & 0xff;
			p[i+2]=argb & 0xff;
			p[i+3]=(argb>>24) & 0xff;
			i+=4;
		}
		j+=pitch-width;
	}
	
	surface.gc.putImageData( imgData,x,y );
}

//***** gxtkSurface class *****

function gxtkSurface( image,graphics ){
	this.image=image;
	this.graphics=graphics;
	this.swidth=image.meta_width;
	this.sheight=image.meta_height;
}

//***** GXTK API *****

gxtkSurface.prototype.Discard=function(){
	if( this.image ){
		this.image=null;
	}
}

gxtkSurface.prototype.Width=function(){
	return this.swidth;
}

gxtkSurface.prototype.Height=function(){
	return this.sheight;
}

gxtkSurface.prototype.Loaded=function(){
	return this.image.complete;
}

gxtkSurface.prototype.OnUnsafeLoadComplete=function(){
	return true;
}

//***** Class gxtkInput *****

function gxtkInput( app ){
	this.app=app;
	this.keyStates=new Array( 512 );
	this.charQueue=new Array( 32 );
	this.charPut=0;
	this.charGet=0;
	this.mouseX=0;
	this.mouseY=0;
	this.joyX=0;
	this.joyY=0;
	this.joyZ=0;
	this.touchIds=new Array( 32 );
	this.touchXs=new Array( 32 );
	this.touchYs=new Array( 32 );
	this.accelX=0;
	this.accelY=0;
	this.accelZ=0;
	
	var i;
	
	for( i=0;i<512;++i ){
		this.keyStates[i]=0;
	}
	
	for( i=0;i<32;++i ){
		this.touchIds[i]=-1;
		this.touchXs[i]=0;
		this.touchYs[i]=0;
	}
}

gxtkInput.prototype.BeginUpdate=function(){
}

gxtkInput.prototype.EndUpdate=function(){
	for( var i=0;i<512;++i ){
		this.keyStates[i]&=0x100;
	}
	this.charGet=0;
	this.charPut=0;
}

gxtkInput.prototype.OnKeyDown=function( key ){
	if( (this.keyStates[key]&0x100)==0 ){
		this.keyStates[key]|=0x100;
		++this.keyStates[key];
		//
		if( key==KEY_LMB ){
			this.keyStates[KEY_TOUCH0]|=0x100;
			++this.keyStates[KEY_TOUCH0];
		}else if( key==KEY_TOUCH0 ){
			this.keyStates[KEY_LMB]|=0x100;
			++this.keyStates[KEY_LMB];
		}
		//
	}
}

gxtkInput.prototype.OnKeyUp=function( key ){
	this.keyStates[key]&=0xff;
	//
	if( key==KEY_LMB ){
		this.keyStates[KEY_TOUCH0]&=0xff;
	}else if( key==KEY_TOUCH0 ){
		this.keyStates[KEY_LMB]&=0xff;
	}
	//
}

gxtkInput.prototype.PutChar=function( chr ){
	if( this.charPut-this.charGet<32 ){
		this.charQueue[this.charPut & 31]=chr;
		this.charPut+=1;
	}
}

gxtkInput.prototype.OnMouseMove=function( x,y ){
	this.mouseX=x;
	this.mouseY=y;
	this.touchXs[0]=x;
	this.touchYs[0]=y;
}

gxtkInput.prototype.OnTouchStart=function( id,x,y ){
	for( var i=0;i<32;++i ){
		if( this.touchIds[i]==-1 ){
			this.touchIds[i]=id;
			this.touchXs[i]=x;
			this.touchYs[i]=y;
			this.OnKeyDown( KEY_TOUCH0+i );
			return;
		} 
	}
}

gxtkInput.prototype.OnTouchMove=function( id,x,y ){
	for( var i=0;i<32;++i ){
		if( this.touchIds[i]==id ){
			this.touchXs[i]=x;
			this.touchYs[i]=y;
			if( i==0 ){
				this.mouseX=x;
				this.mouseY=y;
			}
			return;
		}
	}
}

gxtkInput.prototype.OnTouchEnd=function( id ){
	for( var i=0;i<32;++i ){
		if( this.touchIds[i]==id ){
			this.touchIds[i]=-1;
			this.OnKeyUp( KEY_TOUCH0+i );
			return;
		}
	}
}

gxtkInput.prototype.OnDeviceMotion=function( x,y,z ){
	this.accelX=x;
	this.accelY=y;
	this.accelZ=z;
}

//***** GXTK API *****

gxtkInput.prototype.SetKeyboardEnabled=function( enabled ){
	return 0;
}

gxtkInput.prototype.KeyDown=function( key ){
	if( key>0 && key<512 ){
		return this.keyStates[key] >> 8;
	}
	return 0;
}

gxtkInput.prototype.KeyHit=function( key ){
	if( key>0 && key<512 ){
		return this.keyStates[key] & 0xff;
	}
	return 0;
}

gxtkInput.prototype.GetChar=function(){
	if( this.charPut!=this.charGet ){
		var chr=this.charQueue[this.charGet & 31];
		this.charGet+=1;
		return chr;
	}
	return 0;
}

gxtkInput.prototype.MouseX=function(){
	return this.mouseX;
}

gxtkInput.prototype.MouseY=function(){
	return this.mouseY;
}

gxtkInput.prototype.JoyX=function( index ){
	return this.joyX;
}

gxtkInput.prototype.JoyY=function( index ){
	return this.joyY;
}

gxtkInput.prototype.JoyZ=function( index ){
	return this.joyZ;
}

gxtkInput.prototype.TouchX=function( index ){
	return this.touchXs[index];
}

gxtkInput.prototype.TouchY=function( index ){
	return this.touchYs[index];
}

gxtkInput.prototype.AccelX=function(){
	return this.accelX;
}

gxtkInput.prototype.AccelY=function(){
	return this.accelY;
}

gxtkInput.prototype.AccelZ=function(){
	return this.accelZ;
}


//***** gxtkChannel class *****
function gxtkChannel(){
	this.sample=null;
	this.audio=null;
	this.volume=1;
	this.pan=0;
	this.rate=1;
	this.flags=0;
	this.state=0;
}

//***** gxtkAudio class *****
function gxtkAudio( app ){
	this.app=app;
	this.okay=typeof(Audio)!="undefined";
	this.nextchan=0;
	this.music=null;
	this.channels=new Array(33);
	for( var i=0;i<33;++i ){
		this.channels[i]=new gxtkChannel();
	}
}

gxtkAudio.prototype.OnSuspend=function(){
	var i;
	for( i=0;i<33;++i ){
		var chan=this.channels[i];
		if( chan.state==1 ) chan.audio.pause();
	}
}

gxtkAudio.prototype.OnResume=function(){
	var i;
	for( i=0;i<33;++i ){
		var chan=this.channels[i];
		if( chan.state==1 ) chan.audio.play();
	}
}

gxtkAudio.prototype.LoadSample=function( path ){
	var audio=loadAudio( path );
	if( !audio ) return null;
	return new gxtkSample( audio );
}

gxtkAudio.prototype.PlaySample=function( sample,channel,flags ){
	if( !this.okay ) return;

	var chan=this.channels[channel];

	if( chan.state!=0 ){
		chan.audio.pause();
		chan.state=0;
	}
	
	for( var i=0;i<33;++i ){
		var chan2=this.channels[i];
		if( chan2.state==1 && chan2.audio.ended && !chan2.audio.loop ) chan.state=0;
		if( chan2.state==0 && chan2.sample ){
			chan2.sample.FreeAudio( chan2.audio );
			chan2.sample=null;
			chan2.audio=null;
		}
	}

	var audio=sample.AllocAudio();
	if( !audio ) return;
	
	audio.loop=(flags&1)!=0;
	audio.volume=chan.volume;
	audio.play();

	chan.sample=sample;
	chan.audio=audio;
	chan.flags=flags;
	chan.state=1;
}

gxtkAudio.prototype.StopChannel=function( channel ){
	var chan=this.channels[channel];
	
	if( chan.state!=0 ){
		chan.audio.pause();
		chan.state=0;
	}
}

gxtkAudio.prototype.PauseChannel=function( channel ){
	var chan=this.channels[channel];
	
	if( chan.state==1 ){
		if( chan.audio.ended && !chan.audio.loop ){
			chan.state=0;
		}else{
			chan.audio.pause();
			chan.state=2;
		}
	}
}

gxtkAudio.prototype.ResumeChannel=function( channel ){
	var chan=this.channels[channel];
	
	if( chan.state==2 ){
		chan.audio.play();
		chan.state=1;
	}
}

gxtkAudio.prototype.ChannelState=function( channel ){
	var chan=this.channels[channel];
	if( chan.state==1 && chan.audio.ended && !chan.audio.loop ) chan.state=0;
	return chan.state;
}

gxtkAudio.prototype.SetVolume=function( channel,volume ){
	var chan=this.channels[channel];
	if( chan.state!=0 ) chan.audio.volume=volume;
	chan.volume=volume;
}

gxtkAudio.prototype.SetPan=function( channel,pan ){
	var chan=this.channels[channel];
	chan.pan=pan;
}

gxtkAudio.prototype.SetRate=function( channel,rate ){
	var chan=this.channels[channel];
	chan.rate=rate;
}

gxtkAudio.prototype.PlayMusic=function( path,flags ){
	this.StopMusic();
	
	this.music=this.LoadSample( path );
	if( !this.music ) return;
	
	this.PlaySample( this.music,32,flags );
}

gxtkAudio.prototype.StopMusic=function(){
	this.StopChannel( 32 );

	if( this.music ){
		this.music.Discard();
		this.music=null;
	}
}

gxtkAudio.prototype.PauseMusic=function(){
	this.PauseChannel( 32 );
}

gxtkAudio.prototype.ResumeMusic=function(){
	this.ResumeChannel( 32 );
}

gxtkAudio.prototype.MusicState=function(){
	return this.ChannelState( 32 );
}

gxtkAudio.prototype.SetMusicVolume=function( volume ){
	this.SetVolume( 32,volume );
}

//***** gxtkSample class *****

function gxtkSample( audio ){
	this.audio=audio;
	this.free=new Array();
	this.insts=new Array();
}

gxtkSample.prototype.FreeAudio=function( audio ){
	this.free.push( audio );
}

gxtkSample.prototype.AllocAudio=function(){
	var audio;
	while( this.free.length ){
		audio=this.free.pop();
		try{
			audio.currentTime=0;
			return audio;
		}catch( ex ){
			print( "AUDIO ERROR1!" );
		}
	}
	
	//Max out?
	if( this.insts.length==8 ) return null;
	
	audio=new Audio( this.audio.src );
	
	//yucky loop handler for firefox!
	//
	audio.addEventListener( 'ended',function(){
		if( this.loop ){
			try{
				this.currentTime=0;
				this.play();
			}catch( ex ){
				print( "AUDIO ERROR2!" );
			}
		}
	},false );

	this.insts.push( audio );
	return audio;
}

gxtkSample.prototype.Discard=function(){
}


function BBThread(){
	this.running=false;
}

BBThread.prototype.Start=function(){
	this.Run__UNSAFE__();
}

BBThread.prototype.IsRunning=function(){
	return this.running;
}

BBThread.prototype.Run__UNSAFE__=function(){
}

function BBAsyncImageLoaderThread(){
	BBThread.call(this);
}

BBAsyncImageLoaderThread.prototype=extend_class( BBThread );

BBAsyncImageLoaderThread.prototype.Start=function(){

	var thread=this;

	var image=new Image();
	
	image.onload=function( e ){
		image.meta_width=image.width;
		image.meta_height=image.height;
		thread._surface=new gxtkSurface( image,thread._device )
		thread.running=false;
	}
	
	image.onerror=function( e ){
		thread._surface=null;
		thread.running=false;
	}
	
	thread.running=true;
	
	image.src=fixDataPath( thread._path );
}


function BBAsyncSoundLoaderThread(){
	BBThread.call(this);
}

BBAsyncSoundLoaderThread.prototype=extend_class( BBThread );

BBAsyncSoundLoaderThread.prototype.Start=function(){
	this._sample=this._device.LoadSample( this._path );
}
systemMillisecs=function(){
	return new Date().getTime();
};function bb_app_App(){
	Object.call(this);
}
function bb_app_App_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<109>";
	bb_app_device=bb_app_AppDevice_new.call(new bb_app_AppDevice,this);
	pop_err();
	return this;
}
bb_app_App.prototype.m_OnCreate=function(){
	push_err();
	pop_err();
	return 0;
}
bb_app_App.prototype.m_OnUpdate=function(){
	push_err();
	pop_err();
	return 0;
}
bb_app_App.prototype.m_OnSuspend=function(){
	push_err();
	pop_err();
	return 0;
}
bb_app_App.prototype.m_OnResume=function(){
	push_err();
	pop_err();
	return 0;
}
bb_app_App.prototype.m_OnRender=function(){
	push_err();
	pop_err();
	return 0;
}
bb_app_App.prototype.m_OnLoading=function(){
	push_err();
	pop_err();
	return 0;
}
function bb_xmas_XmasApp(){
	bb_app_App.call(this);
	this.f_scene=null;
}
bb_xmas_XmasApp.prototype=extend_class(bb_app_App);
function bb_xmas_XmasApp_new(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<27>";
	bb_app_App_new.call(this);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<27>";
	pop_err();
	return this;
}
bb_xmas_XmasApp.prototype.m_OnCreate=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<33>";
	bb_app_SetUpdateRate(30);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<34>";
	bb_random_Seed=systemMillisecs();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<36>";
	bb_gfx_GFX_Init();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<37>";
	bb_scene_Scene_Init();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<38>";
	bb_sfx_SFX_Init();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<40>";
	bb_autofit_SetVirtualDisplay(360,240,1.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<42>";
	this.f_scene=bb_scene_GenerateScene();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<44>";
	pop_err();
	return 1;
}
bb_xmas_XmasApp.prototype.m_OnUpdate=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<49>";
	this.f_scene.m_Update();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<51>";
	pop_err();
	return 1;
}
bb_xmas_XmasApp.prototype.m_OnRender=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<56>";
	bb_autofit_UpdateVirtualDisplay(true,true);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<58>";
	bb_graphics_Cls(0.0,0.0,0.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<60>";
	this.f_scene.m_Render();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<62>";
	pop_err();
	return 1;
}
function bb_app_AppDevice(){
	gxtkApp.call(this);
	this.f_app=null;
	this.f_updateRate=0;
}
bb_app_AppDevice.prototype=extend_class(gxtkApp);
function bb_app_AppDevice_new(t_app){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<49>";
	dbg_object(this).f_app=t_app;
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<50>";
	bb_graphics_SetGraphicsDevice(this.GraphicsDevice());
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<51>";
	bb_input_SetInputDevice(this.InputDevice());
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<52>";
	bb_audio_SetAudioDevice(this.AudioDevice());
	pop_err();
	return this;
}
function bb_app_AppDevice_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<46>";
	pop_err();
	return this;
}
bb_app_AppDevice.prototype.OnCreate=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<56>";
	bb_graphics_SetFont(null,32);
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<57>";
	var t_=this.f_app.m_OnCreate();
	pop_err();
	return t_;
}
bb_app_AppDevice.prototype.OnUpdate=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<61>";
	var t_=this.f_app.m_OnUpdate();
	pop_err();
	return t_;
}
bb_app_AppDevice.prototype.OnSuspend=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<65>";
	var t_=this.f_app.m_OnSuspend();
	pop_err();
	return t_;
}
bb_app_AppDevice.prototype.OnResume=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<69>";
	var t_=this.f_app.m_OnResume();
	pop_err();
	return t_;
}
bb_app_AppDevice.prototype.OnRender=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<73>";
	bb_graphics_BeginRender();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<74>";
	var t_r=this.f_app.m_OnRender();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<75>";
	bb_graphics_EndRender();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<76>";
	pop_err();
	return t_r;
}
bb_app_AppDevice.prototype.OnLoading=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<80>";
	bb_graphics_BeginRender();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<81>";
	var t_r=this.f_app.m_OnLoading();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<82>";
	bb_graphics_EndRender();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<83>";
	pop_err();
	return t_r;
}
bb_app_AppDevice.prototype.SetUpdateRate=function(t_hertz){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<87>";
	gxtkApp.prototype.SetUpdateRate.call(this,t_hertz);
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<88>";
	this.f_updateRate=t_hertz;
	pop_err();
	return 0;
}
var bb_graphics_device;
function bb_graphics_SetGraphicsDevice(t_dev){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<58>";
	bb_graphics_device=t_dev;
	pop_err();
	return 0;
}
var bb_input_device;
function bb_input_SetInputDevice(t_dev){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/input.monkey<16>";
	bb_input_device=t_dev;
	pop_err();
	return 0;
}
var bb_audio_device;
function bb_audio_SetAudioDevice(t_dev){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/audio.monkey<17>";
	bb_audio_device=t_dev;
	pop_err();
	return 0;
}
var bb_app_device;
function bbMain(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<68>";
	bb_xmas_XmasApp_new.call(new bb_xmas_XmasApp);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/xmas.monkey<69>";
	pop_err();
	return 0;
}
function bb_graphics_Image(){
	Object.call(this);
	this.f_surface=null;
	this.f_width=0;
	this.f_height=0;
	this.f_frames=[];
	this.f_flags=0;
	this.f_tx=.0;
	this.f_ty=.0;
	this.f_source=null;
}
var bb_graphics_Image_DefaultFlags;
function bb_graphics_Image_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<65>";
	pop_err();
	return this;
}
bb_graphics_Image.prototype.m_SetHandle=function(t_tx,t_ty){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<109>";
	dbg_object(this).f_tx=t_tx;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<110>";
	dbg_object(this).f_ty=t_ty;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<111>";
	dbg_object(this).f_flags=dbg_object(this).f_flags&-2;
	pop_err();
	return 0;
}
bb_graphics_Image.prototype.m_ApplyFlags=function(t_iflags){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<178>";
	this.f_flags=t_iflags;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<180>";
	if((this.f_flags&2)!=0){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<181>";
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<181>";
		var t_=this.f_frames;
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<181>";
		var t_2=0;
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<181>";
		while(t_2<t_.length){
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<181>";
			var t_f=dbg_array(t_,t_2)[dbg_index];
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<181>";
			t_2=t_2+1;
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<182>";
			dbg_object(t_f).f_x+=1;
		}
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<184>";
		this.f_width-=2;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<187>";
	if((this.f_flags&4)!=0){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<188>";
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<188>";
		var t_3=this.f_frames;
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<188>";
		var t_4=0;
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<188>";
		while(t_4<t_3.length){
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<188>";
			var t_f2=dbg_array(t_3,t_4)[dbg_index];
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<188>";
			t_4=t_4+1;
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<189>";
			dbg_object(t_f2).f_y+=1;
		}
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<191>";
		this.f_height-=2;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<194>";
	if((this.f_flags&1)!=0){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<195>";
		this.m_SetHandle((this.f_width)/2.0,(this.f_height)/2.0);
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<198>";
	if(this.f_frames.length==1 && dbg_object(dbg_array(this.f_frames,0)[dbg_index]).f_x==0 && dbg_object(dbg_array(this.f_frames,0)[dbg_index]).f_y==0 && this.f_width==this.f_surface.Width() && this.f_height==this.f_surface.Height()){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<199>";
		this.f_flags|=65536;
	}
	pop_err();
	return 0;
}
bb_graphics_Image.prototype.m_Init=function(t_surf,t_nframes,t_iflags){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<136>";
	this.f_surface=t_surf;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<138>";
	this.f_width=((this.f_surface.Width()/t_nframes)|0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<139>";
	this.f_height=this.f_surface.Height();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<141>";
	this.f_frames=new_object_array(t_nframes);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<142>";
	for(var t_i=0;t_i<t_nframes;t_i=t_i+1){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<143>";
		dbg_array(this.f_frames,t_i)[dbg_index]=bb_graphics_Frame_new.call(new bb_graphics_Frame,t_i*this.f_width,0)
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<146>";
	this.m_ApplyFlags(t_iflags);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<147>";
	pop_err();
	return this;
}
bb_graphics_Image.prototype.m_Grab=function(t_x,t_y,t_iwidth,t_iheight,t_nframes,t_iflags,t_source){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<151>";
	dbg_object(this).f_source=t_source;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<152>";
	this.f_surface=dbg_object(t_source).f_surface;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<154>";
	this.f_width=t_iwidth;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<155>";
	this.f_height=t_iheight;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<157>";
	this.f_frames=new_object_array(t_nframes);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<159>";
	var t_ix=t_x;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<159>";
	var t_iy=t_y;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<161>";
	for(var t_i=0;t_i<t_nframes;t_i=t_i+1){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<162>";
		if(t_ix+this.f_width>dbg_object(t_source).f_width){
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<163>";
			t_ix=0;
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<164>";
			t_iy+=this.f_height;
		}
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<166>";
		if(t_ix+this.f_width>dbg_object(t_source).f_width || t_iy+this.f_height>dbg_object(t_source).f_height){
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<167>";
			error("Image frame outside surface");
		}
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<169>";
		dbg_array(this.f_frames,t_i)[dbg_index]=bb_graphics_Frame_new.call(new bb_graphics_Frame,t_ix+dbg_object(dbg_array(dbg_object(t_source).f_frames,0)[dbg_index]).f_x,t_iy+dbg_object(dbg_array(dbg_object(t_source).f_frames,0)[dbg_index]).f_y)
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<170>";
		t_ix+=this.f_width;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<173>";
	this.m_ApplyFlags(t_iflags);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<174>";
	pop_err();
	return this;
}
bb_graphics_Image.prototype.m_GrabImage=function(t_x,t_y,t_width,t_height,t_frames,t_flags){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<104>";
	if(dbg_object(this).f_frames.length!=1){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<104>";
		pop_err();
		return null;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<105>";
	var t_=(bb_graphics_Image_new.call(new bb_graphics_Image)).m_Grab(t_x,t_y,t_width,t_height,t_frames,t_flags,this);
	pop_err();
	return t_;
}
function bb_graphics_GraphicsContext(){
	Object.call(this);
	this.f_defaultFont=null;
	this.f_font=null;
	this.f_firstChar=0;
	this.f_matrixSp=0;
	this.f_ix=1.0;
	this.f_iy=.0;
	this.f_jx=.0;
	this.f_jy=1.0;
	this.f_tx=.0;
	this.f_ty=.0;
	this.f_tformed=0;
	this.f_matDirty=0;
	this.f_color_r=.0;
	this.f_color_g=.0;
	this.f_color_b=.0;
	this.f_alpha=.0;
	this.f_blend=0;
	this.f_scissor_x=.0;
	this.f_scissor_y=.0;
	this.f_scissor_width=.0;
	this.f_scissor_height=.0;
	this.f_matrixStack=new_number_array(192);
}
function bb_graphics_GraphicsContext_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<24>";
	pop_err();
	return this;
}
bb_graphics_GraphicsContext.prototype.m_Validate=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<35>";
	if((this.f_matDirty)!=0){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<36>";
		bb_graphics_renderDevice.SetMatrix(dbg_object(bb_graphics_context).f_ix,dbg_object(bb_graphics_context).f_iy,dbg_object(bb_graphics_context).f_jx,dbg_object(bb_graphics_context).f_jy,dbg_object(bb_graphics_context).f_tx,dbg_object(bb_graphics_context).f_ty);
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<37>";
		this.f_matDirty=0;
	}
	pop_err();
	return 0;
}
var bb_graphics_context;
function bb_data_FixDataPath(t_path){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/data.monkey<3>";
	var t_i=t_path.indexOf(":/",0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/data.monkey<4>";
	if(t_i!=-1 && t_path.indexOf("/",0)==t_i+1){
		err_info="C:/apps/MonkeyPro66/modules/mojo/data.monkey<4>";
		pop_err();
		return t_path;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/data.monkey<5>";
	if(string_startswith(t_path,"./") || string_startswith(t_path,"/")){
		err_info="C:/apps/MonkeyPro66/modules/mojo/data.monkey<5>";
		pop_err();
		return t_path;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/data.monkey<6>";
	var t_="monkey://data/"+t_path;
	pop_err();
	return t_;
}
function bb_graphics_Frame(){
	Object.call(this);
	this.f_x=0;
	this.f_y=0;
}
function bb_graphics_Frame_new(t_x,t_y){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<18>";
	dbg_object(this).f_x=t_x;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<19>";
	dbg_object(this).f_y=t_y;
	pop_err();
	return this;
}
function bb_graphics_Frame_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<13>";
	pop_err();
	return this;
}
function bb_graphics_LoadImage(t_path,t_frameCount,t_flags){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<229>";
	var t_surf=bb_graphics_device.LoadSurface(bb_data_FixDataPath(t_path));
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<230>";
	if((t_surf)!=null){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<230>";
		var t_=(bb_graphics_Image_new.call(new bb_graphics_Image)).m_Init(t_surf,t_frameCount,t_flags);
		pop_err();
		return t_;
	}
	pop_err();
	return null;
}
function bb_graphics_LoadImage2(t_path,t_frameWidth,t_frameHeight,t_frameCount,t_flags){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<234>";
	var t_atlas=bb_graphics_LoadImage(t_path,1,0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<235>";
	if((t_atlas)!=null){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<235>";
		var t_=t_atlas.m_GrabImage(0,0,t_frameWidth,t_frameHeight,t_frameCount,t_flags);
		pop_err();
		return t_;
	}
	pop_err();
	return null;
}
function bb_graphics_SetFont(t_font,t_firstChar){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<524>";
	if(!((t_font)!=null)){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<525>";
		if(!((dbg_object(bb_graphics_context).f_defaultFont)!=null)){
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<526>";
			dbg_object(bb_graphics_context).f_defaultFont=bb_graphics_LoadImage("mojo_font.png",96,2);
		}
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<528>";
		t_font=dbg_object(bb_graphics_context).f_defaultFont;
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<529>";
		t_firstChar=32;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<531>";
	dbg_object(bb_graphics_context).f_font=t_font;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<532>";
	dbg_object(bb_graphics_context).f_firstChar=t_firstChar;
	pop_err();
	return 0;
}
var bb_graphics_renderDevice;
function bb_graphics_SetMatrix(t_ix,t_iy,t_jx,t_jy,t_tx,t_ty){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<289>";
	dbg_object(bb_graphics_context).f_ix=t_ix;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<290>";
	dbg_object(bb_graphics_context).f_iy=t_iy;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<291>";
	dbg_object(bb_graphics_context).f_jx=t_jx;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<292>";
	dbg_object(bb_graphics_context).f_jy=t_jy;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<293>";
	dbg_object(bb_graphics_context).f_tx=t_tx;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<294>";
	dbg_object(bb_graphics_context).f_ty=t_ty;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<295>";
	dbg_object(bb_graphics_context).f_tformed=((t_ix!=1.0 || t_iy!=0.0 || t_jx!=0.0 || t_jy!=1.0 || t_tx!=0.0 || t_ty!=0.0)?1:0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<296>";
	dbg_object(bb_graphics_context).f_matDirty=1;
	pop_err();
	return 0;
}
function bb_graphics_SetMatrix2(t_m){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<285>";
	bb_graphics_SetMatrix(dbg_array(t_m,0)[dbg_index],dbg_array(t_m,1)[dbg_index],dbg_array(t_m,2)[dbg_index],dbg_array(t_m,3)[dbg_index],dbg_array(t_m,4)[dbg_index],dbg_array(t_m,5)[dbg_index]);
	pop_err();
	return 0;
}
function bb_graphics_SetColor(t_r,t_g,t_b){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<244>";
	dbg_object(bb_graphics_context).f_color_r=t_r;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<245>";
	dbg_object(bb_graphics_context).f_color_g=t_g;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<246>";
	dbg_object(bb_graphics_context).f_color_b=t_b;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<247>";
	bb_graphics_renderDevice.SetColor(t_r,t_g,t_b);
	pop_err();
	return 0;
}
function bb_graphics_SetAlpha(t_alpha){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<255>";
	dbg_object(bb_graphics_context).f_alpha=t_alpha;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<256>";
	bb_graphics_renderDevice.SetAlpha(t_alpha);
	pop_err();
	return 0;
}
function bb_graphics_SetBlend(t_blend){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<264>";
	dbg_object(bb_graphics_context).f_blend=t_blend;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<265>";
	bb_graphics_renderDevice.SetBlend(t_blend);
	pop_err();
	return 0;
}
function bb_graphics_DeviceWidth(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<221>";
	var t_=bb_graphics_device.Width();
	pop_err();
	return t_;
}
function bb_graphics_DeviceHeight(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<225>";
	var t_=bb_graphics_device.Height();
	pop_err();
	return t_;
}
function bb_graphics_SetScissor(t_x,t_y,t_width,t_height){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<273>";
	dbg_object(bb_graphics_context).f_scissor_x=t_x;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<274>";
	dbg_object(bb_graphics_context).f_scissor_y=t_y;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<275>";
	dbg_object(bb_graphics_context).f_scissor_width=t_width;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<276>";
	dbg_object(bb_graphics_context).f_scissor_height=t_height;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<277>";
	bb_graphics_renderDevice.SetScissor(((t_x)|0),((t_y)|0),((t_width)|0),((t_height)|0));
	pop_err();
	return 0;
}
function bb_graphics_BeginRender(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<206>";
	if(!((bb_graphics_device.Mode())!=0)){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<206>";
		pop_err();
		return 0;
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<207>";
	bb_graphics_renderDevice=bb_graphics_device;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<208>";
	dbg_object(bb_graphics_context).f_matrixSp=0;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<209>";
	bb_graphics_SetMatrix(1.0,0.0,0.0,1.0,0.0,0.0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<210>";
	bb_graphics_SetColor(255.0,255.0,255.0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<211>";
	bb_graphics_SetAlpha(1.0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<212>";
	bb_graphics_SetBlend(0);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<213>";
	bb_graphics_SetScissor(0.0,0.0,(bb_graphics_DeviceWidth()),(bb_graphics_DeviceHeight()));
	pop_err();
	return 0;
}
function bb_graphics_EndRender(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<217>";
	bb_graphics_renderDevice=null;
	pop_err();
	return 0;
}
function bb_app_SetUpdateRate(t_hertz){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/app.monkey<145>";
	var t_=bb_app_device.SetUpdateRate(t_hertz);
	pop_err();
	return t_;
}
var bb_random_Seed;
function bb_gfx_GFX(){
	Object.call(this);
}
var bb_gfx_GFX_Tileset;
function bb_gfx_GFX_Init(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/gfx.monkey<8>";
	bb_gfx_GFX_Tileset=bb_graphics_LoadImage("gfx/xmas_sprites.png",1,bb_graphics_Image_DefaultFlags);
	pop_err();
}
function bb_gfx_GFX_Draw(t_tX,t_tY,t_X,t_Y,t_W,t_H){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/gfx.monkey<12>";
	bb_graphics_DrawImageRect(bb_gfx_GFX_Tileset,(t_tX),(t_tY),t_X,t_Y,t_W,t_H,0);
	pop_err();
}
function bb_scene_Scene(){
	Object.call(this);
	this.f_FloorSegmentCount=0;
	this.f_FloorSegments=[];
	this.f_Trees=null;
	this.f_Houses=null;
	this.f_Stars=null;
	this.f_Snowmen=null;
	this.f_Snowflakes=null;
	this.f_moon=null;
}
var bb_scene_Scene_Background;
function bb_scene_Scene_Init(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<12>";
	bb_scene_Scene_Background=bb_graphics_LoadImage("gfx/background.png",1,bb_graphics_Image_DefaultFlags);
	pop_err();
}
var bb_scene_Scene_Width;
function bb_scene_Scene_new(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<28>";
	this.f_FloorSegmentCount=((bb_scene_Scene_Width/bb_floorsegment_FloorSegment_Width)|0)+1;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<29>";
	this.f_FloorSegments=new_object_array(this.f_FloorSegmentCount);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<30>";
	for(var t_i=0;t_i<this.f_FloorSegmentCount;t_i=t_i+1){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<31>";
		dbg_array(this.f_FloorSegments,t_i)[dbg_index]=bb_floorsegment_FloorSegment_new.call(new bb_floorsegment_FloorSegment,this)
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<34>";
	this.f_Trees=bb_list_List_new.call(new bb_list_List);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<35>";
	this.f_Houses=bb_list_List2_new.call(new bb_list_List2);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<36>";
	this.f_Stars=bb_list_List3_new.call(new bb_list_List3);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<37>";
	this.f_Snowmen=bb_list_List4_new.call(new bb_list_List4);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<38>";
	this.f_Snowflakes=bb_list_List5_new.call(new bb_list_List5);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<40>";
	this.f_moon=bb_moon_Moon_new.call(new bb_moon_Moon,this);
	pop_err();
	return this;
}
var bb_scene_Scene_Height;
bb_scene_Scene.prototype.m_AddSnowFlake=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<103>";
	var t_tS=bb_snowflake_Snowflake_new.call(new bb_snowflake_Snowflake,this);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<104>";
	if(bb_random_Rnd()<0.5){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<105>";
		dbg_object(t_tS).f_X=-10.0;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<106>";
		dbg_object(t_tS).f_Y=bb_random_Rnd2(-5.0,(bb_scene_Scene_Height-5));
	}else{
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<108>";
		dbg_object(t_tS).f_X=bb_random_Rnd2(-5.0,(bb_scene_Scene_Width-5));
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<109>";
		dbg_object(t_tS).f_Y=-10.0;
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<112>";
	dbg_object(t_tS).f_Frame=((bb_random_Rnd2(0.0,10.0))|0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<114>";
	dbg_object(t_tS).f_XS=bb_random_Rnd2(-2.0,4.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<115>";
	dbg_object(t_tS).f_YS=bb_random_Rnd2(0.1,1.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<117>";
	this.f_Snowflakes.m_AddLast5(t_tS);
	pop_err();
}
bb_scene_Scene.prototype.m_Update=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<44>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<44>";
	var t_=this.f_Trees.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<44>";
	while(t_.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<44>";
		var t_tTree=t_.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<45>";
		t_tTree.m_Update();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<48>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<48>";
	var t_2=this.f_Houses.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<48>";
	while(t_2.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<48>";
		var t_tHouse=t_2.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<49>";
		t_tHouse.m_Update();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<52>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<52>";
	var t_3=this.f_Stars.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<52>";
	while(t_3.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<52>";
		var t_tStar=t_3.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<53>";
		t_tStar.m_Update();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<56>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<56>";
	var t_4=this.f_Snowmen.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<56>";
	while(t_4.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<56>";
		var t_tSnowman=t_4.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<57>";
		t_tSnowman.m_Update();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<60>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<60>";
	var t_5=this.f_Snowflakes.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<60>";
	while(t_5.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<60>";
		var t_tSnowflake=t_5.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<61>";
		t_tSnowflake.m_Update();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<64>";
	if(bb_random_Rnd()<0.1){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<65>";
		this.m_AddSnowFlake();
	}
	pop_err();
}
bb_scene_Scene.prototype.m_Render=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<71>";
	bb_graphics_SetColor(255.0,255.0,255.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<72>";
	bb_graphics_SetAlpha(1.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<73>";
	bb_graphics_DrawImage(bb_scene_Scene_Background,0.0,0.0,0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<75>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<75>";
	var t_=this.f_Stars.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<75>";
	while(t_.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<75>";
		var t_tStar=t_.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<76>";
		t_tStar.m_Render();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<79>";
	this.f_moon.m_Render();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<81>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<81>";
	var t_2=this.f_Trees.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<81>";
	while(t_2.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<81>";
		var t_tTree=t_2.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<82>";
		t_tTree.m_Render();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<85>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<85>";
	var t_3=this.f_Houses.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<85>";
	while(t_3.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<85>";
		var t_tHouse=t_3.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<86>";
		t_tHouse.m_Render();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<89>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<89>";
	var t_4=this.f_Snowmen.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<89>";
	while(t_4.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<89>";
		var t_tSnowman=t_4.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<90>";
		t_tSnowman.m_Render();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<93>";
	for(var t_i=0;t_i<this.f_FloorSegmentCount;t_i=t_i+1){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<94>";
		dbg_array(this.f_FloorSegments,t_i)[dbg_index].m_Render();
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<97>";
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<97>";
	var t_5=this.f_Snowflakes.m_ObjectEnumerator();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<97>";
	while(t_5.m_HasNext()){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<97>";
		var t_tSnowflake=t_5.m_NextObject();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<98>";
		t_tSnowflake.m_Render();
	}
	pop_err();
}
function bb_sfx_SFX(){
	Object.call(this);
}
var bb_sfx_SFX_ActiveChannel;
var bb_sfx_SFX_Sounds;
var bb_sfx_SFX_Musics;
function bb_sfx_SFX_Init(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/sfx.monkey<18>";
	bb_sfx_SFX_ActiveChannel=0;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/sfx.monkey<19>";
	bb_sfx_SFX_Sounds=bb_map_StringMap_new.call(new bb_map_StringMap);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/sfx.monkey<20>";
	bb_sfx_SFX_Musics=bb_map_StringMap2_new.call(new bb_map_StringMap2);
	pop_err();
}
function bb_audio_Sound(){
	Object.call(this);
}
function bb_map_Map(){
	Object.call(this);
}
function bb_map_Map_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/map.monkey<7>";
	pop_err();
	return this;
}
function bb_map_StringMap(){
	bb_map_Map.call(this);
}
bb_map_StringMap.prototype=extend_class(bb_map_Map);
function bb_map_StringMap_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/map.monkey<551>";
	bb_map_Map_new.call(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/map.monkey<551>";
	pop_err();
	return this;
}
function bb_map_Map2(){
	Object.call(this);
}
function bb_map_Map2_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/map.monkey<7>";
	pop_err();
	return this;
}
function bb_map_StringMap2(){
	bb_map_Map2.call(this);
}
bb_map_StringMap2.prototype=extend_class(bb_map_Map2);
function bb_map_StringMap2_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/map.monkey<551>";
	bb_map_Map2_new.call(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/map.monkey<551>";
	pop_err();
	return this;
}
function bb_autofit_VirtualDisplay(){
	Object.call(this);
	this.f_vwidth=.0;
	this.f_vheight=.0;
	this.f_vzoom=.0;
	this.f_lastvzoom=.0;
	this.f_vratio=.0;
	this.f_lastdevicewidth=0;
	this.f_lastdeviceheight=0;
	this.f_device_changed=0;
	this.f_fdw=.0;
	this.f_fdh=.0;
	this.f_dratio=.0;
	this.f_multi=.0;
	this.f_heightborder=.0;
	this.f_widthborder=.0;
	this.f_zoom_changed=0;
	this.f_realx=.0;
	this.f_realy=.0;
	this.f_offx=.0;
	this.f_offy=.0;
	this.f_sx=.0;
	this.f_sw=.0;
	this.f_sy=.0;
	this.f_sh=.0;
	this.f_scaledw=.0;
	this.f_scaledh=.0;
	this.f_vxoff=.0;
	this.f_vyoff=.0;
}
var bb_autofit_VirtualDisplay_Display;
function bb_autofit_VirtualDisplay_new(t_width,t_height,t_zoom){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<266>";
	this.f_vwidth=(t_width);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<267>";
	this.f_vheight=(t_height);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<269>";
	this.f_vzoom=t_zoom;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<270>";
	this.f_lastvzoom=this.f_vzoom+1.0;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<274>";
	this.f_vratio=this.f_vheight/this.f_vwidth;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<278>";
	bb_autofit_VirtualDisplay_Display=this;
	pop_err();
	return this;
}
function bb_autofit_VirtualDisplay_new2(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<216>";
	pop_err();
	return this;
}
bb_autofit_VirtualDisplay.prototype.m_UpdateVirtualDisplay=function(t_zoomborders,t_keepborders){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<444>";
	if(bb_graphics_DeviceWidth()!=this.f_lastdevicewidth || bb_graphics_DeviceHeight()!=this.f_lastdeviceheight){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<445>";
		this.f_lastdevicewidth=bb_graphics_DeviceWidth();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<446>";
		this.f_lastdeviceheight=bb_graphics_DeviceHeight();
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<447>";
		this.f_device_changed=1;
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<454>";
	if((this.f_device_changed)!=0){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<459>";
		this.f_fdw=(bb_graphics_DeviceWidth());
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<460>";
		this.f_fdh=(bb_graphics_DeviceHeight());
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<465>";
		this.f_dratio=this.f_fdh/this.f_fdw;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<469>";
		if(this.f_dratio>this.f_vratio){
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<478>";
			this.f_multi=this.f_fdw/this.f_vwidth;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<482>";
			this.f_heightborder=(this.f_fdh-this.f_vheight*this.f_multi)*0.5;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<483>";
			this.f_widthborder=0.0;
		}else{
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<494>";
			this.f_multi=this.f_fdh/this.f_vheight;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<498>";
			this.f_widthborder=(this.f_fdw-this.f_vwidth*this.f_multi)*0.5;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<499>";
			this.f_heightborder=0.0;
		}
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<509>";
	if(this.f_vzoom!=this.f_lastvzoom){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<510>";
		this.f_lastvzoom=this.f_vzoom;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<511>";
		this.f_zoom_changed=1;
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<518>";
	if(((this.f_zoom_changed)!=0) || ((this.f_device_changed)!=0)){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<520>";
		if(t_zoomborders){
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<524>";
			this.f_realx=this.f_vwidth*this.f_vzoom*this.f_multi;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<525>";
			this.f_realy=this.f_vheight*this.f_vzoom*this.f_multi;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<529>";
			this.f_offx=(this.f_fdw-this.f_realx)*0.5;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<530>";
			this.f_offy=(this.f_fdh-this.f_realy)*0.5;
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<532>";
			if(t_keepborders){
				err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<538>";
				if(this.f_offx<this.f_widthborder){
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<539>";
					this.f_sx=this.f_widthborder;
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<540>";
					this.f_sw=this.f_fdw-this.f_widthborder*2.0;
				}else{
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<542>";
					this.f_sx=this.f_offx;
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<543>";
					this.f_sw=this.f_fdw-this.f_offx*2.0;
				}
				err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<546>";
				if(this.f_offy<this.f_heightborder){
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<547>";
					this.f_sy=this.f_heightborder;
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<548>";
					this.f_sh=this.f_fdh-this.f_heightborder*2.0;
				}else{
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<550>";
					this.f_sy=this.f_offy;
					err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<551>";
					this.f_sh=this.f_fdh-this.f_offy*2.0;
				}
			}else{
				err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<556>";
				this.f_sx=this.f_offx;
				err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<557>";
				this.f_sw=this.f_fdw-this.f_offx*2.0;
				err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<559>";
				this.f_sy=this.f_offy;
				err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<560>";
				this.f_sh=this.f_fdh-this.f_offy*2.0;
			}
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<566>";
			this.f_sx=bb_math_Max2(0.0,this.f_sx);
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<567>";
			this.f_sy=bb_math_Max2(0.0,this.f_sy);
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<568>";
			this.f_sw=bb_math_Min2(this.f_sw,this.f_fdw);
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<569>";
			this.f_sh=bb_math_Min2(this.f_sh,this.f_fdh);
		}else{
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<575>";
			this.f_sx=bb_math_Max2(0.0,this.f_widthborder);
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<576>";
			this.f_sy=bb_math_Max2(0.0,this.f_heightborder);
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<577>";
			this.f_sw=bb_math_Min2(this.f_fdw-this.f_widthborder*2.0,this.f_fdw);
			err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<578>";
			this.f_sh=bb_math_Min2(this.f_fdh-this.f_heightborder*2.0,this.f_fdh);
		}
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<584>";
		this.f_scaledw=this.f_vwidth*this.f_multi*this.f_vzoom;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<585>";
		this.f_scaledh=this.f_vheight*this.f_multi*this.f_vzoom;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<589>";
		this.f_vxoff=(this.f_fdw-this.f_scaledw)*0.5;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<590>";
		this.f_vyoff=(this.f_fdh-this.f_scaledh)*0.5;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<594>";
		this.f_vxoff=this.f_vxoff/this.f_multi/this.f_vzoom;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<595>";
		this.f_vyoff=this.f_vyoff/this.f_multi/this.f_vzoom;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<599>";
		this.f_device_changed=0;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<600>";
		this.f_zoom_changed=0;
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<608>";
	bb_graphics_SetScissor(0.0,0.0,(bb_graphics_DeviceWidth()),(bb_graphics_DeviceHeight()));
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<609>";
	bb_graphics_Cls(0.0,0.0,0.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<615>";
	bb_graphics_SetScissor(this.f_sx,this.f_sy,this.f_sw,this.f_sh);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<621>";
	bb_graphics_Scale(this.f_multi*this.f_vzoom,this.f_multi*this.f_vzoom);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<627>";
	if((this.f_vzoom)!=0.0){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<627>";
		bb_graphics_Translate(this.f_vxoff,this.f_vyoff);
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<629>";
	pop_err();
	return 0;
}
function bb_autofit_SetVirtualDisplay(t_width,t_height,t_zoom){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<110>";
	bb_autofit_VirtualDisplay_new.call(new bb_autofit_VirtualDisplay,t_width,t_height,t_zoom);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<111>";
	pop_err();
	return 0;
}
function bb_floorsegment_FloorSegment(){
	Object.call(this);
	this.f_scene=null;
	this.f_X=0;
	this.f_Y=0;
}
var bb_floorsegment_FloorSegment_Width;
function bb_floorsegment_FloorSegment_new(t_tS){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/floorsegment.monkey<12>";
	this.f_scene=t_tS;
	pop_err();
	return this;
}
function bb_floorsegment_FloorSegment_new2(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/floorsegment.monkey<3>";
	pop_err();
	return this;
}
bb_floorsegment_FloorSegment.prototype.m_SetPos=function(t_tX,t_tY){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/floorsegment.monkey<16>";
	this.f_X=t_tX;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/floorsegment.monkey<17>";
	this.f_Y=t_tY;
	pop_err();
}
bb_floorsegment_FloorSegment.prototype.m_Render=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/floorsegment.monkey<21>";
	bb_gfx_GFX_Draw(this.f_X,this.f_Y,0,96,bb_floorsegment_FloorSegment_Width,64);
	pop_err();
}
function bb_tree_Tree(){
	Object.call(this);
}
bb_tree_Tree.prototype.m_Update=function(){
	push_err();
	pop_err();
}
bb_tree_Tree.prototype.m_Render=function(){
	push_err();
	pop_err();
}
function bb_list_List(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode_new.call(new bb_list_HeadNode));
}
function bb_list_List_new(){
	push_err();
	pop_err();
	return this;
}
bb_list_List.prototype.m_AddLast=function(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<120>";
	var t_=bb_list_Node_new.call(new bb_list_Node,this.f__head,dbg_object(this.f__head).f__pred,t_data);
	pop_err();
	return t_;
}
function bb_list_List_new2(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_=t_data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_2=0;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	while(t_2<t_.length){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		var t_t=dbg_array(t_,t_2)[dbg_index];
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		t_2=t_2+1;
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<14>";
		this.m_AddLast(t_t);
	}
	pop_err();
	return this;
}
bb_list_List.prototype.m_ObjectEnumerator=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<124>";
	var t_=bb_list_Enumerator_new.call(new bb_list_Enumerator,this);
	pop_err();
	return t_;
}
function bb_list_Node(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node_new(t_succ,t_pred,t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<199>";
	this.f__succ=t_succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<200>";
	this.f__pred=t_pred;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<201>";
	dbg_object(this.f__succ).f__pred=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<202>";
	dbg_object(this.f__pred).f__succ=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<203>";
	this.f__data=t_data;
	pop_err();
	return this;
}
function bb_list_Node_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<196>";
	pop_err();
	return this;
}
function bb_list_HeadNode(){
	bb_list_Node.call(this);
}
bb_list_HeadNode.prototype=extend_class(bb_list_Node);
function bb_list_HeadNode_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<248>";
	bb_list_Node_new2.call(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<249>";
	this.f__succ=(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<250>";
	this.f__pred=(this);
	pop_err();
	return this;
}
function bb_house_House(){
	Object.call(this);
}
bb_house_House.prototype.m_Update=function(){
	push_err();
	pop_err();
}
bb_house_House.prototype.m_Render=function(){
	push_err();
	pop_err();
}
function bb_list_List2(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode2_new.call(new bb_list_HeadNode2));
}
function bb_list_List2_new(){
	push_err();
	pop_err();
	return this;
}
bb_list_List2.prototype.m_AddLast2=function(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<120>";
	var t_=bb_list_Node2_new.call(new bb_list_Node2,this.f__head,dbg_object(this.f__head).f__pred,t_data);
	pop_err();
	return t_;
}
function bb_list_List2_new2(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_=t_data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_2=0;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	while(t_2<t_.length){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		var t_t=dbg_array(t_,t_2)[dbg_index];
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		t_2=t_2+1;
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<14>";
		this.m_AddLast2(t_t);
	}
	pop_err();
	return this;
}
bb_list_List2.prototype.m_ObjectEnumerator=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<124>";
	var t_=bb_list_Enumerator2_new.call(new bb_list_Enumerator2,this);
	pop_err();
	return t_;
}
function bb_list_Node2(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node2_new(t_succ,t_pred,t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<199>";
	this.f__succ=t_succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<200>";
	this.f__pred=t_pred;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<201>";
	dbg_object(this.f__succ).f__pred=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<202>";
	dbg_object(this.f__pred).f__succ=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<203>";
	this.f__data=t_data;
	pop_err();
	return this;
}
function bb_list_Node2_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<196>";
	pop_err();
	return this;
}
function bb_list_HeadNode2(){
	bb_list_Node2.call(this);
}
bb_list_HeadNode2.prototype=extend_class(bb_list_Node2);
function bb_list_HeadNode2_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<248>";
	bb_list_Node2_new2.call(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<249>";
	this.f__succ=(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<250>";
	this.f__pred=(this);
	pop_err();
	return this;
}
function bb_star_Star(){
	Object.call(this);
}
bb_star_Star.prototype.m_Update=function(){
	push_err();
	pop_err();
}
bb_star_Star.prototype.m_Render=function(){
	push_err();
	pop_err();
}
function bb_list_List3(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode3_new.call(new bb_list_HeadNode3));
}
function bb_list_List3_new(){
	push_err();
	pop_err();
	return this;
}
bb_list_List3.prototype.m_AddLast3=function(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<120>";
	var t_=bb_list_Node3_new.call(new bb_list_Node3,this.f__head,dbg_object(this.f__head).f__pred,t_data);
	pop_err();
	return t_;
}
function bb_list_List3_new2(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_=t_data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_2=0;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	while(t_2<t_.length){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		var t_t=dbg_array(t_,t_2)[dbg_index];
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		t_2=t_2+1;
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<14>";
		this.m_AddLast3(t_t);
	}
	pop_err();
	return this;
}
bb_list_List3.prototype.m_ObjectEnumerator=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<124>";
	var t_=bb_list_Enumerator3_new.call(new bb_list_Enumerator3,this);
	pop_err();
	return t_;
}
function bb_list_Node3(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node3_new(t_succ,t_pred,t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<199>";
	this.f__succ=t_succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<200>";
	this.f__pred=t_pred;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<201>";
	dbg_object(this.f__succ).f__pred=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<202>";
	dbg_object(this.f__pred).f__succ=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<203>";
	this.f__data=t_data;
	pop_err();
	return this;
}
function bb_list_Node3_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<196>";
	pop_err();
	return this;
}
function bb_list_HeadNode3(){
	bb_list_Node3.call(this);
}
bb_list_HeadNode3.prototype=extend_class(bb_list_Node3);
function bb_list_HeadNode3_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<248>";
	bb_list_Node3_new2.call(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<249>";
	this.f__succ=(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<250>";
	this.f__pred=(this);
	pop_err();
	return this;
}
function bb_snowman_Snowman(){
	Object.call(this);
}
bb_snowman_Snowman.prototype.m_Update=function(){
	push_err();
	pop_err();
}
bb_snowman_Snowman.prototype.m_Render=function(){
	push_err();
	pop_err();
}
function bb_list_List4(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode4_new.call(new bb_list_HeadNode4));
}
function bb_list_List4_new(){
	push_err();
	pop_err();
	return this;
}
bb_list_List4.prototype.m_AddLast4=function(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<120>";
	var t_=bb_list_Node4_new.call(new bb_list_Node4,this.f__head,dbg_object(this.f__head).f__pred,t_data);
	pop_err();
	return t_;
}
function bb_list_List4_new2(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_=t_data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_2=0;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	while(t_2<t_.length){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		var t_t=dbg_array(t_,t_2)[dbg_index];
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		t_2=t_2+1;
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<14>";
		this.m_AddLast4(t_t);
	}
	pop_err();
	return this;
}
bb_list_List4.prototype.m_ObjectEnumerator=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<124>";
	var t_=bb_list_Enumerator4_new.call(new bb_list_Enumerator4,this);
	pop_err();
	return t_;
}
function bb_list_Node4(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node4_new(t_succ,t_pred,t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<199>";
	this.f__succ=t_succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<200>";
	this.f__pred=t_pred;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<201>";
	dbg_object(this.f__succ).f__pred=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<202>";
	dbg_object(this.f__pred).f__succ=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<203>";
	this.f__data=t_data;
	pop_err();
	return this;
}
function bb_list_Node4_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<196>";
	pop_err();
	return this;
}
function bb_list_HeadNode4(){
	bb_list_Node4.call(this);
}
bb_list_HeadNode4.prototype=extend_class(bb_list_Node4);
function bb_list_HeadNode4_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<248>";
	bb_list_Node4_new2.call(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<249>";
	this.f__succ=(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<250>";
	this.f__pred=(this);
	pop_err();
	return this;
}
function bb_snowflake_Snowflake(){
	Object.call(this);
	this.f_XS=.0;
	this.f_X=.0;
	this.f_YS=.0;
	this.f_Y=.0;
	this.f_scene=null;
	this.f_Frame=0;
}
bb_snowflake_Snowflake.prototype.m_Update=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<24>";
	this.f_X+=this.f_XS;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<25>";
	this.f_Y+=this.f_YS;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<27>";
	this.f_XS+=bb_random_Rnd2(-0.5,0.5);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<28>";
	this.f_YS+=bb_random_Rnd2(-0.1,0.1);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<29>";
	if(this.f_YS<0.0){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<30>";
		this.f_YS=0.0;
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<33>";
	if(this.f_X>(bb_scene_Scene_Width+16) || this.f_Y>(bb_scene_Scene_Height+16)){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<34>";
		dbg_object(this.f_scene).f_Snowflakes.m_Remove(this);
	}
	pop_err();
}
function bb_snowflake_Snowflake_new(t_tS){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<18>";
	this.f_scene=t_tS;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<19>";
	this.f_Frame=0;
	pop_err();
	return this;
}
function bb_snowflake_Snowflake_new2(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<3>";
	pop_err();
	return this;
}
bb_snowflake_Snowflake.prototype.m_Render=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/snowflake.monkey<40>";
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,0,16,16);
	pop_err();
}
function bb_list_List5(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode5_new.call(new bb_list_HeadNode5));
}
function bb_list_List5_new(){
	push_err();
	pop_err();
	return this;
}
bb_list_List5.prototype.m_AddLast5=function(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<120>";
	var t_=bb_list_Node5_new.call(new bb_list_Node5,this.f__head,dbg_object(this.f__head).f__pred,t_data);
	pop_err();
	return t_;
}
function bb_list_List5_new2(t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_=t_data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	var t_2=0;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
	while(t_2<t_.length){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		var t_t=dbg_array(t_,t_2)[dbg_index];
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<13>";
		t_2=t_2+1;
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<14>";
		this.m_AddLast5(t_t);
	}
	pop_err();
	return this;
}
bb_list_List5.prototype.m_ObjectEnumerator=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<124>";
	var t_=bb_list_Enumerator5_new.call(new bb_list_Enumerator5,this);
	pop_err();
	return t_;
}
bb_list_List5.prototype.m_Equals=function(t_lhs,t_rhs){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<28>";
	var t_=t_lhs==t_rhs;
	pop_err();
	return t_;
}
bb_list_List5.prototype.m_RemoveEach=function(t_value){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<107>";
	var t_node=dbg_object(this.f__head).f__succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<108>";
	while(t_node!=this.f__head){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<109>";
		var t_succ=dbg_object(t_node).f__succ;
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<110>";
		if(this.m_Equals(dbg_object(t_node).f__data,t_value)){
			err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<110>";
			t_node.m_Remove2();
		}
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<111>";
		t_node=t_succ;
	}
	pop_err();
	return 0;
}
bb_list_List5.prototype.m_Remove=function(t_value){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<103>";
	this.m_RemoveEach(t_value);
	pop_err();
	return 0;
}
function bb_list_Node5(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node5_new(t_succ,t_pred,t_data){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<199>";
	this.f__succ=t_succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<200>";
	this.f__pred=t_pred;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<201>";
	dbg_object(this.f__succ).f__pred=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<202>";
	dbg_object(this.f__pred).f__succ=this;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<203>";
	this.f__data=t_data;
	pop_err();
	return this;
}
function bb_list_Node5_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<196>";
	pop_err();
	return this;
}
bb_list_Node5.prototype.m_Remove2=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<212>";
	if(dbg_object(this.f__succ).f__pred!=this){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<212>";
		error("Illegal operation on removed node");
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<214>";
	dbg_object(this.f__succ).f__pred=this.f__pred;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<215>";
	dbg_object(this.f__pred).f__succ=this.f__succ;
	pop_err();
	return 0;
}
function bb_list_HeadNode5(){
	bb_list_Node5.call(this);
}
bb_list_HeadNode5.prototype=extend_class(bb_list_Node5);
function bb_list_HeadNode5_new(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<248>";
	bb_list_Node5_new2.call(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<249>";
	this.f__succ=(this);
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<250>";
	this.f__pred=(this);
	pop_err();
	return this;
}
function bb_moon_Moon(){
	Object.call(this);
	this.f_scene=null;
	this.f_X=.0;
	this.f_Y=.0;
	this.f_Frame=.0;
}
function bb_moon_Moon_new(t_tS){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/moon.monkey<12>";
	this.f_scene=t_tS;
	pop_err();
	return this;
}
function bb_moon_Moon_new2(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/moon.monkey<3>";
	pop_err();
	return this;
}
bb_moon_Moon.prototype.m_Set=function(t_tX,t_tY,t_tF){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/moon.monkey<16>";
	this.f_X=t_tX;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/moon.monkey<17>";
	this.f_Y=t_tY;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/moon.monkey<18>";
	this.f_Frame=(t_tF);
	pop_err();
}
bb_moon_Moon.prototype.m_Render=function(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/moon.monkey<22>";
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),((0.0+this.f_Frame*32.0)|0),0,32,32);
	pop_err();
}
function bb_random_Rnd(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/random.monkey<21>";
	bb_random_Seed=bb_random_Seed*1664525+1013904223|0;
	err_info="C:/apps/MonkeyPro66/modules/monkey/random.monkey<22>";
	var t_=(bb_random_Seed>>8&16777215)/16777216.0;
	pop_err();
	return t_;
}
function bb_random_Rnd2(t_low,t_high){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/random.monkey<30>";
	var t_=bb_random_Rnd3(t_high-t_low)+t_low;
	pop_err();
	return t_;
}
function bb_random_Rnd3(t_range){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/random.monkey<26>";
	var t_=bb_random_Rnd()*t_range;
	pop_err();
	return t_;
}
function bb_scene_GenerateScene(){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<123>";
	var t_tS=bb_scene_Scene_new.call(new bb_scene_Scene);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<126>";
	var t_sY=bb_random_Rnd2((bb_scene_Scene_Height)*0.66,(bb_scene_Scene_Height)*0.9);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<127>";
	var t_fY=t_sY;
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<128>";
	var t_maxFlux=bb_random_Rnd2(5.0,30.0);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<129>";
	for(var t_i=0;t_i<dbg_object(t_tS).f_FloorSegmentCount;t_i=t_i+1){
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<130>";
		var t_fX=t_i*bb_floorsegment_FloorSegment_Width;
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<131>";
		dbg_array(dbg_object(t_tS).f_FloorSegments,t_i)[dbg_index].m_SetPos(t_fX,((t_fY)|0));
		err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<132>";
		t_fY=t_sY+Math.sin((t_fX)*D2R)*t_maxFlux;
	}
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<136>";
	dbg_object(t_tS).f_moon.m_Set(bb_random_Rnd2(-32.0,(bb_scene_Scene_Width-32)),bb_random_Rnd2(-32.0,(bb_scene_Scene_Height)*0.33),((bb_random_Rnd2(0.0,6.0))|0));
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/scene.monkey<149>";
	pop_err();
	return t_tS;
}
function bb_list_Enumerator(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator_new(t_list){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<264>";
	this.f__list=t_list;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<265>";
	this.f__curr=dbg_object(dbg_object(t_list).f__head).f__succ;
	pop_err();
	return this;
}
function bb_list_Enumerator_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<261>";
	pop_err();
	return this;
}
bb_list_Enumerator.prototype.m_HasNext=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<269>";
	while(dbg_object(dbg_object(this.f__curr).f__succ).f__pred!=this.f__curr){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<270>";
		this.f__curr=dbg_object(this.f__curr).f__succ;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<272>";
	var t_=this.f__curr!=dbg_object(this.f__list).f__head;
	pop_err();
	return t_;
}
bb_list_Enumerator.prototype.m_NextObject=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<276>";
	var t_data=dbg_object(this.f__curr).f__data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<277>";
	this.f__curr=dbg_object(this.f__curr).f__succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<278>";
	pop_err();
	return t_data;
}
function bb_list_Enumerator2(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator2_new(t_list){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<264>";
	this.f__list=t_list;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<265>";
	this.f__curr=dbg_object(dbg_object(t_list).f__head).f__succ;
	pop_err();
	return this;
}
function bb_list_Enumerator2_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<261>";
	pop_err();
	return this;
}
bb_list_Enumerator2.prototype.m_HasNext=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<269>";
	while(dbg_object(dbg_object(this.f__curr).f__succ).f__pred!=this.f__curr){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<270>";
		this.f__curr=dbg_object(this.f__curr).f__succ;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<272>";
	var t_=this.f__curr!=dbg_object(this.f__list).f__head;
	pop_err();
	return t_;
}
bb_list_Enumerator2.prototype.m_NextObject=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<276>";
	var t_data=dbg_object(this.f__curr).f__data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<277>";
	this.f__curr=dbg_object(this.f__curr).f__succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<278>";
	pop_err();
	return t_data;
}
function bb_list_Enumerator3(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator3_new(t_list){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<264>";
	this.f__list=t_list;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<265>";
	this.f__curr=dbg_object(dbg_object(t_list).f__head).f__succ;
	pop_err();
	return this;
}
function bb_list_Enumerator3_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<261>";
	pop_err();
	return this;
}
bb_list_Enumerator3.prototype.m_HasNext=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<269>";
	while(dbg_object(dbg_object(this.f__curr).f__succ).f__pred!=this.f__curr){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<270>";
		this.f__curr=dbg_object(this.f__curr).f__succ;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<272>";
	var t_=this.f__curr!=dbg_object(this.f__list).f__head;
	pop_err();
	return t_;
}
bb_list_Enumerator3.prototype.m_NextObject=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<276>";
	var t_data=dbg_object(this.f__curr).f__data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<277>";
	this.f__curr=dbg_object(this.f__curr).f__succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<278>";
	pop_err();
	return t_data;
}
function bb_list_Enumerator4(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator4_new(t_list){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<264>";
	this.f__list=t_list;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<265>";
	this.f__curr=dbg_object(dbg_object(t_list).f__head).f__succ;
	pop_err();
	return this;
}
function bb_list_Enumerator4_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<261>";
	pop_err();
	return this;
}
bb_list_Enumerator4.prototype.m_HasNext=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<269>";
	while(dbg_object(dbg_object(this.f__curr).f__succ).f__pred!=this.f__curr){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<270>";
		this.f__curr=dbg_object(this.f__curr).f__succ;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<272>";
	var t_=this.f__curr!=dbg_object(this.f__list).f__head;
	pop_err();
	return t_;
}
bb_list_Enumerator4.prototype.m_NextObject=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<276>";
	var t_data=dbg_object(this.f__curr).f__data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<277>";
	this.f__curr=dbg_object(this.f__curr).f__succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<278>";
	pop_err();
	return t_data;
}
function bb_list_Enumerator5(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator5_new(t_list){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<264>";
	this.f__list=t_list;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<265>";
	this.f__curr=dbg_object(dbg_object(t_list).f__head).f__succ;
	pop_err();
	return this;
}
function bb_list_Enumerator5_new2(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<261>";
	pop_err();
	return this;
}
bb_list_Enumerator5.prototype.m_HasNext=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<269>";
	while(dbg_object(dbg_object(this.f__curr).f__succ).f__pred!=this.f__curr){
		err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<270>";
		this.f__curr=dbg_object(this.f__curr).f__succ;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<272>";
	var t_=this.f__curr!=dbg_object(this.f__list).f__head;
	pop_err();
	return t_;
}
bb_list_Enumerator5.prototype.m_NextObject=function(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<276>";
	var t_data=dbg_object(this.f__curr).f__data;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<277>";
	this.f__curr=dbg_object(this.f__curr).f__succ;
	err_info="C:/apps/MonkeyPro66/modules/monkey/list.monkey<278>";
	pop_err();
	return t_data;
}
function bb_math_Max(t_x,t_y){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<56>";
	if(t_x>t_y){
		err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<56>";
		pop_err();
		return t_x;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<57>";
	pop_err();
	return t_y;
}
function bb_math_Max2(t_x,t_y){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<83>";
	if(t_x>t_y){
		err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<83>";
		pop_err();
		return t_x;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<84>";
	pop_err();
	return t_y;
}
function bb_math_Min(t_x,t_y){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<51>";
	if(t_x<t_y){
		err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<51>";
		pop_err();
		return t_x;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<52>";
	pop_err();
	return t_y;
}
function bb_math_Min2(t_x,t_y){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<78>";
	if(t_x<t_y){
		err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<78>";
		pop_err();
		return t_x;
	}
	err_info="C:/apps/MonkeyPro66/modules/monkey/math.monkey<79>";
	pop_err();
	return t_y;
}
function bb_graphics_DebugRenderDevice(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<48>";
	if(!((bb_graphics_renderDevice)!=null)){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<48>";
		error("Rendering operations can only be performed inside OnRender");
	}
	pop_err();
	return 0;
}
function bb_graphics_Cls(t_r,t_g,t_b){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<354>";
	bb_graphics_DebugRenderDevice();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<356>";
	bb_graphics_renderDevice.Cls(t_r,t_g,t_b);
	pop_err();
	return 0;
}
function bb_graphics_Transform(t_ix,t_iy,t_jx,t_jy,t_tx,t_ty){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<331>";
	var t_ix2=t_ix*dbg_object(bb_graphics_context).f_ix+t_iy*dbg_object(bb_graphics_context).f_jx;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<332>";
	var t_iy2=t_ix*dbg_object(bb_graphics_context).f_iy+t_iy*dbg_object(bb_graphics_context).f_jy;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<333>";
	var t_jx2=t_jx*dbg_object(bb_graphics_context).f_ix+t_jy*dbg_object(bb_graphics_context).f_jx;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<334>";
	var t_jy2=t_jx*dbg_object(bb_graphics_context).f_iy+t_jy*dbg_object(bb_graphics_context).f_jy;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<335>";
	var t_tx2=t_tx*dbg_object(bb_graphics_context).f_ix+t_ty*dbg_object(bb_graphics_context).f_jx+dbg_object(bb_graphics_context).f_tx;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<336>";
	var t_ty2=t_tx*dbg_object(bb_graphics_context).f_iy+t_ty*dbg_object(bb_graphics_context).f_jy+dbg_object(bb_graphics_context).f_ty;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<337>";
	bb_graphics_SetMatrix(t_ix2,t_iy2,t_jx2,t_jy2,t_tx2,t_ty2);
	pop_err();
	return 0;
}
function bb_graphics_Transform2(t_m){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<327>";
	bb_graphics_Transform(dbg_array(t_m,0)[dbg_index],dbg_array(t_m,1)[dbg_index],dbg_array(t_m,2)[dbg_index],dbg_array(t_m,3)[dbg_index],dbg_array(t_m,4)[dbg_index],dbg_array(t_m,5)[dbg_index]);
	pop_err();
	return 0;
}
function bb_graphics_Scale(t_x,t_y){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<345>";
	bb_graphics_Transform(t_x,0.0,0.0,t_y,0.0,0.0);
	pop_err();
	return 0;
}
function bb_graphics_Translate(t_x,t_y){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<341>";
	bb_graphics_Transform(1.0,0.0,0.0,1.0,t_x,t_y);
	pop_err();
	return 0;
}
function bb_autofit_UpdateVirtualDisplay(t_zoomborders,t_keepborders){
	push_err();
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<171>";
	bb_autofit_VirtualDisplay_Display.m_UpdateVirtualDisplay(t_zoomborders,t_keepborders);
	err_info="C:/Users/Chris/Documents/GitHub/CM-XMAS-2012/src/autofit.monkey<172>";
	pop_err();
	return 0;
}
function bb_graphics_PushMatrix(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<310>";
	var t_sp=dbg_object(bb_graphics_context).f_matrixSp;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<311>";
	dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+0)[dbg_index]=dbg_object(bb_graphics_context).f_ix
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<312>";
	dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+1)[dbg_index]=dbg_object(bb_graphics_context).f_iy
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<313>";
	dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+2)[dbg_index]=dbg_object(bb_graphics_context).f_jx
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<314>";
	dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+3)[dbg_index]=dbg_object(bb_graphics_context).f_jy
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<315>";
	dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+4)[dbg_index]=dbg_object(bb_graphics_context).f_tx
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<316>";
	dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+5)[dbg_index]=dbg_object(bb_graphics_context).f_ty
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<317>";
	dbg_object(bb_graphics_context).f_matrixSp=t_sp+6;
	pop_err();
	return 0;
}
function bb_graphics_PopMatrix(){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<321>";
	var t_sp=dbg_object(bb_graphics_context).f_matrixSp-6;
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<322>";
	bb_graphics_SetMatrix(dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+0)[dbg_index],dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+1)[dbg_index],dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+2)[dbg_index],dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+3)[dbg_index],dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+4)[dbg_index],dbg_array(dbg_object(bb_graphics_context).f_matrixStack,t_sp+5)[dbg_index]);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<323>";
	dbg_object(bb_graphics_context).f_matrixSp=t_sp;
	pop_err();
	return 0;
}
function bb_graphics_DrawImage(t_image,t_x,t_y,t_frame){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<417>";
	bb_graphics_DebugRenderDevice();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<419>";
	var t_f=dbg_array(dbg_object(t_image).f_frames,t_frame)[dbg_index];
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<421>";
	if((dbg_object(bb_graphics_context).f_tformed)!=0){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<422>";
		bb_graphics_PushMatrix();
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<424>";
		bb_graphics_Translate(t_x-dbg_object(t_image).f_tx,t_y-dbg_object(t_image).f_ty);
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<426>";
		bb_graphics_context.m_Validate();
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<428>";
		if((dbg_object(t_image).f_flags&65536)!=0){
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<429>";
			bb_graphics_renderDevice.DrawSurface(dbg_object(t_image).f_surface,0.0,0.0);
		}else{
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<431>";
			bb_graphics_renderDevice.DrawSurface2(dbg_object(t_image).f_surface,0.0,0.0,dbg_object(t_f).f_x,dbg_object(t_f).f_y,dbg_object(t_image).f_width,dbg_object(t_image).f_height);
		}
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<434>";
		bb_graphics_PopMatrix();
	}else{
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<436>";
		bb_graphics_context.m_Validate();
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<438>";
		if((dbg_object(t_image).f_flags&65536)!=0){
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<439>";
			bb_graphics_renderDevice.DrawSurface(dbg_object(t_image).f_surface,t_x-dbg_object(t_image).f_tx,t_y-dbg_object(t_image).f_ty);
		}else{
			err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<441>";
			bb_graphics_renderDevice.DrawSurface2(dbg_object(t_image).f_surface,t_x-dbg_object(t_image).f_tx,t_y-dbg_object(t_image).f_ty,dbg_object(t_f).f_x,dbg_object(t_f).f_y,dbg_object(t_image).f_width,dbg_object(t_image).f_height);
		}
	}
	pop_err();
	return 0;
}
function bb_graphics_Rotate(t_angle){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<349>";
	bb_graphics_Transform(Math.cos((t_angle)*D2R),-Math.sin((t_angle)*D2R),Math.sin((t_angle)*D2R),Math.cos((t_angle)*D2R),0.0,0.0);
	pop_err();
	return 0;
}
function bb_graphics_DrawImage2(t_image,t_x,t_y,t_rotation,t_scaleX,t_scaleY,t_frame){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<448>";
	bb_graphics_DebugRenderDevice();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<450>";
	var t_f=dbg_array(dbg_object(t_image).f_frames,t_frame)[dbg_index];
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<452>";
	bb_graphics_PushMatrix();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<454>";
	bb_graphics_Translate(t_x,t_y);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<455>";
	bb_graphics_Rotate(t_rotation);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<456>";
	bb_graphics_Scale(t_scaleX,t_scaleY);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<458>";
	bb_graphics_Translate(-dbg_object(t_image).f_tx,-dbg_object(t_image).f_ty);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<460>";
	bb_graphics_context.m_Validate();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<462>";
	if((dbg_object(t_image).f_flags&65536)!=0){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<463>";
		bb_graphics_renderDevice.DrawSurface(dbg_object(t_image).f_surface,0.0,0.0);
	}else{
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<465>";
		bb_graphics_renderDevice.DrawSurface2(dbg_object(t_image).f_surface,0.0,0.0,dbg_object(t_f).f_x,dbg_object(t_f).f_y,dbg_object(t_image).f_width,dbg_object(t_image).f_height);
	}
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<468>";
	bb_graphics_PopMatrix();
	pop_err();
	return 0;
}
function bb_graphics_DrawImageRect(t_image,t_x,t_y,t_srcX,t_srcY,t_srcWidth,t_srcHeight,t_frame){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<473>";
	bb_graphics_DebugRenderDevice();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<475>";
	var t_f=dbg_array(dbg_object(t_image).f_frames,t_frame)[dbg_index];
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<477>";
	if((dbg_object(bb_graphics_context).f_tformed)!=0){
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<478>";
		bb_graphics_PushMatrix();
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<481>";
		bb_graphics_Translate(-dbg_object(t_image).f_tx+t_x,-dbg_object(t_image).f_ty+t_y);
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<483>";
		bb_graphics_context.m_Validate();
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<485>";
		bb_graphics_renderDevice.DrawSurface2(dbg_object(t_image).f_surface,0.0,0.0,t_srcX+dbg_object(t_f).f_x,t_srcY+dbg_object(t_f).f_y,t_srcWidth,t_srcHeight);
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<487>";
		bb_graphics_PopMatrix();
	}else{
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<489>";
		bb_graphics_context.m_Validate();
		err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<491>";
		bb_graphics_renderDevice.DrawSurface2(dbg_object(t_image).f_surface,-dbg_object(t_image).f_tx+t_x,-dbg_object(t_image).f_ty+t_y,t_srcX+dbg_object(t_f).f_x,t_srcY+dbg_object(t_f).f_y,t_srcWidth,t_srcHeight);
	}
	pop_err();
	return 0;
}
function bb_graphics_DrawImageRect2(t_image,t_x,t_y,t_srcX,t_srcY,t_srcWidth,t_srcHeight,t_rotation,t_scaleX,t_scaleY,t_frame){
	push_err();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<497>";
	bb_graphics_DebugRenderDevice();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<499>";
	var t_f=dbg_array(dbg_object(t_image).f_frames,t_frame)[dbg_index];
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<501>";
	bb_graphics_PushMatrix();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<503>";
	bb_graphics_Translate(t_x,t_y);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<504>";
	bb_graphics_Rotate(t_rotation);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<505>";
	bb_graphics_Scale(t_scaleX,t_scaleY);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<506>";
	bb_graphics_Translate(-dbg_object(t_image).f_tx,-dbg_object(t_image).f_ty);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<508>";
	bb_graphics_context.m_Validate();
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<510>";
	bb_graphics_renderDevice.DrawSurface2(dbg_object(t_image).f_surface,0.0,0.0,t_srcX+dbg_object(t_f).f_x,t_srcY+dbg_object(t_f).f_y,t_srcWidth,t_srcHeight);
	err_info="C:/apps/MonkeyPro66/modules/mojo/graphics.monkey<512>";
	bb_graphics_PopMatrix();
	pop_err();
	return 0;
}
function bbInit(){
	bb_graphics_device=null;
	bb_input_device=null;
	bb_audio_device=null;
	bb_app_device=null;
	bb_graphics_context=bb_graphics_GraphicsContext_new.call(new bb_graphics_GraphicsContext);
	bb_graphics_Image_DefaultFlags=0;
	bb_graphics_renderDevice=null;
	bb_random_Seed=1234;
	bb_gfx_GFX_Tileset=null;
	bb_scene_Scene_Background=null;
	bb_sfx_SFX_ActiveChannel=0;
	bb_sfx_SFX_Sounds=null;
	bb_sfx_SFX_Musics=null;
	bb_autofit_VirtualDisplay_Display=null;
	bb_scene_Scene_Width=360;
	bb_floorsegment_FloorSegment_Width=8;
	bb_scene_Scene_Height=240;
}
//${TRANSCODE_END}
