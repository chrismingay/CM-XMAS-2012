Import xmas

Class HouseDoor

	Const DRAW_X:Int = 0
	Const DRAW_Y:Int = 368
	
	Const WIDTH:Int = 8
	Const HEIGHT:Int = 12

	Field X:Int
	Field Y:Int
	Field Frame:Int
	
	Field house:House
	Field scene:Scene
	
	Method New(tH:House)
		house = tH
		scene = tH.scene
	End
	
	Method SetPos:Void(tX:Int,tY:Int)
		X = tX
		Y = tY
	End
	
	Method Render:Void()
		GFX.Draw(X,Y,DRAW_X + (Frame * WIDTH), DRAW_Y,WIDTH,HEIGHT)
	End
	
End