
//Enable this ONLY if you upgrade the Windows Phone project to 7.1!
//#define MANGO

using System;
using System.IO;
using System.IO.IsolatedStorage;
using System.Collections;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Globalization;
using System.Threading;
using System.Diagnostics;

using Microsoft.Xna.Framework;
using Microsoft.Xna.Framework.Audio;
using Microsoft.Xna.Framework.Content;
using Microsoft.Xna.Framework.Graphics;
using Microsoft.Xna.Framework.Input;
using Microsoft.Xna.Framework.Media;

#if WINDOWS_PHONE
using Microsoft.Devices.Sensors;
using Microsoft.Xna.Framework.Input.Touch;
#endif

public class MonkeyConfig{
//${CONFIG_BEGIN}
public const String BINARY_FILES="*.bin|*.dat";
public const String CD="";
public const String CONFIG="release";
public const String HOST="winnt";
public const String IMAGE_FILES="*.png|*.jpg";
public const String LANG="cs";
public const String MODPATH=".;C:/Users/Chris/Documents/GitHub/CM-XMAS-2012;C:/apps/MonkeyPro66/modules";
public const String MOJO_AUTO_SUSPEND_ENABLED="0";
public const String MOJO_BACKBUFFER_ACCESS_ENABLED="1";
public const String MOJO_IMAGE_FILTERING_ENABLED="1";
public const String MUSIC_FILES="*.mp3|*.wma";
public const String SAFEMODE="0";
public const String SOUND_FILES="*.wav";
public const String TARGET="xna";
public const String TEXT_FILES="*.txt|*.xml|*.json";
public const String TRANSDIR="";
public const String XNA_ACCELEROMETER_ENABLED="1";
public const String XNA_VSYNC_ENABLED="0";
public const String XNA_WINDOW_FULLSCREEN="0";
public const String XNA_WINDOW_FULLSCREEN_PHONE="1";
public const String XNA_WINDOW_FULLSCREEN_XBOX="1";
public const String XNA_WINDOW_HEIGHT="480";
public const String XNA_WINDOW_HEIGHT_PHONE="800";
public const String XNA_WINDOW_HEIGHT_XBOX="480";
public const String XNA_WINDOW_RESIZABLE="0";
public const String XNA_WINDOW_WIDTH="640";
public const String XNA_WINDOW_WIDTH_PHONE="480";
public const String XNA_WINDOW_WIDTH_XBOX="640";
//${CONFIG_END}
}

public class MonkeyData{

	public static FileStream OpenFile( String path,FileMode mode ){
		if( path.StartsWith("monkey://internal/") ){
#if WINDOWS
			IsolatedStorageFile file=IsolatedStorageFile.GetUserStoreForAssembly();
#else
			IsolatedStorageFile file=IsolatedStorageFile.GetUserStoreForApplication();
#endif
			if( file==null ) return null;
			
			IsolatedStorageFileStream stream=file.OpenFile( path.Substring(18),mode );
			
			return stream;
		}
		return null;
	}

	public static String ContentPath( String path ){
		if( path.StartsWith("monkey://data/") ) return "Content/monkey/"+path.Substring(14);
		return "";
	}

	public static byte[] loadBytes( String path ){
		path=ContentPath( path );
		if( path=="" ) return null;
        try{
			Stream stream=TitleContainer.OpenStream( path );
			int len=(int)stream.Length;
			byte[] buf=new byte[len];
			int n=stream.Read( buf,0,len );
			stream.Close();
			if( n==len ) return buf;
		}catch( Exception ){
		}
		return null;
	}
	
	public static String LoadString( String path ){
		path=ContentPath( path );
		if( path=="" ) return "";
        try{
			Stream stream=TitleContainer.OpenStream( path );
			StreamReader reader=new StreamReader( stream );
			String text=reader.ReadToEnd();
			reader.Close();
			return text;
		}catch( Exception ){
		}
		return "";
	}
	
	public static Texture2D LoadTexture2D( String path,ContentManager content ){
		path=ContentPath( path );
		if( path=="" ) return null;
		try{
			return content.Load<Texture2D>( path );
		}catch( Exception ){
		}
		return null;
	}

	public static SoundEffect LoadSoundEffect( String path,ContentManager content ){
		path=ContentPath( path );
		if( path=="" ) return null;
		try{
			return content.Load<SoundEffect>( path );
		}catch( Exception ){
		}
		return null;
	}
	
	public static Song LoadSong( String path,ContentManager content ){
		path=ContentPath( path );
		if( path=="" ) return null;
		try{
			return content.Load<Song>( path );
		}catch( Exception ){
		}
		return null;
	}
	
};

//${TRANSCODE_BEGIN}

// C# Monkey runtime.
//
// Placed into the public domain 24/02/2011.
// No warranty implied; use at your own risk.

//using System;
//using System.Collections;

public class bb_std_lang{

	public static String errInfo="";
	public static List<String> errStack=new List<String>();
	
	public const float D2R=0.017453292519943295f;
	public const float R2D=57.29577951308232f;
	
	public static void pushErr(){
		errStack.Add( errInfo );
	}
	
	public static void popErr(){
		errInfo=errStack[ errStack.Count-1 ];
		errStack.RemoveAt( errStack.Count-1 );
	}

	public static String StackTrace(){
		if( errInfo.Length==0 ) return "";
		String str=errInfo+"\n";
		for( int i=errStack.Count-1;i>0;--i ){
			str+=errStack[i]+"\n";
		}
		return str;
	}
	
	public static int Print( String str ){
		Console.WriteLine( str );
		return 0;
	}
	
	public static int Error( String str ){
		throw new Exception( str );
	}
	
	public static int DebugLog( String str ){
		Print( str );
		return 0;
	}
	
	public static int DebugStop(){
		Error( "STOP" );
		return 0;
	}
	
	public static void PrintError( String err ){
		if( err.Length==0 ) return;
		Print( "Monkey Runtime Error : "+err );
		Print( "" );
		Print( StackTrace() );
	}
	
	//***** String stuff *****
	
	static public String[] stringArray( int n ){
		String[] t=new String[n];
		for( int i=0;i<n;++i ) t[i]="";
		return t;
	}
	
	static public String slice( String str,int from ){
		return slice( str,from,str.Length );
	}
	
	static public String slice( String str,int from,int term ){
		int len=str.Length;
		if( from<0 ){
			from+=len;
			if( from<0 ) from=0;
		}else if( from>len ){
			from=len;
		}
		if( term<0 ){
			term+=len;
		}else if( term>len ){
			term=len;
		}
		if( term>from ) return str.Substring( from,term-from );
		return "";
	}

	static public String[] split( String str,String sep ){
		if( sep.Length==0 ){
			String[] bits=new String[str.Length];
			for( int i=0;i<str.Length;++i ){
				bits[i]=new String( str[i],1 );
			}
			return bits;
		}else{
			int i=0,i2,n=1;
			while( (i2=str.IndexOf( sep,i ))!=-1 ){
				++n;
				i=i2+sep.Length;
			}
			String[] bits=new String[n];
			i=0;
			for( int j=0;j<n;++j ){
				i2=str.IndexOf( sep,i );
				if( i2==-1 ) i2=str.Length;
				bits[j]=slice( str,i,i2 );
				i=i2+sep.Length;
			}
			return bits;
		}
	}
	
	static public String fromChars( int[] chars ){
		int n=chars.Length;
		char[] chrs=new char[n];
		for( int i=0;i<n;++i ){
			chrs[i]=(char)chars[i];
		}
		return new String( chrs,0,n );
	}
	
	//***** Array stuff *****
	
	static public Array slice( Array arr,int from ){
		return slice( arr,from,arr.Length );
	}
	
	static public Array slice( Array arr,int from,int term ){
		int len=arr.Length;
		if( from<0 ){
			from+=len;
			if( from<0 ) from=0;
		}else if( from>len ){
			from=len;
		}
		if( term<0 ){
			term+=len;
		}else if( term>len ){
			term=len;
		}
		if( term<from ) term=from;
		int newlen=term-from;
		Array res=Array.CreateInstance( arr.GetType().GetElementType(),newlen );
		if( newlen>0 ) Array.Copy( arr,from,res,0,newlen );
		return res;
	}

	static public Array resizeArray( Array arr,int len ){
		Type ty=arr.GetType().GetElementType();
		Array res=Array.CreateInstance( ty,len );
		int n=Math.Min( arr.Length,len );
		if( n>0 ) Array.Copy( arr,res,n );
		return res;
   }

	static public Array[] resizeArrayArray( Array[] arr,int len ){
		int i=arr.Length;
		arr=(Array[])resizeArray( arr,len );
		if( i<len ){
			Array empty=Array.CreateInstance( arr.GetType().GetElementType().GetElementType(),0 );
			while( i<len ) arr[i++]=empty;
		}
		return arr;
	}

	static public String[] resizeStringArray( String[] arr,int len ){
		int i=arr.Length;
		arr=(String[])resizeArray( arr,len );
		while( i<len ) arr[i++]="";
		return arr;
	}
	
	static public Array concat( Array lhs,Array rhs ){
		Array res=Array.CreateInstance( lhs.GetType().GetElementType(),lhs.Length+rhs.Length );
		Array.Copy( lhs,0,res,0,lhs.Length );
		Array.Copy( rhs,0,res,lhs.Length,rhs.Length );
		return res;
	}
	
	static public int length( Array arr ){
		return arr!=null ? arr.Length : 0;
	}
	
	static public int[] toChars( String str ){
		int[] arr=new int[str.Length];
		for( int i=0;i<str.Length;++i ) arr[i]=(int)str[i];
		return arr;
	}
}

class ThrowableObject : Exception{
	public ThrowableObject() : base( "Uncaught Monkey Exception" ){
	}
};

public class BBDataBuffer{

    public byte[] _data;
    public int _length;
    
    public BBDataBuffer(){
    }

    public BBDataBuffer( int length ){
    	_data=new byte[length];
    	_length=length;
    }
    
    public BBDataBuffer( byte[] data ){
    	_data=data;
    	_length=data.Length;
    }
    
    public bool _New( int length ){
    	if( _data!=null ) return false;
    	_data=new byte[length];
    	_length=length;
    	return true;
    }
    
    public bool _Load( String path ){
    	if( _data!=null ) return false;
    	
    	_data=MonkeyData.loadBytes( path );
    	if( _data==null ) return false;
    	
    	_length=_data.Length;
    	return true;
    }
    
    public void Discard(){
    	if( _data!=null ){
    		_data=null;
    		_length=0;
    	}
    }
    
  	public int Length(){
  		return _length;
  	}

	public void PokeByte( int addr,int value ){
		_data[addr]=(byte)value;
	}

	public void PokeShort( int addr,int value ){
		Array.Copy( System.BitConverter.GetBytes( (short)value ),0,_data,addr,2 );
	}

	public void PokeInt( int addr,int value ){
		Array.Copy( System.BitConverter.GetBytes( value ),0,_data,addr,4 );
	}

	public void PokeFloat( int addr,float value ){
		Array.Copy( System.BitConverter.GetBytes( value ),0,_data,addr,4 );
	}

	public int PeekByte( int addr ){
		return (int)(sbyte)_data[addr];
	}

	public int PeekShort( int addr ){
		return (int)System.BitConverter.ToInt16( _data,addr );
	}

	public int PeekInt( int addr ){
		return System.BitConverter.ToInt32( _data,addr );
	}

	public float PeekFloat( int addr ){
		return (float)System.BitConverter.ToSingle( _data,addr );
	}
}
// XNA mojo runtime.
//
// Copyright 2011 Mark Sibly, all rights reserved.
// No warranty implied; use at your own risk.

public class gxtkGame : Game{

	public gxtkApp app;
	
	public GraphicsDeviceManager deviceManager;
	
	public bool activated,autoSuspend;

	public gxtkGame(){
	
		gxtkApp.game=this;
	
		deviceManager=new GraphicsDeviceManager( this );
		
		deviceManager.PreparingDeviceSettings+=new EventHandler<PreparingDeviceSettingsEventArgs>( PreparingDeviceSettings );
		
#if WINDOWS
		deviceManager.IsFullScreen=MonkeyConfig.XNA_WINDOW_FULLSCREEN=="1";
		deviceManager.PreferredBackBufferWidth=int.Parse( MonkeyConfig.XNA_WINDOW_WIDTH );
		deviceManager.PreferredBackBufferHeight=int.Parse( MonkeyConfig.XNA_WINDOW_HEIGHT );
		Window.AllowUserResizing=MonkeyConfig.XNA_WINDOW_RESIZABLE=="1";
#elif XBOX
		deviceManager.IsFullScreen=MonkeyConfig.XNA_WINDOW_FULLSCREEN_XBOX=="1";
		deviceManager.PreferredBackBufferWidth=int.Parse( MonkeyConfig.XNA_WINDOW_WIDTH_XBOX );
		deviceManager.PreferredBackBufferHeight=int.Parse( MonkeyConfig.XNA_WINDOW_HEIGHT_XBOX );
#elif WINDOWS_PHONE
		deviceManager.IsFullScreen=MonkeyConfig.XNA_WINDOW_FULLSCREEN_PHONE=="1";
		deviceManager.PreferredBackBufferWidth=int.Parse( MonkeyConfig.XNA_WINDOW_WIDTH_PHONE );
		deviceManager.PreferredBackBufferHeight=int.Parse( MonkeyConfig.XNA_WINDOW_HEIGHT_PHONE );
#endif
		IsMouseVisible=true;

		autoSuspend=MonkeyConfig.MOJO_AUTO_SUSPEND_ENABLED=="1";
	}
	
	void PreparingDeviceSettings( Object sender,PreparingDeviceSettingsEventArgs e ){
		if( MonkeyConfig.XNA_VSYNC_ENABLED=="1" ){
			PresentationParameters pp=e.GraphicsDeviceInformation.PresentationParameters;
			pp.PresentationInterval=PresentInterval.One;
		}
	}
	
	void CheckActive(){
		//wait for first activation		
		if( !activated ){
			activated=IsActive;
			return;
		}
		
		if( autoSuspend ){
			if( IsActive ){
				app.InvokeOnResume();
			}else{
				app.InvokeOnSuspend();
			}
		}else{
			if( Window.ClientBounds.Width>0 && Window.ClientBounds.Height>0 ){
				app.InvokeOnResume();
			}else{
				app.InvokeOnSuspend();
			}
		}
	}

	protected override void LoadContent(){
		try{

			bb_.bbInit();
			bb_.bbMain();
			
			if( app!=null ) app.InvokeOnCreate();
			
		}catch( Exception ex ){
			Die( ex );
		}
	}
	
	protected override void Update( GameTime gameTime ){
		if( app==null ) return;
		
		CheckActive();
		
		app.Update( gameTime );

		base.Update( gameTime );
	}
	
	protected override bool BeginDraw(){
		return app!=null && !app.suspended && base.BeginDraw();
	}

