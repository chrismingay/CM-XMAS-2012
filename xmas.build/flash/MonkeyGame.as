
package{

	import flash.display.*;
	import flash.events.*;
	import flash.media.*;
	import flash.net.*;
	import flash.utils.ByteArray;

	[SWF(width="640",height="480")]
	[Frame(factoryClass="Preloader")]
	
	public class MonkeyGame extends Sprite{
	
		public var runner:Function;
		
		public function MonkeyGame(){
		
			game=this;

			addEventListener( Event.ADDED_TO_STAGE,onAddedToStage );
		}
		
		private function onAddedToStage( e:Event ):void{
		
			try{
				bbInit();
				bbMain();

				if( runner!=null ) runner();

			}catch( err:Object ){
			
				printError( err.toString() );
			}
		}
		
		private function mungPath( path:String ):String{
		
			if( path.toLowerCase().indexOf("monkey://data/")!=0 ) return "";
			path=path.slice(14);
			
			var i:int=path.indexOf( "." ),ext:String="";
			if( i!=-1 ){
				ext=path.slice(i+1);
				path=path.slice(0,i);
			}

			var munged:String="_";
			var bits:Array=path.split( "/" );
			
			for( i=0;i<bits.length;++i ){
				munged+=bits[i].length+bits[i];
			}
			munged+=ext.length+ext;
			
			return munged;
		}
		
		public function urlRequest( path:String ):URLRequest{
			if( path.toLowerCase().indexOf("monkey://data/")==0 ) path="data/"+path.slice(14);
			return new URLRequest( path );
		}
		
		public function loadByteArray( path:String ):ByteArray{
			path=mungPath( path );
			var t:Class=Assets[path];
			if( t ) return (new t) as ByteArray;
			return null;
		}
		
		public function loadString( path:String ):String{
			var buf:ByteArray=loadByteArray( path );
			if( buf ) return buf.toString();
			return "";
		}

		public function loadBitmap( path:String ):Bitmap{
			path=mungPath( path );
			var t:Class=Assets[path];
			if( t ) return (new t) as Bitmap;
			return null;
		}
		
		public function loadSound( path:String ):Sound{
			path=mungPath( path );
			var t:Class=Assets[path];
			if( t ) return (new t) as Sound;
			return null;
		}
	}		
}

var game:MonkeyGame;

final class Config{
//${CONFIG_BEGIN}
internal static var BINARY_FILES:String="*.bin|*.dat"
internal static var CD:String=""
internal static var CONFIG:String="release"
internal static var HOST:String="winnt"
internal static var IMAGE_FILES:String="*.png|*.jpg"
internal static var LANG:String="as"
internal static var MODPATH:String=".;C:/Users/Chris/Documents/GitHub/CM-XMAS-2012;C:/apps/MonkeyPro66/modules"
internal static var MOJO_AUTO_SUSPEND_ENABLED:String="0"
internal static var MOJO_IMAGE_FILTERING_ENABLED:String="0"
internal static var MUSIC_FILES:String="*.mp3"
internal static var SAFEMODE:String="0"
internal static var SOUND_FILES:String="*.mp3"
internal static var TARGET:String="flash"
internal static var TEXT_FILES:String="*.txt|*.xml|*.json"
internal static var TRANSDIR:String=""
//${CONFIG_END}
}

final class Assets{
//${ASSETS_BEGIN}
[Embed(source="data/gfx/xmas_scene.png")]
public static var _3gfx10xmas_scene3png:Class;
[Embed(source="data/gfx/xmas_sprites.png")]
public static var _3gfx12xmas_sprites3png:Class;
[Embed(source="data/mus/sleigh.mp3")]
public static var _3mus6sleigh3mp3:Class;
[Embed(source="data/mojo_font.png")]
public static var _9mojo_font3png:Class;
//${ASSETS_END}
}

//${TRANSCODE_BEGIN}

// Actionscript Monkey runtime.
//
// Placed into the public domain 24/02/2011.
// No warranty implied; use at your own risk.

//***** ActionScript Runtime *****

import flash.display.*;
import flash.text.*;
import flash.external.ExternalInterface;

//Consts for radians<->degrees conversions
var D2R:Number=0.017453292519943295;
var R2D:Number=57.29577951308232;

//private
var _console:TextField;
var _errInfo:String="?<?>";
var _errStack:Array=[];

var dbg_index:int=0;

function _getConsole():TextField{
	if( _console ) return _console;
	_console=new TextField();
	_console.x=0;
	_console.y=0;
	_console.width=game.stage.stageWidth;
	_console.height=game.stage.stageHeight;
	_console.background=false;
	_console.backgroundColor=0xff000000;
	_console.textColor=0xffffff00;
	game.stage.addChild( _console );
	return _console;
}

function pushErr():void{
	_errStack.push( _errInfo );
}

function popErr():void{
	_errInfo=_errStack.pop();
}

function stackTrace():String{
	if( !_errInfo.length ) return "";
	var str:String=_errInfo+"\n";
	for( var i:int=_errStack.length-1;i>0;--i ){
		str+=_errStack[i]+"\n";
	}
	return str;
}

function print( str:String ):int{
	var console:TextField=_getConsole();
	if( !console ) return 0;
	console.appendText( str+"\n" );
	return 0;
}

function printError( err:Object ):void{
	var msg:String=err.toString();
	if( !msg.length ) return;
	print( "Monkey Runtime Error : "+msg );
	print( "" );
	print( stackTrace() );
}

function error( err:String ):int{
	throw err;
}

function debugLog( str:String ):int{
	print( str );
	return 0;
}

function debugStop():int{
	error( "STOP" );
	return 0;
}

function dbg_object( obj:Object ):Object{
	if( obj ) return obj;
	error( "Null object access" );
	return obj;
}

function dbg_array( arr:Array,index:int ):Array{
	if( index<0 || index>=arr.length ) error( "Array index out of range" );
	dbg_index=index;
	return arr;
}

function new_bool_array( len:int ):Array{
	var arr:Array=new Array( len )
	for( var i:int=0;i<len;++i ) arr[i]=false;
	return arr;
}

function new_number_array( len:int ):Array{
	var arr:Array=new Array( len )
	for( var i:int=0;i<len;++i ) arr[i]=0;
	return arr;
}

function new_string_array( len:int ):Array{
	var arr:Array=new Array( len );
	for( var i:int=0;i<len;++i ) arr[i]='';
	return arr;
}

function new_array_array( len:int ):Array{
	var arr:Array=new Array( len );
	for( var i:int=0;i<len;++i ) arr[i]=[];
	return arr;
}

function new_object_array( len:int ):Array{
	var arr:Array=new Array( len );
	for( var i:int=0;i<len;++i ) arr[i]=null;
	return arr;
}

function resize_bool_array( arr:Array,len:int ):Array{
	var i:int=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=false;
	return arr;
}

function resize_number_array( arr:Array,len:int ):Array{
	var i:int=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=0;
	return arr;
}

function resize_string_array( arr:Array,len:int ):Array{
	var i:int=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]="";
	return arr;
}

function resize_array_array( arr:Array,len:int ):Array{
	var i:int=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=[];
	return arr;
}

function resize_object_array( arr:Array,len:int ):Array{
	var i:int=arr.length;
	arr=arr.slice(0,len);
	if( len<=i ) return arr;
	arr.length=len;
	while( i<len ) arr[i++]=null;
	return arr;
}

function string_compare( lhs:String,rhs:String ):int{
	var n:int=Math.min( lhs.length,rhs.length ),i:int,t:int;
	for( i=0;i<n;++i ){
		t=lhs.charCodeAt(i)-rhs.charCodeAt(i);
		if( t ) return t;
	}
	return lhs.length-rhs.length;
}

function string_replace( str:String,find:String,rep:String ):String{	//no unregex replace all?!?
	var i:int=0;
	for(;;){
		i=str.indexOf( find,i );
		if( i==-1 ) return str;
		str=str.substring( 0,i )+rep+str.substring( i+find.length );
		i+=rep.length;
	}
	return str;
}

function string_trim( str:String ):String{
	var i:int=0,i2:int=str.length;
	while( i<i2 && str.charCodeAt(i)<=32 ) i+=1;
	while( i2>i && str.charCodeAt(i2-1)<=32 ) i2-=1;
	return str.slice( i,i2 );
}

function string_tochars( str:String ):Array{
	var arr:Array=new Array( str.length );
	for( var i:int=0;i<str.length;++i ) arr[i]=str.charCodeAt(i);
	return arr;	
}

function string_startswith( str:String,sub:String ):Boolean{
	return sub.length<=str.length && str.slice(0,sub.length)==sub;
}

function string_endswith( str:String,sub:String ):Boolean{
	return sub.length<=str.length && str.slice(str.length-sub.length,str.length)==sub;
}

function string_fromchars( chars:Array ):String{
	var str:String="",i:int;
	for( i=0;i<chars.length;++i ){
		str+=String.fromCharCode( chars[i] );
	}
	return str;
}

class ThrowableObject{
	internal function toString():String{
		return "Uncaught Monkey Exception";
	}
}

class BBDataBuffer{

	internal var _data:ByteArray=null;
	internal var _length:int=0;
	
	public function _Init( data:ByteArray ):void{
		_data=data;
		_length=data.length;
	}
	
	public function _New( length:int ):Boolean{
		if( _data ) return false
		_data=new ByteArray;
		_data.length=length;
		_length=length;
		return true;
	}
	
	public function _Load( path:String ):Boolean{
		if( _data ) return false
		var data:ByteArray=game.loadByteArray( path );
		if( !data ) return false;
		_Init( data );
		return true;
	}
	
	public function Discard():void{
		if( _data ){
			_data.clear();
			_data=null;
			_length=0;
		}
	}
	
	public function Length():int{
		return _length;
	}
	
	public function PokeByte( addr:int,value:int ):void{
		_data.position=addr;
		_data.writeByte( value );
	}
	
	public function PokeShort( addr:int,value:int ):void{
		_data.position=addr;
		_data.writeShort( value );
	}
	
	public function PokeInt( addr:int,value:int ):void{
		_data.position=addr;
		_data.writeInt( value );
	}
	
	public function PokeFloat( addr:int,value:Number ):void{
		_data.position=addr;
		_data.writeFloat( value );
	}
	
	public function PeekByte( addr:int ):int{
		_data.position=addr;
		return _data.readByte();
	}
	
	public function PeekShort( addr:int ):int{
		_data.position=addr;
		return _data.readShort();
	}

	public function PeekInt( addr:int ):int{
		_data.position=addr;
		return _data.readInt();
	}
	
	public function PeekFloat( addr:int ):Number{
		_data.position=addr;
		return _data.readFloat();
	}
}

// Flash mojo runtime.
//
// Copyright 2011 Mark Sibly, all rights reserved.
// No warranty implied; use at your own risk.

import flash.display.*;
import flash.events.*;
import flash.media.*;
import flash.geom.*;
import flash.utils.*;
import flash.net.*;

var app:gxtkApp;

class gxtkApp{

	internal var graphics:gxtkGraphics;
	internal var input:gxtkInput;
	internal var audio:gxtkAudio;

	internal var dead:int=0;
	internal var suspended:int=0;
	internal var loading:int=0;
	internal var maxloading:int=0;
	internal var updateRate:int=0;
	internal var nextUpdate:Number=0;
	internal var updatePeriod:Number=0;
	internal var startMillis:Number=0;
	
	function gxtkApp(){
		app=this;
		
		graphics=new gxtkGraphics;
		input=new gxtkInput;
		audio=new gxtkAudio;
		
		startMillis=(new Date).getTime();
		
		game.stage.addEventListener( Event.ACTIVATE,OnActivate );
		game.stage.addEventListener( Event.DEACTIVATE,OnDeactivate );
		game.stage.addEventListener( Event.ENTER_FRAME,OnEnterFrame );
		
		SetFrameRate( 0 );
		
		game.runner=function():void{
			InvokeOnCreate();
			InvokeOnRender();
		};
	}

	internal function IncLoading():void{
		++loading;
		if( loading>maxloading ) maxloading=loading;
		if( loading!=1 ) return;
		if( updateRate ) SetFrameRate( 0 );
	}

	internal function DecLoading():void{
		--loading;
		if( loading ) return;
		maxloading=0;
		if( updateRate ) SetFrameRate( updateRate );
	}
	
	internal function SetFrameRate( fps:int ):void{
		if( fps ){
			updatePeriod=1000.0/fps;
			nextUpdate=(new Date).getTime()+updatePeriod;
			game.stage.frameRate=fps;
		}else{
			updatePeriod=0;
			game.stage.frameRate=24;
		}
	}
	
	internal function OnActivate( e:Event ):void{
		if( Config.MOJO_AUTO_SUSPEND_ENABLED=="1" ){
			InvokeOnResume();
		}
	}
	
	internal function OnDeactivate( e:Event ):void{
		if( Config.MOJO_AUTO_SUSPEND_ENABLED=="1" ){
			InvokeOnSuspend();
		}
	}
	
	internal function OnEnterFrame( e:Event ):void{
		if( !updatePeriod ) return;
		
		var updates:int=0;

		for(;;){
			nextUpdate+=updatePeriod;
			InvokeOnUpdate();
			if( !updatePeriod ) break;
			
			if( nextUpdate>(new Date).getTime() ) break;
			
			if( ++updates==7 ){
				nextUpdate=(new Date).getTime();
				break;
			}
		}
		InvokeOnRender();
	}
	
