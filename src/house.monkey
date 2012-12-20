Import xmas

Class House

	Field X:Float
	Field Y:Float
	
	
	Const WIDTH:Int = 48
	Const HEIGHT:Int = 64
	
	Field scene:Scene
	
	Field Lights:List<HouseLight>
	
	Method New(tS:Scene)
		scene = tS
	End
	
	Method Update:Void()
	
	End
	
	Method SetPos:Void(tX:Float, tY:Float)
		X = tX
		Y = tY
	End
	
	Method Render:Void()
		GFX.Draw(X, Y, 0, 288, 48, 64)
	End

End

