Import xmas

Class Snowflake

	Const WIDTH:Int = 16
	Const HEIGHT:Int = 16
	
	Field X:Float
	Field Y:Float
	Field XS:Float
	Field YS:Float
	
	Field scene:Scene
	
	Field Frame:Int
	
	Method New(tS:Scene)
		scene = tS
		Frame = 0
	End
	
	Method Update:Void()
	
		X += XS
		Y += YS
		
		XS += Rnd(-0.5,0.5)
		YS += Rnd(-0.1,0.1)
		If YS < 0
			YS = 0
		End
	
		If X > Scene.Width + WIDTH Or Y > Scene.Height + HEIGHT
			scene.Snowflakes.Remove(Self)
		End
			
	End
	
	Method Render:Void()
		GFX.Draw(X,Y,0 + (Frame * WIDTH),0,WIDTH,HEIGHT)
	End
	
End
	