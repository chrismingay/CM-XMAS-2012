Import xmas

Class FloorSegment

	Global Width:Int = 8

	Field X:Int
	Field Y:Int
	Field scene:Scene
	
	Method New(tS:Scene)
		scene = tS
	End
	
	Method SetPos:Void(tX:Int,tY:Int)
		X = tX
		Y = tY
	End
	
	Method Render:Void()
		GFX.Draw(X,Y,0,96,Width,100)
	End
	
End