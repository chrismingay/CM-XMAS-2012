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
	
	Local posGood:Bool = False
	
	Local tX:Float
	Local tY:Float
	While posGood = False
		tX = Rnd(0 - 8, tScene.Width - 8)
		tY = tScene.GetFloorYAtX(tX) - 32
		
		posGood = tScene.CheckRectAgainstScene(tX, tY, Tree.WIDTH, Tree.HEIGHT)
	Wend
	
	tT.Frame = Rnd(0.0, Tree.FRAME_COUNT)
	
	tT.SetPos(tX,tY)
	
	tT.BlinkRate = Rnd(3,20)
	
	Local tLC:Int = Rnd(10, 15)
	For Local i:Int = 0 Until tLC
		Local tL:TreeLight = GenerateTreeLight(tT)
		
		Local good:Bool = False
		Local lX:Float
		Local lY:Float
		While good = False
			lX = Rnd(-2, 14)
			lY = Rnd(0, 24)
			
			If lY > 16
				good = True
			Else
				Local dX:Float = Abs(8 - lX)
				
				If dX * 1.5 <= (lY + 1)
					good = True
				EndIf
			EndIf
			
		Wend
		
		tL.SetPos(tX + lX, tY + lY)
		tT.Lights.AddLast(tL)
	Next
	
	Return tT

End

