Import xmas

Class Tree

	Const DRAW_X:Int = 16
	Const DRAW_Y:Int = 96
	Const WIDTH:Int = 16
	Const HEIGHT:Int = 32
	
	Const FRAME_COUNT:Int = 2

	Field X:Float
	Field Y:Float
	
	Field Frame:Int
	
	Field scene:Scene
	
	Field Lights:List<TreeLight>
	
	Field BlinkRate:Int
	Field BlinkRateTimer:Int
	
	Method New(tS:Scene)
		scene = tS
		Lights = New List<TreeLight>
	End
	
	Method Update:Void()
		BlinkRateTimer += 1
		If BlinkRateTimer >= BlinkRate
			BlinkRateTimer = 0
			For Local tTL:TreeLight = Eachin Lights
				tTL.Blink()
			Next
		EndIf
	End
	
	Method Render:Void()
		SetAlpha(1.0)
		GFX.Draw(X,Y,DRAW_X + (Frame * WIDTH),DRAW_Y,WIDTH,HEIGHT)
		For Local tTL:TreeLight = Eachin Lights
			tTL.Render()
		Next
	End
	
	Method SetPos:Void(tX:Float,tY:Float)
		X = tX
		Y = tY
	End

End

Function GenerateTree:Tree(tScene:Scene)

	Local tT:Tree = New Tree(tScene)
	
	Local tX:Float = Rnd(0 - 8, tScene.Width - 8)
	Local tY:Float = tScene.GetFloorYAtX(tX) - 32
	
	tT.Frame = Rnd(0.0,Tree.FRAME_COUNT)
	
	tT.SetPos(tX,tY)
	
	tT.BlinkRate = Rnd(3,20)
	
	Local tLC:Int = Rnd(5,10)
	For Local i:Int = 0 Until tLC
		Local tL:TreeLight = GenerateTreeLight(tT)
		tL.SetPos(Rnd(tX + 4,tX+12),Rnd(tY + 8,tY+24))
		tT.Lights.AddLast(tL)
	Next
	
	Return tT

End

