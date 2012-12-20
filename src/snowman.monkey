Import xmas

Class Snowman

	Field X:Float
	Field Y:Float
	
	Const WIDTH:Int = 16
	Const HEIGHT:Int = 32
	
	Field scene:Scene
	Field head:SnowmanHead
	Field body:SnowmanBody 
	
	Method New(tS:Scene)
		scene = tS
	End
	
	Method Update:Void()
	
	End
	
	Method Render:Void()
		body.Render()
		head.Render()
	End
	
	Method SetPos(tX:Float,tY:Float)
		head.SetPos(tX, tY - 26)
		body.SetPos(tX,tY - 12)
	End

End

Function GenerateSnowman:Snowman(tScene:Scene)
	Local tS:Snowman = New Snowman(tScene)
	tS.head = New SnowmanHead(tS)
	tS.body = New SnowmanBody(tS)
	tS.head.Frame = 0 ' Rnd(0.0,SnowmanHead.FRAME_COUNT)
	tS.body.Frame = 0 ' Rnd(0.0,SnowmanBody.FRAME_COUNT)
	
	Local posGood = False
	Local tX:Float
	Local tY:Float
	While posGood = False
		tX = Rnd(0 - 8, tScene.Width - 8)
		tY = tScene.GetFloorYAtX(tX)
		
		posGood = tScene.CheckRectAgainstScene(tX, tY, Snowman.WIDTH, Snowman.HEIGHT)
	Wend
	
	tS.SetPos(tX,tY)
	
	Return tS
	
End

