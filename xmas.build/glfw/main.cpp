
#include "main.h"

//${CONFIG_BEGIN}
#define CFG_BINARY_FILES *.bin|*.dat
#define CFG_CD 
#define CFG_CONFIG release
#define CFG_GLFW_USE_MINGW 0
#define CFG_GLFW_WINDOW_FULLSCREEN 0
#define CFG_GLFW_WINDOW_HEIGHT 480
#define CFG_GLFW_WINDOW_RESIZABLE 0
#define CFG_GLFW_WINDOW_TITLE Monkey Game
#define CFG_GLFW_WINDOW_WIDTH 640
#define CFG_HOST winnt
#define CFG_IMAGE_FILES *.png|*.jpg
#define CFG_LANG cpp
#define CFG_MODPATH .;C:/Users/Chris/Documents/GitHub/CM-XMAS-2012;C:/apps/MonkeyPro66/modules
#define CFG_MOJO_AUTO_SUSPEND_ENABLED 0
#define CFG_MOJO_IMAGE_FILTERING_ENABLED 1
#define CFG_MUSIC_FILES *.wav|*.ogg
#define CFG_OPENGL_DEPTH_BUFFER_ENABLED 0
#define CFG_OPENGL_GLES20_ENABLED 0
#define CFG_SAFEMODE 0
#define CFG_SOUND_FILES *.wav|*.ogg
#define CFG_TARGET glfw
#define CFG_TEXT_FILES *.txt|*.xml|*.json
#define CFG_TRANSDIR 
//${CONFIG_END}

#define _QUOTE(X) #X
#define _STRINGIZE( X ) _QUOTE(X)

//For monkey main to set...
int (*runner)();

//${TRANSCODE_BEGIN}

// C++ Monkey runtime.
//
// Placed into the public domain 24/02/2011.
// No warranty implied; use at your own risk.

//***** Monkey Types *****

typedef wchar_t Char;
template<class T> class Array;
class String;
class Object;

#if CFG_CPP_DOUBLE_PRECISION_FLOATS
typedef double Float;
#define FLOAT(X) X
#else
typedef float Float;
#define FLOAT(X) X##f
#endif

void dbg_error( const char *p );

#if !_MSC_VER
#define sprintf_s sprintf
#define sscanf_s sscanf
#endif

//***** GC Config *****

//How many objects to mark per update/render
//
#ifndef CFG_CPP_GC_MARK_RATE
#define CFG_CPP_GC_MARK_RATE 2500
#endif

//How much to alloc before GC - set to 0 for continuous GC
//
#ifndef CFG_CPP_GC_TRIGGER
#define CFG_CPP_GC_TRIGGER 4*1024*1024
#endif

//#define DEBUG_GC 1

// ***** GC *****

#if _WIN32

int gc_micros(){
	static int f;
	static LARGE_INTEGER pcf;
	if( !f ){
		if( QueryPerformanceFrequency( &pcf ) && pcf.QuadPart>=1000000L ){
			pcf.QuadPart/=1000000L;
			f=1;
		}else{
			f=-1;
		}
	}
	if( f>0 ){
		LARGE_INTEGER pc;
		if( QueryPerformanceCounter( &pc ) ) return pc.QuadPart/pcf.QuadPart;
		f=-1;
	}
	return 0;// timeGetTime()*1000;
}

#elif __APPLE__

#include <mach/mach_time.h>

int gc_micros(){
	static int f;
	static mach_timebase_info_data_t timeInfo;
	if( !f ){
		mach_timebase_info( &timeInfo );
		timeInfo.denom*=1000L;
		f=1;
	}
	return mach_absolute_time()*timeInfo.numer/timeInfo.denom;
}

#else

int gc_micros(){
	return 0;
}

#endif

//***** New GC *****

#define gc_mark_roots gc_mark

void gc_mark_roots();

struct gc_object;

gc_object *gc_malloc( int size );
void gc_free( gc_object *p );

struct gc_object{
	gc_object *succ;
	gc_object *pred;
	int flags;
	
	virtual ~gc_object(){
	}
	
	virtual void mark(){
	}
	
	void *operator new( size_t size ){
		return gc_malloc( size );
	}
	
	void operator delete( void *p ){
		gc_free( (gc_object*)p );
	}
};

gc_object gc_free_list;
gc_object gc_marked_list;
gc_object gc_unmarked_list;
gc_object gc_queued_list;

int gc_free_bytes;
int gc_marked_objs;
int gc_marked_bytes;
int gc_alloced_bytes;
int gc_max_alloced_bytes;
int gc_markbit=1;

gc_object *gc_cache[8];

#define GC_LIST_EMPTY( LIST ) ((LIST).succ==&(LIST))

#define GC_REMOVE_NODE( NODE ){\
(NODE)->pred->succ=(NODE)->succ;\
(NODE)->succ->pred=(NODE)->pred;}

#define GC_INSERT_NODE( NODE,SUCC ){\
(NODE)->pred=(SUCC)->pred;\
(NODE)->succ=(SUCC);\
(SUCC)->pred->succ=(NODE);\
(SUCC)->pred=(NODE);}

void gc_init1(){
	gc_free_list.succ=gc_free_list.pred=&gc_free_list;
	gc_marked_list.succ=gc_marked_list.pred=&gc_marked_list;
	gc_unmarked_list.succ=gc_unmarked_list.pred=&gc_unmarked_list;
	gc_queued_list.succ=gc_queued_list.pred=&gc_queued_list;
}

void gc_init2(){
	gc_mark_roots();
}

gc_object *gc_malloc( int size ){

	size=(size+7)&~7;
	
	int t=gc_free_bytes-size;
	while( gc_free_bytes && gc_free_bytes>t ){
		gc_object *p=gc_free_list.succ;
		if( !p || p==&gc_free_list ){
			printf("ERROR:p=%p gc_free_bytes=%i\n",p,gc_free_bytes);
			fflush(stdout);
			gc_free_bytes=0;
			break;
		}
		GC_REMOVE_NODE(p);
		delete p;	//...to gc_free
	}
	
	gc_object *p;
	if( size<64 ){
		if( (p=gc_cache[size>>3]) ){
			gc_cache[size>>3]=p->succ;
		}else{
			p=(gc_object*)malloc( size );
		}
	}else{
		p=(gc_object*)malloc( size );
	}
	
	p->flags=size|gc_markbit;
	
	GC_INSERT_NODE( p,&gc_unmarked_list );
	
	gc_alloced_bytes+=size;
	
	if( gc_alloced_bytes>gc_max_alloced_bytes ) gc_max_alloced_bytes=gc_alloced_bytes;
	
	return p;
}

void gc_free( gc_object *p ){

	int size=p->flags & ~7;
	gc_free_bytes-=size;
	
	if( size<64 ){
		p->succ=gc_cache[size>>3];
		gc_cache[size>>3]=p;
	}else{
		free( p );
	}
}

template<class T> void gc_mark( T *t ){

	gc_object *p=dynamic_cast<gc_object*>(t);
	
	if( p && (p->flags & 3)==gc_markbit ){
		p->flags^=1;
		GC_REMOVE_NODE( p );
		GC_INSERT_NODE( p,&gc_marked_list );
		gc_marked_bytes+=(p->flags & ~7);
		gc_marked_objs+=1;
		p->mark();
	}
}

template<class T> void gc_mark_q( T *t ){

	gc_object *p=dynamic_cast<gc_object*>(t);
	
	if( p && (p->flags & 3)==gc_markbit ){
		p->flags^=1;
		GC_REMOVE_NODE( p );
		GC_INSERT_NODE( p,&gc_queued_list );
	}
}

template<class T,class V> void gc_assign( T *&lhs,V *rhs ){

	gc_object *p=dynamic_cast<gc_object*>(rhs);

	if( p && (p->flags & 3)==gc_markbit ){
		p->flags^=1;
		GC_REMOVE_NODE( p );
		GC_INSERT_NODE( p,&gc_queued_list );
	}

	lhs=rhs;
}

void gc_collect(){

#if DEBUG_GC
	int us=gc_micros();
#endif

	static int last_alloced;
	
	int sweep=0;

#if CFG_CPP_GC_TRIGGER!=0	
	if( gc_alloced_bytes>last_alloced+CFG_CPP_GC_TRIGGER ){
		sweep=1;
	}
#endif	
	
	int tomark=sweep ? 0x7fffffff : gc_marked_objs+CFG_CPP_GC_MARK_RATE;

	while( !GC_LIST_EMPTY( gc_queued_list ) && gc_marked_objs<tomark ){
		gc_object *p=gc_queued_list.succ;
		GC_REMOVE_NODE( p );
		GC_INSERT_NODE( p,&gc_marked_list );
		gc_marked_bytes+=(p->flags & ~7);
		gc_marked_objs+=1;
		p->mark();
	}

#if CFG_CPP_GC_TRIGGER==0
	if( GC_LIST_EMPTY( gc_queued_list ) ){
		sweep=1;
	}
#endif	
	
	int reclaimed_bytes=-1;
	
	if( sweep && !GC_LIST_EMPTY( gc_unmarked_list ) ){
	
		reclaimed_bytes=gc_alloced_bytes-gc_marked_bytes;
		
		//append unmarked list to end of free list
		gc_object *head=gc_unmarked_list.succ;
		gc_object *tail=gc_unmarked_list.pred;
		gc_object *succ=&gc_free_list;
		gc_object *pred=succ->pred;
		head->pred=pred;
		tail->succ=succ;
		pred->succ=head;
		succ->pred=tail;
		
		//move marked to unmarked.
		gc_unmarked_list=gc_marked_list;
		gc_unmarked_list.succ->pred=gc_unmarked_list.pred->succ=&gc_unmarked_list;
		
		//clear marked.
		gc_marked_list.succ=gc_marked_list.pred=&gc_marked_list;
		
		//adjust sizes
		gc_alloced_bytes=gc_marked_bytes;
		gc_free_bytes+=reclaimed_bytes;
		gc_marked_bytes=0;
		gc_marked_objs=0;
		gc_markbit^=1;
		
		gc_mark_roots();
		
		last_alloced=gc_alloced_bytes;
	}

#if DEBUG_GC
	int us2=gc_micros(),us3=us2-us;
	if( reclaimed_bytes>=0 || us3>=1000 ){
		printf("gc_collect :: us:%i reclaimed:%i alloced_bytes:%i max_alloced_bytes:%i free_bytes:%i\n",us2-us,reclaimed_bytes,gc_alloced_bytes,gc_max_alloced_bytes,gc_free_bytes );
	}		
	fflush(stdout);
#endif
}

// ***** Array *****

template<class T> T *t_memcpy( T *dst,const T *src,int n ){
	memcpy( dst,src,n*sizeof(T) );
	return dst+n;
}

template<class T> T *t_memset( T *dst,int val,int n ){
	memset( dst,val,n*sizeof(T) );
	return dst+n;
}

template<class T> int t_memcmp( const T *x,const T *y,int n ){
	return memcmp( x,y,n*sizeof(T) );
}

template<class T> int t_strlen( const T *p ){
	const T *q=p++;
	while( *q++ ){}
	return q-p;
}

template<class T> T *t_create( int n,T *p ){
	t_memset( p,0,n );
	return p+n;
}

template<class T> T *t_create( int n,T *p,const T *q ){
	t_memcpy( p,q,n );
	return p+n;
}

template<class T> void t_destroy( int n,T *p ){
}

//for int, float etc arrays...needs to go before Array<> decl to shut xcode 4.0.2 up.
template<class T> void gc_mark_array( int n,T *p ){
}

template<class T> class Array{
public:
	Array(){
		static Rep null;
		rep=&null;
	}

	//Uses default...
//	Array( const Array<T> &t )...
	
	Array( int length ):rep( Rep::alloc( length ) ){
		t_create( rep->length,rep->data );
	}
	
	Array( const T *p,int length ):rep( Rep::alloc(length) ){
		t_create( rep->length,rep->data,p );
	}
	
	~Array(){
	}

	//Uses default...
//	Array &operator=( const Array &t )...
	
	int Length()const{ 
		return rep->length; 
	}
	
	T &At( int index ){
		if( index<0 || index>=rep->length ) dbg_error( "Array index out of range" );
		return rep->data[index]; 
	}
	
	const T &At( int index )const{
		if( index<0 || index>=rep->length ) dbg_error( "Array index out of range" );
		return rep->data[index]; 
	}
	
	T &operator[]( int index ){
		return rep->data[index]; 
	}

	const T &operator[]( int index )const{
		return rep->data[index]; 
	}
	
	Array Slice( int from,int term )const{
		int len=rep->length;
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
		if( term<=from ) return Array();
		return Array( rep->data+from,term-from );
	}

	Array Slice( int from )const{
		return Slice( from,rep->length );
	}
	
	Array Resize( int newlen )const{
		if( newlen<=0 ) return Array();
		int n=rep->length;
		if( newlen<n ) n=newlen;
		Rep *p=Rep::alloc( newlen );
		T *q=p->data;
		q=t_create( n,q,rep->data );
		q=t_create( (newlen-n),q );
		return Array( p );
	}
	
private:
	struct Rep : public gc_object{
		int length;
		T data[0];
		
		Rep():length(0){
			flags=3;
		}
		
		Rep( int length ):length(length){
		}
		
		~Rep(){
			t_destroy( length,data );
		}
		
		void mark(){
			gc_mark_array( length,data );
		}
		
		static Rep *alloc( int length ){
			static Rep null;
			if( !length ) return &null;
			void *p=gc_malloc( sizeof(Rep)+length*sizeof(T) );
			return ::new(p) Rep( length );
		}
	};
	Rep *rep;
	
	template<class C> friend void gc_mark( Array<C> &t );
	template<class C> friend void gc_mark_q( Array<C> &t );
	template<class C> friend void gc_assign( Array<C> &lhs,Array<C> rhs );
	
	Array( Rep *rep ):rep(rep){
	}
};

template<class T> Array<T> *t_create( int n,Array<T> *p ){
	for( int i=0;i<n;++i ) *p++=Array<T>();
	return p;
}

template<class T> Array<T> *t_create( int n,Array<T> *p,const Array<T> *q ){
	for( int i=0;i<n;++i ) *p++=*q++;
	return p;
}

template<class T> void gc_mark( Array<T> &t ){
	gc_mark( t.rep );
}

template<class T> void gc_mark_q( Array<T> &t ){
	gc_mark_q( t.rep );
}

//for object arrays....
template<class T> void gc_mark_array( int n,T **p ){
	for( int i=0;i<n;++i ) gc_mark( p[i] );
}

//for array arrays...
template<class T> void gc_mark_array( int n,Array<T> *p ){
	for( int i=0;i<n;++i ) gc_mark( p[i] );
}

template<class T> void gc_assign( Array<T> &lhs,Array<T> rhs ){
	gc_mark( rhs.rep );
	lhs=rhs;
}
		
// ***** String *****

class String{
public:
	String():rep( Rep::alloc(0) ){
	}
	
	String( const String &t ):rep( t.rep ){
		rep->retain();
	}

	String( int n ){
		char buf[256];
		sprintf_s( buf,"%i",n );
		rep=Rep::alloc( t_strlen(buf) );
		for( int i=0;i<rep->length;++i ) rep->data[i]=buf[i];
	}
	
	String( Float n ){
		char buf[256];
		
		//would rather use snprintf, but it's doing weird things in MingW.
		//
		sprintf_s( buf,"%.17lg",n );
		//
		char *p;
		for( p=buf;*p;++p ){
			if( *p=='.' || *p=='e' ) break;
		}
		if( !*p ){
			*p++='.';
			*p++='0';
			*p=0;
		}

		rep=Rep::alloc( t_strlen(buf) );
		for( int i=0;i<rep->length;++i ) rep->data[i]=buf[i];
	}

	String( Char ch,int length ):rep( Rep::alloc(length) ){
		for( int i=0;i<length;++i ) rep->data[i]=ch;
	}

	String( const Char *p ):rep( Rep::alloc(t_strlen(p)) ){
		t_memcpy( rep->data,p,rep->length );
	}

	String( const Char *p,int length ):rep( Rep::alloc(length) ){
		t_memcpy( rep->data,p,rep->length );
	}
	
#if __OBJC__	
	String( NSString *nsstr ):rep( Rep::alloc([nsstr length]) ){
		unichar *buf=(unichar*)malloc( rep->length * sizeof(unichar) );
		[nsstr getCharacters:buf range:NSMakeRange(0,rep->length)];
		for( int i=0;i<rep->length;++i ) rep->data[i]=buf[i];
		free( buf );
	}
#endif

	~String(){
		rep->release();
	}
	
	template<class C> String( const C *p ):rep( Rep::alloc(t_strlen(p)) ){
		for( int i=0;i<rep->length;++i ) rep->data[i]=p[i];
	}
	
	template<class C> String( const C *p,int length ):rep( Rep::alloc(length) ){
		for( int i=0;i<rep->length;++i ) rep->data[i]=p[i];
	}
	
	int Length()const{
		return rep->length;
	}
	
	const Char *Data()const{
		return rep->data;
	}
	
	Char operator[]( int index )const{
		return rep->data[index];
	}
	
	String &operator=( const String &t ){
		t.rep->retain();
		rep->release();
		rep=t.rep;
		return *this;
	}
	
	String &operator+=( const String &t ){
		return operator=( *this+t );
	}
	
	int Compare( const String &t )const{
		int n=rep->length<t.rep->length ? rep->length : t.rep->length;
		for( int i=0;i<n;++i ){
			if( int q=(int)(rep->data[i])-(int)(t.rep->data[i]) ) return q;
		}
		return rep->length-t.rep->length;
	}
	
	bool operator==( const String &t )const{
		return rep->length==t.rep->length && t_memcmp( rep->data,t.rep->data,rep->length )==0;
	}
	
	bool operator!=( const String &t )const{
		return rep->length!=t.rep->length || t_memcmp( rep->data,t.rep->data,rep->length )!=0;
	}
	
	bool operator<( const String &t )const{
		return Compare( t )<0;
	}
	
	bool operator<=( const String &t )const{
		return Compare( t )<=0;
	}
	
	bool operator>( const String &t )const{
		return Compare( t )>0;
	}
	
	bool operator>=( const String &t )const{
		return Compare( t )>=0;
	}
	
	String operator+( const String &t )const{
		if( !rep->length ) return t;
		if( !t.rep->length ) return *this;
		Rep *p=Rep::alloc( rep->length+t.rep->length );
		Char *q=p->data;
		q=t_memcpy( q,rep->data,rep->length );
		q=t_memcpy( q,t.rep->data,t.rep->length );
		return String( p );
	}
	
	int Find( String find,int start=0 )const{
		if( start<0 ) start=0;
		while( start+find.rep->length<=rep->length ){
			if( !t_memcmp( rep->data+start,find.rep->data,find.rep->length ) ) return start;
			++start;
		}
		return -1;
	}
	
	int FindLast( String find )const{
		int start=rep->length-find.rep->length;
		while( start>=0 ){
			if( !t_memcmp( rep->data+start,find.rep->data,find.rep->length ) ) return start;
			--start;
		}
		return -1;
	}
	
	int FindLast( String find,int start )const{
		if( start>rep->length-find.rep->length ) start=rep->length-find.rep->length;
		while( start>=0 ){
			if( !t_memcmp( rep->data+start,find.rep->data,find.rep->length ) ) return start;
			--start;
		}
		return -1;
	}
	
	String Trim()const{
		int i=0,i2=rep->length;
		while( i<i2 && rep->data[i]<=32 ) ++i;
		while( i2>i && rep->data[i2-1]<=32 ) --i2;
		if( i==0 && i2==rep->length ) return *this;
		return String( rep->data+i,i2-i );
	}

	Array<String> Split( String sep )const{
	
		if( !sep.rep->length ){
			Array<String> bits( rep->length );
			for( int i=0;i<rep->length;++i ){
				bits[i]=String( (Char)(*this)[i],1 );
			}
			return bits;
		}
		
		int i=0,i2,n=1;
		while( (i2=Find( sep,i ))!=-1 ){
			++n;
			i=i2+sep.rep->length;
		}
		Array<String> bits( n );
		if( n==1 ){
			bits[0]=*this;
			return bits;
		}
		i=0;n=0;
		while( (i2=Find( sep,i ))!=-1 ){
			bits[n++]=Slice( i,i2 );
			i=i2+sep.rep->length;
		}
		bits[n]=Slice( i );
		return bits;
	}

	String Join( Array<String> bits )const{
		if( bits.Length()==0 ) return String();
		if( bits.Length()==1 ) return bits[0];
		int newlen=rep->length * (bits.Length()-1);
		for( int i=0;i<bits.Length();++i ){
			newlen+=bits[i].rep->length;
		}
		Rep *p=Rep::alloc( newlen );
		Char *q=p->data;
		q=t_memcpy( q,bits[0].rep->data,bits[0].rep->length );
		for( int i=1;i<bits.Length();++i ){
			q=t_memcpy( q,rep->data,rep->length );
			q=t_memcpy( q,bits[i].rep->data,bits[i].rep->length );
		}
		return String( p );
	}

	String Replace( String find,String repl )const{
		int i=0,i2,newlen=0;
		while( (i2=Find( find,i ))!=-1 ){
			newlen+=(i2-i)+repl.rep->length;
			i=i2+find.rep->length;
		}
		if( !i ) return *this;
		newlen+=rep->length-i;
		Rep *p=Rep::alloc( newlen );
		Char *q=p->data;
		i=0;
		while( (i2=Find( find,i ))!=-1 ){
			q=t_memcpy( q,rep->data+i,i2-i );
			q=t_memcpy( q,repl.rep->data,repl.rep->length );
			i=i2+find.rep->length;
		}
		q=t_memcpy( q,rep->data+i,rep->length-i );
		return String( p );
	}

	String ToLower()const{
		for( int i=0;i<rep->length;++i ){
			Char t=tolower( rep->data[i] );
			if( t==rep->data[i] ) continue;
			Rep *p=Rep::alloc( rep->length );
			Char *q=p->data;
			t_memcpy( q,rep->data,i );
			for( q[i++]=t;i<rep->length;++i ){
				q[i]=tolower( rep->data[i] );
			}
			return String( p );
		}
		return *this;
	}

	String ToUpper()const{
		for( int i=0;i<rep->length;++i ){
			Char t=toupper( rep->data[i] );
			if( t==rep->data[i] ) continue;
			Rep *p=Rep::alloc( rep->length );
			Char *q=p->data;
			t_memcpy( q,rep->data,i );
			for( q[i++]=t;i<rep->length;++i ){
				q[i]=toupper( rep->data[i] );
			}
			return String( p );
		}
		return *this;
	}
	
	bool Contains( String sub )const{
		return Find( sub )!=-1;
	}

	bool StartsWith( String sub )const{
		return sub.rep->length<=rep->length && !t_memcmp( rep->data,sub.rep->data,sub.rep->length );
	}

