Import xmas

Class TreeLight

	Const DRAW_X:Int = 0
	Const DRAW_Y:Int = 64
	
	Const FRAME_WIDTH:Int = 16

	Const WIDTH:Int = 3
	Const HEIGHT:Int = 3

	Field X:Float
	Field Y:Float
	
	Field scene:Scene
	Field tree:Tree
	
	Field Bright:Bool
	
	Const FRAME_COUNT:Int = 6
	Field Frame:Int
	
	Method New(tT:Tree)
		tree = tT
		scene = tT.scene
	End
	
	Method Update:Void()
	
	End
	
	Method Render:Void()
		If Bright
			SetAlpha(1.0)
		Else
			SetAlpha(0.2)
		End
		GFX.Draw(X,Y,DRAW_X + (Frame * FRAME_WIDTH),DRAW_Y,WIDTH,HEIGHT)
	End
	
	Method Blink:Void()
		Bright = Not Bright
	End
	
	Method SetPos:Void(tX:Float,tY:Float)
		X = tX
		Y = tY
	End

End

Function GenerateTreeLight:TreeLight(tT:Tree)
	Local tL:TreeLight = New TreeLight(tT)
	tL.Frame = Rnd(0,TreeLight.FRAME_COUNT)
	Return tL
End