	internal function Die( err:Object ):void{
		dead=1;
		audio.OnSuspend();
		printError( err );
	}
	
	internal function InvokeOnCreate():void{
		if( dead ) return;
		
		try{
			dead=1;
			OnCreate();
			dead=0;
		}catch( err:Object ){
			Die( err );
		}
	}

	internal function InvokeOnUpdate():void{
		if( dead || suspended || !updateRate || loading ) return;
		
		try{
			input.BeginUpdate();
			OnUpdate();
			input.EndUpdate();
		}catch( err:Object ){
			Die( err );
		}
	}

	internal function InvokeOnRender():void{
		if( dead || suspended ) return;
		
		try{
			graphics.BeginRender();
			if( loading ){
				OnLoading();
			}else{
				OnRender();
			}
			graphics.EndRender();
		}catch( err:Object ){
			Die( err );
		}
	}
	
	internal function InvokeOnSuspend():void{
		if( dead || suspended ) return;
		
		try{
			suspended=1;
			OnSuspend();
			audio.OnSuspend();
		}catch( err:Object ){
			Die( err );
		}
	}
	
	internal function InvokeOnResume():void{
		if( dead || !suspended ) return;
		
		try{
			audio.OnResume();
			OnResume();
			suspended=0;
		}catch( err:Object ){
			Die( err );
		}
	}
	
	//***** GXTK API *****
	
	public function GraphicsDevice():gxtkGraphics{
		return graphics;
	}

	public function InputDevice():gxtkInput{
		return input;
	}

	public function AudioDevice():gxtkAudio{
		return audio;
	}

	public function AppTitle():String{
		return graphics.bitmap.loaderInfo.url;
	}
	
	public function LoadState():String{
		var file:SharedObject=SharedObject.getLocal( "gxtkapp" );
		var state:String=file.data.state;
		file.close();
		if( state ) return state;
		return "";
	}
	
	public function SaveState( state:String ):int{
		var file:SharedObject=SharedObject.getLocal( "gxtkapp" );
		file.data.state=state;
		file.close();
		return 0;
	}
	
	public function LoadString( path:String ):String{
		return game.loadString( path );
	}

	public function SetUpdateRate( hertz:int ):int{
		updateRate=hertz;

		if( !loading ) SetFrameRate( updateRate );

		return 0;
	}
	
	public function MilliSecs():int{
		return (new Date).getTime()-startMillis;
	}

	public function Loading():int{
		return loading;
	}

	public function OnCreate():int{
		return 0;
	}

	public function OnUpdate():int{
		return 0;
	}
	
	public function OnSuspend():int{
		return 0;
	}
	
	public function OnResume():int{
		return 0;
	}
	
	public function OnRender():int{
		return 0;
	}
	
	public function OnLoading():int{
		return 0;
	}

}

class gxtkGraphics{
	internal var bitmap:Bitmap;
	
	internal var red:Number=255;
	internal var green:Number=255;
	internal var blue:Number=255;
	internal var alpha:Number=1;
	internal var colorARGB:uint=0xffffffff;
	internal var colorTform:ColorTransform=null;
	internal var alphaTform:ColorTransform=null;
	
	internal var matrix:Matrix;
	internal var rectBMData:BitmapData;
	internal var blend:String;
	internal var clipRect:Rectangle;
	
	internal var shape:Shape;
	internal var graphics:Graphics;
	internal var bitmapData:BitmapData;

	internal var pointMat:Matrix=new Matrix;
	internal var rectMat:Matrix=new Matrix;
	
	internal var image_filtering_enabled:Boolean;
	
	function gxtkGraphics(){
	
		var stage:Stage=game.stage;
	
		bitmap=new Bitmap();
		bitmap.bitmapData=new BitmapData( stage.stageWidth,stage.stageHeight,false,0xff0000ff );
		bitmap.width=stage.stageWidth;
		bitmap.height=stage.stageHeight;
		game.addChild( bitmap );

		stage.addEventListener( Event.RESIZE,OnResize );
	
		rectBMData=new BitmapData( 1,1,false,0xffffffff );
		
		image_filtering_enabled=(Config.MOJO_IMAGE_FILTERING_ENABLED=="1");
	}
	
	internal function OnResize( e:Event ):void{
		var stage:Stage=game.stage;
		var w:int=stage.stageWidth;
		var h:int=stage.stageHeight;
		if( w==bitmap.width && h==bitmap.height ) return;
		bitmap.bitmapData=new BitmapData( w,h,false,0xff0000ff );
		bitmap.width=w;
		bitmap.height=h;
	}

	internal function BeginRender():void{
		bitmapData=bitmap.bitmapData;
	}

	internal function UseBitmap():void{
		if( graphics==null ) return;
		bitmapData.draw( shape,matrix,alphaTform,blend,clipRect,false );
		graphics.clear();
		graphics=null;
	}

	internal function UseGraphics():void{
		if( graphics!=null ) return;
		if( shape==null ) shape=new Shape;
		graphics=shape.graphics;
	}

	internal function FlushGraphics():void{
		if( graphics==null ) return;
		bitmapData.draw( shape,matrix,alphaTform,blend,clipRect,false );
		graphics.clear();
	}
	
	internal function EndRender():void{
		UseBitmap();
		bitmapData=null;
	}
	
	internal function updateColor():void{
	
		colorARGB=(int(alpha*255)<<24)|(int(red)<<16)|(int(green)<<8)|int(blue);
		
		if( colorARGB==0xffffffff ){
			colorTform=null;
			alphaTform=null;
		}else{
			colorTform=new ColorTransform( red/255.0,green/255.0,blue/255.0,alpha );
			if( alpha==1 ){
				alphaTform=null;
			}else{
				alphaTform=new ColorTransform( 1,1,1,alpha );
			}
		}
	}

	//***** GXTK API *****

	public function Mode():int{
		return 1;
	}
	
	public function Width():int{
		return bitmap.width;
	}

	public function Height():int{
		return bitmap.height;
	}

	public function LoadSurface( path:String ):gxtkSurface{
		var bitmap:Bitmap=game.loadBitmap( path );
		if( bitmap==null ) return null;
		return new gxtkSurface( bitmap );
	}
	
	public function CreateSurface( width:int,height:int ):gxtkSurface{
		var bitmapData:BitmapData=new BitmapData( width,height );
		var bitmap:Bitmap=new Bitmap( bitmapData );
		return new gxtkSurface( bitmap );
	}
	
	public function SetAlpha( a:Number ):int{
		FlushGraphics();
		
		alpha=a;
		
		updateColor();
		
		return 0;
	}
	
	public function SetColor( r:Number,g:Number,b:Number ):int{
		FlushGraphics();
		
		red=r;
		green=g;
		blue=b;
		
		updateColor();
		
		return 0;
	}
	
	public function SetBlend( blend:int ):int{
		switch( blend ){
		case 1:
			this.blend=BlendMode.ADD;
			break;
		default:
			this.blend=null;
		}
		return 0;
	}
	
	public function SetScissor( x:int,y:int,w:int,h:int ):int{
		FlushGraphics();
		
		if( x!=0 || y!=0 || w!=bitmap.width || h!=bitmap.height ){
			clipRect=new Rectangle( x,y,w,h );
		}else{
			clipRect=null;
		}
		return 0;
	}

	public function SetMatrix( ix:Number,iy:Number,jx:Number,jy:Number,tx:Number,ty:Number ):int{
		FlushGraphics();
		
		if( ix!=1 || iy!=0 || jx!=0 || jy!=1 || tx!=0 || ty!=0 ){
			matrix=new Matrix( ix,iy,jx,jy,tx,ty );
		}else{
			matrix=null;
		}
		return 0;
	}

	public function Cls( r:Number,g:Number,b:Number ):int{
		UseBitmap();

		var clsColor:uint=0xff000000|(int(r)<<16)|(int(g)<<8)|int(b);
		var rect:Rectangle=clipRect;
		if( !rect ) rect=new Rectangle( 0,0,bitmap.width,bitmap.height );
		bitmapData.fillRect( rect,clsColor );
		return 0;
	}
	
	public function DrawPoint( x:Number,y:Number ):int{
		UseBitmap();
		
		if( matrix ){
			var px:Number=x;
			x=px * matrix.a + y * matrix.c + matrix.tx;
			y=px * matrix.b + y * matrix.d + matrix.ty;
		}
		if( clipRect || alphaTform || blend ){
			pointMat.tx=x;pointMat.ty=y;
			bitmapData.draw( rectBMData,pointMat,colorTform,blend,clipRect,false );
		}else{
			bitmapData.fillRect( new Rectangle( x,y,1,1 ),colorARGB );
		}
		return 0;
	}
	
	
	public function DrawRect( x:Number,y:Number,w:Number,h:Number ):int{
		UseBitmap();

		if( matrix ){
			var mat:Matrix=new Matrix( w,0,0,h,x,y );
			mat.concat( matrix );
			bitmapData.draw( rectBMData,mat,colorTform,blend,clipRect,false );
		}else if( clipRect || alphaTform || blend ){
			rectMat.a=w;rectMat.d=h;rectMat.tx=x;rectMat.ty=y;
			bitmapData.draw( rectBMData,rectMat,colorTform,blend,clipRect,false );
		}else{
			bitmapData.fillRect( new Rectangle( x,y,w,h ),colorARGB );
		}
		return 0;
	}

	public function DrawLine( x1:Number,y1:Number,x2:Number,y2:Number ):int{
		UseGraphics();
		
		if( matrix ){

			var x1_t:Number=x1 * matrix.a + y1 * matrix.c + matrix.tx;
			var y1_t:Number=x1 * matrix.b + y1 * matrix.d + matrix.ty;
			var x2_t:Number=x2 * matrix.a + y2 * matrix.c + matrix.tx;
			var y2_t:Number=x2 * matrix.b + y2 * matrix.d + matrix.ty;
			
			graphics.lineStyle( 1,colorARGB & 0xffffff );	//why the mask?
			graphics.moveTo( x1_t,y1_t );
			graphics.lineTo( x2_t,y2_t );
			graphics.lineStyle();
			
			var mat:Matrix=matrix;matrix=null;

			FlushGraphics();

			matrix=mat;
			
		}else{

			graphics.lineStyle( 1,colorARGB & 0xffffff );	//why the mask?
			graphics.moveTo( x1,y1 );
			graphics.lineTo( x2,y2 );
			graphics.lineStyle();
		
			if( alphaTform ) FlushGraphics();
		}

		return 0;
 	}

	public function DrawOval( x:Number,y:Number,w:Number,h:Number ):int{
		UseGraphics();

		graphics.beginFill( colorARGB & 0xffffff );			//why the mask?
		graphics.drawEllipse( x,y,w,h );
		graphics.endFill();
		
		if( alphaTform ) FlushGraphics();

		return 0;
	}
	
	public function DrawPoly( verts:Array ):int{
		if( verts.length<6 ) return 0;
		
		UseGraphics();
		
		graphics.beginFill( colorARGB & 0xffffff );			//why the mask?
		
		graphics.moveTo( verts[0],verts[1] );
		for( var i:int=0;i<verts.length;i+=2 ){
			graphics.lineTo( verts[i],verts[i+1] );
		}
		graphics.endFill();
		
		if( alphaTform ) FlushGraphics();

		return 0;
	}

	public function DrawSurface( surface:gxtkSurface,x:Number,y:Number ):int{
		UseBitmap();

		if( matrix ){
			if( x!=0 || y!=0 ){
				//have to translate matrix! TODO!
				return -1;
			}
			bitmapData.draw( surface.bitmap.bitmapData,matrix,colorTform,blend,clipRect,image_filtering_enabled );
		}else if( clipRect || colorTform || blend ){
			var mat:Matrix=new Matrix( 1,0,0,1,x,y );
			bitmapData.draw( surface.bitmap.bitmapData,mat,colorTform,blend,clipRect,image_filtering_enabled );
		}else{
			bitmapData.copyPixels( surface.bitmap.bitmapData,surface.rect,new Point( x,y ) );
		}
		return 0;
	}

	public function DrawSurface2( surface:gxtkSurface,x:Number,y:Number,srcx:int,srcy:int,srcw:int,srch:int ):int{
		if( srcw<0 ){ srcx+=srcw;srcw=-srcw; }
		if( srch<0 ){ srcy+=srch;srch=-srch; }
		if( srcw<=0 || srch<=0 ) return 0;
		
		UseBitmap();

		var srcrect:Rectangle=new Rectangle( srcx,srcy,srcw,srch );
		
		if( matrix || clipRect || colorTform || blend ){

			var scratch:BitmapData=surface.scratch;
			if( scratch==null || srcw!=scratch.width || srch!=scratch.height ){
				if( scratch!=null ) scratch.dispose();
				scratch=new BitmapData( srcw,srch );
				surface.scratch=scratch;
			}
			scratch.copyPixels( surface.bitmap.bitmapData,srcrect,new Point( 0,0 ) );
			
			var mmatrix:Matrix=matrix;
			if( mmatrix==null ){
				mmatrix=new Matrix( 1,0,0,1,x,y );
			}else if( x!=0 || y!=0 ){
				//have to translate matrix! TODO!
				return -1;
			}

			bitmapData.draw( scratch,mmatrix,colorTform,blend,clipRect,image_filtering_enabled );
		}else{
			bitmapData.copyPixels( surface.bitmap.bitmapData,srcrect,new Point( x,y ) );
		}
		return 0;
	}
	