	bool EndsWith( String sub )const{
		return sub.rep->length<=rep->length && !t_memcmp( rep->data+rep->length-sub.rep->length,sub.rep->data,sub.rep->length );
	}
	
	String Slice( int from,int term )const{
		int len=rep->length;
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
		if( term<from ) return String();
		if( from==0 && term==len ) return *this;
		return String( rep->data+from,term-from );
	}

	String Slice( int from )const{
		return Slice( from,rep->length );
	}
	
	Array<int> ToChars()const{
		Array<int> chars( rep->length );
		for( int i=0;i<rep->length;++i ) chars[i]=rep->data[i];
		return chars;
	}
	
	int ToInt()const{
		return atoi( ToCString<char>() );
	}
	
	Float ToFloat()const{
		return atof( ToCString<char>() );
	}
	
	template<class C> C *ToCString()const{

		C *p=&Array<C>( rep->length+1 )[0];
		
		for( int i=0;i<rep->length;++i ) p[i]=rep->data[i];
		p[rep->length]=0;
		return p;
	}

#if __OBJC__	
	NSString *ToNSString()const{
		return [NSString stringWithCharacters:ToCString<unichar>() length:rep->length];
	}
#endif

	bool Save( FILE *fp ){
		std::vector<unsigned char> buf;
		Save( buf );
		return buf.size() ? fwrite( &buf[0],1,buf.size(),fp )==buf.size() : true;
	}
	
	void Save( std::vector<unsigned char> &buf ){
	
		Char *p=rep->data;
		Char *e=p+rep->length;
		
		while( p<e ){
			Char c=*p++;
			if( c<0x80 ){
				buf.push_back( c );
			}else if( c<0x800 ){
				buf.push_back( 0xc0 | (c>>6) );
				buf.push_back( 0x80 | (c & 0x3f) );
			}else{
				buf.push_back( 0xe0 | (c>>12) );
				buf.push_back( 0x80 | ((c>>6) & 0x3f) );
				buf.push_back( 0x80 | (c & 0x3f) );
			}
		}
	}
	
	static String FromChars( Array<int> chars ){
		int n=chars.Length();
		Rep *p=Rep::alloc( n );
		for( int i=0;i<n;++i ){
			p->data[i]=chars[i];
		}
		return String( p );
	}

	static String Load( FILE *fp ){
		unsigned char tmp[4096];
		std::vector<unsigned char> buf;
		for(;;){
			int n=fread( tmp,1,4096,fp );
			if( n>0 ) buf.insert( buf.end(),tmp,tmp+n );
			if( n!=4096 ) break;
		}
		return buf.size() ? String::Load( &buf[0],buf.size() ) : String();
	}
	
	static String Load( unsigned char *p,int n ){
	
		unsigned char *e=p+n;
		std::vector<Char> chars;
		
		int t0=n>0 ? p[0] : -1;
		int t1=n>1 ? p[1] : -1;

		if( t0==0xfe && t1==0xff ){
			p+=2;
			while( p<e-1 ){
				int c=*p++;
				chars.push_back( (c<<8)|*p++ );
			}
		}else if( t0==0xff && t1==0xfe ){
			p+=2;
			while( p<e-1 ){
				int c=*p++;
				chars.push_back( (*p++<<8)|c );
			}
		}else{
			int t2=n>2 ? p[2] : -1;
			if( t0==0xef && t1==0xbb && t2==0xbf ) p+=3;
			unsigned char *q=p;
			bool fail=false;
			while( p<e ){
				unsigned int c=*p++;
				if( c & 0x80 ){
					if( (c & 0xe0)==0xc0 ){
						if( p>=e || (p[0] & 0xc0)!=0x80 ){
							fail=true;
							break;
						}
						c=((c & 0x1f)<<6) | (p[0] & 0x3f);
						p+=1;
					}else if( (c & 0xf0)==0xe0 ){
						if( p+1>=e || (p[0] & 0xc0)!=0x80 || (p[1] & 0xc0)!=0x80 ){
							fail=true;
							break;
						}
						c=((c & 0x0f)<<12) | ((p[0] & 0x3f)<<6) | (p[1] & 0x3f);
						p+=2;
					}else{
						fail=true;
						break;
					}
				}
				chars.push_back( c );
			}
			if( fail ){
				puts( "Invalid UTF-8!" );fflush( stdout );
				return String( q,n );
			}
		}
		return chars.size() ? String( &chars[0],chars.size() ) : String();
	}
	
private:
	struct Rep{
		int refs;
		int length;
		Char data[0];
		
		Rep():refs(1),length(0){
		}
		
		Rep( int length ):refs(1),length(length){
		}
		
		void retain(){
			++refs;
		}
		
		void release(){
			if( --refs || !length ) return;
			free( this );
		}

		static Rep *alloc( int length ){
			if( !length ){
				static Rep null;
				return &null;
			}
			void *p=malloc( sizeof(Rep)+length*sizeof(Char) );
			return new(p) Rep( length );
		}
	};
	Rep *rep;
	
	String( Rep *rep ):rep(rep){
	}
};

String *t_create( int n,String *p ){
	for( int i=0;i<n;++i ) new( &p[i] ) String();
	return p+n;
}

String *t_create( int n,String *p,const String *q ){
	for( int i=0;i<n;++i ) new( &p[i] ) String( q[i] );
	return p+n;
}

void t_destroy( int n,String *p ){
	for( int i=0;i<n;++i ) p[i].~String();
}

String T( const char *p ){
	return String( p );
}

String T( const wchar_t *p ){
	return String( p );
}

// ***** Object *****

class Object : public gc_object{
public:
	virtual bool Equals( Object *obj ){
		return this==obj;
	}
	
	virtual int Compare( Object *obj ){
		return (char*)this-(char*)obj;
	}
	
	virtual String debug(){
		return "+Object\n";
	}
};

class ThrowableObject : public Object{
};

struct gc_interface{
	virtual ~gc_interface(){}
};


//***** Debugger *****

int Print( String t );

#define dbg_stream stderr

#if _MSC_VER
#define dbg_typeof decltype
#else
#define dbg_typeof __typeof__
#endif 

struct dbg_func;
struct dbg_var_type;

static int dbg_suspend;
static int dbg_stepmode;

const char *dbg_info;
String dbg_exstack;

static void *dbg_var_buf[65536*3];
static void **dbg_var_ptr=dbg_var_buf;

static dbg_func *dbg_func_buf[1024];
static dbg_func **dbg_func_ptr=dbg_func_buf;

String dbg_type( bool *p ){
	return "Bool";
}

String dbg_type( int *p ){
	return "Int";
}

String dbg_type( Float *p ){
	return "Float";
}

String dbg_type( String *p ){
	return "String";
}

template<class T> String dbg_type( T *p ){
	return "Object";
}

template<class T> String dbg_type( Array<T> *p ){
	return dbg_type( &(*p)[0] )+"[]";
}

String dbg_value( bool *p ){
	return *p ? "True" : "False";
}

String dbg_value( int *p ){
	return String( *p );
}

String dbg_value( Float *p ){
	return String( *p );
}

String dbg_value( String *p ){
	String t=*p;
	if( t.Length()>100 ) t=t.Slice( 0,100 )+"...";
	t=t.Replace( "\"","~q" );
	t=t.Replace( "\t","~t" );
	t=t.Replace( "\n","~n" );
	t=t.Replace( "\r","~r" );
	return String("\"")+t+"\"";
}

template<class T> String dbg_value( T *t ){
	Object *p=dynamic_cast<Object*>( *t );
	char buf[64];
	sprintf_s( buf,"%p",p );
	return String("@") + (buf[0]=='0' && buf[1]=='x' ? buf+2 : buf );
}

template<class T> String dbg_value( Array<T> *p ){
	String t="[";
	int n=(*p).Length();
	for( int i=0;i<n;++i ){
		if( i ) t+=",";
		t+=dbg_value( &(*p)[i] );
	}
	return t+"]";
}

template<class T> String dbg_decl( const char *id,T *ptr ){
	return String( id )+":"+dbg_type(ptr)+"="+dbg_value(ptr)+"\n";
}

struct dbg_var_type{
	virtual String type( void *p )=0;
	virtual String value( void *p )=0;
};

template<class T> struct dbg_var_type_t : public dbg_var_type{

	String type( void *p ){
		return dbg_type( (T*)p );
	}
	
	String value( void *p ){
		return dbg_value( (T*)p );
	}
	
	static dbg_var_type_t<T> info;
};
template<class T> dbg_var_type_t<T> dbg_var_type_t<T>::info;

struct dbg_blk{
	void **var_ptr;
	
	dbg_blk():var_ptr(dbg_var_ptr){
		if( dbg_stepmode=='l' ) --dbg_suspend;
	}
	
	~dbg_blk(){
		if( dbg_stepmode=='l' ) ++dbg_suspend;
		dbg_var_ptr=var_ptr;
	}
};

struct dbg_func : public dbg_blk{
	const char *id;
	const char *info;

	dbg_func( const char *p ):id(p),info(dbg_info){
		*dbg_func_ptr++=this;
		if( dbg_stepmode=='s' ) --dbg_suspend;
	}
	
	~dbg_func(){
		if( dbg_stepmode=='s' ) ++dbg_suspend;
		--dbg_func_ptr;
		dbg_info=info;
	}
};

int dbg_print( String t ){
	static char *buf;
	static int len;
	int n=t.Length();
	if( n+100>len ){
		len=n+100;
		free( buf );
		buf=(char*)malloc( len );
	}
	buf[n]='\n';
	for( int i=0;i<n;++i ) buf[i]=t[i];
	fwrite( buf,n+1,1,dbg_stream );
	fflush( dbg_stream );
	return 0;
}

void dbg_callstack(){

	void **var_ptr=dbg_var_buf;
	dbg_func **func_ptr=dbg_func_buf;
	
	while( var_ptr!=dbg_var_ptr ){
		while( func_ptr!=dbg_func_ptr && var_ptr==(*func_ptr)->var_ptr ){
			const char *id=(*func_ptr++)->id;
			const char *info=func_ptr!=dbg_func_ptr ? (*func_ptr)->info : dbg_info;
			fprintf( dbg_stream,"+%s;%s\n",id,info );
		}
		void *vp=*var_ptr++;
		const char *nm=(const char*)*var_ptr++;
		dbg_var_type *ty=(dbg_var_type*)*var_ptr++;
		dbg_print( String(nm)+":"+ty->type(vp)+"="+ty->value(vp) );
	}
	while( func_ptr!=dbg_func_ptr ){
		const char *id=(*func_ptr++)->id;
		const char *info=func_ptr!=dbg_func_ptr ? (*func_ptr)->info : dbg_info;
		fprintf( dbg_stream,"+%s;%s\n",id,info );
	}
}

String dbg_stacktrace(){
	if( !dbg_info || !dbg_info[0] ) return "";
	String str=String( dbg_info )+"\n";
	dbg_func **func_ptr=dbg_func_ptr;
	if( func_ptr==dbg_func_buf ) return str;
	while( --func_ptr!=dbg_func_buf ){
		str+=String( (*func_ptr)->info )+"\n";
	}
	return str;
}

void dbg_throw( const char *err ){
	dbg_exstack=dbg_stacktrace();
	throw err;
}

void dbg_stop(){

#ifdef TARGET_OS_IPHONE
	dbg_throw( "STOP" );
#endif

	fprintf( dbg_stream,"{{~~%s~~}}\n",dbg_info );
	dbg_callstack();
	dbg_print( "" );
	
	for(;;){

		char buf[256];
		char *e=fgets( buf,256,stdin );
		if( !e ) exit( -1 );
		
		e=strchr( buf,'\n' );
		if( !e ) exit( -1 );
		
		*e=0;
		
		Object *p;
		
		switch( buf[0] ){
		case '?':
			break;
		case 'r':	//run
			dbg_suspend=0;		
			dbg_stepmode=0;
			return;
		case 's':	//step
			dbg_suspend=1;
			dbg_stepmode='s';
			return;
		case 'e':	//enter func
			dbg_suspend=1;
			dbg_stepmode='e';
			return;
		case 'l':	//leave block
			dbg_suspend=0;
			dbg_stepmode='l';
			return;
		case '@':	//dump object
			p=0;
			sscanf_s( buf+1,"%p",&p );
			if( p ){
				dbg_print( p->debug() );
			}else{
				dbg_print( "" );
			}
			break;
		case 'q':	//quit!
			exit( 0 );
			break;			
		default:
			printf( "????? %s ?????",buf );fflush( stdout );
			exit( -1 );
		}
	}
}

void dbg_error( const char *err ){

#ifdef TARGET_OS_IPHONE
	dbg_throw( err );
#endif

	for(;;){
		Print( String("Monkey Runtime Error : ")+err );
		Print( dbg_stacktrace() );
		dbg_stop();
	}
}

#define DBG_INFO(X) dbg_info=(X);if( dbg_suspend>0 ) dbg_stop();

#define DBG_ENTER(P) dbg_func _dbg_func(P);

#define DBG_BLOCK(T) dbg_blk _dbg_blk;

#define DBG_GLOBAL( ID,NAME )	//TODO!

#define DBG_LOCAL( ID,NAME )\
*dbg_var_ptr++=&ID;\
*dbg_var_ptr++=(void*)NAME;\
*dbg_var_ptr++=&dbg_var_type_t<dbg_typeof(ID)>::info;

//**** main ****

int argc;
const char **argv;

Float D2R=0.017453292519943295f;
Float R2D=57.29577951308232f;

int Print( String t ){
	static char *buf;
	static int len;
	int n=t.Length();
	if( n+100>len ){
		len=n+100;
		free( buf );
		buf=(char*)malloc( len );
	}
	for( int i=0;i<n;++i ) buf[i]=t[i];
	buf[n]=0;
	puts( buf );
	fflush( stdout );
	return 0;
}

int Error( String err ){
	if( !err.Length() ) exit( 0 );
	dbg_error( err.ToCString<char>() );
	return 0;
}

int DebugLog( String t ){
	Print( t );
	return 0;
}

int DebugStop(){
	dbg_stop();
	return 0;
}

int bbInit();
int bbMain();

#if _MSC_VER

static void _cdecl seTranslator( unsigned int ex,EXCEPTION_POINTERS *p ){

	switch( ex ){
	case EXCEPTION_ACCESS_VIOLATION:dbg_error( "Memory access violation" );
	case EXCEPTION_ILLEGAL_INSTRUCTION:dbg_error( "Illegal instruction" );
	case EXCEPTION_INT_DIVIDE_BY_ZERO:dbg_error( "Integer divide by zero" );
	case EXCEPTION_STACK_OVERFLOW:dbg_error( "Stack overflow" );
	}
	dbg_error( "Unknown exception" );
}

#else

void sighandler( int sig  ){
	switch( sig ){
	case SIGSEGV:dbg_error( "Memory access violation" );
	case SIGILL:dbg_error( "Illegal instruction" );
	case SIGFPE:dbg_error( "Floating point exception" );
#if !_WIN32
	case SIGBUS:dbg_error( "Bus error" );
#endif	
	}
	dbg_error( "Unknown signal" );
}

#endif

//entry point call by target main()...
//
int bb_std_main( int argc,const char **argv ){

	::argc=argc;
	::argv=argv;
	
#if _MSC_VER

	_set_se_translator( seTranslator );

#else
	
	signal( SIGSEGV,sighandler );
	signal( SIGILL,sighandler );
	signal( SIGFPE,sighandler );
#if !_WIN32
	signal( SIGBUS,sighandler );
#endif

#endif

	gc_init1();

	bbInit();
	
	gc_init2();

	bbMain();

	return 0;
}

// ***** databuffer.h *****

class BBDataBuffer : public Object{

public:
	
	BBDataBuffer();
	~BBDataBuffer();
	
	void Discard();
	
	int Length();
	
	const void *ReadPointer( int offset );
	void *WritePointer( int offset );
	
	void PokeByte( int addr,int value );
	void PokeShort( int addr,int value );
	void PokeInt( int addr,int value );
	void PokeFloat( int addr,float value );
	
	int PeekByte( int addr );
	int PeekShort( int addr );
	int PeekInt( int addr );
	float PeekFloat( int addr );
	
	bool LoadBuffer( String path );
	bool CreateBuffer( int length );
	
	bool _New( int length );
	bool _Load( String path );

private:
	signed char *_data;
	int _length;
};

// ***** databuffer.cpp *****

//Forward refs to data functions.
FILE *fopenFile( String path,String mode );

BBDataBuffer::BBDataBuffer():_data(0),_length(0){
}

BBDataBuffer::~BBDataBuffer(){
	if( _data ) free( _data );
}

bool BBDataBuffer::_New( int length ){
	if( _data ) return false;
	_data=(signed char*)malloc( length );
	_length=length;
	return true;
}

bool BBDataBuffer::_Load( String path ){
	if( _data ) return false;
	if( FILE *f=fopenFile( path,"rb" ) ){
		const int BUF_SZ=4096;
		std::vector<void*> tmps;
		for(;;){
			void *p=malloc( BUF_SZ );
			int n=fread( p,1,BUF_SZ,f );
			tmps.push_back( p );
			_length+=n;
			if( n!=BUF_SZ ) break;
		}
		fclose( f );
		_data=(signed char*)malloc( _length );
		signed char *p=_data;
		int sz=_length;
		for( int i=0;i<tmps.size();++i ){
			int n=sz>BUF_SZ ? BUF_SZ : sz;
			memcpy( p,tmps[i],n );
			free( tmps[i] );
			sz-=n;
		}
		return true;
	}
	return false;
}

void BBDataBuffer::Discard(){
	if( !_data ) return;
	free( _data );
	_data=0;
	_length=0;
}

int BBDataBuffer::Length(){
	return _length;
}

const void *BBDataBuffer::ReadPointer( int offset ){
	return _data+offset;
}

void *BBDataBuffer::WritePointer( int offset ){
	return _data+offset;
}

void BBDataBuffer::PokeByte( int addr,int value ){
	*(_data+addr)=value;
}

void BBDataBuffer::PokeShort( int addr,int value ){
	*(short*)(_data+addr)=value;
}

void BBDataBuffer::PokeInt( int addr,int value ){
	*(int*)(_data+addr)=value;
}

void BBDataBuffer::PokeFloat( int addr,float value ){
	*(float*)(_data+addr)=value;
}

int BBDataBuffer::PeekByte( int addr ){
	return *(_data+addr);
}

int BBDataBuffer::PeekShort( int addr ){
	return *(short*)(_data+addr);
}

int BBDataBuffer::PeekInt( int addr ){
	return *(int*)(_data+addr);
}

float BBDataBuffer::PeekFloat( int addr ){
	return *(float*)(_data+addr);
}

// GLFW mojo runtime.
//
// Copyright 2011 Mark Sibly, all rights reserved.
// No warranty implied; use at your own risk.

#ifndef GL_BGRA
#define GL_BGRA  0x80e1
#endif

#ifndef GL_CLAMP_TO_EDGE
#define GL_CLAMP_TO_EDGE 0x812f
#endif

#ifndef GL_GENERATE_MIPMAP
#define GL_GENERATE_MIPMAP 0x8191
#endif

class gxtkApp;
class gxtkGraphics;
class gxtkSurface;
class gxtkInput;
class gxtkAudio;
class gxtkSample;

#define KEY_LMB 1
#define KEY_RMB 2
#define KEY_MMB 3
#define KEY_TOUCH0 0x180

int Pow2Size( int n ){
	int i=1;
	while( i<n ) i*=2;
	return i;
}

//Forward refs to data functions.
FILE *fopenFile( String path,String mode );

unsigned char *loadImage( String path,int *width,int *height,int *format );
unsigned char *loadImage( unsigned char *buf,int len,int *width,int *height,int *format );
void unloadImage( unsigned char *data );

unsigned char *loadSound( String path,int *length,int *channels,int *format,int *hertz );
void unloadSound( unsigned char *data );

enum{
	VKEY_BACKSPACE=8,VKEY_TAB,
	VKEY_ENTER=13,
	VKEY_SHIFT=16,
	VKEY_CONTROL=17,
	VKEY_ESC=27,
	VKEY_SPACE=32,
	VKEY_PAGEUP=33,VKEY_PAGEDOWN,VKEY_END,VKEY_HOME,
	VKEY_LEFT=37,VKEY_UP,VKEY_RIGHT,VKEY_DOWN,
	VKEY_INSERT=45,VKEY_DELETE,
	VKEY_0=48,VKEY_1,VKEY_2,VKEY_3,VKEY_4,VKEY_5,VKEY_6,VKEY_7,VKEY_8,VKEY_9,
	VKEY_A=65,VKEY_B,VKEY_C,VKEY_D,VKEY_E,VKEY_F,VKEY_G,VKEY_H,VKEY_I,VKEY_J,
	VKEY_K,VKEY_L,VKEY_M,VKEY_N,VKEY_O,VKEY_P,VKEY_Q,VKEY_R,VKEY_S,VKEY_T,
	VKEY_U,VKEY_V,VKEY_W,VKEY_X,VKEY_Y,VKEY_Z,
	
	VKEY_LSYS=91,VKEY_RSYS,
	
	VKEY_NUM0=96,VKEY_NUM1,VKEY_NUM2,VKEY_NUM3,VKEY_NUM4,
	VKEY_NUM5,VKEY_NUM6,VKEY_NUM7,VKEY_NUM8,VKEY_NUM9,
	VKEY_NUMMULTIPLY=106,VKEY_NUMADD,VKEY_NUMSLASH,
	VKEY_NUMSUBTRACT,VKEY_NUMDECIMAL,VKEY_NUMDIVIDE,

	VKEY_F1=112,VKEY_F2,VKEY_F3,VKEY_F4,VKEY_F5,VKEY_F6,
	VKEY_F7,VKEY_F8,VKEY_F9,VKEY_F10,VKEY_F11,VKEY_F12,

	VKEY_LSHIFT=160,VKEY_RSHIFT,
	VKEY_LCONTROL=162,VKEY_RCONTROL,
	VKEY_LALT=164,VKEY_RALT,

	VKEY_TILDE=192,VKEY_MINUS=189,VKEY_EQUALS=187,
	VKEY_OPENBRACKET=219,VKEY_BACKSLASH=220,VKEY_CLOSEBRACKET=221,
	VKEY_SEMICOLON=186,VKEY_QUOTES=222,
	VKEY_COMMA=188,VKEY_PERIOD=190,VKEY_SLASH=191
};

