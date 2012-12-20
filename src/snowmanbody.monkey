Import xmas

Class SnowmanBody

	Const DRAW_X:Int = 0
	Const DRAW_Y:Int = 48

	Const WIDTH:Int = 16
	Const HEIGHT:Int = 16
	
	Const FRAME_COUNT:Int = 4
	
	Field X:Float
	Field Y:Float
	
	Field scene:Scene
	Field snowman:Snowman
	
	Field Frame:Int
	
	Method New(tSnowman:Snowman)
		snowman = tSnowman
		scene = tSnowman.scene
		Frame = 0
	End
	
	Method SetPos:Void(tX:Float,tY:Float)
		X = tX
		Y = tY
	End
	
	Method Update:Void()
	
	End
	
	Method Render:Void()
		GFX.Draw(X,Y,DRAW_X + (Frame * WIDTH),DRAW_Y,WIDTH,HEIGHT)
	End
	
End
	