	public function ReadPixels( pixels:Array,x:int,y:int,width:int,height:int,offset:int,pitch:int ):int{
	
		UseBitmap();
		
		var data:ByteArray=bitmapData.getPixels( new Rectangle( x,y,width,height ) );
		data.position=0;
		
		var px:int,py:int,j:int=offset,argb:int;
		
		for( py=0;py<height;++py ){
			for( px=0;px<width;++px ){
				pixels[j++]=data.readInt();
			}
			j+=pitch-width;
		}
		
		return 0;
	}
	
	public function WritePixels2( surface:gxtkSurface,pixels:Array,x:int,y:int,width:int,height:int,offset:int,pitch:int ):int{

		UseBitmap();
		
		var data:ByteArray=new ByteArray();
		data.length=width*height;
			
		var px:int,py:int,j:int=offset,argb:int;
		
		for( py=0;py<height;++py ){
			for( px=0;px<width;++px ){
				data.writeInt( pixels[j++] );
			}
			j+=pitch-width;
		}
		data.position=0;
		
		surface.bitmap.bitmapData.setPixels( new Rectangle( x,y,width,height ),data );
		
		return 0;
	}
}

//***** gxtkSurface *****

class gxtkSurface{
	internal var bitmap:Bitmap;
	internal var rect:Rectangle;
	internal var scratch:BitmapData;
	
	function gxtkSurface( bitmap:Bitmap ){
		SetBitmap( bitmap );
	}
	
	public function SetBitmap( bitmap:Bitmap ):void{
		this.bitmap=bitmap;
		rect=new Rectangle( 0,0,bitmap.width,bitmap.height );
	}

	//***** GXTK API *****

	public function Discard():int{
		return 0;
	}
	
	public function Width():int{
		return rect.width;
	}

	public function Height():int{
		return rect.height;
	}

	public function Loaded():int{
		return 1;
	}
	
	public function OnUnsafeLoadComplete():Boolean{
		return true;
	}
}

class gxtkInput{

	internal var KEY_LMB:int=1;
	internal var KEY_TOUCH0:int=0x180;

	internal var keyStates:Array=new Array( 512 );
	internal var charQueue:Array=new Array( 32 );
	internal var charPut:int=0;
	internal var charGet:int=0;
	internal var mouseX:Number=0;
	internal var mouseY:Number=0;
	
	function gxtkInput(){
	
		for( var i:int=0;i<512;++i ){
			keyStates[i]=0;
		}

		var stage:Stage=game.stage;
	
		stage.addEventListener( KeyboardEvent.KEY_DOWN,function( e:KeyboardEvent ):void{
			OnKeyDown( e.keyCode );
			if( e.charCode!=0 ){
				PutChar( e.charCode );
			}else{
				var chr:int=KeyToChar( e.keyCode );
				if( chr ) PutChar( chr );
			}
		} );
		
		stage.addEventListener( KeyboardEvent.KEY_UP,function( e:KeyboardEvent ):void{
			OnKeyUp( e.keyCode );
		} );
		
		stage.addEventListener( MouseEvent.MOUSE_DOWN,function( e:MouseEvent ):void{
			OnKeyDown( KEY_LMB );
		} );
		
		stage.addEventListener( MouseEvent.MOUSE_UP,function( e:MouseEvent ):void{
			OnKeyUp( KEY_LMB );
		} );
		
		stage.addEventListener( MouseEvent.MOUSE_MOVE,function( e:MouseEvent ):void{
			OnMouseMove( e.localX,e.localY );
		} );
	}
	
	internal function KeyToChar( key:int ):int{
		switch( key ){
		case 8:case 9:case 13:case 27:
			return key;
		case 33:case 34:case 35:case 36:case 37:case 38:case 39:case 40:case 45:
			return key | 0x10000;
		case 46:
			return 127;
		}
		return 0;
	}
	
	internal function BeginUpdate():void{
	}
	
	internal function EndUpdate():void{
		for( var i:int=0;i<512;++i ){
			keyStates[i]&=0x100;
		}
		charGet=0;
		charPut=0;
	}
	
	internal function OnKeyDown( key:int ):void{
		if( (keyStates[key]&0x100)==0 ){
			keyStates[key]|=0x100;
			++keyStates[key];
		}
	}

	internal function OnKeyUp( key:int ):void{
		keyStates[key]&=0xff;
	}
	
	internal function PutChar( chr:int ):void{
		if( chr==0 ) return;
		if( charPut-charGet<32 ){
			charQueue[charPut & 31]=chr;
			charPut+=1;
		}
	}
	
	internal function OnMouseMove( x:Number,y:Number ):void{
		mouseX=x;
		mouseY=y;
	}

	//***** GXTK API *****
	
	public function SetKeyboardEnabled( enabled:int ):int{
		return 0;
	}
	
	public function KeyDown( key:int ):int{
		if( key>0 && key<512 ){
			if( key==KEY_TOUCH0 ) key=KEY_LMB;
			return keyStates[key] >> 8;
		}
		return 0;
	}

	public function KeyHit( key:int ):int{
		if( key>0 && key<512 ){
			if( key==KEY_TOUCH0 ) key=KEY_LMB;
			return keyStates[key] & 0xff;
		}
		return 0;
	}

	public function GetChar():int{
		if( charGet!=charPut ){
			var chr:int=charQueue[charGet & 31];
			charGet+=1;
			return chr;
		}
		return 0;
	}
	
	public function MouseX():Number{
		return mouseX;
	}

	public function MouseY():Number{
		return mouseY;
	}

	public function JoyX( index:int ):Number{
		return 0;
	}
	
	public function JoyY( index:int ):Number{
		return 0;
	}
	
	public function JoyZ( index:int ):Number{
		return 0;
	}
	
	public function TouchX( index:int ):Number{
		return mouseX;
	}

	public function TouchY( index:int ):Number{
		return mouseY;
	}
	
	public function AccelX():Number{
		return 0;
	}
	
	public function AccelY():Number{
		return 0;
	}
	
	public function AccelZ():Number{
		return 0;
	}
}

class gxtkChannel{
	internal var channel:SoundChannel;	//null then not playing
	internal var sample:gxtkSample;
	internal var loops:int;
	internal var transform:SoundTransform=new SoundTransform();
	internal var pausepos:Number;
	internal var state:int;
}

class gxtkAudio{

	internal var music:gxtkSample;

	internal var channels:Array=new Array( 33 );

	internal var loop_kludge:int=1;

	function gxtkAudio(){
		for( var i:int=0;i<33;++i ){
			channels[i]=new gxtkChannel();
		}
	}
	
	internal function OnSuspend():void{
		for( var i:int=0;i<33;++i ){
			var chan:gxtkChannel=channels[i];
			if( chan.state==1 ){
				chan.pausepos=chan.channel.position;
				chan.channel.stop();
			}
		}
	}
	
	internal function OnResume():void{
		for( var i:int=0;i<33;++i ){
			var chan:gxtkChannel=channels[i];
			if( chan.state==1 ){
				if( loop_kludge ){
					chan.channel=chan.sample.sound.play( chan.pausepos,0,chan.transform );
					if( chan.loops ) chan.channel.addEventListener( Event.SOUND_COMPLETE,SoundComplete );
				}else{
					chan.channel=chan.sample.sound.play( chan.pausepos,chan.loops,chan.transform );
				}
			}
		}
	}
	
	internal function SoundComplete( ev:Event ):void{
		if( !loop_kludge ) return;
		for( var i:int=0;i<33;++i ){
			var chan:gxtkChannel=channels[i];
			if( chan.state==1 && chan.channel==ev.target && chan.loops ){
				chan.channel=chan.sample.sound.play( 0,0,chan.transform );
				chan.channel.addEventListener( Event.SOUND_COMPLETE,SoundComplete );
				break;
			}
		}
	}
	
	//***** GXTK API *****
	
	public function LoadSample( path:String ):gxtkSample{
		var sound:Sound=game.loadSound( path );
		if( sound ) return new gxtkSample( sound );
		return null;
	}
	
	public function PlaySample( sample:gxtkSample,channel:int,flags:int ):int{
		var chan:gxtkChannel=channels[channel];
		
		if( chan.state!=0 ) chan.channel.stop();

		chan.sample=sample;
		chan.loops=flags ? 0x7fffffff : 0;
		chan.state=1;
		if( loop_kludge ){
			chan.channel=sample.sound.play( 0,0,chan.transform );
			chan.channel.addEventListener( Event.SOUND_COMPLETE,SoundComplete );
		}else{
			chan.channel=sample.sound.play( 0,chan.loops,chan.transform );
		}

		return 0;
	}
	
	public function StopChannel( channel:int ):int{
		var chan:gxtkChannel=channels[channel];
		
		if( chan.state!=0 ){
			chan.channel.stop();
			chan.channel=null;
			chan.sample=null;
			chan.state=0;
		}
		return 0;
	}
	
	public function PauseChannel( channel:int ):int{
		var chan:gxtkChannel=channels[channel];
		
		if( chan.state==1 ){
			chan.pausepos=chan.channel.position;
			chan.channel.stop();
			chan.state=2;
		}
		return 0;
	}
	
	public function ResumeChannel( channel:int ):int{
		var chan:gxtkChannel=channels[channel];
		
		if( chan.state==2 ){
			chan.channel=chan.sample.sound.play( chan.pausepos,chan.loops,chan.transform );
			chan.state=1;
		}
		return 0;
	}
	
	public function ChannelState( channel:int ):int{
		return -1;
	}
	
	public function SetVolume( channel:int,volume:Number ):int{
		var chan:gxtkChannel=channels[channel];
		
		chan.transform.volume=volume;

		if( chan.state!=0 ) chan.channel.soundTransform=chan.transform;

		return 0;
	}
	
	public function SetPan( channel:int,pan:Number ):int{
		var chan:gxtkChannel=channels[channel];
		
		chan.transform.pan=pan;

		if( chan.state!=0 ) chan.channel.soundTransform=chan.transform;

		return 0;
	}
	
	public function SetRate( channel:int,rate:Number ):int{
		return -1;
	}
	
	public function PlayMusic( path:String,flags:int ):int{
		StopMusic();
		
		music=LoadSample( path );
		if( !music ) return -1;
		
		PlaySample( music,32,flags );
		return 0;
	}
	
	public function StopMusic():int{
		StopChannel( 32 );
		
		if( music ){
			music.Discard();
			music=null;
		}
		return 0;
	}
	
	public function PauseMusic():int{
		PauseChannel( 32 );
		
		return 0;
	}
	
	public function ResumeMusic():int{
		ResumeChannel( 32 );
		
		return 0;
	}
	
	public function MusicState():int{
		return ChannelState( 32 );
	}
	
	public function SetMusicVolume( volume:Number ):int{
		SetVolume( 32,volume );
		return 0;
	}
}

class gxtkSample{

	internal var sound:Sound;

	function gxtkSample( sound:Sound ){
		this.sound=sound;
	}
	
	public function Discard():int{
		return 0;
	}
	
}

class BBThread{

	internal var running:Boolean=false;
	
	public function Start():void{
		Run__UNSAFE__();
	}
	
	public function IsRunning():Boolean{
		return running;
	}
	
	public function Run__UNSAFE__():void{
	}
}

class BBAsyncImageLoaderThread extends BBThread{

	internal var _device:gxtkGraphics;
	internal var _path:String;
	internal var _surface:gxtkSurface;

	override public function Start():void{
		
		var thread:BBAsyncImageLoaderThread=this;
		
		var loader:Loader=new Loader();
		
		loader.contentLoaderInfo.addEventListener( Event.COMPLETE,onLoaded );
		loader.contentLoaderInfo.addEventListener( IOErrorEvent.IO_ERROR,onIoError );
		loader.contentLoaderInfo.addEventListener( SecurityErrorEvent.SECURITY_ERROR,onSecurityError );
		
		function onLoaded( e:Event ):void{
			thread._surface=new gxtkSurface( e.target.content );
			thread.running=false;
		}
		
		function onIoError( e:IOErrorEvent ):void{
			thread._surface=null;
			thread.running=false;
		}

		function onSecurityError( e:SecurityErrorEvent ):void{
			thread._surface=null;
			thread.running=false;
		}
		
		thread.running=true;
		
		loader.load( game.urlRequest( thread._path ) );
	}

}

class BBAsyncSoundLoaderThread extends BBThread{

	internal var _device:gxtkAudio;
	internal var _path:String;
	internal var _sample:gxtkSample;