//glfw key to monkey key!
int TransKey( int key ){

	if( key>='0' && key<='9' ) return key;
	if( key>='A' && key<='Z' ) return key;

	switch( key ){

	case ' ':return VKEY_SPACE;
	case ';':return VKEY_SEMICOLON;
	case '=':return VKEY_EQUALS;
	case ',':return VKEY_COMMA;
	case '-':return VKEY_MINUS;
	case '.':return VKEY_PERIOD;
	case '/':return VKEY_SLASH;
	case '~':return VKEY_TILDE;
	case '[':return VKEY_OPENBRACKET;
	case ']':return VKEY_CLOSEBRACKET;
	case '\"':return VKEY_QUOTES;
	case '\\':return VKEY_BACKSLASH;
	
	case '`':return VKEY_TILDE;
	case '\'':return VKEY_QUOTES;
	
	case GLFW_KEY_LSHIFT:return VKEY_LSHIFT;
	case GLFW_KEY_RSHIFT:return VKEY_RSHIFT;
	case GLFW_KEY_LCTRL:return VKEY_LCONTROL;
	case GLFW_KEY_RCTRL:return VKEY_RCONTROL;
	
	case GLFW_KEY_BACKSPACE:return VKEY_BACKSPACE;
	case GLFW_KEY_TAB:return VKEY_TAB;
	case GLFW_KEY_ENTER:return VKEY_ENTER;
	case GLFW_KEY_ESC:return VKEY_ESC;
	case GLFW_KEY_INSERT:return VKEY_INSERT;
	case GLFW_KEY_DEL:return VKEY_DELETE;
	case GLFW_KEY_PAGEUP:return VKEY_PAGEUP;
	case GLFW_KEY_PAGEDOWN:return VKEY_PAGEDOWN;
	case GLFW_KEY_HOME:return VKEY_HOME;
	case GLFW_KEY_END:return VKEY_END;
	case GLFW_KEY_UP:return VKEY_UP;
	case GLFW_KEY_DOWN:return VKEY_DOWN;
	case GLFW_KEY_LEFT:return VKEY_LEFT;
	case GLFW_KEY_RIGHT:return VKEY_RIGHT;
	
	case GLFW_KEY_F1:return VKEY_F1;
	case GLFW_KEY_F2:return VKEY_F2;
	case GLFW_KEY_F3:return VKEY_F3;
	case GLFW_KEY_F4:return VKEY_F4;
	case GLFW_KEY_F5:return VKEY_F5;
	case GLFW_KEY_F6:return VKEY_F6;
	case GLFW_KEY_F7:return VKEY_F7;
	case GLFW_KEY_F8:return VKEY_F8;
	case GLFW_KEY_F9:return VKEY_F9;
	case GLFW_KEY_F10:return VKEY_F10;
	case GLFW_KEY_F11:return VKEY_F11;
	case GLFW_KEY_F12:return VKEY_F12;
	}
	return 0;
}

//monkey key to special monkey char
int KeyToChar( int key ){
	switch( key ){
	case VKEY_BACKSPACE:
	case VKEY_TAB:
	case VKEY_ENTER:
	case VKEY_ESC:
		return key;
	case VKEY_PAGEUP:
	case VKEY_PAGEDOWN:
	case VKEY_END:
	case VKEY_HOME:
	case VKEY_LEFT:
	case VKEY_UP:
	case VKEY_RIGHT:
	case VKEY_DOWN:
	case VKEY_INSERT:
		return key | 0x10000;
	case VKEY_DELETE:
		return 127;
	}
	return 0;
}

gxtkApp *app;

class gxtkObject : public Object{
public:
};

class gxtkApp : public gxtkObject{
public:
	gxtkGraphics *graphics;
	gxtkInput *input;
	gxtkAudio *audio;
	
	int updateRate;
	double nextUpdate;
	double updatePeriod;
	
	bool suspended;
	
	gxtkApp();
	
	void Run();
	
	static void GLFWCALL OnWindowRefresh();
	static void GLFWCALL OnWindowSize( int width,int height );
	static void GLFWCALL OnKey( int key,int action );
	static void GLFWCALL OnChar( int chr,int action );
	static void GLFWCALL OnMouseButton( int button,int action );
	
	void InvokeOnCreate();
	void InvokeOnSuspend();
	void InvokeOnResume();
	void InvokeOnUpdate();
	void InvokeOnRender();
	
	//***** GXTK API *****

	virtual gxtkGraphics *GraphicsDevice();
	virtual gxtkInput *InputDevice();
	virtual gxtkAudio *AudioDevice();
	virtual String AppTitle();
	virtual String LoadState();
	virtual int SaveState( String state );
	virtual String LoadString( String path );
	virtual int SetUpdateRate( int hertz );
	virtual int MilliSecs();
	virtual int Loading();
	
	virtual int OnCreate();
	virtual int OnSuspend();
	virtual int OnResume();
	
	virtual int OnUpdate();
	virtual int OnRender();
	virtual int OnLoading();
};

//***** START OF COMMON OPENGL CODE *****

#define MAX_VERTS 1024
#define MAX_POINTS MAX_VERTS
#define MAX_LINES (MAX_VERTS/2)
#define MAX_QUADS (MAX_VERTS/4)

class gxtkGraphics : public gxtkObject{
public:

	int mode;
	int width;
	int height;

	int colorARGB;
	float r,g,b,alpha;
	float ix,iy,jx,jy,tx,ty;
	bool tformed;

	float vertices[MAX_VERTS*5];
	unsigned short quadIndices[MAX_QUADS*6];

	int primType;
	int primCount;
	gxtkSurface *primSurf;
	
	gxtkGraphics();
	
	bool Validate();		
	void BeginRender();
	void EndRender();
	void Flush();
	
	//***** GXTK API *****
	virtual int Mode();
	virtual int Width();
	virtual int Height();

	virtual gxtkSurface *LoadSurface( String path );
	virtual gxtkSurface *LoadSurface__UNSAFE__( gxtkSurface *surface,String path );
	virtual gxtkSurface *CreateSurface( int width,int height );
//	virtual gxtkSurface *CreateSurface2( BBDataBuffer *data );
	
	virtual int Cls( float r,float g,float b );
	virtual int SetAlpha( float alpha );
	virtual int SetColor( float r,float g,float b );
	virtual int SetBlend( int blend );
	virtual int SetScissor( int x,int y,int w,int h );
	virtual int SetMatrix( float ix,float iy,float jx,float jy,float tx,float ty );
	
	virtual int DrawPoint( float x,float y );
	virtual int DrawRect( float x,float y,float w,float h );
	virtual int DrawLine( float x1,float y1,float x2,float y2 );
	virtual int DrawOval( float x1,float y1,float x2,float y2 );
	virtual int DrawPoly( Array<float> verts );
	virtual int DrawSurface( gxtkSurface *surface,float x,float y );
	virtual int DrawSurface2( gxtkSurface *surface,float x,float y,int srcx,int srcy,int srcw,int srch );
	
	virtual int ReadPixels( Array<int> pixels,int x,int y,int width,int height,int offset,int pitch );
	virtual int WritePixels2( gxtkSurface *surface,Array<int> pixels,int x,int y,int width,int height,int offset,int pitch );
};

//***** gxtkSurface *****

class gxtkSurface : public gxtkObject{
public:
	unsigned char *data;
	int width;
	int height;
	int depth;
	GLuint texture;
	float uscale;
	float vscale;
	
	gxtkSurface();
	gxtkSurface( unsigned char *data,int width,int height,int depth );
	
	void SetData( unsigned char *data,int width,int height,int depth );
	
	~gxtkSurface();
	
	//***** GXTK API *****
	virtual int Discard();
	virtual int Width();
	virtual int Height();
	virtual int Loaded();
	virtual bool OnUnsafeLoadComplete();
};

//***** gxtkGraphics *****

gxtkGraphics::gxtkGraphics(){

	mode=width=height=0;
	
	if( CFG_OPENGL_GLES20_ENABLED ) return;
	
	mode=1;
	
	for( int i=0;i<MAX_QUADS;++i ){
		quadIndices[i*6  ]=(short)(i*4);
		quadIndices[i*6+1]=(short)(i*4+1);
		quadIndices[i*6+2]=(short)(i*4+2);
		quadIndices[i*6+3]=(short)(i*4);
		quadIndices[i*6+4]=(short)(i*4+2);
		quadIndices[i*6+5]=(short)(i*4+3);
	}
}

void gxtkGraphics::BeginRender(){
	if( !mode ) return;
	
	glViewport( 0,0,width,height );

	glMatrixMode( GL_PROJECTION );
	glLoadIdentity();
	glOrtho( 0,width,height,0,-1,1 );
	glMatrixMode( GL_MODELVIEW );
	glLoadIdentity();
	
	glEnableClientState( GL_VERTEX_ARRAY );
	glVertexPointer( 2,GL_FLOAT,20,&vertices[0] );	
	
	glEnableClientState( GL_TEXTURE_COORD_ARRAY );
	glTexCoordPointer( 2,GL_FLOAT,20,&vertices[2] );
	
	glEnableClientState( GL_COLOR_ARRAY );
	glColorPointer( 4,GL_UNSIGNED_BYTE,20,&vertices[4] );
	
	glEnable( GL_BLEND );
	glBlendFunc( GL_ONE,GL_ONE_MINUS_SRC_ALPHA );
	
	glDisable( GL_TEXTURE_2D );
	
	primCount=0;
}

void gxtkGraphics::Flush(){
	if( !primCount ) return;

	if( primSurf ){
		glEnable( GL_TEXTURE_2D );
		glBindTexture( GL_TEXTURE_2D,primSurf->texture );
	}
		
	switch( primType ){
	case 1:
		glDrawArrays( GL_POINTS,0,primCount );
		break;
	case 2:
		glDrawArrays( GL_LINES,0,primCount*2 );
		break;
	case 4:
		glDrawElements( GL_TRIANGLES,primCount*6,GL_UNSIGNED_SHORT,quadIndices );
		break;
	case 5:
		glDrawArrays( GL_TRIANGLE_FAN,0,primCount );
		break;
	}

	if( primSurf ){
		glDisable( GL_TEXTURE_2D );
	}

	primCount=0;
}

//***** GXTK API *****

int gxtkGraphics::Mode(){
	return mode;
}

int gxtkGraphics::Width(){
	return width;
}

int gxtkGraphics::Height(){
	return height;
}

int gxtkGraphics::Cls( float r,float g,float b ){
	primCount=0;

	glClearColor( r/255.0f,g/255.0f,b/255.0f,1 );
	glClear( GL_COLOR_BUFFER_BIT );

	return 0;
}

int gxtkGraphics::SetAlpha( float alpha ){
	this->alpha=alpha;
	
	int a=int(alpha*255);
	
	colorARGB=(a<<24) | (int(b*alpha)<<16) | (int(g*alpha)<<8) | int(r*alpha);
	
	return 0;
}

int gxtkGraphics::SetColor( float r,float g,float b ){
	this->r=r;
	this->g=g;
	this->b=b;

	int a=int(alpha*255);
	
	colorARGB=(a<<24) | (int(b*alpha)<<16) | (int(g*alpha)<<8) | int(r*alpha);
	
	return 0;
}

int gxtkGraphics::SetBlend( int blend ){
	Flush();
	
	switch( blend ){
	case 1:
		glBlendFunc( GL_ONE,GL_ONE );
		break;
	default:
		glBlendFunc( GL_ONE,GL_ONE_MINUS_SRC_ALPHA );
	}

	return 0;
}

int gxtkGraphics::SetScissor( int x,int y,int w,int h ){
	Flush();
	
	if( x!=0 || y!=0 || w!=Width() || h!=Height() ){
		glEnable( GL_SCISSOR_TEST );
		y=Height()-y-h;
		glScissor( x,y,w,h );
	}else{
		glDisable( GL_SCISSOR_TEST );
	}
	return 0;
}

int gxtkGraphics::SetMatrix( float ix,float iy,float jx,float jy,float tx,float ty ){

	tformed=(ix!=1 || iy!=0 || jx!=0 || jy!=1 || tx!=0 || ty!=0);

	this->ix=ix;this->iy=iy;this->jx=jx;this->jy=jy;this->tx=tx;this->ty=ty;

	return 0;
}

int gxtkGraphics::DrawLine( float x0,float y0,float x1,float y1 ){
	if( primType!=2 || primCount==MAX_LINES || primSurf ){
		Flush();
		primType=2;
		primSurf=0;
	}

	if( tformed ){
		float tx0=x0,tx1=x1;
		x0=tx0 * ix + y0 * jx + tx;y0=tx0 * iy + y0 * jy + ty;
		x1=tx1 * ix + y1 * jx + tx;y1=tx1 * iy + y1 * jy + ty;
	}
	
	float *vp=&vertices[primCount++*10];
	
	vp[0]=x0;vp[1]=y0;(int&)vp[4]=colorARGB;
	vp[5]=x1;vp[6]=y1;(int&)vp[9]=colorARGB;
	
	return 0;
}

int gxtkGraphics::DrawPoint( float x,float y ){
	if( primType!=1 || primCount==MAX_POINTS || primSurf ){
		Flush();
		primType=1;
		primSurf=0;
	}
	
	if( tformed ){
		float px=x;
		x=px * ix + y * jx + tx;
		y=px * iy + y * jy + ty;
	}
	
	float *vp=&vertices[primCount++*5];
	
	vp[0]=x;vp[1]=y;(int&)vp[4]=colorARGB;

	return 0;	
}
	
int gxtkGraphics::DrawRect( float x,float y,float w,float h ){
	if( primType!=4 || primCount==MAX_QUADS || primSurf ){
		Flush();
		primType=4;
		primSurf=0;
	}

	float x0=x,x1=x+w,x2=x+w,x3=x;
	float y0=y,y1=y,y2=y+h,y3=y+h;

	if( tformed ){
		float tx0=x0,tx1=x1,tx2=x2,tx3=x3;
		x0=tx0 * ix + y0 * jx + tx;y0=tx0 * iy + y0 * jy + ty;
		x1=tx1 * ix + y1 * jx + tx;y1=tx1 * iy + y1 * jy + ty;
		x2=tx2 * ix + y2 * jx + tx;y2=tx2 * iy + y2 * jy + ty;
		x3=tx3 * ix + y3 * jx + tx;y3=tx3 * iy + y3 * jy + ty;
	}
	
	float *vp=&vertices[primCount++*20];
	
	vp[0 ]=x0;vp[1 ]=y0;(int&)vp[4 ]=colorARGB;
	vp[5 ]=x1;vp[6 ]=y1;(int&)vp[9 ]=colorARGB;
	vp[10]=x2;vp[11]=y2;(int&)vp[14]=colorARGB;
	vp[15]=x3;vp[16]=y3;(int&)vp[19]=colorARGB;

	return 0;
}

int gxtkGraphics::DrawOval( float x,float y,float w,float h ){
	Flush();
	primType=5;
	primSurf=0;
	
	float xr=w/2.0f;
	float yr=h/2.0f;

	int segs;
	if( tformed ){
		float dx_x=xr * ix;
		float dx_y=xr * iy;
		float dx=sqrtf( dx_x*dx_x+dx_y*dx_y );
		float dy_x=yr * jx;
		float dy_y=yr * jy;
		float dy=sqrtf( dy_x*dy_x+dy_y*dy_y );
		segs=(int)( dx+dy );
	}else{
		segs=(int)( abs( xr )+abs( yr ) );
	}
	
	if( segs<12 ){
		segs=12;
	}else if( segs>MAX_VERTS ){
		segs=MAX_VERTS;
	}else{
		segs&=~3;
	}

	float x0=x+xr,y0=y+yr;
	
	float *vp=vertices;

	for( int i=0;i<segs;++i ){
	
		float th=i * 6.28318531f / segs;

		float px=x0+cosf( th ) * xr;
		float py=y0-sinf( th ) * yr;
		
		if( tformed ){
			float ppx=px;
			px=ppx * ix + py * jx + tx;
			py=ppx * iy + py * jy + ty;
		}
		
		vp[0]=px;vp[1]=py;(int&)vp[4]=colorARGB;
		vp+=5;
	}
	
	primCount=segs;

	Flush();
	
	return 0;
}

int gxtkGraphics::DrawPoly( Array<float> verts ){
	int n=verts.Length()/2;
	if( n<3 || n>MAX_VERTS ) return 0;
	
	Flush();
	primType=5;
	primSurf=0;
	
	float *vp=vertices;
	
	for( int i=0;i<n;++i ){
	
		float px=verts[i*2];
		float py=verts[i*2+1];
		
		if( tformed ){
			float ppx=px;
			px=ppx * ix + py * jx + tx;
			py=ppx * iy + py * jy + ty;
		}
		
		vp[0]=px;vp[1]=py;(int&)vp[4]=colorARGB;
		vp+=5;
	}

	primCount=n;
	
	Flush();
	
	return 0;
}


int gxtkGraphics::DrawSurface( gxtkSurface *surf,float x,float y ){
	if( primType!=4 || primCount==MAX_QUADS || surf!=primSurf ){
		Flush();
		primType=4;
		primSurf=surf;
	}
	
	float w=surf->Width();
	float h=surf->Height();
	float x0=x,x1=x+w,x2=x+w,x3=x;
	float y0=y,y1=y,y2=y+h,y3=y+h;
	float u0=0,u1=w*surf->uscale;
	float v0=0,v1=h*surf->vscale;

	if( tformed ){
		float tx0=x0,tx1=x1,tx2=x2,tx3=x3;
		x0=tx0 * ix + y0 * jx + tx;y0=tx0 * iy + y0 * jy + ty;
		x1=tx1 * ix + y1 * jx + tx;y1=tx1 * iy + y1 * jy + ty;
		x2=tx2 * ix + y2 * jx + tx;y2=tx2 * iy + y2 * jy + ty;
		x3=tx3 * ix + y3 * jx + tx;y3=tx3 * iy + y3 * jy + ty;
	}
	
	float *vp=&vertices[primCount++*20];
	
	vp[0 ]=x0;vp[1 ]=y0;vp[2 ]=u0;vp[3 ]=v0;(int&)vp[4 ]=colorARGB;
	vp[5 ]=x1;vp[6 ]=y1;vp[7 ]=u1;vp[8 ]=v0;(int&)vp[9 ]=colorARGB;
	vp[10]=x2;vp[11]=y2;vp[12]=u1;vp[13]=v1;(int&)vp[14]=colorARGB;
	vp[15]=x3;vp[16]=y3;vp[17]=u0;vp[18]=v1;(int&)vp[19]=colorARGB;
	
	return 0;
}

int gxtkGraphics::DrawSurface2( gxtkSurface *surf,float x,float y,int srcx,int srcy,int srcw,int srch ){
	if( primType!=4 || primCount==MAX_QUADS || surf!=primSurf ){
		Flush();
		primType=4;
		primSurf=surf;
	}
	
	float w=srcw;
	float h=srch;
	float x0=x,x1=x+w,x2=x+w,x3=x;
	float y0=y,y1=y,y2=y+h,y3=y+h;
	float u0=srcx*surf->uscale,u1=(srcx+srcw)*surf->uscale;
	float v0=srcy*surf->vscale,v1=(srcy+srch)*surf->vscale;

	if( tformed ){
		float tx0=x0,tx1=x1,tx2=x2,tx3=x3;
		x0=tx0 * ix + y0 * jx + tx;y0=tx0 * iy + y0 * jy + ty;
		x1=tx1 * ix + y1 * jx + tx;y1=tx1 * iy + y1 * jy + ty;
		x2=tx2 * ix + y2 * jx + tx;y2=tx2 * iy + y2 * jy + ty;
		x3=tx3 * ix + y3 * jx + tx;y3=tx3 * iy + y3 * jy + ty;
	}
	
	float *vp=&vertices[primCount++*20];
	
	vp[0 ]=x0;vp[1 ]=y0;vp[2 ]=u0;vp[3 ]=v0;(int&)vp[4 ]=colorARGB;
	vp[5 ]=x1;vp[6 ]=y1;vp[7 ]=u1;vp[8 ]=v0;(int&)vp[9 ]=colorARGB;
	vp[10]=x2;vp[11]=y2;vp[12]=u1;vp[13]=v1;(int&)vp[14]=colorARGB;
	vp[15]=x3;vp[16]=y3;vp[17]=u0;vp[18]=v1;(int&)vp[19]=colorARGB;
	
	return 0;
}
	
int gxtkGraphics::ReadPixels( Array<int> pixels,int x,int y,int width,int height,int offset,int pitch ){

	Flush();

	unsigned *p=(unsigned*)malloc(width*height*4);

	glReadPixels( x,this->height-y-height,width,height,GL_BGRA,GL_UNSIGNED_BYTE,p );
	
	for( int py=0;py<height;++py ){
		memcpy( &pixels[offset+py*pitch],&p[(height-py-1)*width],width*4 );
	}
	
	free( p );
	
	return 0;
}

int gxtkGraphics::WritePixels2( gxtkSurface *surface,Array<int> pixels,int x,int y,int width,int height,int offset,int pitch ){

	Flush();
	
	unsigned *p=(unsigned*)malloc(width*height*4);

	unsigned *d=p;
	for( int py=0;py<height;++py ){
		unsigned *s=(unsigned*)&pixels[offset+py*pitch];
		for( int px=0;px<width;++px ){
			unsigned p=*s++;
			unsigned a=p>>24;
			*d++=(a<<24) | ((p>>16&0xff)*a/255<<16) | ((p>>8&0xff)*a/255<<8) | ((p&0xff)*a/255);
		}
	}

	glBindTexture( GL_TEXTURE_2D,surface->texture );

	glTexSubImage2D( GL_TEXTURE_2D,0,x,y,width,height,GL_BGRA,GL_UNSIGNED_BYTE,p );
	
	free( p );
	
	return 0;
}

//***** gxtkSurface *****

gxtkSurface::gxtkSurface():
data(0),width(0),height(0),depth(0),texture(0),uscale(0),vscale(0){
}

gxtkSurface::gxtkSurface( unsigned char *data,int width,int height,int depth ):
data(data),width(width),height(height),depth(depth),texture(0),uscale(0),vscale(0){
}

void gxtkSurface::SetData( unsigned char *data,int width,int height,int depth ){
	this->data=data;
	this->width=width;
	this->height=height;
	this->depth=depth;
}

gxtkSurface::~gxtkSurface(){
	Discard();
}

int gxtkSurface::Discard(){
	if( texture ){
		glDeleteTextures( 1,&texture );
		texture=0;
	}
	if( data ){
		unloadImage( data );
		data=0;
	}
	return 0;
}

int gxtkSurface::Width(){
	return width;
}

int gxtkSurface::Height(){
	return height;
}

int gxtkSurface::Loaded(){
	return 1;
}