	protected override void Draw( GameTime gameTime ){
		if( app==null ) return;
		
		CheckActive();
		
		app.Draw( gameTime );

		base.Draw( gameTime );
	}
	
#if !WINDOWS_PHONE
	public static void Main(){
		new gxtkGame().Run();
	}
#endif
	
	public void Die( Exception ex ){
		bb_std_lang.PrintError( ex.Message );
		Exit();
	}
}

public class gxtkApp{

	public static gxtkGame game;

	public gxtkGraphics graphics;
	public gxtkInput input;
	public gxtkAudio audio;
	
	public int updateRate;
	public double nextUpdate;
	public double updatePeriod;
	
#if WINDOWS	
	public Stopwatch stopwatch;
#else	
	public int tickcount;
#endif
	
	public bool suspended;
	
	public gxtkApp(){

		game.app=this;

		graphics=new gxtkGraphics();
		input=new gxtkInput();
		audio=new gxtkAudio();
		
		game.TargetElapsedTime=TimeSpan.FromSeconds( 1.0/10.0 );

#if WINDOWS
		stopwatch=Stopwatch.StartNew();
#else		
		tickcount=System.Environment.TickCount;
#endif
	}

	public void Die( Exception ex ){
		game.Die( ex );
	}
	
	public void Update( GameTime gameTime ){
	
		int updates=0;
		
		for(;;){
		
			nextUpdate+=updatePeriod;
			
			InvokeOnUpdate();
			
			if( !game.IsFixedTimeStep || updateRate==0 ) break;
			
			if( nextUpdate>(double)game.app.MilliSecs() ) break;
			
			if( ++updates==8 ){
				nextUpdate=(double)MilliSecs();
				break;
			}
		}
	}

	public void Draw( GameTime gameTime ){
		InvokeOnRender();
	}
	
	public void InvokeOnCreate(){
		try{
			OnCreate();
		}catch( Exception ex ){
			Die( ex );
		}
	}

	public void InvokeOnUpdate(){
		if( suspended || updateRate==0 ) return;
		
		try{
			input.BeginUpdate();
			OnUpdate();
			input.EndUpdate();
		}catch( Exception ex ){
			Die( ex );
		}
	}

	public void InvokeOnRender(){
		if( suspended ) return;
		
		try{
			graphics.BeginRender();
			OnRender();
			graphics.EndRender();
		}catch( Exception ex ){
			Die( ex );
		}
	}

	public void InvokeOnSuspend(){
		if( suspended ) return;
		
		try{
			suspended=true;
			OnSuspend();
			audio.OnSuspend();
		}catch( Exception ex ){
			Die( ex );
		}
	}

	public void InvokeOnResume(){
		if( !suspended ) return;
		
		try{
			audio.OnResume();
			OnResume();
			suspended=false;
		}catch( Exception ex ){
			Die( ex );
		}
	}

	//***** GXTK API *****
	
	public virtual gxtkGraphics GraphicsDevice(){
		return graphics;
	}
	
	public virtual gxtkInput InputDevice(){
		return input;
	}
	
	public virtual gxtkAudio AudioDevice(){
		return audio;
	}

	public virtual String AppTitle(){
		return "gxtkApp";
	}
	
	public virtual String LoadState(){
#if WINDOWS
		IsolatedStorageFile file=IsolatedStorageFile.GetUserStoreForAssembly();
#else
		IsolatedStorageFile file=IsolatedStorageFile.GetUserStoreForApplication();
#endif
		if( file==null ) return "";
		
		IsolatedStorageFileStream stream=file.OpenFile( ".mojostate",FileMode.OpenOrCreate );
		if( stream==null ){
			return "";
		}

		StreamReader reader=new StreamReader( stream );
		String state=reader.ReadToEnd();
		reader.Close();
		
		return state;
	}
	
	public virtual int SaveState( String state ){
#if WINDOWS
		IsolatedStorageFile file=IsolatedStorageFile.GetUserStoreForAssembly();
#else
		IsolatedStorageFile file=IsolatedStorageFile.GetUserStoreForApplication();
#endif
		if( file==null ) return -1;
		
		IsolatedStorageFileStream stream=file.OpenFile( ".mojostate",FileMode.Create );
		if( stream==null ){
			return -1;
		}

		StreamWriter writer=new StreamWriter( stream );
		writer.Write( state );
		writer.Close();
		
		return 0;
	}
	
	public virtual String LoadString( String path ){
		return MonkeyData.LoadString( path );
	}
	
	public virtual int SetUpdateRate( int hertz ){
		updateRate=hertz;

		if( updateRate!=0 ){

			updatePeriod=1000.0/(double)hertz;
			nextUpdate=(double)MilliSecs()+updatePeriod;

			game.TargetElapsedTime=TimeSpan.FromTicks( (long)(10000000.0/(double)hertz+.5) );

			game.IsFixedTimeStep=(MonkeyConfig.XNA_VSYNC_ENABLED!="1");

		}else{
		
			game.TargetElapsedTime=TimeSpan.FromSeconds( 1.0/10.0 );
			
		}
		return 0;
	}
	
	public virtual int MilliSecs(){
#if WINDOWS	
		return  (int)stopwatch.ElapsedMilliseconds;
#else
		return System.Environment.TickCount-tickcount;
#endif
	}

	public virtual int Loading(){
		return 0;
	}

	public virtual int OnCreate(){
		return 0;
	}

	public virtual int OnSuspend(){
		return 0;
	}

	public virtual int OnResume(){
		return 0;
	}

	public virtual int OnUpdate(){
		return 0;
	}

	public virtual int OnRender(){
		return 0;
	}

	public virtual int OnLoading(){
		return 0;
	}
}

public class gxtkGraphics{

	public const int MAX_VERTS=1024;
	public const int MAX_LINES=MAX_VERTS/2;
	public const int MAX_QUADS=MAX_VERTS/4;

	public GraphicsDevice device;
	
	RenderTarget2D renderTarget;
	
	RasterizerState rstateScissor;
	Rectangle scissorRect;
	
	BasicEffect effect;
	
	int primType;
	int primCount;
	Texture2D primTex;

	VertexPositionColorTexture[] vertices;
	Int16[] quadIndices;
	Int16[] fanIndices;

	Color color;
	
	BlendState defaultBlend;
	BlendState additiveBlend;
	
	bool tformed=false;
	float ix,iy,jx,jy,tx,ty;
	
	public gxtkGraphics(){
	
		device=gxtkApp.game.GraphicsDevice;
		
		effect=new BasicEffect( device );
		effect.VertexColorEnabled=true;

		vertices=new VertexPositionColorTexture[ MAX_VERTS ];
		for( int i=0;i<MAX_VERTS;++i ){
			vertices[i]=new VertexPositionColorTexture();
		}
		
		quadIndices=new Int16[ MAX_QUADS * 6 ];
		for( int i=0;i<MAX_QUADS;++i ){
			quadIndices[i*6  ]=(short)(i*4);
			quadIndices[i*6+1]=(short)(i*4+1);
			quadIndices[i*6+2]=(short)(i*4+2);
			quadIndices[i*6+3]=(short)(i*4);
			quadIndices[i*6+4]=(short)(i*4+2);
			quadIndices[i*6+5]=(short)(i*4+3);
		}
		
		fanIndices=new Int16[ MAX_VERTS * 3 ];
		for( int i=0;i<MAX_VERTS;++i ){
			fanIndices[i*3  ]=(short)(0);
			fanIndices[i*3+1]=(short)(i+1);
			fanIndices[i*3+2]=(short)(i+2);
		}

		rstateScissor=new RasterizerState();
		rstateScissor.CullMode=CullMode.None;
		rstateScissor.ScissorTestEnable=true;
		
		defaultBlend=BlendState.NonPremultiplied;
		
		//note: ColorSourceBlend must == AlphaSourceBlend in Reach profile!
		additiveBlend=new BlendState();
		additiveBlend.ColorBlendFunction=BlendFunction.Add;
		additiveBlend.ColorSourceBlend=Blend.SourceAlpha;
		additiveBlend.AlphaSourceBlend=Blend.SourceAlpha;
		additiveBlend.ColorDestinationBlend=Blend.One;
		additiveBlend.AlphaDestinationBlend=Blend.One;
	}

	public void BeginRender(){
	
		device.RasterizerState=RasterizerState.CullNone;
		device.DepthStencilState=DepthStencilState.None;
		device.BlendState=BlendState.NonPremultiplied;
		
		if( MonkeyConfig.MOJO_IMAGE_FILTERING_ENABLED=="1" ){
			device.SamplerStates[0]=SamplerState.LinearClamp;
		}else{
			device.SamplerStates[0]=SamplerState.PointClamp;
		}
		
		if( MonkeyConfig.MOJO_BACKBUFFER_ACCESS_ENABLED=="1" ){
			if( renderTarget!=null && (renderTarget.Width!=Width() || renderTarget.Height!=Height()) ){
				renderTarget.Dispose();
				renderTarget=null;
			}
			if( renderTarget==null ){
				renderTarget=new RenderTarget2D( device,Width(),Height() );
			}
		}
		device.SetRenderTarget( renderTarget );
		
		effect.Projection=Matrix.CreateOrthographicOffCenter( +.5f,Width()+.5f,Height()+.5f,+.5f,0,1 );

		primCount=0;
	}

	public void EndRender(){
		Flush();
		
		if( renderTarget==null ) return;
		
		device.SetRenderTarget( null );
		
		device.BlendState=BlendState.Opaque;
		
		primType=4;
		primTex=renderTarget;
		
		float x=0,y=0;
		float w=Width();
		float h=Height();
		float u0=0,u1=1,v0=0,v1=1;
		float x0=x,x1=x+w,x2=x+w,x3=x;
		float y0=y,y1=y,y2=y+h,y3=y+h;
		
		Color color=Color.White;

		int vp=primCount++*4;
		vertices[vp  ].Position.X=x0;vertices[vp  ].Position.Y=y0;
		vertices[vp  ].TextureCoordinate.X=u0;vertices[vp  ].TextureCoordinate.Y=v0;
		vertices[vp  ].Color=color;
		vertices[vp+1].Position.X=x1;vertices[vp+1].Position.Y=y1;
		vertices[vp+1].TextureCoordinate.X=u1;vertices[vp+1].TextureCoordinate.Y=v0;
		vertices[vp+1 ].Color=color;
		vertices[vp+2].Position.X=x2;vertices[vp+2].Position.Y=y2;
		vertices[vp+2].TextureCoordinate.X=u1;vertices[vp+2].TextureCoordinate.Y=v1;
		vertices[vp+2].Color=color;
		vertices[vp+3].Position.X=x3;vertices[vp+3].Position.Y=y3;
		vertices[vp+3].TextureCoordinate.X=u0;vertices[vp+3].TextureCoordinate.Y=v1;
		vertices[vp+3].Color=color;
		
		Flush();
	}
	
	public void Flush(){
		if( primCount==0 ) return;
		
		if( primTex!=null ){
	        effect.TextureEnabled=true;
    	    effect.Texture=primTex;
		}else{
	        effect.TextureEnabled=false;
		}

        foreach( EffectPass pass in effect.CurrentTechnique.Passes ){
            pass.Apply();

            switch( primType ){
			case 2:	//lines
				device.DrawUserPrimitives<VertexPositionColorTexture>(
				PrimitiveType.LineList,
				vertices,0,primCount );
				break;
			case 4:	//quads
				device.DrawUserIndexedPrimitives<VertexPositionColorTexture>(
				PrimitiveType.TriangleList,
				vertices,0,primCount*4,
				quadIndices,0,primCount*2 );
				break;
			case 5:	//trifan
				device.DrawUserIndexedPrimitives<VertexPositionColorTexture>(
				PrimitiveType.TriangleList,
				vertices,0,primCount,
				fanIndices,0,primCount-2 );
				break;
            }
        }
		primCount=0;
	}
	
	//***** GXTK API *****
	
	public virtual int Mode(){
		return 1;
	}
	
	public virtual int Width(){
		return device.PresentationParameters.BackBufferWidth;
	}
	
	public virtual int Height(){
		return device.PresentationParameters.BackBufferHeight;
	}
	
	public virtual int Loaded(){
		return 1;
	}
	
	public virtual gxtkSurface LoadSurface__UNSAFE__( gxtkSurface surface,String path ){
		Texture2D texture=MonkeyData.LoadTexture2D( path,gxtkApp.game.Content );
		if( texture==null ) return null;
		surface.SetTexture( texture );
		return surface;
	}
	
	public virtual gxtkSurface LoadSurface( String path ){
		return LoadSurface__UNSAFE__( new gxtkSurface(),path );
	}
	
	public virtual gxtkSurface CreateSurface( int width,int height ){
		Texture2D texture=new Texture2D( device,width,height,false,SurfaceFormat.Color );
		if( texture!=null ) return new gxtkSurface( texture );
		return null;
	}
	
	public virtual int SetAlpha( float alpha ){
		color.A=(byte)(alpha * 255);
		return 0;
	}

	public virtual int SetColor( float r,float g,float b ){
		color.R=(byte)r;
		color.G=(byte)g;
		color.B=(byte)b;
		return 0;
	}
	
	public virtual int SetBlend( int blend ){
		Flush();
	
		switch( blend ){
		case 1:
			device.BlendState=additiveBlend;
			break;
		default:
			device.BlendState=defaultBlend;
			break;
		}
		return 0;
	}
	
	public virtual int SetMatrix( float ix,float iy,float jx,float jy,float tx,float ty ){
	
		tformed=( ix!=1 || iy!=0 || jx!=0 || jy!=1 || tx!=0 || ty!=0 );
		
		this.ix=ix;this.iy=iy;
		this.jx=jx;this.jy=jy;
		this.tx=tx;this.ty=ty;

		return 0;
	}
	
	public virtual int SetScissor( int x,int y,int w,int h ){
		Flush();

		int r=Math.Min( x+w,Width() );
		int b=Math.Min( y+h,Height() );
		x=Math.Max( x,0 );
		y=Math.Max( y,0 );
		if( r>x && b>y ){
			w=r-x;
			h=b-y;
		}else{
			x=y=w=h=0;
		}
		
		if( x!=0 || y!=0 || w!=Width() || h!=Height() ){
			scissorRect.X=x;
			scissorRect.Y=y;
			scissorRect.Width=w;
			scissorRect.Height=h;
			device.RasterizerState=rstateScissor;
			device.ScissorRectangle=scissorRect;
		}else{
			device.RasterizerState=RasterizerState.CullNone;
		}
		
		return 0;
	}
	