	override public function Start():void{
		
		var thread:BBAsyncSoundLoaderThread=this;
		
		var sound:Sound=new Sound();
		
		sound.addEventListener( Event.COMPLETE,onLoaded );
		sound.addEventListener( IOErrorEvent.IO_ERROR,onIoError );
		sound.addEventListener( SecurityErrorEvent.SECURITY_ERROR,onSecurityError );
		
		function onLoaded( e:Event ):void{
			thread._sample=new gxtkSample( sound );
			thread.running=false;
		}
		
		function onIoError( e:IOErrorEvent ):void{
			thread._sample=null;
			thread.running=false;
		}

		function onSecurityError( e:SecurityErrorEvent ):void{
			thread._sample=null;
			thread.running=false;
		}
		
		thread.running=true;
		
		sound.load( game.urlRequest( thread._path ) );
	}
}
function systemMillisecs():Number
{
	return (new Date).getTime();
}class bb_app_App extends Object{
	public function g_App_new():bb_app_App{
		bb_app_device=(new bb_app_AppDevice).g_AppDevice_new(this);
		return this;
	}
	public function m_OnCreate():int{
		return 0;
	}
	public function m_OnUpdate():int{
		return 0;
	}
	public function m_OnSuspend():int{
		return 0;
	}
	public function m_OnResume():int{
		return 0;
	}
	public function m_OnRender():int{
		return 0;
	}
	public function m_OnLoading():int{
		return 0;
	}
}
class bb_xmas_XmasApp extends bb_app_App{
	public function g_XmasApp_new():bb_xmas_XmasApp{
		super.g_App_new();
		return this;
	}
	internal var f_scene:bb_scene_Scene=null;
	public override function m_OnCreate():int{
		bb_app_SetUpdateRate(30);
		bb_random_Seed=systemMillisecs();
		bb_gfx_GFX.g_Init();
		bb_scene_Scene.g_Init();
		bb_sfx_SFX.g_Init();
		bb_autofit_SetVirtualDisplay(360,240,1.0);
		this.f_scene=bb_scene_GenerateScene();
		bb_audio_PlayMusic("mus/sleigh.mp3",1);
		return 1;
	}
	internal var f_textFade:Number=-5.0;
	public override function m_OnUpdate():int{
		if((bb_input_KeyHit(32))!=0){
			this.f_scene=bb_scene_GenerateScene();
		}
		this.f_scene.m_Update();
		if(this.f_textFade<1.0){
			this.f_textFade+=0.02;
		}else{
			this.f_textFade=1.0;
		}
		return 1;
	}
	public override function m_OnRender():int{
		bb_autofit_UpdateVirtualDisplay(true,true);
		bb_graphics_Cls(0.0,0.0,0.0);
		this.f_scene.m_Render();
		if(this.f_textFade>=0.0){
			bb_graphics_SetAlpha(this.f_textFade);
		}else{
			bb_graphics_SetAlpha(0.0);
		}
		bb_gfx_GFX.g_Draw(50,20,192,288,320,224);
		return 1;
	}
}
class bb_app_AppDevice extends gxtkApp{
	internal var f_app:bb_app_App=null;
	public function g_AppDevice_new(t_app:bb_app_App):bb_app_AppDevice{
		this.f_app=t_app;
		bb_graphics_SetGraphicsDevice(this.GraphicsDevice());
		bb_input_SetInputDevice(this.InputDevice());
		bb_audio_SetAudioDevice(this.AudioDevice());
		return this;
	}
	public function g_AppDevice_new2():bb_app_AppDevice{
		return this;
	}
	public override function OnCreate():int{
		bb_graphics_SetFont(null,32);
		return this.f_app.m_OnCreate();
	}
	public override function OnUpdate():int{
		return this.f_app.m_OnUpdate();
	}
	public override function OnSuspend():int{
		return this.f_app.m_OnSuspend();
	}
	public override function OnResume():int{
		return this.f_app.m_OnResume();
	}
	public override function OnRender():int{
		bb_graphics_BeginRender();
		var t_r:int=this.f_app.m_OnRender();
		bb_graphics_EndRender();
		return t_r;
	}
	public override function OnLoading():int{
		bb_graphics_BeginRender();
		var t_r:int=this.f_app.m_OnLoading();
		bb_graphics_EndRender();
		return t_r;
	}
	internal var f_updateRate:int=0;
	public override function SetUpdateRate(t_hertz:int):int{
		super.SetUpdateRate(t_hertz);
		this.f_updateRate=t_hertz;
		return 0;
	}
}
var bb_graphics_device:gxtkGraphics;
internal function bb_graphics_SetGraphicsDevice(t_dev:gxtkGraphics):int{
	bb_graphics_device=t_dev;
	return 0;
}
var bb_input_device:gxtkInput;
internal function bb_input_SetInputDevice(t_dev:gxtkInput):int{
	bb_input_device=t_dev;
	return 0;
}
var bb_audio_device:gxtkAudio;
internal function bb_audio_SetAudioDevice(t_dev:gxtkAudio):int{
	bb_audio_device=t_dev;
	return 0;
}
var bb_app_device:bb_app_AppDevice;
internal function bbMain():int{
	(new bb_xmas_XmasApp).g_XmasApp_new();
	return 0;
}
class bb_graphics_Image extends Object{
	internal static var g_DefaultFlags:int;
	public function g_Image_new():bb_graphics_Image{
		return this;
	}
	internal var f_surface:gxtkSurface=null;
	internal var f_width:int=0;
	internal var f_height:int=0;
	internal var f_frames:Array=[];
	internal var f_flags:int=0;
	internal var f_tx:Number=.0;
	internal var f_ty:Number=.0;
	public function m_SetHandle(t_tx:Number,t_ty:Number):int{
		this.f_tx=t_tx;
		this.f_ty=t_ty;
		this.f_flags=this.f_flags&-2;
		return 0;
	}
	public function m_ApplyFlags(t_iflags:int):int{
		this.f_flags=t_iflags;
		if((this.f_flags&2)!=0){
			var t_:Array=this.f_frames;
			var t_2:int=0;
			while(t_2<t_.length){
				var t_f:bb_graphics_Frame=t_[t_2];
				t_2=t_2+1;
				t_f.f_x+=1;
			}
			this.f_width-=2;
		}
		if((this.f_flags&4)!=0){
			var t_3:Array=this.f_frames;
			var t_4:int=0;
			while(t_4<t_3.length){
				var t_f2:bb_graphics_Frame=t_3[t_4];
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
	public function m_Init(t_surf:gxtkSurface,t_nframes:int,t_iflags:int):bb_graphics_Image{
		this.f_surface=t_surf;
		this.f_width=((this.f_surface.Width()/t_nframes)|0);
		this.f_height=this.f_surface.Height();
		this.f_frames=new_object_array(t_nframes);
		for(var t_i:int=0;t_i<t_nframes;t_i=t_i+1){
			this.f_frames[t_i]=(new bb_graphics_Frame).g_Frame_new(t_i*this.f_width,0);
		}
		this.m_ApplyFlags(t_iflags);
		return this;
	}
	internal var f_source:bb_graphics_Image=null;
	public function m_Grab(t_x:int,t_y:int,t_iwidth:int,t_iheight:int,t_nframes:int,t_iflags:int,t_source:bb_graphics_Image):bb_graphics_Image{
		this.f_source=t_source;
		this.f_surface=t_source.f_surface;
		this.f_width=t_iwidth;
		this.f_height=t_iheight;
		this.f_frames=new_object_array(t_nframes);
		var t_ix:int=t_x;
		var t_iy:int=t_y;
		for(var t_i:int=0;t_i<t_nframes;t_i=t_i+1){
			if(t_ix+this.f_width>t_source.f_width){
				t_ix=0;
				t_iy+=this.f_height;
			}
			if(t_ix+this.f_width>t_source.f_width || t_iy+this.f_height>t_source.f_height){
				error("Image frame outside surface");
			}
			this.f_frames[t_i]=(new bb_graphics_Frame).g_Frame_new(t_ix+t_source.f_frames[0].f_x,t_iy+t_source.f_frames[0].f_y);
			t_ix+=this.f_width;
		}
		this.m_ApplyFlags(t_iflags);
		return this;
	}
	public function m_GrabImage(t_x:int,t_y:int,t_width:int,t_height:int,t_frames:int,t_flags:int):bb_graphics_Image{
		if(this.f_frames.length!=1){
			return null;
		}
		return ((new bb_graphics_Image).g_Image_new()).m_Grab(t_x,t_y,t_width,t_height,t_frames,t_flags,this);
	}
}
class bb_graphics_GraphicsContext extends Object{
	public function g_GraphicsContext_new():bb_graphics_GraphicsContext{
		return this;
	}
	internal var f_defaultFont:bb_graphics_Image=null;
	internal var f_font:bb_graphics_Image=null;
	internal var f_firstChar:int=0;
	internal var f_matrixSp:int=0;
	internal var f_ix:Number=1.0;
	internal var f_iy:Number=.0;
	internal var f_jx:Number=.0;
	internal var f_jy:Number=1.0;
	internal var f_tx:Number=.0;
	internal var f_ty:Number=.0;
	internal var f_tformed:int=0;
	internal var f_matDirty:int=0;
	internal var f_color_r:Number=.0;
	internal var f_color_g:Number=.0;
	internal var f_color_b:Number=.0;
	internal var f_alpha:Number=.0;
	internal var f_blend:int=0;
	internal var f_scissor_x:Number=.0;
	internal var f_scissor_y:Number=.0;
	internal var f_scissor_width:Number=.0;
	internal var f_scissor_height:Number=.0;
	internal var f_matrixStack:Array=new_number_array(192);
	public function m_Validate():int{
		if((this.f_matDirty)!=0){
			bb_graphics_renderDevice.SetMatrix(bb_graphics_context.f_ix,bb_graphics_context.f_iy,bb_graphics_context.f_jx,bb_graphics_context.f_jy,bb_graphics_context.f_tx,bb_graphics_context.f_ty);
			this.f_matDirty=0;
		}
		return 0;
	}
}
var bb_graphics_context:bb_graphics_GraphicsContext;
internal function bb_data_FixDataPath(t_path:String):String{
	var t_i:int=t_path.indexOf(":/",0);
	if(t_i!=-1 && t_path.indexOf("/",0)==t_i+1){
		return t_path;
	}
	if(string_startswith(t_path,"./") || string_startswith(t_path,"/")){
		return t_path;
	}
	return "monkey://data/"+t_path;
}
class bb_graphics_Frame extends Object{
	internal var f_x:int=0;
	internal var f_y:int=0;
	public function g_Frame_new(t_x:int,t_y:int):bb_graphics_Frame{
		this.f_x=t_x;
		this.f_y=t_y;
		return this;
	}
	public function g_Frame_new2():bb_graphics_Frame{
		return this;
	}
}
internal function bb_graphics_LoadImage(t_path:String,t_frameCount:int,t_flags:int):bb_graphics_Image{
	var t_surf:gxtkSurface=bb_graphics_device.LoadSurface(bb_data_FixDataPath(t_path));
	if((t_surf)!=null){
		return ((new bb_graphics_Image).g_Image_new()).m_Init(t_surf,t_frameCount,t_flags);
	}
	return null;
}
internal function bb_graphics_LoadImage2(t_path:String,t_frameWidth:int,t_frameHeight:int,t_frameCount:int,t_flags:int):bb_graphics_Image{
	var t_atlas:bb_graphics_Image=bb_graphics_LoadImage(t_path,1,0);
	if((t_atlas)!=null){
		return t_atlas.m_GrabImage(0,0,t_frameWidth,t_frameHeight,t_frameCount,t_flags);
	}
	return null;
}
internal function bb_graphics_SetFont(t_font:bb_graphics_Image,t_firstChar:int):int{
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
var bb_graphics_renderDevice:gxtkGraphics;
internal function bb_graphics_SetMatrix(t_ix:Number,t_iy:Number,t_jx:Number,t_jy:Number,t_tx:Number,t_ty:Number):int{
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
internal function bb_graphics_SetMatrix2(t_m:Array):int{
	bb_graphics_SetMatrix(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
	return 0;
}
internal function bb_graphics_SetColor(t_r:Number,t_g:Number,t_b:Number):int{
	bb_graphics_context.f_color_r=t_r;
	bb_graphics_context.f_color_g=t_g;
	bb_graphics_context.f_color_b=t_b;
	bb_graphics_renderDevice.SetColor(t_r,t_g,t_b);
	return 0;
}
internal function bb_graphics_SetAlpha(t_alpha:Number):int{
	bb_graphics_context.f_alpha=t_alpha;
	bb_graphics_renderDevice.SetAlpha(t_alpha);
	return 0;
}
internal function bb_graphics_SetBlend(t_blend:int):int{
	bb_graphics_context.f_blend=t_blend;
	bb_graphics_renderDevice.SetBlend(t_blend);
	return 0;
}
internal function bb_graphics_DeviceWidth():int{
	return bb_graphics_device.Width();
}
internal function bb_graphics_DeviceHeight():int{
	return bb_graphics_device.Height();
}
internal function bb_graphics_SetScissor(t_x:Number,t_y:Number,t_width:Number,t_height:Number):int{
	bb_graphics_context.f_scissor_x=t_x;
	bb_graphics_context.f_scissor_y=t_y;
	bb_graphics_context.f_scissor_width=t_width;
	bb_graphics_context.f_scissor_height=t_height;
	bb_graphics_renderDevice.SetScissor(((t_x)|0),((t_y)|0),((t_width)|0),((t_height)|0));
	return 0;
}
internal function bb_graphics_BeginRender():int{
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
internal function bb_graphics_EndRender():int{
	bb_graphics_renderDevice=null;
	return 0;
}
internal function bb_app_SetUpdateRate(t_hertz:int):int{
	return bb_app_device.SetUpdateRate(t_hertz);
}
var bb_random_Seed:int;
class bb_gfx_GFX extends Object{
	internal static var g_Tileset:bb_graphics_Image;
	public static function g_Init():void{
		g_Tileset=bb_graphics_LoadImage("gfx/xmas_sprites.png",1,bb_graphics_Image.g_DefaultFlags);
	}
	public static function g_Draw(t_tX:int,t_tY:int,t_X:int,t_Y:int,t_W:int,t_H:int):void{
		bb_graphics_DrawImageRect(g_Tileset,(t_tX),(t_tY),t_X,t_Y,t_W,t_H,0);
	}
}
class bb_scene_Scene extends Object{
	internal static var g_Background:bb_graphics_Image;
	public static function g_Init():void{
		g_Background=bb_graphics_LoadImage("gfx/xmas_scene.png",1,bb_graphics_Image.g_DefaultFlags);
	}
	internal static var g_Width:int;
	internal var f_FloorSegmentCount:int=0;
	internal var f_FloorSegments:Array=[];
	internal var f_Trees:bb_list_List=null;
	internal var f_Houses:bb_list_List2=null;
	internal var f_Stars:bb_list_List3=null;
	internal var f_Snowmen:bb_list_List4=null;
	internal var f_Snowflakes:bb_list_List5=null;
	internal var f_moon:bb_moon_Moon=null;
	public function g_Scene_new():bb_scene_Scene{
		this.f_FloorSegmentCount=((g_Width/bb_floorsegment_FloorSegment.g_Width)|0)+1;
		this.f_FloorSegments=new_object_array(this.f_FloorSegmentCount);
		for(var t_i:int=0;t_i<this.f_FloorSegmentCount;t_i=t_i+1){
			this.f_FloorSegments[t_i]=(new bb_floorsegment_FloorSegment).g_FloorSegment_new(this);
		}
		this.f_Trees=(new bb_list_List).g_List_new();
		this.f_Houses=(new bb_list_List2).g_List_new();
		this.f_Stars=(new bb_list_List3).g_List_new();
		this.f_Snowmen=(new bb_list_List4).g_List_new();
		this.f_Snowflakes=(new bb_list_List5).g_List_new();
		this.f_moon=(new bb_moon_Moon).g_Moon_new(this);
		return this;
	}
	internal static var g_Height:int;
	internal var f_FloorStartY:Number=.0;
	internal var f_FloorHFlux:Number=.0;
	internal var f_FloorVFlux:Number=.0;
	public function m_GetFloorYAtX(t_tX:Number):Number{
		return this.f_FloorStartY+Math.sin((t_tX*this.f_FloorHFlux)*D2R)*this.f_FloorVFlux;
	}
	public function m_CheckRectAgainstScene(t_X:Number,t_Y:Number,t_W:Number,t_H:Number):Boolean{
		var t_good:Boolean=true;
		var t_:bb_list_Enumerator=this.f_Houses.m_ObjectEnumerator();
		while(t_.m_HasNext()){
			var t_tH:bb_house_House=t_.m_NextObject();
			if(bb_xmas_RectOverRect(t_X,t_Y,t_W,t_H,t_tH.f_X,t_tH.f_Y,48.0,64.0)){
				t_good=false;
			}
		}
		var t_2:bb_list_Enumerator2=this.f_Trees.m_ObjectEnumerator();
		while(t_2.m_HasNext()){
			var t_tT:bb_tree_Tree=t_2.m_NextObject();
			if(bb_xmas_RectOverRect(t_X,t_Y,t_W,t_H,t_tT.f_X,t_tT.f_Y,16.0,32.0)){
				t_good=false;
			}
		}
		var t_3:bb_list_Enumerator3=this.f_Snowmen.m_ObjectEnumerator();
		while(t_3.m_HasNext()){
			var t_tS:bb_snowman_Snowman=t_3.m_NextObject();
			if(bb_xmas_RectOverRect(t_X,t_Y,t_W,t_H,t_tS.f_X,t_tS.f_Y,16.0,32.0)){
				t_good=false;
			}
		}
		return t_good;
	}
	public function m_AddSnowFlake():void{
		var t_tS:bb_snowflake_Snowflake=(new bb_snowflake_Snowflake).g_Snowflake_new(this);
		if(bb_random_Rnd()<0.5){
			t_tS.f_X=-10.0;
			t_tS.f_Y=bb_random_Rnd2(-5.0,(g_Height-5));
		}else{
			t_tS.f_X=bb_random_Rnd2(-5.0,(g_Width-5));
			t_tS.f_Y=-10.0;
		}
		t_tS.f_Frame=((bb_random_Rnd2(0.0,7.0))|0);
		t_tS.f_XS=bb_random_Rnd2(-1.0,2.0);
		t_tS.f_YS=bb_random_Rnd2(0.1,1.0);
		this.f_Snowflakes.m_AddLast5(t_tS);
	}
	public function m_Update():void{
		var t_:bb_list_Enumerator2=this.f_Trees.m_ObjectEnumerator();
		while(t_.m_HasNext()){
			var t_tTree:bb_tree_Tree=t_.m_NextObject();
			t_tTree.m_Update();
		}
		var t_2:bb_list_Enumerator=this.f_Houses.m_ObjectEnumerator();
		while(t_2.m_HasNext()){
			var t_tHouse:bb_house_House=t_2.m_NextObject();
			t_tHouse.m_Update();
		}
		var t_3:bb_list_Enumerator5=this.f_Stars.m_ObjectEnumerator();
		while(t_3.m_HasNext()){
			var t_tStar:bb_star_Star=t_3.m_NextObject();
			t_tStar.m_Update();
		}
		var t_4:bb_list_Enumerator3=this.f_Snowmen.m_ObjectEnumerator();
		while(t_4.m_HasNext()){
			var t_tSnowman:bb_snowman_Snowman=t_4.m_NextObject();
			t_tSnowman.m_Update();
		}
		var t_5:bb_list_Enumerator6=this.f_Snowflakes.m_ObjectEnumerator();
		while(t_5.m_HasNext()){
			var t_tSnowflake:bb_snowflake_Snowflake=t_5.m_NextObject();
			t_tSnowflake.m_Update();
		}
		if(bb_random_Rnd()<0.2){
			this.m_AddSnowFlake();
		}
	}
	public function m_Render():void{
		bb_graphics_SetColor(255.0,255.0,255.0);
		bb_graphics_SetAlpha(1.0);
		bb_graphics_DrawImage(g_Background,0.0,0.0,0);
		var t_:bb_list_Enumerator5=this.f_Stars.m_ObjectEnumerator();
		while(t_.m_HasNext()){
			var t_tStar:bb_star_Star=t_.m_NextObject();
			t_tStar.m_Render();
		}
		bb_graphics_SetAlpha(1.0);
		this.f_moon.m_Render();
		var t_2:bb_list_Enumerator2=this.f_Trees.m_ObjectEnumerator();
		while(t_2.m_HasNext()){
			var t_tTree:bb_tree_Tree=t_2.m_NextObject();
			t_tTree.m_Render();
		}
		bb_graphics_SetAlpha(1.0);
		var t_3:bb_list_Enumerator=this.f_Houses.m_ObjectEnumerator();
		while(t_3.m_HasNext()){
			var t_tHouse:bb_house_House=t_3.m_NextObject();
			t_tHouse.m_Render();
		}
		var t_4:bb_list_Enumerator3=this.f_Snowmen.m_ObjectEnumerator();
		while(t_4.m_HasNext()){
			var t_tSnowman:bb_snowman_Snowman=t_4.m_NextObject();
			t_tSnowman.m_Render();
		}
		for(var t_i:int=0;t_i<this.f_FloorSegmentCount;t_i=t_i+1){
			this.f_FloorSegments[t_i].m_Render();
		}
		var t_5:bb_list_Enumerator6=this.f_Snowflakes.m_ObjectEnumerator();
		while(t_5.m_HasNext()){
			var t_tSnowflake:bb_snowflake_Snowflake=t_5.m_NextObject();
			t_tSnowflake.m_Render();
		}
	}
}
class bb_sfx_SFX extends Object{
	internal static var g_ActiveChannel:int;
	internal static var g_Sounds:bb_map_StringMap;
	internal static var g_Musics:bb_map_StringMap2;
	internal static var g_SoundFileAppendix:String;
	public static function g_Init():void{
		g_ActiveChannel=0;
		g_Sounds=(new bb_map_StringMap).g_StringMap_new();
		g_Musics=(new bb_map_StringMap2).g_StringMap_new();
		g_SoundFileAppendix=".mp3";
	}
}
class bb_audio_Sound extends Object{
}
class bb_map_Map extends Object{
	public function g_Map_new():bb_map_Map{
		return this;
	}
}
class bb_map_StringMap extends bb_map_Map{
	public function g_StringMap_new():bb_map_StringMap{
		super.g_Map_new();
		return this;
	}
}
class bb_map_Map2 extends Object{
	public function g_Map_new():bb_map_Map2{
		return this;
	}
}
class bb_map_StringMap2 extends bb_map_Map2{
	public function g_StringMap_new():bb_map_StringMap2{
		super.g_Map_new();
		return this;
	}
}
class bb_autofit_VirtualDisplay extends Object{
	internal var f_vwidth:Number=.0;
	internal var f_vheight:Number=.0;
	internal var f_vzoom:Number=.0;
	internal var f_lastvzoom:Number=.0;
	internal var f_vratio:Number=.0;
	internal static var g_Display:bb_autofit_VirtualDisplay;
	public function g_VirtualDisplay_new(t_width:int,t_height:int,t_zoom:Number):bb_autofit_VirtualDisplay{
		this.f_vwidth=(t_width);
		this.f_vheight=(t_height);
		this.f_vzoom=t_zoom;
		this.f_lastvzoom=this.f_vzoom+1.0;
		this.f_vratio=this.f_vheight/this.f_vwidth;
		g_Display=this;
		return this;
	}
	public function g_VirtualDisplay_new2():bb_autofit_VirtualDisplay{
		return this;
	}
	internal var f_lastdevicewidth:int=0;
	internal var f_lastdeviceheight:int=0;
	internal var f_device_changed:int=0;
	internal var f_fdw:Number=.0;
	internal var f_fdh:Number=.0;
	internal var f_dratio:Number=.0;
	internal var f_multi:Number=.0;
	internal var f_heightborder:Number=.0;
	internal var f_widthborder:Number=.0;
	internal var f_zoom_changed:int=0;
	internal var f_realx:Number=.0;
	internal var f_realy:Number=.0;
	internal var f_offx:Number=.0;
	internal var f_offy:Number=.0;
	internal var f_sx:Number=.0;
	internal var f_sw:Number=.0;
	internal var f_sy:Number=.0;
	internal var f_sh:Number=.0;
	internal var f_scaledw:Number=.0;
	internal var f_scaledh:Number=.0;
	internal var f_vxoff:Number=.0;
	internal var f_vyoff:Number=.0;
	public function m_UpdateVirtualDisplay(t_zoomborders:Boolean,t_keepborders:Boolean):int{
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
}
internal function bb_autofit_SetVirtualDisplay(t_width:int,t_height:int,t_zoom:Number):int{
	(new bb_autofit_VirtualDisplay).g_VirtualDisplay_new(t_width,t_height,t_zoom);
	return 0;
}
class bb_floorsegment_FloorSegment extends Object{
	internal static var g_Width:int;
	internal var f_scene:bb_scene_Scene=null;
	public function g_FloorSegment_new(t_tS:bb_scene_Scene):bb_floorsegment_FloorSegment{
		this.f_scene=t_tS;
		return this;
	}
	public function g_FloorSegment_new2():bb_floorsegment_FloorSegment{
		return this;
	}
	internal var f_X:int=0;
	internal var f_Y:int=0;
	public function m_SetPos(t_tX:int,t_tY:int):void{
		this.f_X=t_tX;
		this.f_Y=t_tY;
	}
	public function m_Render():void{
		bb_gfx_GFX.g_Draw(this.f_X,this.f_Y,0,96,g_Width,100);
	}
}
class bb_tree_Tree extends Object{
	internal var f_scene:bb_scene_Scene=null;
	internal var f_Lights:bb_list_List6=null;
	public function g_Tree_new(t_tS:bb_scene_Scene):bb_tree_Tree{
		this.f_scene=t_tS;
		this.f_Lights=(new bb_list_List6).g_List_new();
		return this;
	}
	public function g_Tree_new2():bb_tree_Tree{
		return this;
	}
	internal var f_X:Number=.0;
	internal var f_Y:Number=.0;
	internal var f_Frame:int=0;
	public function m_SetPos2(t_tX:Number,t_tY:Number):void{
		this.f_X=t_tX;
		this.f_Y=t_tY;
	}
	internal var f_BlinkRate:int=0;
	internal var f_BlinkRateTimer:int=0;
	public function m_Update():void{
		this.f_BlinkRateTimer+=1;
		if(this.f_BlinkRateTimer>=this.f_BlinkRate){
			this.f_BlinkRateTimer=0;
			var t_:bb_list_Enumerator4=this.f_Lights.m_ObjectEnumerator();
			while(t_.m_HasNext()){
				var t_tTL:bb_treelight_TreeLight=t_.m_NextObject();
				t_tTL.m_Blink();
			}
		}
	}
	public function m_Render():void{
		bb_graphics_SetAlpha(1.0);
		bb_gfx_GFX.g_Draw(((this.f_X)|0),((this.f_Y)|0),16+this.f_Frame*16,96,16,32);
		var t_:bb_list_Enumerator4=this.f_Lights.m_ObjectEnumerator();
		while(t_.m_HasNext()){
			var t_tTL:bb_treelight_TreeLight=t_.m_NextObject();
			t_tTL.m_Render();
		}
	}
}
class bb_list_List extends Object{
	public function g_List_new():bb_list_List{
		return this;
	}
	internal var f__head:bb_list_Node=((new bb_list_HeadNode).g_HeadNode_new());
	public function m_AddLast(t_data:bb_tree_Tree):bb_list_Node{
		return (new bb_list_Node).g_Node_new(this.f__head,this.f__head.f__pred,t_data);
	}
	public function g_List_new2(t_data:Array):bb_list_List{
		var t_:Array=t_data;
		var t_2:int=0;
		while(t_2<t_.length){
			var t_t:bb_tree_Tree=t_[t_2];
			t_2=t_2+1;
			this.m_AddLast(t_t);
		}
		return this;
	}
	public function m_ObjectEnumerator():bb_list_Enumerator2{
		return (new bb_list_Enumerator2).g_Enumerator_new(this);
	}
}
class bb_list_Node extends Object{
	internal var f__succ:bb_list_Node=null;
	internal var f__pred:bb_list_Node=null;
	internal var f__data:bb_tree_Tree=null;
	public function g_Node_new(t_succ:bb_list_Node,t_pred:bb_list_Node,t_data:bb_tree_Tree):bb_list_Node{
		this.f__succ=t_succ;
		this.f__pred=t_pred;
		this.f__succ.f__pred=this;
		this.f__pred.f__succ=this;
		this.f__data=t_data;
		return this;
	}
	public function g_Node_new2():bb_list_Node{
		return this;
	}
}
class bb_list_HeadNode extends bb_list_Node{
	public function g_HeadNode_new():bb_list_HeadNode{
		super.g_Node_new2();
		this.f__succ=(this);
		this.f__pred=(this);
		return this;
	}
}
class bb_house_House extends Object{
	internal var f_scene:bb_scene_Scene=null;
	public function g_House_new(t_tS:bb_scene_Scene):bb_house_House{
		this.f_scene=t_tS;
		return this;
	}
	public function g_House_new2():bb_house_House{
		return this;
	}
	internal var f_X:Number=.0;
	internal var f_Y:Number=.0;
	public function m_SetPos2(t_tX:Number,t_tY:Number):void{
		this.f_X=t_tX;
		this.f_Y=t_tY;
	}
	public function m_Update():void{
	}
	public function m_Render():void{
		bb_gfx_GFX.g_Draw(((this.f_X)|0),((this.f_Y)|0),0,288,48,64);
	}
}
class bb_list_List2 extends Object{
	public function g_List_new():bb_list_List2{
		return this;
	}
	internal var f__head:bb_list_Node2=((new bb_list_HeadNode2).g_HeadNode_new());
	public function m_AddLast2(t_data:bb_house_House):bb_list_Node2{
		return (new bb_list_Node2).g_Node_new(this.f__head,this.f__head.f__pred,t_data);
	}
	public function g_List_new2(t_data:Array):bb_list_List2{
		var t_:Array=t_data;
		var t_2:int=0;
		while(t_2<t_.length){
			var t_t:bb_house_House=t_[t_2];
			t_2=t_2+1;
			this.m_AddLast2(t_t);
		}
		return this;
	}
	public function m_ObjectEnumerator():bb_list_Enumerator{
		return (new bb_list_Enumerator).g_Enumerator_new(this);
	}
}
class bb_list_Node2 extends Object{
	internal var f__succ:bb_list_Node2=null;
	internal var f__pred:bb_list_Node2=null;
	internal var f__data:bb_house_House=null;
	public function g_Node_new(t_succ:bb_list_Node2,t_pred:bb_list_Node2,t_data:bb_house_House):bb_list_Node2{
		this.f__succ=t_succ;
		this.f__pred=t_pred;
		this.f__succ.f__pred=this;
		this.f__pred.f__succ=this;
		this.f__data=t_data;
		return this;
	}
	public function g_Node_new2():bb_list_Node2{
		return this;
	}
}
class bb_list_HeadNode2 extends bb_list_Node2{
	public function g_HeadNode_new():bb_list_HeadNode2{
		super.g_Node_new2();
		this.f__succ=(this);
		this.f__pred=(this);
		return this;
	}
}
class bb_star_Star extends Object{
	internal var f_scene:bb_scene_Scene=null;
	public function g_Star_new(t_tS:bb_scene_Scene):bb_star_Star{
		this.f_scene=t_tS;
		return this;
	}
	public function g_Star_new2():bb_star_Star{
		return this;
	}
	internal var f_X:int=0;
	internal var f_Y:int=0;
	public function m_SetPos2(t_tX:Number,t_tY:Number):int{
		this.f_X=((t_tX)|0);
		this.f_Y=((t_tY)|0);
		return 0;
	}
	internal var f_alpha:Number=.0;
	internal var f_changeTimer:int=0;
	internal var f_Frame:int=0;
	public function m_Update():void{
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
	public function m_Render():void{
		var t_tA:Number=this.f_alpha;
		if((this.f_Y)<(bb_scene_Scene.g_Height)*0.5){
			t_tA=this.f_alpha;
		}else{
			t_tA=this.f_alpha*(1.0-((this.f_Y)-(bb_scene_Scene.g_Height)*0.5)/((bb_scene_Scene.g_Height)*0.5))*0.75;
		}
		bb_graphics_SetAlpha(t_tA);
		bb_gfx_GFX.g_Draw(this.f_X,this.f_Y,0+this.f_Frame*16,16,1,1);
	}
}
class bb_list_List3 extends Object{
	public function g_List_new():bb_list_List3{
		return this;
	}
	internal var f__head:bb_list_Node3=((new bb_list_HeadNode3).g_HeadNode_new());
	public function m_AddLast3(t_data:bb_star_Star):bb_list_Node3{
		return (new bb_list_Node3).g_Node_new(this.f__head,this.f__head.f__pred,t_data);
	}
	public function g_List_new2(t_data:Array):bb_list_List3{
		var t_:Array=t_data;
		var t_2:int=0;
		while(t_2<t_.length){
			var t_t:bb_star_Star=t_[t_2];
			t_2=t_2+1;
			this.m_AddLast3(t_t);
		}
		return this;
	}
	public function m_ObjectEnumerator():bb_list_Enumerator5{
		return (new bb_list_Enumerator5).g_Enumerator_new(this);
	}
}
class bb_list_Node3 extends Object{
	internal var f__succ:bb_list_Node3=null;
	internal var f__pred:bb_list_Node3=null;
	internal var f__data:bb_star_Star=null;
	public function g_Node_new(t_succ:bb_list_Node3,t_pred:bb_list_Node3,t_data:bb_star_Star):bb_list_Node3{
		this.f__succ=t_succ;
		this.f__pred=t_pred;
		this.f__succ.f__pred=this;
		this.f__pred.f__succ=this;
		this.f__data=t_data;
		return this;
	}
	public function g_Node_new2():bb_list_Node3{
		return this;
	}
}
class bb_list_HeadNode3 extends bb_list_Node3{
	public function g_HeadNode_new():bb_list_HeadNode3{
		super.g_Node_new2();
		this.f__succ=(this);
		this.f__pred=(this);
		return this;
	}
}
class bb_snowman_Snowman extends Object{
	internal var f_X:Number=.0;
	internal var f_Y:Number=.0;
	internal var f_scene:bb_scene_Scene=null;
	public function g_Snowman_new(t_tS:bb_scene_Scene):bb_snowman_Snowman{
		this.f_scene=t_tS;
		return this;
	}
	public function g_Snowman_new2():bb_snowman_Snowman{
		return this;
	}
	internal var f_head:bb_snowmanhead_SnowmanHead=null;
	internal var f_body:bb_snowmanbody_SnowmanBody=null;
	public function m_SetPos2(t_tX:Number,t_tY:Number):int{
		this.f_head.m_SetPos2(t_tX,t_tY-26.0);
		this.f_body.m_SetPos2(t_tX,t_tY-12.0);
		return 0;
	}
	public function m_Update():void{
	}
	public function m_Render():void{
		this.f_body.m_Render();
		this.f_head.m_Render();
	}
}
class bb_list_List4 extends Object{
	public function g_List_new():bb_list_List4{
		return this;
	}
	internal var f__head:bb_list_Node4=((new bb_list_HeadNode4).g_HeadNode_new());
	public function m_AddLast4(t_data:bb_snowman_Snowman):bb_list_Node4{
		return (new bb_list_Node4).g_Node_new(this.f__head,this.f__head.f__pred,t_data);
	}
	public function g_List_new2(t_data:Array):bb_list_List4{
		var t_:Array=t_data;
		var t_2:int=0;
		while(t_2<t_.length){
			var t_t:bb_snowman_Snowman=t_[t_2];
			t_2=t_2+1;
			this.m_AddLast4(t_t);
		}
		return this;
	}
	public function m_ObjectEnumerator():bb_list_Enumerator3{
		return (new bb_list_Enumerator3).g_Enumerator_new(this);
	}
}
class bb_list_Node4 extends Object{
	internal var f__succ:bb_list_Node4=null;
	internal var f__pred:bb_list_Node4=null;
	internal var f__data:bb_snowman_Snowman=null;
	public function g_Node_new(t_succ:bb_list_Node4,t_pred:bb_list_Node4,t_data:bb_snowman_Snowman):bb_list_Node4{
		this.f__succ=t_succ;
		this.f__pred=t_pred;
		this.f__succ.f__pred=this;
		this.f__pred.f__succ=this;
		this.f__data=t_data;
		return this;
	}
	public function g_Node_new2():bb_list_Node4{
		return this;
	}
}
class bb_list_HeadNode4 extends bb_list_Node4{
	public function g_HeadNode_new():bb_list_HeadNode4{
		super.g_Node_new2();
		this.f__succ=(this);
		this.f__pred=(this);
		return this;
	}
}
class bb_snowflake_Snowflake extends Object{
	internal var f_XS:Number=.0;
	internal var f_X:Number=.0;
	internal var f_YS:Number=.0;
	internal var f_Y:Number=.0;
	internal var f_scene:bb_scene_Scene=null;
	public function m_Update():void{
		this.f_X+=this.f_XS;
		this.f_Y+=this.f_YS;
		this.f_XS+=bb_random_Rnd2(-0.1,0.1);
		this.f_YS+=bb_random_Rnd2(-0.1,0.1);
		if(this.f_YS<0.0){
			this.f_YS=0.0;
		}
		if(this.f_X>(bb_scene_Scene.g_Width+16) || this.f_Y>(bb_scene_Scene.g_Height+16)){
			this.f_scene.f_Snowflakes.m_Remove(this);
		}
	}
	internal var f_Frame:int=0;
	public function g_Snowflake_new(t_tS:bb_scene_Scene):bb_snowflake_Snowflake{
		this.f_scene=t_tS;
		this.f_Frame=0;
		return this;
	}
	public function g_Snowflake_new2():bb_snowflake_Snowflake{
		return this;
	}
	public function m_Render():void{
		bb_gfx_GFX.g_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,0,16,16);
	}
}
class bb_list_List5 extends Object{
	public function g_List_new():bb_list_List5{
		return this;
	}
	internal var f__head:bb_list_Node5=((new bb_list_HeadNode5).g_HeadNode_new());
	public function m_AddLast5(t_data:bb_snowflake_Snowflake):bb_list_Node5{
		return (new bb_list_Node5).g_Node_new(this.f__head,this.f__head.f__pred,t_data);
	}
	public function g_List_new2(t_data:Array):bb_list_List5{
		var t_:Array=t_data;
		var t_2:int=0;
		while(t_2<t_.length){
			var t_t:bb_snowflake_Snowflake=t_[t_2];
			t_2=t_2+1;
			this.m_AddLast5(t_t);
		}
		return this;
	}
	public function m_ObjectEnumerator():bb_list_Enumerator6{
		return (new bb_list_Enumerator6).g_Enumerator_new(this);
	}
	public function m_Equals(t_lhs:bb_snowflake_Snowflake,t_rhs:bb_snowflake_Snowflake):Boolean{
		return t_lhs==t_rhs;
	}
	public function m_RemoveEach(t_value:bb_snowflake_Snowflake):int{
		var t_node:bb_list_Node5=this.f__head.f__succ;
		while(t_node!=this.f__head){
			var t_succ:bb_list_Node5=t_node.f__succ;
			if(this.m_Equals(t_node.f__data,t_value)){
				t_node.m_Remove2();
			}
			t_node=t_succ;
		}
		return 0;
	}
	public function m_Remove(t_value:bb_snowflake_Snowflake):int{
		this.m_RemoveEach(t_value);
		return 0;
	}
}
class bb_list_Node5 extends Object{
	internal var f__succ:bb_list_Node5=null;
	internal var f__pred:bb_list_Node5=null;
	internal var f__data:bb_snowflake_Snowflake=null;
	public function g_Node_new(t_succ:bb_list_Node5,t_pred:bb_list_Node5,t_data:bb_snowflake_Snowflake):bb_list_Node5{
		this.f__succ=t_succ;
		this.f__pred=t_pred;
		this.f__succ.f__pred=this;
		this.f__pred.f__succ=this;
		this.f__data=t_data;
		return this;
	}
	public function g_Node_new2():bb_list_Node5{
		return this;
	}
	public function m_Remove2():int{
		this.f__succ.f__pred=this.f__pred;
		this.f__pred.f__succ=this.f__succ;
		return 0;
	}
}
class bb_list_HeadNode5 extends bb_list_Node5{
	public function g_HeadNode_new():bb_list_HeadNode5{
		super.g_Node_new2();
		this.f__succ=(this);
		this.f__pred=(this);
		return this;
	}
}
class bb_moon_Moon extends Object{
	internal var f_scene:bb_scene_Scene=null;
	public function g_Moon_new(t_tS:bb_scene_Scene):bb_moon_Moon{
		this.f_scene=t_tS;
		return this;
	}
	public function g_Moon_new2():bb_moon_Moon{
		return this;
	}
	internal var f_X:Number=.0;
	internal var f_Y:Number=.0;
	internal var f_Frame:Number=.0;
	public function m_Set(t_tX:Number,t_tY:Number,t_tF:int):void{
		this.f_X=t_tX;
		this.f_Y=t_tY;
		this.f_Frame=(t_tF);
	}
	public function m_Render():void{
		bb_gfx_GFX.g_Draw(((this.f_X)|0),((this.f_Y)|0),((0.0+this.f_Frame*32.0)|0),208,32,32);
	}
}
internal function bb_random_Rnd():Number{
	bb_random_Seed=bb_random_Seed*1664525+1013904223|0;
	return (bb_random_Seed>>8&16777215)/16777216.0;
}
internal function bb_random_Rnd2(t_low:Number,t_high:Number):Number{
	return bb_random_Rnd3(t_high-t_low)+t_low;
}
internal function bb_random_Rnd3(t_range:Number):Number{
	return bb_random_Rnd()*t_range;
}
class bb_treelight_TreeLight extends Object{
	internal var f_tree:bb_tree_Tree=null;
	internal var f_scene:bb_scene_Scene=null;
	public function g_TreeLight_new(t_tT:bb_tree_Tree):bb_treelight_TreeLight{
		this.f_tree=t_tT;
		this.f_scene=t_tT.f_scene;
		return this;
	}
	public function g_TreeLight_new2():bb_treelight_TreeLight{
		return this;
	}
	internal var f_Frame:int=0;
	internal var f_X:Number=.0;
	internal var f_Y:Number=.0;
	public function m_SetPos2(t_tX:Number,t_tY:Number):void{
		this.f_X=t_tX;
		this.f_Y=t_tY;
	}
	internal var f_Bright:Boolean=false;
	public function m_Blink():void{
		this.f_Bright=!this.f_Bright;
	}
	public function m_Render():void{
		if(this.f_Bright){
			bb_graphics_SetAlpha(1.0);
		}else{
			bb_graphics_SetAlpha(0.2);
		}
		bb_gfx_GFX.g_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,64,3,3);
	}
}
class bb_list_List6 extends Object{
	public function g_List_new():bb_list_List6{
		return this;
	}
	internal var f__head:bb_list_Node6=((new bb_list_HeadNode6).g_HeadNode_new());
	public function m_AddLast6(t_data:bb_treelight_TreeLight):bb_list_Node6{
		return (new bb_list_Node6).g_Node_new(this.f__head,this.f__head.f__pred,t_data);
	}
	public function g_List_new2(t_data:Array):bb_list_List6{
		var t_:Array=t_data;
		var t_2:int=0;
		while(t_2<t_.length){
			var t_t:bb_treelight_TreeLight=t_[t_2];
			t_2=t_2+1;
			this.m_AddLast6(t_t);
		}
		return this;
	}
	public function m_ObjectEnumerator():bb_list_Enumerator4{
		return (new bb_list_Enumerator4).g_Enumerator_new(this);
	}
}
class bb_list_Node6 extends Object{
	internal var f__succ:bb_list_Node6=null;
	internal var f__pred:bb_list_Node6=null;
	internal var f__data:bb_treelight_TreeLight=null;
	public function g_Node_new(t_succ:bb_list_Node6,t_pred:bb_list_Node6,t_data:bb_treelight_TreeLight):bb_list_Node6{
		this.f__succ=t_succ;
		this.f__pred=t_pred;
		this.f__succ.f__pred=this;
		this.f__pred.f__succ=this;
		this.f__data=t_data;
		return this;
	}
	public function g_Node_new2():bb_list_Node6{
		return this;
	}
}
class bb_list_HeadNode6 extends bb_list_Node6{
	public function g_HeadNode_new():bb_list_HeadNode6{
		super.g_Node_new2();
		this.f__succ=(this);
		this.f__pred=(this);
		return this;
	}
}
class bb_list_Enumerator extends Object{
	internal var f__list:bb_list_List2=null;
	internal var f__curr:bb_list_Node2=null;
	public function g_Enumerator_new(t_list:bb_list_List2):bb_list_Enumerator{
		this.f__list=t_list;
		this.f__curr=t_list.f__head.f__succ;
		return this;
	}
	public function g_Enumerator_new2():bb_list_Enumerator{
		return this;
	}
	public function m_HasNext():Boolean{
		while(this.f__curr.f__succ.f__pred!=this.f__curr){
			this.f__curr=this.f__curr.f__succ;
		}
		return this.f__curr!=this.f__list.f__head;
	}
	public function m_NextObject():bb_house_House{
		var t_data:bb_house_House=this.f__curr.f__data;
		this.f__curr=this.f__curr.f__succ;
		return t_data;
	}
}
internal function bb_xmas_RectOverRect(t_X1:Number,t_Y1:Number,t_W1:Number,t_H1:Number,t_X2:Number,t_Y2:Number,t_W2:Number,t_H2:Number):Boolean{
	if(t_X1+t_W1<t_X2){
		return false;
	}
	if(t_X2+t_W2<t_X1){
		return false;
	}
	if(t_Y1+t_H1<t_Y2){
		return false;
	}
	if(t_Y2+t_H2<t_Y1){
		return false;
	}
	return true;
}
class bb_list_Enumerator2 extends Object{
	internal var f__list:bb_list_List=null;
	internal var f__curr:bb_list_Node=null;
	public function g_Enumerator_new(t_list:bb_list_List):bb_list_Enumerator2{
		this.f__list=t_list;
		this.f__curr=t_list.f__head.f__succ;
		return this;
	}
	public function g_Enumerator_new2():bb_list_Enumerator2{
		return this;
	}
	public function m_HasNext():Boolean{
		while(this.f__curr.f__succ.f__pred!=this.f__curr){
			this.f__curr=this.f__curr.f__succ;
		}
		return this.f__curr!=this.f__list.f__head;
	}
	public function m_NextObject():bb_tree_Tree{
		var t_data:bb_tree_Tree=this.f__curr.f__data;
		this.f__curr=this.f__curr.f__succ;
		return t_data;
	}
}
class bb_list_Enumerator3 extends Object{
	internal var f__list:bb_list_List4=null;
	internal var f__curr:bb_list_Node4=null;
	public function g_Enumerator_new(t_list:bb_list_List4):bb_list_Enumerator3{
		this.f__list=t_list;
		this.f__curr=t_list.f__head.f__succ;
		return this;
	}
	public function g_Enumerator_new2():bb_list_Enumerator3{
		return this;
	}
	public function m_HasNext():Boolean{
		while(this.f__curr.f__succ.f__pred!=this.f__curr){
			this.f__curr=this.f__curr.f__succ;
		}
		return this.f__curr!=this.f__list.f__head;
	}
	public function m_NextObject():bb_snowman_Snowman{
		var t_data:bb_snowman_Snowman=this.f__curr.f__data;
		this.f__curr=this.f__curr.f__succ;
		return t_data;
	}
}
internal function bb_treelight_GenerateTreeLight(t_tT:bb_tree_Tree):bb_treelight_TreeLight{
	var t_tL:bb_treelight_TreeLight=(new bb_treelight_TreeLight).g_TreeLight_new(t_tT);
	t_tL.f_Frame=((bb_random_Rnd2(0.0,6.0))|0);
	return t_tL;
}
internal function bb_math_Abs(t_x:int):int{
	if(t_x>=0){
		return t_x;
	}
	return -t_x;
}
internal function bb_math_Abs2(t_x:Number):Number{
	if(t_x>=0.0){
		return t_x;
	}
	return -t_x;
}
internal function bb_tree_GenerateTree(t_tScene:bb_scene_Scene):bb_tree_Tree{
	var t_tT:bb_tree_Tree=(new bb_tree_Tree).g_Tree_new(t_tScene);
	var t_posGood:Boolean=false;
	var t_tX:Number=.0;
	var t_tY:Number=.0;
	while(t_posGood==false){
		t_tX=bb_random_Rnd2(-8.0,(bb_scene_Scene.g_Width-8));
		t_tY=t_tScene.m_GetFloorYAtX(t_tX)-32.0;
		t_posGood=t_tScene.m_CheckRectAgainstScene(t_tX,t_tY,16.0,32.0);
	}
	t_tT.f_Frame=((bb_random_Rnd2(0.0,2.0))|0);
	t_tT.m_SetPos2(t_tX,t_tY);
	t_tT.f_BlinkRate=((bb_random_Rnd2(3.0,20.0))|0);
	var t_tLC:int=((bb_random_Rnd2(10.0,15.0))|0);
	for(var t_i:int=0;t_i<t_tLC;t_i=t_i+1){
		var t_tL:bb_treelight_TreeLight=bb_treelight_GenerateTreeLight(t_tT);
		var t_good:Boolean=false;
		var t_lX:Number=.0;
		var t_lY:Number=.0;
		while(t_good==false){
			t_lX=bb_random_Rnd2(-2.0,14.0);
			t_lY=bb_random_Rnd2(0.0,24.0);
			if(t_lY>16.0){
				t_good=true;
			}else{
				var t_dX:Number=bb_math_Abs2(8.0-t_lX);
				if(t_dX*1.5<=t_lY+1.0){
					t_good=true;
				}
			}
		}
		t_tL.m_SetPos2(t_tX+t_lX,t_tY+t_lY);
		t_tT.f_Lights.m_AddLast6(t_tL);
	}
	return t_tT;
}
class bb_snowmanhead_SnowmanHead extends Object{
	internal var f_snowman:bb_snowman_Snowman=null;
	internal var f_scene:bb_scene_Scene=null;
	internal var f_Frame:int=0;
	public function g_SnowmanHead_new(t_tSnowman:bb_snowman_Snowman):bb_snowmanhead_SnowmanHead{
		this.f_snowman=t_tSnowman;
		this.f_scene=t_tSnowman.f_scene;
		this.f_Frame=0;
		return this;
	}
	public function g_SnowmanHead_new2():bb_snowmanhead_SnowmanHead{
		return this;
	}
	internal var f_X:Number=.0;
	internal var f_Y:Number=.0;
	public function m_SetPos2(t_tX:Number,t_tY:Number):void{
		this.f_X=t_tX;
		this.f_Y=t_tY;
	}
	public function m_Render():void{
		bb_gfx_GFX.g_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,32,16,16);
	}
}
class bb_snowmanbody_SnowmanBody extends Object{
	internal var f_snowman:bb_snowman_Snowman=null;
	internal var f_scene:bb_scene_Scene=null;
	internal var f_Frame:int=0;
	public function g_SnowmanBody_new(t_tSnowman:bb_snowman_Snowman):bb_snowmanbody_SnowmanBody{
		this.f_snowman=t_tSnowman;
		this.f_scene=t_tSnowman.f_scene;
		this.f_Frame=0;
		return this;
	}
	public function g_SnowmanBody_new2():bb_snowmanbody_SnowmanBody{
		return this;
	}
	internal var f_X:Number=.0;
	internal var f_Y:Number=.0;
	public function m_SetPos2(t_tX:Number,t_tY:Number):void{
		this.f_X=t_tX;
		this.f_Y=t_tY;
	}
	public function m_Render():void{
		bb_gfx_GFX.g_Draw(((this.f_X)|0),((this.f_Y)|0),0+this.f_Frame*16,48,16,16);
	}
}
internal function bb_snowman_GenerateSnowman(t_tScene:bb_scene_Scene):bb_snowman_Snowman{
	var t_tS:bb_snowman_Snowman=(new bb_snowman_Snowman).g_Snowman_new(t_tScene);
	t_tS.f_head=(new bb_snowmanhead_SnowmanHead).g_SnowmanHead_new(t_tS);
	t_tS.f_body=(new bb_snowmanbody_SnowmanBody).g_SnowmanBody_new(t_tS);
	t_tS.f_head.f_Frame=0;
	t_tS.f_body.f_Frame=0;
	var t_posGood:int=0;
	var t_tX:Number=.0;
	var t_tY:Number=.0;
	while(t_posGood==0){
		t_tX=bb_random_Rnd2(-8.0,(bb_scene_Scene.g_Width-8));
		t_tY=t_tScene.m_GetFloorYAtX(t_tX);
		t_posGood=((t_tScene.m_CheckRectAgainstScene(t_tX,t_tY,16.0,32.0))?1:0);
	}
	t_tS.m_SetPos2(t_tX,t_tY);
	return t_tS;
}
internal function bb_scene_GenerateScene():bb_scene_Scene{
	var t_tS:bb_scene_Scene=(new bb_scene_Scene).g_Scene_new();
	t_tS.f_FloorStartY=bb_random_Rnd2((bb_scene_Scene.g_Height-64),(bb_scene_Scene.g_Height)*0.9);
	var t_fY:Number=t_tS.f_FloorStartY;
	t_tS.f_FloorHFlux=bb_random_Rnd2(1.0,2.0);
	t_tS.f_FloorVFlux=bb_random_Rnd2(5.0,6.0);
	for(var t_i:int=0;t_i<t_tS.f_FloorSegmentCount;t_i=t_i+1){
		var t_fX:int=t_i*bb_floorsegment_FloorSegment.g_Width;
		t_tS.f_FloorSegments[t_i].m_SetPos(t_fX,((t_fY)|0));
		t_fY=t_tS.f_FloorStartY+Math.sin(((t_fX)*t_tS.f_FloorHFlux)*D2R)*t_tS.f_FloorVFlux;
	}
	t_tS.f_moon.m_Set(bb_random_Rnd2(-32.0,(bb_scene_Scene.g_Width-32)),bb_random_Rnd2(-32.0,(bb_scene_Scene.g_Height)*0.33),((bb_random_Rnd2(0.0,4.0))|0));
	var t_tSC:int=((bb_random_Rnd2(20.0,80.0))|0);
	for(var t_i2:int=0;t_i2<t_tSC;t_i2=t_i2+1){
		var t_tStar:bb_star_Star=(new bb_star_Star).g_Star_new(t_tS);
		t_tStar.m_SetPos2(bb_random_Rnd2(0.0,(bb_scene_Scene.g_Width)),bb_random_Rnd2(0.0,(bb_scene_Scene.g_Height)));
		t_tStar.f_alpha=bb_random_Rnd2(0.5,1.0);
		t_tS.f_Stars.m_AddLast3(t_tStar);
	}
	t_tSC=1;
	for(var t_i3:int=0;t_i3<t_tSC;t_i3=t_i3+1){
		var t_tH:bb_house_House=(new bb_house_House).g_House_new(t_tS);
		var t_tX:int=((bb_random_Rnd2(8.0,(bb_scene_Scene.g_Width-48)))|0);
		var t_tY:Number=t_tS.m_GetFloorYAtX(t_tX);
		t_tH.m_SetPos2((t_tX),t_tY-46.0);
		t_tS.f_Houses.m_AddLast2(t_tH);
	}
	t_tSC=((bb_random_Rnd2(1.0,5.0))|0);
	for(var t_i4:int=0;t_i4<t_tSC;t_i4=t_i4+1){
		t_tS.f_Trees.m_AddLast(bb_tree_GenerateTree(t_tS));
	}
	t_tSC=1;
	for(var t_i5:int=0;t_i5<t_tSC;t_i5=t_i5+1){
		t_tS.f_Snowmen.m_AddLast4(bb_snowman_GenerateSnowman(t_tS));
	}
	return t_tS;
}
internal function bb_audio_PlayMusic(t_path:String,t_flags:int):int{
	return bb_audio_device.PlayMusic(bb_data_FixDataPath(t_path),t_flags);
}
internal function bb_input_KeyHit(t_key:int):int{
	return bb_input_device.KeyHit(t_key);
}
class bb_list_Enumerator4 extends Object{
	internal var f__list:bb_list_List6=null;
	internal var f__curr:bb_list_Node6=null;
	public function g_Enumerator_new(t_list:bb_list_List6):bb_list_Enumerator4{
		this.f__list=t_list;
		this.f__curr=t_list.f__head.f__succ;
		return this;
	}
	public function g_Enumerator_new2():bb_list_Enumerator4{
		return this;
	}
	public function m_HasNext():Boolean{
		while(this.f__curr.f__succ.f__pred!=this.f__curr){
			this.f__curr=this.f__curr.f__succ;
		}
		return this.f__curr!=this.f__list.f__head;
	}
	public function m_NextObject():bb_treelight_TreeLight{
		var t_data:bb_treelight_TreeLight=this.f__curr.f__data;
		this.f__curr=this.f__curr.f__succ;
		return t_data;
	}
}
class bb_list_Enumerator5 extends Object{
	internal var f__list:bb_list_List3=null;
	internal var f__curr:bb_list_Node3=null;
	public function g_Enumerator_new(t_list:bb_list_List3):bb_list_Enumerator5{
		this.f__list=t_list;
		this.f__curr=t_list.f__head.f__succ;
		return this;
	}
	public function g_Enumerator_new2():bb_list_Enumerator5{
		return this;
	}
	public function m_HasNext():Boolean{
		while(this.f__curr.f__succ.f__pred!=this.f__curr){
			this.f__curr=this.f__curr.f__succ;
		}
		return this.f__curr!=this.f__list.f__head;
	}
	public function m_NextObject():bb_star_Star{
		var t_data:bb_star_Star=this.f__curr.f__data;
		this.f__curr=this.f__curr.f__succ;
		return t_data;
	}
}
internal function bb_math_Clamp(t_n:int,t_min:int,t_max:int):int{
	if(t_n<t_min){
		return t_min;
	}
	if(t_n>t_max){
		return t_max;
	}
	return t_n;
}
internal function bb_math_Clamp2(t_n:Number,t_min:Number,t_max:Number):Number{
	if(t_n<t_min){
		return t_min;
	}
	if(t_n>t_max){
		return t_max;
	}
	return t_n;
}
class bb_list_Enumerator6 extends Object{
	internal var f__list:bb_list_List5=null;
	internal var f__curr:bb_list_Node5=null;
	public function g_Enumerator_new(t_list:bb_list_List5):bb_list_Enumerator6{
		this.f__list=t_list;
		this.f__curr=t_list.f__head.f__succ;
		return this;
	}
	public function g_Enumerator_new2():bb_list_Enumerator6{
		return this;
	}
	public function m_HasNext():Boolean{
		while(this.f__curr.f__succ.f__pred!=this.f__curr){
			this.f__curr=this.f__curr.f__succ;
		}
		return this.f__curr!=this.f__list.f__head;
	}
	public function m_NextObject():bb_snowflake_Snowflake{
		var t_data:bb_snowflake_Snowflake=this.f__curr.f__data;
		this.f__curr=this.f__curr.f__succ;
		return t_data;
	}
}
internal function bb_math_Max(t_x:int,t_y:int):int{
	if(t_x>t_y){
		return t_x;
	}
	return t_y;
}
internal function bb_math_Max2(t_x:Number,t_y:Number):Number{
	if(t_x>t_y){
		return t_x;
	}
	return t_y;
}
internal function bb_math_Min(t_x:int,t_y:int):int{
	if(t_x<t_y){
		return t_x;
	}
	return t_y;
}
internal function bb_math_Min2(t_x:Number,t_y:Number):Number{
	if(t_x<t_y){
		return t_x;
	}
	return t_y;
}
internal function bb_graphics_Cls(t_r:Number,t_g:Number,t_b:Number):int{
	bb_graphics_renderDevice.Cls(t_r,t_g,t_b);
	return 0;
}
internal function bb_graphics_Transform(t_ix:Number,t_iy:Number,t_jx:Number,t_jy:Number,t_tx:Number,t_ty:Number):int{
	var t_ix2:Number=t_ix*bb_graphics_context.f_ix+t_iy*bb_graphics_context.f_jx;
	var t_iy2:Number=t_ix*bb_graphics_context.f_iy+t_iy*bb_graphics_context.f_jy;
	var t_jx2:Number=t_jx*bb_graphics_context.f_ix+t_jy*bb_graphics_context.f_jx;
	var t_jy2:Number=t_jx*bb_graphics_context.f_iy+t_jy*bb_graphics_context.f_jy;
	var t_tx2:Number=t_tx*bb_graphics_context.f_ix+t_ty*bb_graphics_context.f_jx+bb_graphics_context.f_tx;
	var t_ty2:Number=t_tx*bb_graphics_context.f_iy+t_ty*bb_graphics_context.f_jy+bb_graphics_context.f_ty;
	bb_graphics_SetMatrix(t_ix2,t_iy2,t_jx2,t_jy2,t_tx2,t_ty2);
	return 0;
}
internal function bb_graphics_Transform2(t_m:Array):int{
	bb_graphics_Transform(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
	return 0;
}
internal function bb_graphics_Scale(t_x:Number,t_y:Number):int{
	bb_graphics_Transform(t_x,0.0,0.0,t_y,0.0,0.0);
	return 0;
}
internal function bb_graphics_Translate(t_x:Number,t_y:Number):int{
	bb_graphics_Transform(1.0,0.0,0.0,1.0,t_x,t_y);
	return 0;
}
internal function bb_autofit_UpdateVirtualDisplay(t_zoomborders:Boolean,t_keepborders:Boolean):int{
	bb_autofit_VirtualDisplay.g_Display.m_UpdateVirtualDisplay(t_zoomborders,t_keepborders);
	return 0;
}
internal function bb_graphics_PushMatrix():int{
	var t_sp:int=bb_graphics_context.f_matrixSp;
	bb_graphics_context.f_matrixStack[t_sp+0]=bb_graphics_context.f_ix;
	bb_graphics_context.f_matrixStack[t_sp+1]=bb_graphics_context.f_iy;
	bb_graphics_context.f_matrixStack[t_sp+2]=bb_graphics_context.f_jx;
	bb_graphics_context.f_matrixStack[t_sp+3]=bb_graphics_context.f_jy;
	bb_graphics_context.f_matrixStack[t_sp+4]=bb_graphics_context.f_tx;
	bb_graphics_context.f_matrixStack[t_sp+5]=bb_graphics_context.f_ty;
	bb_graphics_context.f_matrixSp=t_sp+6;
	return 0;
}
internal function bb_graphics_PopMatrix():int{
	var t_sp:int=bb_graphics_context.f_matrixSp-6;
	bb_graphics_SetMatrix(bb_graphics_context.f_matrixStack[t_sp+0],bb_graphics_context.f_matrixStack[t_sp+1],bb_graphics_context.f_matrixStack[t_sp+2],bb_graphics_context.f_matrixStack[t_sp+3],bb_graphics_context.f_matrixStack[t_sp+4],bb_graphics_context.f_matrixStack[t_sp+5]);
	bb_graphics_context.f_matrixSp=t_sp;
	return 0;
}
internal function bb_graphics_DrawImage(t_image:bb_graphics_Image,t_x:Number,t_y:Number,t_frame:int):int{
	var t_f:bb_graphics_Frame=t_image.f_frames[t_frame];
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
internal function bb_graphics_Rotate(t_angle:Number):int{
	bb_graphics_Transform(Math.cos((t_angle)*D2R),-Math.sin((t_angle)*D2R),Math.sin((t_angle)*D2R),Math.cos((t_angle)*D2R),0.0,0.0);
	return 0;
}
internal function bb_graphics_DrawImage2(t_image:bb_graphics_Image,t_x:Number,t_y:Number,t_rotation:Number,t_scaleX:Number,t_scaleY:Number,t_frame:int):int{
	var t_f:bb_graphics_Frame=t_image.f_frames[t_frame];
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
internal function bb_graphics_DrawImageRect(t_image:bb_graphics_Image,t_x:Number,t_y:Number,t_srcX:int,t_srcY:int,t_srcWidth:int,t_srcHeight:int,t_frame:int):int{
	var t_f:bb_graphics_Frame=t_image.f_frames[t_frame];
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
internal function bb_graphics_DrawImageRect2(t_image:bb_graphics_Image,t_x:Number,t_y:Number,t_srcX:int,t_srcY:int,t_srcWidth:int,t_srcHeight:int,t_rotation:Number,t_scaleX:Number,t_scaleY:Number,t_frame:int):int{
	var t_f:bb_graphics_Frame=t_image.f_frames[t_frame];
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
function bbInit():void{
	bb_graphics_device=null;
	bb_input_device=null;
	bb_audio_device=null;
	bb_app_device=null;
	bb_graphics_context=(new bb_graphics_GraphicsContext).g_GraphicsContext_new();
	bb_graphics_Image.g_DefaultFlags=0;
	bb_graphics_renderDevice=null;
	bb_random_Seed=1234;
	bb_gfx_GFX.g_Tileset=null;
	bb_scene_Scene.g_Background=null;
	bb_sfx_SFX.g_ActiveChannel=0;
	bb_sfx_SFX.g_Sounds=null;
	bb_sfx_SFX.g_Musics=null;
	bb_sfx_SFX.g_SoundFileAppendix=".wav";
	bb_autofit_VirtualDisplay.g_Display=null;
	bb_scene_Scene.g_Width=360;
	bb_floorsegment_FloorSegment.g_Width=8;
	bb_scene_Scene.g_Height=240;
}
//${TRANSCODE_END}