bool gxtkSurface::OnUnsafeLoadComplete(){

	unsigned char *p=data;
	int n=width*height,fmt=0;
	
	switch( depth ){
	case 1:
		fmt=GL_LUMINANCE;
		break;
	case 2:
		if( data ){
			while( n-- ){	//premultiply alpha
				p[0]=p[0]*p[1]/255;
				p+=2;
			}
		}
		fmt=GL_LUMINANCE_ALPHA;
		break;
	case 3:
		fmt=GL_RGB;
		break;
	case 4:
		if( data ){
			while( n-- ){	//premultiply alpha
				p[0]=p[0]*p[3]/255;
				p[1]=p[1]*p[3]/255;
				p[2]=p[2]*p[3]/255;
				p+=4;
			}
		}
		fmt=GL_RGBA;
		break;
	default:
		exit( -1 );
	}
	
	glGenTextures( 1,&texture );
	glBindTexture( GL_TEXTURE_2D,texture );

	if( CFG_MOJO_IMAGE_FILTERING_ENABLED ){
		glTexParameteri( GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_LINEAR );
		glTexParameteri( GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_LINEAR );
	}else{
		glTexParameteri( GL_TEXTURE_2D,GL_TEXTURE_MAG_FILTER,GL_NEAREST );
		glTexParameteri( GL_TEXTURE_2D,GL_TEXTURE_MIN_FILTER,GL_NEAREST );
	}

	glTexParameteri( GL_TEXTURE_2D,GL_TEXTURE_WRAP_S,GL_CLAMP_TO_EDGE );
	glTexParameteri( GL_TEXTURE_2D,GL_TEXTURE_WRAP_T,GL_CLAMP_TO_EDGE );

	bool ok=true;
	
	int texwidth=width;
	int texheight=height;
	
	glTexImage2D( GL_TEXTURE_2D,0,fmt,texwidth,texheight,0,fmt,GL_UNSIGNED_BYTE,0 );
	if( glGetError()!=GL_NO_ERROR ){
	
		texwidth=Pow2Size( width );
		texheight=Pow2Size( height );
		
		glTexImage2D( GL_TEXTURE_2D,0,fmt,texwidth,texheight,0,fmt,GL_UNSIGNED_BYTE,0 );
		if( glGetError()!=GL_NO_ERROR ) ok=false;
	}
	
	if( ok ){
		if( data ){
			glPixelStorei( GL_UNPACK_ALIGNMENT,1 );
			glTexSubImage2D( GL_TEXTURE_2D,0,0,0,width,height,fmt,GL_UNSIGNED_BYTE,data );
		}
		uscale=1.0/texwidth;
		vscale=1.0/texheight;
	}
	
	if( data ){
		unloadImage( data );
		data=0;
	}
	
	return ok;
}

//***** END OF COMMON OPENGL CODE *****

bool gxtkGraphics::Validate(){
	width=height=0;
	glfwGetWindowSize( &width,&height );
	return width>0 && height>0;
}

void gxtkGraphics::EndRender(){
	if( mode ) Flush();
	glfwSwapBuffers();
}

gxtkSurface *gxtkGraphics::LoadSurface__UNSAFE__( gxtkSurface *surface,String path ){
	int width,height,depth;
	unsigned char *data=loadImage( path,&width,&height,&depth );
	if( !data ) return 0;
	surface->SetData( data,width,height,depth );
	return surface;
}

gxtkSurface *gxtkGraphics::LoadSurface( String path ){

	gxtkSurface *surf=LoadSurface__UNSAFE__( new gxtkSurface(),path );
	if( surf && !surf->OnUnsafeLoadComplete() ) surf=0;
	return surf;
}

gxtkSurface *gxtkGraphics::CreateSurface( int width,int height ){

	gxtkSurface *surf=new gxtkSurface( 0,width,height,4 );
	if( surf && !surf->OnUnsafeLoadComplete() ) surf=0;
	return surf;
}

//gxtkSurface *gxtkGraphics::CreateSurface2( BBDataBuffer *buf ){
//	int width,height,depth;
//	unsigned char *data=loadImage( (unsigned char*)buf->ReadPointer(0),buf->Length(),&width,&height,&depth );
//	if( data ) return new gxtkSurface( data,width,height,depth );
//	return 0;
//}

// ***** End of graphics ******

class gxtkInput : public gxtkObject{
public:
	int keyStates[512];
	int charQueue[32];
	int charPut,charGet;
	float mouseX,mouseY;
	
	float joyPos[6];
	int joyButton[32];
	
	gxtkInput();
	~gxtkInput(){
//		Print( "~gxtkInput" );
	}
	
	void BeginUpdate();
	void EndUpdate();
	
	void OnKeyDown( int key );
	void OnKeyUp( int key );
	void PutChar( int chr );
	
	//***** GXTK API *****
	virtual int SetKeyboardEnabled( int enabled );
	
	virtual int KeyDown( int key );
	virtual int KeyHit( int key );
	virtual int GetChar();
	
	virtual float MouseX();
	virtual float MouseY();

	virtual float JoyX( int index );
	virtual float JoyY( int index );
	virtual float JoyZ( int index );

	virtual float TouchX( int index );
	virtual float TouchY( int index );
	
	virtual float AccelX();
	virtual float AccelY();
	virtual float AccelZ();
};

class gxtkChannel{
public:
	ALuint source;
	gxtkSample *sample;
	int flags;
	int state;
	
	int AL_Source();
};

class gxtkAudio : public gxtkObject{
public:
	gxtkChannel channels[33];

	gxtkAudio();

	void mark();
	void OnSuspend();
	void OnResume();

	//***** GXTK API *****
	virtual gxtkSample *LoadSample__UNSAFE__( gxtkSample *sample,String path );
	virtual gxtkSample *LoadSample( String path );
	virtual int PlaySample( gxtkSample *sample,int channel,int flags );

	virtual int StopChannel( int channel );
	virtual int PauseChannel( int channel );
	virtual int ResumeChannel( int channel );
	virtual int ChannelState( int channel );
	virtual int SetVolume( int channel,float volume );
	virtual int SetPan( int channel,float pan );
	virtual int SetRate( int channel,float rate );
	
	virtual int PlayMusic( String path,int flags );
	virtual int StopMusic();
	virtual int PauseMusic();
	virtual int ResumeMusic();
	virtual int MusicState();
	virtual int SetMusicVolume( float volume );
};

class gxtkSample : public gxtkObject{
public:
	ALuint al_buffer;

	gxtkSample();
	gxtkSample( ALuint buf );
	~gxtkSample();
	
	void SetBuffer( ALuint buf );
	
	//***** GXTK API *****
	virtual int Discard();
};

//***** gxtkApp *****

int RunApp(){
	app->Run();
	return 0;
}

gxtkApp::gxtkApp(){
	app=this;

	graphics=new gxtkGraphics;
	input=new gxtkInput;
	audio=new gxtkAudio;

	updateRate=0;
	suspended=false;

	runner=RunApp;
}

void gxtkApp::Run(){

	glfwEnable( GLFW_KEY_REPEAT );
	glfwDisable( GLFW_AUTO_POLL_EVENTS );

	glfwSetKeyCallback( OnKey );
	glfwSetCharCallback( OnChar );
	glfwSetWindowSizeCallback( OnWindowSize );
	glfwSetWindowRefreshCallback( OnWindowRefresh );
	glfwSetMouseButtonCallback( OnMouseButton );

	InvokeOnCreate();
	InvokeOnRender();

	while( glfwGetWindowParam( GLFW_OPENED ) ){
	
		if( glfwGetWindowParam( GLFW_ICONIFIED ) ){
			if( !suspended ){
				InvokeOnSuspend();
				continue;
			}
		}else if( glfwGetWindowParam( GLFW_ACTIVE ) ){
			if( suspended ){
				InvokeOnResume();
				continue;
			}
		}else if( CFG_MOJO_AUTO_SUSPEND_ENABLED ){
			if( !suspended ){
				InvokeOnSuspend();
				continue;
			}
		}
	
		if( !updateRate || suspended ){
			InvokeOnRender();
			glfwWaitEvents();
			continue;
		}
		
		float time=glfwGetTime();
		if( time<nextUpdate ){
			glfwSleep( nextUpdate-time );
			continue;
		}

		glfwPollEvents();
				
		int updates=0;
		for(;;){
			nextUpdate+=updatePeriod;
			
			InvokeOnUpdate();
			if( !updateRate ) break;
			
			if( nextUpdate>glfwGetTime() ){
				break;
			}
			
			if( ++updates==7 ){
				nextUpdate=glfwGetTime();
				break;
			}
		}
		InvokeOnRender();
	}
}

void gxtkApp::OnWindowSize( int width,int height ){
//	Print( "OnWindowSize!" );
//	if( width>0 && height>0 ){
//		app->InvokeOnResume();
//	}else{
//		app->InvokeOnSuspend();
//	}
}

void gxtkApp::OnWindowRefresh(){
//	Print( "OnWindowRefresh!" );
//	app->InvokeOnRender();
}

void gxtkApp::OnMouseButton( int button,int action ){
	int key;
	switch( button ){
	case GLFW_MOUSE_BUTTON_LEFT:key=KEY_LMB;break;
	case GLFW_MOUSE_BUTTON_RIGHT:key=KEY_RMB;break;
	case GLFW_MOUSE_BUTTON_MIDDLE:key=KEY_MMB;break;
	default:return;
	}
	switch( action ){
	case GLFW_PRESS:
		app->input->OnKeyDown( key );
		break;
	case GLFW_RELEASE:
		app->input->OnKeyUp( key );
		break;
	}
}

void gxtkApp::OnKey( int key,int action ){

	key=TransKey( key );
	if( !key ) return;
	
	switch( action ){
	case GLFW_PRESS:
		app->input->OnKeyDown( key );
		
		if( int chr=KeyToChar( key ) ){
			app->input->PutChar( chr );
		}
		
		break;
	case GLFW_RELEASE:
		app->input->OnKeyUp( key );
		break;
	}
}

void gxtkApp::OnChar( int chr,int action ){

	switch( action ){
	case GLFW_PRESS:
		app->input->PutChar( chr );
		break;
	}
}

void gxtkApp::InvokeOnCreate(){
	if( !graphics->Validate() ) abort();
	
	OnCreate();
	
	gc_collect();
}

void gxtkApp::InvokeOnSuspend(){
	if( suspended ) return;
	
	suspended=true;
	OnSuspend();
	audio->OnSuspend();
	if( updateRate ){
		int upr=updateRate;
		SetUpdateRate( 0 );
		updateRate=upr;
	}
	
	gc_collect();
}

void gxtkApp::InvokeOnResume(){
	if( !suspended ) return;
	
	if( updateRate ){
		int upr=updateRate;
		updateRate=0;
		SetUpdateRate( upr );
	}
	audio->OnResume();
	OnResume();
	suspended=false;
	
	gc_collect();
}

void gxtkApp::InvokeOnUpdate(){
	if( suspended || !updateRate || !graphics->Validate() ) return;
	
	input->BeginUpdate();
	OnUpdate();
	input->EndUpdate();
	
	gc_collect();
}

void gxtkApp::InvokeOnRender(){
	if( suspended || !graphics->Validate() ) return;
	
	graphics->BeginRender();
	OnRender();
	graphics->EndRender();
	
	gc_collect();
}

//***** GXTK API *****

gxtkGraphics *gxtkApp::GraphicsDevice(){
	return graphics;
}

gxtkInput *gxtkApp::InputDevice(){
	return input;
}

gxtkAudio *gxtkApp::AudioDevice(){
	return audio;
}

String gxtkApp::AppTitle(){
	return "<TODO>";
}

String gxtkApp::LoadState(){
	if( FILE *fp=fopen( ".monkeystate","rb" ) ){
		String str=String::Load( fp );
		fclose( fp );
		return str;
	}
	return "";
}

int gxtkApp::SaveState( String state ){
	if( FILE *fp=fopen( ".monkeystate","wb" ) ){
		bool ok=state.Save( fp );
		fclose( fp );
		return ok ? 0 : -2;
	}
	return -1;
}

String gxtkApp::LoadString( String path ){
	if( FILE *fp=fopenFile( path,"rb" ) ){
		String str=String::Load( fp );
		fclose( fp );
		return str;
	}
	return "";
}

int gxtkApp::SetUpdateRate( int hertz ){
	updateRate=hertz;

	if( updateRate ){
		updatePeriod=1.0/updateRate;
		nextUpdate=glfwGetTime()+updatePeriod;
	}
	return 0;
}

int gxtkApp::MilliSecs(){
	return glfwGetTime()*1000.0;
}

int gxtkApp::Loading(){
	return 0;
}

int gxtkApp::OnCreate(){
	return 0;
}

int gxtkApp::OnSuspend(){
	return 0;
}

int gxtkApp::OnResume(){
	return 0;
}

int gxtkApp::OnUpdate(){
	return 0;
}

int gxtkApp::OnRender(){
	return 0;
}

int gxtkApp::OnLoading(){
	return 0;
}

// ***** gxtkInput *****

gxtkInput::gxtkInput(){
	memset( keyStates,0,sizeof(keyStates) );
	memset( charQueue,0,sizeof(charQueue) );
	mouseX=mouseY=0;
	charPut=charGet=0;
	
}

void gxtkInput::BeginUpdate(){

	int x=0,y=0;
	glfwGetMousePos( &x,&y );
	mouseX=x;
	mouseY=y;
	
	int n_axes=glfwGetJoystickParam( GLFW_JOYSTICK_1,GLFW_AXES );
	int n_buttons=glfwGetJoystickParam( GLFW_JOYSTICK_1,GLFW_BUTTONS );

//	printf( "n_axes=%i, n_buttons=%i\n",n_axes,n_buttons );fflush( stdout );
	
	memset( joyPos,0,sizeof(joyPos) );	
	glfwGetJoystickPos( GLFW_JOYSTICK_1,joyPos,n_axes );
	
	unsigned char buttons[32];
	memset( buttons,0,sizeof(buttons) );
	glfwGetJoystickButtons( GLFW_JOYSTICK_1,buttons,n_buttons );

	float t;
	switch( n_axes ){
	case 4:	//my saitek...axes=4, buttons=14
		joyPos[4]=joyPos[2];
		joyPos[3]=joyPos[3];
		joyPos[2]=0;
		break;
	case 5:	//xbox360...axes=5, buttons=10
		t=joyPos[3];
		joyPos[3]=joyPos[4];
		joyPos[4]=t;
		break;
	}
	
	for( int i=0;i<n_buttons;++i ){
		if( buttons[i]==GLFW_PRESS ){
			OnKeyDown( 256+i );
		}else{
			OnKeyUp( 256+i );
		}
	}
}

void gxtkInput::EndUpdate(){
	for( int i=0;i<512;++i ){
		keyStates[i]&=0x100;
	}
	charGet=0;
	charPut=0;
}

void gxtkInput::OnKeyDown( int key ){
	if( keyStates[key] & 0x100 ) return;
	
	keyStates[key]|=0x100;
	++keyStates[key];
	
	switch( key ){
	case VKEY_LSHIFT:case VKEY_RSHIFT:
		if( (keyStates[VKEY_LSHIFT]&0x100) || (keyStates[VKEY_RSHIFT]&0x100) ) OnKeyDown( VKEY_SHIFT );
		break;
	case VKEY_LCONTROL:case VKEY_RCONTROL:
		if( (keyStates[VKEY_LCONTROL]&0x100) || (keyStates[VKEY_RCONTROL]&0x100) ) OnKeyDown( VKEY_CONTROL );
		break;
	}
}

void gxtkInput::OnKeyUp( int key ){
	if( !(keyStates[key] & 0x100) ) return;

	keyStates[key]&=0xff;
	
	switch( key ){
	case VKEY_LSHIFT:case VKEY_RSHIFT:
		if( !(keyStates[VKEY_LSHIFT]&0x100) && !(keyStates[VKEY_RSHIFT]&0x100) ) OnKeyUp( VKEY_SHIFT );
		break;
	case VKEY_LCONTROL:case VKEY_RCONTROL:
		if( !(keyStates[VKEY_LCONTROL]&0x100) && !(keyStates[VKEY_RCONTROL]&0x100) ) OnKeyUp( VKEY_CONTROL );
		break;
	}
}

void gxtkInput::PutChar( int chr ){
	if( charPut<32 ) charQueue[charPut++]=chr;
}

//***** GXTK API *****

int gxtkInput::SetKeyboardEnabled( int enabled ){
	return 0;
}

int gxtkInput::KeyDown( int key ){
	if( key>0 && key<512 ){
		if( key==KEY_TOUCH0 ) key=KEY_LMB;
		return keyStates[key] >> 8;
	}
	return 0;
}

int gxtkInput::KeyHit( int key ){
	if( key>0 && key<512 ){
		if( key==KEY_TOUCH0 ) key=KEY_LMB;
		return keyStates[key] & 0xff;
	}
	return 0;
}

int gxtkInput::GetChar(){
	if( charGet<charPut ){
		return charQueue[charGet++];
	}
	return 0;
}
	
float gxtkInput::MouseX(){
	return mouseX;
}

float gxtkInput::MouseY(){
	return mouseY;
}

float gxtkInput::JoyX( int index ){
	switch( index ){
	case 0:return joyPos[0];
	case 1:return joyPos[3];
	}
	return 0;
}

float gxtkInput::JoyY( int index ){
	switch( index ){
	case 0:return joyPos[1];
	case 1:return -joyPos[4];
	}
	return 0;
}

float gxtkInput::JoyZ( int index ){
	switch( index ){
	case 0:return joyPos[2];
	case 1:return joyPos[5];
	}
	return 0;
}

float gxtkInput::TouchX( int index ){
	return mouseX;
}

float gxtkInput::TouchY( int index ){
	return mouseY;
}

float gxtkInput::AccelX(){
	return 0;
}

float gxtkInput::AccelY(){
	return 0;
}

float gxtkInput::AccelZ(){
	return 0;
}

//***** gxtkAudio *****
static std::vector<ALuint> discarded;

static void FlushDiscarded( gxtkAudio *audio ){

	if( !discarded.size() ) return;
	
	for( int i=0;i<33;++i ){
		gxtkChannel *chan=&audio->channels[i];
		if( chan->state ){
			int state=0;
			alGetSourcei( chan->source,AL_SOURCE_STATE,&state );
			if( state==AL_STOPPED ) alSourcei( chan->source,AL_BUFFER,0 );
		}
	}
	
	std::vector<ALuint> out;
	
	for( int i=0;i<discarded.size();++i ){
		ALuint buf=discarded[i];
		alDeleteBuffers( 1,&buf );
		ALenum err=alGetError();
		if( err==AL_NO_ERROR ){
//			printf( "alDeleteBuffers OK!\n" );fflush( stdout );
		}else{
//			printf( "alDeleteBuffers failed...\n" );fflush( stdout );
			out.push_back( buf );
		}
	}
	discarded=out;
}

static void CheckAL(){
	ALenum err=alGetError();
	if( err!=AL_NO_ERROR ){
		printf( "AL Error:%i\n",err );
		fflush( stdout );
	}
}

int gxtkChannel::AL_Source(){
	if( !source ) alGenSources( 1,&source );
	return source;
}

gxtkAudio::gxtkAudio(){
	alDistanceModel( AL_NONE );
	memset( channels,0,sizeof(channels) );
}

void gxtkAudio::mark(){
	for( int i=0;i<33;++i ){
		gxtkChannel *chan=&channels[i];
		if( chan->state!=0 ){
			int state=0;
			alGetSourcei( chan->source,AL_SOURCE_STATE,&state );
			if( state!=AL_STOPPED ) gc_mark( chan->sample );
		}
	}
}

void gxtkAudio::OnSuspend(){
	for( int i=0;i<33;++i ){
		gxtkChannel *chan=&channels[i];
		if( chan->state==1 ){
			int state=0;
			alGetSourcei( chan->source,AL_SOURCE_STATE,&state );
			if( state==AL_PLAYING ) alSourcePause( chan->source );
		}
	}
}

void gxtkAudio::OnResume(){
	for( int i=0;i<33;++i ){
		gxtkChannel *chan=&channels[i];
		if( chan->state==1 ){
			int state=0;
			alGetSourcei( chan->source,AL_SOURCE_STATE,&state );
			if( state==AL_PAUSED ) alSourcePlay( chan->source );
		}
	}
}

gxtkSample *gxtkAudio::LoadSample__UNSAFE__( gxtkSample *sample,String path ){

	int length=0;
	int channels=0;
	int format=0;
	int hertz=0;
	unsigned char *data=loadSound( path,&length,&channels,&format,&hertz );
	if( !data ) return 0;
	
	int al_format=0;
	if( format==1 && channels==1 ){
		al_format=AL_FORMAT_MONO8;
	}else if( format==1 && channels==2 ){
		al_format=AL_FORMAT_STEREO8;
	}else if( format==2 && channels==1 ){
		al_format=AL_FORMAT_MONO16;
	}else if( format==2 && channels==2 ){
		al_format=AL_FORMAT_STEREO16;
	}
	
	int size=length*channels*format;
	
	ALuint al_buffer;
	alGenBuffers( 1,&al_buffer );
	alBufferData( al_buffer,al_format,data,size,hertz );
	unloadSound( data );
	
	sample->SetBuffer( al_buffer );
	return sample;
}

gxtkSample *gxtkAudio::LoadSample( String path ){

	FlushDiscarded( this );

	return LoadSample__UNSAFE__( new gxtkSample(),path );
}

int gxtkAudio::PlaySample( gxtkSample *sample,int channel,int flags ){

	FlushDiscarded( this );
	
	gxtkChannel *chan=&channels[channel];
	
	chan->AL_Source();
	
	alSourceStop( chan->source );
	alSourcei( chan->source,AL_BUFFER,sample->al_buffer );
	alSourcei( chan->source,AL_LOOPING,flags ? 1 : 0 );
	alSourcePlay( chan->source );
	
	gc_assign( chan->sample,sample );

	chan->flags=flags;
	chan->state=1;

	return 0;
}

int gxtkAudio::StopChannel( int channel ){
	gxtkChannel *chan=&channels[channel];

	if( chan->state!=0 ){
		alSourceStop( chan->source );
		chan->state=0;
	}
	return 0;
}

int gxtkAudio::PauseChannel( int channel ){
	gxtkChannel *chan=&channels[channel];

	if( chan->state==1 ){
		int state=0;
		alGetSourcei( chan->source,AL_SOURCE_STATE,&state );
		if( state==AL_STOPPED ){
			chan->state=0;
		}else{
			alSourcePause( chan->source );
			chan->state=2;
		}
	}
	return 0;
}

int gxtkAudio::ResumeChannel( int channel ){
	gxtkChannel *chan=&channels[channel];

	if( chan->state==2 ){
		alSourcePlay( chan->source );
		chan->state=1;
	}
	return 0;
}

int gxtkAudio::ChannelState( int channel ){
	gxtkChannel *chan=&channels[channel];
	
	if( chan->state==1 ){
		int state=0;
		alGetSourcei( chan->source,AL_SOURCE_STATE,&state );
		if( state==AL_STOPPED ) chan->state=0;
	}
	return chan->state;
}

int gxtkAudio::SetVolume( int channel,float volume ){
	gxtkChannel *chan=&channels[channel];

	alSourcef( chan->AL_Source(),AL_GAIN,volume );
	return 0;
}

int gxtkAudio::SetPan( int channel,float pan ){
	gxtkChannel *chan=&channels[channel];

	alSource3f( chan->AL_Source(),AL_POSITION,pan,0,0 );
	return 0;
}

