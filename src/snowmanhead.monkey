Import xmas

Class SnowmanHead

	Const DRAW_X:Int = 0
	Const DRAW_Y:Int = 32

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
	
	Method Update:Void()
	
	End
	
	Method SetPos:Void(tX:Float,tY:Float)
		X = tX
		Y = tY
	End
	
	Method Render:Void()
		GFX.Draw(X,Y,DRAW_X + (Frame * WIDTH),DRAW_Y,WIDTH,HEIGHT)
	End
	
End
	