	public virtual int Cls( float r,float g,float b ){

		if( device.RasterizerState.ScissorTestEnable ){

			Rectangle sr=device.ScissorRectangle;
			float x=sr.X,y=sr.Y,w=sr.Width,h=sr.Height;
			Color color=new Color( r/255.0f,g/255.0f,b/255.0f );
			
			primType=4;
			primCount=1;
			primTex=null;

			vertices[0].Position.X=x  ;vertices[0].Position.Y=y  ;vertices[0].Color=color;
			vertices[1].Position.X=x+w;vertices[1].Position.Y=y  ;vertices[1].Color=color;
			vertices[2].Position.X=x+w;vertices[2].Position.Y=y+h;vertices[2].Color=color;
			vertices[3].Position.X=x  ;vertices[3].Position.Y=y+h;vertices[3].Color=color;
		}else{
			primCount=0;
			device.Clear( new Color( r/255.0f,g/255.0f,b/255.0f ) );
		}
		return 0;
	}

	public virtual int DrawPoint( float x,float y ){
		if( primType!=4 || primCount==MAX_QUADS || primTex!=null ){
			Flush();
			primType=4;
			primTex=null;
		}
		
		if( tformed ){
			float px=x;
			x=px * ix + y * jx + tx;
			y=px * iy + y * jy + ty;
		}

		int vp=primCount++*4;
				
		vertices[vp  ].Position.X=x;vertices[vp  ].Position.Y=y;
		vertices[vp  ].Color=color;
		vertices[vp+1].Position.X=x+1;vertices[vp+1].Position.Y=y;
		vertices[vp+1].Color=color;
		vertices[vp+2].Position.X=x+1;vertices[vp+2].Position.Y=y+1;
		vertices[vp+2].Color=color;
		vertices[vp+3].Position.X=x;vertices[vp+3].Position.Y=y+1;
		vertices[vp+3].Color=color;
		
		return 0;
	}
	
	public virtual int DrawRect( float x,float y,float w,float h ){
		if( primType!=4 || primCount==MAX_QUADS || primTex!=null ){
			Flush();
			primType=4;
			primTex=null;
		}
		
		float x0=x,x1=x+w,x2=x+w,x3=x;
		float y0=y,y1=y,y2=y+h,y3=y+h;
		
		if( tformed ){
			float tx0=x0,tx1=x1,tx2=x2,tx3=x3;
			x0=tx0 * ix + y0 * jx + tx;
			y0=tx0 * iy + y0 * jy + ty;
			x1=tx1 * ix + y1 * jx + tx;
			y1=tx1 * iy + y1 * jy + ty;
			x2=tx2 * ix + y2 * jx + tx;
			y2=tx2 * iy + y2 * jy + ty;
			x3=tx3 * ix + y3 * jx + tx;
			y3=tx3 * iy + y3 * jy + ty;
		}

		int vp=primCount++*4;
				
		vertices[vp  ].Position.X=x0;vertices[vp  ].Position.Y=y0;
		vertices[vp  ].Color=color;
		vertices[vp+1].Position.X=x1;vertices[vp+1].Position.Y=y1;
		vertices[vp+1].Color=color;
		vertices[vp+2].Position.X=x2;vertices[vp+2].Position.Y=y2;
		vertices[vp+2].Color=color;
		vertices[vp+3].Position.X=x3;vertices[vp+3].Position.Y=y3;
		vertices[vp+3].Color=color;
		
		return 0;
	}

	public virtual int DrawLine( float x0,float y0,float x1,float y1 ){
		if( primType!=2 || primCount==MAX_LINES || primTex!=null ){
			Flush();
			primType=2;
			primTex=null;
		}
		
		if( tformed ){
			float tx0=x0,tx1=x1;
			x0=tx0 * ix + y0 * jx + tx;
			y0=tx0 * iy + y0 * jy + ty;
			x1=tx1 * ix + y1 * jx + tx;
			y1=tx1 * iy + y1 * jy + ty;
		}
		
		int vp=primCount++*2;
		
		vertices[vp  ].Position.X=x0;vertices[vp  ].Position.Y=y0;
		vertices[vp  ].Color=color;
		vertices[vp+1].Position.X=x1;vertices[vp+1].Position.Y=y1;
		vertices[vp+1].Color=color;
		
		return 0;
	}

	public virtual int DrawOval( float x,float y,float w,float h ){
		Flush();
		primType=5;
		primTex=null;
		
		float xr=w/2.0f;
		float yr=h/2.0f;

		int segs;
		if( tformed ){
			float dx_x=xr * ix;
			float dx_y=xr * iy;
			float dx=(float)Math.Sqrt( dx_x*dx_x+dx_y*dx_y );
			float dy_x=yr * jx;
			float dy_y=yr * jy;
			float dy=(float)Math.Sqrt( dy_x*dy_x+dy_y*dy_y );
			segs=(int)( dx+dy );
		}else{
			segs=(int)( Math.Abs( xr )+Math.Abs( yr ) );
		}
		segs=Math.Max( segs,12 ) & ~3;
		segs=Math.Min( segs,MAX_VERTS );

		float x0=x+xr,y0=y+yr;

		for( int i=0;i<segs;++i ){
		
			float th=-(float)i * (float)(Math.PI*2.0) / (float)segs;

			float px=x0+(float)Math.Cos( th ) * xr;
			float py=y0-(float)Math.Sin( th ) * yr;
			
			if( tformed ){
				float ppx=px;
				px=ppx * ix + py * jx + tx;
				py=ppx * iy + py * jy + ty;
			}
			
			vertices[i].Position.X=px;vertices[i].Position.Y=py;
			vertices[i].Color=color;
		}
		
		primCount=segs;

		Flush();
		
		return 0;
	}
	
	public virtual int DrawPoly( float[] verts ){
		int n=verts.Length/2;
		if( n<3 || n>MAX_VERTS ) return 0;
		
		Flush();
		primType=5;
		primTex=null;
		
		for( int i=0;i<n;++i ){
		
			float px=verts[i*2];
			float py=verts[i*2+1];
			
			if( tformed ){
				float ppx=px;
				px=ppx * ix + py * jx + tx;
				py=ppx * iy + py * jy + ty;
			}
			
			vertices[i].Position.X=px;vertices[i].Position.Y=py;
			vertices[i].Color=color;
		}

		primCount=n;
		
		Flush();
		
		return 0;
	}

	public virtual int DrawSurface( gxtkSurface surf,float x,float y ){
		if( primType!=4 || primCount==MAX_QUADS || surf.texture!=primTex ){
			Flush();
			primType=4;
			primTex=surf.texture;
		}
		
		float w=surf.Width();
		float h=surf.Height();
		float u0=0,u1=1,v0=0,v1=1;
		float x0=x,x1=x+w,x2=x+w,x3=x;
		float y0=y,y1=y,y2=y+h,y3=y+h;
		
		if( tformed ){
			float tx0=x0,tx1=x1,tx2=x2,tx3=x3;
			x0=tx0 * ix + y0 * jx + tx;
			y0=tx0 * iy + y0 * jy + ty;
			x1=tx1 * ix + y1 * jx + tx;
			y1=tx1 * iy + y1 * jy + ty;
			x2=tx2 * ix + y2 * jx + tx;
			y2=tx2 * iy + y2 * jy + ty;
			x3=tx3 * ix + y3 * jx + tx;
			y3=tx3 * iy + y3 * jy + ty;
		}

		int vp=primCount++*4;
				
		vertices[vp  ].Position.X=x0;vertices[vp  ].Position.Y=y0;
		vertices[vp  ].TextureCoordinate.X=u0;vertices[vp  ].TextureCoordinate.Y=v0;
		vertices[vp  ].Color=color;
		vertices[vp+1].Position.X=x1;vertices[vp+1].Position.Y=y1;
		vertices[vp+1].TextureCoordinate.X=u1;vertices[vp+1].TextureCoordinate.Y=v0;
		vertices[vp+1 ].Color=color;
		vertices[vp+2].Position.X=x2;vertices[vp+2].Position.Y=y2;
		vertices[vp+2].TextureCoordinate.X=u1;vertices[vp+2].TextureCoordinate.Y=v1;
		vertices[vp+2].Color=color;
		vertices[vp+3].Position.X=x3;vertices[vp+3].Position.Y=y3;
		vertices[vp+3].TextureCoordinate.X=u0;vertices[vp+3].TextureCoordinate.Y=v1;
		vertices[vp+3].Color=color;
		
		return 0;
	}

	public virtual int DrawSurface2( gxtkSurface surf,float x,float y,int srcx,int srcy,int srcw,int srch ){
		if( primType!=4 || primCount==MAX_QUADS || surf.texture!=primTex ){
			Flush();
			primType=4;
			primTex=surf.texture;
		}
		
		float w=surf.Width();
		float h=surf.Height();
		float u0=srcx/w,u1=(srcx+srcw)/w;
		float v0=srcy/h,v1=(srcy+srch)/h;
		float x0=x,x1=x+srcw,x2=x+srcw,x3=x;
		float y0=y,y1=y,y2=y+srch,y3=y+srch;
		
		if( tformed ){
			float tx0=x0,tx1=x1,tx2=x2,tx3=x3;
			x0=tx0 * ix + y0 * jx + tx;
			y0=tx0 * iy + y0 * jy + ty;
			x1=tx1 * ix + y1 * jx + tx;
			y1=tx1 * iy + y1 * jy + ty;
			x2=tx2 * ix + y2 * jx + tx;
			y2=tx2 * iy + y2 * jy + ty;
			x3=tx3 * ix + y3 * jx + tx;
			y3=tx3 * iy + y3 * jy + ty;
		}

		int vp=primCount++*4;
				
		vertices[vp  ].Position.X=x0;vertices[vp  ].Position.Y=y0;
		vertices[vp  ].TextureCoordinate.X=u0;vertices[vp  ].TextureCoordinate.Y=v0;
		vertices[vp  ].Color=color;
		vertices[vp+1].Position.X=x1;vertices[vp+1].Position.Y=y1;
		vertices[vp+1].TextureCoordinate.X=u1;vertices[vp+1].TextureCoordinate.Y=v0;
		vertices[vp+1 ].Color=color;
		vertices[vp+2].Position.X=x2;vertices[vp+2].Position.Y=y2;
		vertices[vp+2].TextureCoordinate.X=u1;vertices[vp+2].TextureCoordinate.Y=v1;
		vertices[vp+2].Color=color;
		vertices[vp+3].Position.X=x3;vertices[vp+3].Position.Y=y3;
		vertices[vp+3].TextureCoordinate.X=u0;vertices[vp+3].TextureCoordinate.Y=v1;
		vertices[vp+3].Color=color;
		
		return 0;
	}
	
	public virtual int ReadPixels( int[] pixels,int x,int y,int width,int height,int offset,int pitch ){

		Flush();
		
		Color[] data=new Color[width*height];

		device.SetRenderTarget( null );
		
		renderTarget.GetData( 0,new Rectangle( x,y,width,height ),data,0,data.Length );
		
		device.SetRenderTarget( renderTarget );
		
		int i=0;
		for( int py=0;py<height;++py ){
			int j=offset+py*pitch;
			for( int px=0;px<width;++px ){
				Color c=data[i++];
				pixels[j++]=(c.A<<24) | (c.R<<16) | (c.G<<8) | c.B;
			}
		}
		
		return 0;
	}
	
	public virtual int WritePixels2( gxtkSurface surface,int[] pixels,int x,int y,int width,int height,int offset,int pitch ){
	
		Flush();
	
		Color[] data=new Color[width*height];

		int i=0;
		for( int py=0;py<height;++py ){
			int j=offset+py*pitch;
			for( int px=0;px<width;++px ){
				int argb=pixels[j++];
				data[i++]=new Color( (argb>>16) & 0xff,(argb>>8) & 0xff,argb & 0xff,(argb>>24) & 0xff );
			}
		}
		
		surface.texture.SetData( 0,new Rectangle( x,y,width,height ),data,0,data.Length );
		
		return 0;
	}
}

//***** gxtkSurface *****

public class gxtkSurface{
	public Texture2D texture;
	
	public gxtkSurface(){
	}
	
	public gxtkSurface( Texture2D texture ){
		this.texture=texture;
	}
	
	public void SetTexture( Texture2D texture ){
		this.texture=texture;
	}
	
	//***** GXTK API *****
	
	public virtual int Discard(){
		texture=null;
		return 0;
	}
	
	public virtual int Width(){
		return texture.Width;
	}
	
	public virtual int Height(){
		return texture.Height;
	}
	
	public virtual int Loaded(){
		return 1;
	}
	
	public virtual bool OnUnsafeLoadComplete(){
		return true;
	}
}

public class gxtkInput{

	public bool shift,control;
	
	public int[] keyStates=new int[512];
	
	public int charPut=0;
	public int charGet=0;
	public int[] charQueue=new int[32];
	
	public float mouseX;
	public float mouseY;
	
	public GamePadState gamepadState;
	
	public int[] touches=new int[32];
	public float[] touchX=new float[32];
	public float[] touchY=new float[32];
	
	public float accelX;
	public float accelY;
	public float accelZ;
	
#if WINDOWS_PHONE
	public Accelerometer accelerometer;
	public bool keyboardEnabled=true;
	public bool gamepadEnabled=true;	//for back button mainly!
	public bool mouseEnabled=false;
	public bool touchEnabled=true;
	public bool gamepadFound=true;
	public PlayerIndex gamepadIndex=PlayerIndex.One;
#else
	public bool keyboardEnabled=true;
	public bool gamepadEnabled=true;
	public bool mouseEnabled=true;
	public bool touchEnabled=false;
	public bool gamepadFound=false;
	public PlayerIndex gamepadIndex;
#endif
	
	public const int KEY_LMB=1;
	public const int KEY_RMB=2;
	public const int KEY_MMB=3;
	
	public const int KEY_ESC=27;
	
	public const int KEY_JOY0_A=0x100;
	public const int KEY_JOY0_B=0x101;
	public const int KEY_JOY0_X=0x102;
	public const int KEY_JOY0_Y=0x103;
	public const int KEY_JOY0_LB=0x104;
	public const int KEY_JOY0_RB=0x105;
	public const int KEY_JOY0_BACK=0x106;
	public const int KEY_JOY0_START=0x107;
	public const int KEY_JOY0_LEFT=0x108;
	public const int KEY_JOY0_UP=0x109;
	public const int KEY_JOY0_RIGHT=0x10a;
	public const int KEY_JOY0_DOWN=0x10b;
	
	public const int KEY_TOUCH0=0x180;
	
	public const int KEY_SHIFT=0x10;
	public const int KEY_CONTROL=0x11;
	
	public const int VKEY_SHIFT=0x10;
	public const int VKEY_CONTROL=0x11;
	
	public const int VKEY_LSHIFT=0xa0;
	public const int VKEY_RSHIFT=0xa1;
	public const int VKEY_LCONTROL=0xa2;
	public const int VKEY_RCONTROL=0xa3;
	
#if WINDOWS_PHONE
	public gxtkInput(){
		if( MonkeyConfig.XNA_ACCELEROMETER_ENABLED=="1" ){
			accelerometer=new Accelerometer();
			if( accelerometer.State!=SensorState.NotSupported ){
				accelerometer.ReadingChanged+=OnAccelerometerReadingChanged;
				accelerometer.Start();
			}
        }
	}