int gxtkAudio::SetRate( int channel,float rate ){
	gxtkChannel *chan=&channels[channel];

	alSourcef( chan->AL_Source(),AL_PITCH,rate );
	return 0;
}

int gxtkAudio::PlayMusic( String path,int flags ){
	StopMusic();
	
	gxtkSample *music=LoadSample( path );
	if( !music ) return -1;
	
	PlaySample( music,32,flags );
	return 0;
}

int gxtkAudio::StopMusic(){
	StopChannel( 32 );
	return 0;
}

int gxtkAudio::PauseMusic(){
	PauseChannel( 32 );
	return 0;
}

int gxtkAudio::ResumeMusic(){
	ResumeChannel( 32 );
	return 0;
}

int gxtkAudio::MusicState(){
	return ChannelState( 32 );
}

int gxtkAudio::SetMusicVolume( float volume ){
	SetVolume( 32,volume );
	return 0;
}

//***** gxtkSample *****

gxtkSample::gxtkSample():
al_buffer(0){
}

gxtkSample::gxtkSample( ALuint buf ):
al_buffer(buf){
}

gxtkSample::~gxtkSample(){
	Discard();
}

void gxtkSample::SetBuffer( ALuint buf ){
	al_buffer=buf;
}

int gxtkSample::Discard(){
	if( al_buffer ){
		discarded.push_back( al_buffer );
		al_buffer=0;
	}
	return 0;
}

// ***** thread.h *****

class BBThread : public Object{
public:
	BBThread();
	~BBThread();
	
	virtual void Start();
	virtual bool IsRunning();
	virtual void Wait();
	
	virtual void Run__UNSAFE__();
	
private:

	enum{
		INIT=0,
		RUNNING=1,
		FINISHED=2
	};

	int _state;
	
#if __cplusplus_winrt

#elif _WIN32

	DWORD _id;
	HANDLE _handle;
	
	static DWORD WINAPI run( void *p );
	
#else

	pthread_t _handle;
	
	static void *run( void *p );
	
#endif

};

// ***** thread.cpp *****

BBThread::BBThread():_state( INIT ){
}

BBThread::~BBThread(){
	Wait();
}

bool BBThread::IsRunning(){
	return _state==RUNNING;
}

void BBThread::Run__UNSAFE__(){
}

#if __cplusplus_winrt

#elif _WIN32

void BBThread::Start(){
	if( _state==RUNNING ) return;
	
	if( _state==FINISHED ) CloseHandle( _handle );

	_state=RUNNING;

	_handle=CreateThread( 0,0,run,this,0,&_id );
	
//	_handle=CreateThread( 0,0,run,this,CREATE_SUSPENDED,&_id );
//	SetThreadPriority( _handle,THREAD_PRIORITY_ABOVE_NORMAL );
//	ResumeThread( _handle );
}

void BBThread::Wait(){
	if( _state==INIT ) return;

	WaitForSingleObject( _handle,INFINITE );
	CloseHandle( _handle );

	_state=INIT;
}

DWORD WINAPI BBThread::run( void *p ){
	BBThread *thread=(BBThread*)p;

	thread->Run__UNSAFE__();
	
	thread->_state=FINISHED;
	return 0;
}

#else

void BBThread::Start(){
	if( _state==RUNNING ) return;
	
	if( _state==FINISHED ) pthread_join( _handle,0 );
	
	_state=RUNNING;
	
	pthread_create( &_handle,0,run,this );
}

void BBThread::Wait(){
	if( _state==INIT ) return;
	
	pthread_join( _handle,0 );
	
	_state=INIT;
}

void *BBThread::run( void *p ){
	BBThread *thread=(BBThread*)p;

	thread->Run__UNSAFE__();

	thread->_state=FINISHED;
	return 0;
}

