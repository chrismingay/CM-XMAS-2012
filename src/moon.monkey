Import xmas

Class Moon

	Field X:Float
	Field Y:Float
	Field Frame:Float
	
	Field scene:Scene
	
	Method New(tS:Scene)
		scene = tS
	End
	
	Method Set:Void(tX:Float,tY:Float,tF:Int)
		X = tX
		Y = tY
		Frame = tF
	End
	
	Method Render:Void()
		GFX.Draw(X,Y,0 + (Frame * 32), 208, 32, 32)
	End
	
End
	