	private void OnAccelerometerReadingChanged( object sender,AccelerometerReadingEventArgs e ){
		accelX=(float)e.X;
		accelY=(float)e.Y;
		accelZ=(float)e.Z;
    }		
#endif
	
	public int KeyToChar( int key ){
		if( key==8 || key==9 || key==13 || key==27 || key==32 ){
			return key;
		}else if( key==46 ){
			return 127;
		}else if( key>=48 && key<=57 && !shift ){
			return key;
		}else if( key>=65 && key<=90 && !shift ){
			return key+32;
		}else if( key>=65 && key<=90 && shift ){
			return key;
		}else if( key>=33 && key<=40 || key==45 ){
			return key | 0x10000;
		}
		return 0;
	}
	
	public void BeginUpdate(){

	
		//***** Update keyboard *****
		//
		if( keyboardEnabled ){

			KeyboardState keyboardState=Keyboard.GetState();
			
			shift=keyboardState.IsKeyDown( Keys.LeftShift ) || keyboardState.IsKeyDown( Keys.RightShift );
			control=keyboardState.IsKeyDown( Keys.LeftControl ) || keyboardState.IsKeyDown( Keys.RightControl );
			
			OnKey( KEY_SHIFT,shift );
			OnKey( KEY_CONTROL,control );

			for( int i=8;i<256;++i ){
				if( i==KEY_SHIFT || i==KEY_CONTROL ) continue;
				OnKey( i,keyboardState.IsKeyDown( (Keys)i ) );
			}
		}
		
		//***** Update gamepad *****
		//
		if( gamepadEnabled ){
			if( gamepadFound ){
				gamepadState=GamePad.GetState( gamepadIndex );
				PollGamepadState();
			}else{
				for( PlayerIndex i=PlayerIndex.One;i<=PlayerIndex.Four;++i ){
					GamePadState g=GamePad.GetState( i );
					if( !g.IsConnected ) continue;
					ButtonState p=ButtonState.Pressed;
					if( 
					g.Buttons.A==p ||
					g.Buttons.B==p ||
					g.Buttons.X==p ||
					g.Buttons.Y==p ||
					g.Buttons.LeftShoulder==p ||
					g.Buttons.RightShoulder==p ||
					g.Buttons.Back==p ||
					g.Buttons.Start==p ||
					g.DPad.Left==p ||
					g.DPad.Up==p ||
					g.DPad.Right==p ||
					g.DPad.Down==p ){
						gamepadFound=true;
						gamepadIndex=i;
						gamepadState=g;
						PollGamepadState();
						break;
					}
				}
			}
		}

		//***** Update mouse *****
		//
		if( mouseEnabled ){

			MouseState mouseState=Mouse.GetState();
			
			OnKey( KEY_LMB,mouseState.LeftButton==ButtonState.Pressed );
			OnKey( KEY_RMB,mouseState.RightButton==ButtonState.Pressed );
			OnKey( KEY_MMB,mouseState.MiddleButton==ButtonState.Pressed );
			
			mouseX=mouseState.X;
			mouseY=mouseState.Y;
			if( !touchEnabled ){
				touchX[0]=mouseX;
				touchY[0]=mouseY;
			}
		}
		
		//***** Update touch *****
		//
		if( touchEnabled ){
#if WINDOWS_PHONE
			TouchCollection touchCollection=TouchPanel.GetState();
			foreach( TouchLocation tl in touchCollection ){
			
				if( tl.State==TouchLocationState.Invalid ) continue;
			
				int touch=tl.Id;
				
				int pid;
				for( pid=0;pid<32 && touches[pid]!=touch;++pid ){}
	
				switch( tl.State ){
				case TouchLocationState.Pressed:
					if( pid!=32 ){ pid=32;break; }
					for( pid=0;pid<32 && touches[pid]!=0;++pid ){}
					if( pid==32 ) break;
					touches[pid]=touch;
					OnKeyDown( KEY_TOUCH0+pid );
//					keyStates[KEY_TOUCH0+pid]=0x101;
					break;
				case TouchLocationState.Moved:
					break;
				case TouchLocationState.Released:
					if( pid==32 ) break;
					touches[pid]=0;
					OnKeyUp( KEY_TOUCH0+pid );
//					keyStates[KEY_TOUCH0+pid]=0;
					break;
				}
				if( pid==32 ){
					//ERROR!
					continue;
				}
				Vector2 p=tl.Position;
				touchX[pid]=p.X;
				touchY[pid]=p.Y;
				if( pid==0 && !mouseEnabled ){
					mouseX=p.X;
					mouseY=p.Y;
				}
			}
#endif			
		}
	}
	
	public void PollGamepadState(){
		OnKey( KEY_JOY0_A,gamepadState.Buttons.A==ButtonState.Pressed );
		OnKey( KEY_JOY0_B,gamepadState.Buttons.B==ButtonState.Pressed );
		OnKey( KEY_JOY0_X,gamepadState.Buttons.X==ButtonState.Pressed );
		OnKey( KEY_JOY0_Y,gamepadState.Buttons.Y==ButtonState.Pressed );
		OnKey( KEY_JOY0_LB,gamepadState.Buttons.LeftShoulder==ButtonState.Pressed );
		OnKey( KEY_JOY0_RB,gamepadState.Buttons.RightShoulder==ButtonState.Pressed );
		OnKey( KEY_JOY0_BACK,gamepadState.Buttons.Back==ButtonState.Pressed );
		OnKey( KEY_JOY0_START,gamepadState.Buttons.Start==ButtonState.Pressed );
		OnKey( KEY_JOY0_LEFT,gamepadState.DPad.Left==ButtonState.Pressed );
		OnKey( KEY_JOY0_UP,gamepadState.DPad.Up==ButtonState.Pressed );
		OnKey( KEY_JOY0_RIGHT,gamepadState.DPad.Right==ButtonState.Pressed );
		OnKey( KEY_JOY0_DOWN,gamepadState.DPad.Down==ButtonState.Pressed );
	}
	
	public void EndUpdate(){
		for( int i=0;i<512;++i ){
			keyStates[i]&=0x100;
		}
		charGet=0;
		charPut=0;
	}
	
	public virtual void OnKey( int key,bool down ){
		if( down ){
			OnKeyDown( key );
		}else{
			OnKeyUp( key );
		}
	}
	
	public virtual void OnKeyDown( int key ){
		if( (keyStates[key] & 0x100)!=0 ) return;
		
		keyStates[key]|=0x100;
		++keyStates[key];
		
		int chr=KeyToChar( key );
		if( chr!=0 ) PutChar( chr );

		if( key==KEY_LMB && !touchEnabled ){
			this.keyStates[KEY_TOUCH0]|=0x100;
			++this.keyStates[KEY_TOUCH0];
		}else if( key==KEY_TOUCH0 && !mouseEnabled ){
			this.keyStates[KEY_LMB]|=0x100;
			++this.keyStates[KEY_LMB];
		}
	}
	
	public virtual void OnKeyUp( int key ){
		if( (keyStates[key] & 0x100)==0 ) return;
		
		keyStates[key]&=0xff;

		if( key==KEY_LMB && !touchEnabled ){
			this.keyStates[KEY_TOUCH0]&=0xff;
		}else if( key==KEY_TOUCH0 && !mouseEnabled ){
			this.keyStates[KEY_LMB]&=0xff;
		}
	}
	
	public virtual void PutChar( int chr ){
		if( charPut!=32 ){
			charQueue[charPut++]=chr;
		}
	}

	//***** GXTK API *****
	
	public virtual int SetKeyboardEnabled( int enabled ){
#if WINDOWS
		return 0;	//keyboard present on windows
#else
		return -1;	//no keyboard support on XBOX/PHONE
#endif
	}
	
	public virtual int KeyDown( int key ){
		if( key>0 && key<512 ){
			return keyStates[key]>>8;
		}
		return 0;
	}
	
	public virtual int KeyHit( int key ){
		if( key>0 && key<512 ){
			return keyStates[key] & 0xff;
		}
		return 0;
	}
	
	public virtual int GetChar(){
		if( charGet!=charPut ){
			return charQueue[charGet++];
		}
		return 0;
	}
	
	public virtual float MouseX(){
		return mouseX;
	}
	
	public virtual float MouseY(){
		return mouseY;
	}

	public virtual float JoyX( int index ){
		switch( index ){
		case 0:return gamepadState.ThumbSticks.Left.X;
		case 1:return gamepadState.ThumbSticks.Right.X;
		}
		return 0;
	}
	
	public virtual float JoyY( int index ){
		switch( index ){
		case 0:return gamepadState.ThumbSticks.Left.Y;
		case 1:return gamepadState.ThumbSticks.Right.Y;
		}
		return 0;
	}
	
	public virtual float JoyZ( int index ){
		switch( index ){
		case 0:return gamepadState.Triggers.Left;
		case 1:return gamepadState.Triggers.Right;
		}
		return 0;
	}
	
	public virtual float TouchX( int index ){
		return touchX[index];
	}

	public virtual float TouchY( int index ){
		return touchY[index];
	}
	
	public virtual float AccelX(){
		return accelX;
	}

	public virtual float AccelY(){
		return accelY;
	}

	public virtual float AccelZ(){
		return accelZ;
	}
}

public class gxtkChannel{
	public gxtkSample sample;
	public SoundEffectInstance inst;
	public float volume=1;
	public float pan=0;
	public float rate=1;
	public int state=0;
};

public class gxtkAudio{

	public bool musicEnabled;

	public gxtkChannel[] channels=new gxtkChannel[33];
	
	public void OnSuspend(){
		for( int i=0;i<33;++i ){
			if( channels[i].state==1 ) channels[i].inst.Pause();
		}
	}
	
	public void OnResume(){
		for( int i=0;i<33;++i ){
			if( channels[i].state==1 ) channels[i].inst.Resume();
		}
	}

	//***** GXTK API *****
	//
	public gxtkAudio(){
		musicEnabled=MediaPlayer.GameHasControl;
		
		for( int i=0;i<33;++i ){
			channels[i]=new gxtkChannel();
		}
	}
	
	public virtual gxtkSample LoadSample__UNSAFE__( gxtkSample sample,String path ){
		SoundEffect sound=MonkeyData.LoadSoundEffect( path,gxtkApp.game.Content );
		if( sound==null ) return null;
		sample.SetSound( sound );
		return sample;
	}
	
	public virtual gxtkSample LoadSample( String path ){
		return LoadSample__UNSAFE__( new gxtkSample(),path );
	}
	
	public virtual int PlaySample( gxtkSample sample,int channel,int flags ){
		gxtkChannel chan=channels[channel];

		SoundEffectInstance inst=null;
		
		if( chan.state!=0 ){
			chan.inst.Stop();
			chan.state=0;
		}
		inst=sample.AllocInstance( (flags&1)!=0 );
		if( inst==null ) return -1;
		
		for( int i=0;i<33;++i ){
			gxtkChannel chan2=channels[i];
			if( chan2.inst==inst ){
				chan2.sample=null;
				chan2.inst=null;
				chan2.state=0;
				break;
			}
		}
		
		inst.Volume=chan.volume;
		inst.Pan=chan.pan;
		inst.Pitch=(float)( Math.Log(chan.rate)/Math.Log(2) );
		inst.Play();

		chan.sample=sample;
		chan.inst=inst;
		chan.state=1;
		return 0;
	}
	
	public virtual int StopChannel( int channel ){
		gxtkChannel chan=channels[channel];
		
		if( chan.state!=0 ){
			chan.inst.Stop();
			chan.state=0;
		}
		return 0;
	}
	
	public virtual int PauseChannel( int channel ){
		gxtkChannel chan=channels[channel];
		
		if( chan.state==1 ){
			chan.inst.Pause();
			chan.state=2;
		}
		return 0;
	}
	
	public virtual int ResumeChannel( int channel ){
		gxtkChannel chan=channels[channel];
		
		if( chan.state==2 ){
			chan.inst.Resume();
			chan.state=1;
		}
		return 0;
	}
	
	public virtual int ChannelState( int channel ){
		gxtkChannel chan=channels[channel];
		
		if( chan.state==1 ){
			if( chan.inst.State!=SoundState.Playing ) chan.state=0;
		}
		
		return chan.state;
	}
	
	public virtual int SetVolume( int channel,float volume ){
		gxtkChannel chan=channels[channel];
		
		if( chan.state!=0 ) chan.inst.Volume=volume;
		
		chan.volume=volume;
		return 0;
	}
	
	public virtual int SetPan( int channel,float pan ){
		gxtkChannel chan=channels[channel];
		
		if( chan.state!=0 ) chan.inst.Pan=pan;
		
		chan.pan=pan;
		return 0;
	}
	
	public virtual int SetRate( int channel,float rate ){
		gxtkChannel chan=channels[channel];
		
		if( chan.state!=0 ) chan.inst.Pitch=(float)( Math.Log(rate)/Math.Log(2) );
		
		chan.rate=rate;
		return 0;
	}
	
	public virtual int PlayMusic( String path,int flags ){
		if( !musicEnabled ) return -1;
		
		MediaPlayer.Stop();
		
		Song song=MonkeyData.LoadSong( path,gxtkApp.game.Content );
		if( song==null ) return -1;
		
		if( (flags&1)!=0 ) MediaPlayer.IsRepeating=true;
		
		MediaPlayer.Play( song );
		return 0;
	}
	
	public virtual int StopMusic(){
		if( !musicEnabled ) return -1;
		
		MediaPlayer.Stop();
		return 0;
	}
	
	public virtual int PauseMusic(){
		if( !musicEnabled ) return -1;
		
		MediaPlayer.Pause();
		return 0;
	}
	
	public virtual int ResumeMusic(){
		if( !musicEnabled ) return -1;
		
		MediaPlayer.Resume();
		return 0;
	}
	
	public virtual int MusicState(){
		if( !musicEnabled ) return -1;
		
		return MediaPlayer.State==MediaState.Playing ? 1 : 0;
	}
	
	public virtual int SetMusicVolume( float volume ){
		if( !musicEnabled ) return -1;
		
		MediaPlayer.Volume=volume;
		return 0;
	}
}

public class gxtkSample{

	public SoundEffect sound;
	
	//first 8 non-looped, second 8 looped.
	public SoundEffectInstance[] insts=new SoundEffectInstance[16];	
	
	public gxtkSample(){
	}
	
	public gxtkSample( SoundEffect sound ){
		this.sound=sound;
	}
	
	public void SetSound( SoundEffect sound ){
		this.sound=sound;
	}

