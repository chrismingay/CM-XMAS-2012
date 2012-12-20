Import xmas

Class Star

	Const DRAW_X:Int = 0
	Const DRAW_Y:Int = 16
	
	Const WIDTH:Int = 1
	Const HEIGHT:Int = 1

	Field X:Int
	Field Y:Int
	
	Field Frame:Int
	Field alpha:Float
	
	Field scene:Scene
	
	Field changeTimer:Int = 0
	Const CHANGE_TIMER_TARGET:Int = 10
	
	Method New(tS:Scene)
		scene = tS
	End
	
	Method Update:Void()
		changeTimer += 1
		If changeTimer >= CHANGE_TIMER_TARGET
			If Rnd() < 0.25
				Frame = Rnd(0.0,5.0)
			Endif
			changeTimer = 0
		Endif
		
		alpha += Rnd(-0.1,0.1)
		alpha = Clamp(alpha, 0.5, 1.0)
		
	End
	
	Method SetPos(tX:Float,tY:Float)
		X = tX
		Y = tY
	End
	
	Method Render:Void()
		Local tA:Float = alpha
		If Y < Scene.Height * 0.5
			tA = alpha
		Else
			tA = alpha * (1.0 - ( (Y - Scene.Height * 0.5) / (Scene.Height * 0.5))) * 0.75
		EndIf
		SetAlpha(tA)
		GFX.Draw(X,Y,DRAW_X + (Frame * 16), DRAW_Y,WIDTH,HEIGHT)
	End

End