#endif
class bb_app_App;
class bb_xmas_XmasApp;
class bb_app_AppDevice;
class bb_graphics_Image;
class bb_graphics_GraphicsContext;
class bb_graphics_Frame;
class bb_gfx_GFX;
class bb_scene_Scene;
class bb_sfx_SFX;
class bb_audio_Sound;
class bb_map_Map;
class bb_map_StringMap;
class bb_map_Map2;
class bb_map_StringMap2;
class bb_autofit_VirtualDisplay;
class bb_floorsegment_FloorSegment;
class bb_tree_Tree;
class bb_list_List;
class bb_list_Node;
class bb_list_HeadNode;
class bb_house_House;
class bb_list_List2;
class bb_list_Node2;
class bb_list_HeadNode2;
class bb_star_Star;
class bb_list_List3;
class bb_list_Node3;
class bb_list_HeadNode3;
class bb_snowman_Snowman;
class bb_list_List4;
class bb_list_Node4;
class bb_list_HeadNode4;
class bb_snowflake_Snowflake;
class bb_list_List5;
class bb_list_Node5;
class bb_list_HeadNode5;
class bb_moon_Moon;
class bb_list_Enumerator;
class bb_list_Enumerator2;
class bb_list_Enumerator3;
class bb_list_Enumerator4;
class bb_list_Enumerator5;
class bb_app_App : public Object{
	public:
	bb_app_App();
	bb_app_App* g_new();
	virtual int m_OnCreate();
	virtual int m_OnUpdate();
	virtual int m_OnSuspend();
	virtual int m_OnResume();
	virtual int m_OnRender();
	virtual int m_OnLoading();
	void mark();
};
class bb_xmas_XmasApp : public bb_app_App{
	public:
	bb_scene_Scene* f_scene;
	bb_xmas_XmasApp();
	bb_xmas_XmasApp* g_new();
	virtual int m_OnCreate();
	virtual int m_OnUpdate();
	virtual int m_OnRender();
	void mark();
};
class bb_app_AppDevice : public gxtkApp{
	public:
	bb_app_App* f_app;
	int f_updateRate;
	bb_app_AppDevice();
	bb_app_AppDevice* g_new(bb_app_App*);
	bb_app_AppDevice* g_new2();
	virtual int OnCreate();
	virtual int OnUpdate();
	virtual int OnSuspend();
	virtual int OnResume();
	virtual int OnRender();
	virtual int OnLoading();
	virtual int SetUpdateRate(int);
	void mark();
};
extern gxtkGraphics* bb_graphics_device;
int bb_graphics_SetGraphicsDevice(gxtkGraphics*);
extern gxtkInput* bb_input_device;
int bb_input_SetInputDevice(gxtkInput*);
extern gxtkAudio* bb_audio_device;
int bb_audio_SetAudioDevice(gxtkAudio*);
extern bb_app_AppDevice* bb_app_device;
int bbMain();
class bb_graphics_Image : public Object{
	public:
	gxtkSurface* f_surface;
	int f_width;
	int f_height;
	Array<bb_graphics_Frame* > f_frames;
	int f_flags;
	Float f_tx;
	Float f_ty;
	bb_graphics_Image* f_source;
	bb_graphics_Image();
	static int g_DefaultFlags;
	bb_graphics_Image* g_new();
	virtual int m_SetHandle(Float,Float);
	virtual int m_ApplyFlags(int);
	virtual bb_graphics_Image* m_Init(gxtkSurface*,int,int);
	virtual bb_graphics_Image* m_Grab(int,int,int,int,int,int,bb_graphics_Image*);
	virtual bb_graphics_Image* m_GrabImage(int,int,int,int,int,int);
	void mark();
};
class bb_graphics_GraphicsContext : public Object{
	public:
	bb_graphics_Image* f_defaultFont;
	bb_graphics_Image* f_font;
	int f_firstChar;
	int f_matrixSp;
	Float f_ix;
	Float f_iy;
	Float f_jx;
	Float f_jy;
	Float f_tx;
	Float f_ty;
	int f_tformed;
	int f_matDirty;
	Float f_color_r;
	Float f_color_g;
	Float f_color_b;
	Float f_alpha;
	int f_blend;
	Float f_scissor_x;
	Float f_scissor_y;
	Float f_scissor_width;
	Float f_scissor_height;
	Array<Float > f_matrixStack;
	bb_graphics_GraphicsContext();
	bb_graphics_GraphicsContext* g_new();
	virtual int m_Validate();
	void mark();
};
extern bb_graphics_GraphicsContext* bb_graphics_context;
String bb_data_FixDataPath(String);
class bb_graphics_Frame : public Object{
	public:
	int f_x;
	int f_y;
	bb_graphics_Frame();
	bb_graphics_Frame* g_new(int,int);
	bb_graphics_Frame* g_new2();
	void mark();
};
bb_graphics_Image* bb_graphics_LoadImage(String,int,int);
bb_graphics_Image* bb_graphics_LoadImage2(String,int,int,int,int);
int bb_graphics_SetFont(bb_graphics_Image*,int);
extern gxtkGraphics* bb_graphics_renderDevice;
int bb_graphics_SetMatrix(Float,Float,Float,Float,Float,Float);
int bb_graphics_SetMatrix2(Array<Float >);
int bb_graphics_SetColor(Float,Float,Float);
int bb_graphics_SetAlpha(Float);
int bb_graphics_SetBlend(int);
int bb_graphics_DeviceWidth();
int bb_graphics_DeviceHeight();
int bb_graphics_SetScissor(Float,Float,Float,Float);
int bb_graphics_BeginRender();
int bb_graphics_EndRender();
int bb_app_SetUpdateRate(int);
extern int bb_random_Seed;
class bb_gfx_GFX : public Object{
	public:
	bb_gfx_GFX();
	static bb_graphics_Image* g_Tileset;
	static void g_Init();
	static void g_Draw(int,int,int,int,int,int);
	void mark();
};
class bb_scene_Scene : public Object{
	public:
	int f_FloorSegmentCount;
	Array<bb_floorsegment_FloorSegment* > f_FloorSegments;
	bb_list_List* f_Trees;
	bb_list_List2* f_Houses;
	bb_list_List3* f_Stars;
	bb_list_List4* f_Snowmen;
	bb_list_List5* f_Snowflakes;
	bb_moon_Moon* f_moon;
	bb_scene_Scene();
	static bb_graphics_Image* g_Background;
	static void g_Init();
	static int g_Width;
	bb_scene_Scene* g_new();
	static int g_Height;
	virtual void m_AddSnowFlake();
	virtual void m_Update();
	virtual void m_Render();
	void mark();
};
class bb_sfx_SFX : public Object{
	public:
	bb_sfx_SFX();
	static int g_ActiveChannel;
	static bb_map_StringMap* g_Sounds;
	static bb_map_StringMap2* g_Musics;
	static void g_Init();
	void mark();
};
class bb_audio_Sound : public Object{
	public:
	bb_audio_Sound();
	void mark();
};
class bb_map_Map : public Object{
	public:
	bb_map_Map();
	bb_map_Map* g_new();
	void mark();
};
class bb_map_StringMap : public bb_map_Map{
	public:
	bb_map_StringMap();
	bb_map_StringMap* g_new();
	void mark();
};
class bb_map_Map2 : public Object{
	public:
	bb_map_Map2();
	bb_map_Map2* g_new();
	void mark();
};
class bb_map_StringMap2 : public bb_map_Map2{
	public:
	bb_map_StringMap2();
	bb_map_StringMap2* g_new();
	void mark();
};
class bb_autofit_VirtualDisplay : public Object{
	public:
	Float f_vwidth;
	Float f_vheight;
	Float f_vzoom;
	Float f_lastvzoom;
	Float f_vratio;
	int f_lastdevicewidth;
	int f_lastdeviceheight;
	int f_device_changed;
	Float f_fdw;
	Float f_fdh;
	Float f_dratio;
	Float f_multi;
	Float f_heightborder;
	Float f_widthborder;
	int f_zoom_changed;
	Float f_realx;
	Float f_realy;
	Float f_offx;
	Float f_offy;
	Float f_sx;
	Float f_sw;
	Float f_sy;
	Float f_sh;
	Float f_scaledw;
	Float f_scaledh;
	Float f_vxoff;
	Float f_vyoff;
	bb_autofit_VirtualDisplay();
	static bb_autofit_VirtualDisplay* g_Display;
	bb_autofit_VirtualDisplay* g_new(int,int,Float);
	bb_autofit_VirtualDisplay* g_new2();
	virtual int m_UpdateVirtualDisplay(bool,bool);
	void mark();
};
int bb_autofit_SetVirtualDisplay(int,int,Float);
class bb_floorsegment_FloorSegment : public Object{
	public:
	bb_scene_Scene* f_scene;
	int f_X;
	int f_Y;
	bb_floorsegment_FloorSegment();
	static int g_Width;
	bb_floorsegment_FloorSegment* g_new(bb_scene_Scene*);
	bb_floorsegment_FloorSegment* g_new2();
	virtual void m_SetPos(int,int);
	virtual void m_Render();
	void mark();
};
class bb_tree_Tree : public Object{
	public:
	bb_tree_Tree();
	virtual void m_Update();
	virtual void m_Render();
	void mark();
};
class bb_list_List : public Object{
	public:
	bb_list_Node* f__head;
	bb_list_List();
	bb_list_List* g_new();
	virtual bb_list_Node* m_AddLast(bb_tree_Tree*);
	bb_list_List* g_new2(Array<bb_tree_Tree* >);
	virtual bb_list_Enumerator* m_ObjectEnumerator();
	void mark();
};
class bb_list_Node : public Object{
	public:
	bb_list_Node* f__succ;
	bb_list_Node* f__pred;
	bb_tree_Tree* f__data;
	bb_list_Node();
	bb_list_Node* g_new(bb_list_Node*,bb_list_Node*,bb_tree_Tree*);
	bb_list_Node* g_new2();
	void mark();
};
class bb_list_HeadNode : public bb_list_Node{
	public:
	bb_list_HeadNode();
	bb_list_HeadNode* g_new();
	void mark();
};
class bb_house_House : public Object{
	public:
	bb_house_House();
	virtual void m_Update();
	virtual void m_Render();
	void mark();
};
class bb_list_List2 : public Object{
	public:
	bb_list_Node2* f__head;
	bb_list_List2();
	bb_list_List2* g_new();
	virtual bb_list_Node2* m_AddLast2(bb_house_House*);
	bb_list_List2* g_new2(Array<bb_house_House* >);
	virtual bb_list_Enumerator2* m_ObjectEnumerator();
	void mark();
};
class bb_list_Node2 : public Object{
	public:
	bb_list_Node2* f__succ;
	bb_list_Node2* f__pred;
	bb_house_House* f__data;
	bb_list_Node2();
	bb_list_Node2* g_new(bb_list_Node2*,bb_list_Node2*,bb_house_House*);
	bb_list_Node2* g_new2();
	void mark();
};
class bb_list_HeadNode2 : public bb_list_Node2{
	public:
	bb_list_HeadNode2();
	bb_list_HeadNode2* g_new();
	void mark();
};
class bb_star_Star : public Object{
	public:
	bb_star_Star();
	virtual void m_Update();
	virtual void m_Render();
	void mark();
};
class bb_list_List3 : public Object{
	public:
	bb_list_Node3* f__head;
	bb_list_List3();
	bb_list_List3* g_new();
	virtual bb_list_Node3* m_AddLast3(bb_star_Star*);
	bb_list_List3* g_new2(Array<bb_star_Star* >);
	virtual bb_list_Enumerator3* m_ObjectEnumerator();
	void mark();
};
class bb_list_Node3 : public Object{
	public:
	bb_list_Node3* f__succ;
	bb_list_Node3* f__pred;
	bb_star_Star* f__data;
	bb_list_Node3();
	bb_list_Node3* g_new(bb_list_Node3*,bb_list_Node3*,bb_star_Star*);
	bb_list_Node3* g_new2();
	void mark();
};
class bb_list_HeadNode3 : public bb_list_Node3{
	public:
	bb_list_HeadNode3();
	bb_list_HeadNode3* g_new();
	void mark();
};
class bb_snowman_Snowman : public Object{
	public:
	bb_snowman_Snowman();
	virtual void m_Update();
	virtual void m_Render();
	void mark();
};
class bb_list_List4 : public Object{
	public:
	bb_list_Node4* f__head;
	bb_list_List4();
	bb_list_List4* g_new();
	virtual bb_list_Node4* m_AddLast4(bb_snowman_Snowman*);
	bb_list_List4* g_new2(Array<bb_snowman_Snowman* >);
	virtual bb_list_Enumerator4* m_ObjectEnumerator();
	void mark();
};
class bb_list_Node4 : public Object{
	public:
	bb_list_Node4* f__succ;
	bb_list_Node4* f__pred;
	bb_snowman_Snowman* f__data;
	bb_list_Node4();
	bb_list_Node4* g_new(bb_list_Node4*,bb_list_Node4*,bb_snowman_Snowman*);
	bb_list_Node4* g_new2();
	void mark();
};
class bb_list_HeadNode4 : public bb_list_Node4{
	public:
	bb_list_HeadNode4();
	bb_list_HeadNode4* g_new();
	void mark();
};
class bb_snowflake_Snowflake : public Object{
	public:
	Float f_XS;
	Float f_X;
	Float f_YS;
	Float f_Y;
	bb_scene_Scene* f_scene;
	int f_Frame;
	bb_snowflake_Snowflake();
	virtual void m_Update();
	bb_snowflake_Snowflake* g_new(bb_scene_Scene*);
	bb_snowflake_Snowflake* g_new2();
	virtual void m_Render();
	void mark();
};
class bb_list_List5 : public Object{
	public:
	bb_list_Node5* f__head;
	bb_list_List5();
	bb_list_List5* g_new();
	virtual bb_list_Node5* m_AddLast5(bb_snowflake_Snowflake*);
	bb_list_List5* g_new2(Array<bb_snowflake_Snowflake* >);
	virtual bb_list_Enumerator5* m_ObjectEnumerator();
	virtual bool m_Equals(bb_snowflake_Snowflake*,bb_snowflake_Snowflake*);
	virtual int m_RemoveEach(bb_snowflake_Snowflake*);
	virtual int m_Remove(bb_snowflake_Snowflake*);
	void mark();
};
class bb_list_Node5 : public Object{
	public:
	bb_list_Node5* f__succ;
	bb_list_Node5* f__pred;
	bb_snowflake_Snowflake* f__data;
	bb_list_Node5();
	bb_list_Node5* g_new(bb_list_Node5*,bb_list_Node5*,bb_snowflake_Snowflake*);
	bb_list_Node5* g_new2();
	virtual int m_Remove2();
	void mark();
};
class bb_list_HeadNode5 : public bb_list_Node5{
	public:
	bb_list_HeadNode5();
	bb_list_HeadNode5* g_new();
	void mark();
};
class bb_moon_Moon : public Object{
	public:
	bb_scene_Scene* f_scene;
	Float f_X;
	Float f_Y;
	Float f_Frame;
	bb_moon_Moon();
	bb_moon_Moon* g_new(bb_scene_Scene*);
	bb_moon_Moon* g_new2();
	virtual void m_Set(Float,Float,int);
	virtual void m_Render();
	void mark();
};
Float bb_random_Rnd();
Float bb_random_Rnd2(Float,Float);
Float bb_random_Rnd3(Float);
bb_scene_Scene* bb_scene_GenerateScene();
class bb_list_Enumerator : public Object{
	public:
	bb_list_List* f__list;
	bb_list_Node* f__curr;
	bb_list_Enumerator();
	bb_list_Enumerator* g_new(bb_list_List*);
	bb_list_Enumerator* g_new2();
	virtual bool m_HasNext();
	virtual bb_tree_Tree* m_NextObject();
	void mark();
};
class bb_list_Enumerator2 : public Object{
	public:
	bb_list_List2* f__list;
	bb_list_Node2* f__curr;
	bb_list_Enumerator2();
	bb_list_Enumerator2* g_new(bb_list_List2*);
	bb_list_Enumerator2* g_new2();
	virtual bool m_HasNext();
	virtual bb_house_House* m_NextObject();
	void mark();
};
class bb_list_Enumerator3 : public Object{
	public:
	bb_list_List3* f__list;
	bb_list_Node3* f__curr;
	bb_list_Enumerator3();
	bb_list_Enumerator3* g_new(bb_list_List3*);
	bb_list_Enumerator3* g_new2();
	virtual bool m_HasNext();
	virtual bb_star_Star* m_NextObject();
	void mark();
};
class bb_list_Enumerator4 : public Object{
	public:
	bb_list_List4* f__list;
	bb_list_Node4* f__curr;
	bb_list_Enumerator4();
	bb_list_Enumerator4* g_new(bb_list_List4*);
	bb_list_Enumerator4* g_new2();
	virtual bool m_HasNext();
	virtual bb_snowman_Snowman* m_NextObject();
	void mark();
};
class bb_list_Enumerator5 : public Object{
	public:
	bb_list_List5* f__list;
	bb_list_Node5* f__curr;
	bb_list_Enumerator5();
	bb_list_Enumerator5* g_new(bb_list_List5*);
	bb_list_Enumerator5* g_new2();
	virtual bool m_HasNext();
	virtual bb_snowflake_Snowflake* m_NextObject();
	void mark();
};
int bb_math_Max(int,int);
Float bb_math_Max2(Float,Float);
int bb_math_Min(int,int);
Float bb_math_Min2(Float,Float);
int bb_graphics_Cls(Float,Float,Float);
int bb_graphics_Transform(Float,Float,Float,Float,Float,Float);
int bb_graphics_Transform2(Array<Float >);
int bb_graphics_Scale(Float,Float);
int bb_graphics_Translate(Float,Float);
int bb_autofit_UpdateVirtualDisplay(bool,bool);
int bb_graphics_PushMatrix();
int bb_graphics_PopMatrix();
int bb_graphics_DrawImage(bb_graphics_Image*,Float,Float,int);
int bb_graphics_Rotate(Float);
int bb_graphics_DrawImage2(bb_graphics_Image*,Float,Float,Float,Float,Float,int);
int bb_graphics_DrawImageRect(bb_graphics_Image*,Float,Float,int,int,int,int,int);
int bb_graphics_DrawImageRect2(bb_graphics_Image*,Float,Float,int,int,int,int,Float,Float,Float,int);
bb_app_App::bb_app_App(){
}
bb_app_App* bb_app_App::g_new(){
	gc_assign(bb_app_device,(new bb_app_AppDevice)->g_new(this));
	return this;
}
int bb_app_App::m_OnCreate(){
	return 0;
}
int bb_app_App::m_OnUpdate(){
	return 0;
}
int bb_app_App::m_OnSuspend(){
	return 0;
}
int bb_app_App::m_OnResume(){
	return 0;
}
int bb_app_App::m_OnRender(){
	return 0;
}
int bb_app_App::m_OnLoading(){
	return 0;
}
void bb_app_App::mark(){
	Object::mark();
}
bb_xmas_XmasApp::bb_xmas_XmasApp(){
	f_scene=0;
}
bb_xmas_XmasApp* bb_xmas_XmasApp::g_new(){
	bb_app_App::g_new();
	return this;
}
int bb_xmas_XmasApp::m_OnCreate(){
	bb_app_SetUpdateRate(30);
	bb_random_Seed=Millisecs();
	bb_gfx_GFX::g_Init();
	bb_scene_Scene::g_Init();
	bb_sfx_SFX::g_Init();
	bb_autofit_SetVirtualDisplay(360,240,FLOAT(1.0));
	gc_assign(f_scene,bb_scene_GenerateScene());
	return 1;
}
int bb_xmas_XmasApp::m_OnUpdate(){
	f_scene->m_Update();
	return 1;
}
int bb_xmas_XmasApp::m_OnRender(){
	bb_autofit_UpdateVirtualDisplay(true,true);
	bb_graphics_Cls(FLOAT(0.0),FLOAT(0.0),FLOAT(0.0));
	f_scene->m_Render();
	return 1;
}
void bb_xmas_XmasApp::mark(){
	bb_app_App::mark();
	gc_mark_q(f_scene);
}
bb_app_AppDevice::bb_app_AppDevice(){
	f_app=0;
	f_updateRate=0;
}
bb_app_AppDevice* bb_app_AppDevice::g_new(bb_app_App* t_app){
	gc_assign(this->f_app,t_app);
	bb_graphics_SetGraphicsDevice(GraphicsDevice());
	bb_input_SetInputDevice(InputDevice());
	bb_audio_SetAudioDevice(AudioDevice());
	return this;
}
bb_app_AppDevice* bb_app_AppDevice::g_new2(){
	return this;
}
int bb_app_AppDevice::OnCreate(){
	bb_graphics_SetFont(0,32);
	return f_app->m_OnCreate();
}
int bb_app_AppDevice::OnUpdate(){
	return f_app->m_OnUpdate();
}
int bb_app_AppDevice::OnSuspend(){
	return f_app->m_OnSuspend();
}
int bb_app_AppDevice::OnResume(){
	return f_app->m_OnResume();
}
int bb_app_AppDevice::OnRender(){
	bb_graphics_BeginRender();
	int t_r=f_app->m_OnRender();
	bb_graphics_EndRender();
	return t_r;
}
int bb_app_AppDevice::OnLoading(){
	bb_graphics_BeginRender();
	int t_r=f_app->m_OnLoading();
	bb_graphics_EndRender();
	return t_r;
}
int bb_app_AppDevice::SetUpdateRate(int t_hertz){
	gxtkApp::SetUpdateRate(t_hertz);
	f_updateRate=t_hertz;
	return 0;
}
void bb_app_AppDevice::mark(){
	gxtkApp::mark();
	gc_mark_q(f_app);
}
gxtkGraphics* bb_graphics_device;
int bb_graphics_SetGraphicsDevice(gxtkGraphics* t_dev){
	gc_assign(bb_graphics_device,t_dev);
	return 0;
}
gxtkInput* bb_input_device;
int bb_input_SetInputDevice(gxtkInput* t_dev){
	gc_assign(bb_input_device,t_dev);
	return 0;
}
gxtkAudio* bb_audio_device;
int bb_audio_SetAudioDevice(gxtkAudio* t_dev){
	gc_assign(bb_audio_device,t_dev);
	return 0;
}
bb_app_AppDevice* bb_app_device;
int bbMain(){
	(new bb_xmas_XmasApp)->g_new();
	return 0;
}
bb_graphics_Image::bb_graphics_Image(){
	f_surface=0;
	f_width=0;
	f_height=0;
	f_frames=Array<bb_graphics_Frame* >();
	f_flags=0;
	f_tx=FLOAT(.0);
	f_ty=FLOAT(.0);
	f_source=0;
}
int bb_graphics_Image::g_DefaultFlags;
bb_graphics_Image* bb_graphics_Image::g_new(){
	return this;
}
int bb_graphics_Image::m_SetHandle(Float t_tx,Float t_ty){
	this->f_tx=t_tx;
	this->f_ty=t_ty;
	this->f_flags=this->f_flags&-2;
	return 0;
}
int bb_graphics_Image::m_ApplyFlags(int t_iflags){
	f_flags=t_iflags;
	if((f_flags&2)!=0){
		Array<bb_graphics_Frame* > t_=f_frames;
		int t_2=0;
		while(t_2<t_.Length()){
			bb_graphics_Frame* t_f=t_[t_2];
			t_2=t_2+1;
			t_f->f_x+=1;
		}
		f_width-=2;
	}
	if((f_flags&4)!=0){
		Array<bb_graphics_Frame* > t_3=f_frames;
		int t_4=0;
		while(t_4<t_3.Length()){
			bb_graphics_Frame* t_f2=t_3[t_4];
			t_4=t_4+1;
			t_f2->f_y+=1;
		}
		f_height-=2;
	}
	if((f_flags&1)!=0){
		m_SetHandle(Float(f_width)/FLOAT(2.0),Float(f_height)/FLOAT(2.0));
	}
	if(f_frames.Length()==1 && f_frames[0]->f_x==0 && f_frames[0]->f_y==0 && f_width==f_surface->Width() && f_height==f_surface->Height()){
		f_flags|=65536;
	}
	return 0;
}
bb_graphics_Image* bb_graphics_Image::m_Init(gxtkSurface* t_surf,int t_nframes,int t_iflags){
	gc_assign(f_surface,t_surf);
	f_width=f_surface->Width()/t_nframes;
	f_height=f_surface->Height();
	gc_assign(f_frames,Array<bb_graphics_Frame* >(t_nframes));
	for(int t_i=0;t_i<t_nframes;t_i=t_i+1){
		gc_assign(f_frames[t_i],(new bb_graphics_Frame)->g_new(t_i*f_width,0));
	}
	m_ApplyFlags(t_iflags);
	return this;
}
bb_graphics_Image* bb_graphics_Image::m_Grab(int t_x,int t_y,int t_iwidth,int t_iheight,int t_nframes,int t_iflags,bb_graphics_Image* t_source){
	gc_assign(this->f_source,t_source);
	gc_assign(f_surface,t_source->f_surface);
	f_width=t_iwidth;
	f_height=t_iheight;
	gc_assign(f_frames,Array<bb_graphics_Frame* >(t_nframes));
	int t_ix=t_x;
	int t_iy=t_y;
	for(int t_i=0;t_i<t_nframes;t_i=t_i+1){
		if(t_ix+f_width>t_source->f_width){
			t_ix=0;
			t_iy+=f_height;
		}
		if(t_ix+f_width>t_source->f_width || t_iy+f_height>t_source->f_height){
			Error(String(L"Image frame outside surface",27));
		}
		gc_assign(f_frames[t_i],(new bb_graphics_Frame)->g_new(t_ix+t_source->f_frames[0]->f_x,t_iy+t_source->f_frames[0]->f_y));
		t_ix+=f_width;
	}
	m_ApplyFlags(t_iflags);
	return this;
}
bb_graphics_Image* bb_graphics_Image::m_GrabImage(int t_x,int t_y,int t_width,int t_height,int t_frames,int t_flags){
	if(this->f_frames.Length()!=1){
		return 0;
	}
	return ((new bb_graphics_Image)->g_new())->m_Grab(t_x,t_y,t_width,t_height,t_frames,t_flags,this);
}
void bb_graphics_Image::mark(){
	Object::mark();
	gc_mark_q(f_surface);
	gc_mark_q(f_frames);
	gc_mark_q(f_source);
}
bb_graphics_GraphicsContext::bb_graphics_GraphicsContext(){
	f_defaultFont=0;
	f_font=0;
	f_firstChar=0;
	f_matrixSp=0;
	f_ix=FLOAT(1.0);
	f_iy=FLOAT(.0);
	f_jx=FLOAT(.0);
	f_jy=FLOAT(1.0);
	f_tx=FLOAT(.0);
	f_ty=FLOAT(.0);
	f_tformed=0;
	f_matDirty=0;
	f_color_r=FLOAT(.0);
	f_color_g=FLOAT(.0);
	f_color_b=FLOAT(.0);
	f_alpha=FLOAT(.0);
	f_blend=0;
	f_scissor_x=FLOAT(.0);
	f_scissor_y=FLOAT(.0);
	f_scissor_width=FLOAT(.0);
	f_scissor_height=FLOAT(.0);
	f_matrixStack=Array<Float >(192);
}
bb_graphics_GraphicsContext* bb_graphics_GraphicsContext::g_new(){
	return this;
}
int bb_graphics_GraphicsContext::m_Validate(){
	if((f_matDirty)!=0){
		bb_graphics_renderDevice->SetMatrix(bb_graphics_context->f_ix,bb_graphics_context->f_iy,bb_graphics_context->f_jx,bb_graphics_context->f_jy,bb_graphics_context->f_tx,bb_graphics_context->f_ty);
		f_matDirty=0;
	}
	return 0;
}
void bb_graphics_GraphicsContext::mark(){
	Object::mark();
	gc_mark_q(f_defaultFont);
	gc_mark_q(f_font);
	gc_mark_q(f_matrixStack);
}
bb_graphics_GraphicsContext* bb_graphics_context;
String bb_data_FixDataPath(String t_path){
	int t_i=t_path.Find(String(L":/",2),0);
	if(t_i!=-1 && t_path.Find(String(L"/",1),0)==t_i+1){
		return t_path;
	}
	if(t_path.StartsWith(String(L"./",2)) || t_path.StartsWith(String(L"/",1))){
		return t_path;
	}
	return String(L"monkey://data/",14)+t_path;
}
bb_graphics_Frame::bb_graphics_Frame(){
	f_x=0;
	f_y=0;
}
bb_graphics_Frame* bb_graphics_Frame::g_new(int t_x,int t_y){
	this->f_x=t_x;
	this->f_y=t_y;
	return this;
}
bb_graphics_Frame* bb_graphics_Frame::g_new2(){
	return this;
}
void bb_graphics_Frame::mark(){
	Object::mark();
}
bb_graphics_Image* bb_graphics_LoadImage(String t_path,int t_frameCount,int t_flags){
	gxtkSurface* t_surf=bb_graphics_device->LoadSurface(bb_data_FixDataPath(t_path));
	if((t_surf)!=0){
		return ((new bb_graphics_Image)->g_new())->m_Init(t_surf,t_frameCount,t_flags);
	}
	return 0;
}
bb_graphics_Image* bb_graphics_LoadImage2(String t_path,int t_frameWidth,int t_frameHeight,int t_frameCount,int t_flags){
	bb_graphics_Image* t_atlas=bb_graphics_LoadImage(t_path,1,0);
	if((t_atlas)!=0){
		return t_atlas->m_GrabImage(0,0,t_frameWidth,t_frameHeight,t_frameCount,t_flags);
	}
	return 0;
}
int bb_graphics_SetFont(bb_graphics_Image* t_font,int t_firstChar){
	if(!((t_font)!=0)){
		if(!((bb_graphics_context->f_defaultFont)!=0)){
			gc_assign(bb_graphics_context->f_defaultFont,bb_graphics_LoadImage(String(L"mojo_font.png",13),96,2));
		}
		t_font=bb_graphics_context->f_defaultFont;
		t_firstChar=32;
	}
	gc_assign(bb_graphics_context->f_font,t_font);
	bb_graphics_context->f_firstChar=t_firstChar;
	return 0;
}
gxtkGraphics* bb_graphics_renderDevice;
int bb_graphics_SetMatrix(Float t_ix,Float t_iy,Float t_jx,Float t_jy,Float t_tx,Float t_ty){
	bb_graphics_context->f_ix=t_ix;
	bb_graphics_context->f_iy=t_iy;
	bb_graphics_context->f_jx=t_jx;
	bb_graphics_context->f_jy=t_jy;
	bb_graphics_context->f_tx=t_tx;
	bb_graphics_context->f_ty=t_ty;
	bb_graphics_context->f_tformed=((t_ix!=FLOAT(1.0) || t_iy!=FLOAT(0.0) || t_jx!=FLOAT(0.0) || t_jy!=FLOAT(1.0) || t_tx!=FLOAT(0.0) || t_ty!=FLOAT(0.0))?1:0);
	bb_graphics_context->f_matDirty=1;
	return 0;
}
int bb_graphics_SetMatrix2(Array<Float > t_m){
	bb_graphics_SetMatrix(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
	return 0;
}
int bb_graphics_SetColor(Float t_r,Float t_g,Float t_b){
	bb_graphics_context->f_color_r=t_r;
	bb_graphics_context->f_color_g=t_g;
	bb_graphics_context->f_color_b=t_b;
	bb_graphics_renderDevice->SetColor(t_r,t_g,t_b);
	return 0;
}
int bb_graphics_SetAlpha(Float t_alpha){
	bb_graphics_context->f_alpha=t_alpha;
	bb_graphics_renderDevice->SetAlpha(t_alpha);
	return 0;
}
int bb_graphics_SetBlend(int t_blend){
	bb_graphics_context->f_blend=t_blend;
	bb_graphics_renderDevice->SetBlend(t_blend);
	return 0;
}
int bb_graphics_DeviceWidth(){
	return bb_graphics_device->Width();
}
int bb_graphics_DeviceHeight(){
	return bb_graphics_device->Height();
}
int bb_graphics_SetScissor(Float t_x,Float t_y,Float t_width,Float t_height){
	bb_graphics_context->f_scissor_x=t_x;
	bb_graphics_context->f_scissor_y=t_y;
	bb_graphics_context->f_scissor_width=t_width;
	bb_graphics_context->f_scissor_height=t_height;
	bb_graphics_renderDevice->SetScissor(int(t_x),int(t_y),int(t_width),int(t_height));
	return 0;
}
int bb_graphics_BeginRender(){
	if(!((bb_graphics_device->Mode())!=0)){
		return 0;
	}
	gc_assign(bb_graphics_renderDevice,bb_graphics_device);
	bb_graphics_context->f_matrixSp=0;
	bb_graphics_SetMatrix(FLOAT(1.0),FLOAT(0.0),FLOAT(0.0),FLOAT(1.0),FLOAT(0.0),FLOAT(0.0));
	bb_graphics_SetColor(FLOAT(255.0),FLOAT(255.0),FLOAT(255.0));
	bb_graphics_SetAlpha(FLOAT(1.0));
	bb_graphics_SetBlend(0);
	bb_graphics_SetScissor(FLOAT(0.0),FLOAT(0.0),Float(bb_graphics_DeviceWidth()),Float(bb_graphics_DeviceHeight()));
	return 0;
}
int bb_graphics_EndRender(){
	bb_graphics_renderDevice=0;
	return 0;
}
int bb_app_SetUpdateRate(int t_hertz){
	return bb_app_device->SetUpdateRate(t_hertz);
}
int bb_random_Seed;
bb_gfx_GFX::bb_gfx_GFX(){
}
bb_graphics_Image* bb_gfx_GFX::g_Tileset;
void bb_gfx_GFX::g_Init(){
	gc_assign(bb_gfx_GFX::g_Tileset,bb_graphics_LoadImage(String(L"gfx/xmas_sprites.png",20),1,bb_graphics_Image::g_DefaultFlags));
}
void bb_gfx_GFX::g_Draw(int t_tX,int t_tY,int t_X,int t_Y,int t_W,int t_H){
	bb_graphics_DrawImageRect(bb_gfx_GFX::g_Tileset,Float(t_tX),Float(t_tY),t_X,t_Y,t_W,t_H,0);
}
void bb_gfx_GFX::mark(){
	Object::mark();
}
bb_scene_Scene::bb_scene_Scene(){
	f_FloorSegmentCount=0;
	f_FloorSegments=Array<bb_floorsegment_FloorSegment* >();
	f_Trees=0;
	f_Houses=0;
	f_Stars=0;
	f_Snowmen=0;
	f_Snowflakes=0;
	f_moon=0;
}
bb_graphics_Image* bb_scene_Scene::g_Background;
void bb_scene_Scene::g_Init(){
	gc_assign(bb_scene_Scene::g_Background,bb_graphics_LoadImage(String(L"gfx/xmas_scene.png",18),1,bb_graphics_Image::g_DefaultFlags));
}
int bb_scene_Scene::g_Width;
bb_scene_Scene* bb_scene_Scene::g_new(){
	f_FloorSegmentCount=bb_scene_Scene::g_Width/bb_floorsegment_FloorSegment::g_Width+1;
	gc_assign(f_FloorSegments,Array<bb_floorsegment_FloorSegment* >(f_FloorSegmentCount));
	for(int t_i=0;t_i<f_FloorSegmentCount;t_i=t_i+1){
		gc_assign(f_FloorSegments[t_i],(new bb_floorsegment_FloorSegment)->g_new(this));
	}
	gc_assign(f_Trees,(new bb_list_List)->g_new());
	gc_assign(f_Houses,(new bb_list_List2)->g_new());
	gc_assign(f_Stars,(new bb_list_List3)->g_new());
	gc_assign(f_Snowmen,(new bb_list_List4)->g_new());
	gc_assign(f_Snowflakes,(new bb_list_List5)->g_new());
	gc_assign(f_moon,(new bb_moon_Moon)->g_new(this));
	return this;
}
int bb_scene_Scene::g_Height;
void bb_scene_Scene::m_AddSnowFlake(){
	bb_snowflake_Snowflake* t_tS=(new bb_snowflake_Snowflake)->g_new(this);
	if(bb_random_Rnd()<FLOAT(0.5)){
		t_tS->f_X=FLOAT(-10.0);
		t_tS->f_Y=bb_random_Rnd2(FLOAT(-5.0),Float(bb_scene_Scene::g_Height-5));
	}else{
		t_tS->f_X=bb_random_Rnd2(FLOAT(-5.0),Float(bb_scene_Scene::g_Width-5));
		t_tS->f_Y=FLOAT(-10.0);
	}
	t_tS->f_Frame=int(bb_random_Rnd2(FLOAT(0.0),FLOAT(10.0)));
	t_tS->f_XS=bb_random_Rnd2(FLOAT(-2.0),FLOAT(4.0));
	t_tS->f_YS=bb_random_Rnd2(FLOAT(0.1),FLOAT(1.0));
	f_Snowflakes->m_AddLast5(t_tS);
}
void bb_scene_Scene::m_Update(){
	bb_list_Enumerator* t_=f_Trees->m_ObjectEnumerator();
	while(t_->m_HasNext()){
		bb_tree_Tree* t_tTree=t_->m_NextObject();
		t_tTree->m_Update();
	}
	bb_list_Enumerator2* t_2=f_Houses->m_ObjectEnumerator();
	while(t_2->m_HasNext()){
		bb_house_House* t_tHouse=t_2->m_NextObject();
		t_tHouse->m_Update();
	}
	bb_list_Enumerator3* t_3=f_Stars->m_ObjectEnumerator();
	while(t_3->m_HasNext()){
		bb_star_Star* t_tStar=t_3->m_NextObject();
		t_tStar->m_Update();
	}
	bb_list_Enumerator4* t_4=f_Snowmen->m_ObjectEnumerator();
	while(t_4->m_HasNext()){
		bb_snowman_Snowman* t_tSnowman=t_4->m_NextObject();
		t_tSnowman->m_Update();
	}
	bb_list_Enumerator5* t_5=f_Snowflakes->m_ObjectEnumerator();
	while(t_5->m_HasNext()){
		bb_snowflake_Snowflake* t_tSnowflake=t_5->m_NextObject();
		t_tSnowflake->m_Update();
	}
	if(bb_random_Rnd()<FLOAT(0.1)){
		m_AddSnowFlake();
	}
}
void bb_scene_Scene::m_Render(){
	bb_graphics_SetColor(FLOAT(255.0),FLOAT(255.0),FLOAT(255.0));
	bb_graphics_SetAlpha(FLOAT(1.0));
	bb_graphics_DrawImage(bb_scene_Scene::g_Background,FLOAT(0.0),FLOAT(0.0),0);
	bb_list_Enumerator3* t_=f_Stars->m_ObjectEnumerator();
	while(t_->m_HasNext()){
		bb_star_Star* t_tStar=t_->m_NextObject();
		t_tStar->m_Render();
	}
	f_moon->m_Render();
	bb_list_Enumerator* t_2=f_Trees->m_ObjectEnumerator();
	while(t_2->m_HasNext()){
		bb_tree_Tree* t_tTree=t_2->m_NextObject();
		t_tTree->m_Render();
	}
	bb_list_Enumerator2* t_3=f_Houses->m_ObjectEnumerator();
	while(t_3->m_HasNext()){
		bb_house_House* t_tHouse=t_3->m_NextObject();
		t_tHouse->m_Render();
	}
	bb_list_Enumerator4* t_4=f_Snowmen->m_ObjectEnumerator();
	while(t_4->m_HasNext()){
		bb_snowman_Snowman* t_tSnowman=t_4->m_NextObject();
		t_tSnowman->m_Render();
	}
	for(int t_i=0;t_i<f_FloorSegmentCount;t_i=t_i+1){
		f_FloorSegments[t_i]->m_Render();
	}
	bb_list_Enumerator5* t_5=f_Snowflakes->m_ObjectEnumerator();
	while(t_5->m_HasNext()){
		bb_snowflake_Snowflake* t_tSnowflake=t_5->m_NextObject();
		t_tSnowflake->m_Render();
	}
}
void bb_scene_Scene::mark(){
	Object::mark();
	gc_mark_q(f_FloorSegments);
	gc_mark_q(f_Trees);
	gc_mark_q(f_Houses);
	gc_mark_q(f_Stars);
	gc_mark_q(f_Snowmen);
	gc_mark_q(f_Snowflakes);
	gc_mark_q(f_moon);
}
bb_sfx_SFX::bb_sfx_SFX(){
}
int bb_sfx_SFX::g_ActiveChannel;
bb_map_StringMap* bb_sfx_SFX::g_Sounds;
bb_map_StringMap2* bb_sfx_SFX::g_Musics;
void bb_sfx_SFX::g_Init(){
	bb_sfx_SFX::g_ActiveChannel=0;
	gc_assign(bb_sfx_SFX::g_Sounds,(new bb_map_StringMap)->g_new());
	gc_assign(bb_sfx_SFX::g_Musics,(new bb_map_StringMap2)->g_new());
}
void bb_sfx_SFX::mark(){
	Object::mark();
}
bb_audio_Sound::bb_audio_Sound(){
}
void bb_audio_Sound::mark(){
	Object::mark();
}
bb_map_Map::bb_map_Map(){
}
bb_map_Map* bb_map_Map::g_new(){
	return this;
}
void bb_map_Map::mark(){
	Object::mark();
}
bb_map_StringMap::bb_map_StringMap(){
}
bb_map_StringMap* bb_map_StringMap::g_new(){
	bb_map_Map::g_new();
	return this;
}
void bb_map_StringMap::mark(){
	bb_map_Map::mark();
}
bb_map_Map2::bb_map_Map2(){
}
bb_map_Map2* bb_map_Map2::g_new(){
	return this;
}
void bb_map_Map2::mark(){
	Object::mark();
}
bb_map_StringMap2::bb_map_StringMap2(){
}
bb_map_StringMap2* bb_map_StringMap2::g_new(){
	bb_map_Map2::g_new();
	return this;
}
void bb_map_StringMap2::mark(){
	bb_map_Map2::mark();
}
bb_autofit_VirtualDisplay::bb_autofit_VirtualDisplay(){
	f_vwidth=FLOAT(.0);
	f_vheight=FLOAT(.0);
	f_vzoom=FLOAT(.0);
	f_lastvzoom=FLOAT(.0);
	f_vratio=FLOAT(.0);
	f_lastdevicewidth=0;
	f_lastdeviceheight=0;
	f_device_changed=0;
	f_fdw=FLOAT(.0);
	f_fdh=FLOAT(.0);
	f_dratio=FLOAT(.0);
	f_multi=FLOAT(.0);
	f_heightborder=FLOAT(.0);
	f_widthborder=FLOAT(.0);
	f_zoom_changed=0;
	f_realx=FLOAT(.0);
	f_realy=FLOAT(.0);
	f_offx=FLOAT(.0);
	f_offy=FLOAT(.0);
	f_sx=FLOAT(.0);
	f_sw=FLOAT(.0);
	f_sy=FLOAT(.0);
	f_sh=FLOAT(.0);
	f_scaledw=FLOAT(.0);
	f_scaledh=FLOAT(.0);
	f_vxoff=FLOAT(.0);
	f_vyoff=FLOAT(.0);
}
bb_autofit_VirtualDisplay* bb_autofit_VirtualDisplay::g_Display;
bb_autofit_VirtualDisplay* bb_autofit_VirtualDisplay::g_new(int t_width,int t_height,Float t_zoom){
	f_vwidth=Float(t_width);
	f_vheight=Float(t_height);
	f_vzoom=t_zoom;
	f_lastvzoom=f_vzoom+FLOAT(1.0);
	f_vratio=f_vheight/f_vwidth;
	gc_assign(bb_autofit_VirtualDisplay::g_Display,this);
	return this;
}
bb_autofit_VirtualDisplay* bb_autofit_VirtualDisplay::g_new2(){
	return this;
}
int bb_autofit_VirtualDisplay::m_UpdateVirtualDisplay(bool t_zoomborders,bool t_keepborders){
	if(bb_graphics_DeviceWidth()!=f_lastdevicewidth || bb_graphics_DeviceHeight()!=f_lastdeviceheight){
		f_lastdevicewidth=bb_graphics_DeviceWidth();
		f_lastdeviceheight=bb_graphics_DeviceHeight();
		f_device_changed=1;
	}
	if((f_device_changed)!=0){
		f_fdw=Float(bb_graphics_DeviceWidth());
		f_fdh=Float(bb_graphics_DeviceHeight());
		f_dratio=f_fdh/f_fdw;
		if(f_dratio>f_vratio){
			f_multi=f_fdw/f_vwidth;
			f_heightborder=(f_fdh-f_vheight*f_multi)*FLOAT(0.5);
			f_widthborder=FLOAT(0.0);
		}else{
			f_multi=f_fdh/f_vheight;
			f_widthborder=(f_fdw-f_vwidth*f_multi)*FLOAT(0.5);
			f_heightborder=FLOAT(0.0);
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
			f_offx=(f_fdw-f_realx)*FLOAT(0.5);
			f_offy=(f_fdh-f_realy)*FLOAT(0.5);
			if(t_keepborders){
				if(f_offx<f_widthborder){
					f_sx=f_widthborder;
					f_sw=f_fdw-f_widthborder*FLOAT(2.0);
				}else{
					f_sx=f_offx;
					f_sw=f_fdw-f_offx*FLOAT(2.0);
				}
				if(f_offy<f_heightborder){
					f_sy=f_heightborder;
					f_sh=f_fdh-f_heightborder*FLOAT(2.0);
				}else{
					f_sy=f_offy;
					f_sh=f_fdh-f_offy*FLOAT(2.0);
				}
			}else{
				f_sx=f_offx;
				f_sw=f_fdw-f_offx*FLOAT(2.0);
				f_sy=f_offy;
				f_sh=f_fdh-f_offy*FLOAT(2.0);
			}
			f_sx=bb_math_Max2(FLOAT(0.0),f_sx);
			f_sy=bb_math_Max2(FLOAT(0.0),f_sy);
			f_sw=bb_math_Min2(f_sw,f_fdw);
			f_sh=bb_math_Min2(f_sh,f_fdh);
		}else{
			f_sx=bb_math_Max2(FLOAT(0.0),f_widthborder);
			f_sy=bb_math_Max2(FLOAT(0.0),f_heightborder);
			f_sw=bb_math_Min2(f_fdw-f_widthborder*FLOAT(2.0),f_fdw);
			f_sh=bb_math_Min2(f_fdh-f_heightborder*FLOAT(2.0),f_fdh);
		}
		f_scaledw=f_vwidth*f_multi*f_vzoom;
		f_scaledh=f_vheight*f_multi*f_vzoom;
		f_vxoff=(f_fdw-f_scaledw)*FLOAT(0.5);
		f_vyoff=(f_fdh-f_scaledh)*FLOAT(0.5);
		f_vxoff=f_vxoff/f_multi/f_vzoom;
		f_vyoff=f_vyoff/f_multi/f_vzoom;
		f_device_changed=0;
		f_zoom_changed=0;
	}
	bb_graphics_SetScissor(FLOAT(0.0),FLOAT(0.0),Float(bb_graphics_DeviceWidth()),Float(bb_graphics_DeviceHeight()));
	bb_graphics_Cls(FLOAT(0.0),FLOAT(0.0),FLOAT(0.0));
	bb_graphics_SetScissor(f_sx,f_sy,f_sw,f_sh);
	bb_graphics_Scale(f_multi*f_vzoom,f_multi*f_vzoom);
	if((f_vzoom)!=0){
		bb_graphics_Translate(f_vxoff,f_vyoff);
	}
	return 0;
}
void bb_autofit_VirtualDisplay::mark(){
	Object::mark();
}
int bb_autofit_SetVirtualDisplay(int t_width,int t_height,Float t_zoom){
	(new bb_autofit_VirtualDisplay)->g_new(t_width,t_height,t_zoom);
	return 0;
}
bb_floorsegment_FloorSegment::bb_floorsegment_FloorSegment(){
	f_scene=0;
	f_X=0;
	f_Y=0;
}
int bb_floorsegment_FloorSegment::g_Width;
bb_floorsegment_FloorSegment* bb_floorsegment_FloorSegment::g_new(bb_scene_Scene* t_tS){
	gc_assign(f_scene,t_tS);
	return this;
}
bb_floorsegment_FloorSegment* bb_floorsegment_FloorSegment::g_new2(){
	return this;
}
void bb_floorsegment_FloorSegment::m_SetPos(int t_tX,int t_tY){
	f_X=t_tX;
	f_Y=t_tY;
}
void bb_floorsegment_FloorSegment::m_Render(){
	bb_gfx_GFX::g_Draw(f_X,f_Y,0,96,bb_floorsegment_FloorSegment::g_Width,64);
}
void bb_floorsegment_FloorSegment::mark(){
	Object::mark();
	gc_mark_q(f_scene);
}
bb_tree_Tree::bb_tree_Tree(){
}
void bb_tree_Tree::m_Update(){
}
void bb_tree_Tree::m_Render(){
}
void bb_tree_Tree::mark(){
	Object::mark();
}
bb_list_List::bb_list_List(){
	f__head=((new bb_list_HeadNode)->g_new());
}
bb_list_List* bb_list_List::g_new(){
	return this;
}
bb_list_Node* bb_list_List::m_AddLast(bb_tree_Tree* t_data){
	return (new bb_list_Node)->g_new(f__head,f__head->f__pred,t_data);
}
bb_list_List* bb_list_List::g_new2(Array<bb_tree_Tree* > t_data){
	Array<bb_tree_Tree* > t_=t_data;
	int t_2=0;
	while(t_2<t_.Length()){
		bb_tree_Tree* t_t=t_[t_2];
		t_2=t_2+1;
		m_AddLast(t_t);
	}
	return this;
}
bb_list_Enumerator* bb_list_List::m_ObjectEnumerator(){
	return (new bb_list_Enumerator)->g_new(this);
}
void bb_list_List::mark(){
	Object::mark();
	gc_mark_q(f__head);
}
bb_list_Node::bb_list_Node(){
	f__succ=0;
	f__pred=0;
	f__data=0;
}
bb_list_Node* bb_list_Node::g_new(bb_list_Node* t_succ,bb_list_Node* t_pred,bb_tree_Tree* t_data){
	gc_assign(f__succ,t_succ);
	gc_assign(f__pred,t_pred);
	gc_assign(f__succ->f__pred,this);
	gc_assign(f__pred->f__succ,this);
	gc_assign(f__data,t_data);
	return this;
}
bb_list_Node* bb_list_Node::g_new2(){
	return this;
}
void bb_list_Node::mark(){
	Object::mark();
	gc_mark_q(f__succ);
	gc_mark_q(f__pred);
	gc_mark_q(f__data);
}
bb_list_HeadNode::bb_list_HeadNode(){
}
bb_list_HeadNode* bb_list_HeadNode::g_new(){
	bb_list_Node::g_new2();
	gc_assign(f__succ,(this));
	gc_assign(f__pred,(this));
	return this;
}
void bb_list_HeadNode::mark(){
	bb_list_Node::mark();
}
bb_house_House::bb_house_House(){
}
void bb_house_House::m_Update(){
}
void bb_house_House::m_Render(){
}
void bb_house_House::mark(){
	Object::mark();
}
bb_list_List2::bb_list_List2(){
	f__head=((new bb_list_HeadNode2)->g_new());
}
bb_list_List2* bb_list_List2::g_new(){
	return this;
}
bb_list_Node2* bb_list_List2::m_AddLast2(bb_house_House* t_data){
	return (new bb_list_Node2)->g_new(f__head,f__head->f__pred,t_data);
}
bb_list_List2* bb_list_List2::g_new2(Array<bb_house_House* > t_data){
	Array<bb_house_House* > t_=t_data;
	int t_2=0;
	while(t_2<t_.Length()){
		bb_house_House* t_t=t_[t_2];
		t_2=t_2+1;
		m_AddLast2(t_t);
	}
	return this;
}
bb_list_Enumerator2* bb_list_List2::m_ObjectEnumerator(){
	return (new bb_list_Enumerator2)->g_new(this);
}
void bb_list_List2::mark(){
	Object::mark();
	gc_mark_q(f__head);
}
bb_list_Node2::bb_list_Node2(){
	f__succ=0;
	f__pred=0;
	f__data=0;
}
bb_list_Node2* bb_list_Node2::g_new(bb_list_Node2* t_succ,bb_list_Node2* t_pred,bb_house_House* t_data){
	gc_assign(f__succ,t_succ);
	gc_assign(f__pred,t_pred);
	gc_assign(f__succ->f__pred,this);
	gc_assign(f__pred->f__succ,this);
	gc_assign(f__data,t_data);
	return this;
}
bb_list_Node2* bb_list_Node2::g_new2(){
	return this;
}
void bb_list_Node2::mark(){
	Object::mark();
	gc_mark_q(f__succ);
	gc_mark_q(f__pred);
	gc_mark_q(f__data);
}
bb_list_HeadNode2::bb_list_HeadNode2(){
}
bb_list_HeadNode2* bb_list_HeadNode2::g_new(){
	bb_list_Node2::g_new2();
	gc_assign(f__succ,(this));
	gc_assign(f__pred,(this));
	return this;
}
void bb_list_HeadNode2::mark(){
	bb_list_Node2::mark();
}
bb_star_Star::bb_star_Star(){
}
void bb_star_Star::m_Update(){
}
void bb_star_Star::m_Render(){
}
void bb_star_Star::mark(){
	Object::mark();
}
bb_list_List3::bb_list_List3(){
	f__head=((new bb_list_HeadNode3)->g_new());
}
bb_list_List3* bb_list_List3::g_new(){
	return this;
}
bb_list_Node3* bb_list_List3::m_AddLast3(bb_star_Star* t_data){
	return (new bb_list_Node3)->g_new(f__head,f__head->f__pred,t_data);
}
bb_list_List3* bb_list_List3::g_new2(Array<bb_star_Star* > t_data){
	Array<bb_star_Star* > t_=t_data;
	int t_2=0;
	while(t_2<t_.Length()){
		bb_star_Star* t_t=t_[t_2];
		t_2=t_2+1;
		m_AddLast3(t_t);
	}
	return this;
}
bb_list_Enumerator3* bb_list_List3::m_ObjectEnumerator(){
	return (new bb_list_Enumerator3)->g_new(this);
}
void bb_list_List3::mark(){
	Object::mark();
	gc_mark_q(f__head);
}
bb_list_Node3::bb_list_Node3(){
	f__succ=0;
	f__pred=0;
	f__data=0;
}
bb_list_Node3* bb_list_Node3::g_new(bb_list_Node3* t_succ,bb_list_Node3* t_pred,bb_star_Star* t_data){
	gc_assign(f__succ,t_succ);
	gc_assign(f__pred,t_pred);
	gc_assign(f__succ->f__pred,this);
	gc_assign(f__pred->f__succ,this);
	gc_assign(f__data,t_data);
	return this;
}
bb_list_Node3* bb_list_Node3::g_new2(){
	return this;
}
void bb_list_Node3::mark(){
	Object::mark();
	gc_mark_q(f__succ);
	gc_mark_q(f__pred);
	gc_mark_q(f__data);
}
bb_list_HeadNode3::bb_list_HeadNode3(){
}
bb_list_HeadNode3* bb_list_HeadNode3::g_new(){
	bb_list_Node3::g_new2();
	gc_assign(f__succ,(this));
	gc_assign(f__pred,(this));
	return this;
}
void bb_list_HeadNode3::mark(){
	bb_list_Node3::mark();
}
bb_snowman_Snowman::bb_snowman_Snowman(){
}
void bb_snowman_Snowman::m_Update(){
}
void bb_snowman_Snowman::m_Render(){
}
void bb_snowman_Snowman::mark(){
	Object::mark();
}
bb_list_List4::bb_list_List4(){
	f__head=((new bb_list_HeadNode4)->g_new());
}
bb_list_List4* bb_list_List4::g_new(){
	return this;
}
bb_list_Node4* bb_list_List4::m_AddLast4(bb_snowman_Snowman* t_data){
	return (new bb_list_Node4)->g_new(f__head,f__head->f__pred,t_data);
}
bb_list_List4* bb_list_List4::g_new2(Array<bb_snowman_Snowman* > t_data){
	Array<bb_snowman_Snowman* > t_=t_data;
	int t_2=0;
	while(t_2<t_.Length()){
		bb_snowman_Snowman* t_t=t_[t_2];
		t_2=t_2+1;
		m_AddLast4(t_t);
	}
	return this;
}
bb_list_Enumerator4* bb_list_List4::m_ObjectEnumerator(){
	return (new bb_list_Enumerator4)->g_new(this);
}
void bb_list_List4::mark(){
	Object::mark();
	gc_mark_q(f__head);
}
bb_list_Node4::bb_list_Node4(){
	f__succ=0;
	f__pred=0;
	f__data=0;
}
bb_list_Node4* bb_list_Node4::g_new(bb_list_Node4* t_succ,bb_list_Node4* t_pred,bb_snowman_Snowman* t_data){
	gc_assign(f__succ,t_succ);
	gc_assign(f__pred,t_pred);
	gc_assign(f__succ->f__pred,this);
	gc_assign(f__pred->f__succ,this);
	gc_assign(f__data,t_data);
	return this;
}
bb_list_Node4* bb_list_Node4::g_new2(){
	return this;
}
void bb_list_Node4::mark(){
	Object::mark();
	gc_mark_q(f__succ);
	gc_mark_q(f__pred);
	gc_mark_q(f__data);
}
bb_list_HeadNode4::bb_list_HeadNode4(){
}
bb_list_HeadNode4* bb_list_HeadNode4::g_new(){
	bb_list_Node4::g_new2();
	gc_assign(f__succ,(this));
	gc_assign(f__pred,(this));
	return this;
}
void bb_list_HeadNode4::mark(){
	bb_list_Node4::mark();
}
bb_snowflake_Snowflake::bb_snowflake_Snowflake(){
	f_XS=FLOAT(.0);
	f_X=FLOAT(.0);
	f_YS=FLOAT(.0);
	f_Y=FLOAT(.0);
	f_scene=0;
	f_Frame=0;
}
void bb_snowflake_Snowflake::m_Update(){
	f_X+=f_XS;
	f_Y+=f_YS;
	f_XS+=bb_random_Rnd2(FLOAT(-0.5),FLOAT(0.5));
	f_YS+=bb_random_Rnd2(FLOAT(-0.1),FLOAT(0.1));
	if(f_YS<FLOAT(0.0)){
		f_YS=FLOAT(0.0);
	}
	if(f_X>Float(bb_scene_Scene::g_Width+16) || f_Y>Float(bb_scene_Scene::g_Height+16)){
		f_scene->f_Snowflakes->m_Remove(this);
	}
}
bb_snowflake_Snowflake* bb_snowflake_Snowflake::g_new(bb_scene_Scene* t_tS){
	gc_assign(f_scene,t_tS);
	f_Frame=0;
	return this;
}
bb_snowflake_Snowflake* bb_snowflake_Snowflake::g_new2(){
	return this;
}
void bb_snowflake_Snowflake::m_Render(){
	bb_gfx_GFX::g_Draw(int(f_X),int(f_Y),0+f_Frame*16,0,16,16);
}
void bb_snowflake_Snowflake::mark(){
	Object::mark();
	gc_mark_q(f_scene);
}
bb_list_List5::bb_list_List5(){
	f__head=((new bb_list_HeadNode5)->g_new());
}
bb_list_List5* bb_list_List5::g_new(){
	return this;
}
bb_list_Node5* bb_list_List5::m_AddLast5(bb_snowflake_Snowflake* t_data){
	return (new bb_list_Node5)->g_new(f__head,f__head->f__pred,t_data);
}
bb_list_List5* bb_list_List5::g_new2(Array<bb_snowflake_Snowflake* > t_data){
	Array<bb_snowflake_Snowflake* > t_=t_data;
	int t_2=0;
	while(t_2<t_.Length()){
		bb_snowflake_Snowflake* t_t=t_[t_2];
		t_2=t_2+1;
		m_AddLast5(t_t);
	}
	return this;
}
bb_list_Enumerator5* bb_list_List5::m_ObjectEnumerator(){
	return (new bb_list_Enumerator5)->g_new(this);
}
bool bb_list_List5::m_Equals(bb_snowflake_Snowflake* t_lhs,bb_snowflake_Snowflake* t_rhs){
	return t_lhs==t_rhs;
}
int bb_list_List5::m_RemoveEach(bb_snowflake_Snowflake* t_value){
	bb_list_Node5* t_node=f__head->f__succ;
	while(t_node!=f__head){
		bb_list_Node5* t_succ=t_node->f__succ;
		if(m_Equals(t_node->f__data,t_value)){
			t_node->m_Remove2();
		}
		t_node=t_succ;
	}
	return 0;
}
int bb_list_List5::m_Remove(bb_snowflake_Snowflake* t_value){
	m_RemoveEach(t_value);
	return 0;
}
void bb_list_List5::mark(){
	Object::mark();
	gc_mark_q(f__head);
}
bb_list_Node5::bb_list_Node5(){
	f__succ=0;
	f__pred=0;
	f__data=0;
}
bb_list_Node5* bb_list_Node5::g_new(bb_list_Node5* t_succ,bb_list_Node5* t_pred,bb_snowflake_Snowflake* t_data){
	gc_assign(f__succ,t_succ);
	gc_assign(f__pred,t_pred);
	gc_assign(f__succ->f__pred,this);
	gc_assign(f__pred->f__succ,this);
	gc_assign(f__data,t_data);
	return this;
}
bb_list_Node5* bb_list_Node5::g_new2(){
	return this;
}
int bb_list_Node5::m_Remove2(){
	gc_assign(f__succ->f__pred,f__pred);
	gc_assign(f__pred->f__succ,f__succ);
	return 0;
}
void bb_list_Node5::mark(){
	Object::mark();
	gc_mark_q(f__succ);
	gc_mark_q(f__pred);
	gc_mark_q(f__data);
}
bb_list_HeadNode5::bb_list_HeadNode5(){
}
bb_list_HeadNode5* bb_list_HeadNode5::g_new(){
	bb_list_Node5::g_new2();
	gc_assign(f__succ,(this));
	gc_assign(f__pred,(this));
	return this;
}
void bb_list_HeadNode5::mark(){
	bb_list_Node5::mark();
}
bb_moon_Moon::bb_moon_Moon(){
	f_scene=0;
	f_X=FLOAT(.0);
	f_Y=FLOAT(.0);
	f_Frame=FLOAT(.0);
}
bb_moon_Moon* bb_moon_Moon::g_new(bb_scene_Scene* t_tS){
	gc_assign(f_scene,t_tS);
	return this;
}
bb_moon_Moon* bb_moon_Moon::g_new2(){
	return this;
}
void bb_moon_Moon::m_Set(Float t_tX,Float t_tY,int t_tF){
	f_X=t_tX;
	f_Y=t_tY;
	f_Frame=Float(t_tF);
}
void bb_moon_Moon::m_Render(){
	bb_gfx_GFX::g_Draw(int(f_X),int(f_Y),int(FLOAT(0.0)+f_Frame*FLOAT(32.0)),0,32,32);
}
void bb_moon_Moon::mark(){
	Object::mark();
	gc_mark_q(f_scene);
}
Float bb_random_Rnd(){
	bb_random_Seed=bb_random_Seed*1664525+1013904223|0;
	return Float(bb_random_Seed>>8&16777215)/FLOAT(16777216.0);
}
Float bb_random_Rnd2(Float t_low,Float t_high){
	return bb_random_Rnd3(t_high-t_low)+t_low;
}
Float bb_random_Rnd3(Float t_range){
	return bb_random_Rnd()*t_range;
}
bb_scene_Scene* bb_scene_GenerateScene(){
	bb_scene_Scene* t_tS=(new bb_scene_Scene)->g_new();
	Float t_sY=bb_random_Rnd2(Float(bb_scene_Scene::g_Height)*FLOAT(0.66),Float(bb_scene_Scene::g_Height)*FLOAT(0.9));
	Float t_fY=t_sY;
	Float t_maxFlux=bb_random_Rnd2(FLOAT(5.0),FLOAT(10.0));
	for(int t_i=0;t_i<t_tS->f_FloorSegmentCount;t_i=t_i+1){
		int t_fX=t_i*bb_floorsegment_FloorSegment::g_Width;
		t_tS->f_FloorSegments[t_i]->m_SetPos(t_fX,int(t_fY));
		t_fY=t_sY+(Float)sin((Float(t_fX))*D2R)*t_maxFlux;
	}
	t_tS->f_moon->m_Set(bb_random_Rnd2(FLOAT(-32.0),Float(bb_scene_Scene::g_Width-32)),bb_random_Rnd2(FLOAT(-32.0),Float(bb_scene_Scene::g_Height)*FLOAT(0.33)),int(bb_random_Rnd2(FLOAT(0.0),FLOAT(6.0))));
	return t_tS;
}
bb_list_Enumerator::bb_list_Enumerator(){
	f__list=0;
	f__curr=0;
}
bb_list_Enumerator* bb_list_Enumerator::g_new(bb_list_List* t_list){
	gc_assign(f__list,t_list);
	gc_assign(f__curr,t_list->f__head->f__succ);
	return this;
}
bb_list_Enumerator* bb_list_Enumerator::g_new2(){
	return this;
}
bool bb_list_Enumerator::m_HasNext(){
	while(f__curr->f__succ->f__pred!=f__curr){
		gc_assign(f__curr,f__curr->f__succ);
	}
	return f__curr!=f__list->f__head;
}
bb_tree_Tree* bb_list_Enumerator::m_NextObject(){
	bb_tree_Tree* t_data=f__curr->f__data;
	gc_assign(f__curr,f__curr->f__succ);
	return t_data;
}
void bb_list_Enumerator::mark(){
	Object::mark();
	gc_mark_q(f__list);
	gc_mark_q(f__curr);
}
bb_list_Enumerator2::bb_list_Enumerator2(){
	f__list=0;
	f__curr=0;
}
bb_list_Enumerator2* bb_list_Enumerator2::g_new(bb_list_List2* t_list){
	gc_assign(f__list,t_list);
	gc_assign(f__curr,t_list->f__head->f__succ);
	return this;
}
bb_list_Enumerator2* bb_list_Enumerator2::g_new2(){
	return this;
}
bool bb_list_Enumerator2::m_HasNext(){
	while(f__curr->f__succ->f__pred!=f__curr){
		gc_assign(f__curr,f__curr->f__succ);
	}
	return f__curr!=f__list->f__head;
}
bb_house_House* bb_list_Enumerator2::m_NextObject(){
	bb_house_House* t_data=f__curr->f__data;
	gc_assign(f__curr,f__curr->f__succ);
	return t_data;
}
void bb_list_Enumerator2::mark(){
	Object::mark();
	gc_mark_q(f__list);
	gc_mark_q(f__curr);
}
bb_list_Enumerator3::bb_list_Enumerator3(){
	f__list=0;
	f__curr=0;
}
bb_list_Enumerator3* bb_list_Enumerator3::g_new(bb_list_List3* t_list){
	gc_assign(f__list,t_list);
	gc_assign(f__curr,t_list->f__head->f__succ);
	return this;
}
bb_list_Enumerator3* bb_list_Enumerator3::g_new2(){
	return this;
}
bool bb_list_Enumerator3::m_HasNext(){
	while(f__curr->f__succ->f__pred!=f__curr){
		gc_assign(f__curr,f__curr->f__succ);
	}
	return f__curr!=f__list->f__head;
}
bb_star_Star* bb_list_Enumerator3::m_NextObject(){
	bb_star_Star* t_data=f__curr->f__data;
	gc_assign(f__curr,f__curr->f__succ);
	return t_data;
}
void bb_list_Enumerator3::mark(){
	Object::mark();
	gc_mark_q(f__list);
	gc_mark_q(f__curr);
}
bb_list_Enumerator4::bb_list_Enumerator4(){
	f__list=0;
	f__curr=0;
}
bb_list_Enumerator4* bb_list_Enumerator4::g_new(bb_list_List4* t_list){
	gc_assign(f__list,t_list);
	gc_assign(f__curr,t_list->f__head->f__succ);
	return this;
}
bb_list_Enumerator4* bb_list_Enumerator4::g_new2(){
	return this;
}
bool bb_list_Enumerator4::m_HasNext(){
	while(f__curr->f__succ->f__pred!=f__curr){
		gc_assign(f__curr,f__curr->f__succ);
	}
	return f__curr!=f__list->f__head;
}
bb_snowman_Snowman* bb_list_Enumerator4::m_NextObject(){
	bb_snowman_Snowman* t_data=f__curr->f__data;
	gc_assign(f__curr,f__curr->f__succ);
	return t_data;
}
void bb_list_Enumerator4::mark(){
	Object::mark();
	gc_mark_q(f__list);
	gc_mark_q(f__curr);
}
bb_list_Enumerator5::bb_list_Enumerator5(){
	f__list=0;
	f__curr=0;
}
bb_list_Enumerator5* bb_list_Enumerator5::g_new(bb_list_List5* t_list){
	gc_assign(f__list,t_list);
	gc_assign(f__curr,t_list->f__head->f__succ);
	return this;
}
bb_list_Enumerator5* bb_list_Enumerator5::g_new2(){
	return this;
}
bool bb_list_Enumerator5::m_HasNext(){
	while(f__curr->f__succ->f__pred!=f__curr){
		gc_assign(f__curr,f__curr->f__succ);
	}
	return f__curr!=f__list->f__head;
}
bb_snowflake_Snowflake* bb_list_Enumerator5::m_NextObject(){
	bb_snowflake_Snowflake* t_data=f__curr->f__data;
	gc_assign(f__curr,f__curr->f__succ);
	return t_data;
}
void bb_list_Enumerator5::mark(){
	Object::mark();
	gc_mark_q(f__list);
	gc_mark_q(f__curr);
}
int bb_math_Max(int t_x,int t_y){
	if(t_x>t_y){
		return t_x;
	}
	return t_y;
}
Float bb_math_Max2(Float t_x,Float t_y){
	if(t_x>t_y){
		return t_x;
	}
	return t_y;
}
int bb_math_Min(int t_x,int t_y){
	if(t_x<t_y){
		return t_x;
	}
	return t_y;
}
Float bb_math_Min2(Float t_x,Float t_y){
	if(t_x<t_y){
		return t_x;
	}
	return t_y;
}
int bb_graphics_Cls(Float t_r,Float t_g,Float t_b){
	bb_graphics_renderDevice->Cls(t_r,t_g,t_b);
	return 0;
}
int bb_graphics_Transform(Float t_ix,Float t_iy,Float t_jx,Float t_jy,Float t_tx,Float t_ty){
	Float t_ix2=t_ix*bb_graphics_context->f_ix+t_iy*bb_graphics_context->f_jx;
	Float t_iy2=t_ix*bb_graphics_context->f_iy+t_iy*bb_graphics_context->f_jy;
	Float t_jx2=t_jx*bb_graphics_context->f_ix+t_jy*bb_graphics_context->f_jx;
	Float t_jy2=t_jx*bb_graphics_context->f_iy+t_jy*bb_graphics_context->f_jy;
	Float t_tx2=t_tx*bb_graphics_context->f_ix+t_ty*bb_graphics_context->f_jx+bb_graphics_context->f_tx;
	Float t_ty2=t_tx*bb_graphics_context->f_iy+t_ty*bb_graphics_context->f_jy+bb_graphics_context->f_ty;
	bb_graphics_SetMatrix(t_ix2,t_iy2,t_jx2,t_jy2,t_tx2,t_ty2);
	return 0;
}
int bb_graphics_Transform2(Array<Float > t_m){
	bb_graphics_Transform(t_m[0],t_m[1],t_m[2],t_m[3],t_m[4],t_m[5]);
	return 0;
}
int bb_graphics_Scale(Float t_x,Float t_y){
	bb_graphics_Transform(t_x,FLOAT(0.0),FLOAT(0.0),t_y,FLOAT(0.0),FLOAT(0.0));
	return 0;
}
int bb_graphics_Translate(Float t_x,Float t_y){
	bb_graphics_Transform(FLOAT(1.0),FLOAT(0.0),FLOAT(0.0),FLOAT(1.0),t_x,t_y);
	return 0;
}
int bb_autofit_UpdateVirtualDisplay(bool t_zoomborders,bool t_keepborders){
	bb_autofit_VirtualDisplay::g_Display->m_UpdateVirtualDisplay(t_zoomborders,t_keepborders);
	return 0;
}
int bb_graphics_PushMatrix(){
	int t_sp=bb_graphics_context->f_matrixSp;
	bb_graphics_context->f_matrixStack[t_sp+0]=bb_graphics_context->f_ix;
	bb_graphics_context->f_matrixStack[t_sp+1]=bb_graphics_context->f_iy;
	bb_graphics_context->f_matrixStack[t_sp+2]=bb_graphics_context->f_jx;
	bb_graphics_context->f_matrixStack[t_sp+3]=bb_graphics_context->f_jy;
	bb_graphics_context->f_matrixStack[t_sp+4]=bb_graphics_context->f_tx;
	bb_graphics_context->f_matrixStack[t_sp+5]=bb_graphics_context->f_ty;
	bb_graphics_context->f_matrixSp=t_sp+6;
	return 0;
}
int bb_graphics_PopMatrix(){
	int t_sp=bb_graphics_context->f_matrixSp-6;
	bb_graphics_SetMatrix(bb_graphics_context->f_matrixStack[t_sp+0],bb_graphics_context->f_matrixStack[t_sp+1],bb_graphics_context->f_matrixStack[t_sp+2],bb_graphics_context->f_matrixStack[t_sp+3],bb_graphics_context->f_matrixStack[t_sp+4],bb_graphics_context->f_matrixStack[t_sp+5]);
	bb_graphics_context->f_matrixSp=t_sp;
	return 0;
}
int bb_graphics_DrawImage(bb_graphics_Image* t_image,Float t_x,Float t_y,int t_frame){
	bb_graphics_Frame* t_f=t_image->f_frames[t_frame];
	if((bb_graphics_context->f_tformed)!=0){
		bb_graphics_PushMatrix();
		bb_graphics_Translate(t_x-t_image->f_tx,t_y-t_image->f_ty);
		bb_graphics_context->m_Validate();
		if((t_image->f_flags&65536)!=0){
			bb_graphics_renderDevice->DrawSurface(t_image->f_surface,FLOAT(0.0),FLOAT(0.0));
		}else{
			bb_graphics_renderDevice->DrawSurface2(t_image->f_surface,FLOAT(0.0),FLOAT(0.0),t_f->f_x,t_f->f_y,t_image->f_width,t_image->f_height);
		}
		bb_graphics_PopMatrix();
	}else{
		bb_graphics_context->m_Validate();
		if((t_image->f_flags&65536)!=0){
			bb_graphics_renderDevice->DrawSurface(t_image->f_surface,t_x-t_image->f_tx,t_y-t_image->f_ty);
		}else{
			bb_graphics_renderDevice->DrawSurface2(t_image->f_surface,t_x-t_image->f_tx,t_y-t_image->f_ty,t_f->f_x,t_f->f_y,t_image->f_width,t_image->f_height);
		}
	}
	return 0;
}
int bb_graphics_Rotate(Float t_angle){
	bb_graphics_Transform((Float)cos((t_angle)*D2R),-(Float)sin((t_angle)*D2R),(Float)sin((t_angle)*D2R),(Float)cos((t_angle)*D2R),FLOAT(0.0),FLOAT(0.0));
	return 0;
}
int bb_graphics_DrawImage2(bb_graphics_Image* t_image,Float t_x,Float t_y,Float t_rotation,Float t_scaleX,Float t_scaleY,int t_frame){
	bb_graphics_Frame* t_f=t_image->f_frames[t_frame];
	bb_graphics_PushMatrix();
	bb_graphics_Translate(t_x,t_y);
	bb_graphics_Rotate(t_rotation);
	bb_graphics_Scale(t_scaleX,t_scaleY);
	bb_graphics_Translate(-t_image->f_tx,-t_image->f_ty);
	bb_graphics_context->m_Validate();
	if((t_image->f_flags&65536)!=0){
		bb_graphics_renderDevice->DrawSurface(t_image->f_surface,FLOAT(0.0),FLOAT(0.0));
	}else{
		bb_graphics_renderDevice->DrawSurface2(t_image->f_surface,FLOAT(0.0),FLOAT(0.0),t_f->f_x,t_f->f_y,t_image->f_width,t_image->f_height);
	}
	bb_graphics_PopMatrix();
	return 0;
}
int bb_graphics_DrawImageRect(bb_graphics_Image* t_image,Float t_x,Float t_y,int t_srcX,int t_srcY,int t_srcWidth,int t_srcHeight,int t_frame){
	bb_graphics_Frame* t_f=t_image->f_frames[t_frame];
	if((bb_graphics_context->f_tformed)!=0){
		bb_graphics_PushMatrix();
		bb_graphics_Translate(-t_image->f_tx+t_x,-t_image->f_ty+t_y);
		bb_graphics_context->m_Validate();
		bb_graphics_renderDevice->DrawSurface2(t_image->f_surface,FLOAT(0.0),FLOAT(0.0),t_srcX+t_f->f_x,t_srcY+t_f->f_y,t_srcWidth,t_srcHeight);
		bb_graphics_PopMatrix();
	}else{
		bb_graphics_context->m_Validate();
		bb_graphics_renderDevice->DrawSurface2(t_image->f_surface,-t_image->f_tx+t_x,-t_image->f_ty+t_y,t_srcX+t_f->f_x,t_srcY+t_f->f_y,t_srcWidth,t_srcHeight);
	}
	return 0;
}
int bb_graphics_DrawImageRect2(bb_graphics_Image* t_image,Float t_x,Float t_y,int t_srcX,int t_srcY,int t_srcWidth,int t_srcHeight,Float t_rotation,Float t_scaleX,Float t_scaleY,int t_frame){
	bb_graphics_Frame* t_f=t_image->f_frames[t_frame];
	bb_graphics_PushMatrix();
	bb_graphics_Translate(t_x,t_y);
	bb_graphics_Rotate(t_rotation);
	bb_graphics_Scale(t_scaleX,t_scaleY);
	bb_graphics_Translate(-t_image->f_tx,-t_image->f_ty);
	bb_graphics_context->m_Validate();
	bb_graphics_renderDevice->DrawSurface2(t_image->f_surface,FLOAT(0.0),FLOAT(0.0),t_srcX+t_f->f_x,t_srcY+t_f->f_y,t_srcWidth,t_srcHeight);
	bb_graphics_PopMatrix();
	return 0;
}
int bbInit(){
	bb_graphics_device=0;
	bb_input_device=0;
	bb_audio_device=0;
	bb_app_device=0;
	bb_graphics_context=(new bb_graphics_GraphicsContext)->g_new();
	bb_graphics_Image::g_DefaultFlags=0;
	bb_graphics_renderDevice=0;
	bb_random_Seed=1234;
	bb_gfx_GFX::g_Tileset=0;
	bb_scene_Scene::g_Background=0;
	bb_sfx_SFX::g_ActiveChannel=0;
	bb_sfx_SFX::g_Sounds=0;
	bb_sfx_SFX::g_Musics=0;
	bb_autofit_VirtualDisplay::g_Display=0;
	bb_scene_Scene::g_Width=360;
	bb_floorsegment_FloorSegment::g_Width=8;
	bb_scene_Scene::g_Height=240;
	return 0;
}
void gc_mark(){
	gc_mark_q(bb_graphics_device);
	gc_mark_q(bb_input_device);
	gc_mark_q(bb_audio_device);
	gc_mark_q(bb_app_device);
	gc_mark_q(bb_graphics_context);
	gc_mark_q(bb_graphics_renderDevice);
	gc_mark_q(bb_gfx_GFX::g_Tileset);
	gc_mark_q(bb_scene_Scene::g_Background);
	gc_mark_q(bb_sfx_SFX::g_Sounds);
	gc_mark_q(bb_sfx_SFX::g_Musics);
	gc_mark_q(bb_autofit_VirtualDisplay::g_Display);
}
//${TRANSCODE_END}

FILE *fopenFile( String path,String mode ){

	if( !path.StartsWith( "monkey://" ) ){
		path=path;
	}else if( path.StartsWith( "monkey://data/" ) ){
		path=String("./data/")+path.Slice(14);
	}else if( path.StartsWith( "monkey://internal/" ) ){
		path=String("./internal/")+path.Slice(18);
	}else if( path.StartsWith( "monkey://external/" ) ){
		path=String("./external/")+path.Slice(18);
	}else{
		return 0;
	}

#if _WIN32
	return _wfopen( path.ToCString<wchar_t>(),mode.ToCString<wchar_t>() );
#else
	return fopen( path.ToCString<char>(),mode.ToCString<char>() );
#endif
}

static String extractExt( String path ){
	int i=path.FindLast( "." )+1;
	if( i && path.Find( "/",i )==-1 && path.Find( "\\",i )==-1 ) return path.Slice( i );
	return "";
}

unsigned char *loadImage( String path,int *width,int *height,int *depth ){
	FILE *f=fopenFile( path,"rb" );
	if( !f ) return 0;
	unsigned char *data=stbi_load_from_file( f,width,height,depth,0 );
	fclose( f );
	return data;
}

unsigned char *loadImage( unsigned char *data,int length,int *width,int *height,int *depth ){
	return stbi_load_from_memory( data,length,width,height,depth,0 );
}

void unloadImage( unsigned char *data ){
	stbi_image_free( data );
}

//for reading WAV file...
static const char *readTag( FILE *f ){
	static char buf[8];
	if( fread( buf,4,1,f )!=1 ) return "";
	buf[4]=0;
	return buf;
}

static int readInt( FILE *f ){
	unsigned char buf[4];
	if( fread( buf,4,1,f )!=1 ) return -1;
	return (buf[3]<<24) | (buf[2]<<16) | (buf[1]<<8) | buf[0];
}

static int readShort( FILE *f ){
	unsigned char buf[2];
	if( fread( buf,2,1,f )!=1 ) return -1;
	return (buf[1]<<8) | buf[0];
}

static void skipBytes( int n,FILE *f ){
	char *p=(char*)malloc( n );
	fread( p,n,1,f );
	free(p);
}

static unsigned char *loadSound_wav( String path,int *plength,int *pchannels,int *pformat,int *phertz ){

	if( FILE *f=fopenFile( path,"rb" ) ){
		if( !strcmp( readTag( f ),"RIFF" ) ){
			int len=readInt( f )-8;len=len;
			if( !strcmp( readTag( f ),"WAVE" ) ){
				if( !strcmp( readTag( f ),"fmt " ) ){
					int len2=readInt( f );
					int comp=readShort( f );
					if( comp==1 ){
						int chans=readShort( f );
						int hertz=readInt( f );
						int bytespersec=readInt( f );bytespersec=bytespersec;
						int pad=readShort( f );pad=pad;
						int bits=readShort( f );
						int format=bits/8;
						if( len2>16 ) skipBytes( len2-16,f );
						for(;;){
							const char *p=readTag( f );
							if( feof( f ) ) break;
							int size=readInt( f );
							if( strcmp( p,"data" ) ){
								skipBytes( size,f );
								continue;
							}
							unsigned char *data=(unsigned char*)malloc( size );
							if( fread( data,size,1,f )==1 ){
								*plength=size/(chans*format);
								*pchannels=chans;
								*pformat=format;
								*phertz=hertz;
								fclose( f );
								return data;
							}
							free( data );
						}
					}
				}
			}
		}
		fclose( f );
	}
	return 0;
}

static unsigned char *loadSound_ogg( String path,int *length,int *channels,int *format,int *hertz ){

	FILE *f=fopenFile( path,"rb" );
	if( !f ) return 0;
	
	int error;
	stb_vorbis *v=stb_vorbis_open_file( f,0,&error,0 );
	if( !v ){
		fclose( f );
		return 0;
	}
	
	stb_vorbis_info info=stb_vorbis_get_info( v );
	
	int limit=info.channels*4096;
	int offset=0,data_len=0,total=limit;

	short *data=(short*)malloc( total*sizeof(short) );
	
	for(;;){
		int n=stb_vorbis_get_frame_short_interleaved( v,info.channels,data+offset,total-offset );
		if( !n ) break;
	
		data_len+=n;
		offset+=n*info.channels;
		
		if( offset+limit>total ){
			total*=2;
			data=(short*)realloc( data,total*sizeof(short) );
		}
	}
	
	*length=data_len;
	*channels=info.channels;
	*format=2;
	*hertz=info.sample_rate;
	
	stb_vorbis_close(v);
	fclose( f );

	return (unsigned char*)data;
}

unsigned char *loadSound( String path,int *length,int *channels,int *format,int *hertz ){

	String ext=extractExt( path ).ToLower();
	
	if( ext=="wav" ) return loadSound_wav( path,length,channels,format,hertz );

	if( ext=="ogg" ) return loadSound_ogg( path,length,channels,format,hertz );
	
	return 0;
}

void unloadSound( unsigned char *data ){
	free( data );
}

ALCdevice *alcDevice;

ALCcontext *alcContext;

void warn( const char *p ){
	puts( p );
}

void fail( const char *p ){
	puts( p );
	exit( -1 );
}

int main( int argc,const char *argv[] ){

	if( !glfwInit() ){
		puts( "glfwInit failed" );
		exit( -1 );
	}

	GLFWvidmode desktopMode;
	glfwGetDesktopMode( &desktopMode );
	
	int w=CFG_GLFW_WINDOW_WIDTH;
	if( !w ) w=desktopMode.Width;
	
	int h=CFG_GLFW_WINDOW_HEIGHT;
	if( !h ) h=desktopMode.Height;
	
	glfwOpenWindowHint( GLFW_WINDOW_NO_RESIZE,CFG_GLFW_WINDOW_RESIZABLE ? GL_FALSE : GL_TRUE );
	
	if( !glfwOpenWindow( w,h, 0,0,0,0,CFG_OPENGL_DEPTH_BUFFER_ENABLED ? 32 : 0,0,CFG_GLFW_WINDOW_FULLSCREEN ? GLFW_FULLSCREEN : GLFW_WINDOW  ) ){
		fail( "glfwOpenWindow failed" );
	}

	glfwSetWindowPos( (desktopMode.Width-w)/2,(desktopMode.Height-h)/2 );	

	glfwSetWindowTitle( _STRINGIZE(CFG_GLFW_WINDOW_TITLE) );
	
	if( (alcDevice=alcOpenDevice( 0 )) ){
		if( (alcContext=alcCreateContext( alcDevice,0 )) ){
			if( alcMakeContextCurrent( alcContext ) ){
				//alc all go!
			}else{
				warn( "alcMakeContextCurrent failed" );
			}
		}else{
			warn( "alcCreateContext failed" );
		}
	}else{
		warn( "alcOpenDevice failed" );
	}
	
#if INIT_GL_EXTS
	Init_GL_Exts();
#endif

	try{
	
		bb_std_main( argc,argv );

		if( runner ) runner();
		
	}catch( ThrowableObject *ex ){
	
		Print( "Monkey Runtime Error : Uncaught Monkey Exception" );

	}catch( const char *err ){

	}
	
	if( alcContext ) alcDestroyContext( alcContext );

	if( alcDevice ) alcCloseDevice( alcDevice );

	glfwTerminate();

	return 0;
}