	public SoundEffectInstance AllocInstance( bool looped ){
		int st=looped ? 8 : 0;
		for( int i=st;i<st+8;++i ){
			SoundEffectInstance inst=insts[i];
			if( inst!=null ){
				if( inst.State!=SoundState.Playing ) return inst;
			}else{
				inst=sound.CreateInstance();
				inst.IsLooped=looped;
				insts[i]=inst;
				return inst;
			}
		}
		return null;
	}

	public virtual int Discard(){	
		if( sound!=null ){
			sound=null;
			for( int i=0;i<16;++i ){
				insts[i]=null;
			}
		}
		return 0;
	}	
}

class BBThread{

	private bool _running;
	private Thread _thread;
	
	public virtual void Start(){
		if( _running ) return;
		_running=true;
		_thread=new Thread( new ThreadStart( this.run ) );
		_thread.Start();
	}
	
	public virtual bool IsRunning(){
		return _running;
	}

	public virtual void Run__UNSAFE__(){
	}

	private void run(){
		Run__UNSAFE__();
		_running=false;
	}
}
class bb_app_App : Object{
	public virtual bb_app_App g_App_new(){
		bb_app.bb_app_device=(new bb_app_AppDevice()).g_AppDevice_new(this);
		return this;
	}
	public virtual int m_OnCreate(){
		return 0;
	}
	public virtual int m_OnUpdate(){
		return 0;
	}
	public virtual int m_OnSuspend(){
		return 0;
	}
	public virtual int m_OnResume(){
		return 0;
	}
	public virtual int m_OnRender(){
		return 0;
	}
	public virtual int m_OnLoading(){
		return 0;
	}
}
class bb__XmasApp : bb_app_App{
	public virtual bb__XmasApp g_XmasApp_new(){
		base.g_App_new();
		return this;
	}
	public bb_scene_Scene f_scene=null;
	public override int m_OnCreate(){
		bb_app.bb_app_SetUpdateRate(30);
		bb_random.bb_random_Seed=Millisecs();
		bb_gfx_GFX.g_Init();
		bb_scene_Scene.g_Init();
		bb_sfx_SFX.g_Init();
		bb_autofit.bb_autofit_SetVirtualDisplay(360,240,1.0f);
		f_scene=bb_scene.bb_scene_GenerateScene();
		return 1;
	}
	public override int m_OnUpdate(){
		f_scene.m_Update();
		return 1;
	}
	public override int m_OnRender(){
		bb_autofit.bb_autofit_UpdateVirtualDisplay(true,true);
		bb_graphics.bb_graphics_Cls(0.0f,0.0f,0.0f);
		f_scene.m_Render();
		return 1;
	}
}
class bb_app_AppDevice : gxtkApp{
	public bb_app_App f_app=null;
	public virtual bb_app_AppDevice g_AppDevice_new(bb_app_App t_app){
		this.f_app=t_app;
		bb_graphics.bb_graphics_SetGraphicsDevice(GraphicsDevice());
		bb_input.bb_input_SetInputDevice(InputDevice());
		bb_audio.bb_audio_SetAudioDevice(AudioDevice());
		return this;
	}
	public virtual bb_app_AppDevice g_AppDevice_new2(){
		return this;
	}
	public override int OnCreate(){
		bb_graphics.bb_graphics_SetFont(null,32);
		return f_app.m_OnCreate();
	}
	public override int OnUpdate(){
		return f_app.m_OnUpdate();
	}
	public override int OnSuspend(){
		return f_app.m_OnSuspend();
	}
	public override int OnResume(){
		return f_app.m_OnResume();
	}
	public override int OnRender(){
		bb_graphics.bb_graphics_BeginRender();
		int t_r=f_app.m_OnRender();
		bb_graphics.bb_graphics_EndRender();
		return t_r;
	}
	public override int OnLoading(){
		bb_graphics.bb_graphics_BeginRender();
		int t_r=f_app.m_OnLoading();
		bb_graphics.bb_graphics_EndRender();
		return t_r;
	}
	public int f_updateRate=0;
	public override int SetUpdateRate(int t_hertz){
		base.SetUpdateRate(t_hertz);
		f_updateRate=t_hertz;
		return 0;
	}
}
class bb_graphics_Image : Object{
	public static int g_DefaultFlags;
	public virtual bb_graphics_Image g_Image_new(){
		return this;
	}
	public gxtkSurface f_surface=null;
	public int f_width=0;
	public int f_height=0;
	public bb_graphics_Frame[] f_frames=new bb_graphics_Frame[0];
	public int f_flags=0;
	public float f_tx=.0f;
	public float f_ty=.0f;
	public virtual int m_SetHandle(float t_tx,float t_ty){
		this.f_tx=t_tx;
		this.f_ty=t_ty;
		this.f_flags=this.f_flags&-2;
		return 0;
	}
	public virtual int m_ApplyFlags(int t_iflags){
		f_flags=t_iflags;
		if((f_flags&2)!=0){
			bb_graphics_Frame[] t_=f_frames;
			int t_2=0;
			while(t_2<bb_std_lang.length(t_)){
				bb_graphics_Frame t_f=t_[t_2];
				t_2=t_2+1;
				t_f.f_x+=1;
			}
			f_width-=2;
		}
		if((f_flags&4)!=0){
			bb_graphics_Frame[] t_3=f_frames;
			int t_4=0;
			while(t_4<bb_std_lang.length(t_3)){
				bb_graphics_Frame t_f2=t_3[t_4];
				t_4=t_4+1;
				t_f2.f_y+=1;
			}
			f_height-=2;
		}
		if((f_flags&1)!=0){
			m_SetHandle((float)(f_width)/2.0f,(float)(f_height)/2.0f);
		}
		if(bb_std_lang.length(f_frames)==1 && f_frames[0].f_x==0 && f_frames[0].f_y==0 && f_width==f_surface.Width() && f_height==f_surface.Height()){
			f_flags|=65536;
		}
		return 0;
	}
	public virtual bb_graphics_Image m_Init(gxtkSurface t_surf,int t_nframes,int t_iflags){
		f_surface=t_surf;
		f_width=f_surface.Width()/t_nframes;
		f_height=f_surface.Height();
		f_frames=new bb_graphics_Frame[t_nframes];
		for(int t_i=0;t_i<t_nframes;t_i=t_i+1){
			f_frames[t_i]=(new bb_graphics_Frame()).g_Frame_new(t_i*f_width,0);
		}
		m_ApplyFlags(t_iflags);
		return this;
	}
	public bb_graphics_Image f_source=null;
	public virtual bb_graphics_Image m_Grab(int t_x,int t_y,int t_iwidth,int t_iheight,int t_nframes,int t_iflags,bb_graphics_Image t_source){
		this.f_source=t_source;
		f_surface=t_source.f_surface;
		f_width=t_iwidth;
		f_height=t_iheight;
		f_frames=new bb_graphics_Frame[t_nframes];
		int t_ix=t_x;
		int t_iy=t_y;
		for(int t_i=0;t_i<t_nframes;t_i=t_i+1){
			if(t_ix+f_width>t_source.f_width){
				t_ix=0;
				t_iy+=f_height;
			}
			if(t_ix+f_width>t_source.f_width || t_iy+f_height>t_source.f_height){
				bb_std_lang.Error("Image frame outside surface");
			}
			f_frames[t_i]=(new bb_graphics_Frame()).g_Frame_new(t_ix+t_source.f_frames[0].f_x,t_iy+t_source.f_frames[0].f_y);
			t_ix+=f_width;
		}
		m_ApplyFlags(t_iflags);
		return this;
	}
	public virtual bb_graphics_Image m_GrabImage(int t_x,int t_y,int t_width,int t_height,int t_frames,int t_flags){
		if(bb_std_lang.length(this.f_frames)!=1){
			return null;
		}
		return ((new bb_graphics_Image()).g_Image_new()).m_Grab(t_x,t_y,t_width,t_height,t_frames,t_flags,this);
	}
}
class bb_graphics_GraphicsContext : Object{
	public virtual bb_graphics_GraphicsContext g_GraphicsContext_new(){
		return this;
	}
	public bb_graphics_Image f_defaultFont=null;
	public bb_graphics_Image f_font=null;
	public int f_firstChar=0;
	public int f_matrixSp=0;
	public float f_ix=1.0f;
	public float f_iy=.0f;
	public float f_jx=.0f;
	public float f_jy=1.0f;
	public float f_tx=.0f;
	public float f_ty=.0f;
	public int f_tformed=0;
	public int f_matDirty=0;
	public float f_color_r=.0f;
	public float f_color_g=.0f;
	public float f_color_b=.0f;
	public float f_alpha=.0f;
	public int f_blend=0;
	public float f_scissor_x=.0f;
	public float f_scissor_y=.0f;
	public float f_scissor_width=.0f;
	public float f_scissor_height=.0f;
	public float[] f_matrixStack=new float[192];
	public virtual int m_Validate(){
		if((f_matDirty)!=0){
			bb_graphics.bb_graphics_renderDevice.SetMatrix(bb_graphics.bb_graphics_context.f_ix,bb_graphics.bb_graphics_context.f_iy,bb_graphics.bb_graphics_context.f_jx,bb_graphics.bb_graphics_context.f_jy,bb_graphics.bb_graphics_context.f_tx,bb_graphics.bb_graphics_context.f_ty);
			f_matDirty=0;
		}
		return 0;
	}
}
class bb_graphics_Frame : Object{
	public int f_x=0;
	public int f_y=0;
	public virtual bb_graphics_Frame g_Frame_new(int t_x,int t_y){
		this.f_x=t_x;
		this.f_y=t_y;
		return this;
	}
	public virtual bb_graphics_Frame g_Frame_new2(){
		return this;
	}
}
class bb_gfx_GFX : Object{
	public static bb_graphics_Image g_Tileset;
	public static void g_Init(){
		g_Tileset=bb_graphics.bb_graphics_LoadImage("gfx/xmas_sprites.png",1,bb_graphics_Image.g_DefaultFlags);
	}
	public static void g_Draw(int t_tX,int t_tY,int t_X,int t_Y,int t_W,int t_H){
		bb_graphics.bb_graphics_DrawImageRect(g_Tileset,(float)(t_tX),(float)(t_tY),t_X,t_Y,t_W,t_H,0);
	}
}
class bb_scene_Scene : Object{
	public static bb_graphics_Image g_Background;
	public static void g_Init(){
		g_Background=bb_graphics.bb_graphics_LoadImage("gfx/xmas_scene.png",1,bb_graphics_Image.g_DefaultFlags);
	}
	public static int g_Width;
	public int f_FloorSegmentCount=0;
	public bb_floorsegment_FloorSegment[] f_FloorSegments=new bb_floorsegment_FloorSegment[0];
	public bb_list_List f_Trees=null;
	public bb_list_List2 f_Houses=null;
	public bb_list_List3 f_Stars=null;
	public bb_list_List4 f_Snowmen=null;
	public bb_list_List5 f_Snowflakes=null;
	public bb_moon_Moon f_moon=null;
	public virtual bb_scene_Scene g_Scene_new(){
		f_FloorSegmentCount=g_Width/bb_floorsegment_FloorSegment.g_Width+1;
		f_FloorSegments=new bb_floorsegment_FloorSegment[f_FloorSegmentCount];
		for(int t_i=0;t_i<f_FloorSegmentCount;t_i=t_i+1){
			f_FloorSegments[t_i]=(new bb_floorsegment_FloorSegment()).g_FloorSegment_new(this);
		}
		f_Trees=(new bb_list_List()).g_List_new();
		f_Houses=(new bb_list_List2()).g_List_new();
		f_Stars=(new bb_list_List3()).g_List_new();
		f_Snowmen=(new bb_list_List4()).g_List_new();
		f_Snowflakes=(new bb_list_List5()).g_List_new();
		f_moon=(new bb_moon_Moon()).g_Moon_new(this);
		return this;
	}
	public static int g_Height;
	public virtual void m_AddSnowFlake(){
		bb_snowflake_Snowflake t_tS=(new bb_snowflake_Snowflake()).g_Snowflake_new(this);
		if(bb_random.bb_random_Rnd()<0.5f){
			t_tS.f_X=-10.0f;
			t_tS.f_Y=bb_random.bb_random_Rnd2(-5.0f,(float)(g_Height-5));
		}else{
			t_tS.f_X=bb_random.bb_random_Rnd2(-5.0f,(float)(g_Width-5));
			t_tS.f_Y=-10.0f;
		}
		t_tS.f_Frame=(int)(bb_random.bb_random_Rnd2(0.0f,10.0f));
		t_tS.f_XS=bb_random.bb_random_Rnd2(-2.0f,4.0f);
		t_tS.f_YS=bb_random.bb_random_Rnd2(0.1f,1.0f);
		f_Snowflakes.m_AddLast5(t_tS);
	}
	public virtual void m_Update(){
		bb_list_Enumerator t_=f_Trees.m_ObjectEnumerator();
		while(t_.m_HasNext()){
			bb_tree_Tree t_tTree=t_.m_NextObject();
			t_tTree.m_Update();
		}
		bb_list_Enumerator2 t_2=f_Houses.m_ObjectEnumerator();
		while(t_2.m_HasNext()){
			bb_house_House t_tHouse=t_2.m_NextObject();
			t_tHouse.m_Update();
		}
		bb_list_Enumerator3 t_3=f_Stars.m_ObjectEnumerator();
		while(t_3.m_HasNext()){
			bb_star_Star t_tStar=t_3.m_NextObject();
			t_tStar.m_Update();
		}
		bb_list_Enumerator4 t_4=f_Snowmen.m_ObjectEnumerator();
		while(t_4.m_HasNext()){
			bb_snowman_Snowman t_tSnowman=t_4.m_NextObject();
			t_tSnowman.m_Update();
		}
		bb_list_Enumerator5 t_5=f_Snowflakes.m_ObjectEnumerator();
		while(t_5.m_HasNext()){
			bb_snowflake_Snowflake t_tSnowflake=t_5.m_NextObject();
			t_tSnowflake.m_Update();
		}
		if(bb_random.bb_random_Rnd()<0.1f){
			m_AddSnowFlake();
		}
	}
	public virtual void m_Render(){
		bb_graphics.bb_graphics_SetColor(255.0f,255.0f,255.0f);
		bb_graphics.bb_graphics_SetAlpha(1.0f);
		bb_graphics.bb_graphics_DrawImage(g_Background,0.0f,0.0f,0);
		bb_list_Enumerator3 t_=f_Stars.m_ObjectEnumerator();
		while(t_.m_HasNext()){
			bb_star_Star t_tStar=t_.m_NextObject();
			t_tStar.m_Render();
		}
		f_moon.m_Render();
		bb_list_Enumerator t_2=f_Trees.m_ObjectEnumerator();
		while(t_2.m_HasNext()){
			bb_tree_Tree t_tTree=t_2.m_NextObject();
			t_tTree.m_Render();
		}
		bb_list_Enumerator2 t_3=f_Houses.m_ObjectEnumerator();
		while(t_3.m_HasNext()){
			bb_house_House t_tHouse=t_3.m_NextObject();
			t_tHouse.m_Render();
		}
		bb_list_Enumerator4 t_4=f_Snowmen.m_ObjectEnumerator();
		while(t_4.m_HasNext()){
			bb_snowman_Snowman t_tSnowman=t_4.m_NextObject();
			t_tSnowman.m_Render();
		}
		for(int t_i=0;t_i<f_FloorSegmentCount;t_i=t_i+1){
			f_FloorSegments[t_i].m_Render();
		}
		bb_list_Enumerator5 t_5=f_Snowflakes.m_ObjectEnumerator();
		while(t_5.m_HasNext()){
			bb_snowflake_Snowflake t_tSnowflake=t_5.m_NextObject();
			t_tSnowflake.m_Render();
		}
	}
}
class bb_sfx_SFX : Object{
	public static int g_ActiveChannel;
	public static bb_map_StringMap g_Sounds;
	public static bb_map_StringMap2 g_Musics;
	public static void g_Init(){
		g_ActiveChannel=0;
		g_Sounds=(new bb_map_StringMap()).g_StringMap_new();
		g_Musics=(new bb_map_StringMap2()).g_StringMap_new();
	}
}
class bb_audio_Sound : Object{
}
abstract class bb_map_Map : Object{
	public virtual bb_map_Map g_Map_new(){
		return this;
	}
}
class bb_map_StringMap : bb_map_Map{
	public virtual bb_map_StringMap g_StringMap_new(){
		base.g_Map_new();
		return this;
	}
}
abstract class bb_map_Map2 : Object{
	public virtual bb_map_Map2 g_Map_new(){
		return this;
	}
}
class bb_map_StringMap2 : bb_map_Map2{
	public virtual bb_map_StringMap2 g_StringMap_new(){
		base.g_Map_new();
		return this;
	}
}
class bb_autofit_VirtualDisplay : Object{
	public float f_vwidth=.0f;
	public float f_vheight=.0f;
	public float f_vzoom=.0f;
	public float f_lastvzoom=.0f;
	public float f_vratio=.0f;
	public static bb_autofit_VirtualDisplay g_Display;
	public virtual bb_autofit_VirtualDisplay g_VirtualDisplay_new(int t_width,int t_height,float t_zoom){
		f_vwidth=(float)(t_width);
		f_vheight=(float)(t_height);
		f_vzoom=t_zoom;
		f_lastvzoom=f_vzoom+1.0f;
		f_vratio=f_vheight/f_vwidth;
		g_Display=this;
		return this;
	}
	public virtual bb_autofit_VirtualDisplay g_VirtualDisplay_new2(){
		return this;
	}
	public int f_lastdevicewidth=0;
	public int f_lastdeviceheight=0;
	public int f_device_changed=0;
	public float f_fdw=.0f;
	public float f_fdh=.0f;
	public float f_dratio=.0f;
	public float f_multi=.0f;
	public float f_heightborder=.0f;
	public float f_widthborder=.0f;
	public int f_zoom_changed=0;
	public float f_realx=.0f;
	public float f_realy=.0f;
	public float f_offx=.0f;
	public float f_offy=.0f;
	public float f_sx=.0f;
	public float f_sw=.0f;
	public float f_sy=.0f;
	public float f_sh=.0f;
	public float f_scaledw=.0f;
	public float f_scaledh=.0f;
	public float f_vxoff=.0f;
	public float f_vyoff=.0f;
	public virtual int m_UpdateVirtualDisplay(bool t_zoomborders,bool t_keepborders){
		if(bb_graphics.bb_graphics_DeviceWidth()!=f_lastdevicewidth || bb_graphics.bb_graphics_DeviceHeight()!=f_lastdeviceheight){
			f_lastdevicewidth=bb_graphics.bb_graphics_DeviceWidth();
			f_lastdeviceheight=bb_graphics.bb_graphics_DeviceHeight();
			f_device_changed=1;
		}
		if((f_device_changed)!=0){
			f_fdw=(float)(bb_graphics.bb_graphics_DeviceWidth());
			f_fdh=(float)(bb_graphics.bb_graphics_DeviceHeight());
			f_dratio=f_fdh/f_fdw;
			if(f_dratio>f_vratio){
				f_multi=f_fdw/f_vwidth;
				f_heightborder=(f_fdh-f_vheight*f_multi)*0.5f;
				f_widthborder=0.0f;
			}else{
				f_multi=f_fdh/f_vheight;
				f_widthborder=(f_fdw-f_vwidth*f_multi)*0.5f;
				f_heightborder=0.0f;
			}
		}
		if(f_vzoom!=f_lastvzoom){
			f_lastvzoom=f_vzoom;
			f_zoom_changed=1;
		}
		if(((f_zoom_changed)!=0) || ((f_device_changed)!=0)){
			if(t_zoomborders){
				f_realx=f_vwidth*f_vzoom*f_multi;
				f_realy=f_vheight*f_vzoom*f_multi;
				f_offx=(f_fdw-f_realx)*0.5f;
				f_offy=(f_fdh-f_realy)*0.5f;
				if(t_keepborders){
					if(f_offx<f_widthborder){
						f_sx=f_widthborder;
						f_sw=f_fdw-f_widthborder*2.0f;
					}else{
						f_sx=f_offx;
						f_sw=f_fdw-f_offx*2.0f;
					}
					if(f_offy<f_heightborder){
						f_sy=f_heightborder;
						f_sh=f_fdh-f_heightborder*2.0f;
					}else{
						f_sy=f_offy;
						f_sh=f_fdh-f_offy*2.0f;
					}
				}else{
					f_sx=f_offx;
					f_sw=f_fdw-f_offx*2.0f;
					f_sy=f_offy;
					f_sh=f_fdh-f_offy*2.0f;
				}
				f_sx=bb_math.bb_math_Max2(0.0f,f_sx);
				f_sy=bb_math.bb_math_Max2(0.0f,f_sy);
				f_sw=bb_math.bb_math_Min2(f_sw,f_fdw);
				f_sh=bb_math.bb_math_Min2(f_sh,f_fdh);
			}else{
				f_sx=bb_math.bb_math_Max2(0.0f,f_widthborder);
				f_sy=bb_math.bb_math_Max2(0.0f,f_heightborder);
				f_sw=bb_math.bb_math_Min2(f_fdw-f_widthborder*2.0f,f_fdw);
				f_sh=bb_math.bb_math_Min2(f_fdh-f_heightborder*2.0f,f_fdh);
			}
			f_scaledw=f_vwidth*f_multi*f_vzoom;
			f_scaledh=f_vheight*f_multi*f_vzoom;
			f_vxoff=(f_fdw-f_scaledw)*0.5f;
			f_vyoff=(f_fdh-f_scaledh)*0.5f;
			f_vxoff=f_vxoff/f_multi/f_vzoom;
			f_vyoff=f_vyoff/f_multi/f_vzoom;
			f_device_changed=0;
			f_zoom_changed=0;
		}
		bb_graphics.bb_graphics_SetScissor(0.0f,0.0f,(float)(bb_graphics.bb_graphics_DeviceWidth()),(float)(bb_graphics.bb_graphics_DeviceHeight()));
		bb_graphics.bb_graphics_Cls(0.0f,0.0f,0.0f);
		bb_graphics.bb_graphics_SetScissor(f_sx,f_sy,f_sw,f_sh);
		bb_graphics.bb_graphics_Scale(f_multi*f_vzoom,f_multi*f_vzoom);
		if((f_vzoom)!=0.0f){
			bb_graphics.bb_graphics_Translate(f_vxoff,f_vyoff);
		}
		return 0;
	}
}
class bb_floorsegment_FloorSegment : Object{
	public static int g_Width;
	public bb_scene_Scene f_scene=null;
	public virtual bb_floorsegment_FloorSegment g_FloorSegment_new(bb_scene_Scene t_tS){
		f_scene=t_tS;
		return this;
	}
	public virtual bb_floorsegment_FloorSegment g_FloorSegment_new2(){
		return this;
	}
	public int f_X=0;
	public int f_Y=0;
	public virtual void m_SetPos(int t_tX,int t_tY){
		f_X=t_tX;
		f_Y=t_tY;
	}
	public virtual void m_Render(){
		bb_gfx_GFX.g_Draw(f_X,f_Y,0,96,g_Width,64);
	}
}
class bb_tree_Tree : Object{
	public virtual void m_Update(){
	}
	public virtual void m_Render(){
	}
}
class bb_list_List : Object{
	public virtual bb_list_List g_List_new(){
		return this;
	}
	public bb_list_Node f__head=((new bb_list_HeadNode()).g_HeadNode_new());
	public virtual bb_list_Node m_AddLast(bb_tree_Tree t_data){
		return (new bb_list_Node()).g_Node_new(f__head,f__head.f__pred,t_data);
	}
	public virtual bb_list_List g_List_new2(bb_tree_Tree[] t_data){
		bb_tree_Tree[] t_=t_data;
		int t_2=0;
		while(t_2<bb_std_lang.length(t_)){
			bb_tree_Tree t_t=t_[t_2];
			t_2=t_2+1;
			m_AddLast(t_t);
		}
		return this;
	}
	public virtual bb_list_Enumerator m_ObjectEnumerator(){
		return (new bb_list_Enumerator()).g_Enumerator_new(this);
	}
}
class bb_list_Node : Object{
	public bb_list_Node f__succ=null;
	public bb_list_Node f__pred=null;
	public bb_tree_Tree f__data=null;
	public virtual bb_list_Node g_Node_new(bb_list_Node t_succ,bb_list_Node t_pred,bb_tree_Tree t_data){
		f__succ=t_succ;
		f__pred=t_pred;
		f__succ.f__pred=this;
		f__pred.f__succ=this;
		f__data=t_data;
		return this;
	}
	public virtual bb_list_Node g_Node_new2(){
		return this;
	}
}
class bb_list_HeadNode : bb_list_Node{
	public virtual bb_list_HeadNode g_HeadNode_new(){
		base.g_Node_new2();
		f__succ=(this);
		f__pred=(this);
		return this;
	}
}
class bb_house_House : Object{
	public virtual void m_Update(){
	}
	public virtual void m_Render(){
	}
}
class bb_list_List2 : Object{
	public virtual bb_list_List2 g_List_new(){
		return this;
	}
	public bb_list_Node2 f__head=((new bb_list_HeadNode2()).g_HeadNode_new());
	public virtual bb_list_Node2 m_AddLast2(bb_house_House t_data){
		return (new bb_list_Node2()).g_Node_new(f__head,f__head.f__pred,t_data);
	}
	public virtual bb_list_List2 g_List_new2(bb_house_House[] t_data){
		bb_house_House[] t_=t_data;
		int t_2=0;
		while(t_2<bb_std_lang.length(t_)){
			bb_house_House t_t=t_[t_2];
			t_2=t_2+1;
			m_AddLast2(t_t);
		}
		return this;
	}
	public virtual bb_list_Enumerator2 m_ObjectEnumerator(){
		return (new bb_list_Enumerator2()).g_Enumerator_new(this);
	}
}
class bb_list_Node2 : Object{
	public bb_list_Node2 f__succ=null;
	public bb_list_Node2 f__pred=null;
	public bb_house_House f__data=null;
	public virtual bb_list_Node2 g_Node_new(bb_list_Node2 t_succ,bb_list_Node2 t_pred,bb_house_House t_data){
		f__succ=t_succ;
		f__pred=t_pred;
		f__succ.f__pred=this;
		f__pred.f__succ=this;
		f__data=t_data;
		return this;
	}
	public virtual bb_list_Node2 g_Node_new2(){
		return this;
	}
}
class bb_list_HeadNode2 : bb_list_Node2{
	public virtual bb_list_HeadNode2 g_HeadNode_new(){
		base.g_Node_new2();
		f__succ=(this);
		f__pred=(this);
		return this;
	}
}
class bb_star_Star : Object{
	public virtual void m_Update(){
	}
	public virtual void m_Render(){
	}
}
class bb_list_List3 : Object{
	public virtual bb_list_List3 g_List_new(){
		return this;
	}
	public bb_list_Node3 f__head=((new bb_list_HeadNode3()).g_HeadNode_new());
	public virtual bb_list_Node3 m_AddLast3(bb_star_Star t_data){
		return (new bb_list_Node3()).g_Node_new(f__head,f__head.f__pred,t_data);
	}
	public virtual bb_list_List3 g_List_new2(bb_star_Star[] t_data){
		bb_star_Star[] t_=t_data;
		int t_2=0;
		while(t_2<bb_std_lang.length(t_)){
			bb_star_Star t_t=t_[t_2];
			t_2=t_2+1;
			m_AddLast3(t_t);
		}
		return this;
	}
	public virtual bb_list_Enumerator3 m_ObjectEnumerator(){
		return (new bb_list_Enumerator3()).g_Enumerator_new(this);
	}
}
class bb_list_Node3 : Object{
	public bb_list_Node3 f__succ=null;
	public bb_list_Node3 f__pred=null;
	public bb_star_Star f__data=null;
	public virtual bb_list_Node3 g_Node_new(bb_list_Node3 t_succ,bb_list_Node3 t_pred,bb_star_Star t_data){
		f__succ=t_succ;
		f__pred=t_pred;
		f__succ.f__pred=this;
		f__pred.f__succ=this;
		f__data=t_data;
		return this;
	}
	public virtual bb_list_Node3 g_Node_new2(){
		return this;
	}
}
class bb_list_HeadNode3 : bb_list_Node3{
	public virtual bb_list_HeadNode3 g_HeadNode_new(){
		base.g_Node_new2();
		f__succ=(this);
		f__pred=(this);
		return this;
	}
}
class bb_snowman_Snowman : Object{
	public virtual void m_Update(){
	}
	public virtual void m_Render(){
	}
}
class bb_list_List4 : Object{
	public virtual bb_list_List4 g_List_new(){
		return this;
	}
	public bb_list_Node4 f__head=((new bb_list_HeadNode4()).g_HeadNode_new());
	public virtual bb_list_Node4 m_AddLast4(bb_snowman_Snowman t_data){
		return (new bb_list_Node4()).g_Node_new(f__head,f__head.f__pred,t_data);
	}
	public virtual bb_list_List4 g_List_new2(bb_snowman_Snowman[] t_data){
		bb_snowman_Snowman[] t_=t_data;
		int t_2=0;
		while(t_2<bb_std_lang.length(t_)){
			bb_snowman_Snowman t_t=t_[t_2];
			t_2=t_2+1;
			m_AddLast4(t_t);
		}
		return this;
	}
	public virtual bb_list_Enumerator4 m_ObjectEnumerator(){
		return (new bb_list_Enumerator4()).g_Enumerator_new(this);
	}
}
class bb_list_Node4 : Object{
	public bb_list_Node4 f__succ=null;
	public bb_list_Node4 f__pred=null;
	public bb_snowman_Snowman f__data=null;
	public virtual bb_list_Node4 g_Node_new(bb_list_Node4 t_succ,bb_list_Node4 t_pred,bb_snowman_Snowman t_data){
		f__succ=t_succ;
		f__pred=t_pred;
		f__succ.f__pred=this;
		f__pred.f__succ=this;
		f__data=t_data;
		return this;
	}
	public virtual bb_list_Node4 g_Node_new2(){
		return this;
	}
}
class bb_list_HeadNode4 : bb_list_Node4{
	public virtual bb_list_HeadNode4 g_HeadNode_new(){
		base.g_Node_new2();
		f__succ=(this);
		f__pred=(this);
		return this;
	}
}
class bb_snowflake_Snowflake : Object{
	public float f_XS=.0f;
	public float f_X=.0f;
	public float f_YS=.0f;
	public float f_Y=.0f;
	public bb_scene_Scene f_scene=null;
	public virtual void m_Update(){
		f_X+=f_XS;
		f_Y+=f_YS;
		f_XS+=bb_random.bb_random_Rnd2(-0.5f,0.5f);
		f_YS+=bb_random.bb_random_Rnd2(-0.1f,0.1f);
		if(f_YS<0.0f){
			f_YS=0.0f;
		}
		if(f_X>(float)(bb_scene_Scene.g_Width+16) || f_Y>(float)(bb_scene_Scene.g_Height+16)){
			f_scene.f_Snowflakes.m_Remove(this);
		}
	}
	public int f_Frame=0;
	public virtual bb_snowflake_Snowflake g_Snowflake_new(bb_scene_Scene t_tS){
		f_scene=t_tS;
		f_Frame=0;
		return this;
	}
	public virtual bb_snowflake_Snowflake g_Snowflake_new2(){
		return this;
	}
	public virtual void m_Render(){
		bb_gfx_GFX.g_Draw((int)(f_X),(int)(f_Y),0+f_Frame*16,0,16,16);
	}
}
class bb_list_List5 : Object{
	public virtual bb_list_List5 g_List_new(){
		return this;
	}
	public bb_list_Node5 f__head=((new bb_list_HeadNode5()).g_HeadNode_new());
	public virtual bb_list_Node5 m_AddLast5(bb_snowflake_Snowflake t_data){
		return (new bb_list_Node5()).g_Node_new(f__head,f__head.f__pred,t_data);
	}
	public virtual bb_list_List5 g_List_new2(bb_snowflake_Snowflake[] t_data){
		bb_snowflake_Snowflake[] t_=t_data;
		int t_2=0;
		while(t_2<bb_std_lang.length(t_)){
			bb_snowflake_Snowflake t_t=t_[t_2];
			t_2=t_2+1;
			m_AddLast5(t_t);
		}
		return this;
	}
	public virtual bb_list_Enumerator5 m_ObjectEnumerator(){
		return (new bb_list_Enumerator5()).g_Enumerator_new(this);
	}
	public virtual bool m_Equals(bb_snowflake_Snowflake t_lhs,bb_snowflake_Snowflake t_rhs){
		return t_lhs==t_rhs;
	}
	public virtual int m_RemoveEach(bb_snowflake_Snowflake t_value){
		bb_list_Node5 t_node=f__head.f__succ;
		while(t_node!=f__head){
			bb_list_Node5 t_succ=t_node.f__succ;
			if(m_Equals(t_node.f__data,t_value)){
				t_node.m_Remove2();
			}
			t_node=t_succ;
		}
		return 0;
	}
	public virtual int m_Remove(bb_snowflake_Snowflake t_value){
		m_RemoveEach(t_value);
		return 0;
	}
}
class bb_list_Node5 : Object{
	public bb_list_Node5 f__succ=null;
	public bb_list_Node5 f__pred=null;
	public bb_snowflake_Snowflake f__data=null;
	public virtual bb_list_Node5 g_Node_new(bb_list_Node5 t_succ,bb_list_Node5 t_pred,bb_snowflake_Snowflake t_data){
		f__succ=t_succ;
		f__pred=t_pred;
		f__succ.f__pred=this;
		f__pred.f__succ=this;
		f__data=t_data;
		return this;
	}
	public virtual bb_list_Node5 g_Node_new2(){
		return this;
	}
	public virtual int m_Remove2(){
		f__succ.f__pred=f__pred;
		f__pred.f__succ=f__succ;
		return 0;
	}
}
class bb_list_HeadNode5 : bb_list_Node5{
	public virtual bb_list_HeadNode5 g_HeadNode_new(){
		base.g_Node_new2();
		f__succ=(this);
		f__pred=(this);
		return this;
	}
}
class bb_moon_Moon : Object{
	public bb_scene_Scene f_scene=null;
	public virtual bb_moon_Moon g_Moon_new(bb_scene_Scene t_tS){
		f_scene=t_tS;
		return this;
	}
	public virtual bb_moon_Moon g_Moon_new2(){
		return this;
	}
	public float f_X=.0f;
	public float f_Y=.0f;
	public float f_Frame=.0f;
	public virtual void m_Set(float t_tX,float t_tY,int t_tF){
		f_X=t_tX;
		f_Y=t_tY;
		f_Frame=(float)(t_tF);
	}
	public virtual void m_Render(){
		bb_gfx_GFX.g_Draw((int)(f_X),(int)(f_Y),(int)(0.0f+f_Frame*32.0f),0,32,32);
	}
}
class bb_list_Enumerator : Object{
	public bb_list_List f__list=null;
	public bb_list_Node f__curr=null;
	public virtual bb_list_Enumerator g_Enumerator_new(bb_list_List t_list){
		f__list=t_list;
		f__curr=t_list.f__head.f__succ;
		return this;
	}
	public virtual bb_list_Enumerator g_Enumerator_new2(){
		return this;
	}
	public virtual bool m_HasNext(){
		while(f__curr.f__succ.f__pred!=f__curr){
			f__curr=f__curr.f__succ;
		}
		return f__curr!=f__list.f__head;
	}
	public virtual bb_tree_Tree m_NextObject(){
		bb_tree_Tree t_data=f__curr.f__data;
		f__curr=f__curr.f__succ;
		return t_data;
	}
}
class bb_list_Enumerator2 : Object{
	public bb_list_List2 f__list=null;
	public bb_list_Node2 f__curr=null;
	public virtual bb_list_Enumerator2 g_Enumerator_new(bb_list_List2 t_list){
		f__list=t_list;
		f__curr=t_list.f__head.f__succ;
		return this;
	}
	public virtual bb_list_Enumerator2 g_Enumerator_new2(){
		return this;
	}
	public virtual bool m_HasNext(){
		while(f__curr.f__succ.f__pred!=f__curr){
			f__curr=f__curr.f__succ;
		}
		return f__curr!=f__list.f__head;
	}
	public virtual bb_house_House m_NextObject(){
		bb_house_House t_data=f__curr.f__data;
		f__curr=f__curr.f__succ;
		return t_data;
	}
}
class bb_list_Enumerator3 : Object{
	public bb_list_List3 f__list=null;
	public bb_list_Node3 f__curr=null;
	public virtual bb_list_Enumerator3 g_Enumerator_new(bb_list_List3 t_list){
		f__list=t_list;
		f__curr=t_list.f__head.f__succ;
		return this;
	}
	public virtual bb_list_Enumerator3 g_Enumerator_new2(){
		return this;
	}
	public virtual bool m_HasNext(){
		while(f__curr.f__succ.f__pred!=f__curr){
			f__curr=f__curr.f__succ;
		}
		return f__curr!=f__list.f__head;
	}
	public virtual bb_star_Star m_NextObject(){
		bb_star_Star t_data=f__curr.f__data;
		f__curr=f__curr.f__succ;
		return t_data;
	}
}
class bb_list_Enumerator4 : Object{
	public bb_list_List4 f__list=null;
	public bb_list_Node4 f__curr=null;
	public virtual bb_list_Enumerator4 g_Enumerator_new(bb_list_List4 t_list){
		f__list=t_list;
		f__curr=t_list.f__head.f__succ;
		return this;
	}
	public virtual bb_list_Enumerator4 g_Enumerator_new2(){
		return this;
	}
	public virtual bool m_HasNext(){
		while(f__curr.f__succ.f__pred!=f__curr){
			f__curr=f__curr.f__succ;
		}
		return f__curr!=f__list.f__head;
	}
	public virtual bb_snowman_Snowman m_NextObject(){
		bb_snowman_Snowman t_data=f__curr.f__data;
		f__curr=f__curr.f__succ;
		return t_data;
	}
}
class bb_list_Enumerator5 : Object{
	public bb_list_List5 f__list=null;
	public bb_list_Node5 f__curr=null;
	public virtual bb_list_Enumerator5 g_Enumerator_new(bb_list_List5 t_list){
		f__list=t_list;
		f__curr=t_list.f__head.f__succ;
		return this;
	}
	public virtual bb_list_Enumerator5 g_Enumerator_new2(){
		return this;
	}
	public virtual bool m_HasNext(){
		while(f__curr.f__succ.f__pred!=f__curr){
			f__curr=f__curr.f__succ;
		}
		return f__curr!=f__list.f__head;
	}
	public virtual bb_snowflake_Snowflake m_NextObject(){
		bb_snowflake_Snowflake t_data=f__curr.f__data;
		f__curr=f__curr.f__succ;
		return t_data;
	}
}
class bb_autofit{
	public static int bb_autofit_SetVirtualDisplay(int t_width,int t_height,float t_zoom){
		(new bb_autofit_VirtualDisplay()).g_VirtualDisplay_new(t_width,t_height,t_zoom);
		return 0;
	}
	public static int bb_autofit_UpdateVirtualDisplay(bool t_zoomborders,bool t_keepborders){
		bb_autofit_VirtualDisplay.g_Display.m_UpdateVirtualDisplay(t_zoomborders,t_keepborders);
		return 0;
	}
}
class bb_floorsegment{
}
class bb_functions{
}
class bb_gfx{
}
class bb_house{
}
class bb_houselight{
}
class bb_moon{
}
class bb_scene{
	public static bb_scene_Scene bb_scene_GenerateScene(){
		bb_scene_Scene t_tS=(new bb_scene_Scene()).g_Scene_new();
		float t_sY=bb_random.bb_random_Rnd2((float)(bb_scene_Scene.g_Height)*0.66f,(float)(bb_scene_Scene.g_Height)*0.9f);
		float t_fY=t_sY;
		float t_maxFlux=bb_random.bb_random_Rnd2(5.0f,30.0f);
		for(int t_i=0;t_i<t_tS.f_FloorSegmentCount;t_i=t_i+1){
			int t_fX=t_i*bb_floorsegment_FloorSegment.g_Width;
			t_tS.f_FloorSegments[t_i].m_SetPos(t_fX,(int)(t_fY));
			t_fY=t_sY+(float)Math.Sin(((float)(t_fX))*bb_std_lang.D2R)*t_maxFlux;
		}
		t_tS.f_moon.m_Set(bb_random.bb_random_Rnd2(-32.0f,(float)(bb_scene_Scene.g_Width-32)),bb_random.bb_random_Rnd2(-32.0f,(float)(bb_scene_Scene.g_Height)*0.33f),(int)(bb_random.bb_random_Rnd2(0.0f,6.0f)));
		return t_tS;
	}
}
class bb_sfx{
}
class bb_snowflake{
}
class bb_snowman{
}
class bb_star{
}
class bb_tree{
}
class bb_treelight{
}
class bb_{
	public static int bbMain(){
		(new bb__XmasApp()).g_XmasApp_new();
		return 0;
	}
	public static int bbInit(){
		bb_graphics.bb_graphics_device=null;
		bb_input.bb_input_device=null;
		bb_audio.bb_audio_device=null;
		bb_app.bb_app_device=null;
		bb_graphics.bb_graphics_context=(new bb_graphics_GraphicsContext()).g_GraphicsContext_new();
		bb_graphics_Image.g_DefaultFlags=0;
		bb_graphics.bb_graphics_renderDevice=null;
		bb_random.bb_random_Seed=1234;
		bb_gfx_GFX.g_Tileset=null;
		bb_scene_Scene.g_Background=null;
		bb_sfx_SFX.g_ActiveChannel=0;
		bb_sfx_SFX.g_Sounds=null;
		bb_sfx_SFX.g_Musics=null;
		bb_autofit_VirtualDisplay.g_Display=null;
		bb_scene_Scene.g_Width=360;
		bb_floorsegment_FloorSegment.g_Width=8;
		bb_scene_Scene.g_Height=240;
		return 0;
	}
}
class bb_asyncevent{
}
class bb_databuffer{
}
class bb_thread{
}
class bb_app{
	public static bb_app_AppDevice bb_app_device;
	public static int bb_app_SetUpdateRate(int t_hertz){
		return bb_app.bb_app_device.SetUpdateRate(t_hertz);
	}
}
class bb_asyncimageloader{
}
class bb_asyncloaders{
}
class bb_asyncsoundloader{
}
class bb_audio{
	public static gxtkAudio bb_audio_device;
	public static int bb_audio_SetAudioDevice(gxtkAudio t_dev){
		bb_audio.bb_audio_device=t_dev;
		return 0;
	}
}
class bb_audiodevice{
}
class bb_data{
	public static String bb_data_FixDataPath(String t_path){
		int t_i=t_path.IndexOf(":/",0);
		if(t_i!=-1 && t_path.IndexOf("/",0)==t_i+1){
			return t_path;
		}
		if(t_path.StartsWith("./") || t_path.StartsWith("/")){
			return t_path;
		}
		return "monkey://data/"+t_path;
	}
}
class bb_graphics{
	public static gxtkGraphics bb_graphics_device;
	public static int bb_graphics_SetGraphicsDevice(gxtkGraphics t_dev){
		bb_graphics.bb_graphics_device=t_dev;
		return 0;
	}
	public static bb_graphics_GraphicsContext bb_graphics_context;
	public static bb_graphics_Image bb_graphics_LoadImage(String t_path,int t_frameCount,int t_flags){
		gxtkSurface t_surf=bb_graphics.bb_graphics_device.LoadSurface(bb_data.bb_data_FixDataPath(t_path));
		if((t_surf)!=null){
			return ((new bb_graphics_Image()).g_Image_new()).m_Init(t_surf,t_frameCount,t_flags);
		}
		return null;
	}
	public static bb_graphics_Image bb_graphics_LoadImage2(String t_path,int t_frameWidth,int t_frameHeight,int t_frameCount,int t_flags){
		bb_graphics_Image t_atlas=bb_graphics.bb_graphics_LoadImage(t_path,1,0);
		if((t_atlas)!=null){
			return t_atlas.m_GrabImage(0,0,t_frameWidth,t_frameHeight,t_frameCount,t_flags);
		}
		return null;
	}
	public static int bb_graphics_SetFont(bb_graphics_Image t_font,int t_firstChar){
		if(!((t_font)!=null)){
			if(!((bb_graphics.bb_graphics_context.f_defaultFont)!=null)){
				bb_graphics.bb_graphics_context.f_defaultFont=bb_graphics.bb_graphics_LoadImage("mojo_font.png",96,2);
			}
			t_font=bb_graphics.bb_graphics_context.f_defaultFont;
			t_firstChar=32;
		}
		bb_graphics.bb_graphics_context.f_font=t_font;
		bb_graphics.bb_graphics_context.f_firstChar=t_firstChar;
		return 0;
	}
	public static gxtkGraphics bb_graphics_renderDevice;
	public static int bb_graphics_SetMatrix(float t_ix,float t_iy,float t_jx,float t_jy,float t_tx,float t_ty){
		bb_graphics.bb_graphics_context.f_ix=t_ix;
		bb_graphics.bb_graphics_context.f_iy=t_iy;
		bb_graphics.bb_graphics_context.f_jx=t_jx;
		bb_graphics.bb_graphics_context.f_jy=t_jy;
		bb_graphics.bb_graphics_context.f_tx=t_tx;
		bb_graphics.bb_graphics_context.f_ty=t_ty;
		bb_graphics.bb_graphics_context.f_tformed=((t_ix!=1.0f || t_iy!=0.0f || t_jx!=0.0f || t_jy!=1.0f || t_tx!=0.0f || t_ty!=0.0f)?1:0);
		bb_graphics.bb_graphics_context.f_matDirty=1;
		return 0;
	}
	public static int bb_graphics_SetMatrix2(float[] t_m){
		bb_graphics.bb_graphics_SetMatrix(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
		return 0;
	}
	public static int bb_graphics_SetColor(float t_r,float t_g,float t_b){
		bb_graphics.bb_graphics_context.f_color_r=t_r;
		bb_graphics.bb_graphics_context.f_color_g=t_g;
		bb_graphics.bb_graphics_context.f_color_b=t_b;
		bb_graphics.bb_graphics_renderDevice.SetColor(t_r,t_g,t_b);
		return 0;
	}
	public static int bb_graphics_SetAlpha(float t_alpha){
		bb_graphics.bb_graphics_context.f_alpha=t_alpha;
		bb_graphics.bb_graphics_renderDevice.SetAlpha(t_alpha);
		return 0;
	}
	public static int bb_graphics_SetBlend(int t_blend){
		bb_graphics.bb_graphics_context.f_blend=t_blend;
		bb_graphics.bb_graphics_renderDevice.SetBlend(t_blend);
		return 0;
	}
	public static int bb_graphics_DeviceWidth(){
		return bb_graphics.bb_graphics_device.Width();
	}
	public static int bb_graphics_DeviceHeight(){
		return bb_graphics.bb_graphics_device.Height();
	}
	public static int bb_graphics_SetScissor(float t_x,float t_y,float t_width,float t_height){
		bb_graphics.bb_graphics_context.f_scissor_x=t_x;
		bb_graphics.bb_graphics_context.f_scissor_y=t_y;
		bb_graphics.bb_graphics_context.f_scissor_width=t_width;
		bb_graphics.bb_graphics_context.f_scissor_height=t_height;
		bb_graphics.bb_graphics_renderDevice.SetScissor((int)(t_x),(int)(t_y),(int)(t_width),(int)(t_height));
		return 0;
	}
	public static int bb_graphics_BeginRender(){
		if(!((bb_graphics.bb_graphics_device.Mode())!=0)){
			return 0;
		}
		bb_graphics.bb_graphics_renderDevice=bb_graphics.bb_graphics_device;
		bb_graphics.bb_graphics_context.f_matrixSp=0;
		bb_graphics.bb_graphics_SetMatrix(1.0f,0.0f,0.0f,1.0f,0.0f,0.0f);
		bb_graphics.bb_graphics_SetColor(255.0f,255.0f,255.0f);
		bb_graphics.bb_graphics_SetAlpha(1.0f);
		bb_graphics.bb_graphics_SetBlend(0);
		bb_graphics.bb_graphics_SetScissor(0.0f,0.0f,(float)(bb_graphics.bb_graphics_DeviceWidth()),(float)(bb_graphics.bb_graphics_DeviceHeight()));
		return 0;
	}
	public static int bb_graphics_EndRender(){
		bb_graphics.bb_graphics_renderDevice=null;
		return 0;
	}
	public static int bb_graphics_Cls(float t_r,float t_g,float t_b){
		bb_graphics.bb_graphics_renderDevice.Cls(t_r,t_g,t_b);
		return 0;
	}
	public static int bb_graphics_Transform(float t_ix,float t_iy,float t_jx,float t_jy,float t_tx,float t_ty){
		float t_ix2=t_ix*bb_graphics.bb_graphics_context.f_ix+t_iy*bb_graphics.bb_graphics_context.f_jx;
		float t_iy2=t_ix*bb_graphics.bb_graphics_context.f_iy+t_iy*bb_graphics.bb_graphics_context.f_jy;
		float t_jx2=t_jx*bb_graphics.bb_graphics_context.f_ix+t_jy*bb_graphics.bb_graphics_context.f_jx;
		float t_jy2=t_jx*bb_graphics.bb_graphics_context.f_iy+t_jy*bb_graphics.bb_graphics_context.f_jy;
		float t_tx2=t_tx*bb_graphics.bb_graphics_context.f_ix+t_ty*bb_graphics.bb_graphics_context.f_jx+bb_graphics.bb_graphics_context.f_tx;
		float t_ty2=t_tx*bb_graphics.bb_graphics_context.f_iy+t_ty*bb_graphics.bb_graphics_context.f_jy+bb_graphics.bb_graphics_context.f_ty;
		bb_graphics.bb_graphics_SetMatrix(t_ix2,t_iy2,t_jx2,t_jy2,t_tx2,t_ty2);
		return 0;
	}
	public static int bb_graphics_Transform2(float[] t_m){
		bb_graphics.bb_graphics_Transform(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
		return 0;
	}
	public static int bb_graphics_Scale(float t_x,float t_y){
		bb_graphics.bb_graphics_Transform(t_x,0.0f,0.0f,t_y,0.0f,0.0f);
		return 0;
	}
	public static int bb_graphics_Translate(float t_x,float t_y){
		bb_graphics.bb_graphics_Transform(1.0f,0.0f,0.0f,1.0f,t_x,t_y);
		return 0;
	}
	public static int bb_graphics_PushMatrix(){
		int t_sp=bb_graphics.bb_graphics_context.f_matrixSp;
		bb_graphics.bb_graphics_context.f_matrixStack[t_sp+0]=bb_graphics.bb_graphics_context.f_ix;
		bb_graphics.bb_graphics_context.f_matrixStack[t_sp+1]=bb_graphics.bb_graphics_context.f_iy;
		bb_graphics.bb_graphics_context.f_matrixStack[t_sp+2]=bb_graphics.bb_graphics_context.f_jx;
		bb_graphics.bb_graphics_context.f_matrixStack[t_sp+3]=bb_graphics.bb_graphics_context.f_jy;
		bb_graphics.bb_graphics_context.f_matrixStack[t_sp+4]=bb_graphics.bb_graphics_context.f_tx;
		bb_graphics.bb_graphics_context.f_matrixStack[t_sp+5]=bb_graphics.bb_graphics_context.f_ty;
		bb_graphics.bb_graphics_context.f_matrixSp=t_sp+6;
		return 0;
	}
	public static int bb_graphics_PopMatrix(){
		int t_sp=bb_graphics.bb_graphics_context.f_matrixSp-6;
		bb_graphics.bb_graphics_SetMatrix(bb_graphics.bb_graphics_context.f_matrixStack[t_sp+0],bb_graphics.bb_graphics_context.f_matrixStack[t_sp+1],bb_graphics.bb_graphics_context.f_matrixStack[t_sp+2],bb_graphics.bb_graphics_context.f_matrixStack[t_sp+3],bb_graphics.bb_graphics_context.f_matrixStack[t_sp+4],bb_graphics.bb_graphics_context.f_matrixStack[t_sp+5]);
		bb_graphics.bb_graphics_context.f_matrixSp=t_sp;
		return 0;
	}
	public static int bb_graphics_DrawImage(bb_graphics_Image t_image,float t_x,float t_y,int t_frame){
		bb_graphics_Frame t_f=t_image.f_frames[t_frame];
		if((bb_graphics.bb_graphics_context.f_tformed)!=0){
			bb_graphics.bb_graphics_PushMatrix();
			bb_graphics.bb_graphics_Translate(t_x-t_image.f_tx,t_y-t_image.f_ty);
			bb_graphics.bb_graphics_context.m_Validate();
			if((t_image.f_flags&65536)!=0){
				bb_graphics.bb_graphics_renderDevice.DrawSurface(t_image.f_surface,0.0f,0.0f);
			}else{
				bb_graphics.bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0f,0.0f,t_f.f_x,t_f.f_y,t_image.f_width,t_image.f_height);
			}
			bb_graphics.bb_graphics_PopMatrix();
		}else{
			bb_graphics.bb_graphics_context.m_Validate();
			if((t_image.f_flags&65536)!=0){
				bb_graphics.bb_graphics_renderDevice.DrawSurface(t_image.f_surface,t_x-t_image.f_tx,t_y-t_image.f_ty);
			}else{
				bb_graphics.bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,t_x-t_image.f_tx,t_y-t_image.f_ty,t_f.f_x,t_f.f_y,t_image.f_width,t_image.f_height);
			}
		}
		return 0;
	}
	public static int bb_graphics_Rotate(float t_angle){
		bb_graphics.bb_graphics_Transform((float)Math.Cos((t_angle)*bb_std_lang.D2R),-(float)Math.Sin((t_angle)*bb_std_lang.D2R),(float)Math.Sin((t_angle)*bb_std_lang.D2R),(float)Math.Cos((t_angle)*bb_std_lang.D2R),0.0f,0.0f);
		return 0;
	}
	public static int bb_graphics_DrawImage2(bb_graphics_Image t_image,float t_x,float t_y,float t_rotation,float t_scaleX,float t_scaleY,int t_frame){
		bb_graphics_Frame t_f=t_image.f_frames[t_frame];
		bb_graphics.bb_graphics_PushMatrix();
		bb_graphics.bb_graphics_Translate(t_x,t_y);
		bb_graphics.bb_graphics_Rotate(t_rotation);
		bb_graphics.bb_graphics_Scale(t_scaleX,t_scaleY);
		bb_graphics.bb_graphics_Translate(-t_image.f_tx,-t_image.f_ty);
		bb_graphics.bb_graphics_context.m_Validate();
		if((t_image.f_flags&65536)!=0){
			bb_graphics.bb_graphics_renderDevice.DrawSurface(t_image.f_surface,0.0f,0.0f);
		}else{
			bb_graphics.bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0f,0.0f,t_f.f_x,t_f.f_y,t_image.f_width,t_image.f_height);
		}
		bb_graphics.bb_graphics_PopMatrix();
		return 0;
	}
	public static int bb_graphics_DrawImageRect(bb_graphics_Image t_image,float t_x,float t_y,int t_srcX,int t_srcY,int t_srcWidth,int t_srcHeight,int t_frame){
		bb_graphics_Frame t_f=t_image.f_frames[t_frame];
		if((bb_graphics.bb_graphics_context.f_tformed)!=0){
			bb_graphics.bb_graphics_PushMatrix();
			bb_graphics.bb_graphics_Translate(-t_image.f_tx+t_x,-t_image.f_ty+t_y);
			bb_graphics.bb_graphics_context.m_Validate();
			bb_graphics.bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0f,0.0f,t_srcX+t_f.f_x,t_srcY+t_f.f_y,t_srcWidth,t_srcHeight);
			bb_graphics.bb_graphics_PopMatrix();
		}else{
			bb_graphics.bb_graphics_context.m_Validate();
			bb_graphics.bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,-t_image.f_tx+t_x,-t_image.f_ty+t_y,t_srcX+t_f.f_x,t_srcY+t_f.f_y,t_srcWidth,t_srcHeight);
		}
		return 0;
	}
	public static int bb_graphics_DrawImageRect2(bb_graphics_Image t_image,float t_x,float t_y,int t_srcX,int t_srcY,int t_srcWidth,int t_srcHeight,float t_rotation,float t_scaleX,float t_scaleY,int t_frame){
		bb_graphics_Frame t_f=t_image.f_frames[t_frame];
		bb_graphics.bb_graphics_PushMatrix();
		bb_graphics.bb_graphics_Translate(t_x,t_y);
		bb_graphics.bb_graphics_Rotate(t_rotation);
		bb_graphics.bb_graphics_Scale(t_scaleX,t_scaleY);
		bb_graphics.bb_graphics_Translate(-t_image.f_tx,-t_image.f_ty);
		bb_graphics.bb_graphics_context.m_Validate();
		bb_graphics.bb_graphics_renderDevice.DrawSurface2(t_image.f_surface,0.0f,0.0f,t_srcX+t_f.f_x,t_srcY+t_f.f_y,t_srcWidth,t_srcHeight);
		bb_graphics.bb_graphics_PopMatrix();
		return 0;
	}
}
class bb_graphicsdevice{
}
class bb_input{
	public static gxtkInput bb_input_device;
	public static int bb_input_SetInputDevice(gxtkInput t_dev){
		bb_input.bb_input_device=t_dev;
		return 0;
	}
}
class bb_inputdevice{
}
class bb_mojo{
}
class bb_boxes{
}
class bb_lang{
}
class bb_list{
}
class bb_map{
}
class bb_math{
	public static int bb_math_Max(int t_x,int t_y){
		if(t_x>t_y){
			return t_x;
		}
		return t_y;
	}
	public static float bb_math_Max2(float t_x,float t_y){
		if(t_x>t_y){
			return t_x;
		}
		return t_y;
	}
	public static int bb_math_Min(int t_x,int t_y){
		if(t_x<t_y){
			return t_x;
		}
		return t_y;
	}
	public static float bb_math_Min2(float t_x,float t_y){
		if(t_x<t_y){
			return t_x;
		}
		return t_y;
	}
}
class bb_monkey{
}
class bb_random{
	public static int bb_random_Seed;
	public static float bb_random_Rnd(){
		bb_random.bb_random_Seed=bb_random.bb_random_Seed*1664525+1013904223|0;
		return (float)(bb_random.bb_random_Seed>>8&16777215)/16777216.0f;
	}
	public static float bb_random_Rnd2(float t_low,float t_high){
		return bb_random.bb_random_Rnd3(t_high-t_low)+t_low;
	}
	public static float bb_random_Rnd3(float t_range){
		return bb_random.bb_random_Rnd()*t_range;
	}
}
class bb_set{
}
class bb_stack{
}
//${TRANSCODE_END}
