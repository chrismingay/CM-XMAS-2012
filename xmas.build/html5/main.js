
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
CFG_CONFIG="release";
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
var META_DATA="[gfx/xmas_scene.png];type=image/png;width=360;height=240;\n[gfx/xmas_sprites.png];type=image/png;width=512;height=512;\n[mojo_font.png];type=image/png;width=864;height=13;\n";
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
	bb_app_device=bb_app_AppDevice_new.call(new bb_app_AppDevice,this);
	return this;
}
bb_app_App.prototype.m_OnCreate=function(){
	return 0;
}
bb_app_App.prototype.m_OnUpdate=function(){
	return 0;
}
bb_app_App.prototype.m_OnSuspend=function(){
	return 0;
}
bb_app_App.prototype.m_OnResume=function(){
	return 0;
}
bb_app_App.prototype.m_OnRender=function(){
	return 0;
}
bb_app_App.prototype.m_OnLoading=function(){
	return 0;
}
function bb_xmas_XmasApp(){
	bb_app_App.call(this);
	this.f_scene=null;
}
bb_xmas_XmasApp.prototype=extend_class(bb_app_App);
function bb_xmas_XmasApp_new(){
	bb_app_App_new.call(this);
	return this;
}
bb_xmas_XmasApp.prototype.m_OnCreate=function(){
	bb_app_SetUpdateRate(30);
	bb_random_Seed=systemMillisecs();
	bb_gfx_GFX_Init();
	bb_scene_Scene_Init();
	bb_sfx_SFX_Init();
	bb_autofit_SetVirtualDisplay(360,240,1.0);
	this.f_scene=bb_scene_GenerateScene();
	bb_audio_PlayMusic("mus/sleigh.mp3",1);
	return 1;
}
bb_xmas_XmasApp.prototype.m_OnUpdate=function(){
	if((bb_input_KeyHit(32))!=0){
		this.f_scene=bb_scene_GenerateScene();
	}
	this.f_scene.m_Update();
	return 1;
}
bb_xmas_XmasApp.prototype.m_OnRender=function(){
	bb_autofit_UpdateVirtualDisplay(true,true);
	bb_graphics_Cls(0.0,0.0,0.0);
	this.f_scene.m_Render();
	return 1;
}
function bb_app_AppDevice(){
	gxtkApp.call(this);
	this.f_app=null;
	this.f_updateRate=0;
}
bb_app_AppDevice.prototype=extend_class(gxtkApp);
function bb_app_AppDevice_new(t_app){
	this.f_app=t_app;
	bb_graphics_SetGraphicsDevice(this.GraphicsDevice());
	bb_input_SetInputDevice(this.InputDevice());
	bb_audio_SetAudioDevice(this.AudioDevice());
	return this;
}
function bb_app_AppDevice_new2(){
	return this;
}
bb_app_AppDevice.prototype.OnCreate=function(){
	bb_graphics_SetFont(null,32);
	return this.f_app.m_OnCreate();
}
bb_app_AppDevice.prototype.OnUpdate=function(){
	return this.f_app.m_OnUpdate();
}
bb_app_AppDevice.prototype.OnSuspend=function(){
	return this.f_app.m_OnSuspend();
}
bb_app_AppDevice.prototype.OnResume=function(){
	return this.f_app.m_OnResume();
}
bb_app_AppDevice.prototype.OnRender=function(){
	bb_graphics_BeginRender();
	var t_r=this.f_app.m_OnRender();
	bb_graphics_EndRender();
	return t_r;
}
bb_app_AppDevice.prototype.OnLoading=function(){
	bb_graphics_BeginRender();
	var t_r=this.f_app.m_OnLoading();
	bb_graphics_EndRender();
	return t_r;
}
bb_app_AppDevice.prototype.SetUpdateRate=function(t_hertz){
	gxtkApp.prototype.SetUpdateRate.call(this,t_hertz);
	this.f_updateRate=t_hertz;
	return 0;
}
var bb_graphics_device;
function bb_graphics_SetGraphicsDevice(t_dev){
	bb_graphics_device=t_dev;
	return 0;
}
var bb_input_device;
function bb_input_SetInputDevice(t_dev){
	bb_input_device=t_dev;
	return 0;
}
var bb_audio_device;
function bb_audio_SetAudioDevice(t_dev){
	bb_audio_device=t_dev;
	return 0;
}
var bb_app_device;
function bbMain(){
	bb_xmas_XmasApp_new.call(new bb_xmas_XmasApp);
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
	return this;
}
bb_graphics_Image.prototype.m_SetHandle=function(t_tx,t_ty){
	this.f_tx=t_tx;
	this.f_ty=t_ty;
	this.f_flags=this.f_flags&-2;
	return 0;
}
bb_graphics_Image.prototype.m_ApplyFlags=function(t_iflags){
	this.f_flags=t_iflags;
	if((this.f_flags&2)!=0){
		var t_=this.f_frames;
		var t_2=0;
		while(t_2<t_.length){
			var t_f=t_[t_2];
			t_2=t_2+1;
			t_f.f_x+=1;
		}
		this.f_width-=2;
	}
	if((this.f_flags&4)!=0){
		var t_3=this.f_frames;
		var t_4=0;
		while(t_4<t_3.length){
			var t_f2=t_3[t_4];
			t_4=t_4+1;
			t_f2.f_y+=1;
		}
		this.f_height-=2;
	}
	if((this.f_flags&1)!=0){
		this.m_SetHandle((this.f_width)/2.0,(this.f_height)/2.0);
	}
	if(this.f_frames.length==1 && this.f_frames[0].f_x==0 && this.f_frames[0].f_y==0 && this.f_width==this.f_surface.Width() && this.f_height==this.f_surface.Height()){
		this.f_flags|=65536;
	}
	return 0;
}
bb_graphics_Image.prototype.m_Init=function(t_surf,t_nframes,t_iflags){
	this.f_surface=t_surf;
	this.f_width=((this.f_surface.Width()/t_nframes)|0);
	this.f_height=this.f_surface.Height();
	this.f_frames=new_object_array(t_nframes);
	for(var t_i=0;t_i<t_nframes;t_i=t_i+1){
		this.f_frames[t_i]=bb_graphics_Frame_new.call(new bb_graphics_Frame,t_i*this.f_width,0);
	}
	this.m_ApplyFlags(t_iflags);
	return this;
}
bb_graphics_Image.prototype.m_Grab=function(t_x,t_y,t_iwidth,t_iheight,t_nframes,t_iflags,t_source){
	this.f_source=t_source;
	this.f_surface=t_source.f_surface;
	this.f_width=t_iwidth;
	this.f_height=t_iheight;
	this.f_frames=new_object_array(t_nframes);
	var t_ix=t_x;
	var t_iy=t_y;
	for(var t_i=0;t_i<t_nframes;t_i=t_i+1){
		if(t_ix+this.f_width>t_source.f_width){
			t_ix=0;
			t_iy+=this.f_height;
		}
		if(t_ix+this.f_width>t_source.f_width || t_iy+this.f_height>t_source.f_height){
			error("Image frame outside surface");
		}
		this.f_frames[t_i]=bb_graphics_Frame_new.call(new bb_graphics_Frame,t_ix+t_source.f_frames[0].f_x,t_iy+t_source.f_frames[0].f_y);
		t_ix+=this.f_width;
	}
	this.m_ApplyFlags(t_iflags);
	return this;
}
bb_graphics_Image.prototype.m_GrabImage=function(t_x,t_y,t_width,t_height,t_frames,t_flags){
	if(this.f_frames.length!=1){
		return null;
	}
	return (bb_graphics_Image_new.call(new bb_graphics_Image)).m_Grab(t_x,t_y,t_width,t_height,t_frames,t_flags,this);
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
	return this;
}
bb_graphics_GraphicsContext.prototype.m_Validate=function(){
	if((this.f_matDirty)!=0){
		bb_graphics_renderDevice.SetMatrix(bb_graphics_context.f_ix,bb_graphics_context.f_iy,bb_graphics_context.f_jx,bb_graphics_context.f_jy,bb_graphics_context.f_tx,bb_graphics_context.f_ty);
		this.f_matDirty=0;
	}
	return 0;
}
var bb_graphics_context;
function bb_data_FixDataPath(t_path){
	var t_i=t_path.indexOf(":/",0);
	if(t_i!=-1 && t_path.indexOf("/",0)==t_i+1){
		return t_path;
	}
	if(string_startswith(t_path,"./") || string_startswith(t_path,"/")){
		return t_path;
	}
	return "monkey://data/"+t_path;
}
function bb_graphics_Frame(){
	Object.call(this);
	this.f_x=0;
	this.f_y=0;
}
function bb_graphics_Frame_new(t_x,t_y){
	this.f_x=t_x;
	this.f_y=t_y;
	return this;
}
function bb_graphics_Frame_new2(){
	return this;
}
function bb_graphics_LoadImage(t_path,t_frameCount,t_flags){
	var t_surf=bb_graphics_device.LoadSurface(bb_data_FixDataPath(t_path));
	if((t_surf)!=null){
		return (bb_graphics_Image_new.call(new bb_graphics_Image)).m_Init(t_surf,t_frameCount,t_flags);
	}
	return null;
}
function bb_graphics_LoadImage2(t_path,t_frameWidth,t_frameHeight,t_frameCount,t_flags){
	var t_atlas=bb_graphics_LoadImage(t_path,1,0);
	if((t_atlas)!=null){
		return t_atlas.m_GrabImage(0,0,t_frameWidth,t_frameHeight,t_frameCount,t_flags);
	}
	return null;
}
function bb_graphics_SetFont(t_font,t_firstChar){
	if(!((t_font)!=null)){
		if(!((bb_graphics_context.f_defaultFont)!=null)){
			bb_graphics_context.f_defaultFont=bb_graphics_LoadImage("mojo_font.png",96,2);
		}
		t_font=bb_graphics_context.f_defaultFont;
		t_firstChar=32;
	}
	bb_graphics_context.f_font=t_font;
	bb_graphics_context.f_firstChar=t_firstChar;
	return 0;
}
var bb_graphics_renderDevice;
function bb_graphics_SetMatrix(t_ix,t_iy,t_jx,t_jy,t_tx,t_ty){
	bb_graphics_context.f_ix=t_ix;
	bb_graphics_context.f_iy=t_iy;
	bb_graphics_context.f_jx=t_jx;
	bb_graphics_context.f_jy=t_jy;
	bb_graphics_context.f_tx=t_tx;
	bb_graphics_context.f_ty=t_ty;
	bb_graphics_context.f_tformed=((t_ix!=1.0 || t_iy!=0.0 || t_jx!=0.0 || t_jy!=1.0 || t_tx!=0.0 || t_ty!=0.0)?1:0);
	bb_graphics_context.f_matDirty=1;
	return 0;
}
function bb_graphics_SetMatrix2(t_m){
	bb_graphics_SetMatrix(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
	return 0;
}
function bb_graphics_SetColor(t_r,t_g,t_b){
	bb_graphics_context.f_color_r=t_r;
	bb_graphics_context.f_color_g=t_g;
	bb_graphics_context.f_color_b=t_b;
	bb_graphics_renderDevice.SetColor(t_r,t_g,t_b);
	return 0;
}
function bb_graphics_SetAlpha(t_alpha){
	bb_graphics_context.f_alpha=t_alpha;
	bb_graphics_renderDevice.SetAlpha(t_alpha);
	return 0;
}
function bb_graphics_SetBlend(t_blend){
	bb_graphics_context.f_blend=t_blend;
	bb_graphics_renderDevice.SetBlend(t_blend);
	return 0;
}
function bb_graphics_DeviceWidth(){
	return bb_graphics_device.Width();
}
function bb_graphics_DeviceHeight(){
	return bb_graphics_device.Height();
}
function bb_graphics_SetScissor(t_x,t_y,t_width,t_height){
	bb_graphics_context.f_scissor_x=t_x;
	bb_graphics_context.f_scissor_y=t_y;
	bb_graphics_context.f_scissor_width=t_width;
	bb_graphics_context.f_scissor_height=t_height;
	bb_graphics_renderDevice.SetScissor(((t_x)|0),((t_y)|0),((t_width)|0),((t_height)|0));
	return 0;
}
function bb_graphics_BeginRender(){
	if(!((bb_graphics_device.Mode())!=0)){
		return 0;
	}
	bb_graphics_renderDevice=bb_graphics_device;
	bb_graphics_context.f_matrixSp=0;
	bb_graphics_SetMatrix(1.0,0.0,0.0,1.0,0.0,0.0);
	bb_graphics_SetColor(255.0,255.0,255.0);
	bb_graphics_SetAlpha(1.0);
	bb_graphics_SetBlend(0);
	bb_graphics_SetScissor(0.0,0.0,(bb_graphics_DeviceWidth()),(bb_graphics_DeviceHeight()));
	return 0;
}
function bb_graphics_EndRender(){
	bb_graphics_renderDevice=null;
	return 0;
}
function bb_app_SetUpdateRate(t_hertz){
	return bb_app_device.SetUpdateRate(t_hertz);
}
var bb_random_Seed;
function bb_gfx_GFX(){
	Object.call(this);
}
var bb_gfx_GFX_Tileset;
function bb_gfx_GFX_Init(){
	bb_gfx_GFX_Tileset=bb_graphics_LoadImage("gfx/xmas_sprites.png",1,bb_graphics_Image_DefaultFlags);
}
function bb_gfx_GFX_Draw(t_tX,t_tY,t_X,t_Y,t_W,t_H){
	bb_graphics_DrawImageRect(bb_gfx_GFX_Tileset,(t_tX),(t_tY),t_X,t_Y,t_W,t_H,0);
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
	this.f_FloorStartY=.0;
	this.f_FloorHFlux=.0;
	this.f_FloorVFlux=.0;
}
var bb_scene_Scene_Background;
function bb_scene_Scene_Init(){
	bb_scene_Scene_Background=bb_graphics_LoadImage("gfx/xmas_scene.png",1,bb_graphics_Image_DefaultFlags);
}
var bb_scene_Scene_Width;
function bb_scene_Scene_new(){
	this.f_FloorSegmentCount=((bb_scene_Scene_Width/bb_floorsegment_FloorSegment_Width)|0)+1;
	this.f_FloorSegments=new_object_array(this.f_FloorSegmentCount);
	for(var t_i=0;t_i<this.f_FloorSegmentCount;t_i=t_i+1){
		this.f_FloorSegments[t_i]=bb_floorsegment_FloorSegment_new.call(new bb_floorsegment_FloorSegment,this);
	}
	this.f_Trees=bb_list_List_new.call(new bb_list_List);
	this.f_Houses=bb_list_List2_new.call(new bb_list_List2);
	this.f_Stars=bb_list_List3_new.call(new bb_list_List3);
	this.f_Snowmen=bb_list_List4_new.call(new bb_list_List4);
	this.f_Snowflakes=bb_list_List5_new.call(new bb_list_List5);
	this.f_moon=bb_moon_Moon_new.call(new bb_moon_Moon,this);
	return this;
}
var bb_scene_Scene_Height;
bb_scene_Scene.prototype.m_GetFloorYAtX=function(t_tX){
	return this.f_FloorStartY+Math.sin((t_tX*this.f_FloorHFlux)*D2R)*this.f_FloorVFlux;
}
bb_scene_Scene.prototype.m_AddSnowFlake=function(){
	var t_tS=bb_snowflake_Snowflake_new.call(new bb_snowflake_Snowflake,this);
	if(bb_random_Rnd()<0.5){
		t_tS.f_X=-10.0;
		t_tS.f_Y=bb_random_Rnd2(-5.0,(bb_scene_Scene_Height-5));
	}else{
		t_tS.f_X=bb_random_Rnd2(-5.0,(bb_scene_Scene_Width-5));
		t_tS.f_Y=-10.0;
	}
	t_tS.f_Frame=((bb_random_Rnd2(0.0,7.0))|0);
	t_tS.f_XS=bb_random_Rnd2(-1.0,2.0);
	t_tS.f_YS=bb_random_Rnd2(0.1,1.0);
	this.f_Snowflakes.m_AddLast5(t_tS);
}
bb_scene_Scene.prototype.m_Update=function(){
	var t_=this.f_Trees.m_ObjectEnumerator();
	while(t_.m_HasNext()){
		var t_tTree=t_.m_NextObject();
		t_tTree.m_Update();
	}
	var t_2=this.f_Houses.m_ObjectEnumerator();
	while(t_2.m_HasNext()){
		var t_tHouse=t_2.m_NextObject();
		t_tHouse.m_Update();
	}
	var t_3=this.f_Stars.m_ObjectEnumerator();
	while(t_3.m_HasNext()){
		var t_tStar=t_3.m_NextObject();
		t_tStar.m_Update();
	}
	var t_4=this.f_Snowmen.m_ObjectEnumerator();
	while(t_4.m_HasNext()){
		var t_tSnowman=t_4.m_NextObject();
		t_tSnowman.m_Update();
	}
	var t_5=this.f_Snowflakes.m_ObjectEnumerator();
	while(t_5.m_HasNext()){
		var t_tSnowflake=t_5.m_NextObject();
		t_tSnowflake.m_Update();
	}
	if(bb_random_Rnd()<0.1){
		this.m_AddSnowFlake();
	}
}
bb_scene_Scene.prototype.m_Render=function(){
	bb_graphics_SetColor(255.0,255.0,255.0);
	bb_graphics_SetAlpha(1.0);
	bb_graphics_DrawImage(bb_scene_Scene_Background,0.0,0.0,0);
	var t_=this.f_Stars.m_ObjectEnumerator();
	while(t_.m_HasNext()){
		var t_tStar=t_.m_NextObject();
		t_tStar.m_Render();
	}
	bb_graphics_SetAlpha(1.0);
	this.f_moon.m_Render();
	var t_2=this.f_Trees.m_ObjectEnumerator();
	while(t_2.m_HasNext()){
		var t_tTree=t_2.m_NextObject();
		t_tTree.m_Render();
	}
	bb_graphics_SetAlpha(1.0);
	var t_3=this.f_Houses.m_ObjectEnumerator();
	while(t_3.m_HasNext()){
		var t_tHouse=t_3.m_NextObject();
		t_tHouse.m_Render();
	}
	var t_4=this.f_Snowmen.m_ObjectEnumerator();
	while(t_4.m_HasNext()){
		var t_tSnowman=t_4.m_NextObject();
		t_tSnowman.m_Render();
	}
	for(var t_i=0;t_i<this.f_FloorSegmentCount;t_i=t_i+1){
		this.f_FloorSegments[t_i].m_Render();
	}
	var t_5=this.f_Snowflakes.m_ObjectEnumerator();
	while(t_5.m_HasNext()){
		var t_tSnowflake=t_5.m_NextObject();
		t_tSnowflake.m_Render();
	}
}
function bb_sfx_SFX(){
	Object.call(this);
}
var bb_sfx_SFX_ActiveChannel;
var bb_sfx_SFX_Sounds;
var bb_sfx_SFX_Musics;
function bb_sfx_SFX_Init(){
	bb_sfx_SFX_ActiveChannel=0;
	bb_sfx_SFX_Sounds=bb_map_StringMap_new.call(new bb_map_StringMap);
	bb_sfx_SFX_Musics=bb_map_StringMap2_new.call(new bb_map_StringMap2);
}
function bb_audio_Sound(){
	Object.call(this);
}
function bb_map_Map(){
	Object.call(this);
}
function bb_map_Map_new(){
	return this;
}
function bb_map_StringMap(){
	bb_map_Map.call(this);
}
bb_map_StringMap.prototype=extend_class(bb_map_Map);
function bb_map_StringMap_new(){
	bb_map_Map_new.call(this);
	return this;
}
function bb_map_Map2(){
	Object.call(this);
}
function bb_map_Map2_new(){
	return this;
}
function bb_map_StringMap2(){
	bb_map_Map2.call(this);
}
bb_map_StringMap2.prototype=extend_class(bb_map_Map2);
function bb_map_StringMap2_new(){
	bb_map_Map2_new.call(this);
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
	this.f_vwidth=(t_width);
	this.f_vheight=(t_height);
	this.f_vzoom=t_zoom;
	this.f_lastvzoom=this.f_vzoom+1.0;
	this.f_vratio=this.f_vheight/this.f_vwidth;
	bb_autofit_VirtualDisplay_Display=this;
	return this;
}
function bb_autofit_VirtualDisplay_new2(){
	return this;
}
bb_autofit_VirtualDisplay.prototype.m_UpdateVirtualDisplay=function(t_zoomborders,t_keepborders){
	if(bb_graphics_DeviceWidth()!=this.f_lastdevicewidth || bb_graphics_DeviceHeight()!=this.f_lastdeviceheight){
		this.f_lastdevicewidth=bb_graphics_DeviceWidth();
		this.f_lastdeviceheight=bb_graphics_DeviceHeight();
		this.f_device_changed=1;
	}
	if((this.f_device_changed)!=0){
		this.f_fdw=(bb_graphics_DeviceWidth());
		this.f_fdh=(bb_graphics_DeviceHeight());
		this.f_dratio=this.f_fdh/this.f_fdw;
		if(this.f_dratio>this.f_vratio){
			this.f_multi=this.f_fdw/this.f_vwidth;
			this.f_heightborder=(this.f_fdh-this.f_vheight*this.f_multi)*0.5;
			this.f_widthborder=0.0;
		}else{
			this.f_multi=this.f_fdh/this.f_vheight;
			this.f_widthborder=(this.f_fdw-this.f_vwidth*this.f_multi)*0.5;
			this.f_heightborder=0.0;
		}
	}
	if(this.f_vzoom!=this.f_lastvzoom){
		this.f_lastvzoom=this.f_vzoom;
		this.f_zoom_changed=1;
	}
	if(((this.f_zoom_changed)!=0) || ((this.f_device_changed)!=0)){
		if(t_zoomborders){
			this.f_realx=this.f_vwidth*this.f_vzoom*this.f_multi;
			this.f_realy=this.f_vheight*this.f_vzoom*this.f_multi;
			this.f_offx=(this.f_fdw-this.f_realx)*0.5;
			this.f_offy=(this.f_fdh-this.f_realy)*0.5;
			if(t_keepborders){
				if(this.f_offx<this.f_widthborder){
					this.f_sx=this.f_widthborder;
					this.f_sw=this.f_fdw-this.f_widthborder*2.0;
				}else{
					this.f_sx=this.f_offx;
					this.f_sw=this.f_fdw-this.f_offx*2.0;
				}
				if(this.f_offy<this.f_heightborder){
					this.f_sy=this.f_heightborder;
					this.f_sh=this.f_fdh-this.f_heightborder*2.0;
				}else{
					this.f_sy=this.f_offy;
					this.f_sh=this.f_fdh-this.f_offy*2.0;
				}
			}else{
				this.f_sx=this.f_offx;
				this.f_sw=this.f_fdw-this.f_offx*2.0;
				this.f_sy=this.f_offy;
				this.f_sh=this.f_fdh-this.f_offy*2.0;
			}
			this.f_sx=bb_math_Max2(0.0,this.f_sx);
			this.f_sy=bb_math_Max2(0.0,this.f_sy);
			this.f_sw=bb_math_Min2(this.f_sw,this.f_fdw);
			this.f_sh=bb_math_Min2(this.f_sh,this.f_fdh);
		}else{
			this.f_sx=bb_math_Max2(0.0,this.f_widthborder);
			this.f_sy=bb_math_Max2(0.0,this.f_heightborder);
			this.f_sw=bb_math_Min2(this.f_fdw-this.f_widthborder*2.0,this.f_fdw);
			this.f_sh=bb_math_Min2(this.f_fdh-this.f_heightborder*2.0,this.f_fdh);
		}
		this.f_scaledw=this.f_vwidth*this.f_multi*this.f_vzoom;
		this.f_scaledh=this.f_vheight*this.f_multi*this.f_vzoom;
		this.f_vxoff=(this.f_fdw-this.f_scaledw)*0.5;
		this.f_vyoff=(this.f_fdh-this.f_scaledh)*0.5;
		this.f_vxoff=this.f_vxoff/this.f_multi/this.f_vzoom;
		this.f_vyoff=this.f_vyoff/this.f_multi/this.f_vzoom;
		this.f_device_changed=0;
		this.f_zoom_changed=0;
	}
	bb_graphics_SetScissor(0.0,0.0,(bb_graphics_DeviceWidth()),(bb_graphics_DeviceHeight()));
	bb_graphics_Cls(0.0,0.0,0.0);
	bb_graphics_SetScissor(this.f_sx,this.f_sy,this.f_sw,this.f_sh);
	bb_graphics_Scale(this.f_multi*this.f_vzoom,this.f_multi*this.f_vzoom);
	if((this.f_vzoom)!=0.0){
		bb_graphics_Translate(this.f_vxoff,this.f_vyoff);
	}
	return 0;
}
function bb_autofit_SetVirtualDisplay(t_width,t_height,t_zoom){
	bb_autofit_VirtualDisplay_new.call(new bb_autofit_VirtualDisplay,t_width,t_height,t_zoom);
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
	this.f_scene=t_tS;
	return this;
}
function bb_floorsegment_FloorSegment_new2(){
	return this;
}
bb_floorsegment_FloorSegment.prototype.m_SetPos=function(t_tX,t_tY){
	this.f_X=t_tX;
	this.f_Y=t_tY;
}
bb_floorsegment_FloorSegment.prototype.m_Render=function(){
	bb_gfx_GFX_Draw(this.f_X,this.f_Y,0,96,bb_floorsegment_FloorSegment_Width,100);
}
function bb_tree_Tree(){
	Object.call(this);
	this.f_scene=null;
	this.f_Lights=null;
	this.f_Frame=0;
	this.f_X=.0;
	this.f_Y=.0;
	this.f_BlinkRate=0;
	this.f_BlinkRateTimer=0;
}
function bb_tree_Tree_new(t_tS){
	this.f_scene=t_tS;
	this.f_Lights=bb_list_List6_new.call(new bb_list_List6);
	return this;
}
function bb_tree_Tree_new2(){
	return this;
}
bb_tree_Tree.prototype.m_SetPos2=function(t_tX,t_tY){
	this.f_X=t_tX;
	this.f_Y=t_tY;
}
bb_tree_Tree.prototype.m_Update=function(){
	this.f_BlinkRateTimer+=1;
	if(this.f_BlinkRateTimer>=this.f_BlinkRate){
		this.f_BlinkRateTimer=0;
		var t_=this.f_Lights.m_ObjectEnumerator();
		while(t_.m_HasNext()){
			var t_tTL=t_.m_NextObject();
			t_tTL.m_Blink();
		}
	}
}
bb_tree_Tree.prototype.m_Render=function(){
	bb_graphics_SetAlpha(1.0);
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),16+this.f_Frame*16,96,16,32);
	var t_=this.f_Lights.m_ObjectEnumerator();
	while(t_.m_HasNext()){
		var t_tTL=t_.m_NextObject();
		t_tTL.m_Render();
	}
}
function bb_list_List(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode_new.call(new bb_list_HeadNode));
}
function bb_list_List_new(){
	return this;
}
bb_list_List.prototype.m_AddLast=function(t_data){
	return bb_list_Node_new.call(new bb_list_Node,this.f__head,this.f__head.f__pred,t_data);
}
function bb_list_List_new2(t_data){
	var t_=t_data;
	var t_2=0;
	while(t_2<t_.length){
		var t_t=t_[t_2];
		t_2=t_2+1;
		this.m_AddLast(t_t);
	}
	return this;
}
bb_list_List.prototype.m_ObjectEnumerator=function(){
	return bb_list_Enumerator_new.call(new bb_list_Enumerator,this);
}
function bb_list_Node(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node_new(t_succ,t_pred,t_data){
	this.f__succ=t_succ;
	this.f__pred=t_pred;
	this.f__succ.f__pred=this;
	this.f__pred.f__succ=this;
	this.f__data=t_data;
	return this;
}
function bb_list_Node_new2(){
	return this;
}
function bb_list_HeadNode(){
	bb_list_Node.call(this);
}
bb_list_HeadNode.prototype=extend_class(bb_list_Node);
function bb_list_HeadNode_new(){
	bb_list_Node_new2.call(this);
	this.f__succ=(this);
	this.f__pred=(this);
	return this;
}
function bb_house_House(){
	Object.call(this);
}
bb_house_House.prototype.m_Update=function(){
}
bb_house_House.prototype.m_Render=function(){
}
function bb_list_List2(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode2_new.call(new bb_list_HeadNode2));
}
function bb_list_List2_new(){
	return this;
}
bb_list_List2.prototype.m_AddLast2=function(t_data){
	return bb_list_Node2_new.call(new bb_list_Node2,this.f__head,this.f__head.f__pred,t_data);
}
function bb_list_List2_new2(t_data){
	var t_=t_data;
	var t_2=0;
	while(t_2<t_.length){
		var t_t=t_[t_2];
		t_2=t_2+1;
		this.m_AddLast2(t_t);
	}
	return this;
}
bb_list_List2.prototype.m_ObjectEnumerator=function(){
	return bb_list_Enumerator3_new.call(new bb_list_Enumerator3,this);
}
function bb_list_Node2(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node2_new(t_succ,t_pred,t_data){
	this.f__succ=t_succ;
	this.f__pred=t_pred;
	this.f__succ.f__pred=this;
	this.f__pred.f__succ=this;
	this.f__data=t_data;
	return this;
}
function bb_list_Node2_new2(){
	return this;
}
function bb_list_HeadNode2(){
	bb_list_Node2.call(this);
}
bb_list_HeadNode2.prototype=extend_class(bb_list_Node2);
function bb_list_HeadNode2_new(){
	bb_list_Node2_new2.call(this);
	this.f__succ=(this);
	this.f__pred=(this);
	return this;
}
function bb_star_Star(){
	Object.call(this);
	this.f_scene=null;
	this.f_X=0;
	this.f_Y=0;
	this.f_alpha=.0;
	this.f_changeTimer=0;
	this.f_Frame=0;
}
function bb_star_Star_new(t_tS){
	this.f_scene=t_tS;
	return this;
}
function bb_star_Star_new2(){
	return this;
}
bb_star_Star.prototype.m_SetPos2=function(t_tX,t_tY){
	this.f_X=((t_tX)|0);
	this.f_Y=((t_tY)|0);
	return 0;
}
bb_star_Star.prototype.m_Update=function(){
	this.f_changeTimer+=1;
	if(this.f_changeTimer>=10){
		if(bb_random_Rnd()<0.25){
			this.f_Frame=((bb_random_Rnd2(0.0,5.0))|0);
		}
		this.f_changeTimer=0;
	}
	this.f_alpha+=bb_random_Rnd2(-0.1,0.1);
	this.f_alpha=bb_math_Clamp2(this.f_alpha,0.5,1.0);
}
bb_star_Star.prototype.m_Render=function(){
	bb_graphics_SetAlpha(this.f_alpha);
	bb_gfx_GFX_Draw(this.f_X,this.f_Y,0+this.f_Frame*16,16,1,1);
}
function bb_list_List3(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode3_new.call(new bb_list_HeadNode3));
}
function bb_list_List3_new(){
	return this;
}
bb_list_List3.prototype.m_AddLast3=function(t_data){
	return bb_list_Node3_new.call(new bb_list_Node3,this.f__head,this.f__head.f__pred,t_data);
}
function bb_list_List3_new2(t_data){
	var t_=t_data;
	var t_2=0;
	while(t_2<t_.length){
		var t_t=t_[t_2];
		t_2=t_2+1;
		this.m_AddLast3(t_t);
	}
	return this;
}
bb_list_List3.prototype.m_ObjectEnumerator=function(){
	return bb_list_Enumerator4_new.call(new bb_list_Enumerator4,this);
}
function bb_list_Node3(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node3_new(t_succ,t_pred,t_data){
	this.f__succ=t_succ;
	this.f__pred=t_pred;
	this.f__succ.f__pred=this;
	this.f__pred.f__succ=this;
	this.f__data=t_data;
	return this;
}
function bb_list_Node3_new2(){
	return this;
}
function bb_list_HeadNode3(){
	bb_list_Node3.call(this);
}
bb_list_HeadNode3.prototype=extend_class(bb_list_Node3);
function bb_list_HeadNode3_new(){
	bb_list_Node3_new2.call(this);
	this.f__succ=(this);
	this.f__pred=(this);
	return this;
}
function bb_snowman_Snowman(){
	Object.call(this);
	this.f_scene=null;
	this.f_head=null;
	this.f_body=null;
}
function bb_snowman_Snowman_new(t_tS){
	this.f_scene=t_tS;
	return this;
}
function bb_snowman_Snowman_new2(){
	return this;
}
bb_snowman_Snowman.prototype.m_SetPos2=function(t_tX,t_tY){
	this.f_head.m_SetPos2(t_tX,t_tY-24.0);
	this.f_body.m_SetPos2(t_tX,t_tY-12.0);
	return 0;
}
bb_snowman_Snowman.prototype.m_Update=function(){
}
bb_snowman_Snowman.prototype.m_Render=function(){
	this.f_body.m_Render();
	this.f_head.m_Render();
}
function bb_list_List4(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode4_new.call(new bb_list_HeadNode4));
}
function bb_list_List4_new(){
	return this;
}
bb_list_List4.prototype.m_AddLast4=function(t_data){
	return bb_list_Node4_new.call(new bb_list_Node4,this.f__head,this.f__head.f__pred,t_data);
}
function bb_list_List4_new2(t_data){
	var t_=t_data;
	var t_2=0;
	while(t_2<t_.length){
		var t_t=t_[t_2];
		t_2=t_2+1;
		this.m_AddLast4(t_t);
	}
	return this;
}
bb_list_List4.prototype.m_ObjectEnumerator=function(){
	return bb_list_Enumerator5_new.call(new bb_list_Enumerator5,this);
}
function bb_list_Node4(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node4_new(t_succ,t_pred,t_data){
	this.f__succ=t_succ;
	this.f__pred=t_pred;
	this.f__succ.f__pred=this;
	this.f__pred.f__succ=this;
	this.f__data=t_data;
	return this;
}
function bb_list_Node4_new2(){
	return this;
}
function bb_list_HeadNode4(){
	bb_list_Node4.call(this);
}
bb_list_HeadNode4.prototype=extend_class(bb_list_Node4);
function bb_list_HeadNode4_new(){
	bb_list_Node4_new2.call(this);
	this.f__succ=(this);
	this.f__pred=(this);
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
	this.f_X+=this.f_XS;
	this.f_Y+=this.f_YS;
	this.f_XS+=bb_random_Rnd2(-0.1,0.1);
	this.f_YS+=bb_random_Rnd2(-0.1,0.1);
	if(this.f_YS<0.0){
		this.f_YS=0.0;
	}
	if(this.f_X>(bb_scene_Scene_Width+16) || this.f_Y>(bb_scene_Scene_Height+16)){
		this.f_scene.f_Snowflakes.m_Remove(this);
	}
}
function bb_snowflake_Snowflake_new(t_tS){
	this.f_scene=t_tS;
	this.f_Frame=0;
	return this;
}
function bb_snowflake_Snowflake_new2(){
	return this;
}
bb_snowflake_Snowflake.prototype.m_Render=function(){
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,0,16,16);
}
function bb_list_List5(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode5_new.call(new bb_list_HeadNode5));
}
function bb_list_List5_new(){
	return this;
}
bb_list_List5.prototype.m_AddLast5=function(t_data){
	return bb_list_Node5_new.call(new bb_list_Node5,this.f__head,this.f__head.f__pred,t_data);
}
function bb_list_List5_new2(t_data){
	var t_=t_data;
	var t_2=0;
	while(t_2<t_.length){
		var t_t=t_[t_2];
		t_2=t_2+1;
		this.m_AddLast5(t_t);
	}
	return this;
}
bb_list_List5.prototype.m_ObjectEnumerator=function(){
	return bb_list_Enumerator6_new.call(new bb_list_Enumerator6,this);
}
bb_list_List5.prototype.m_Equals=function(t_lhs,t_rhs){
	return t_lhs==t_rhs;
}
bb_list_List5.prototype.m_RemoveEach=function(t_value){
	var t_node=this.f__head.f__succ;
	while(t_node!=this.f__head){
		var t_succ=t_node.f__succ;
		if(this.m_Equals(t_node.f__data,t_value)){
			t_node.m_Remove2();
		}
		t_node=t_succ;
	}
	return 0;
}
bb_list_List5.prototype.m_Remove=function(t_value){
	this.m_RemoveEach(t_value);
	return 0;
}
function bb_list_Node5(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node5_new(t_succ,t_pred,t_data){
	this.f__succ=t_succ;
	this.f__pred=t_pred;
	this.f__succ.f__pred=this;
	this.f__pred.f__succ=this;
	this.f__data=t_data;
	return this;
}
function bb_list_Node5_new2(){
	return this;
}
bb_list_Node5.prototype.m_Remove2=function(){
	this.f__succ.f__pred=this.f__pred;
	this.f__pred.f__succ=this.f__succ;
	return 0;
}
function bb_list_HeadNode5(){
	bb_list_Node5.call(this);
}
bb_list_HeadNode5.prototype=extend_class(bb_list_Node5);
function bb_list_HeadNode5_new(){
	bb_list_Node5_new2.call(this);
	this.f__succ=(this);
	this.f__pred=(this);
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
	this.f_scene=t_tS;
	return this;
}
function bb_moon_Moon_new2(){
	return this;
}
bb_moon_Moon.prototype.m_Set=function(t_tX,t_tY,t_tF){
	this.f_X=t_tX;
	this.f_Y=t_tY;
	this.f_Frame=(t_tF);
}
bb_moon_Moon.prototype.m_Render=function(){
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),((0.0+this.f_Frame*32.0)|0),208,32,32);
}
function bb_random_Rnd(){
	bb_random_Seed=bb_random_Seed*1664525+1013904223|0;
	return (bb_random_Seed>>8&16777215)/16777216.0;
}
function bb_random_Rnd2(t_low,t_high){
	return bb_random_Rnd3(t_high-t_low)+t_low;
}
function bb_random_Rnd3(t_range){
	return bb_random_Rnd()*t_range;
}
function bb_treelight_TreeLight(){
	Object.call(this);
	this.f_tree=null;
	this.f_scene=null;
	this.f_Frame=0;
	this.f_X=.0;
	this.f_Y=.0;
	this.f_Bright=false;
}
function bb_treelight_TreeLight_new(t_tT){
	this.f_tree=t_tT;
	this.f_scene=t_tT.f_scene;
	return this;
}
function bb_treelight_TreeLight_new2(){
	return this;
}
bb_treelight_TreeLight.prototype.m_SetPos2=function(t_tX,t_tY){
	this.f_X=t_tX;
	this.f_Y=t_tY;
}
bb_treelight_TreeLight.prototype.m_Blink=function(){
	this.f_Bright=!this.f_Bright;
}
bb_treelight_TreeLight.prototype.m_Render=function(){
	if(this.f_Bright){
		bb_graphics_SetAlpha(1.0);
	}else{
		bb_graphics_SetAlpha(0.2);
	}
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,64,3,3);
}
function bb_list_List6(){
	Object.call(this);
	this.f__head=(bb_list_HeadNode6_new.call(new bb_list_HeadNode6));
}
function bb_list_List6_new(){
	return this;
}
bb_list_List6.prototype.m_AddLast6=function(t_data){
	return bb_list_Node6_new.call(new bb_list_Node6,this.f__head,this.f__head.f__pred,t_data);
}
function bb_list_List6_new2(t_data){
	var t_=t_data;
	var t_2=0;
	while(t_2<t_.length){
		var t_t=t_[t_2];
		t_2=t_2+1;
		this.m_AddLast6(t_t);
	}
	return this;
}
bb_list_List6.prototype.m_ObjectEnumerator=function(){
	return bb_list_Enumerator2_new.call(new bb_list_Enumerator2,this);
}
function bb_list_Node6(){
	Object.call(this);
	this.f__succ=null;
	this.f__pred=null;
	this.f__data=null;
}
function bb_list_Node6_new(t_succ,t_pred,t_data){
	this.f__succ=t_succ;
	this.f__pred=t_pred;
	this.f__succ.f__pred=this;
	this.f__pred.f__succ=this;
	this.f__data=t_data;
	return this;
}
function bb_list_Node6_new2(){
	return this;
}
function bb_list_HeadNode6(){
	bb_list_Node6.call(this);
}
bb_list_HeadNode6.prototype=extend_class(bb_list_Node6);
function bb_list_HeadNode6_new(){
	bb_list_Node6_new2.call(this);
	this.f__succ=(this);
	this.f__pred=(this);
	return this;
}
function bb_treelight_GenerateTreeLight(t_tT){
	var t_tL=bb_treelight_TreeLight_new.call(new bb_treelight_TreeLight,t_tT);
	t_tL.f_Frame=((bb_random_Rnd2(0.0,4.0))|0);
	return t_tL;
}
function bb_tree_GenerateTree(t_tScene){
	var t_tT=bb_tree_Tree_new.call(new bb_tree_Tree,t_tScene);
	var t_tX=bb_random_Rnd2(-8.0,(bb_scene_Scene_Width-8));
	var t_tY=t_tScene.m_GetFloorYAtX(t_tX)-32.0;
	t_tT.f_Frame=((bb_random_Rnd2(0.0,2.0))|0);
	t_tT.m_SetPos2(t_tX,t_tY);
	t_tT.f_BlinkRate=((bb_random_Rnd2(3.0,20.0))|0);
	var t_tLC=((bb_random_Rnd2(5.0,10.0))|0);
	for(var t_i=0;t_i<t_tLC;t_i=t_i+1){
		var t_tL=bb_treelight_GenerateTreeLight(t_tT);
		t_tL.m_SetPos2(bb_random_Rnd2(t_tX+4.0,t_tX+12.0),bb_random_Rnd2(t_tY+8.0,t_tY+24.0));
		t_tT.f_Lights.m_AddLast6(t_tL);
	}
	return t_tT;
}
function bb_snowmanhead_SnowmanHead(){
	Object.call(this);
	this.f_snowman=null;
	this.f_scene=null;
	this.f_Frame=0;
	this.f_X=.0;
	this.f_Y=.0;
}
function bb_snowmanhead_SnowmanHead_new(t_tSnowman){
	this.f_snowman=t_tSnowman;
	this.f_scene=t_tSnowman.f_scene;
	this.f_Frame=0;
	return this;
}
function bb_snowmanhead_SnowmanHead_new2(){
	return this;
}
bb_snowmanhead_SnowmanHead.prototype.m_SetPos2=function(t_tX,t_tY){
	this.f_X=t_tX;
	this.f_Y=t_tY;
}
bb_snowmanhead_SnowmanHead.prototype.m_Render=function(){
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,32,16,16);
}
function bb_snowmanbody_SnowmanBody(){
	Object.call(this);
	this.f_snowman=null;
	this.f_scene=null;
	this.f_Frame=0;
	this.f_X=.0;
	this.f_Y=.0;
}
function bb_snowmanbody_SnowmanBody_new(t_tSnowman){
	this.f_snowman=t_tSnowman;
	this.f_scene=t_tSnowman.f_scene;
	this.f_Frame=0;
	return this;
}
function bb_snowmanbody_SnowmanBody_new2(){
	return this;
}
bb_snowmanbody_SnowmanBody.prototype.m_SetPos2=function(t_tX,t_tY){
	this.f_X=t_tX;
	this.f_Y=t_tY;
}
bb_snowmanbody_SnowmanBody.prototype.m_Render=function(){
	bb_gfx_GFX_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,48,16,16);
}
function bb_snowman_GenerateSnowman(t_tScene){
	var t_tS=bb_snowman_Snowman_new.call(new bb_snowman_Snowman,t_tScene);
	t_tS.f_head=bb_snowmanhead_SnowmanHead_new.call(new bb_snowmanhead_SnowmanHead,t_tS);
	t_tS.f_body=bb_snowmanbody_SnowmanBody_new.call(new bb_snowmanbody_SnowmanBody,t_tS);
	t_tS.f_head.f_Frame=((bb_random_Rnd2(0.0,4.0))|0);
	t_tS.f_body.f_Frame=((bb_random_Rnd2(0.0,4.0))|0);
	var t_tX=bb_random_Rnd2(-8.0,(bb_scene_Scene_Width-8));
	var t_tY=t_tScene.m_GetFloorYAtX(t_tX);
	t_tS.m_SetPos2(t_tX,t_tY);
	return t_tS;
}
function bb_scene_GenerateScene(){
	var t_tS=bb_scene_Scene_new.call(new bb_scene_Scene);
	t_tS.f_FloorStartY=bb_random_Rnd2((bb_scene_Scene_Height-64),(bb_scene_Scene_Height)*0.9);
	var t_fY=t_tS.f_FloorStartY;
	t_tS.f_FloorHFlux=bb_random_Rnd2(1.0,2.0);
	t_tS.f_FloorVFlux=bb_random_Rnd2(5.0,10.0);
	for(var t_i=0;t_i<t_tS.f_FloorSegmentCount;t_i=t_i+1){
		var t_fX=t_i*bb_floorsegment_FloorSegment_Width;
		t_tS.f_FloorSegments[t_i].m_SetPos(t_fX,((t_fY)|0));
		t_fY=t_tS.f_FloorStartY+Math.sin(((t_fX)*t_tS.f_FloorHFlux)*D2R)*t_tS.f_FloorVFlux;
	}
	t_tS.f_moon.m_Set(bb_random_Rnd2(-32.0,(bb_scene_Scene_Width-32)),bb_random_Rnd2(-32.0,(bb_scene_Scene_Height)*0.33),((bb_random_Rnd2(0.0,4.0))|0));
	var t_tSC=((bb_random_Rnd2(20.0,80.0))|0);
	for(var t_i2=0;t_i2<t_tSC;t_i2=t_i2+1){
		var t_tStar=bb_star_Star_new.call(new bb_star_Star,t_tS);
		t_tStar.m_SetPos2(bb_random_Rnd2(0.0,(bb_scene_Scene_Width)),bb_random_Rnd2(0.0,(bb_scene_Scene_Height)));
		t_tStar.f_alpha=bb_random_Rnd2(0.5,1.0);
		t_tS.f_Stars.m_AddLast3(t_tStar);
	}
	t_tSC=((bb_random_Rnd2(0.0,4.0))|0);
	for(var t_i3=0;t_i3<t_tSC;t_i3=t_i3+1){
		t_tS.f_Trees.m_AddLast(bb_tree_GenerateTree(t_tS));
	}
	t_tSC=((bb_random_Rnd2(0.0,4.0))|0);
	for(var t_i4=0;t_i4<t_tSC;t_i4=t_i4+1){
		t_tS.f_Snowmen.m_AddLast4(bb_snowman_GenerateSnowman(t_tS));
	}
	return t_tS;
}
function bb_audio_PlayMusic(t_path,t_flags){
	return bb_audio_device.PlayMusic(bb_data_FixDataPath(t_path),t_flags);
}
function bb_input_KeyHit(t_key){
	return bb_input_device.KeyHit(t_key);
}
function bb_list_Enumerator(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator_new(t_list){
	this.f__list=t_list;
	this.f__curr=t_list.f__head.f__succ;
	return this;
}
function bb_list_Enumerator_new2(){
	return this;
}
bb_list_Enumerator.prototype.m_HasNext=function(){
	while(this.f__curr.f__succ.f__pred!=this.f__curr){
		this.f__curr=this.f__curr.f__succ;
	}
	return this.f__curr!=this.f__list.f__head;
}
bb_list_Enumerator.prototype.m_NextObject=function(){
	var t_data=this.f__curr.f__data;
	this.f__curr=this.f__curr.f__succ;
	return t_data;
}
function bb_list_Enumerator2(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator2_new(t_list){
	this.f__list=t_list;
	this.f__curr=t_list.f__head.f__succ;
	return this;
}
function bb_list_Enumerator2_new2(){
	return this;
}
bb_list_Enumerator2.prototype.m_HasNext=function(){
	while(this.f__curr.f__succ.f__pred!=this.f__curr){
		this.f__curr=this.f__curr.f__succ;
	}
	return this.f__curr!=this.f__list.f__head;
}
bb_list_Enumerator2.prototype.m_NextObject=function(){
	var t_data=this.f__curr.f__data;
	this.f__curr=this.f__curr.f__succ;
	return t_data;
}
function bb_list_Enumerator3(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator3_new(t_list){
	this.f__list=t_list;
	this.f__curr=t_list.f__head.f__succ;
	return this;
}
function bb_list_Enumerator3_new2(){
	return this;
}
bb_list_Enumerator3.prototype.m_HasNext=function(){
	while(this.f__curr.f__succ.f__pred!=this.f__curr){
		this.f__curr=this.f__curr.f__succ;
	}
	return this.f__curr!=this.f__list.f__head;
}
bb_list_Enumerator3.prototype.m_NextObject=function(){
	var t_data=this.f__curr.f__data;
	this.f__curr=this.f__curr.f__succ;
	return t_data;
}
function bb_list_Enumerator4(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator4_new(t_list){
	this.f__list=t_list;
	this.f__curr=t_list.f__head.f__succ;
	return this;
}
function bb_list_Enumerator4_new2(){
	return this;
}
bb_list_Enumerator4.prototype.m_HasNext=function(){
	while(this.f__curr.f__succ.f__pred!=this.f__curr){
		this.f__curr=this.f__curr.f__succ;
	}
	return this.f__curr!=this.f__list.f__head;
}
bb_list_Enumerator4.prototype.m_NextObject=function(){
	var t_data=this.f__curr.f__data;
	this.f__curr=this.f__curr.f__succ;
	return t_data;
}
function bb_math_Clamp(t_n,t_min,t_max){
	if(t_n<t_min){
		return t_min;
	}
	if(t_n>t_max){
		return t_max;
	}
	return t_n;
}
function bb_math_Clamp2(t_n,t_min,t_max){
	if(t_n<t_min){
		return t_min;
	}
	if(t_n>t_max){
		return t_max;
	}
	return t_n;
}
function bb_list_Enumerator5(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator5_new(t_list){
	this.f__list=t_list;
	this.f__curr=t_list.f__head.f__succ;
	return this;
}
function bb_list_Enumerator5_new2(){
	return this;
}
bb_list_Enumerator5.prototype.m_HasNext=function(){
	while(this.f__curr.f__succ.f__pred!=this.f__curr){
		this.f__curr=this.f__curr.f__succ;
	}
	return this.f__curr!=this.f__list.f__head;
}
bb_list_Enumerator5.prototype.m_NextObject=function(){
	var t_data=this.f__curr.f__data;
	this.f__curr=this.f__curr.f__succ;
	return t_data;
}
function bb_list_Enumerator6(){
	Object.call(this);
	this.f__list=null;
	this.f__curr=null;
}
function bb_list_Enumerator6_new(t_list){
	this.f__list=t_list;
	this.f__curr=t_list.f__head.f__succ;
	return this;
}
function bb_list_Enumerator6_new2(){
	return this;
}
bb_list_Enumerator6.prototype.m_HasNext=function(){
	while(this.f__curr.f__succ.f__pred!=this.f__curr){
		this.f__curr=this.f__curr.f__succ;
	}
	return this.f__curr!=this.f__list.f__head;
}
bb_list_Enumerator6.prototype.m_NextObject=function(){
	var t_data=this.f__curr.f__data;
	this.f__curr=this.f__curr.f__succ;
	return t_data;
}
function bb_math_Max(t_x,t_y){
	if(t_x>t_y){
		return t_x;
	}
	return t_y;
}
function bb_math_Max2(t_x,t_y){
	if(t_x>t_y){
		return t_x;
	}
	return t_y;
}
function bb_math_Min(t_x,t_y){
	if(t_x<t_y){
		return t_x;
	}
	return t_y;
}
function bb_math_Min2(t_x,t_y){
	if(t_x<t_y){
		return t_x;
	}
	return t_y;
}
function bb_graphics_Cls(t_r,t_g,t_b){
	bb_graphics_renderDevice.Cls(t_r,t_g,t_b);
	return 0;
}
function bb_graphics_Transform(t_ix,t_iy,t_jx,t_jy,t_tx,t_ty){
	var t_ix2=t_ix*bb_graphics_context.f_ix+t_iy*bb_graphics_context.f_jx;
	var t_iy2=t_ix*bb_graphics_context.f_iy+t_iy*bb_graphics_context.f_jy;
	var t_jx2=t_jx*bb_graphics_context.f_ix+t_jy*bb_graphics_context.f_jx;
	var t_jy2=t_jx*bb_graphics_context.f_iy+t_jy*bb_graphics_context.f_jy;
	var t_tx2=t_tx*bb_graphics_context.f_ix+t_ty*bb_graphics_context.f_jx+bb_graphics_context.f_tx;
	var t_ty2=t_tx*bb_graphics_context.f_iy+t_ty*bb_graphics_context.f_jy+bb_graphics_context.f_ty;
	bb_graphics_SetMatrix(t_ix2,t_iy2,t_jx2,t_jy2,t_tx2,t_ty2);
	return 0;
}
function bb_graphics_Transform2(t_m){
	bb_graphics_Transform(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
	return 0;
}
function bb_graphics_Scale(t_x,t_y){
	bb_graphics_Transform(t_x,0.0,0.0,t_y,0.0,0.0);
	return 0;
}
function bb_graphics_Translate(t_x,t_y){
	bb_graphics_Transform(1.0,0.0,0.0,1.0,t_x,t_y);
	return 0;
}
function bb_autofit_UpdateVirtualDisplay(t_zoomborders,t_keepborders){
	bb_autofit_VirtualDisplay_Display.m_UpdateVirtualDisplay(t_zoomborders,t_keepborders);
	return 0;
}
function bb_graphics_PushMatrix(){
	var t_sp=bb_graphics_context.f_matrixSp;
	bb_graphics_context.f_matrixStack[t_sp+0]=bb_graphics_context.f_ix;
	bb_graphics_context.f_matrixStack[t_sp+1]=bb_graphics_context.f_iy;
	bb_graphics_context.f_matrixStack[t_sp+2]=bb_graphics_context.f_jx;
	bb_graphics_context.f_matrixStack[t_sp+3]=bb_graphics_context.f_jy;
	bb_graphics_context.f_matrixStack[t_sp+4]=bb_graphics_context.f_tx;
	bb_graphics_context.f_matrixStack[t_sp+5]=bb_graphics_context.f_ty;
	bb_graphics_context.f_matrixSp=t_sp+6;
	return 0;
}
function bb_graphics_PopMatrix(){
	var t_sp=bb_graphics_context.f_matrixSp-6;
	bb_graphics_SetMatrix(bb_graphics_context.f_matrixStack[t_sp+0],bb_graphics_context.f_matrixStack[t_sp+1],bb_graphics_context.f_matrixStack[t_sp+2],bb_graphics_context.f_matrixStack[t_sp+3],bb_graphics_context.f_matrixStack[t_sp+4],bb_graphics_context.f_matrixStack[t_sp+5]);
	bb_graphics_context.f_matrixSp=t_sp;
	return 0;
}
function bb_graphics_DrawImage(t_image,t_x,t_y,t_frame){
	var t_f=t_image.f_frames[t_frame];
	if((bb_graphics_context.f_tformed)!=0){
		bb_graphics_PushMatrix();
		bb_graphics_Translate(t_x-t_image.f_tx,t_y-t_image.f_ty);
		bb_graphics_context.m_Validate();
		if((t_image.f_flags&65536)!=0){
			bb_graphics_renderDevice.DrawSurface(t_image.f_surface,0.0,0.0);
		}else{
			bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0,0.0,t_f.f_x,t_f.f_y,t_image.f_width,t_image.f_height);
		}
		bb_graphics_PopMatrix();
	}else{
		bb_graphics_context.m_Validate();
		if((t_image.f_flags&65536)!=0){
			bb_graphics_renderDevice.DrawSurface(t_image.f_surface,t_x-t_image.f_tx,t_y-t_image.f_ty);
		}else{
			bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,t_x-t_image.f_tx,t_y-t_image.f_ty,t_f.f_x,t_f.f_y,t_image.f_width,t_image.f_height);
		}
	}
	return 0;
}
function bb_graphics_Rotate(t_angle){
	bb_graphics_Transform(Math.cos((t_angle)*D2R),-Math.sin((t_angle)*D2R),Math.sin((t_angle)*D2R),Math.cos((t_angle)*D2R),0.0,0.0);
	return 0;
}
function bb_graphics_DrawImage2(t_image,t_x,t_y,t_rotation,t_scaleX,t_scaleY,t_frame){
	var t_f=t_image.f_frames[t_frame];
	bb_graphics_PushMatrix();
	bb_graphics_Translate(t_x,t_y);
	bb_graphics_Rotate(t_rotation);
	bb_graphics_Scale(t_scaleX,t_scaleY);
	bb_graphics_Translate(-t_image.f_tx,-t_image.f_ty);
	bb_graphics_context.m_Validate();
	if((t_image.f_flags&65536)!=0){
		bb_graphics_renderDevice.DrawSurface(t_image.f_surface,0.0,0.0);
	}else{
		bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0,0.0,t_f.f_x,t_f.f_y,t_image.f_width,t_image.f_height);
	}
	bb_graphics_PopMatrix();
	return 0;
}
function bb_graphics_DrawImageRect(t_image,t_x,t_y,t_srcX,t_srcY,t_srcWidth,t_srcHeight,t_frame){
	var t_f=t_image.f_frames[t_frame];
	if((bb_graphics_context.f_tformed)!=0){
		bb_graphics_PushMatrix();
		bb_graphics_Translate(-t_image.f_tx+t_x,-t_image.f_ty+t_y);
		bb_graphics_context.m_Validate();
		bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0,0.0,t_srcX+t_f.f_x,t_srcY+t_f.f_y,t_srcWidth,t_srcHeight);
		bb_graphics_PopMatrix();
	}else{
		bb_graphics_context.m_Validate();
		bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,-t_image.f_tx+t_x,-t_image.f_ty+t_y,t_srcX+t_f.f_x,t_srcY+t_f.f_y,t_srcWidth,t_srcHeight);
	}
	return 0;
}
function bb_graphics_DrawImageRect2(t_image,t_x,t_y,t_srcX,t_srcY,t_srcWidth,t_srcHeight,t_rotation,t_scaleX,t_scaleY,t_frame){
	var t_f=t_image.f_frames[t_frame];
	bb_graphics_PushMatrix();
	bb_graphics_Translate(t_x,t_y);
	bb_graphics_Rotate(t_rotation);
	bb_graphics_Scale(t_scaleX,t_scaleY);
	bb_graphics_Translate(-t_image.f_tx,-t_image.f_ty);
	bb_graphics_context.m_Validate();
	bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0,0.0,t_srcX+t_f.f_x,t_srcY+t_f.f_y,t_srcWidth,t_srcHeight);
	bb_graphics_PopMatrix();
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
